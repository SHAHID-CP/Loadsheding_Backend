import bcrypt from "bcryptjs";
import crypto from "crypto";
import ejs from "ejs";
import type { TokenPayload } from "google-auth-library";
import { StatusCodes } from "http-status-codes";
import type { JwtPayload, SignOptions } from "jsonwebtoken";
import path from "path";
import { AuthProvider, UserStatus } from "../../../../generated/prisma/enums";
import config from "../../config";
import { googleClient } from "../../lib/googleAuth";
import { transporter } from "../../lib/nodemailer";
import { prisma } from "../../lib/prisma";
import { redisClient } from "../../lib/redis";
import { jwtUtils } from "../../utils/jwt";
import { AppError } from "../../utils/sendResponse";
import type { IChangedPasswordPayload, IForgotPasswordPayload, IResetPasswordPayload, IVerifyEmailPayload, LoginInput, RegisterInput } from "./auth.interface";


const issueTokenPair = async (payload : JwtPayload) => {
  const accessToken =jwtUtils.createToken(payload,config.jwt_access_secret,config.jwt_access_expires_in as SignOptions )
  const refreshToken = jwtUtils.createToken(payload,config.jwt_refresh_secret,config.jwt_refresh_expires_in as SignOptions )
  return { accessToken, refreshToken };
};


const registerUser=async(payload:RegisterInput)=>{
    const { name, email, password,phone,address} = payload;
    const isUserExist = await prisma.user.findUnique({
        where: { email }
    })

    if (isUserExist) {
        throw new AppError(StatusCodes.NOT_FOUND,"User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, Number(config.bcrypt_salt_rounds))


  const expirationSeconds = 5 * 60;
	const otpKey = `user-registration-otp:${email}`;
	const otpValue = crypto.randomInt(100000, 1000000).toString();

	await redisClient.set(otpKey, otpValue, {
		expiration: {
			type: "EX",
			value: expirationSeconds,
		},
	});

	const userRegistrationKey = `user-registration-data:${email}`;
	const redisUserDataPayload = {
		email,
		password: hashedPassword,
        customerProfile: {
        name,
        phone,
        address
      },
	};

	await redisClient.set(
		userRegistrationKey,
		JSON.stringify(redisUserDataPayload),
		{
			expiration: {
				type: "EX",
				value: expirationSeconds,
			},
		},
	);
	const tempatePath = path.join(
		process.cwd(),
		"src/app/templates/registration-user-otp.ejs",
	);

	const templateData = {
		name,
		email,
		otp: otpValue,
		expirationMinutes: expirationSeconds / 60,
	};

	const html = await ejs.renderFile(tempatePath, templateData);

	await transporter.sendMail({
		from: config.email_sender,
		to: email,
		subject: "Email Verification",
		html,
	});

}

const verifyUserEmail = async (payload: IVerifyEmailPayload) => {
	const {otp,email} = payload;

	const isUserExist = await prisma.user.findUnique({
		where: { email },
	});

	if (isUserExist?.status === "BANNED") {
		throw new AppError(StatusCodes.FORBIDDEN, "User is Blocked");
	}

	if (isUserExist?.emailVerified) {
		throw new AppError(StatusCodes.CONFLICT, "Email ALready Verified");
	}

	if (isUserExist?.isDeleted || isUserExist?.status === "DELETED") {
		throw new AppError(StatusCodes.FORBIDDEN, "User is Deleted");
	}

	const otpKey = `user-registration-otp:${email}`;
	

	const redisOtp = await redisClient.get(otpKey);

	if (!redisOtp) {
		throw new AppError(StatusCodes.BAD_REQUEST, "Invalid OTP");
	}

	if (redisOtp !== otp) {
		throw new AppError(StatusCodes.BAD_REQUEST, "OTP Does Not Match");
	}

	await redisClient.del(otpKey);

	const userRegistrationKey = `user-registration-data:${email}`;

	const redisUserData = await redisClient.get(userRegistrationKey);

	if (!redisUserData) {
		throw new AppError(StatusCodes.NOT_FOUND, "Patient Doesnt Exist");
	}

	const userPayload= JSON.parse(redisUserData);

	const user = await prisma.user.create({
		data: {
			email: userPayload.email,
			password: userPayload.password,
			emailVerified: true,
			customerProfile: {
				create: {
				name:userPayload.customerProfile.name,
                phone:userPayload.customerProfile.phone,
                address:userPayload.customerProfile.address,
                meterNo:""
				},
			},
		},
		omit: { password: true },
		include: { customerProfile: true },
	});

	await redisClient.del(userRegistrationKey);

	const tempatePath = path.join(
		process.cwd(),
		"src/app/templates/user-welcome-email.ejs",
	);

	const templateData = {
		name: user?.customerProfile?.name,
	};

	const html = await ejs.renderFile(tempatePath, templateData);

	await transporter.sendMail({
		from: config.email_sender,
		to: email,
		subject: "Welcome Loadsheding Management System",
		html,
	});

	  const jwtPayload = { id: user?.id, email: user?.email,role: user?.role}
    const tokens = await issueTokenPair(jwtPayload);

    return { user, ...tokens };
};

const loginUser = async (payload: LoginInput) => {

  const { email, password } = payload;

  const user = await prisma.user.findUnique({ where: { email }});
  
  if (!user) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
  }
  if (user.status === "BANNED" || user.status === "DELETED") {
    throw new AppError(StatusCodes.FORBIDDEN, "Your account has been banned or deleted");
  }
 if (!user.password) {
  throw new AppError(
    StatusCodes.UNAUTHORIZED,
    "This account does not have a password"
  );
}
	if (user.password === null && user.googleId !== null) {
		throw new AppError(
			StatusCodes.BAD_REQUEST,
			"User Already Has Account Registered With Google. Try To Login With Google.",
		);
	}

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
    }

    const jwtPayload = { id: user?.id, email: user?.email,role: user?.role}
    const tokens = await issueTokenPair(jwtPayload);
    const { password: _, ...safeUser } = user;

  return { user: safeUser, ...tokens };
};


const googleLoginUser = async (idToken: string) => {
	let googleIdTokenPayload: TokenPayload | null | undefined = null;
	try {
		const ticket = await googleClient.verifyIdToken({
			idToken: idToken,
			audience: config.google_client_id,
		});

		googleIdTokenPayload = ticket.getPayload();
	} catch (error) {
		console.log("Google ID Token Verification Failed", error);
		throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid Or Expired Google Id Token");
	}

	if (!googleIdTokenPayload) {
		throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid Or Expired Google Id Token");
	}

	if (!googleIdTokenPayload.email) {
		throw new AppError(StatusCodes.BAD_REQUEST, "Google Email Not Found");
	}
	if (!googleIdTokenPayload.name) {
		throw new AppError(StatusCodes.BAD_REQUEST, "Google Email User Name Not Found");
	}

	const ifUserExistWithGoogleAuth = await prisma.user.findUnique({
		where: {
			email: googleIdTokenPayload.email,
			googleId: googleIdTokenPayload.sub,
		},
	});

	let user = ifUserExistWithGoogleAuth;

	if (!ifUserExistWithGoogleAuth) {
		const ifUserExistWithCredentials = await prisma.user.findUnique({
			where: {
				email: googleIdTokenPayload.email,
				authProvider: AuthProvider.CREDENTIAL,
			},
		});

		if (ifUserExistWithCredentials) {
			if (!ifUserExistWithCredentials.emailVerified) {
				throw new AppError(StatusCodes.FORBIDDEN, "Email Not Verified");
			}

			if (ifUserExistWithCredentials.status === UserStatus.BANNED) {
				throw new AppError(StatusCodes.FORBIDDEN, "User Is Banned");
			}

			if (
				ifUserExistWithCredentials.isDeleted ||
				ifUserExistWithCredentials.status === UserStatus.DELETED
			) {
				throw new AppError(StatusCodes.FORBIDDEN, "User Is Deleted");
			}

			user = await prisma.user.update({
				where: {
					id: ifUserExistWithCredentials.id,
				},

				data: {
					googleId: googleIdTokenPayload.sub,
				},
			});
		} else {
			// Google Register
			user = await prisma.user.create({
				data: {
					email: googleIdTokenPayload.email,
					googleId: googleIdTokenPayload.sub,
					authProvider: AuthProvider.GOOGLE,
					emailVerified: true,
					needPasswordChange:true,
					customerProfile: {
						create: {
							name: googleIdTokenPayload.name,
                            phone: "", 
                            address: "",
                            meterNo:"",
                            imageUrl: googleIdTokenPayload.picture || ""
						},
					},
				},
                include: { customerProfile: true },
			});




			const tempatePath = path.join(
				process.cwd(),
				"src/app/templates/user-welcome-email.ejs",
			);

			const templateData = {
				name:googleIdTokenPayload.name
			};

			const html = await ejs.renderFile(tempatePath, templateData);

			await transporter.sendMail({
				from: config.email_sender,
				to: user.email,
				subject: "Welcome To Loadsheding Management System",
				html,
			});
		}
	}

	if (!user) {
		throw new AppError(StatusCodes.NOT_FOUND, "User Not Found");
	}

	if (user.status === UserStatus.BANNED) {
		throw new AppError(StatusCodes.FORBIDDEN, "User Is Banned");
	}

	if (user.isDeleted || user.status === UserStatus.DELETED) {
		throw new AppError(StatusCodes.FORBIDDEN, "User Is Deleted");
	}

	  const jwtPayload = { id: user?.id, email: user?.email,role: user?.role}
    const tokens = await issueTokenPair(jwtPayload);

  const { password: _, ...safeUser } = user;
  return { user: safeUser, ...tokens };
};

const refreshToken = async (refreshToken: string) => {
    const verifiedRefreshToken = jwtUtils.verifyToken(refreshToken, config.jwt_refresh_secret);
    if(!verifiedRefreshToken.success){
        throw new AppError(StatusCodes.BAD_REQUEST,verifiedRefreshToken.error)
    }

    const {id} = verifiedRefreshToken.data as JwtPayload;

    const user = await prisma.user.findUnique({
  where: { id },
  select: {id: true,email: true,role: true,status: true,
            customerProfile: {select: {name: true},},
  },
});
    if (!user || user.status === "BANNED" || user.status === "DELETED") {
        throw new AppError(StatusCodes.UNAUTHORIZED, "Account is no longer accessible");
    }

    const jwtPayload = { id: user?.id, name: user?.customerProfile?.name, email: user?.email,role: user?.role}
    const tokens = await issueTokenPair(jwtPayload);

    return {...tokens};
};


const forgotPassword = async (payload: IForgotPasswordPayload) => {
	const { email } = payload;

	const isUserExist = await prisma.user.findUnique({
		where: {
			email,
		},
		include:{
			customerProfile:true,
		}
	});

	if (!isUserExist) {
		throw new AppError(StatusCodes.NOT_FOUND, "User Does Not Exist!");
	}

	if (isUserExist.status === "BANNED") {
		throw new AppError(StatusCodes.FORBIDDEN, "User is Banned");
	}

	if (!isUserExist.emailVerified) {
		throw new AppError(StatusCodes.FORBIDDEN, "User Not Verified");
	}

	if (isUserExist.isDeleted || isUserExist.status === "DELETED") {
		throw new AppError(StatusCodes.FORBIDDEN, "User is Deleted");
	}

	if (isUserExist.googleId && isUserExist.authProvider === "GOOGLE") {
		throw new AppError(StatusCodes.BAD_REQUEST, "User Has Account With Google");
	}

	const otp = crypto.randomInt(100000, 1000000).toString();

	const key = `forgor-password-otp:${isUserExist.email}`;

	const expirationSeconds = 5 * 60;

	await redisClient.set(key, otp, {
		expiration: {
			type: "EX",
			value: expirationSeconds,
		},
	});

	const tempatePath = path.join(
		process.cwd(),
		"src/app/templates/forgot-password.ejs",
	);

	const templateData = {
		name: isUserExist?.customerProfile?.name,
		otp,
		expirationMinutes: expirationSeconds / 60,
	};

	const html = await ejs.renderFile(tempatePath, templateData);

	await transporter.sendMail({
		from: config.email_sender,
		to: isUserExist.email,
		subject: "Forgot Password",
		html,
	});
};

const resetPassword = async (payload: IResetPasswordPayload) => {
	const { email, otp, newPassword } = payload;

	const isUserExist = await prisma.user.findUnique({
		where: {
			email,
		},
		include:{customerProfile:true}
	});

	if (!isUserExist) {
		throw new AppError(StatusCodes.NOT_FOUND, "User Does Not Exist!");
	}

	if (isUserExist.status === "BANNED") {
		throw new AppError(StatusCodes.FORBIDDEN, "User is Banned");
	}

	if (!isUserExist.emailVerified) {
		throw new AppError(StatusCodes.FORBIDDEN, "User Not Verified");
	}

	if (isUserExist.isDeleted || isUserExist.status === "DELETED") {
		throw new AppError(StatusCodes.FORBIDDEN, "User is Deleted");
	}

	if (isUserExist.googleId && isUserExist.authProvider === "GOOGLE") {
		throw new AppError(StatusCodes.BAD_REQUEST, "User Has Account With Google");
	}

	const key = `forgor-password-otp:${isUserExist.email}`;

	const redisOtp = await redisClient.get(key);

	if (!redisOtp) {
		throw new AppError(StatusCodes.BAD_REQUEST, "Invalid OTP");
	}

	if (redisOtp !== otp) {
		throw new AppError(StatusCodes.BAD_REQUEST, "OTP Does Not Match");
	}

	const hashedNewPassword = await bcrypt.hash(
		newPassword,
		Number(config.bcrypt_salt_rounds),
	);

	await prisma.user.update({
		where: {
			email: isUserExist.email,
		},
		data: {
			password: hashedNewPassword,
		},
	});

	await redisClient.del([key]);

	const tempatePath = path.join(
		process.cwd(),
		"src/app/templates/reset-password-success.ejs",
	);

	const templateData = {
		name: isUserExist?.customerProfile?.name,
	};

	const html = await ejs.renderFile(tempatePath, templateData);

	await transporter.sendMail({
		from: config.email_sender,
		to: isUserExist.email,
		subject: "Password Changed",
		html,
	});
};


const changedPassword = async (payload: IChangedPasswordPayload) => {
	const { oldPassword,newPassword,email } = payload;

	const user = await prisma.user.findUnique({
		where: {
			email,
		},
		include:{customerProfile:true}
	});

	if (!user) {
		throw new AppError(StatusCodes.NOT_FOUND, "User Does Not Exist!");
	}

	if (user.status === "BANNED") {
		throw new AppError(StatusCodes.FORBIDDEN, "User is Banned");
	}

	if (!user.emailVerified) {
		throw new AppError(StatusCodes.FORBIDDEN, "User Not Verified");
	}

	if (user.isDeleted || user.status === "DELETED") {
		throw new AppError(StatusCodes.FORBIDDEN, "User is Deleted");
	}

	if (user.googleId && user.authProvider === "GOOGLE") {
		throw new AppError(StatusCodes.BAD_REQUEST, "User Has Account With Google");
	}

    const isMatch = await bcrypt.compare(oldPassword, user.password || '');
    if (!isMatch) {
		throw new AppError(StatusCodes.BAD_REQUEST, "Incorrect old password");
    }

	const hashedNewPassword = await bcrypt.hash(
		newPassword,
		Number(config.bcrypt_salt_rounds),
	);

	await prisma.user.update({
		where: {
			email: user.email,
		},
		data: {
			password: hashedNewPassword,
			needPasswordChange: false
		},
	});


	const tempatePath = path.join(
		process.cwd(),
		"src/app/templates/changed-password-success.ejs",
	);

	const templateData = {
		name: user?.customerProfile?.name,
	};

	const html = await ejs.renderFile(tempatePath, templateData);

	await transporter.sendMail({
		from: config.email_sender,
		to: user.email,
		subject: "Password Changed",
		html,
	});
};



export const authService={
    registerUser,
    verifyUserEmail,
    loginUser,
    googleLoginUser,
	refreshToken,
	resetPassword,
	forgotPassword,
	changedPassword
}
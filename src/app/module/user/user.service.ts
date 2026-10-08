import type { UploadApiResponse } from "cloudinary";
import { StatusCodes } from "http-status-codes";
import { Role } from "../../../../generated/prisma/enums";
import { cloudinary } from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/sendResponse";
import type { IUpdateMeterPayload, IUserUpdate } from "./user.interface";

const uploadProfileImage = async (buffer: Buffer, userId: string) => {

const currentUser = await prisma.user.findUnique({
  where: {
    id: userId,
  },
  include: {
    customerProfile: {
      select: {
        imagePublicId: true,
        imageUrl: true,
      },
    },
  },
});

	const cloudinaryResult = await new Promise<UploadApiResponse>(
		(resolve, reject) => {
			cloudinary.uploader
				.upload_stream(
					{
						resource_type: "auto",
					},

					async (error, result) => {
						if (error) {
							return reject(error);
						}

						if (!result) {
							return reject(new Error("No result returned from Cloudinary"));
						}

						resolve(result);
					},
				)
				.end(buffer);
		},
	);

	const updatedUser = await prisma.customerProfile.update({
		where: {
			userId,
		},

		data: {
			imageUrl: cloudinaryResult.secure_url,
			imagePublicId: cloudinaryResult.public_id,
		},  
		select: {
                imageUrl: true,
        },
	});

	if (currentUser?.customerProfile?.imagePublicId && currentUser.customerProfile.imageUrl) {
		await cloudinary.uploader.destroy(currentUser.customerProfile.imagePublicId);
	}

	return updatedUser;
};


const getMyProfile = async (payload: string,role:Role) => {
  
  const id  = payload;
  if(role===Role.CUSTOMER){
  const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        customerProfile: true, // Fetch related profile
      },
    });

    if (!user) {
	  throw new AppError(StatusCodes.NOT_FOUND,"Customer Profile not fond")
    }
  return user;
  }else if(role===Role.TECHNICIAN){
	const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        customerProfile: {
			select:{
				id:true,
				name:true,
				phone:true,
				address:true,
				imageUrl:true,
				imagePublicId:true
			}
		}
      },
    });

    if (!user) {
	  throw new AppError(StatusCodes.NOT_FOUND,"Technecian Profile not fond")
    }

  const { customerProfile, ...userData } = user;
  return {
    ...userData,
    technicianProfile: customerProfile,
  };
  }
  
};

const updateProfile = async (payload:IUserUpdate,id:string,role:Role) => {

	if(role===Role.CUSTOMER){
    const user = await prisma.customerProfile.update({
      where: {userId: id },
      data: payload,
    });

    if (!user) {
	  throw new AppError(StatusCodes.NOT_FOUND,"User Profile not fond")
    }
	return user;
	}else if(role===Role.TECHNICIAN){
    const user = await prisma.customerProfile.update({
      where: {userId: id },
	  select:{
				id:true,
				name:true,
				phone:true,
				address:true,
				imageUrl:true,
				imagePublicId:true
	  },
      data: payload,
    });

    if (!user) {
	  throw new AppError(StatusCodes.NOT_FOUND,"User Profile not fond")
    }
	return user;
	}
  
};

const updateMeter = async (payload:IUpdateMeterPayload,id:string) => {

	const profile = await prisma.customerProfile.findUnique({
    where: {
      userId: id,
    },
    select: {
      meterNo: true,
    },
  });

  if (!profile) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Customer profile not found",
    );
  }

  if (profile.meterNo) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Meter number has already been set and cannot be changed",
    );
  }

    const user = await prisma.customerProfile.update({
      where: {userId: id },
      data: payload
    });

    if (!user) {
	  throw new AppError(StatusCodes.NOT_FOUND,"User Profile not fond")
    }
	return user;
	
  
};

export const UserServices = {
	uploadProfileImage,
	updateProfile,
	getMyProfile,
	updateMeter
};

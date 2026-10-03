import { Router } from "express";
import { Role } from "../../../../generated/prisma/enums";
import { auth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { authController } from "./auth.controller";
import { ChangedPasswordSchema, ForgotPasswordSchema, loginSchema, registerSchema, ResetPasswordSchema, userEmailVerifySchema } from "./auth.validation";



const router =Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);

router.post('/verify-email', validate(userEmailVerifySchema),authController.verifyUserEmail);
router.post('/google-login', authController.googleLogin);


router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);

router.post("/forgot-password",validate(ForgotPasswordSchema) ,authController.forgotPassword);
router.post("/reset-password",validate(ResetPasswordSchema) ,authController.resetPassword);
router.post("/change-password",validate(ChangedPasswordSchema),auth(Role.CUSTOMER,Role.TECHNICIAN) ,authController.changedPassword);

// router.get("/me",
// auth(Role.ADMIN, Role.LANDLORD, Role.TENANT),
// authController.getMyProfile)
// router.patch(
//   "/me",validate(updateProfileSchema),
//   auth(Role.ADMIN, Role.LANDLORD, Role.TENANT),
//   authController.updateMyProfile
// );

export const authRoutes=router;



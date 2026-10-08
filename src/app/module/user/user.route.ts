import { Router } from "express";
import { Role } from "../../../../generated/prisma/enums";
import { upload } from "../../lib/multer";
import { auth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { UserController } from "./user.controller";
import { updateCustomerProfileSchema, updateMeterSchema } from "./user.validation";

const router = Router();



router.get('/me',auth(Role.CUSTOMER, Role.TECHNICIAN), UserController.getMyProfile);
router.patch('/update', validate(updateCustomerProfileSchema),auth(Role.CUSTOMER, Role.TECHNICIAN), UserController.updateProfile);

router.patch('/meter-update',validate(updateMeterSchema),auth(Role.CUSTOMER), UserController.updateMeter);
router.patch("/profile-image",auth( Role.CUSTOMER, Role.TECHNICIAN),
	        upload.single("profileImage"),UserController.uploadProfileImage,
);

export const userRoutes = router;

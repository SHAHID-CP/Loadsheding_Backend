import { Router } from "express";
import { Role } from "../../../../generated/prisma/enums";
import { auth } from "../../middleware/auth";
import { AdminController } from "./admin.controller";
import { validate } from "../../middleware/validate";
import { updateRoleSchema } from "./admin.validation";


const router = Router();

//User model
router.patch('/users/:id/role',validate(updateRoleSchema),auth(Role.ADMIN), AdminController.updateRole);


export const adminRoutes = router;
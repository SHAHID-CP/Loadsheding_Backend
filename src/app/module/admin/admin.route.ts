import { Router } from "express";
import { Role } from "../../../../generated/prisma/enums";
import { auth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { AdminController } from "./admin.controller";
import { updateRoleSchema } from "./admin.validation";


const router = Router();

//User model
router.patch('/users/:id/role',validate(updateRoleSchema),auth(Role.ADMIN), AdminController.updateRole);



export const adminRoutes = router;
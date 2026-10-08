import { Router } from "express";
import { authRoutes } from "../module/auth/auth.route";
import { userRoutes } from "../module/user/user.route";
import { adminRoutes } from "../module/admin/admin.route";


const router = Router();

router.use("/auth", authRoutes);
router.use("/profile", userRoutes);
router.use("/admin", adminRoutes);


export const routes=router ;
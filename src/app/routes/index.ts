import { Router } from "express";
import { authRoutes } from "../module/auth/auth.route";
import { userRoutes } from "../module/user/user.route";


const router = Router();

router.use("/auth", authRoutes);
router.use("/profile", userRoutes);


export const routes=router ;
import { Router } from "express";
import { adminRoutes } from "../module/admin/admin.route";
import { AreaRoutes } from "../module/area/area.route";
import { authRoutes } from "../module/auth/auth.route";
import { FeederRoutes } from "../module/feeder/feeder.route";
import { SubstationRoutes } from "../module/substation/substation.route";
import { userRoutes } from "../module/user/user.route";
import { ZoneRoutes } from "../module/zone/zone.route";


const router = Router();

router.use("/auth", authRoutes);
router.use("/profile", userRoutes);
router.use("/admin", adminRoutes);
router.use("/zones", ZoneRoutes);
router.use("/substations", SubstationRoutes);
router.use("/feeders", FeederRoutes);
router.use("/areas", AreaRoutes);

export const routes=router ;
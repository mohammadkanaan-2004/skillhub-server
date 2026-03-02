import express from "express";
import { getAdminStats, getStudentStats } from "../controllers/stats.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/admin",               authenticate, authorize("admin"), getAdminStats);
router.get("/student/:studentId",  authenticate, getStudentStats);

export default router;

import express from "express";
import {
  getEnrollments,
  createEnrollment,
  updateProgress,
  updateCurrentLesson,
  updateAdminNotes,
  deleteEnrollment,
} from "../controllers/enrollments.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/",               authenticate, getEnrollments);
router.post("/",              authenticate, createEnrollment);

/* Students update their own progress and lesson position */
router.put("/:id/progress",   authenticate, updateProgress);
router.put("/:id/lesson",     authenticate, updateCurrentLesson);

/* Admin-only operations */
router.put("/:id/notes",      authenticate, authorize("admin"), updateAdminNotes);
router.delete("/:id",         authenticate, authorize("admin"), deleteEnrollment);

export default router;

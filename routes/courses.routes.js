import express from "express";
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../controllers/courses.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

// Everyone authenticated can view courses
router.get("/",           authenticate, getAllCourses);
router.get("/:courseId",  authenticate, getCourseById);

// Only admins can manage courses
router.post("/",          authenticate, authorize("admin"), createCourse);
router.put("/:courseId",  authenticate, authorize("admin"), updateCourse);
router.delete("/:courseId", authenticate, authorize("admin"), deleteCourse);

export default router;

import express from "express";
import {
  getAllStudents,
  getStudentById,
  updateStudent,
} from "../controllers/students.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

// Only admin can list all students
router.get("/", authenticate, authorize("admin"), getAllStudents);

// Students can see their own profile, Admins can see any
router.get("/:studentId", authenticate, getStudentById);

// Students can update their own profile, Admins can update any
router.put("/:studentId", authenticate, updateStudent);

export default router;

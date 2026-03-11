import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { pool } from "./db/db.js";

import authRoutes        from "./routes/auth.routes.js";
import studentsRoutes    from "./routes/students.routes.js";
import coursesRoutes     from "./routes/courses.routes.js";
import enrollmentsRoutes from "./routes/enrollments.routes.js";
import statsRoutes       from "./routes/stats.routes.js";

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

/* ── Middleware ── */
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

/* ── Health / DB checks ── */
app.get("/api/health", (_req, res) => res.json({ ok: true, service: "skillhub-backend" }));

app.get("/api/db-check", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS now;");
    res.json({ ok: true, now: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ── Routes ── */
app.use("/api/auth",        authRoutes);
app.use("/api/students",    studentsRoutes);
app.use("/api/courses",     coursesRoutes);
app.use("/api/enrollments", enrollmentsRoutes);
app.use("/api/stats",       statsRoutes);

/* ── Global error handler ── */
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ ok: false, error: "Internal server error" });
});

/* ── Start ── */
app.listen(PORT, () => console.log(`SkillHub API running on http://localhost:${PORT}`));

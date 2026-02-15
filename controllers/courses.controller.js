import { pool } from "../db/db.js";

function mapCourse(r, materials = []) {
  return {
    id:            r.id,
    title:         r.title,
    description:   r.description,
    category:      r.category,
    level:         r.level,
    durationWeeks: r.duration_weeks,
    durationHours: r.duration_hours,
    instructor:    r.instructor,
    status:        r.status,
    createdAt:     r.created_at,
    price:         r.price != null ? parseFloat(r.price) : 0,
    thumbnailUrl:  r.thumbnail_url || "",
    rating:        r.rating != null ? parseFloat(r.rating) : 4.5,
    enrolledCount: r.enrolled_count != null ? parseInt(r.enrolled_count, 10) : 0,
    materials,
  };
}

/* ── GET /api/courses ── */
export async function getAllCourses(req, res) {
  try {
    const result = await pool.query(
      `SELECT c.id, c.title, c.description, c.category, c.level,
              c.duration_weeks, c.duration_hours, c.instructor, c.status,
              c.created_at, c.price, c.thumbnail_url, c.rating,
              COUNT(e.id)::int AS enrolled_count
       FROM courses c
       LEFT JOIN enrollments e ON e.course_id = c.id
       WHERE c.status != 'archived'
       GROUP BY c.id
       ORDER BY c.created_at DESC`
    );
    res.json(result.rows.map((r) => mapCourse(r)));
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

/* ── GET /api/courses/:courseId ── */
export async function getCourseById(req, res) {
  try {
    const { courseId } = req.params;

    const result = await pool.query(
      `SELECT c.id, c.title, c.description, c.category, c.level,
              c.duration_weeks, c.duration_hours, c.instructor, c.status,
              c.created_at, c.materials_json, c.price, c.thumbnail_url, c.rating,
              COUNT(e.id)::int AS enrolled_count
       FROM courses c
       LEFT JOIN enrollments e ON e.course_id = c.id
       WHERE c.id = $1
       GROUP BY c.id`,
      [courseId]
    );

    if (!result.rows[0])
      return res.status(404).json({ ok: false, error: "Course not found" });

    const r = result.rows[0];
    let materials = [];
    try { materials = r.materials_json ? JSON.parse(r.materials_json) : []; } catch {}

    res.json(mapCourse(r, materials));
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

/* ── POST /api/courses ── */
export async function createCourse(req, res) {
  try {
    const {
      title, description, category, level, durationWeeks, durationHours,
      instructor, materials, price, thumbnailUrl, rating,
    } = req.body || {};

    if (!title)
      return res.status(400).json({ ok: false, error: "Title is required" });

    const id            = `course_${Date.now()}`;
    const createdAt     = new Date().toISOString().slice(0, 10);
    const materialsJson = JSON.stringify(Array.isArray(materials) ? materials : []);

    await pool.query(
      `INSERT INTO courses
         (id, title, description, category, level, duration_weeks, duration_hours,
          instructor, status, created_at, materials_json, price, thumbnail_url, rating)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'active',$9,$10,$11,$12,$13)`,
      [
        id, title, description ?? "", category ?? "General", level ?? "beginner",
        durationWeeks ?? null, durationHours ?? null,
        instructor ?? "Admin", createdAt, materialsJson,
        price ?? 0, thumbnailUrl ?? "", rating ?? 4.5,
      ]
    );

    res.status(201).json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

/* ── PUT /api/courses/:courseId ── */
export async function updateCourse(req, res) {
  try {
    const { courseId } = req.params;
    const {
      title, description, category, level, durationWeeks, durationHours,
      instructor, status, materials, price, thumbnailUrl, rating,
    } = req.body || {};

    const materialsJson = materials !== undefined ? JSON.stringify(materials) : undefined;

    const result = await pool.query(
      `UPDATE courses SET
         title          = COALESCE($2,  title),
         description    = COALESCE($3,  description),
         category       = COALESCE($4,  category),
         level          = COALESCE($5,  level),
         duration_weeks = COALESCE($6,  duration_weeks),
         duration_hours = COALESCE($7,  duration_hours),
         instructor     = COALESCE($8,  instructor),
         status         = COALESCE($9,  status),
         materials_json = COALESCE($10, materials_json),
         price          = COALESCE($11, price),
         thumbnail_url  = COALESCE($12, thumbnail_url),
         rating         = COALESCE($13, rating)
       WHERE id = $1
       RETURNING id`,
      [
        courseId,
        title ?? null, description ?? null, category ?? null, level ?? null,
        durationWeeks ?? null, durationHours ?? null,
        instructor ?? null, status ?? null, materialsJson ?? null,
        price ?? null, thumbnailUrl ?? null, rating ?? null,
      ]
    );

    if (!result.rows[0])
      return res.status(404).json({ ok: false, error: "Course not found" });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

/* ── DELETE /api/courses/:courseId ── */
export async function deleteCourse(req, res) {
  try {
    const { courseId } = req.params;
    await pool.query("DELETE FROM courses WHERE id = $1", [courseId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

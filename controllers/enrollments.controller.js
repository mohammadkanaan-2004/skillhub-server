import { pool } from "../db/db.js";

/* ── GET /api/enrollments?studentId=&courseId= ── */
export async function getEnrollments(req, res) {
  try {
    const { studentId, courseId } = req.query;

    let query = `
      SELECT e.id,
             e.student_id              AS "studentId",
             e.course_id               AS "courseId",
             e.enrolled_at             AS "enrolledAt",
             e.progress,
             e.status,
             e.admin_notes             AS "adminNotes",
             e.last_accessed_at        AS "lastAccessedAt",
             e.current_lesson_index    AS "currentLessonIndex",
             s.name                    AS "studentName",
             s.avatar_url              AS "studentAvatarUrl",
             c.title                   AS "courseTitle",
             c.thumbnail_url           AS "courseThumbnailUrl"
      FROM enrollments e
      LEFT JOIN students s ON s.id = e.student_id
      LEFT JOIN courses  c ON c.id = e.course_id
    `;
    const params = [];

    if (studentId) {
      params.push(studentId);
      query += ` WHERE e.student_id = $${params.length}`;
    } else if (courseId) {
      params.push(courseId);
      query += ` WHERE e.course_id = $${params.length}`;
    }

    query += " ORDER BY e.enrolled_at DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

/* ── POST /api/enrollments ── */
export async function createEnrollment(req, res) {
  try {
    const { studentId, courseId } = req.body || {};

    if (!studentId || !courseId)
      return res.status(400).json({ ok: false, error: "studentId and courseId required" });

    const id         = `enr_${Date.now()}`;
    const enrolledAt = new Date().toISOString().slice(0, 10);

    await pool.query(
      `INSERT INTO enrollments
         (id, student_id, course_id, enrolled_at, progress, status, admin_notes,
          current_lesson_index)
       VALUES ($1, $2, $3, $4, 0, 'active', '', 0)`,
      [id, studentId, courseId, enrolledAt]
    );

    res.status(201).json({ ok: true, id });
  } catch (err) {
    if (String(err.message).includes("unique") || String(err.code) === "23505")
      return res.status(409).json({ ok: false, error: "Already enrolled in this course" });

    res.status(500).json({ ok: false, error: err.message });
  }
}

/* ── PUT /api/enrollments/:id/progress ── */
export async function updateProgress(req, res) {
  try {
    const { id } = req.params;
    const { progress, status } = req.body || {};

    const result = await pool.query(
      `UPDATE enrollments SET
         progress         = COALESCE($2, progress),
         status           = COALESCE($3, status),
         last_accessed_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [id, progress != null ? Number(progress) : null, status ?? null]
    );

    if (!result.rows[0])
      return res.status(404).json({ ok: false, error: "Enrollment not found" });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

/* ── PUT /api/enrollments/:id/lesson ── */
export async function updateCurrentLesson(req, res) {
  try {
    const { id } = req.params;
    const { currentLessonIndex } = req.body || {};

    if (currentLessonIndex == null)
      return res.status(400).json({ ok: false, error: "currentLessonIndex required" });

    const result = await pool.query(
      `UPDATE enrollments SET
         current_lesson_index = $2,
         last_accessed_at     = NOW()
       WHERE id = $1
       RETURNING id`,
      [id, Number(currentLessonIndex)]
    );

    if (!result.rows[0])
      return res.status(404).json({ ok: false, error: "Enrollment not found" });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

/* ── PUT /api/enrollments/:id/notes ── */
export async function updateAdminNotes(req, res) {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body || {};

    const result = await pool.query(
      `UPDATE enrollments SET admin_notes = $2 WHERE id = $1 RETURNING id`,
      [id, adminNotes ?? ""]
    );

    if (!result.rows[0])
      return res.status(404).json({ ok: false, error: "Enrollment not found" });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

/* ── DELETE /api/enrollments/:id ── */
export async function deleteEnrollment(req, res) {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM enrollments WHERE id = $1", [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

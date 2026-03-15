import { pool } from "../db/db.js";

/* ── GET /api/students ── */
export async function getAllStudents(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, name, full_name, email, phone, age, bio, skills,
              learning_goals, location, website, linkedin, avatar_url, created_at
       FROM students ORDER BY name ASC`
    );
    res.json(result.rows.map(mapStudent));
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

/* ── GET /api/students/:studentId ── */
export async function getStudentById(req, res) {
  try {
    const { studentId } = req.params;

    const result = await pool.query(
      `SELECT id, name, full_name, email, phone, age, bio, skills,
              learning_goals, location, website, linkedin, avatar_url, created_at
       FROM students WHERE id = $1`,
      [studentId]
    );

    if (!result.rows[0])
      return res.status(404).json({ ok: false, error: "Student not found" });

    res.json(mapStudent(result.rows[0]));
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

/* ── PUT /api/students/:studentId ── */
export async function updateStudent(req, res) {
  try {
    const { studentId } = req.params;
    const { name, fullName, email, phone, age, bio, skills,
            learningGoals, location, website, linkedin, avatarUrl } = req.body || {};

    const updateResult = await pool.query(
      `UPDATE students SET
         name           = COALESCE($2,  name),
         full_name      = COALESCE($3,  full_name),
         email          = COALESCE($4,  email),
         phone          = COALESCE($5,  phone),
         age            = COALESCE($6,  age),
         bio            = COALESCE($7,  bio),
         skills         = COALESCE($8,  skills),
         learning_goals = COALESCE($9,  learning_goals),
         location       = COALESCE($10, location),
         website        = COALESCE($11, website),
         linkedin       = COALESCE($12, linkedin),
         avatar_url     = COALESCE($13, avatar_url)
       WHERE id = $1
       RETURNING id, name, full_name, email, phone, age, bio, skills,
                 learning_goals, location, website, linkedin, avatar_url, created_at`,
      [studentId,
       name ?? null, fullName ?? null, email ?? null, phone ?? null,
       age ?? null, bio ?? null, skills ?? null, learningGoals ?? null,
       location ?? null, website ?? null, linkedin ?? null, avatarUrl ?? null]
    );

    if (!updateResult.rows[0]) {
      const insertResult = await pool.query(
        `INSERT INTO students (id, name, full_name, email, phone, age, bio,
                               skills, learning_goals, location, website, linkedin, avatar_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         RETURNING id, name, full_name, email, phone, age, bio, skills,
                   learning_goals, location, website, linkedin, avatar_url, created_at`,
        [studentId,
         name ?? `Student ${studentId}`, fullName ?? null, email ?? null,
         phone ?? null, age ?? null, bio ?? null, skills ?? null,
         learningGoals ?? null, location ?? null, website ?? null, linkedin ?? null,
         avatarUrl ?? null]
      );
      return res.json(mapStudent(insertResult.rows[0]));
    }

    res.json(mapStudent(updateResult.rows[0]));
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

function mapStudent(r) {
  return {
    id:            r.id,
    name:          r.name,
    fullName:      r.full_name,
    email:         r.email,
    phone:         r.phone,
    age:           r.age,
    bio:           r.bio,
    skills:        r.skills,
    learningGoals: r.learning_goals,
    location:      r.location,
    website:       r.website,
    linkedin:      r.linkedin,
    avatarUrl:     r.avatar_url || "",
    createdAt:     r.created_at,
  };
}

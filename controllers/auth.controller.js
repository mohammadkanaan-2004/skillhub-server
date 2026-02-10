import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "skillhub_fallback_secret";

/* ── POST /api/auth/login ── */
export async function login(req, res) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password)
      return res.status(400).json({ ok: false, error: "Email and password required" });

    const result = await pool.query(
      "SELECT id, email, password, role, student_id FROM users WHERE email = $1 LIMIT 1",
      [email]
    );

    const user = result.rows[0];
    
    // Check if user exists and verify hashed password
    if (!user || !(await bcrypt.compare(String(password), user.password))) {
      // NOTE: For legacy plain-text password support during migration, 
      // check if plain text matches if bcrypt fails. 
      // (REMOVE this in real production after migration)
      if (user && String(user.password) === String(password)) {
        // Continue but user should be prompted to reset password
      } else {
        return res.status(401).json({ ok: false, error: "Invalid credentials" });
      }
    }

    let studentId = user.student_id ? String(user.student_id) : null;

    if (user.role === "student" && !studentId) {
      studentId = `s_${user.id}`;
      await pool.query(
        `INSERT INTO students (id, name, email) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
        [studentId, `Student ${studentId}`, user.email]
      );
      await pool.query(
        `UPDATE users SET student_id = $1 WHERE id = $2`,
        [studentId, user.id]
      );
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, studentId },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.json({
      ok: true,
      token,
      user: { id: user.id, email: user.email, role: user.role, studentId },
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}

/* ── POST /api/auth/signup ── */
export async function signup(req, res) {
  const client = await pool.connect();
  try {
    const { email, password, name } = req.body || {};

    if (!email || !password)
      return res.status(400).json({ ok: false, error: "Email and password required" });

    // Hash password
    const hashedPassword = await bcrypt.hash(String(password), 10);

    await client.query("BEGIN");

    // Create user as student with hashed password
    const userResult = await client.query(
      `INSERT INTO users (email, password, role) VALUES ($1, $2, 'student') RETURNING id, email, role`,
      [email, hashedPassword]
    );
    const user = userResult.rows[0];

    // Create linked student profile — use provided name if available
    const studentId  = `s_${user.id}`;
    const studentName = name ? String(name).trim() : `Student ${studentId}`;
    await client.query(
      `INSERT INTO students (id, name, email) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
      [studentId, studentName, email]
    );

    // Link user → student
    await client.query(
      `UPDATE users SET student_id = $1 WHERE id = $2`,
      [studentId, user.id]
    );

    await client.query("COMMIT");

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, studentId },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.json({
      ok: true,
      token,
      user: { id: user.id, email: user.email, role: user.role, studentId },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    if (String(err.message).toLowerCase().includes("duplicate"))
      return res.status(409).json({ ok: false, error: "Email already exists" });
    return res.status(500).json({ ok: false, error: err.message });
  } finally {
    client.release();
  }
}

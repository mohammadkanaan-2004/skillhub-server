-- SkillHub Database Schema
-- Run once to create tables, safe to re-run (uses IF NOT EXISTS + ADD COLUMN IF NOT EXISTS)

-- =========================
-- CORE TABLES
-- =========================

CREATE TABLE IF NOT EXISTS students (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  full_name      TEXT,
  email          TEXT,
  phone          TEXT,
  age            INT,
  bio            TEXT,
  skills         TEXT,
  learning_goals TEXT,
  location       TEXT,
  website        TEXT,
  linkedin       TEXT,
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'student',
  student_id TEXT REFERENCES students(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS courses (
  id             TEXT PRIMARY KEY,
  title          TEXT NOT NULL,
  description    TEXT DEFAULT '',
  category       TEXT DEFAULT 'General',
  level          TEXT DEFAULT 'beginner',
  duration_weeks INT,
  instructor     TEXT DEFAULT 'Admin',
  status         TEXT DEFAULT 'active',
  created_at     DATE DEFAULT NOW(),
  materials_json TEXT DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS enrollments (
  id          TEXT PRIMARY KEY,
  student_id  TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id   TEXT NOT NULL REFERENCES courses(id)  ON DELETE CASCADE,
  enrolled_at DATE DEFAULT NOW(),
  progress    INT  DEFAULT 0,
  status      TEXT DEFAULT 'active',
  admin_notes TEXT DEFAULT '',
  UNIQUE(student_id, course_id)
);

-- =========================
-- MIGRATIONS (safe to re-run)
-- =========================

ALTER TABLE students ADD COLUMN IF NOT EXISTS location   TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS website    TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS linkedin   TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- Phase 2: courses — price, thumbnail, rating, duration_hours
ALTER TABLE courses ADD COLUMN IF NOT EXISTS price          NUMERIC(10,2) DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS thumbnail_url  TEXT DEFAULT '';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS rating         NUMERIC(3,1) DEFAULT 4.5;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration_hours INT;

-- Phase 2: students — avatar
ALTER TABLE students ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';

-- Phase 2: enrollments — activity tracking
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS last_accessed_at   TIMESTAMP;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS current_lesson_index INT DEFAULT 0;

-- =========================
-- DEFAULT ADMIN USER
-- password: admin123
-- =========================

INSERT INTO users (email, password, role)
VALUES ('admin@skillhub.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lmuG', 'admin')
ON CONFLICT (email) DO NOTHING;

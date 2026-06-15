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
VALUES ('admin@skillhub.com', '$2b$10$zjf6gscMdBjUo.pXOqC5heMtZ2VF0uxdAX6GR6njiNzCELVj9Dv7u', 'admin')
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role;

-- =========================
-- DEFAULT COURSES
-- =========================

INSERT INTO courses (id, title, description, category, level, duration_weeks, instructor, status, rating, price, duration_hours, thumbnail_url, materials_json)
VALUES
(
  'course_001',
  'Web Development Fundamentals',
  'Learn the core building blocks of the web. This course covers HTML structure, CSS styling, and JavaScript basics to help you build your first real websites from scratch.',
  'Web Development',
  'beginner',
  6,
  'Traversy Media',
  'active',
  4.8,
  0,
  36,
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&auto=format&fit=crop',
  '[{"title":"HTML Crash Course","type":"video","duration":"60 min","url":"https://www.youtube.com/watch?v=UB1O30fR-EE"},{"title":"CSS Crash Course","type":"video","duration":"90 min","url":"https://www.youtube.com/watch?v=yfoY53QXEnI"},{"title":"JavaScript Crash Course","type":"video","duration":"90 min","url":"https://www.youtube.com/watch?v=hdI2bqOjy3c"},{"title":"Build Your First Website","type":"video","duration":"45 min","url":"https://www.youtube.com/watch?v=mU6anWqZJcc"},{"title":"Module Quiz","type":"quiz","duration":"15 min","url":""}]'
),
(
  'course_002',
  'JavaScript Programming',
  'Master modern JavaScript from variables and functions all the way to async/await and APIs. Perfect for beginners who want to write real interactive programs.',
  'Programming',
  'intermediate',
  8,
  'Programming with Mosh',
  'active',
  4.7,
  0,
  48,
  'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&auto=format&fit=crop',
  '[{"title":"JavaScript for Beginners — Full Course","type":"video","duration":"60 min","url":"https://www.youtube.com/watch?v=W6NZfCO5SIk"},{"title":"Arrays and Objects Deep Dive","type":"video","duration":"30 min","url":"https://www.youtube.com/watch?v=oigfaZ5ApsM"},{"title":"DOM Manipulation","type":"video","duration":"35 min","url":"https://www.youtube.com/watch?v=y17RuWkWdn8"},{"title":"Fetch API and Async/Await","type":"video","duration":"25 min","url":"https://www.youtube.com/watch?v=cuEtnrL9-H0"},{"title":"JavaScript Interview Questions","type":"video","duration":"40 min","url":"https://www.youtube.com/watch?v=TNT4OuXNT_g"},{"title":"Final Quiz","type":"quiz","duration":"20 min","url":""}]'
),
(
  'course_003',
  'React.js for Beginners',
  'Build modern single-page applications with React 19. You will learn components, hooks, state management, and how to connect your frontend to a real REST API.',
  'Frontend Development',
  'intermediate',
  10,
  'freeCodeCamp',
  'active',
  4.9,
  0,
  60,
  'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop',
  '[{"title":"React JS Full Course for Beginners","type":"video","duration":"120 min","url":"https://www.youtube.com/watch?v=bMknfKXIFA8"},{"title":"Components and Props","type":"video","duration":"30 min","url":"https://www.youtube.com/watch?v=4UZrsTqkcW4"},{"title":"useState and useEffect Hooks","type":"video","duration":"35 min","url":"https://www.youtube.com/watch?v=O6P86uwfdR0"},{"title":"React Router v6","type":"video","duration":"30 min","url":"https://www.youtube.com/watch?v=oTIJunBa6MA"},{"title":"Fetching Data from an API","type":"video","duration":"25 min","url":"https://www.youtube.com/watch?v=00lxm_doFYw"},{"title":"Final Project: Build a Full React App","type":"video","duration":"60 min","url":"https://www.youtube.com/watch?v=b9eMGE7QtTk"},{"title":"Final Quiz","type":"quiz","duration":"20 min","url":""}]'
)
ON CONFLICT (id) DO NOTHING;

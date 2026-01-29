# SkillHub Backend

Node.js + Express REST API for the SkillHub Training Academy platform.

## Tech Stack
- Node.js (ESM modules)
- Express 5
- PostgreSQL (`pg` pool)
- No ORM — raw SQL

## Setup

```bash
cp .env.sample .env
# Edit .env with your DATABASE_URL
npm install
```

## Database

Create the database then run the schema:

```bash
psql -U postgres -c "CREATE DATABASE skillhub;"
psql -U postgres -d skillhub -f sql/schema.sql
```

## Run

```bash
npm start        # production
npm run dev      # watch mode
```

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/signup | Register new student |
| POST | /api/auth/login  | Login (admin or student) |

### Courses
| Method | Path | Description |
|--------|------|-------------|
| GET    | /api/courses           | List all active courses |
| GET    | /api/courses/:id       | Get course by ID |
| POST   | /api/courses           | Create course (admin) |
| PUT    | /api/courses/:id       | Update course (admin) |
| DELETE | /api/courses/:id       | Delete course (admin) |

### Students
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/students          | List all students |
| GET | /api/students/:id      | Get student by ID |
| PUT | /api/students/:id      | Update student profile |

### Enrollments
| Method | Path | Description |
|--------|------|-------------|
| GET    | /api/enrollments                  | List enrollments (filter: ?studentId= or ?courseId=) |
| POST   | /api/enrollments                  | Enrol student in course |
| PUT    | /api/enrollments/:id/progress     | Update progress & status |
| PUT    | /api/enrollments/:id/notes        | Update admin notes |
| DELETE | /api/enrollments/:id              | Remove enrollment |

## Default Admin
- Email: `admin@skillhub.com`
- Password: `admin123`

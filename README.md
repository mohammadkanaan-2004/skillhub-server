# SkillHub Backend

Node.js + Express REST API for the SkillHub Training Academy platform.

## Tech Stack

- **Runtime:** Node.js (ESM modules)
- **Framework:** Express 5
- **Database:** PostgreSQL via `pg` pool (raw SQL, no ORM)
- **Auth:** JWT (`jsonwebtoken`) + `bcryptjs` password hashing
- **Logging:** Morgan (dev mode)

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

## Setup

```bash
# 1. Clone the repository
git clone https://github.com/mohammadkanaan-2004/skillhub-server.git
cd skillhub-server

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.sample .env
# Edit .env with your database credentials and JWT secret

# 4. Create the database and run the schema
psql -U postgres -c "CREATE DATABASE skillhub;"
psql -U postgres -d skillhub -f sql/schema.sql
```

## Environment Variables

| Variable       | Description                         | Example                                              |
|----------------|-------------------------------------|------------------------------------------------------|
| `DATABASE_URL`  | Full PostgreSQL connection string   | `postgresql://postgres:pass@localhost:5432/skillhub` |
| `PORT`          | Port the server listens on          | `5000`                                               |
| `JWT_SECRET`    | Secret key for signing JWT tokens   | `a_long_random_string`                               |

## Running the Server

```bash
npm start        # production
npm run dev      # watch mode (auto-restarts on file changes)
```

## Project Structure

```
skillhub-server/
├── controllers/          Business logic for each resource
│   ├── auth.controller.js
│   ├── courses.controller.js
│   ├── enrollments.controller.js
│   ├── stats.controller.js
│   └── students.controller.js
├── db/
│   └── db.js             PostgreSQL connection pool
├── middleware/
│   └── auth.middleware.js  JWT verify + role guard
├── routes/               Express Router definitions
│   ├── auth.routes.js
│   ├── courses.routes.js
│   ├── enrollments.routes.js
│   ├── stats.routes.js
│   └── students.routes.js
├── sql/
│   └── schema.sql        Database schema + seed data
├── server.js             Express app entry point
├── .env.sample           Environment variable template
└── package.json
```

## API Endpoints

### Auth

| Method | Path               | Description              |
|--------|--------------------|--------------------------|
| POST   | /api/auth/signup   | Register new student     |
| POST   | /api/auth/login    | Login (admin or student) |

### Courses

| Method | Path                 | Description                  |
|--------|----------------------|------------------------------|
| GET    | /api/courses         | List all active courses       |
| GET    | /api/courses/:id     | Get single course by ID       |
| POST   | /api/courses         | Create a course (admin only)  |
| PUT    | /api/courses/:id     | Update a course (admin only)  |
| DELETE | /api/courses/:id     | Delete a course (admin only)  |

### Students

| Method | Path                  | Description              |
|--------|-----------------------|--------------------------|
| GET    | /api/students         | List all students        |
| GET    | /api/students/:id     | Get student by ID        |
| PUT    | /api/students/:id     | Update student profile   |

### Enrollments

| Method | Path                               | Description               |
|--------|------------------------------------|---------------------------|
| GET    | /api/enrollments                   | List enrollments          |
| POST   | /api/enrollments                   | Enrol student in course   |
| PUT    | /api/enrollments/:id/progress      | Update progress (0-100)   |
| PUT    | /api/enrollments/:id/notes         | Update admin notes        |
| DELETE | /api/enrollments/:id               | Remove enrollment         |

### Stats

| Method | Path                           | Description               |
|--------|--------------------------------|---------------------------|
| GET    | /api/stats/admin               | Admin dashboard analytics |
| GET    | /api/stats/student/:studentId  | Student activity stats    |

## Default Admin Account

| Field    | Value                 |
|----------|-----------------------|
| Email    | admin@skillhub.com    |
| Password | admin123              |

## Response Format

All endpoints return JSON in the form:

```json
{ "ok": true, "data": ... }
{ "ok": false, "error": "message" }
```

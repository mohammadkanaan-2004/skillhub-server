import { pool } from "../db/db.js";

/* ── GET /api/stats/admin ── */
export async function getAdminStats(req, res) {
  try {
    /* Weekly enrollment counts — last 7 calendar days */
    const weekResult = await pool.query(`
      SELECT
        TO_CHAR(enrolled_at::date, 'Dy') AS day_name,
        enrolled_at::date                AS day,
        COUNT(*)::int                    AS count
      FROM enrollments
      WHERE enrolled_at::date >= CURRENT_DATE - INTERVAL '6 days'
      GROUP BY enrolled_at::date
      ORDER BY enrolled_at::date
    `);

    /* Build a full Mon→Sun 7-slot array anchored on today */
    const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today      = new Date();
    const bars       = Array(7).fill(0);
    const labels     = Array(7).fill("");

    for (let i = 6; i >= 0; i--) {
      const d    = new Date(today);
      d.setDate(d.getDate() - i);
      const slot = (d.getDay() + 6) % 7; // 0=Mon … 6=Sun
      labels[6 - i] = DAY_LABELS[slot];
    }

    const maxCount = Math.max(1, ...weekResult.rows.map((r) => r.count));
    weekResult.rows.forEach((r) => {
      const d    = new Date(r.day);
      const slot = (d.getDay() + 6) % 7;
      /* find which position in bars[] corresponds to this weekday */
      for (let i = 0; i < 7; i++) {
        const refDate = new Date(today);
        refDate.setDate(refDate.getDate() - (6 - i));
        if (refDate.toDateString() === d.toDateString()) {
          bars[i] = Math.round((r.count / maxCount) * 100);
          break;
        }
      }
    });

    /* Aggregate counts */
    const [[totStudents], [totCourses], [totEnrollments], [completedEnr]] =
      await Promise.all([
        pool.query(`SELECT COUNT(*)::int AS c FROM students`),
        pool.query(`SELECT COUNT(*)::int AS c FROM courses WHERE status != 'archived'`),
        pool.query(`SELECT COUNT(*)::int AS c FROM enrollments`),
        pool.query(`SELECT COUNT(*)::int AS c FROM enrollments WHERE status = 'completed'`),
      ]).then((results) => results.map((r) => r.rows));

    const completionRate = totEnrollments[0].c > 0
      ? Math.round((completedEnr[0].c / totEnrollments[0].c) * 100)
      : 0;

    res.json({
      weeklyBars:      bars,
      weeklyLabels:    labels,
      totalStudents:   totStudents.c,
      totalCourses:    totCourses.c,
      totalEnrollments: totEnrollments.c,
      completionRate,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

/* ── GET /api/stats/student/:studentId ── */
export async function getStudentStats(req, res) {
  try {
    const { studentId } = req.params;

    /* Activity days in last 7 days */
    const activityResult = await pool.query(`
      SELECT DISTINCT DATE_TRUNC('day', last_accessed_at)::date AS day
      FROM enrollments
      WHERE student_id = $1
        AND last_accessed_at IS NOT NULL
        AND last_accessed_at >= NOW() - INTERVAL '7 days'
      ORDER BY day
    `, [studentId]);

    /* All-time distinct activity days (for streak) */
    const allDaysResult = await pool.query(`
      SELECT DISTINCT DATE_TRUNC('day', last_accessed_at)::date AS day
      FROM enrollments
      WHERE student_id = $1
        AND last_accessed_at IS NOT NULL
      ORDER BY day DESC
    `, [studentId]);

    /* Calculate streak in JS — count consecutive days ending today or yesterday */
    const streak = calcStreak(allDaysResult.rows.map((r) => new Date(r.day)));

    /* Estimated total study hours */
    const hoursResult = await pool.query(`
      SELECT COALESCE(SUM(
        (e.progress::float / 100.0) *
        COALESCE(c.duration_hours, c.duration_weeks * 5, 5)
      ), 0) AS total_hours
      FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      WHERE e.student_id = $1
    `, [studentId]);

    const totalHours = Math.round(
      parseFloat(hoursResult.rows[0]?.total_hours || 0) * 10
    ) / 10;

    /* Weekly goal: percentage of non-completed courses that have progress > 0 this week */
    const weeklyGoalResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE last_accessed_at >= NOW() - INTERVAL '7 days')::int AS active_this_week,
        COUNT(*) FILTER (WHERE status != 'completed')::int                          AS total_ongoing
      FROM enrollments
      WHERE student_id = $1
    `, [studentId]);

    const { active_this_week, total_ongoing } = weeklyGoalResult.rows[0];
    const weeklyGoalPct = total_ongoing > 0
      ? Math.min(100, Math.round((active_this_week / total_ongoing) * 100))
      : 0;

    /* Build 7-bar chart: 0-100 values for Mon→Sun of the current week */
    const today   = new Date();
    const bars    = Array(7).fill(0);
    const labels  = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const activeDaySet = new Set(
      activityResult.rows.map((r) => new Date(r.day).toDateString())
    );

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      bars[i] = activeDaySet.has(d.toDateString()) ? 75 : 0;
    }

    res.json({ streak, totalHours, weeklyGoalPct, weeklyBars: bars, weeklyLabels: labels });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

/* Count consecutive days with activity ending today or yesterday */
function calcStreak(dates) {
  if (!dates.length) return 0;

  const sorted   = dates
    .map((d) => { d.setHours(0, 0, 0, 0); return d.getTime(); })
    .sort((a, b) => b - a); // newest first

  const today     = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const todayMs   = today.getTime();
  const yestMs    = yesterday.getTime();

  /* Streak must touch today or yesterday */
  if (sorted[0] !== todayMs && sorted[0] !== yestMs) return 0;

  let streak   = 1;
  let prev     = sorted[0];
  const oneDay = 86400000;

  for (let i = 1; i < sorted.length; i++) {
    if (prev - sorted[i] === oneDay) {
      streak++;
      prev = sorted[i];
    } else if (sorted[i] === prev) {
      /* duplicate date — skip */
    } else {
      break;
    }
  }

  return streak;
}

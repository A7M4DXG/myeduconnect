const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireLecturer } = require('../middleware/authMiddleware');

/* ======================
   GET Lecturer Stats
====================== */
router.get('/lecturer/stats', requireLecturer, (req, res) => {
    db.query(
        `SELECT
            COUNT(DISTINCT courses.id)         AS courses,
            COUNT(DISTINCT enrollments.user_id) AS students,
            COUNT(DISTINCT assignments.id)      AS assignments,
            COUNT(DISTINCT submissions.id)      AS submissions
         FROM courses
         JOIN lecturers ON courses.lecturer_id = lecturers.id
         JOIN users     ON lecturers.email = users.email
         LEFT JOIN enrollments  ON enrollments.course_id  = courses.id
         LEFT JOIN assignments  ON assignments.course_id  = courses.id
         LEFT JOIN submissions  ON submissions.assignment_id = assignments.id
         WHERE users.id = ?`,
        [req.session.userId],
        (err, results) => {
            if (err) return res.status(500).json({ message: 'Failed' });
            res.json(results[0]);
        }
    );
});

/* ======================
   GET Lecturer Courses
====================== */
router.get('/lecturer/courses', requireLecturer, (req, res) => {
    db.query(
        `SELECT courses.*, COUNT(enrollments.id) AS enrollment_count
         FROM courses
         JOIN lecturers ON courses.lecturer_id = lecturers.id
         JOIN users     ON lecturers.email = users.email
         LEFT JOIN enrollments ON enrollments.course_id = courses.id
         WHERE users.id = ?
         GROUP BY courses.id
         ORDER BY courses.id DESC`,
        [req.session.userId],
        (err, results) => {
            if (err) return res.status(500).json({ message: 'Failed' });
            res.json(results);
        }
    );
});

/* ======================
   GET Students in Course
====================== */
router.get('/lecturer/students/:courseId', requireLecturer, (req, res) => {
    db.query(
        `SELECT users.id, users.username, users.email, enrollments.enrolled_at
         FROM enrollments
         JOIN users ON enrollments.user_id = users.id
         WHERE enrollments.course_id = ?
         ORDER BY enrollments.enrolled_at DESC`,
        [req.params.courseId],
        (err, results) => {
            if (err) return res.status(500).json({ message: 'Failed' });
            res.json(results);
        }
    );
});

module.exports = router;

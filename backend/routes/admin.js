const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireAdmin } = require('../middleware/authMiddleware');

/* ====================== Statistics ====================== */
router.get('/admin/stats', requireAdmin, (req, res) => {
    const query = `
        SELECT 
            (SELECT COUNT(*) FROM users WHERE role='student') as totalStudents,
            (SELECT COUNT(*) FROM users WHERE role='lecturer') as totalLecturers,
            (SELECT COUNT(*) FROM users) as totalUsers,
            (SELECT COUNT(*) FROM courses) as totalCourses,
            (SELECT COUNT(*) FROM enrollments) as totalEnrollments
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: 'Stats failed' });
        res.json(results[0]);
    });
});

/* ====================== Lecturer & User Management ====================== */
router.get('/admin/lecturers', requireAdmin, (req, res) => {
    db.query("SELECT id, username, email FROM users WHERE role='lecturer'", (err, results) => {
        if (err) return res.status(500).json({ message: 'Failed' });
        res.json(results);
    });
});

router.get('/admin/users', requireAdmin, (req, res) => {
    db.query('SELECT id, username, email, role FROM users', (err, results) => {
        if (err) return res.status(500).json({ message: 'Failed' });
        res.json(results);
    });
});

router.put('/admin/users/:id/role', requireAdmin, (req, res) => {
    const { role } = req.body;
    db.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id], (err) => {
        if (err) return res.status(500).json({ message: 'Update failed' });
        res.json({ message: 'Role updated' });
    });
});

router.delete('/admin/users/:id', requireAdmin, (req, res) => {
    if (req.params.id == req.session.userId) return res.status(403).json({ message: 'Cannot delete self' });
    db.query('DELETE FROM users WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ message: 'Delete failed' });
        res.json({ message: 'User deleted' });
    });
});

/* ====================== Course Management ====================== */
router.get('/admin/courses', requireAdmin, (req, res) => {
    const query = `
        SELECT courses.*, users.username AS lecturer_name
        FROM courses
        LEFT JOIN users ON courses.lecturer_id = users.id
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: 'Failed' });
        res.json(results);
    });
});

router.post('/admin/course', requireAdmin, (req, res) => {
    const { course_code, course_name, course_category, price, duration_weeks, description, lecturer_id } = req.body;
    db.query('INSERT INTO courses (course_code, course_name, course_category, price, duration_weeks, description, lecturer_id) VALUES (?,?,?,?,?,?,?)',
        [course_code, course_name, course_category, price, duration_weeks, description, lecturer_id], (err) => {
        if (err) return res.status(500).json({ message: 'Course creation failed' });
        res.status(201).json({ message: 'Course created' });
    });
});

router.put('/admin/course/:id', requireAdmin, (req, res) => {
    const { course_code, course_name, course_category, price, duration_weeks, description, lecturer_id } = req.body;
    db.query('UPDATE courses SET course_code=?, course_name=?, course_category=?, price=?, duration_weeks=?, description=?, lecturer_id=? WHERE id=?',
        [course_code, course_name, course_category, price, duration_weeks, description, lecturer_id, req.params.id], (err) => {
        if (err) return res.status(500).json({ message: 'Update failed' });
        res.json({ message: 'Updated' });
    });
});

router.delete('/admin/course/:id', requireAdmin, (req, res) => {
    db.query('DELETE FROM courses WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ message: 'Delete failed' });
        res.json({ message: 'Deleted' });
    });
});

module.exports = router;
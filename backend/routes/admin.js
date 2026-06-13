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
        SELECT 
            courses.*, 
            users.username AS lecturer_name,
            COUNT(e.user_id) AS enrollments
        FROM courses
        LEFT JOIN users ON courses.lecturer_id = users.id
        LEFT JOIN enrollments e ON courses.id = e.course_id
        GROUP BY courses.id
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: 'Failed' });
        res.json(results);
    });
});

/* GET /admin/categories - Fetch distinct categories directly from courses */
router.get('/admin/categories', requireAdmin, (req, res) => {
    const query = `
        SELECT DISTINCT course_category
        FROM courses
        WHERE course_category IS NOT NULL
        AND course_category <> ''
        ORDER BY course_category;
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: 'Failed to load categories' });
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

// ============================
// Get All Payments (Admin)
// ============================
router.get('/admin/payments', (req, res) => {
    // Assuming you have an admin check middleware, e.g., requireAdmin
    // If you don't, you can do a simple session check like:
    /*
    if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    */

    const query = `
        SELECT 
            p.id, 
            u.username, 
            u.email, 
            p.amount, 
            p.payment_method, 
            p.payment_status, 
            p.paid_at 
        FROM payments p
        LEFT JOIN users u ON p.user_id = u.id
        ORDER BY p.paid_at DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching payments:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        res.json(results);
    });
});

module.exports = router;
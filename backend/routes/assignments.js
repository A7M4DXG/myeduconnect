const express = require('express');
const multer = require('multer');
const db = require('../config/db');
const { requireLogin, requireLecturer } = require('../middleware/authMiddleware');

const router = express.Router();

/* ==================== UPLOAD CONFIG ==================== */
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/submissions'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

/* ==================== CREATE ASSIGNMENT (LECTURER) ==================== */
router.post('/assignments', requireLecturer, (req, res) => {
    const { course_id, title, description, due_date, max_marks } = req.body;

    db.query(
        'INSERT INTO assignments (course_id, title, description, due_date, max_marks, created_by) VALUES (?, ?, ?, ?, ?, ?)',
        [course_id, title, description, due_date, max_marks, req.session.userId],
        (err) => {
            if (err) return res.status(500).json({ message: 'Failed to create assignment' });

            // Notify enrolled students
            db.query('SELECT user_id FROM enrollments WHERE course_id = ?', [course_id], (notifErr, students) => {
                if (students && students.length > 0) {
                    const values = students.map(s => [s.user_id, `New assignment: ${title}`]);
                    db.query('INSERT INTO notifications (user_id, message) VALUES ?', [values]);
                }
            });

            res.status(201).json({ message: 'Assignment created' });
        }
    );
});

/* ==================== EDIT ASSIGNMENT (LECTURER) ==================== */
router.put('/assignments/:id', requireLecturer, (req, res) => {
    const assignId = req.params.id;
    const lecturerId = req.session.userId;
    const { title, description, due_date, max_marks } = req.body;

    db.query(
        'UPDATE assignments SET title = ?, description = ?, due_date = ?, max_marks = ? WHERE id = ? AND created_by = ?',
        [title, description, due_date, max_marks, assignId, lecturerId],
        (err, result) => {
            if (err) return res.status(500).json({ message: 'Update failed' });
            // Query succeeded without errors
            res.json({ message: 'Assignment updated successfully' });
        }
    );
});

/* ==================== DELETE ASSIGNMENT (LECTURER) ==================== */
router.delete('/assignments/:id', requireLecturer, (req, res) => {
    const assignId = req.params.id;
    const lecturerId = req.session.userId;

    // 1. Check for existing submissions
    db.query('SELECT COUNT(*) as count FROM submissions WHERE assignment_id = ?', [assignId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error checking submissions' });
        
        if (results[0].count > 0) {
            return res.status(400).json({ 
                message: "Cannot delete assignment because students have submitted work." 
            });
        }

        // 2. Delete assignment
        db.query('DELETE FROM assignments WHERE id = ? AND created_by = ?', [assignId, lecturerId], (delErr, result) => {
            if (delErr) return res.status(500).json({ message: 'Delete failed' });
            if (result.affectedRows === 0) return res.status(404).json({ message: 'Assignment not found or unauthorized' });
            res.json({ message: 'Assignment deleted successfully' });
        });
    });
});

/* ==================== GET COURSE ASSIGNMENTS ==================== */
router.get('/assignments/:courseId', requireLogin, (req, res) => {
    db.query(
        'SELECT * FROM assignments WHERE course_id = ? ORDER BY due_date ASC',
        [req.params.courseId],
        (err, result) => {
            if (err) return res.status(500).json({ message: 'Failed' });
            res.json(result);
        }
    );
});

/* ==================== SUBMIT ASSIGNMENT ==================== */
router.post('/submit-assignment', requireLogin, upload.single('file'), (req, res) => {
    const { assignment_id } = req.body;

    db.query('SELECT due_date FROM assignments WHERE id = ?', [assignment_id], (err, result) => {
        if (err || !result.length) return res.status(500).json({ message: 'Assignment missing' });

        const status = new Date() > new Date(result[0].due_date) ? 'Late' : 'Submitted';

        db.query(
            'INSERT INTO submissions (assignment_id, student_id, file_name, file_path, status) VALUES (?, ?, ?, ?, ?)',
            [assignment_id, req.session.userId, req.file.filename, req.file.path, status],
            (err) => {
                if (err) return res.status(500).json({ message: 'Submit failed' });
                
                // Notify student of success
                db.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', 
                [req.session.userId, 'Assignment submitted successfully']);
                
                res.json({ message: status });
            }
        );
    });
});

/* ==================== GET SUBMISSIONS (LECTURER) ==================== */
router.get('/submissions/:assignmentId', requireLecturer, (req, res) => {
    db.query('SELECT * FROM submissions WHERE assignment_id = ?', [req.params.assignmentId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Failed' });
        res.json(result);
    });
});

/* ==================== GET SPECIFIC SUBMISSION (STUDENT) ==================== */
router.get('/my-submission/:assignmentId', requireLogin, (req, res) => {
    db.query(
        'SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?',
        [req.params.assignmentId, req.session.userId],
        (err, results) => {
            if (err) return res.status(500).json({ message: 'Database error' });
            if (results.length === 0) return res.status(404).json({ message: 'Not submitted' });
            res.json(results[0]);
        }
    );
});

/* ==================== GET ALL SUBMISSIONS (STUDENT DASHBOARD) ==================== */
router.get('/my-submissions', requireLogin, (req, res) => {
    db.query(
        'SELECT * FROM submissions WHERE student_id = ?',
        [req.session.userId],
        (err, results) => {
            if (err) return res.status(500).json({ message: 'Database error' });
            res.json(results);
        }
    );
});

module.exports = router;
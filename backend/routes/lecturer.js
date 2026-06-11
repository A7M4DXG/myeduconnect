const express = require('express');
const db = require('../config/db'); // Adjust path if your db config is elsewhere
const { requireLecturer } = require('../middleware/authMiddleware');

const router = express.Router();

/* ==========================================================================
   PHASE 2: GET LECTURER COURSES
   ========================================================================== */
router.get('/lecturer/courses', requireLecturer, (req, res) => {
    const query = `
        SELECT 
            id, 
            course_name, 
            course_code, 
            price, 
            duration_weeks 
        FROM courses 
        WHERE lecturer_id = ? 
        ORDER BY course_name;
    `;

    db.query(query, [req.session.userId], (err, results) => {
        if (err) {
            console.error('Error fetching lecturer courses:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        res.json(results);
    });
});

/* ==========================================================================
   PHASE 3: GET LECTURER SUBMISSIONS
   ========================================================================== */
router.get('/lecturer/submissions', requireLecturer, (req, res) => {
    const query = `
        SELECT 
            s.id, 
            u.username AS student_name, 
            a.title AS assignment_title, 
            s.grade, 
            s.feedback, 
            s.submitted_at 
        FROM submissions s
        JOIN assignments a ON s.assignment_id = a.id
        JOIN users u ON s.student_id = u.id
        WHERE a.created_by = ?
        ORDER BY s.submitted_at DESC;
    `;

    db.query(query, [req.session.userId], (err, results) => {
        if (err) {
            console.error('Error fetching lecturer submissions:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        res.json(results);
    });
});

/* ==========================================================================
   PHASE 4: GRADE SUBMISSION & NOTIFY
   ========================================================================== */
router.put('/submissions/:id/grade', requireLecturer, (req, res) => {
    const { grade, feedback } = req.body;
    const submissionId = req.params.id;

    // 1. Update the grade and feedback
    const updateQuery = `
        UPDATE submissions 
        SET grade = ?, feedback = ? 
        WHERE id = ?;
    `;

    db.query(updateQuery, [grade, feedback, submissionId], (err, result) => {
        if (err) {
            console.error('Error updating grade:', err);
            return res.status(500).json({ message: 'Failed to update grade' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        // 2. Insert notification using an INSERT...SELECT to grab the correct student_id
        const notifyQuery = `
            INSERT INTO notifications (user_id, message)
            SELECT student_id, ? 
            FROM submissions 
            WHERE id = ?;
        `;
        const notificationMessage = 'Your assignment has been graded.';

        db.query(notifyQuery, [notificationMessage, submissionId], (notifyErr) => {
            if (notifyErr) {
                console.error('Error creating notification:', notifyErr);
                // We still return 200 because the grade was successfully saved
                return res.status(200).json({ message: 'Grade saved, but notification failed' });
            }

            res.status(200).json({ message: 'Grade saved and student notified' });
        });
    });
});

module.exports = router;
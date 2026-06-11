const express = require('express');
const multer = require('multer');
const db = require('../config/db');
const { requireLecturer, requireLogin } = require('../middleware/authMiddleware');
const path = require('path');

const router = express.Router();

// --- Configuration ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/materials'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// --- Helper: Notify Students ---
async function notifyEnrolledStudents(courseId, materialTitle) {
    try {
        // Find all enrolled students
        const [students] = await db.promise().query(
            'SELECT user_id FROM enrollments WHERE course_id = ?', 
            [courseId]
        );

        if (students && students.length > 0) {
            const message = `New material uploaded: ${materialTitle}`;
            // Use bulk insert syntax for better performance
            const values = students.map(s => [s.user_id, message]);
            
            await db.promise().query(
                'INSERT INTO notifications (user_id, message) VALUES ?', 
                [values]
            );
        }
    } catch (err) {
        console.error('Notification error:', err);
    }
}

// --- Routes ---

// Upload Material
router.post('/materials', requireLecturer, upload.single('file'), async (req, res) => {
    const { course_id, title, material_type, description } = req.body;

    try {
        await db.promise().query(
            `INSERT INTO course_materials 
             (course_id, title, material_type, description, file_name, file_path, uploaded_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [course_id, title, material_type, description, req.file.filename, req.file.path, req.session.userId]
        );

        // Notify students in the background
        notifyEnrolledStudents(course_id, title);

        res.status(201).json({ message: 'Material uploaded' });
    } catch (err) {
        res.status(500).json({ message: 'Upload failed' });
    }
});

// Get Materials
router.get('/materials/:courseId', requireLogin, (req, res) => {
    db.query(
        'SELECT * FROM course_materials WHERE course_id = ? ORDER BY created_at DESC',
        [req.params.courseId],
        (err, result) => {
            if (err) return res.status(500).json({ message: 'Failed to fetch materials' });
            res.json(result);
        }
    );
});

// Delete Material
router.delete('/materials/:id', requireLecturer, (req, res) => {
    db.query('DELETE FROM course_materials WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ message: 'Delete failed' });
        res.json({ message: 'Deleted' });
    });
});

// Force Download Material
router.get('/materials/download/:id', requireLogin, (req, res) => {
    db.query('SELECT file_path, file_name FROM course_materials WHERE id = ?', [req.params.id], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ message: 'Material not found' });
        }
        
        // Resolve the absolute path to ensure express can find it
        const absolutePath = path.resolve(results[0].file_path);
        
        res.download(absolutePath, results[0].file_name, (downloadErr) => {
            if (downloadErr) {
                console.error('Download error:', downloadErr);
                if (!res.headersSent) {
                    res.status(500).json({ message: 'Error downloading file' });
                }
            }
        });
    });
});

module.exports = router;
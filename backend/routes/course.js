const express = require('express');
const db = require('../config/db');

const router = express.Router();

const {
  requireLogin,
  requireAdmin
} = require('../middleware/authMiddleware');

router.post('/courses', requireAdmin, (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required' });
  }

  db.query(
    'INSERT INTO courses (title, description) VALUES (?, ?)',
    [title, description],
    (err) => {
      if (err) {
        return res.status(500).json({ message: 'Course creation failed' });
      }

      res.status(201).json({ message: 'Course created successfully' });
    }
  );
});

router.get('/courses', (req, res) => {
  // PHASE 6 FIX: Using LEFT JOIN to users table instead of lecturers
  const query = `
    SELECT courses.*, users.username AS lecturer_name 
    FROM courses 
    LEFT JOIN users ON courses.lecturer_id = users.id
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching courses:', err);
      return res.status(500).json({ message: 'Failed to fetch courses' });
    }

    res.json(results);
  });
});

router.post('/enroll', requireLogin, (req, res) => {
  const { course_id } = req.body;

  if (!course_id) {
    return res.status(400).json({
      message: 'Course ID is required'
    });
  }

  db.query(
    'INSERT INTO enrollments (user_id, course_id) VALUES (?,?)',
    [
      req.session.userId,
      course_id
    ],
    (err) => {
      if (err) {
        /* duplicate enrollment */
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({
            message: 'Already enrolled'
          });
        }
        console.error(err);
        return res.status(500).json({
          message: 'Enrollment failed'
        });
      }

      res.status(201).json({
        message: 'Enrollment successful'
      });
    }
  );
});

router.get('/my-courses', requireLogin, (req, res) => {
  // PHASE 6 FIX: Using LEFT JOIN to users table instead of lecturers
  const query = `
    SELECT courses.*, users.username AS lecturer_name
    FROM courses
    INNER JOIN enrollments ON enrollments.course_id = courses.id
    LEFT JOIN users ON courses.lecturer_id = users.id
    WHERE enrollments.user_id = ?
  `;

  db.query(query, [req.session.userId], (err, results) => {
      if (err) {
        console.error('Error fetching enrolled courses:', err);
        return res.status(500).json({ message: 'Failed to fetch enrolled courses' });
      }

      res.json(results);
    }
  );
});

module.exports = router;
const express = require('express');
const db = require('../config/db');

const router = express.Router();

function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  next();
}

router.post('/courses', (req, res) => {
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
  db.query('SELECT * FROM courses', (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch courses' });
    }

    res.json(results);
  });
});

router.post('/enroll', requireLogin, (req, res) => {
  const { course_id } = req.body;

  if (!course_id) {
    return res.status(400).json({ message: 'Course ID is required' });
  }

  db.query(
    'INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)',
    [req.session.userId, course_id],
    (err) => {
      if (err) {
        return res.status(500).json({ message: 'Enrollment failed' });
      }

      res.status(201).json({ message: 'Enrollment successful' });
    }
  );
});

router.get('/my-courses', requireLogin, (req, res) => {
  db.query(
    `SELECT courses.*
     FROM courses
     INNER JOIN enrollments ON enrollments.course_id = courses.id
     WHERE enrollments.user_id = ?`,
    [req.session.userId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to fetch enrolled courses' });
      }

      res.json(results);
    }
  );
});

module.exports = router;

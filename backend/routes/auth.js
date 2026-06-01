const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/db');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword],
      (err) => {
        if (err) {
          return res.status(500).json({ message: 'Registration failed' });
        }

        res.status(201).json({ message: 'Registration successful' });
      }
    );
  } catch (err) {
    res.status(500).json({ message: 'Registration failed' });
  }
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  db.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    async (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Login failed' });
      }

      if (results.length === 0) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const user = results[0];
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.role = user.role;

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      });
    }
  );
});

router.get('/profile', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  res.json({
    userId: req.session.userId,
    username: req.session.username,
    role: req.session.role
  });
});

module.exports = router;

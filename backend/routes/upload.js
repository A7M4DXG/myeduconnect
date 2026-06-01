const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../config/db');

const router = express.Router();

function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  next();
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

router.post('/upload', requireLogin, upload.single('assignment'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Assignment file is required' });
  }

  db.query(
    'INSERT INTO uploads (user_id, filename) VALUES (?, ?)',
    [req.session.userId, req.file.filename],
    (err) => {
      if (err) {
        return res.status(500).json({ message: 'Upload failed' });
      }

      res.status(201).json({
        message: 'Upload successful',
        filename: req.file.filename,
        url: `/uploads/${req.file.filename}`
      });
    }
  );
});

router.get('/my-uploads', requireLogin, (req, res) => {
  db.query(
    'SELECT id, filename FROM uploads WHERE user_id = ?',
    [req.session.userId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to fetch uploads' });
      }

      const uploads = results.map((file) => ({
        ...file,
        url: path.posix.join('/uploads', file.filename)
      }));

      res.json(uploads);
    }
  );
});

module.exports = router;

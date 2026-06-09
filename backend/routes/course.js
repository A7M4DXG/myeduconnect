const express = require('express');
const db = require('../config/db');

const router = express.Router();

const {

requireLogin,

requireAdmin

}=require(

'../middleware/authMiddleware'

);

function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  next();
}

router.post(

'/courses',

requireAdmin,

(req,res)=>{  const { title, description } = req.body;

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
  // Using LEFT JOIN so courses without a lecturer still load correctly
  const query = `
    SELECT courses.*, lecturers.name AS lecturer_name 
    FROM courses 
    LEFT JOIN lecturers ON courses.lecturer_id = lecturers.id
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch courses' });
    }

    res.json(results);
  });
});

router.post('/enroll', requireLogin, (req, res) => {

  const { course_id } = req.body;

  if (!course_id){

    return res.status(400).json({

      message:'Course ID is required'

    });

  }

  db.query(

    'INSERT INTO enrollments (user_id, course_id) VALUES (?,?)',

    [

      req.session.userId,

      course_id

    ],

    (err)=>{

      if(err){

        /* duplicate enrollment */

        if(err.code==='ER_DUP_ENTRY'){

          return res.status(409).json({

            message:'Already enrolled'

          });

        }

        console.log(err);

        return res.status(500).json({

          message:'Enrollment failed'

        });

      }

      res.status(201).json({

        message:'Enrollment successful'

      });

    }

  );

});

router.get('/my-courses', requireLogin, (req, res) => {
  // Added LEFT JOIN to fetch lecturer name for enrolled courses as well
  const query = `
    SELECT courses.*, lecturers.name AS lecturer_name
    FROM courses
    INNER JOIN enrollments ON enrollments.course_id = courses.id
    LEFT JOIN lecturers ON courses.lecturer_id = lecturers.id
    WHERE enrollments.user_id = ?
  `;

  db.query(query, [req.session.userId], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to fetch enrolled courses' });
      }

      res.json(results);
    }
  );
});

module.exports = router;
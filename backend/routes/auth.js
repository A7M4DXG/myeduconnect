const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/db');

const router = express.Router();

router.post('/register', async (req,res)=>{

const {username,email,password}=req.body;

if(

!username ||

!email ||

!password

){

return res.status(400).json({

message:

'All fields are required'

});

}

try{

const hashedPassword=

await bcrypt.hash(

password,

10

);

db.query(

`

INSERT INTO users

(

username,

email,

password,

role

)

VALUES

(

?,

?,

?,

?

)

`,

[

username,

email,

hashedPassword,

'student'

],

(err)=>{

if(err){

/* duplicate username/email */

if(

err.code===

'ER_DUP_ENTRY'

){

return res.status(409).json({

message:

'Username or email already exists'

});

}

return res.status(500).json({

message:

'Registration failed'

});

}

res.status(201).json({

message:

'Registration successful'

});

}

);

}

catch{

res.status(500).json({

message:

'Registration failed'

});

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

// Full Profile Retrieval
router.get('/profile', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = req.session.userId;

  db.query('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [userId], (err, users) => {
    if (err || users.length === 0) {
      return res.status(500).json({ message: 'User not found' });
    }

    const user = users[0];
    
    // Base Response Object
    let profileData = {
      userId: user.id, // Kept for backwards compatibility with older dashboard scripts
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      enrolled_courses_count: 0,
      enrolled_courses: [],
      submissions_count: 0
    };

    // Get Submission Count
    db.query('SELECT COUNT(*) as count FROM submissions WHERE student_id = ?', [userId], (err, subResults) => {
      if (!err && subResults.length > 0) {
        profileData.submissions_count = subResults[0].count;
      }

      // If Student, get enrolled courses
      if (user.role === 'student') {
        db.query(`
          SELECT c.course_name 
          FROM enrollments e 
          JOIN courses c ON e.course_id = c.id 
          WHERE e.user_id = ?
        `, [userId], (err, courses) => {
          if (!err) {
            profileData.enrolled_courses = courses.map(c => c.course_name);
            profileData.enrolled_courses_count = courses.length;
          }
          return res.json(profileData);
        });
      } else {
        // Lecturer or Admin
        return res.json(profileData);
      }
    });
  });
});

// Update Profile Details (Username & Email only)
router.put('/profile', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { username, email } = req.body;
  
  if (!username || !email) {
    return res.status(400).json({ message: 'Username and email are required' });
  }

  db.query('UPDATE users SET username = ?, email = ? WHERE id = ?', [username, email, req.session.userId], (err) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Username or email already in use' });
      }
      return res.status(500).json({ message: 'Failed to update profile' });
    }

    // Update session variables
    req.session.username = username;
    
    res.json({ message: 'Profile updated successfully' });
  });
});

// Change Password
router.put('/profile/password', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Both current and new passwords are required' });
  }

  db.query('SELECT password FROM users WHERE id = ?', [req.session.userId], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(500).json({ message: 'User not found' });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    try {
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      
      db.query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, req.session.userId], (err) => {
        if (err) {
          return res.status(500).json({ message: 'Failed to update password' });
        }
        res.json({ message: 'Password successfully updated' });
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to secure password' });
    }
  });
});

module.exports = router;
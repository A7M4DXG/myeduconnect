const express=require('express');

const router=express.Router();

const db=require('../config/db');

const {

requireAdmin

}=require('../middleware/authMiddleware');


/* ======================

Create Course

====================== */

router.post(

'/admin/course',

requireAdmin,

(req,res)=>{

const {

course_code,

course_name,

course_category,

price,

duration_weeks,

description,

lecturer_id

}=req.body;

db.query(

`

INSERT INTO courses

(

course_code,

course_name,

course_category,

price,

duration_weeks,

description,

lecturer_id

)

VALUES

(

?,

?,

?,

?,

?,

?,

?

)

`,

[

course_code,

course_name,

course_category,

price,

duration_weeks,

description,

lecturer_id

],

(err)=>{

if(err){

return res.status(500).json({

message:

'Course creation failed'

});

}

res.status(201).json({

message:

'Course created'

});

}

);

}

);


/* ======================

Update Course

====================== */

router.put(

'/admin/course/:id',

requireAdmin,

(req,res)=>{

db.query(

`

UPDATE courses

SET ?

WHERE id=?

`,

[

req.body,

req.params.id

],

(err)=>{

if(err){

return res.status(500).json({

message:

'Update failed'

});

}

res.json({

message:

'Updated'

});

}

);

}

);


/* ======================

Delete Course

====================== */

router.delete(

'/admin/course/:id',

requireAdmin,

(req,res)=>{

db.query(

`

DELETE FROM courses

WHERE id=?

`,

[

req.params.id

],

(err)=>{

if(err){

return res.status(500).json({

message:

'Delete failed'

});

}

res.json({

message:

'Deleted'

});

}

);

}

);


/* ======================
   GET Stats
====================== */
router.get('/admin/stats', requireAdmin, (req, res) => {
    const queries = [
        new Promise((resolve, reject) =>
            db.query('SELECT COUNT(*) AS count FROM users', (e, r) => e ? reject(e) : resolve(r[0].count))),
        new Promise((resolve, reject) =>
            db.query('SELECT COUNT(*) AS count FROM courses', (e, r) => e ? reject(e) : resolve(r[0].count))),
        new Promise((resolve, reject) =>
            db.query('SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total FROM payments', (e, r) => e ? reject(e) : resolve(r[0]))),
        new Promise((resolve, reject) =>
            db.query('SELECT COUNT(*) AS count FROM enrollments', (e, r) => e ? reject(e) : resolve(r[0].count))),
    ];
    Promise.all(queries)
        .then(([users, courses, payments, enrollments]) => {
            res.json({ users, courses, payments: payments.count, revenue: payments.total, enrollments });
        })
        .catch(() => res.status(500).json({ message: 'Failed' }));
});

/* ======================
   GET All Users
====================== */
router.get('/admin/users', requireAdmin, (req, res) => {
    db.query(
        'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC',
        (err, results) => {
            if (err) return res.status(500).json({ message: 'Failed' });
            res.json(results);
        }
    );
});

/* ======================
   PUT Change User Role
====================== */
router.put('/admin/users/:id/role', requireAdmin, (req, res) => {
    const { role } = req.body;
    if (!['student', 'lecturer', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
    }
    db.query('UPDATE users SET role=? WHERE id=?', [role, req.params.id], (err) => {
        if (err) return res.status(500).json({ message: 'Failed' });
        res.json({ message: 'Role updated' });
    });
});

/* ======================
   DELETE User
====================== */
router.delete('/admin/users/:id', requireAdmin, (req, res) => {
    if (String(req.params.id) === String(req.session.userId)) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    db.query('DELETE FROM users WHERE id=?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ message: 'Failed' });
        res.json({ message: 'Deleted' });
    });
});

/* ======================
   GET All Courses (admin)
====================== */
router.get('/admin/all-courses', requireAdmin, (req, res) => {
    db.query(
        `SELECT courses.*, lecturers.name AS lecturer_name,
         COUNT(enrollments.id) AS enrollment_count
         FROM courses
         LEFT JOIN lecturers ON courses.lecturer_id = lecturers.id
         LEFT JOIN enrollments ON enrollments.course_id = courses.id
         GROUP BY courses.id
         ORDER BY courses.id DESC`,
        (err, results) => {
            if (err) return res.status(500).json({ message: 'Failed' });
            res.json(results);
        }
    );
});

/* ======================
   GET All Payments
====================== */
router.get('/admin/payments', requireAdmin, (req, res) => {
    db.query(
        `SELECT payments.*, users.username, users.email
         FROM payments
         LEFT JOIN users ON payments.user_id = users.id
         ORDER BY payments.created_at DESC`,
        (err, results) => {
            if (err) return res.status(500).json({ message: 'Failed' });
            res.json(results);
        }
    );
});

module.exports=router;
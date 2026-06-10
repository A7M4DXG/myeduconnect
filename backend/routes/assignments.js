const express=require('express');

const multer=require('multer');

const db=require('../config/db');

const {

requireLogin,

requireLecturer

}=require('../middleware/authMiddleware');

const router=express.Router();


/* ====================

UPLOAD CONFIG

==================== */

const storage=

multer.diskStorage({

destination:(req,file,cb)=>{

cb(

null,

'uploads/submissions'

);

},

filename:(req,file,cb)=>{

cb(

null,

Date.now()

+

'-'

+

file.originalname

);

}

});

const upload=

multer({

storage

});


/* ====================

CREATE ASSIGNMENT

LECTURER

==================== */

router.post(

'/assignments',

requireLecturer,

(req,res)=>{

db.query(

`

INSERT INTO assignments

SET ?

`,

[

{

course_id:

req.body.course_id,

title:

req.body.title,

description:

req.body.description,

due_date:

req.body.due_date,

max_marks:

req.body.max_marks,

created_by:

req.session.userId

}

],

(err)=>{

if(err){

return res.status(500).json({

message:

'Failed'

});

}

res.status(201).json({

message:

'Assignment created'

});

}

);

}

);


/* ====================

GET COURSE ASSIGNMENTS

==================== */

router.get(

'/assignments/:courseId',

requireLogin,

(req,res)=>{

db.query(

`

SELECT *

FROM assignments

WHERE course_id=?

ORDER BY due_date ASC

`,

[

req.params.courseId

],

(err,result)=>{

if(err){

return res.status(500).json({

message:

'Failed'

});

}

res.json(result);

}

);

}

);


/* ====================

SUBMIT ASSIGNMENT

==================== */

router.post(

'/submit-assignment',

requireLogin,

upload.single('file'),

(req,res)=>{

const {

assignment_id

}=req.body;


/* get due date */

db.query(

`

SELECT due_date

FROM assignments

WHERE id=?

`,

[assignment_id],

(err,result)=>{

if(err ||

!result.length){

return res.status(500).json({

message:

'Assignment missing'

});

}

const due=

new Date(

result[0].due_date

);

const now=

new Date();

const status=

now>due ?

'Late'

:

'Submitted';

db.query(

`

INSERT INTO submissions

(

assignment_id,

student_id,

file_name,

file_path,

status

)

VALUES

(

?,

?,

?,

?,

?

)

`,

[

assignment_id,

req.session.userId,

req.file.filename,

req.file.path,

status

],

(err)=>{

if(err){

return res.status(500).json({

message:

'Submit failed'

});

}

res.json({

message:

status

});

}

);

}

);

}

);


/* ====================

GET SUBMISSIONS

LECTURER

==================== */

router.get(

'/submissions/:assignmentId',

requireLecturer,

(req,res)=>{

db.query(

`

SELECT *

FROM submissions

WHERE assignment_id=?

`,

[

req.params.assignmentId

],

(err,result)=>{

if(err){

return res.status(500).json({

message:

'Failed'

});

}

res.json(result);

}

);

}

);


/* ====================
   GRADE SUBMISSION
   Lecturer only
==================== */

router.put(

'/submissions/:id/grade',

requireLecturer,

(req,res)=>{

const {

grade,

feedback

}=req.body;

db.query(

`

UPDATE submissions

SET grade=?,feedback=?

WHERE id=?

`,

[

grade,

feedback,

req.params.id

],

(err)=>{

if(err){

return res.status(500).json({

message:

'Failed'

});

}

res.json({

message:

'Graded'

});

}

);

}

);

module.exports=router;
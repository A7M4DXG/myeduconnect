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

module.exports=router;
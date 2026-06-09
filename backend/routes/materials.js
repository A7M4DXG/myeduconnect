const express=require('express');

const multer=require('multer');

const path=require('path');

const db=require('../config/db');

const {

requireLecturer,

requireLogin

}=require('../middleware/authMiddleware');

const router=express.Router();


/* ======================

MULTER CONFIG

====================== */

const storage=

multer.diskStorage({

destination:(req,file,cb)=>{

cb(

null,

'uploads/materials'

);

},

filename:(req,file,cb)=>{

cb(

null,

Date.now()+

'-'+

file.originalname

);

}

});

const upload=

multer({

storage

});


/* ======================

Upload Material

Lecturer only

====================== */

router.post(

'/materials',

requireLecturer,

upload.single('file'),

(req,res)=>{

const {

course_id,

title,

material_type,

description

}=req.body;

db.query(

`

INSERT INTO course_materials

(

course_id,

title,

material_type,

description,

file_name,

file_path,

uploaded_by

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

course_id,

title,

material_type,

description,

req.file.filename,

req.file.path,

req.session.userId

],

(err)=>{

if(err){

return res.status(500).json({

message:

'Upload failed'

});

}

res.status(201).json({

message:

'Material uploaded'

});

}

);

}

);


/* ======================

Get Materials

Logged users only

====================== */

router.get(

'/materials/:courseId',

requireLogin,

(req,res)=>{

db.query(

`

SELECT *

FROM course_materials

WHERE course_id=?

ORDER BY created_at DESC

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


/* ======================

Delete Material

Lecturer only

====================== */

router.delete(

'/materials/:id',

requireLecturer,

(req,res)=>{

db.query(

`

DELETE FROM course_materials

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
const express = require('express');

const router = express.Router();

const db = require('../config/db');

function requireLogin(req,res,next){

    if(!req.session.userId){

        return res.status(401).json({
            message:'Unauthorized'
        });

    }

    next();

}

/*
GET USER NOTIFICATIONS

returns latest notifications
*/

router.get(
'/notifications',
requireLogin,
(req,res)=>{

db.query(

`
SELECT *

FROM notifications

WHERE user_id=?

ORDER BY created_at DESC

LIMIT 20
`,

[req.session.userId],

(err,result)=>{

if(err){

return res.status(500).json({
message:'Database Error'
});

}

res.json(result);

}

);

});

module.exports=router;
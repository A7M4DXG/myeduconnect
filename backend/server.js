const express = require('express');
const db = require('./config/db');
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

db.connect((err)=>{

if (err) throw err;

console.log("Database Connected");

});

app.get('/', (req,res)=>{

res.send("MyEduConnect Backend Running");

});

app.listen(PORT,()=>{

console.log(`Server running on port ${PORT}`);

});

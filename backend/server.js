const express = require('express');
const session = require('express-session');
const db = require('./config/db');
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/course');
const uploadRoutes = require('./routes/upload');
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(session({
  secret: 'myeduconnectsecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false
  }
}));
app.use('/uploads', express.static('uploads'));
app.use('/', authRoutes);
app.use('/', courseRoutes);
app.use('/', uploadRoutes);

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

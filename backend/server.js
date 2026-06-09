const express = require('express');
const session = require('express-session');
const db = require('./config/db');
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/course');
const uploadRoutes = require('./routes/upload');
const cartRoutes = require('./routes/cart');
const notificationRoutes = require('./routes/notification');
const adminRoutes=require('./routes/admin');
const materialRoutes=require('./routes/materials');
const assignmentRoutes=require('./routes/assignments');
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
app.use(express.static('../frontend'));
app.use('/', authRoutes);
app.use('/', courseRoutes);
app.use('/', uploadRoutes);
app.use('/', notificationRoutes);
app.use('/', cartRoutes);
app.use('/',adminRoutes);
app.use('/',materialRoutes);
app.use('/',assignmentRoutes);

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

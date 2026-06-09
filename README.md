# MyEduConnect

A University Learning Management System (LMS) developed for the Ethical Hacking & Penetration Testing Assignment.

The platform simulates a real university portal where students can browse courses, enroll through a mock payment system, access learning materials, submit assignments, and receive notifications. Lecturers and administrators have dedicated management capabilities through role-based access control.

---

# Features

## Student Features

- User Registration & Login
- Secure Session Authentication
- Browse Available Courses
- Course Details Page
- Shopping Cart System
- Mock Payment Gateway
- Course Enrollment
- View Enrolled Courses
- Access Course Materials
- Submit Assignments
- Dashboard Activity Feed
- Notification System

---

## Lecturer Features

- Upload Course Materials
- Create Assignments
- View Student Submissions
- Manage Course Content

---

## Administrator Features

- Manage Courses
- Manage Users
- Assign Lecturers
- Access Administrative Controls

---

# Technology Stack

## Frontend

- HTML5
- CSS3
- JavaScript (Vanilla)

## Backend

- Node.js
- Express.js

## Database

- MySQL

## Authentication

- Express Session

## File Uploads

- Multer

---

# Project Structure

```text
myeduconnect/
│
├── backend/
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   ├── uploads/
│   └── server.js
│
├── frontend/
│   ├── css/
│   ├── js/
│   ├── dashboard.html
│   ├── courses.html
│   ├── course.html
│   ├── cart.html
│   ├── payment.html
│   └── assignment.html
│
├── database/
│   └── schema.sql
│
└── README.md
```

---

# Database Tables

The system currently uses the following tables:

```text
users
courses
lecturers
enrollments
cart
payments
notifications
course_materials
assignments
submissions
uploads
```

---

# Installation

## 1. Clone Repository

```bash
git clone https://github.com/A7M4DXG/myeduconnect.git
cd myeduconnect
```

---

## 2. Install Backend Dependencies

```bash
cd backend
npm install
```

---

## 3. Configure Environment Variables

Create:

```text
backend/.env
```

Add:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_PASSWORD
DB_NAME=myeduconnect
PORT=3000
```

---

## 4. Create Database

Open MySQL Workbench and run:

```sql
CREATE DATABASE IF NOT EXISTS myeduconnect;
USE myeduconnect;
```

---

## 5. Import Schema

Open:

```text
database/schema.sql
```

Execute the complete script.

Verify:

```sql
SHOW TABLES;
```

Expected tables:

```text
users
courses
lecturers
enrollments
cart
payments
notifications
course_materials
assignments
submissions
uploads
```

---

## 6. Start Server

```bash
cd backend
npm run dev
```

Expected output:

```text
Database Connected
Server running on port 3000
```

Open:

```text
http://localhost:3000
```

---

# User Roles

## Student

- Browse Courses
- Add Courses To Cart
- Make Mock Payments
- Enroll In Courses
- Access Materials
- Submit Assignments

## Lecturer

- Upload Course Materials
- Create Assignments
- View Student Submissions

## Admin

- Manage Courses
- Manage Users
- Administrative Controls

---

# Security Features

- Session-Based Authentication
- Password Hashing
- Role-Based Access Control
- Protected Routes
- Enrollment Duplication Prevention
- Cart Duplication Prevention

---

# Git Workflow

Before starting work:

```bash
git pull
```

After changes:

```bash
git add .
git commit -m "describe changes"
git push
```

---

# Team Rules

- Pull before coding
- Push frequently
- Never commit `.env`
- Never commit `node_modules`
- Never commit uploaded files
- Test before pushing

---

# Current Project Status

- [x] Authentication System
- [x] Registration & Login
- [x] Role Management
- [x] Course Enrollment
- [x] Shopping Cart
- [x] Mock Payment System
- [x] Notifications
- [x] Course Materials
- [x] Assignment System
- [x] Database Design
- [ ] Admin Dashboard UI
- [ ] Lecturer Dashboard UI
- [ ] Deliberate Vulnerabilities
- [ ] Docker Deployment
- [ ] Architecture Diagram
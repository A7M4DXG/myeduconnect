# MyEduConnect

A University Learning Management System (LMS) developed for the Ethical Hacking & Penetration Testing Assignment.

MyEduConnect simulates a modern university learning platform where students can browse courses, enroll through a mock payment system, access course materials, submit assignments, receive grades and notifications, while lecturers and administrators manage academic content through dedicated dashboards.

---

# Features

## Student Features

* User Registration & Login
* Secure Session Authentication
* Browse Available Courses
* Course Details Page
* Shopping Cart System
* Mock Payment Gateway
* Course Enrollment
* View Enrolled Courses
* Student Dashboard
* Access Course Materials
* Submit Assignments
* View Assignment Status
* Receive Notifications
* Activity Tracking

---

## Lecturer Features

* Lecturer Dashboard
* View Assigned Courses
* Upload Course Materials
* Create Assignments
* View Student Submissions
* Grade Assignments
* Provide Feedback
* Manage Course Content

---

## Administrator Features

* Admin Dashboard
* Manage Users
* Manage Courses
* Assign Lecturers To Courses
* View Platform Statistics
* Manage Academic Content

---

# Technology Stack

## Frontend

* HTML5
* CSS3
* JavaScript (Vanilla JS)

## Backend

* Node.js
* Express.js

## Database

* MySQL

## Authentication

* Express Session

## File Uploads

* Multer

## Security

* Bcrypt Password Hashing
* Session-Based Authentication
* Role-Based Access Control (RBAC)

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
│   │
│   ├── login.html
│   ├── register.html
│   ├── student-dashboard.html
│   ├── lecturer-dashboard.html
│   ├── admin-dashboard.html
│   ├── courses.html
│   ├── course.html
│   ├── course-details.html
│   ├── cart.html
│   ├── payment.html
│   ├── assignment.html
│   └── upload.html
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
enrollments
cart
payments
notifications
course_materials
assignments
submissions
uploads
```

## Note

The project no longer uses a separate `lecturers` table.

Lecturers are stored directly in the `users` table and differentiated using the `role` field:

```text
student
lecturer
admin
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

Open MySQL Workbench and execute:

```sql
CREATE DATABASE IF NOT EXISTS myeduconnect;
USE myeduconnect;
```

---

## 5. Import Schema

Import and execute:

```text
database/schema.sql
```

Verify:

```sql
SHOW TABLES;
```

Expected tables:

```text
users
courses
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

## 6. Start The Application

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

* Browse Courses
* Add Courses To Cart
* Complete Mock Payments
* Enroll In Courses
* Access Learning Materials
* Submit Assignments
* View Assignment Status
* Receive Notifications

## Lecturer

* View Assigned Courses
* Upload Learning Materials
* Create Assignments
* Manage Course Content
* View Student Submissions
* Grade Assignments
* Provide Feedback

## Administrator

* Manage Users
* Manage Courses
* Assign Lecturers
* Access Platform Statistics
* Monitor Academic Activity

---

# Authentication Flow

The system uses role-based redirection after login.

### Student

```text
student-dashboard.html
```

### Lecturer

```text
lecturer-dashboard.html
```

### Administrator

```text
admin-dashboard.html
```

Authentication is managed using:

* Express Session
* Bcrypt Password Hashing
* Protected Backend Routes

---

# Security Features

* Session-Based Authentication
* Password Hashing (bcrypt)
* Role-Based Access Control
* Protected Routes
* Enrollment Duplication Prevention
* Duplicate Submission Prevention
* Input Validation
* Access Restrictions Based On User Role

---

# Git Workflow

Before starting work:

```bash
git pull origin main
```

After completing work:

```bash
git add .
git commit -m "describe changes"
git push origin main
```

---

# Team Rules

* Pull Before Coding
* Push Frequently
* Never Commit `.env`
* Never Commit `node_modules`
* Never Commit Uploaded Files
* Test Before Pushing
* Use Feature Branches For Major Changes

---

# Recovery Tag

Current stable project checkpoint:

```text
stable-ui-merge
```

Restore:

```bash
git checkout stable-ui-merge
```

Create a recovery branch:

```bash
git checkout -b recovery stable-ui-merge
```

---

# Current Project Status

## Core System

* [x] Authentication System
* [x] Registration & Login
* [x] Session Management
* [x] Role-Based Access Control
* [x] Database Rebuild
* [x] Database Relationships

## Student Features

- [x] Student Dashboard
- [x] Browse Courses
- [x] Course Details
- [x] Shopping Cart
- [x] Mock Payment System
- [x] Course Enrollment
- [x] Notifications
- [x] Course Materials Access
- [x] Course Materials Download
- [x] Assignment Submission
- [x] Assignment Status Tracking
- [x] Grade & Feedback Viewing

## Lecturer Features

- [x] Lecturer Dashboard
- [x] Upload Materials
- [x] Manage Materials
- [x] Create Assignments
- [x] View Submissions
- [x] Grade Assignments
- [x] Provide Feedback

## Administrator Features

- [x] Admin Dashboard
- [x] User Management
- [x] Course Management
- [x] Lecturer Assignment

## Remaining Work

- [ ] Notification System Enhancements
- [ ] Deliberate Security Vulnerabilities
- [ ] Docker Deployment
- [ ] Architecture Diagram
- [ ] Final Security Testing
- [ ] Final Documentation
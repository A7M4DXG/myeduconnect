# MyEduConnect

A University Learning Management System (LMS) developed for the Ethical Hacking & Penetration Testing Assignment.

MyEduConnect simulates a modern university learning platform where students can browse courses, enroll through a mock payment system, access learning materials, submit assignments, receive grades and notifications, while lecturers and administrators manage academic content through dedicated dashboards.

---

# Features

## Student Features

* User Registration & Login
* Secure Session Authentication
* Browse Available Courses
* Search Courses
* Course Details Page
* Shopping Cart System
* Mock Payment Gateway
* Course Enrollment
* Student Dashboard
* Profile Management
* Edit Username & Email
* Change Password
* View Enrolled Courses
* Access Course Materials
* Download Learning Materials
* Submit Assignments
* View Submission Status
* View Grades & Feedback
* Notifications System
* Activity Tracking

---

## Lecturer Features

* Lecturer Dashboard
* View Assigned Courses
* Edit Course Information
* Edit Course Description
* Edit Course Category
* Upload Learning Materials
* Manage Materials
* Create Assignments
* Edit Assignments
* Delete Assignments
* View Student Submissions
* Grade Assignments
* Provide Feedback
* View Enrolled Students
* Course Statistics

---

## Administrator Features

* Admin Dashboard
* User Management
* Course Management
* Create Courses
* Edit Courses
* Delete Courses
* Dynamic Category Management
* Assign Lecturers To Courses
* View Platform Statistics
* Monitor Payments
* View Enrollments
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

* MySQL 8

## Authentication

* Express Session

## Security

* Bcrypt Password Hashing
* Session-Based Authentication
* Role-Based Access Control (RBAC)

## File Uploads

* Multer

## Containerization

* Docker
* Docker Compose

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
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── css/
│   ├── js/
│   ├── login.html
│   ├── register.html
│   ├── profile.html
│   ├── student-dashboard.html
│   ├── lecturer-dashboard.html
│   ├── admin-dashboard.html
│   ├── courses.html
│   ├── course.html
│   ├── course-details.html
│   ├── cart.html
│   ├── payment.html
│   └── ...
│
├── database/
│   └── schema.sql
│
├── Dockerfile
├── docker-compose.yml
│
└── README.md
```

---

# Database Tables

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

## User Roles

Users are stored in a single table and differentiated using the role field:

```text
student
lecturer
admin
```

---

# Authentication & Authorization

The system uses:

* Express Session
* Session Persistence
* Password Hashing with bcrypt
* Protected Routes
* Role-Based Access Control (RBAC)

After login users are redirected according to their role:

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

Role validation prevents unauthorized access to dashboards and protected resources.

---

# Profile Management

All authenticated users have access to:

* View Profile Information
* Update Username
* Update Email Address
* Change Password
* View Account Creation Date

### Student Profile Statistics

* Number of Enrolled Courses
* Enrolled Course Names
* Number of Assignment Submissions

---

# Course Management

Courses support:

* Course Code
* Course Name
* Category
* Description
* Duration
* Price
* Assigned Lecturer

### Dynamic Categories

Categories are loaded directly from the database.

Examples:

```text
Computer Science
Cybersecurity
Information Systems
Languages
Mathematics
Research
Software Engineering
Sports
University Studies
```

Administrators can create courses using existing categories stored in the database.

---

# Notifications System

Students receive notifications when:

* Assignments are submitted
* Materials are uploaded
* Assignments are graded
* Course-related activities occur

Notifications are displayed directly in the dashboard notification panel.

---

# Assignment Workflow

### Lecturer

1. Create Assignment
2. Edit Assignment
3. Delete Assignment
4. Review Student Submission
5. Grade Submission
6. Provide Feedback

### Student

1. Access Assignment
2. Upload Submission
3. Track Submission Status
4. View Grade
5. View Feedback

---

# Payment System

The system includes a mock payment gateway for demonstration purposes.

Features:

* Cart Checkout
* Enrollment Processing
* Payment Recording
* Payment History
* Admin Payment Monitoring

---

# Docker Deployment

## Build & Start Containers

```bash
docker compose up --build
```

## Run In Background

```bash
docker compose up --build -d
```

## Stop Containers

```bash
docker compose down
```

## Remove Containers & Database Volume

```bash
docker compose down -v
```

---

# Local Installation

## 1. Clone Repository

```bash
git clone https://github.com/A7M4DXG/myeduconnect.git
cd myeduconnect
```

## 2. Install Dependencies

```bash
cd backend
npm install
```

## 3. Configure Environment Variables

Create:

```text
backend/.env
```

Example:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_PASSWORD
DB_NAME=myeduconnect
PORT=3000
SESSION_SECRET=myeduconnect_secret
```

## 4. Create Database

```sql
CREATE DATABASE myeduconnect;
```

## 5. Import Schema

Import:

```text
database/schema.sql
```

## 6. Start Application

```bash
cd backend
npm start
```

Open:

```text
http://localhost:3000
```

---

# Security Features

* Session-Based Authentication
* Password Hashing (bcrypt)
* Protected Backend Routes
* Role-Based Access Control
* Duplicate Enrollment Prevention
* Duplicate Submission Prevention
* Server-Side Validation
* Session Validation
* Dashboard Access Protection

---

# Git Workflow

Pull latest changes:

```bash
git pull origin main
```

Commit changes:

```bash
git add .
git commit -m "Describe changes"
git push origin main
```

---

# Current Project Status

## Core System

* [x] Authentication System
* [x] Registration & Login
* [x] Session Management
* [x] Role-Based Access Control
* [x] User Profiles
* [x] Password Management
* [x] Database Integration

## Student Features

* [x] Student Dashboard
* [x] Browse Courses
* [x] Search Courses
* [x] Course Enrollment
* [x] Shopping Cart
* [x] Mock Payment System
* [x] Notifications
* [x] Course Materials Access
* [x] Materials Download
* [x] Assignment Submission
* [x] Grade & Feedback Viewing
* [x] Profile Management

## Lecturer Features

* [x] Lecturer Dashboard
* [x] Course Editing
* [x] Material Management
* [x] Assignment Creation
* [x] Assignment Editing
* [x] Assignment Deletion
* [x] Student Management
* [x] Submission Grading

## Administrator Features

* [x] Admin Dashboard
* [x] User Management
* [x] Course Management
* [x] Dynamic Categories
* [x] Lecturer Assignment
* [x] Payment Monitoring
* [x] Statistics Dashboard

## Deployment

* [x] Docker Containerization
* [x] Docker Compose Deployment
* [x] Cloudflare Tunnel Hosting

---

# Project Authors

Developed as part of the Ethical Hacking & Penetration Testing Assignment.

Team Project – MyEduConnect LMS

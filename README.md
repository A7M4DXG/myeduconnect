# MyEduConnect

Educational platform built for Ethical Hacking & Penetration Testing assignment.

---

# Project Structure

```text
myeduconnect/
├── backend/
├── frontend/
├── database/
└── README.md
```

---

# Requirements

- Node.js
- Git
- MySQL Server
- MySQL Workbench
- VS Code (recommended)

---

# Clone Project

```bash
git clone https://github.com/A7M4DXG/myeduconnect.git
cd myeduconnect
```

---

# Backend Setup

```bash
cd backend
npm install
```

The `node_modules` folder is ignored by Git and must be installed locally by each team member.

---

# Database Setup

Step 1:

Open MySQL Workbench.

Step 2:

Create the database:

```sql
CREATE DATABASE IF NOT EXISTS myeduconnect;
USE myeduconnect;
```

Step 3:

Open:

```text
database/schema.sql
```

Execute the entire script.

Step 4:

Verify:

```sql
SHOW TABLES;
```

Expected tables:

```text
users
courses
enrollments
uploads
```

---

# Environment Variables

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

Replace `YOUR_PASSWORD` with your local MySQL password.

---

# Running Backend

```bash
cd backend
npm run dev
```

Expected output:

```text
Database Connected
Server running on port 3000
```

Then open:

```text
http://localhost:3000
```

Expected:

```text
MyEduConnect Backend Running
```

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
- Keep commits small
- Test before pushing

---

# Current Features

- [ ] Login
- [ ] Register
- [ ] Courses
- [ ] Uploads
- [ ] Admin Panel
- [ ] Payment Mock

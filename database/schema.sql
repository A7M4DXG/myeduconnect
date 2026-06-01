CREATE DATABASE IF NOT EXISTS myeduconnect;

USE myeduconnect;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100),
  email VARCHAR(255),
  password VARCHAR(255),
  role VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  description TEXT
);

CREATE TABLE IF NOT EXISTS enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  course_id INT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE TABLE IF NOT EXISTS uploads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  filename VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

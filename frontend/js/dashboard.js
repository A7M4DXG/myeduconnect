const API_URL = 'http://localhost:3000';

async function loadCourses() {
  const list = document.getElementById('courseList');
  if (!list) {
    return;
  }

  const response = await fetch(`${API_URL}/courses`, {
    credentials: 'include'
  });

  if (!response.ok) {
    list.textContent = 'Unable to load courses.';
    return;
  }

  const courses = await response.json();
  list.innerHTML = '';

  courses.forEach((course) => {
    const item = document.createElement('div');
    item.className = 'course-item';
    item.innerHTML = `<h2>${course.title}</h2><p>${course.description || ''}</p>`;
    list.appendChild(item);
  });

  if (courses.length === 0) {
    list.textContent = 'No courses available.';
  }
}

async function uploadAssignment(event) {
  event.preventDefault();

  const form = event.target;
  const message = document.getElementById('message');
  const response = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    credentials: 'include',
    body: new FormData(form)
  });

  message.textContent = response.ok ? 'Upload successful.' : 'Upload failed. Please log in first.';
}

document.addEventListener('DOMContentLoaded', () => {
  loadCourses();

  const uploadForm = document.getElementById('uploadForm');
  if (uploadForm) {
    uploadForm.addEventListener('submit', uploadAssignment);
  }
});

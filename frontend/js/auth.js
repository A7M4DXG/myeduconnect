const API_URL = 'http://localhost:3000';

function setMessage(text) {
  const message = document.getElementById('message');
  if (message) {
    message.textContent = text;
  }
}

async function login(event) {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password })
  });

  if (response.ok) {
    window.location.href = 'dashboard.html';
    return;
  }

  setMessage('Invalid email or password.');
}

async function register(event) {
  event.preventDefault();

  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, email, password })
  });

const data = await response.json();

if(response.ok){

setMessage(

data.message ||

'Registration successful.'

);

return;

}

setMessage(

data.message ||

'Registration failed.'

);
}

async function logout() {
  window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const logoutButton = document.getElementById('logoutButton');

  if (loginForm) {
    loginForm.addEventListener('submit', login);
  }

  if (registerForm) {
    registerForm.addEventListener('submit', register);
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', logout);
  }
});

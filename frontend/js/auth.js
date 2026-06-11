/* frontend/js/auth.js */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const message = document.getElementById('message');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include', // CRITICAL: Keeps the user logged in
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    // Redirecting to your newly renamed files
                    if (data.user.role === 'admin') {
                        window.location.href = 'admin-dashboard.html';
                    } else if (data.user.role === 'lecturer') {
                        window.location.href = 'lecturer-dashboard.html';
                    } else {
                        window.location.href = 'student-dashboard.html';
                    }
                } else {
                    if (message) {
                        message.textContent = data.message || 'Login failed';
                    }
                }
            } catch (err) {
                if (message) {
                    message.textContent = 'An error occurred. Please try again.';
                }
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ username, email, password })
                });

                const data = await response.json();
                if (response.ok) {
                    if (message) {
                        message.style.color = '#1e8e3e';
                        message.textContent = 'Registration successful! Redirecting...';
                    }
                    setTimeout(() => window.location.href = 'login.html', 1500);
                } else {
                    if (message) {
                        message.style.color = '#d93025';
                        message.textContent = data.message || 'Registration failed';
                    }
                }
            } catch (err) {
                if (message) {
                    message.textContent = 'An error occurred.';
                }
            }
        });
    }
});
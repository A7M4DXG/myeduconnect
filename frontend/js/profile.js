document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    setupDropdown();
    setupForms();
});

function loadProfile() {
    fetch('/profile', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
        if (!response.ok) {
            window.location.replace('login.html');
            return null;
        }
        return response.json();
    })
    .then(data => {
        if (!data) return;

        // Set Nav and Global Info
        document.getElementById('navAvatarText').textContent = data.username.charAt(0).toUpperCase();
        document.getElementById('mainAvatar').textContent = data.username.charAt(0).toUpperCase();
        document.getElementById('dropdownUsername').textContent = data.username;
        
        // Form Fields
        document.getElementById('editUsername').value = data.username;
        document.getElementById('editEmail').value = data.email;

        // Display Info
        document.getElementById('displayUsername').textContent = data.username;
        document.getElementById('displayEmail').textContent = data.email;
        document.getElementById('displayRole').textContent = data.role;
        
        if (data.created_at) {
            const date = new Date(data.created_at);
            document.getElementById('displayJoined').textContent = date.toLocaleDateString('en-MY', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
        }

        // Stats UI elements
        const statsGrid = document.getElementById('studentStatsGrid');
        const coursesCard = document.getElementById('studentCoursesCard');
        const coursesList = document.getElementById('enrolledCoursesList');

        // Show/Hide specific sections based on role
        if (data.role !== 'student') {
            if (statsGrid) statsGrid.style.display = 'none';
            if (coursesCard) coursesCard.style.display = 'none';
        } else {
            if (statsGrid) statsGrid.style.display = 'grid';
            if (coursesCard) coursesCard.style.display = 'block';

            document.getElementById('statCourses').textContent = data.enrolled_courses_count || 0;
            document.getElementById('statSubmissions').textContent = data.submissions_count || 0;

            if (!data.enrolled_courses || data.enrolled_courses.length === 0) {
                coursesList.innerHTML = '<li style="color: #64748b;">Not enrolled in any courses yet</li>';
            } else {
                coursesList.innerHTML = data.enrolled_courses.map(courseName => 
                    `<li>${esc(courseName)}</li>`
                ).join('');
            }
        }

        // Setup Back to Dashboard Link dynamically based on Role
        setupDashboardLink(data.role);
    })
    .catch(() => {
        window.location.replace('login.html');
    });
}

function setupDashboardLink(role) {
    const dashBtn = document.getElementById('backToDashBtn');
    const brandLink = document.getElementById('brandLink');
    let target = 'login.html';

    if (role === 'student') target = 'student-dashboard.html';
    else if (role === 'lecturer') target = 'lecturer-dashboard.html';
    else if (role === 'admin') target = 'admin-dashboard.html';

    dashBtn.href = target;
    brandLink.href = target;
}

function setupForms() {
    const editForm = document.getElementById('editProfileForm');
    const passwordForm = document.getElementById('changePasswordForm');

    // Handle Profile Edit Update
    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = document.getElementById('editUsername').value.trim();
        const email = document.getElementById('editEmail').value.trim();

        if (!username || !email) {
            showToast('Username and email are required', 'error');
            return;
        }

        fetch('/profile', {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email })
        })
        .then(async res => {
            const data = await res.json();
            if (res.ok) {
                showToast(data.message || 'Profile updated successfully', 'success');
                // Reload profile data to sync UI
                loadProfile();
            } else {
                showToast(data.message || 'Failed to update profile', 'error');
            }
        })
        .catch(() => showToast('An error occurred while updating profile', 'error'));
    });

    // Handle Password Change
    passwordForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;

        if (newPassword !== confirmNewPassword) {
            showToast('New passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showToast('New password must be at least 6 characters long', 'error');
            return;
        }

        fetch('/profile/password', {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword })
        })
        .then(async res => {
            const data = await res.json();
            if (res.ok) {
                showToast(data.message || 'Password changed successfully', 'success');
                passwordForm.reset();
            } else {
                showToast(data.message || 'Failed to change password', 'error');
            }
        })
        .catch(() => showToast('An error occurred while changing password', 'error'));
    });
}

function setupDropdown() {
    const profileBtn = document.getElementById('profileDropdownBtn');
    const profileMenu = document.getElementById('profileMenu');
    
    if (profileBtn && profileMenu) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileMenu.classList.toggle('show');
        });
    }

    document.addEventListener('click', (e) => {
        if (profileBtn && profileMenu && !profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
            profileMenu.classList.remove('show');
        }
    });

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.replace('login.html');
        });
    }
}

function showToast(msg, type = '') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `toast show ${type}`;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { toast.className = 'toast'; }, 3000);
}

function esc(str) {
    return String(str)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
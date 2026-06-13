/* ========================================================
   Admin Dashboard — Merged (Timothee UI + Ahmed Backend)
======================================================== */

let allUsers    = [];
let allCourses  = [];
let allLecturers= []; // Added for Ahmed's lecturer matching

document.addEventListener('DOMContentLoaded', () => {
    guardAdmin();
    setupNav();
    setupDropdown();
    setupModal();
});

/* ── Auth guard (Strict RBAC) ── */
function guardAdmin() {
    fetch('/profile', { credentials: 'include' })
        .then(r => {
            if (!r.ok) {
                window.location.replace('login.html');
                return null;
            }
            return r.json();
        })
        .then(data => {
            if (!data) return;

            // --- STRICT RBAC ENFORCEMENT ---
            if (data.role === 'student') {
                window.location.replace('student-dashboard.html');
                return;
            } else if (data.role === 'lecturer') {
                window.location.replace('lecturer-dashboard.html');
                return;
            } else if (data.role !== 'admin') {
                window.location.replace('login.html');
                return;
            }

            // Apply UI updates if authenticated and authorized
            document.getElementById('dropdownUsername').textContent = data.username;
            document.getElementById('avatarText').textContent = data.username.charAt(0).toUpperCase();
            loadAll();
        })
        .catch(() => window.location.replace('login.html'));
}

/* ── Load everything ── */
function loadAll() {
    loadStats();
    loadUsers();
    loadCourses();
    loadPayments(); // Now fetching real DB data
    loadCategories(); // Fetch dynamic categories for Course Creation
}

/* ── Dynamic Category Loading ── */
function loadCategories() {
    fetch('/admin/categories', { credentials: 'include' })
        .then(r => r.ok ? r.json() : [])
        .then(categories => {
            const select = document.getElementById('fieldCourseCategory');
            if (!select) return;
            
            // Reset to default
            select.innerHTML = `
                <option value="" disabled selected>— Select Category —</option>
            `;
            
            // Append DB categories
            categories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat.course_category;
                opt.textContent = cat.course_category;
                select.appendChild(opt);
            });
            
            // Re-append custom category option
            select.innerHTML += `<option value="custom" style="font-weight: bold;">+ Add Custom Category</option>`;
        })
        .catch(err => console.error('Failed to load categories', err));
}

/* ── Stats (Ahmed API Map) ── */
function loadStats() {
    fetch('/admin/stats', { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(d => {
            if (!d) return;
            document.getElementById('statUsers').textContent       = d.totalUsers       ?? '0';
            document.getElementById('statCourses').textContent     = d.totalCourses     ?? '0';
            document.getElementById('statEnrollments').textContent = d.totalEnrollments ?? '0';
            document.getElementById('statRevenue').textContent     = '0.00'; 
        });
}

/* ── Users (Ahmed API Map) ── */
function loadUsers() {
    fetch('/admin/users', { credentials: 'include' })
        .then(r => r.ok ? r.json() : [])
        .then(data => {
            allUsers = Array.isArray(data) ? data : [];
            renderUsersTable(allUsers);
            renderRecentUsers(allUsers.slice(0, 5));
            document.getElementById('userCount').textContent = allUsers.length;
        });

    fetch('/admin/lecturers', { credentials: 'include' })
        .then(r => r.ok ? r.json() : [])
        .then(data => { allLecturers = data; });
}

function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!users.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading-row">No users found.</td></tr>';
        return;
    }
    tbody.innerHTML = users.map(u => `
        <tr>
            <td style="color:var(--muted)">${u.id}</td>
            <td><strong>${esc(u.username)}</strong></td>
            <td style="color:var(--muted)">${esc(u.email)}</td>
            <td><span class="role-badge role-${u.role}">${u.role}</span></td>
            <td style="color:var(--muted)">${fmtDate(u.created_at || new Date())}</td>
            <td>
                <select class="role-select" onchange="changeRole(${u.id}, this.value)">
                    <option value="student"  ${u.role==='student'  ? 'selected':''}>student</option>
                    <option value="lecturer" ${u.role==='lecturer' ? 'selected':''}>lecturer</option>
                    <option value="admin"    ${u.role==='admin'    ? 'selected':''}>admin</option>
                </select>
                <button class="btn-danger" onclick="deleteUser(${u.id}, '${esc(u.username)}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function renderRecentUsers(users) {
    const tbody = document.getElementById('recentUsersBody');
    if (!users.length) {
        tbody.innerHTML = '<tr><td colspan="3" class="loading-row">No users.</td></tr>';
        return;
    }
    tbody.innerHTML = users.map(u => `
        <tr>
            <td>${esc(u.username)}</td>
            <td style="color:var(--muted);font-size:.82rem">${esc(u.email)}</td>
            <td><span class="role-badge role-${u.role}">${u.role}</span></td>
        </tr>
    `).join('');
}

function changeRole(id, role) {
    fetch(`/admin/users/${id}/role`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
    })
    .then(r => r.ok ? loadUsers() : showToast('Failed to update role', 'error'))
    .catch(() => showToast('Error updating role', 'error'));
}

function deleteUser(id, username) {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    fetch(`/admin/users/${id}`, { method: 'DELETE', credentials: 'include' })
        .then(r => {
            if(r.ok) {
                showToast(`User "${username}" deleted`, 'success');
                loadUsers();
            }
        });
}

/* ── Courses (Ahmed API Map) ── */
function loadCourses() {
    fetch('/admin/courses', { credentials: 'include' })
        .then(r => r.ok ? r.json() : [])
        .then(data => {
            allCourses = Array.isArray(data) ? data : [];
            renderCoursesTable(allCourses);
            document.getElementById('courseCount').textContent = allCourses.length;
        });
}

function renderCoursesTable(courses) {
    const tbody = document.getElementById('coursesTableBody');

    if (!courses.length) {
        tbody.innerHTML =
            '<tr><td colspan="8" class="loading-row">No courses yet.</td></tr>';
        return;
    }

    tbody.innerHTML = courses.map(c => `
        <tr>
            <td style="color:var(--muted)">${c.id}</td>
            <td>
                <code style="background:#f0f2f5;padding:2px 6px;border-radius:4px;font-size:.82rem">
                    ${esc(c.course_code || '—')}
                </code>
            </td>
            <td><strong>${esc(c.course_name || '—')}</strong></td>
            <td style="color:var(--muted)">
                ${esc(c.course_category || '—')}
            </td>
            <td>${Number(c.price || 0).toFixed(2)}</td>
            <td style="color:var(--muted)">
                ${esc(c.lecturer_name || 'None')}
            </td>
            <td style="text-align:center">
                ${c.enrollments || 0}
            </td>
            <td>
                <button class="btn-danger"
                    onclick="deleteCourse(${c.id}, '${esc(c.course_name || '').replace(/'/g, "\\'")}')">
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
}

function deleteCourse(id, name) {
    if (!confirm(`Delete course "${name}"?`)) return;
    fetch(`/admin/course/${id}`, { method: 'DELETE', credentials: 'include' })
        .then(r => {
            if(r.ok) {
                showToast('Course deleted', 'success');
                loadCourses();
                loadCategories(); // Category might be empty if last course deleted
            }
        });
}

/* ── Payments & Revenue (REAL DATABASE INTEGRATION) ── */
function loadPayments() {
    fetch('/admin/payments', { credentials: 'include' })
        .then(r => r.ok ? r.json() : [])
        .then(payments => {
            const data = Array.isArray(payments) ? payments : [];
            
            // Calculate Total Revenue
            const totalRevenue = data.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
            
            // Update UI counters
            document.getElementById('paymentCount').textContent = data.length;
            document.getElementById('totalRevenueLabel').textContent = totalRevenue.toFixed(2);
            
            const statRev = document.getElementById('statRevenue');
            if (statRev) statRev.textContent = totalRevenue.toFixed(2); // Overwrites the 0.00 from loadStats

            renderPaymentsTable(data);
            renderRecentPayments(data.slice(0, 5)); // Show 5 most recent on Overview
        })
        .catch(err => {
            console.error('Failed to load payments', err);
            renderPaymentsTable([]);
            renderRecentPayments([]);
        });
}

function renderPaymentsTable(payments) {
    const tbody = document.getElementById('paymentsTableBody');
    if (!payments.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading-row">No payments recorded yet.</td></tr>';
        return;
    }
    
    tbody.innerHTML = payments.map((p, index) => {
        const statusClass = (p.payment_status || 'completed').toLowerCase();
        return `
            <tr>
                <td style="color:var(--muted)">${index + 1}</td>
                <td><strong>${esc(p.username || 'Unknown')}</strong></td>
                <td style="color:var(--muted)">${esc(p.email || '—')}</td>
                <td><strong>${Number(p.amount || 0).toFixed(2)}</strong></td>
                <td><span style="background:#e8eaed;padding:4px 8px;border-radius:4px;font-size:0.85rem">${esc(p.payment_method || '—')}</span></td>
                <td><span class="status-badge status-${statusClass}" style="text-transform:capitalize;">${esc(p.payment_status || 'Completed')}</span></td>
                <td style="color:var(--muted)">${fmtDate(p.paid_at || new Date())}</td>
            </tr>
        `;
    }).join('');
}

function renderRecentPayments(payments) {
    const tbody = document.getElementById('recentPaymentsBody');
    if (!payments.length) {
        tbody.innerHTML = '<tr><td colspan="3" class="loading-row">No recent payments.</td></tr>';
        return;
    }
    
    tbody.innerHTML = payments.map(p => {
        const statusClass = (p.payment_status || 'completed').toLowerCase();
        return `
            <tr>
                <td><strong>${esc(p.username || 'Unknown')}</strong></td>
                <td>RM ${Number(p.amount || 0).toFixed(2)}</td>
                <td><span class="status-badge status-${statusClass}" style="text-transform:capitalize;">${esc(p.payment_status || 'Completed')}</span></td>
            </tr>
        `;
    }).join('');
}

/* ── Create Course Modal (Ahmed API Map) ── */
function setupModal() {
    const modal       = document.getElementById('createCourseModal');
    const openBtn     = document.getElementById('openCreateCourseModal');
    const closeBtn    = document.getElementById('closeCreateCourseModal');
    const cancelBtn   = document.getElementById('cancelCreateCourse');
    const form        = document.getElementById('createCourseForm');
    const categorySelect = document.getElementById('fieldCourseCategory');
    const customCategoryInput = document.getElementById('customCategoryInput');

    openBtn.addEventListener('click',  () => modal.classList.add('open'));
    closeBtn.addEventListener('click', () => closeModal());
    cancelBtn.addEventListener('click',() => closeModal());
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

    // Handle Custom Category Toggle
    if (categorySelect) {
        categorySelect.addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                customCategoryInput.style.display = 'block';
                customCategoryInput.setAttribute('required', 'true');
            } else {
                customCategoryInput.style.display = 'none';
                customCategoryInput.removeAttribute('required');
                customCategoryInput.value = '';
            }
        });
    }

    form.addEventListener('submit', e => {
        e.preventDefault();
        const msg = document.getElementById('courseFormMsg');
        msg.textContent = '';
        msg.className = 'form-msg';

        let finalCategory = categorySelect.value;
        if (finalCategory === 'custom') {
            finalCategory = customCategoryInput.value.trim();
        }

        const body = {
            course_name:     document.getElementById('fieldCourseName').value.trim(),
            course_code:     document.getElementById('fieldCourseCode').value.trim(),
            course_category: finalCategory,
            description:     document.getElementById('fieldDescription').value.trim(),
            price:           parseFloat(document.getElementById('fieldPrice').value) || 0,
            duration_weeks:  parseInt(document.getElementById('fieldDuration').value) || 14,
            lecturer_id:     parseInt(document.getElementById('fieldLecturerId').value) || null,
        };

        fetch('/admin/course', {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
        .then(r => {
            if(r.ok) {
                msg.textContent = 'Course created successfully!';
                msg.className = 'form-msg success';
                form.reset();
                customCategoryInput.style.display = 'none';
                customCategoryInput.removeAttribute('required');
                loadCourses();
                loadStats();
                loadCategories(); // Refresh dynamic category list
                setTimeout(() => closeModal(), 1200);
            } else {
                msg.textContent = 'Failed to create course.';
            }
        });
    });

    function closeModal() {
        modal.classList.remove('open');
        document.getElementById('courseFormMsg').textContent = '';
        form.reset();
        if (customCategoryInput) {
            customCategoryInput.style.display = 'none';
            customCategoryInput.removeAttribute('required');
        }
    }
}

/* ── Sidebar navigation ── */
function setupNav() {
    document.querySelectorAll('.sidebar-item').forEach(btn => {
        btn.addEventListener('click', () => switchSection(btn.dataset.section));
    });

    document.getElementById('userSearch').addEventListener('input', e => {
        const q = e.target.value.toLowerCase();
        const filtered = allUsers.filter(u =>
            u.username.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q)
        );
        renderUsersTable(filtered);
    });
}

function switchSection(name) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));
    document.getElementById(`section-${name}`).classList.add('active');
    document.querySelector(`[data-section="${name}"]`).classList.add('active');
}

/* ── Dropdown / Logout ── */
function setupDropdown() {
    const btn  = document.getElementById('profileDropdownBtn');
    const menu = document.getElementById('profileMenu');
    btn.addEventListener('click', e => { e.stopPropagation(); menu.classList.toggle('show'); });
    document.addEventListener('click', () => menu.classList.remove('show'));
    document.getElementById('logoutBtn').addEventListener('click', () => {
        window.location.replace('login.html');
    });
}

/* ── Helpers ── */
function esc(str) {
    return String(str)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtDate(raw) {
    if (!raw) return '—';
    const d = new Date(raw);
    return d.toLocaleDateString('en-MY', { day:'2-digit', month:'short', year:'numeric' });
}

function showToast(msg, type = '') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `toast show ${type}`;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { toast.className = 'toast'; }, 3000);
}
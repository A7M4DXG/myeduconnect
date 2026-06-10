/* ========================================================
   Admin Dashboard — MyEduConnect
======================================================== */

let allUsers    = [];
let allCourses  = [];
let allPayments = [];

document.addEventListener('DOMContentLoaded', () => {
    guardAdmin();
    setupNav();
    setupDropdown();
    setupModal();
});

/* ── Auth guard ── */
function guardAdmin() {
    fetch('/profile', { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
            if (!data || data.role !== 'admin') {
                window.location.replace('login.html');
                return;
            }
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
    loadPayments();
}

/* ── Stats ── */
function loadStats() {
    fetch('/admin/stats', { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(d => {
            if (!d) return;
            document.getElementById('statUsers').textContent       = d.users       ?? '—';
            document.getElementById('statCourses').textContent     = d.courses     ?? '—';
            document.getElementById('statRevenue').textContent     = Number(d.revenue).toFixed(2);
            document.getElementById('statEnrollments').textContent = d.enrollments ?? '—';
        });
}

/* ── Users ── */
function loadUsers() {
    fetch('/admin/users', { credentials: 'include' })
        .then(r => r.ok ? r.json() : [])
        .then(data => {
            allUsers = Array.isArray(data) ? data : [];
            renderUsersTable(allUsers);
            renderRecentUsers(allUsers.slice(0, 5));
            document.getElementById('userCount').textContent = allUsers.length;
        });
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
            <td style="color:var(--muted)">${fmtDate(u.created_at)}</td>
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
    .then(r => r.json())
    .then(d => {
        showToast(d.message === 'Role updated' ? `Role updated to ${role}` : d.message,
                  d.message === 'Role updated' ? 'success' : 'error');
        if (d.message === 'Role updated') loadUsers();
    });
}

function deleteUser(id, username) {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    fetch(`/admin/users/${id}`, { method: 'DELETE', credentials: 'include' })
        .then(r => r.json())
        .then(d => {
            showToast(d.message === 'Deleted' ? `User "${username}" deleted` : d.message,
                      d.message === 'Deleted' ? 'success' : 'error');
            if (d.message === 'Deleted') loadUsers();
        });
}

/* ── Courses ── */
function loadCourses() {
    fetch('/admin/all-courses', { credentials: 'include' })
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
        tbody.innerHTML = '<tr><td colspan="8" class="loading-row">No courses yet.</td></tr>';
        return;
    }
    tbody.innerHTML = courses.map(c => `
        <tr>
            <td style="color:var(--muted)">${c.id}</td>
            <td><code style="background:#f0f2f5;padding:2px 6px;border-radius:4px;font-size:.82rem">${esc(c.course_code||'—')}</code></td>
            <td><strong>${esc(c.course_name||'—')}</strong></td>
            <td style="color:var(--muted)">${esc(c.course_category||'—')}</td>
            <td>${Number(c.price).toFixed(2)}</td>
            <td style="color:var(--muted)">${esc(c.lecturer_name||'—')}</td>
            <td style="text-align:center">${c.enrollment_count}</td>
            <td>
                <button class="btn-danger" onclick="deleteCourse(${c.id}, '${esc(c.course_name||'').replace(/'/g,"\\'")}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function deleteCourse(id, name) {
    if (!confirm(`Delete course "${name}"?`)) return;
    fetch(`/admin/course/${id}`, { method: 'DELETE', credentials: 'include' })
        .then(r => r.json())
        .then(d => {
            showToast(d.message === 'Deleted' ? `Course deleted` : d.message,
                      d.message === 'Deleted' ? 'success' : 'error');
            if (d.message === 'Deleted') loadCourses();
        });
}

/* ── Payments ── */
function loadPayments() {
    fetch('/admin/payments', { credentials: 'include' })
        .then(r => r.ok ? r.json() : [])
        .then(data => {
            allPayments = Array.isArray(data) ? data : [];
            renderPaymentsTable(allPayments);
            renderRecentPayments(allPayments.slice(0, 5));
            document.getElementById('paymentCount').textContent = allPayments.length;
            const total = allPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
            document.getElementById('totalRevenueLabel').textContent = total.toFixed(2);
        });
}

function renderPaymentsTable(payments) {
    const tbody = document.getElementById('paymentsTableBody');
    if (!payments.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading-row">No payments recorded.</td></tr>';
        return;
    }
    tbody.innerHTML = payments.map(p => {
        const st = (p.status || 'pending').toLowerCase();
        return `
        <tr>
            <td style="color:var(--muted)">${p.id}</td>
            <td>${esc(p.username || '—')}</td>
            <td style="color:var(--muted);font-size:.82rem">${esc(p.email || '—')}</td>
            <td><strong>MYR ${Number(p.amount).toFixed(2)}</strong></td>
            <td style="color:var(--muted)">${esc(p.payment_method || '—')}</td>
            <td><span class="status-badge status-${st}">${st}</span></td>
            <td style="color:var(--muted)">${fmtDate(p.created_at)}</td>
        </tr>`;
    }).join('');
}

function renderRecentPayments(payments) {
    const tbody = document.getElementById('recentPaymentsBody');
    if (!payments.length) {
        tbody.innerHTML = '<tr><td colspan="3" class="loading-row">No payments.</td></tr>';
        return;
    }
    tbody.innerHTML = payments.map(p => {
        const st = (p.status || 'pending').toLowerCase();
        return `
        <tr>
            <td>${esc(p.username || '—')}</td>
            <td>MYR ${Number(p.amount).toFixed(2)}</td>
            <td><span class="status-badge status-${st}">${st}</span></td>
        </tr>`;
    }).join('');
}

/* ── Create Course Modal ── */
function setupModal() {
    const modal       = document.getElementById('createCourseModal');
    const openBtn     = document.getElementById('openCreateCourseModal');
    const closeBtn    = document.getElementById('closeCreateCourseModal');
    const cancelBtn   = document.getElementById('cancelCreateCourse');
    const form        = document.getElementById('createCourseForm');

    openBtn.addEventListener('click',  () => modal.classList.add('open'));
    closeBtn.addEventListener('click', () => closeModal());
    cancelBtn.addEventListener('click',() => closeModal());
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

    form.addEventListener('submit', e => {
        e.preventDefault();
        const msg = document.getElementById('courseFormMsg');
        msg.textContent = '';
        msg.className = 'form-msg';

        const body = {
            course_code:     document.getElementById('fieldCourseCode').value.trim(),
            course_name:     document.getElementById('fieldCourseName').value.trim(),
            course_category: document.getElementById('fieldCourseCategory').value,
            price:           parseFloat(document.getElementById('fieldPrice').value) || 0,
            duration_weeks:  parseInt(document.getElementById('fieldDuration').value) || 14,
            description:     document.getElementById('fieldDescription').value.trim(),
            lecturer_id:     parseInt(document.getElementById('fieldLecturerId').value) || null,
        };

        fetch('/admin/course', {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
        .then(r => r.json())
        .then(d => {
            if (d.message === 'Course created') {
                msg.textContent = 'Course created successfully!';
                msg.className = 'form-msg success';
                form.reset();
                loadCourses();
                setTimeout(() => closeModal(), 1200);
            } else {
                msg.textContent = d.message || 'Failed to create course.';
            }
        });
    });

    function closeModal() {
        modal.classList.remove('open');
        document.getElementById('courseFormMsg').textContent = '';
        form.reset();
    }
}

/* ── Sidebar navigation ── */
function setupNav() {
    document.querySelectorAll('.sidebar-item').forEach(btn => {
        btn.addEventListener('click', () => switchSection(btn.dataset.section));
    });

    // User search
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

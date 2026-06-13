/* ========================================================
   Lecturer Dashboard — Merged (Timothee UI + Ahmed Backend)
======================================================== */

let myCourses    = [];
let myAssignments = {};   // keyed by courseId

// Custom Confirmation State
let confirmActionCallback = null;

document.addEventListener('DOMContentLoaded', () => {
    guardLecturer();
    setupSidebar();
    setupDropdown();
    setupModals();
});

/* ── Auth guard (Strict RBAC) ── */
function guardLecturer() {
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
            } else if (data.role === 'admin') {
                window.location.replace('admin-dashboard.html');
                return;
            } else if (data.role !== 'lecturer') {
                window.location.replace('login.html');
                return;
            }

            // Apply UI updates if authenticated and authorized
            document.getElementById('dropdownUsername').textContent = data.username;
            document.getElementById('avatarText').textContent = data.username.charAt(0).toUpperCase();
            document.getElementById('welcomeLec').textContent = `Welcome back, ${data.username}!`;
            loadAll();
        })
        .catch(() => window.location.replace('login.html'));
}

/* ── Boot ── */
function loadAll() {
    loadCoursesAndStats();
}

/* ── Courses & Stats (Ahmed API Map) ── */
function loadCoursesAndStats() {
    fetch('/lecturer/courses', {
        credentials: 'include'
    })
    .then(r => r.ok ? r.json() : [])
    .then(coursesData => {
        myCourses = Array.isArray(coursesData) ? coursesData : [];
        renderOverviewCourses(myCourses);
        populateCourseSelects(myCourses);
        loadAllAssignments(myCourses);
    })
    .catch(err => console.error('Failed to load courses:', err));

    fetch('/lecturer/stats', {
        credentials: 'include'
    })
    .then(r => r.ok ? r.json() : {})
    .then(stats => {
        document.getElementById('statCourses').textContent = stats.courses || 0;
        document.getElementById('statStudents').textContent = stats.students || 0;
        document.getElementById('statAssignments').textContent = stats.assignments || 0;
        document.getElementById('statSubmissions').textContent = stats.submissions || 0;
    })
    .catch(err => console.error('Failed to load stats:', err));
}

function renderOverviewCourses(courses) {
    const tbody = document.getElementById('overviewCoursesBody');

    if (!courses.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading-row">No courses assigned to your account.</td></tr>';
        return;
    }

    tbody.innerHTML = courses.map(c => `
        <tr>
            <td>
                <code style="background:#f0f2f5;padding:2px 6px;border-radius:4px;font-size:.82rem">
                    ${esc(c.course_code || '—')}
                </code>
            </td>
            <td><strong>${esc(c.course_name || '—')}</strong></td>
            <td style="color:var(--muted)">${esc(c.course_category || '—')}</td>
            <td style="text-align:center">${c.enrollment_count || 0}</td>
            <td>
                <button class="btn-sm btn-primary" onclick="openEditCourseModal(${c.id})">Edit Course</button>
            </td>
        </tr>
    `).join('');
}

function populateCourseSelects(courses) {
    const selects = [
        'assignCourseSelect', 'assignFilterCourse',
        'matCourseSelect', 'matFilterCourse',
        'studentCourseSelect', 'subCourseSelect'
    ];
    selects.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const first = el.options[0];
        el.innerHTML = '';
        el.appendChild(first);
        courses.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = `${c.course_code || 'CRS'} — ${c.course_name}`;
            el.appendChild(opt);
        });
    });
}

/* ── Assignments (Ahmed API Map) ── */
function loadAllAssignments(courses) {
    if (!courses.length) return;
    Promise.all(courses.map(c =>
        fetch(`/assignments/${c.id}`, { credentials: 'include' })
            .then(r => r.ok ? r.json() : [])
            .then(list => ({ courseId: c.id, list }))
    )).then(results => {
        let totalAssigments = 0;
        results.forEach(r => { 
            myAssignments[r.courseId] = r.list; 
            totalAssigments += r.list.length;
        });
        document.getElementById('statAssignments').textContent = totalAssigments || '0';
        renderAssignmentsTable('');
        setupAssignmentForm();
        setupAssignmentFilter();
        setupSubmissionsPanel();
    });
}

function renderAssignmentsTable(filterCourseId) {
    const tbody = document.getElementById('assignmentsTableBody');
    let rows = [];
    myCourses.forEach(c => {
        if (filterCourseId && String(c.id) !== String(filterCourseId)) return;
        const list = myAssignments[c.id] || [];
        list.forEach(a => {
            rows.push({ ...a, courseName: `${c.course_code || 'CRS'} — ${c.course_name}` });
        });
    });
    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading-row">No assignments found.</td></tr>';
        return;
    }
    tbody.innerHTML = rows.map(a => `
        <tr>
            <td><strong>${esc(a.title)}</strong></td>
            <td style="color:var(--muted);font-size:.82rem">${esc(a.courseName)}</td>
            <td style="color:var(--muted)">${fmtDate(a.due_date)}</td>
            <td style="text-align:center">${a.max_marks || 100}</td>
            <td>
                <div style="display:flex;gap:8px;">
                    <button class="btn-sm btn-success" onclick="viewSubmissions(${a.course_id}, ${a.id})">
                        View Submissions
                    </button>
                    <button class="btn-sm btn-primary" onclick="openEditAssignModal(${a.id}, ${a.course_id})">
                        Edit
                    </button>
                    <button class="btn-sm btn-danger" onclick="deleteAssignment(${a.id})">
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function setupAssignmentForm() {
    const form = document.getElementById('createAssignmentForm');
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const msg = document.getElementById('assignFormMsg');
        msg.textContent = '';
        msg.className = 'form-msg';

        const body = {
            course_id:   document.getElementById('assignCourseSelect').value,
            title:       document.getElementById('assignTitle').value.trim(),
            description: document.getElementById('assignDesc').value.trim(),
            due_date:    document.getElementById('assignDue').value,
            max_marks:   parseInt(document.getElementById('assignMax').value) || 100,
        };

        if (!body.course_id) { msg.textContent = 'Please select a course.'; return; }

        const r = await fetch('/assignments', {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        if (r.ok) {
            msg.textContent = 'Assignment created!';
            msg.className = 'form-msg success';
            form.reset();
            showToast('Assignment created', 'success');
            loadAllAssignments(myCourses);
        } else {
            msg.textContent = 'Failed to create assignment.';
        }
    });
}

function setupAssignmentFilter() {
    document.getElementById('assignFilterCourse').addEventListener('change', e => {
        renderAssignmentsTable(e.target.value);
    });
}

function viewSubmissions(courseId, assignId) {
    switchTab('submissions');
    document.getElementById('subCourseSelect').value = courseId;
    populateAssignmentSelect(courseId, assignId);
}

function deleteAssignment(id) {
    openConfirmModal('Are you sure you want to delete this assignment?', async () => {
        try {
            const r = await fetch(`/assignments/${id}`, {
                method: 'DELETE', credentials: 'include'
            });
            if(r.ok) {
                showToast('Assignment deleted successfully', 'success');
                loadAllAssignments(myCourses); 
            } else {
                const data = await r.json().catch(() => ({}));
                showToast(data.message || 'Failed to delete assignment', 'error');
            }
        } catch(err) {
            showToast('Error deleting assignment', 'error');
        }
    });
}

/* ── MODALS (Edit Course, Edit Assignment, Confirm Delete) ── */
function setupModals() {
    document.getElementById('confirmActionBtn').addEventListener('click', () => {
        if (confirmActionCallback) confirmActionCallback();
        closeConfirmModal();
    });
    document.getElementById('cancelConfirmBtn').addEventListener('click', closeConfirmModal);

    // Edit Course Submit
    document.getElementById('editCourseForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editCourseId').value;
        const body = {
            course_name: document.getElementById('editCourseName').value.trim(),
            course_category: document.getElementById('editCourseCategory').value.trim(),
            description: document.getElementById('editCourseDesc').value.trim()
        };
        
        try {
            const r = await fetch(`/lecturer/courses/${id}`, {
                method: 'PUT', credentials: 'include',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(body)
            });
            const data = await r.json().catch(() => ({}));
            if (r.ok) {
                showToast(data.message || 'Course updated successfully', 'success');
                closeEditCourseModal();
                loadCoursesAndStats(); 
            } else {
                showToast(data.message || 'Failed to update course', 'error');
            }
        } catch(err) {
            showToast('Error updating course', 'error');
        }
    });

    // Edit Assignment Submit
    document.getElementById('editAssignmentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editAssignId').value;
        const body = {
            title: document.getElementById('editAssignTitle').value.trim(),
            description: document.getElementById('editAssignDesc').value.trim(),
            due_date: document.getElementById('editAssignDue').value,
            max_marks: parseInt(document.getElementById('editAssignMax').value) || 100
        };
        
        try {
            const r = await fetch(`/assignments/${id}`, {
                method: 'PUT', credentials: 'include',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(body)
            });
            const data = await r.json().catch(() => ({}));
            if (r.ok) {
                showToast(data.message || 'Assignment updated successfully', 'success');
                closeEditAssignModal();
                loadAllAssignments(myCourses); 
            } else {
                showToast(data.message || 'Failed to update assignment', 'error');
            }
        } catch(err) {
            showToast('Error updating assignment', 'error');
        }
    });

    window.addEventListener('click', e => {
        if (e.target.id === 'editCourseModal') closeEditCourseModal();
        if (e.target.id === 'editAssignmentModal') closeEditAssignModal();
        if (e.target.id === 'deleteConfirmModal') closeConfirmModal();
    });
}

function openConfirmModal(message, callback) {
    document.getElementById('confirmModalMessage').textContent = message;
    confirmActionCallback = callback;
    document.getElementById('deleteConfirmModal').classList.add('open');
}

function closeConfirmModal() {
    document.getElementById('deleteConfirmModal').classList.remove('open');
    confirmActionCallback = null;
}

function openEditCourseModal(id) {
    const course = myCourses.find(c => c.id === id);
    if(!course) return;
    document.getElementById('editCourseId').value = course.id;
    document.getElementById('editCourseName').value = course.course_name || '';
    document.getElementById('editCourseCategory').value = course.course_category || '';
    document.getElementById('editCourseDesc').value = course.description || '';
    document.getElementById('editCourseModal').classList.add('open');
}

function closeEditCourseModal() {
    document.getElementById('editCourseModal').classList.remove('open');
}

function openEditAssignModal(assignId, courseId) {
    const list = myAssignments[courseId] || [];
    const assign = list.find(a => a.id === assignId);
    if(!assign) return;
    
    document.getElementById('editAssignId').value = assign.id;
    document.getElementById('editAssignTitle').value = assign.title || '';
    document.getElementById('editAssignDesc').value = assign.description || '';
    
    if (assign.due_date) {
        const d = new Date(assign.due_date);
        const tzOffset = d.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(d - tzOffset)).toISOString().slice(0, 16);
        document.getElementById('editAssignDue').value = localISOTime;
    } else {
        document.getElementById('editAssignDue').value = '';
    }

    document.getElementById('editAssignMax').value = assign.max_marks || 100;
    document.getElementById('editAssignmentModal').classList.add('open');
}

function closeEditAssignModal() {
    document.getElementById('editAssignmentModal').classList.remove('open');
}


/* ── Materials (Ahmed API Map) ── */
function setupMaterials() {
    document.getElementById('matFilterCourse').addEventListener('change', e => {
        if (e.target.value) loadMaterials(e.target.value);
    });

    const form = document.getElementById('uploadMaterialForm');
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const msg = document.getElementById('matFormMsg');
        msg.textContent = '';
        msg.className = 'form-msg';

        const courseId = document.getElementById('matCourseSelect').value;
        if (!courseId) { msg.textContent = 'Please select a course.'; return; }

        const formData = new FormData();
        formData.append('course_id',     courseId);
        formData.append('title',         document.getElementById('matTitle').value.trim());
        formData.append('material_type', document.getElementById('matType').value);
        formData.append('description',   document.getElementById('matDesc').value.trim());
        
        const fileInput = document.getElementById('matFile');
        if (!fileInput.files[0]) { msg.textContent = 'Please select a file.'; return; }
        formData.append('file', fileInput.files[0]);

        const res = await fetch('/materials', {
            method: 'POST', credentials: 'include', body: formData
        });
        
        if (res.ok) {
            msg.textContent = 'Material uploaded!';
            msg.className = 'form-msg success';
            form.reset();
            showToast('Material uploaded', 'success');
            loadMaterials(courseId);
        } else {
            msg.textContent = 'Upload failed.';
        }
    });
}

function loadMaterials(courseId) {
    fetch(`/materials/${courseId}`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : [])
        .then(data => renderMaterialsTable(data));
}

function renderMaterialsTable(materials) {
    const tbody = document.getElementById('materialsTableBody');
    if (!materials.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading-row">No materials uploaded yet.</td></tr>';
        return;
    }
    tbody.innerHTML = materials.map(m => `
        <tr>
            <td><strong>${esc(m.title)}</strong></td>
            <td><span class="type-badge">${esc(m.material_type||'—')}</span></td>
            <td style="color:var(--muted);font-size:.82rem">${esc(m.description||'—')}</td>
            <td style="color:var(--muted)">${fmtDate(m.created_at)}</td>
            <td>
                <button class="btn-sm btn-danger" onclick="deleteMaterial(${m.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function deleteMaterial(id) {
    openConfirmModal('Are you sure you want to delete this material?', () => {
        fetch(`/materials/${id}`, { method: 'DELETE', credentials: 'include' })
            .then(r => {
                if(r.ok) {
                    showToast('Material deleted', 'success');
                    const sel = document.getElementById('matFilterCourse').value;
                    if (sel) loadMaterials(sel);
                }
            });
    });
}

/* ── Students (Full Implementation) ── */
function setupStudents() {
    document.getElementById('studentCourseSelect').addEventListener('change', e => {
        const courseId = e.target.value;
        
        if (!courseId) {
            renderStudentsTable([]);
            return;
        }

        fetch(`/lecturer/students/${courseId}`, { credentials: 'include' })
            .then(r => r.ok ? r.json() : [])
            .then(students => renderStudentsTable(students))
            .catch(err => {
                console.error('Error loading students:', err);
                renderStudentsTable([]);
            });
    });
}

function renderStudentsTable(students) {
    const tbody = document.getElementById('studentsTableBody');
    
    if (!students || students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading-row">No students enrolled.</td></tr>';
        return;
    }

    tbody.innerHTML = students.map((s, index) => `
        <tr>
            <td style="color:var(--muted)">${index + 1}</td>
            <td><strong>${esc(s.username || '—')}</strong></td>
            <td><a href="mailto:${esc(s.email)}" style="color:var(--primary);">${esc(s.email || '—')}</a></td>
            <td style="color:var(--muted)">${fmtDate(s.enrolled_at)}</td>
        </tr>
    `).join('');
}

/* ── Submissions & Grading (Ahmed API Map) ── */
function setupSubmissionsPanel() {
    document.getElementById('subCourseSelect').addEventListener('change', e => {
        populateAssignmentSelect(e.target.value, null);
    });

    document.getElementById('loadSubsBtn').addEventListener('click', () => {
        const assignId = document.getElementById('subAssignSelect').value;
        if (!assignId) { showToast('Select an assignment first', 'error'); return; }
        loadSubmissions(assignId);
    });
}

function populateAssignmentSelect(courseId, preselect) {
    const sel = document.getElementById('subAssignSelect');
    sel.innerHTML = '<option value="">— select assignment —</option>';
    sel.disabled = true;
    if (!courseId) return;

    const list = myAssignments[courseId] || [];
    list.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.id;
        opt.textContent = a.title;
        sel.appendChild(opt);
    });
    sel.disabled = list.length === 0;
    if (preselect) {
        sel.value = preselect;
        loadSubmissions(preselect);
    }
}

function loadSubmissions(assignId) {
    fetch(`/submissions/${assignId}`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : [])
        .then(data => {
            document.getElementById('subsCount').textContent = data.length;
            renderSubmissionsTable(data);
        });
}

function renderSubmissionsTable(subs) {
    const tbody = document.getElementById('submissionsTableBody');
    if (!subs.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading-row">No submissions for this assignment.</td></tr>';
        return;
    }
    tbody.innerHTML = subs.map((s, i) => {
        const st = (s.status || 'submitted').toLowerCase();
        return `
        <tr id="sub-row-${s.id}">
            <td style="color:var(--muted)">${i + 1}</td>
            <td><strong>${esc(s.student_id || s.student_name || 'Unknown')}</strong></td>
            <td>
                <a href="/uploads/submissions/${esc(s.file_name)}" target="_blank"
                   style="color:var(--primary);font-size:.82rem">
                    ${esc(s.file_name)}
                </a>
            </td>
            <td style="color:var(--muted)">${fmtDate(s.submitted_at || new Date())}</td>
            <td><span class="status-badge status-${s.grade ? 'graded' : st}">${s.grade ? 'graded' : st}</span></td>
            <td>
                <input class="grade-input" id="grade-${s.id}"
                       type="text" value="${esc(s.grade||'')}" placeholder="e.g. 85">
            </td>
            <td>
                <input class="feedback-input" id="feedback-${s.id}"
                       type="text" value="${esc(s.feedback||'')}" placeholder="Comment…">
            </td>
            <td>
                <button class="btn-sm btn-success" onclick="gradeSubmission(${s.id})">Save</button>
            </td>
        </tr>`;
    }).join('');
}

function gradeSubmission(id) {
    const grade    = document.getElementById(`grade-${id}`).value.trim();
    const feedback = document.getElementById(`feedback-${id}`).value.trim();
    fetch(`/submissions/${id}/grade`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade, feedback })
    })
    .then(r => {
        if (r.ok) {
            showToast('Grade saved', 'success');
            const row = document.getElementById(`sub-row-${id}`);
            if (row) {
                const badge = row.querySelector('.status-badge');
                if (badge) { badge.className = 'status-badge status-graded'; badge.textContent = 'graded'; }
            }
        } else {
            showToast('Failed to save grade', 'error');
        }
    });
}

/* ── Sidebar navigation ── */
function setupSidebar() {
    document.querySelectorAll('.sidebar-item').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    let inited = {};
    const origSwitch = switchTab;
    window.switchTab = function(tab) {
        origSwitch(tab);
        if (!inited[tab]) {
            inited[tab] = true;
            if (tab === 'materials')    setupMaterials();
            if (tab === 'students')     setupStudents();
        }
    };
}

function switchTab(name) {
    document.querySelectorAll('.lec-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${name}`).classList.add('active');
    document.querySelector(`[data-tab="${name}"]`).classList.add('active');
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
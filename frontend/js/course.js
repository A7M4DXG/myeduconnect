let currentUserRole = 'student';
let currentCourseId = null;

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentCourseId = urlParams.get('id');

    if (!currentCourseId) {
        handleAccessDenied("Course Not Found", "Invalid course identifier.");
        return;
    }

    initCourseEnvironment();
    setupSidebarInteraction();
    setupDropdowns();
});

function initCourseEnvironment() {
    updateCartBadge();
    
    fetch('/profile', { credentials: 'include' })
        .then(res => res.ok ? res.json() : null)
        .then(user => {
            if (!user) {
                window.location.replace('login.html');
                return;
            }
            
            document.getElementById('dropdownUsername').textContent = user.username;
            document.getElementById('avatarText').textContent = user.username.charAt(0).toUpperCase();
            currentUserRole = (user.role || 'student').toLowerCase();

            checkEnrollmentAndLoadCourse();
        })
        .catch(() => window.location.replace('login.html'));
}

function checkEnrollmentAndLoadCourse() {
    Promise.all([
        fetch('/courses', { credentials: 'include' }).then(r => r.ok ? r.json() : []),
        fetch('/my-courses', { credentials: 'include' }).then(r => r.ok ? r.json() : [])
    ])
    .then(([allCourses, myCourses]) => {
        const globalCourse = allCourses.find(c => c.id == currentCourseId);
        
        if (!globalCourse) {
            handleAccessDenied("Course Not Found", "This course does not exist in the database.");
            return;
        }

        const isEnrolled = myCourses.some(c => c.id == currentCourseId || c.course_id == currentCourseId);

        if (!isEnrolled && currentUserRole === 'student') {
            handleAccessDenied("Access Denied", "You must be enrolled in this course to view its content.");
            return;
        }

        renderCourseData(globalCourse, isEnrolled);
    })
    .catch(() => handleAccessDenied("Error", "Failed to connect to the educational database."));
}

function renderCourseData(course, isEnrolled) {
    document.getElementById('bannerCategory').textContent = course.course_category || course.category || "General";
    document.getElementById('bannerCode').textContent = `Code: ${course.course_code || course.code}`;
    document.getElementById('bannerTitle').textContent = course.course_name || course.title;
    
    // Lecturer Rendering Logic
    const lecturerName = course.instructor_name || course.lecturer_name || course.created_by;
    if (lecturerName) {
        document.getElementById('bannerLecturer').innerHTML = `Lecturer: <strong>${lecturerName}</strong>`;
    } else {
        document.getElementById('bannerLecturer').textContent = `Lecturer information unavailable`;
    }

    const statusElem = document.getElementById('bannerStatus');
    if (currentUserRole === 'lecturer' || currentUserRole === 'admin') {
        statusElem.textContent = "Lecturer Mode";
        statusElem.classList.add('status-lecturer');
        document.querySelectorAll('.lecturer-only').forEach(el => el.style.display = 'inline-block');
    } else if (isEnrolled) {
        statusElem.textContent = "Enrolled";
        statusElem.classList.add('status-enrolled');
    }

    // Description Handling
    document.getElementById('contentDescription').textContent = course.description || "No description available.";

    loadCourseMaterials();

    loadAssignments();

    // Render Assignments (if backend returns connected data)
    if (course.assignments && Array.isArray(course.assignments) && course.assignments.length > 0) {
        const assignContainer = document.getElementById('contentAssignments');
        assignContainer.innerHTML = ''; 
        
        course.assignments.forEach(assign => {
            const due = assign.due_date ? new Date(assign.due_date).toLocaleDateString() : "Not set";
            assignContainer.innerHTML += `
                <div class="content-card assignment-card">
                    <div class="assign-info">
                        <h3>${assign.title}</h3>
                        <span class="assign-meta">Due: ${due}</span>
                    </div>
                    <a href="assignment.html?courseId=${currentCourseId}&assignId=${assign.id}" class="btn-open-outline">Open</a>
                </div>
            `;
        });
    }
}

function handleAccessDenied(title, message) {
    document.getElementById('bannerTitle').textContent = title;
    document.getElementById('bannerCategory').style.display = 'none';
    document.getElementById('bannerCode').style.display = 'none';
    document.getElementById('bannerStatus').style.display = 'none';
    document.getElementById('bannerLecturer').style.display = 'none';

    document.querySelector('.course-main').innerHTML = `
        <div class="content-card" style="text-align: center; padding: 60px 20px;">
            <h2 style="color: #d93025; margin-bottom: 16px;">${title}</h2>
            <p style="color: var(--text-muted); font-size: 1.1rem; margin-bottom: 24px;">${message}</p>
            <a href="courses.html" class="btn-primary" style="display: inline-block; text-decoration: none; padding: 12px 24px;">Browse Catalog</a>
        </div>
    `;
    document.getElementById('courseSidebar').style.display = 'none';
    document.querySelector('.course-workspace').style.gridTemplateColumns = '1fr';
}

function setupSidebarInteraction() {
    const sidebar = document.getElementById('courseSidebar');
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    const menuItems = document.querySelectorAll('.sidebar-menu-item');
    const sections = document.querySelectorAll('.course-section');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            menuItems.forEach(i => i.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            item.classList.add('active');
            const target = item.getAttribute('data-target');
            document.getElementById(target).classList.add('active');

            if (window.innerWidth <= 768) {
                sidebar.classList.add('collapsed');
            }
        });
    });

    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });
}


function updateCartBadge() {
    fetch('/cart', { method: 'GET', credentials: 'include' })
        .then(res => res.ok ? res.json() : [])
        .then(data => {
            const badge = document.getElementById('cartCount');
            if (badge) badge.textContent = Array.isArray(data) ? data.length : 0;
        });
}

function loadCourseMaterials() {
    fetch(`/materials/${currentCourseId}`, { credentials: 'include' })
        .then(res => res.ok ? res.json() : [])
        .then(materials => {
            const container = document.getElementById('contentMaterials');
            
            if (!materials || materials.length === 0) {
                container.innerHTML = `
                    <div class="content-card full-width">
                        <div class="empty-state-block">
                            <svg style="width:48px;height:48px;margin-bottom:16px;opacity:0.5;fill:currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/></svg>
                            <br>No materials uploaded by the lecturer yet.
                        </div>
                    </div>`;
                return;
            }

            // Group materials by category
            const grouped = materials.reduce((acc, curr) => {
                const type = curr.material_type ? curr.material_type.toLowerCase() : 'other resources';
                if (!acc[type]) acc[type] = [];
                acc[type].push(curr);
                return acc;
            }, {});

            // Define custom sorting
            const order = ['lecture', 'slides', 'tutorial', 'lab', 'video', 'notes', 'other resources'];
            const sortedKeys = Object.keys(grouped).sort((a, b) => {
                let idxA = order.findIndex(k => a.includes(k));
                let idxB = order.findIndex(k => b.includes(k));
                if (idxA === -1) idxA = 99; 
                if (idxB === -1) idxB = 99;
                return idxA - idxB;
            });

            // Render Categories and Cards
            let html = '';
            sortedKeys.forEach(type => {
                const items = grouped[type];
                const displayType = type.charAt(0).toUpperCase() + type.slice(1);
                
                html += `
                    <div class="material-category">
                        <h3 class="category-title">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
                            ${displayType}
                        </h3>
                        <div class="category-items">
                            ${items.map(m => createMaterialHTML(m)).join('')}
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;
        })
        .catch(() => {
            document.getElementById('contentMaterials').innerHTML = `
                <div class="content-card full-width">
                    <div class="empty-state-block">Failed to load course materials.</div>
                </div>`;
        });
}

function createMaterialHTML(m) {
    // 1. Get extension
    const ext = (m.file_path && m.file_path.includes('.')) ? m.file_path.split('.').pop().toLowerCase() : 'default';
    
    // 2. Ensure file path is formatted correctly for the browser
    // Assuming your server.js has app.use('/uploads', express.static('uploads'));
    const filePath = m.file_path ? `/${m.file_path.replace(/\\/g, '/')}` : '#';
    
    const iconSvg = getIconSvg(ext);
    const date = new Date(m.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const desc = m.description ? `<p class="material-desc">${m.description.replace(/</g, "&lt;")}</p>` : '';

    return `
        <div class="content-card material-card-pro">
            <div class="material-icon-box" title="${ext.toUpperCase()} file">
                ${iconSvg}
            </div>
            <div class="material-info-box">
                <h4>${m.title.replace(/</g, "&lt;")}</h4>
                <div class="material-meta-data">
                    <span class="meta-tag">Uploaded: ${date}</span>
                </div>
                ${desc}
            </div>
            <div class="material-action-box">
                <a href="${filePath}" target="_blank" class="btn-open-outline">View</a>
                <a href="/materials/download/${m.id}" class="btn-primary" download>Download</a>
            </div>
        </div>
    `;
}

function getIconSvg(ext) {
    const normalizedExt = ext ? ext.toLowerCase() : 'default';

    // PDF Icon
    if (normalizedExt === 'pdf') return `<svg viewBox="0 0 24 24" width="24" height="24" fill="#d93025"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4v6l4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-9 12H9.5v-2h-2v2H6V9h1.5v2.5h2V9H11v5zm5-2h-1.5v2h-1.5V9H16v5zm4-2h-1.5v-1h-1.5v1H17v1h1.5v1H17v1h-1.5v-1H14v2h6v-5zm-9-1h-2v-1h2v1zm4 1h-1.5v-1h1.5v1z"/></svg>`;
    
    // Powerpoint Icon
    if (['ppt', 'pptx'].includes(normalizedExt)) return `<svg viewBox="0 0 24 24" width="24" height="24" fill="#f9ab00"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 12H9v-2H7v2H5V9h2v2h2V9h2v6zm6-2h-2v2h-2V9h4v6zm-2-2h-2v-2h2v2z"/></svg>`;
    
    // Word Icon
    if (['doc', 'docx'].includes(normalizedExt)) return `<svg viewBox="0 0 24 24" width="24" height="24" fill="#1a73e8"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>`;
    
    // Zip/Archive Icon
    if (['zip', 'rar'].includes(normalizedExt)) return `<svg viewBox="0 0 24 24" width="24" height="24" fill="#5f6368"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 10h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V6h2v2z"/></svg>`;
    
    // Default File Icon (Professional Document Look)
    return `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#0056d2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>`;
}

function setupDropdowns() {
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
    if (logoutBtn) logoutBtn.addEventListener('click', (e) => { e.preventDefault(); window.location.replace('login.html'); });
}

function loadAssignments() {
    fetch(`/assignments/${currentCourseId}`, { credentials: 'include' })
        .then(res => res.ok ? res.json() : [])
        .then(assignments => {
            const container = document.getElementById('contentAssignments');
            if (!assignments || assignments.length === 0) {
                container.innerHTML = `
                <div class="content-card full-width">
                    <div class="empty-state-block">No assignments available.</div>
                </div>`;
                return;
            }
            container.innerHTML = '';
            assignments.forEach(assign => {
                const due = assign.due_date ? new Date(assign.due_date).toLocaleString() : 'No Due Date';
                container.innerHTML += `
                    <div class="content-card assignment-card">
                        <div class="assign-info">
                            <h3>${assign.title}</h3>
                            <p>${assign.description || 'No description'}</p>
                            <span class="assign-meta">Due: ${due}</span>
                        </div>
                        <a href="assignment.html?courseId=${currentCourseId}&assignId=${assign.id}" class="btn-open-outline">Open</a>
                    </div>
                `;
            });
        })
        .catch(() => {
            document.getElementById('contentAssignments').innerHTML = `
                <div class="content-card">Failed to load assignments.</div>
            `;
        });
}
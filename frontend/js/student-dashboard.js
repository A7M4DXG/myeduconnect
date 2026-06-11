/* ========================================================
   Student Dashboard — Merged & Assignment Workflow Updated
======================================================== */

let loadedCourses = [];

document.addEventListener('DOMContentLoaded', () => {
    initPortal();
    setupDropdowns();
    setupViewToggles();
    setupSearch();
    setupShortcutSearch();
});

function initPortal() {
    fetchUserProfile();
    fetchEnrolledCourses();
    fetchRecentActivity();
    updateCartBadge();
    fetchStudentAssignments(); // NEW: Loads the assignment tracking
}

/* ── Profile & Core Data ── */
function fetchUserProfile() {
    fetch('/profile', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
        if (!response.ok) { window.location.replace('login.html'); }
        return response.json();
    })
    .then(data => {
        if (data && data.username) {
            document.getElementById('welcomeMessage').textContent = `Welcome back, ${data.username}`;
            document.getElementById('dropdownUsername').textContent = data.username;
            document.getElementById('avatarText').textContent = data.username.charAt(0).toUpperCase();
        }
    })
    .catch(() => {
        document.getElementById('welcomeMessage').textContent = 'Welcome to the portal';
        document.getElementById('dropdownUsername').textContent = 'Student';
        document.getElementById('avatarText').textContent = '?';
    });
}

function fetchEnrolledCourses() {
    fetch('/my-courses', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.ok ? response.json() : [])
    .then(data => {
        loadedCourses = Array.isArray(data) ? data : [];
        renderContinueLearning(loadedCourses);
        renderCourses(loadedCourses);
    })
    .catch(() => {
        document.getElementById('coursesContainer').innerHTML = '<div class="empty-state">No data available</div>';
    });
}

/* ── Render Course Blocks ── */
function renderContinueLearning(coursesArray) {
    const section = document.getElementById('continueLearningSection');
    const card = document.getElementById('continueLearningCard');
    
    if (!coursesArray || coursesArray.length === 0) {
        if(section) section.style.display = 'none';
        return;
    }
    
    const course = coursesArray[0];
    const title = course.course_name || course.title || 'Course';
    const courseId = course.id || course.course_id;
    
    if(section) section.style.display = 'block';
    if(card) {
        card.innerHTML = `
            <div class="cl-info">
                <span class="text-muted" style="font-weight: 600; text-transform: uppercase; font-size: 0.85rem;">Currently Learning</span>
                <h3>${title}</h3>
                <p>Pick up right where you left off and complete your upcoming assignments.</p>
            </div>
            <div class="cl-action">
                <a href="course.html?id=${courseId}" class="btn-open" style="padding: 12px 32px; font-size: 1.05rem;">Resume Course</a>
            </div>
        `;
    }
}

function getCategoryThemeClass(category) {
    if (!category) return 'cat-default';
    const cat = category.toLowerCase();
    
    if (cat.includes('cyber') || cat.includes('security')) return 'cat-cybersecurity';
    if (cat.includes('blockchain') || cat.includes('crypto')) return 'cat-blockchain';
    if (cat.includes('program') || cat.includes('code') || cat.includes('dev')) return 'cat-programming';
    if (cat.includes('math') || cat.includes('data')) return 'cat-math';
    if (cat.includes('lang') || cat.includes('english')) return 'cat-languages';
    if (cat.includes('sport') || cat.includes('health') || cat.includes('fit')) return 'cat-sports';
    
    return 'cat-default';
}

function renderCourses(coursesArray) {
    const container = document.getElementById('coursesContainer');
    if(!container) return;

    container.innerHTML = '';
    
    if (coursesArray.length === 0) {
        container.innerHTML = '<div class="empty-state">No enrolled courses available. Use the search above to browse the catalog.</div>';
        return;
    }

    coursesArray.forEach(course => {
        const title = course.course_name || course.title;
        const desc = course.description || "Access materials to begin learning.";
        const courseId = course.id || course.course_id;
        const category = course.course_category || course.category || "General Studies";
        const code = course.course_code || course.code || "N/A";
        
        const themeClass = getCategoryThemeClass(category);

        const card = document.createElement('div');
        card.className = `course-card ${themeClass}`;
        card.innerHTML = `
            <div class="card-top">
                <span class="badge-code">${code}</span>
                <span class="badge-category">${category}</span>
            </div>
            <div class="course-content">
                <h3 class="course-title">${title}</h3>
                <p class="course-desc">${desc}</p>
            </div>
            <div class="course-actions">
                <a href="course.html?id=${courseId}" class="btn-open">Open Course</a>
            </div>
        `;
        container.appendChild(card);
    });
}

/* ── NEW: Assignment Workflow Tracking ── */
async function fetchStudentAssignments() {
    try {
        // 1. Fetch courses to know which assignments to look for
        const coursesRes = await fetch('/my-courses', { credentials: 'include' });
        if (!coursesRes.ok) return;
        const courses = await coursesRes.json();

        // 2. Fetch all student submissions
        const subsRes = await fetch('/my-submissions', { credentials: 'include' });
        const submissions = subsRes.ok ? await subsRes.json() : [];

        // 3. Fetch assignments for each course
        let allAssignments = [];
        for (let course of courses) {
            const courseId = course.id || course.course_id;
            const assignRes = await fetch(`/assignments/${courseId}`, { credentials: 'include' });
            if (assignRes.ok) {
                const assigns = await assignRes.json();
                assigns.forEach(a => {
                    allAssignments.push({
                        ...a,
                        course_name: course.course_name || course.title || `Course ${courseId}`
                    });
                });
            }
        }

        // 4. Map status (Not Submitted, Submitted, Graded)
        const mappedAssignments = allAssignments.map(a => {
            const sub = submissions.find(s => s.assignment_id === a.id);
            let status = 'Not Submitted';
            let grade = null;
            
            if (sub) {
                status = sub.grade ? 'Graded' : 'Submitted';
                grade = sub.grade;
            }

            return { ...a, status, grade };
        });

        renderAssignmentsTable(mappedAssignments);
    } catch (error) {
        console.error("Error fetching assignments:", error);
    }
}

function renderAssignmentsTable(assignments) {
    const container = document.getElementById('assignmentsBody'); // Assuming this exists in your HTML
    if (!container) return; // Fail gracefully if not on dashboard page

    if (assignments.length === 0) {
        container.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No assignments due.</td></tr>';
        return;
    }

    container.innerHTML = assignments.map(a => {
        let statusBadge = '';
        if (a.status === 'Not Submitted') statusBadge = `<span class="badge" style="background:#fce8e6;color:#d93025;">Not Submitted</span>`;
        if (a.status === 'Submitted') statusBadge = `<span class="badge" style="background:#e8f0fe;color:#0056d2;">Submitted</span>`;
        if (a.status === 'Graded') statusBadge = `<span class="badge" style="background:#e6f4ea;color:#1e8e3e;">Graded</span>`;

        return `
            <tr>
                <td><strong>${a.title}</strong></td>
                <td class="text-muted">${a.course_name}</td>
                <td>${statusBadge}</td>
                <td><strong>${a.grade ? a.grade : '—'}</strong></td>
                <td>
                    <a href="assignment.html?courseId=${a.course_id}&assignId=${a.id}" class="btn-open" style="padding: 6px 12px; font-size: 0.85rem;">
                        ${a.status === 'Not Submitted' ? 'Submit' : 'View'}
                    </a>
                </td>
            </tr>
        `;
    }).join('');
}

/* ── Notifications & Cart ── */
function updateCartBadge() {
    fetch('/cart', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(res => res.ok ? res.json() : [])
    .then(cartItems => {
        const badge = document.getElementById('cartCount');
        if (badge) badge.textContent = Array.isArray(cartItems) ? cartItems.length : 0;
    })
    .catch(() => console.warn("Failed to fetch cart count"));
}

function fetchRecentActivity() {
    const activityContainer = document.getElementById('activityContainer');
    const notifList = document.getElementById('notificationList');
    const notifBadge = document.getElementById('notifBadge');
    
    Promise.all([
        fetch('/my-submissions', { credentials: 'include' }).then(r => r.ok ? r.json() : []), // UPDATED
        fetch('/my-courses', { credentials: 'include' }).then(r => r.ok ? r.json() : [])
    ])
    .then(([submissions, courses]) => {
        if(activityContainer) activityContainer.innerHTML = '';
        if(notifList) notifList.innerHTML = '';
        
        const safeSubmissions = Array.isArray(submissions) ? submissions : [];
        const safeCourses = Array.isArray(courses) ? courses : [];
        let hasActivity = false;

        safeSubmissions.forEach(sub => {
            hasActivity = true;
            const filename = sub.file_name || 'Assignment File';
            if(activityContainer) activityContainer.appendChild(createActivityItem('upload', `Submitted assignment: <strong>${filename}</strong>`));
            if(notifList) notifList.innerHTML += `<div class="dropdown-item nav-notif-item"><div class="activity-icon upload"></div><span>Uploaded: ${filename}</span></div>`;
        });

        safeCourses.forEach(course => {
            hasActivity = true;
            const title = course.course_name || course.title || 'Course';
            if(activityContainer) activityContainer.appendChild(createActivityItem('enroll', `Enrolled in: <strong>${title}</strong>`));
            if(notifList) notifList.innerHTML += `<div class="dropdown-item nav-notif-item"><div class="activity-icon enroll"></div><span>Enrolled: ${title}</span></div>`;
        });

        if (!hasActivity) {
            if(activityContainer) activityContainer.innerHTML = '<div class="empty-state">No data available</div>';
            if(notifList) notifList.innerHTML = '<div class="dropdown-item text-muted" style="cursor:default;">No notifications</div>';
            if(notifBadge) notifBadge.style.display = 'none';
        } else {
            if(notifBadge) notifBadge.style.display = 'block';
        }
    })
    .catch(() => {
        if(activityContainer) activityContainer.innerHTML = '<div class="empty-state">No data available</div>';
        if(notifList) notifList.innerHTML = '<div class="dropdown-item text-muted" style="cursor:default;">No data available</div>';
    });
}

function createActivityItem(type, htmlText) {
    const div = document.createElement('div');
    div.className = 'activity-item';
    div.innerHTML = `
        <div class="activity-icon ${type}"></div>
        <div class="activity-text">${htmlText}</div>
    `;
    return div;
}

/* ── UI Interaction Setup ── */
function setupShortcutSearch() {
    const shortcutInput = document.getElementById('shortcutSearchInput');
    const shortcutBtn = document.getElementById('shortcutSearchBtn');

    if (shortcutBtn && shortcutInput) {
        const executeShortcutSearch = () => {
            const query = shortcutInput.value.trim();
            if (query) {
                window.location.href = `courses.html?q=${encodeURIComponent(query)}`;
            } else {
                window.location.href = 'courses.html';
            }
        };
        shortcutBtn.addEventListener('click', executeShortcutSearch);
        shortcutInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') executeShortcutSearch();
        });
    }
}

function setupSearch() {
    const searchInput = document.getElementById('courseSearchInput');
    const navSearchBtn = document.getElementById('navSearchBtn');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            if (searchTerm === "") {
                renderCourses(loadedCourses);
                return;
            }
            const filteredCourses = loadedCourses.filter(course => {
                const title = (course.course_name || course.title || '').toLowerCase();
                const desc = (course.description || '').toLowerCase();
                return title.includes(searchTerm) || desc.includes(searchTerm);
            });
            renderCourses(filteredCourses);
        });
    }

    if (navSearchBtn && searchInput) {
        navSearchBtn.addEventListener('click', () => {
            searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => { searchInput.focus(); }, 300);
        });
    }
}

function setupViewToggles() {
    const container = document.getElementById('coursesContainer');
    const cardBtn = document.getElementById('viewCardBtn');
    const listBtn = document.getElementById('viewListBtn');

    if (!container || !cardBtn || !listBtn) return;

    cardBtn.addEventListener('click', () => {
        container.classList.remove('list-mode');
        container.classList.add('card-mode');
        cardBtn.classList.add('active');
        listBtn.classList.remove('active');
    });

    listBtn.addEventListener('click', () => {
        container.classList.remove('card-mode');
        container.classList.add('list-mode');
        listBtn.classList.add('active');
        cardBtn.classList.remove('active');
    });
}

function setupDropdowns() {
    const profileBtn = document.getElementById('profileDropdownBtn');
    const profileMenu = document.getElementById('profileMenu');
    const notifBtn = document.getElementById('notificationBtn');
    const notifMenu = document.getElementById('notificationMenu');
    
    if (profileBtn && profileMenu) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileMenu.classList.toggle('show');
            if(notifMenu) notifMenu.classList.remove('show'); 
        });
    }

    if (notifBtn && notifMenu) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notifMenu.classList.toggle('show');
            if(profileMenu) profileMenu.classList.remove('show'); 
        });
    }

    document.addEventListener('click', (e) => {
        if (profileBtn && profileMenu && !profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
            profileMenu.classList.remove('show');
        }
        if (notifBtn && notifMenu && !notifBtn.contains(e.target) && !notifMenu.contains(e.target)) {
            notifMenu.classList.remove('show');
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
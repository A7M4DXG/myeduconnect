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
}

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
            if(

data.role==='admin'

){

document.getElementById(

'adminPanelSection'

).style.display='block';

}
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

function renderContinueLearning(coursesArray) {
    const section = document.getElementById('continueLearningSection');
    const card = document.getElementById('continueLearningCard');
    
    if (!coursesArray || coursesArray.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    const course = coursesArray[0];
    const title = course.course_name || course.title || 'Course';
    const courseId = course.id || course.course_id;
    
    section.style.display = 'block';
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

// Utility to map database category to visual theme
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

function fetchRecentActivity() {
    const activityContainer = document.getElementById('activityContainer');
    const notifList = document.getElementById('notificationList');
    const notifBadge = document.getElementById('notifBadge');
    
    Promise.all([
        fetch('/my-uploads', { credentials: 'include' }).then(r => r.ok ? r.json() : []),
        fetch('/my-courses', { credentials: 'include' }).then(r => r.ok ? r.json() : [])
    ])
    .then(([uploads, courses]) => {
        activityContainer.innerHTML = '';
        notifList.innerHTML = '';
        
        const safeUploads = Array.isArray(uploads) ? uploads : [];
        const safeCourses = Array.isArray(courses) ? courses : [];
        let hasActivity = false;

        safeUploads.forEach(upload => {
            hasActivity = true;
            const filename = upload.filename || upload.file_name || upload.name || 'Assignment File';
            activityContainer.appendChild(createActivityItem('upload', `Submitted assignment: <strong>${filename}</strong>`));
            notifList.innerHTML += `<div class="dropdown-item nav-notif-item"><div class="activity-icon upload"></div><span>Uploaded: ${filename}</span></div>`;
        });

        safeCourses.forEach(course => {
            hasActivity = true;
            const title = course.course_name || course.title || 'Course';
            activityContainer.appendChild(createActivityItem('enroll', `Enrolled in: <strong>${title}</strong>`));
            notifList.innerHTML += `<div class="dropdown-item nav-notif-item"><div class="activity-icon enroll"></div><span>Enrolled: ${title}</span></div>`;
        });

        if (!hasActivity) {
            activityContainer.innerHTML = '<div class="empty-state">No data available</div>';
            notifList.innerHTML = '<div class="dropdown-item text-muted" style="cursor:default;">No notifications</div>';
            notifBadge.style.display = 'none';
        } else {
            notifBadge.style.display = 'block';
        }
    })
    .catch(() => {
        activityContainer.innerHTML = '<div class="empty-state">No data available</div>';
        notifList.innerHTML = '<div class="dropdown-item text-muted" style="cursor:default;">No data available</div>';
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
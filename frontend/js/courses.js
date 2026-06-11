let allCoursesCache = [];
let currentViewMode = 'card-mode';

document.addEventListener('DOMContentLoaded', () => {
    initCatalog();
    setupDropdowns();
    setupViewToggles();
    setupSearchAndSort();
});

function initCatalog() {
    fetchUserProfile();
    fetchAllCourses();
    updateCartBadge();
}

function fetchUserProfile() {
    fetch('/profile', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(res => res.ok ? res.json() : {})
    .then(data => {
        if (data && data.username) {
            document.getElementById('dropdownUsername').textContent = data.username;
            document.getElementById('avatarText').textContent = data.username.charAt(0).toUpperCase();
        }
    })
    .catch(() => {});
}

function fetchAllCourses() {
    const container = document.getElementById('catalogContainer');
    container.innerHTML = '<div class="empty-state">Loading catalog...</div>';

    fetch('/courses', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.ok ? response.json() : [])
    .then(data => {
        allCoursesCache = Array.isArray(data) ? data : [];
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');
        
        if (query) {
            const searchInput = document.getElementById('catalogSearchInput');
            if (searchInput) searchInput.value = query;
            filterAndRenderCatalog(query);
        } else {
            sortAndRenderCatalog();
        }
    })
    .catch(() => {
        container.innerHTML = '<div class="empty-state">Failed to load courses. Please try again later.</div>';
    });
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

function renderCatalog(coursesArray) {
    const container = document.getElementById('catalogContainer');
    container.innerHTML = '';

    if (coursesArray.length === 0) {
        container.innerHTML = '<div class="empty-state">No courses match your search criteria.</div>';
        return;
    }

    if (currentViewMode === 'list-mode') {
        const listHeader = document.createElement('div');
        listHeader.className = 'list-header-row';
        listHeader.innerHTML = `
            <div class="col-code">Code</div>
            <div class="col-name">Course Name</div>
            <div class="col-category">Category</div>
            <div class="col-dur">Duration</div>
            <div class="col-price">Price</div>
            <div class="col-action"></div>
        `;
        container.appendChild(listHeader);
    }

    coursesArray.forEach(course => {
        const id = course.id;
        const name = course.course_name;
        const code = course.course_code;
        const category = course.course_category || 'General';
        const desc = course.description || "No description available.";
        const duration = course.duration_weeks ? `${course.duration_weeks} Weeks` : 'N/A';
        const price = course.price ? `RM ${course.price}` : 'Free';
        
        // Determine category theme class
        const themeClass = getCategoryThemeClass(category);

        const card = document.createElement('div');
        
        if (currentViewMode === 'card-mode') {
            card.className = `catalog-card ${themeClass}`;
            card.innerHTML = `
                <div class="card-top">
                    <span class="badge-code">${code}</span>
                    <span class="badge-category">${category}</span>
                </div>
                <div class="card-body">
                    <h3 class="catalog-title">${name}</h3>
                    <p class="catalog-desc">${desc}</p>
                </div>
                <div class="card-meta">
                    <span>⏱ ${duration}</span>
                    <span class="price">${price}</span>
                </div>
                <div class="card-footer">
                    <a href="course-details.html?id=${id}" class="btn-primary-outline">View Details</a>
                </div>
            `;
        } else {
            card.className = `catalog-list-row ${themeClass}`;
            card.innerHTML = `
                <div class="col-code"><span class="badge-code">${code}</span></div>
                <div class="col-name"><strong>${name}</strong></div>
                <div class="col-category">${category}</div>
                <div class="col-dur text-muted">⏱ ${duration}</div>
                <div class="col-price price">${price}</div>
                <div class="col-action">
                    <a href="course-details.html?id=${id}" class="btn-primary-outline">View Details</a>
                </div>
            `;
        }
        container.appendChild(card);
    });
}

// Inside courses.js - Update this function
function updateCartBadge() {
    fetch('/cart', { method: 'GET', credentials: 'include' })
        .then(res => res.ok ? res.json() : [])
        .then(data => {
            const badge = document.getElementById('cartCount');
            if (badge) badge.textContent = Array.isArray(data) ? data.length : 0;
        });
}

function setupSearchAndSort() {
    const searchInput = document.getElementById('catalogSearchInput');
    const sortSelect = document.getElementById('catalogSortSelect');

    if (searchInput) searchInput.addEventListener('input', () => filterAndRenderCatalog(searchInput.value));
    if (sortSelect) sortSelect.addEventListener('change', () => filterAndRenderCatalog(searchInput ? searchInput.value : ''));
}

function filterAndRenderCatalog(searchTerm) {
    const term = (searchTerm || '').toLowerCase().trim();
    let filtered = allCoursesCache;

    if (term !== "") {
        filtered = allCoursesCache.filter(course => {
            const name = (course.course_name || '').toLowerCase();
            const code = (course.course_code || '').toLowerCase();
            const cat = (course.course_category || '').toLowerCase();
            return name.includes(term) || code.includes(term) || cat.includes(term);
        });
    }

    const sortType = document.getElementById('catalogSortSelect').value;
    
    filtered.sort((a, b) => {
        if (sortType === 'name') return (a.course_name || '').localeCompare(b.course_name || '');
        if (sortType === 'code') return (a.course_code || '').localeCompare(b.course_code || '');
        if (sortType === 'category') return (a.course_category || '').localeCompare(b.course_category || '');
        return 0;
    });

    renderCatalog(filtered);
}

function sortAndRenderCatalog() { filterAndRenderCatalog(document.getElementById('catalogSearchInput').value); }

function setupViewToggles() {
    const container = document.getElementById('catalogContainer');
    const cardBtn = document.getElementById('viewCardBtn');
    const listBtn = document.getElementById('viewListBtn');

    if (!container || !cardBtn || !listBtn) return;

    cardBtn.addEventListener('click', () => {
        currentViewMode = 'card-mode';
        container.className = 'courses-grid card-mode';
        cardBtn.classList.add('active'); listBtn.classList.remove('active');
        sortAndRenderCatalog();
    });

    listBtn.addEventListener('click', () => {
        currentViewMode = 'list-mode';
        container.className = 'courses-grid list-mode';
        listBtn.classList.add('active'); cardBtn.classList.remove('active');
        sortAndRenderCatalog();
    });
}

function setupDropdowns() {
    const profileBtn = document.getElementById('profileDropdownBtn');
    const profileMenu = document.getElementById('profileMenu');
    if (profileBtn && profileMenu) {
        profileBtn.addEventListener('click', (e) => { e.stopPropagation(); profileMenu.classList.toggle('show'); });
    }
    document.addEventListener('click', (e) => {
        if (profileBtn && profileMenu && !profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
            profileMenu.classList.remove('show');
        }
    });
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', (e) => { e.preventDefault(); window.location.replace('login.html'); });
}
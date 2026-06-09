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
    fetch('/cart/count', { credentials: 'include' })
        .then(res => res.ok ? res.json() : { count: 0 })
        .then(data => {
            const badge = document.getElementById('cartCount');
            if (badge) badge.textContent = data.count || 0;
        })
        .catch(() => console.warn("Failed to fetch cart count"));
}

function loadCourseMaterials(){

fetch(

`/materials/${currentCourseId}`,

{

credentials:'include'

}

)

.then(

res=>res.ok ?

res.json()

:

[]

)

.then(

materials=>{

const container=

document.getElementById(

'contentMaterials'

);

if(

!materials ||

materials.length===0

){

container.innerHTML=`

<div class="empty-state-block">

No materials uploaded by lecturer yet.

</div>

`;

return;

}

container.innerHTML='';

materials.forEach(

material=>{

container.innerHTML+=`

<div class="content-card material-card">

<div class="material-left">

<div class="material-type">

${material.material_type || 'File'}

</div>

<div>

<h3>

${material.title}

</h3>

<p>

${material.description ||

'No description'

}

</p>

</div>

</div>

<a

class="btn-open-outline"

href="/${material.file_path}"

target="_blank"

>

Open

</a>

</div>

`;

}

);

}

)

.catch(()=>{

document.getElementById(

'contentMaterials'

).innerHTML=

`

<div class="empty-state-block">

Failed to load materials.

</div>

`;

});

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

function loadAssignments(){

fetch(

`/assignments/${currentCourseId}`,

{

credentials:'include'

}

)

.then(

res=>res.ok ?

res.json()

:

[]

)

.then(

assignments=>{

const container=

document.getElementById(

'contentAssignments'

);

if(

!assignments ||

assignments.length===0

){

container.innerHTML=

`

<div class="content-card full-width">

<div class="empty-state-block">

No assignments available.

</div>

</div>

`;

return;

}

container.innerHTML='';

assignments.forEach(

assign=>{

const due=

assign.due_date ?

new Date(

assign.due_date

).toLocaleString()

:

'No Due Date';

container.innerHTML+=`

<div class="content-card assignment-card">

<div class="assign-info">

<h3>

${assign.title}

</h3>

<p>

${assign.description ||

'No description'

}

</p>

<span class="assign-meta">

Due:

${due}

</span>

</div>

<a

href="assignment.html?courseId=${currentCourseId}&assignId=${assign.id}"

class="btn-open-outline"

>

Open

</a>

</div>

`;

}

);

}

)

.catch(()=>{

document.getElementById(

'contentAssignments'

).innerHTML=

`

<div class="content-card">

Failed to load assignments.

</div>

`;

});

}
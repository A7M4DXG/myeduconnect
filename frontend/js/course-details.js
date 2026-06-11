let currentCourse = null;

document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');
    
    if (courseId) loadCourseDetails(courseId);
    else document.getElementById('courseDetailsContainer').innerHTML = '<div class="empty-state">Course not found.</div>';
});

// Utility function for Toast Notifications
function showToast(message, type = 'success') {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function loadCourseDetails(id) {
    fetch('/courses', { credentials: 'include' })
        .then(res => res.ok ? res.json() : [])
        .then(courses => {
            currentCourse = courses.find(c => c.id == id);
            if (currentCourse) renderDetails();
            else document.getElementById('courseDetailsContainer').innerHTML = '<div class="empty-state">Course not found.</div>';
        });
}

function renderDetails() {
    const container = document.getElementById('courseDetailsContainer');
    const price = currentCourse.price ? `RM ${currentCourse.price}` : 'Free';
    const duration = currentCourse.duration_weeks ? `${currentCourse.duration_weeks} Weeks` : 'N/A';
    const desc = currentCourse.description ? currentCourse.description : "No description available.";
    
    const lecturer = currentCourse.instructor_name || currentCourse.lecturer_name || currentCourse.created_by;
    const lecturerHTML = lecturer ? `Instructor: ${lecturer}` : 'Lecturer information unavailable';
    
    container.innerHTML = `
        <div class="details-content">
            <span class="badge-category">${currentCourse.course_category || 'General'}</span>
            <h1 class="details-title">${currentCourse.course_name || currentCourse.title}</h1>
            <p class="details-code">Course Code: <strong>${currentCourse.course_code || currentCourse.code}</strong></p>
            <div class="details-instructor">${lecturerHTML}</div>
            
            <h3 class="desc-heading">Description</h3>
            <p class="details-desc">${desc}</p>
        </div>
        <div class="details-sidebar">
            <div class="summary-card">
                <div class="summary-price">${price}</div>
                <div class="summary-meta">⏱ Duration: ${duration}</div>
                <button onclick="addToCart()" class="btn-primary full-width" id="addToCartBtn">Add To Cart</button>
            </div>
        </div>
    `;
}

function addToCart() {
    if (!currentCourse) return;
    const btn = document.getElementById('addToCartBtn');
    btn.disabled = true;
    btn.textContent = 'Adding...';

    fetch('/cart', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: currentCourse.id })
    })
    .then(async res => {

    const data = await res.json();

    if(res.ok){

        showToast(

            data.message ||

            'Course added successfully',

            'success'

        );

        updateCartBadge();

        return;

    }

    if(res.status===409){

        showToast(

            data.message ||

            'Already exists',

            'info'

        );

        return;

    }

    showToast(

        data.message ||

        'Failed to add to cart',

        'error'

    );

})
    .catch(() => showToast('An error occurred. Please try again.', 'error'))
    .finally(() => {
        btn.disabled = false;
        btn.textContent = 'Add To Cart';
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
        // Ensure cartItems is an array, then get the length
        if (badge) {
            badge.textContent = Array.isArray(cartItems) ? cartItems.length : 0;
        }
    })
    .catch(err => console.error("Error fetching cart count:", err));
}
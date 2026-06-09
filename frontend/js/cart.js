document.addEventListener('DOMContentLoaded', () => {
    renderCart();
});

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

function renderCart() {
    const container = document.getElementById('cartItemsContainer');
    container.innerHTML = '<div class="empty-state">Loading your cart...</div>';

    Promise.all([
        fetch('/cart', { credentials: 'include' }).then(r => r.ok ? r.json() : []),
        fetch('/courses', { credentials: 'include' }).then(r => r.ok ? r.json() : [])
    ])
    .then(([cartItems, allCourses]) => {
        let total = 0;
        let validCartItems = [];

        if (Array.isArray(cartItems)) {
            cartItems.forEach(cartItem => {
                const courseDetail = allCourses.find(c => c.id == cartItem.course_id);
                if (courseDetail) {
                    validCartItems.push({ cart_id: cartItem.id, ...courseDetail });
                }
            });
        }

        const badge = document.getElementById('cartCount');
        if (badge) badge.textContent = validCartItems.length;

        if (validCartItems.length === 0) {
            container.innerHTML = '<div class="empty-state">Your cart is empty.</div>';
            document.getElementById('checkoutBtn').style.pointerEvents = 'none';
            document.getElementById('checkoutBtn').style.opacity = '0.5';
        } else {
            container.innerHTML = '';
            validCartItems.forEach(course => {
                const priceVal = parseFloat(course.price) || 0;
                const duration = course.duration_weeks ? `${course.duration_weeks} Weeks` : 'N/A';
                total += priceVal;
                
                container.innerHTML += `
                    <div class="cart-item">
                        <div class="cart-item-info">
                            <span class="badge-category" style="font-size: 0.75rem;">${course.course_category || 'General'}</span>
                            <h4>${course.course_name || course.title}</h4>
                            <span class="badge-code">${course.course_code || course.code}</span>
                            <div class="text-muted" style="margin-top: 6px; font-size: 0.85rem;">⏱ Duration: ${duration}</div>
                        </div>
                        <div class="cart-item-action">
                            <span class="price">RM ${priceVal.toFixed(2)}</span>
                            <button onclick="removeFromCart(${course.cart_id})" class="btn-danger">Remove</button>
                        </div>
                    </div>
                `;
            });
            document.getElementById('checkoutBtn').style.pointerEvents = 'auto';
            document.getElementById('checkoutBtn').style.opacity = '1';
        }

        document.getElementById('totalCourses').textContent = validCartItems.length;
        document.getElementById('totalPrice').textContent = `RM ${total.toFixed(2)}`;
    })
    .catch(() => {
        container.innerHTML = '<div class="empty-state">Failed to load cart. Please refresh.</div>';
    });
}

function removeFromCart(cartId) {
    fetch(`/cart/${cartId}`, { 
        method: 'DELETE', 
        credentials: 'include' 
    })
    .then(res => {
        if (res.ok) {
            showToast('Course removed successfully', 'success');
            renderCart(); 
        } else {
            showToast('Failed to remove item. Please try again.', 'error');
        }
    })
    .catch(() => showToast('An error occurred.', 'error'));
}
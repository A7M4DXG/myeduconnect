let currentCartItems = [];
let selectedPaymentMethod = null;
let checkoutTotalAmount = 0; 

document.addEventListener('DOMContentLoaded', () => {
    // 1. Fetch Cart Data
    Promise.all([
        fetch('/cart', { credentials: 'include' }).then(r => r.ok ? r.json() : []),
        fetch('/courses', { credentials: 'include' }).then(r => r.ok ? r.json() : [])
    ]).then(([cartItems, allCourses]) => {
        if (!Array.isArray(cartItems) || cartItems.length === 0) {
            window.location.replace('courses.html');
            return;
        }

        currentCartItems = cartItems;
        const list = document.getElementById('checkoutList');
        let total = 0;

        cartItems.forEach(cartItem => {
            const course = allCourses.find(c => c.id == cartItem.course_id);
            if (course) {
                const price = parseFloat(course.price) || 0;
                total += price;
                list.innerHTML += `<li><span>${course.course_code}</span> <span>RM ${price.toFixed(2)}</span></li>`;
            }
        });

        checkoutTotalAmount = total; // Save total to process payment
        document.getElementById('checkoutCount').textContent = cartItems.length;
        document.getElementById('checkoutTotal').textContent = `RM ${total.toFixed(2)}`;
    });

    // 2. Setup Payment Method Selection
    const methodCards = document.querySelectorAll('.payment-method-card');
    const selectedDisplay = document.getElementById('selectedMethodDisplay');

    methodCards.forEach(card => {
        card.addEventListener('click', () => {
            // Remove 'selected' class from all cards
            methodCards.forEach(c => c.classList.remove('selected'));
            // Add 'selected' class to the clicked card
            card.classList.add('selected');
            
            selectedPaymentMethod = card.getAttribute('data-method');
            selectedDisplay.style.display = 'block';
            selectedDisplay.innerHTML = `Payment Method: <strong>${selectedPaymentMethod}</strong>`;
            
            // Clear any previous error messages
            document.getElementById('paymentMsg').textContent = '';
        });
    });

    // 3. Handle Payment Confirmation
    document.getElementById('payBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('payBtn');
        const msg = document.getElementById('paymentMsg');
        
        // Validation: Ensure a method is selected
        if (!selectedPaymentMethod) {
            msg.style.color = '#d93025';
            msg.textContent = 'Please select a payment method to continue.';
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Processing...';
        msg.style.color = 'inherit';
        msg.textContent = `Initiating secure connection to ${selectedPaymentMethod}...`;

        try {
            // --- STEP 1. Record the Payment in the database ---
            const transactionId = 'TXN-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
            
            const paymentRes = await fetch('/payment', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: checkoutTotalAmount,
                    payment_method: selectedPaymentMethod,
                    transaction_id: transactionId
                })
            });

            if (!paymentRes.ok) throw new Error('Payment recording failed.');

            // --- STEP 2. Execute Enrollments ---
            // Map cart items to enrollment API POST requests
            const enrollPromises = currentCartItems.map(item => 
                fetch('/enroll', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ course_id: item.course_id })
                }).then(async res => {
                    /* enrollment successful or already enrolled */
                    if(res.ok || res.status === 409){
                        return fetch(`/cart/${item.id}`, {
                            method:'DELETE',
                            credentials:'include'
                        });
                    }
                    /* real failure */
                    throw new Error('Enrollment failed');
                })
            );

            // Execute all promises simultaneously
            await Promise.all(enrollPromises);
            
            // Success State
            msg.style.color = '#1e8e3e';
            msg.textContent = `Payment Successful! Enrolling you via ${selectedPaymentMethod}...`;
            setTimeout(() => { window.location.replace('student-dashboard.html'); }, 1800);

        } catch (error) {
            msg.style.color = '#d93025';
            msg.textContent = 'Enrollment encountered an error. Please contact support.';
            btn.disabled = false;
            btn.textContent = 'Confirm Payment';
            console.error(error);
        }
    });
});
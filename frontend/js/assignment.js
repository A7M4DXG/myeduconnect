/* ========================================================
   Assignment Submission — Student Portal (Reworked Workflow)
======================================================== */

let currentCourseId = null;
let currentAssignId = null;

document.addEventListener('DOMContentLoaded', () => {
    guardStudent();
    setupDropdown();
    parseUrlParams();
});

/* ── Auth guard ── */
function guardStudent() {
    fetch('/profile', { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
            if (!data) {
                window.location.replace('login.html');
                return;
            }
            document.getElementById('dropdownUsername').textContent = data.username;
            document.getElementById('avatarText').textContent = data.username.charAt(0).toUpperCase();
        })
        .catch(() => window.location.replace('login.html'));
}

/* ── URL Parsing ── */
function parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    currentCourseId = params.get('courseId');
    currentAssignId = params.get('assignId');

    if (!currentCourseId || !currentAssignId) {
        document.getElementById('assignmentDetails').innerHTML = 
            '<p class="text-danger">Invalid assignment link. Please return to the dashboard.</p>';
        document.getElementById('uploadCard').style.display = 'none';
        return;
    }

    loadAssignmentData();
    checkSubmissionStatus(); // Check if already submitted before showing form
    setupForm();
}

/* ── Load Assignment Data ── */
function loadAssignmentData() {
    fetch(`/assignments/${currentCourseId}`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : [])
        .then(assignments => {
            const assignment = assignments.find(a => String(a.id) === String(currentAssignId));
            const container = document.getElementById('assignmentDetails');
            
            if (!assignment) {
                container.innerHTML = '<p class="text-danger">Assignment not found.</p>';
                document.getElementById('uploadCard').style.display = 'none';
                return;
            }

            container.innerHTML = `
                <h2>${esc(assignment.title)}</h2>
                <p class="desc">${esc(assignment.description || 'No description provided.')}</p>
                
                <div class="detail-row">
                    <strong>Due Date:</strong>
                    <span>${fmtDateTime(assignment.due_date)}</span>
                </div>
                <div class="detail-row">
                    <strong>Max Marks:</strong>
                    <span>${assignment.max_marks || 100}</span>
                </div>
            `;
        })
        .catch(() => {
            document.getElementById('assignmentDetails').innerHTML = 
                '<p class="text-danger">Error loading assignment details.</p>';
        });
}

/* ── Check Submission Status ── */
async function checkSubmissionStatus() {
    try {
        const res = await fetch(`/my-submission/${currentAssignId}`, { credentials: 'include' });
        
        if (res.ok) {
            const sub = await res.json();
            
            // HIDE form, SHOW details
            document.getElementById('uploadCard').style.display = 'none';
            document.getElementById('submissionStatusCard').style.display = 'block';

            // Populate status card data
            const badge = document.getElementById('subStatusBadge');
            if (sub.grade) {
                badge.textContent = 'Graded';
                badge.style.background = '#e6f4ea';
                badge.style.color = '#1e8e3e';
            } else {
                badge.textContent = 'Submitted';
                badge.style.background = '#e8f0fe';
                badge.style.color = '#0056d2';
            }

            const fileLink = document.getElementById('subFile');
            fileLink.textContent = sub.file_name;
            fileLink.href = `/uploads/submissions/${sub.file_name}`;
            
            // --- DYNAMIC SUBMISSION TIME COLORS ---
            const dateSpan = document.getElementById('subDate');
            
            // Check if the backend flagged this submission as 'Late'
            const isLate = sub.status && sub.status.toLowerCase() === 'late';
            
            // Format the date and append (ON TIME) or (LATE)
            dateSpan.textContent = fmtDateTime(sub.submitted_at) + (isLate ? ' (LATE)' : ' (ON TIME)');
            
            // Apply the Red or Green CSS class
            dateSpan.className = isLate ? 'time-late' : 'time-early';
            
            // --- DYNAMIC GRADE COLORS ---
            const gradeSpan = document.getElementById('subGrade');
            
            if (sub.grade) {
                const numGrade = parseFloat(sub.grade);
                gradeSpan.textContent = `${sub.grade}`;
                
                // Clear any existing classes first
                gradeSpan.className = ''; 
                
                // Apply color logic based on the score
                if (numGrade >= 80) {
                    gradeSpan.classList.add('grade-excellent'); // Green
                } else if (numGrade >= 60) {
                    gradeSpan.classList.add('grade-average');   // Yellow
                } else {
                    gradeSpan.classList.add('grade-poor');      // Red
                }
            } else {
                gradeSpan.textContent = 'Pending';
                gradeSpan.className = ''; // No background if pending
            }
            
            document.getElementById('subFeedback').textContent = sub.feedback || 'Pending';
        } else {
            // SHOW form, HIDE details
            document.getElementById('uploadCard').style.display = 'block';
            document.getElementById('submissionStatusCard').style.display = 'none';
        }
    } catch (err) {
        console.error('Error checking submission status', err);
    }
}

/* ── Form Handling ── */
function setupForm() {
    const form = document.getElementById('submissionForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fileInput = document.getElementById('assignmentFile');
        if (!fileInput.files[0]) {
            showToast('Please select a file to upload.', 'error');
            return;
        }

        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Uploading...';

        const formData = new FormData();
        formData.append('assignment_id', currentAssignId);
        formData.append('file', fileInput.files[0]);

        try {
            const response = await fetch('/submit-assignment', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                showToast(`Assignment submitted successfully!`, 'success');
                form.reset();
                submitBtn.textContent = 'Submit Assignment';
                // Reload the view to show the new submission status card
                checkSubmissionStatus(); 
            } else {
                showToast(data.message || 'Submission failed.', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Assignment';
            }
        } catch (err) {
            showToast('An error occurred during upload.', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Assignment';
        }
    });
}

/* ── Dropdown / Logout ── */
function setupDropdown() {
    const btn  = document.getElementById('profileDropdownBtn');
    const menu = document.getElementById('profileMenu');
    if(btn && menu) {
        btn.addEventListener('click', e => { e.stopPropagation(); menu.classList.toggle('show'); });
        document.addEventListener('click', () => menu.classList.remove('show'));
    }
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        window.location.replace('login.html');
    });
}

/* ── Helpers ── */
function esc(str) {
    return String(str)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtDateTime(raw) {
    if (!raw) return '—';
    const d = new Date(raw);
    return d.toLocaleDateString('en-MY', { 
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function showToast(msg, type = '') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `toast show ${type}`;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { toast.className = 'toast'; }, 3000);
}
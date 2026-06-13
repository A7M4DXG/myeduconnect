const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ============================
// Record Payment (NEW)
// ============================
router.post('/payment', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const { amount, payment_method, transaction_id } = req.body;

    // Insert into payments table with status 'completed'
    db.query(
        `INSERT INTO payments (user_id, amount, payment_method, transaction_id, payment_status) VALUES (?, ?, ?, ?, ?)`,
        [req.session.userId, amount, payment_method, transaction_id, 'completed'],
        (err, result) => {
            if (err) {
                console.error('Payment insert error:', err);
                return res.status(500).json({ message: "Database Error" });
            }
            res.status(201).json({ message: "Payment recorded successfully", paymentId: result.insertId });
        }
    );
});

// ============================
// Add Course To Cart
// ============================
router.post('/cart', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const { course_id } = req.body;

    console.log({
        user: req.session.userId,
        course_id: course_id,
        body: req.body
    });

    /* check enrolled courses first */
    db.query(
        `SELECT * FROM enrollments WHERE user_id=? AND course_id=?`,
        [req.session.userId, course_id],
        (enrollErr, enrolled) => {
            if (enrollErr) {
                return res.status(500).json({ message: "Database Error" });
            }

            /* already enrolled */
            if (enrolled.length) {
                return res.status(409).json({ message: "Already enrolled" });
            }

            /* check cart duplicates */
            db.query(
                `SELECT * FROM cart WHERE user_id=? AND course_id=?`,
                [req.session.userId, course_id],
                (cartErr, result) => {
                    console.log('Cart Query Result:', JSON.stringify(result));

                    if (cartErr) {
                        return res.status(500).json({ message: "Database Error" });
                    }

                    if (result.length) {
                        return res.status(409).json({ message: "Course already in cart" });
                    }

                    /* insert */
                    db.query(
                        `INSERT INTO cart(user_id,course_id) VALUES(?,?)`,
                        [req.session.userId, course_id],
                        (insertErr) => {
                            if (insertErr) {
                                return res.status(500).json({ message: "Insert Failed" });
                            }
                            res.status(201).json({ message: "Added to cart" });
                        }
                    );
                }
            );
        }
    );
});

// ============================
// Get Current User Cart
// ============================
router.get('/cart', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    db.query(
        `
        SELECT
        cart.id,
        courses.id AS course_id,
        courses.course_code,
        courses.course_name,
        courses.course_category,
        courses.price,
        courses.duration_weeks
        FROM cart
        JOIN courses
        ON cart.course_id=courses.id
        WHERE cart.user_id=?
        `,
        [req.session.userId],
        (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Database Error" });
            }
            res.json(result);
        }
    );
});

// ============================
// Remove Item From Cart
// ============================
router.delete('/cart/:id', (req, res) => {
    db.query(
        `DELETE FROM cart WHERE id=? AND user_id=?`,
        [req.params.id, req.session.userId],
        (err) => {
            if (err) {
                return res.status(500).json({ message: "Delete Failed" });
            }
            res.json({ message: "Removed" });
        }
    );
});

module.exports = router;
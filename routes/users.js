const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const passport = require('passport');

// Registration handler
router.post('/register', (req, res) => {
    const { name, email, password, mobileNo } = req.body;
    let errors = [];

    // Validate fields
    if (!name || !email || !password || !mobileNo) {
        errors.push({ msg: 'Please fill in all fields' });
    }

    // Validate password length
    if (password && password.length < 8) {
        errors.push({ msg: 'Password should be at least 8 characters' });
    }

    // Validate mobile number length and format
    if (mobileNo && mobileNo.length < 10 || !/^\d+$/.test(mobileNo)) {
        errors.push({ msg: 'Mobile number should be at least 10 digits and only contain digits' });
    }

    // Validate email format
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        errors.push({ msg: 'Invalid email address' });
    }

    // Check for validation errors
    if (errors.length > 0) {
        return res.status(400).render('register', {
            errors,
            name,
            email,
            password,
            mobileNo,
        });
    } else {
        // Check if user exists
        User.findOne({ email: email })
            .then((user) => {
                if (user) {
                    errors.push({ msg: 'Email is already registered' });
                    return res.status(400).render('register', {
                        errors,
                        name,
                        email,
                        password,
                        mobileNo,
                    });
                } else {
                    // Create new user
                    const newUser = new User({ name, email, password, mobileNo });

                    // Hash password and save user
                    bcrypt
                        .hash(newUser.password, 10)
                        .then((hash) => {
                            newUser.password = hash;
                            return newUser.save();
                        })
                        .then((user) => {
                            req.flash('success_msg', 'You have successfully signed up, proceed to login');
                            res.render('login', { email, password });
                        })
                        .catch((err) => {
                            console.error(err);
                            res.status(500).render('register', {
                                errors: [{ msg: 'Error creating user' }],
                                name,
                                email,
                                password,
                                mobileNo,
                            });
                        });
                }
            })
            .catch((err) => {
                console.error(err);
                res.status(500).render('register', {
                    errors: [{ msg: 'Error checking if user exists' }],
                    name,
                    email,
                    password,
                    mobileNo,
                });
            });
    }
});

// Login request handler
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/app/dashboard',
        failureRedirect: '/users/login',
        failureFlash: true,
    })(req, res, next);
});

// Logout request handler
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err); // Handle the error if any
        }
        req.flash('success_msg', 'You have logged out');
        res.redirect('/users/login');
    });
});

module.exports = router;

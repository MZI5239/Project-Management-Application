const express = require('express');
const router = express.Router();
const { register, login, logout, forgotPassword, resetPassword, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { check, validationResult } = require('express-validator');

// Validation rules
const registerRules = [
    check('name', 'Name is required').notEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 8 characters long and contain at least one uppercase letter and one number')
        .isLength({ min: 8 })
        .matches(/[A-Z]/)
        .matches(/[0-9]/)
];

const loginRules = [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').notEmpty()
];

// Validation handler
const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

router.post('/register', registerRules, handleValidation, register);
router.post('/login', loginRules, handleValidation, login);
router.post('/logout', protect, logout);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe);

module.exports = router;

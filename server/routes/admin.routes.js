const express = require('express');
const router = express.Router();
const { getAllUsers, changeRole, toggleStatus } = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Apply protect + requireRole('admin') to all routes
router.use(protect);
router.use(requireRole('admin'));

router.get('/users', getAllUsers);
router.patch('/users/:id/role', changeRole);
router.patch('/users/:id/status', toggleStatus);

module.exports = router;

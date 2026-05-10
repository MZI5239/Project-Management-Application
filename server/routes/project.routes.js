const express = require('express');
const router = express.Router();
const { 
    getProjects, 
    createProject, 
    getProject, 
    updateProject, 
    deleteProject, 
    inviteMember,
    transferLeadership,
    toggleProjectStatus
} = require('../controllers/project.controller');
const { protect } = require('../middleware/auth');

// Protect all project routes
router.use(protect);

router.route('/')
    .get(getProjects)
    .post(createProject);

router.route('/:id')
    .get(getProject)
    .put(updateProject)
    .delete(deleteProject);

router.post('/:id/invite', inviteMember);
router.post('/:id/transfer-leadership', transferLeadership);
router.patch('/:id/toggle-status', toggleProjectStatus);

module.exports = router;

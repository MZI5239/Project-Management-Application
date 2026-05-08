const express = require('express');
const router = express.Router();
const { getComments, addComment } = require('../controllers/comment.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
    .get(getComments)
    .post(addComment);

module.exports = router;

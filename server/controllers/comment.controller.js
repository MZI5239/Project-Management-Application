const Comment = require('../models/Comment');

// @desc    Get comments for a task
// @route   GET /api/comments
exports.getComments = async (req, res) => {
    try {
        const { taskId } = req.query;
        if (!taskId) {
            return res.status(400).json({ success: false, message: 'Task ID is required' });
        }

        const comments = await Comment.find({ task: taskId })
            .populate('author', 'name avatar')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            data: comments
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Add comment to a task
// @route   POST /api/comments
exports.addComment = async (req, res) => {
    try {
        const { text, task: taskId } = req.body;

        if (!text || !taskId) {
            return res.status(400).json({ success: false, message: 'Text and Task ID are required' });
        }

        // Validate task existence
        const task = await require('../models/Task').findById(taskId);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        // Check if project is active
        const Project = require('../models/Project');
        const project = await Project.findById(task.project);
        if (project.status !== 'active') {
            return res.status(403).json({ success: false, message: 'Cannot add comments to tasks in archived projects' });
        }

        const comment = await Comment.create({
            text,
            task: taskId,
            author: req.user._id
        });

        const populatedComment = await Comment.findById(comment._id).populate('author', 'name avatar');

        // Emit real-time update to the specific task room and the project room
        if (global.io) {
            global.io.to(taskId.toString()).emit('comment:added', populatedComment);
            if (task.project) {
                global.io.to(task.project.toString()).emit('comment:added', populatedComment);
            }
        }

        res.status(201).json({
            success: true,
            data: populatedComment
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

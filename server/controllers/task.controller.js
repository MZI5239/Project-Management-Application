const Task = require('../models/Task');

// @desc    Get tasks for a project
// @route   GET /api/tasks
exports.getTasks = async (req, res) => {
    try {
        const { projectId } = req.query;
        if (!projectId) {
            return res.status(400).json({ success: false, message: 'Project ID is required' });
        }

        const tasks = await Task.find({ project: projectId })
            .populate('assignees', 'name avatar')
            .sort('dueDate');

        res.status(200).json({
            success: true,
            data: tasks
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create new task
// @route   POST /api/tasks
exports.createTask = async (req, res) => {
    try {
        const { project: projectId } = req.body;
        const Project = require('../models/Project');
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Only leader (owner) can create tasks
        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only the leader can create tasks' });
        }

        const task = await Task.create(req.body);
        const populatedTask = await Task.findById(task._id).populate('assignees', 'name avatar');

        // Optional: Emit socket event for new task creation
        global.io.to(task.project.toString()).emit('task:created', populatedTask);

        res.status(201).json({
            success: true,
            data: populatedTask
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        const Project = require('../models/Project');
        const project = await Project.findById(task.project);

        // Allow leader (owner) OR assignee to update tasks
        const isOwner = project.owner.toString() === req.user._id.toString();
        const isAssignee = task.assignees && task.assignees.some(a => a.toString() === req.user._id.toString());

        if (!isOwner && !isAssignee) {
            return res.status(403).json({ success: false, message: 'Only the leader or an assignee can update this task' });
        }

        // If not owner, restrict updates to status only (prevent changing title, assignees, etc.)
        let updateData = req.body;
        if (!isOwner && isAssignee) {
            // Only allow status updates for assignee
            const { status } = req.body;
            if (Object.keys(req.body).some(key => key !== 'status')) {
                return res.status(403).json({ success: false, message: 'Assignees can only update task status' });
            }
            updateData = { status };
        }

        const updatedTask = await Task.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        }).populate('assignees', 'name avatar');

        // Emit updated task to the project board
        global.io.to(updatedTask.project.toString()).emit('task:updated', updatedTask);

        res.status(200).json({
            success: true,
            data: updatedTask
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        const Project = require('../models/Project');
        const project = await Project.findById(task.project);

        // Only leader (owner) can delete tasks
        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only the leader can delete tasks' });
        }

        const projectId = task.project.toString();
        await task.deleteOne();

        // Emit delete event to the project board
        global.io.to(projectId).emit('task:deleted', req.params.id);

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

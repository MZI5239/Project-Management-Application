const Project = require('../models/Project');
const sendEmail = require('../utils/sendEmail');

// @desc    Get all projects for current user (owner or member)
// @route   GET /api/projects
exports.getProjects = async (req, res) => {
    try {
        const projects = await Project.find({
            $or: [
                { owner: req.user._id },
                { members: req.user._id }
            ]
        }).populate('owner', 'name email');

        res.status(200).json({
            success: true,
            data: projects
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create new project
// @route   POST /api/projects
exports.createProject = async (req, res) => {
    try {
        const project = await Project.create({
            ...req.body,
            owner: req.user._id
        });

        res.status(201).json({
            success: true,
            data: project
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single project
// @route   GET /api/projects/:id
exports.getProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('members', 'name email avatar')
            .populate('owner', 'name email');

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        res.status(200).json({
            success: true,
            data: project
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update project
// @route   PUT /api/projects/:id
exports.updateProject = async (req, res) => {
    try {
        let project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Make sure user is project owner (leader)
        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only the leader can update the project' });
        }

        project = await Project.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).populate('members', 'name email avatar').populate('owner', 'name email');

        // Emit updated project to the project room
        if (global.io) {
            global.io.to(req.params.id).emit('project:updated', project);
        }

        res.status(200).json({
            success: true,
            data: project
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Make sure user is project owner (leader)
        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only the leader can delete the project' });
        }

        await project.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Invite member to project
exports.inviteMember = async (req, res) => {
    try {
        const projectCheck = await Project.findById(req.params.id);
        if (!projectCheck) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Make sure user is project owner (leader)
        if (projectCheck.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only the leader can invite members' });
        }

        let userId = req.body.userId;
        let recipientEmail = req.body.email;
        let recipientName = '';

        // If email is provided instead of userId, find the user
        let createInvitationOnly = false;
        if (recipientEmail) {
            const User = require('../models/User');
            const user = await User.findOne({ email: recipientEmail });
            if (!user) {
                createInvitationOnly = true;
                recipientName = recipientEmail;
            } else {
                userId = user._id;
                recipientName = user.name;
            }
        } else if (userId) {
            const User = require('../models/User');
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            recipientEmail = user.email;
            recipientName = user.name;
        }

        if (!recipientEmail) {
            return res.status(400).json({ success: false, message: 'User ID or Email is required' });
        }

        let project = projectCheck;
        if (!createInvitationOnly) {
            project = await Project.findByIdAndUpdate(
                req.params.id,
                { $addToSet: { members: userId } },
                { new: true }
            ).populate('members', 'name email avatar')
            .populate('owner', 'name email');
        } else {
            project = await Project.findById(req.params.id)
                .populate('members', 'name email avatar')
                .populate('owner', 'name email');
        }

        // Send email notification
        try {
            const subject = createInvitationOnly
                ? `You're invited to join project: ${project.title}`
                : `You've been added to project: ${project.title}`;

            const text = createInvitationOnly
                ? `Hello,\n\nYou have been invited to join the project "${project.title}" by ${req.user.name}.` +
                  `\n\nIf you already have an account, sign in and join the project here: ${process.env.CLIENT_URL}/projects/${project._id}` +
                  `\n\nIf you're new, sign up with this email to access the project.`
                : `Hello ${recipientName},\n\nYou have been added as a member to the project "${project.title}" by ${req.user.name}.\n\nView it here: ${process.env.CLIENT_URL}/projects/${project._id}`;

            await sendEmail({
                to: recipientEmail,
                subject,
                text
            });
        } catch (error) {
            console.error('Email send failed:', error);
            // We don't return error response here to avoid blocking the invitation if email fails
        }

        // Emit updated project
        if (global.io) {
            global.io.to(req.params.id).emit('project:updated', project);
        }

        res.status(200).json({
            success: true,
            data: project,
            message: createInvitationOnly
                ? `Invitation email sent to ${recipientEmail}`
                : 'Member added successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Transfer leadership
// @route   POST /api/projects/:id/transfer-leadership
exports.transferLeadership = async (req, res) => {
    try {
        const { newOwnerId } = req.body;
        if (!newOwnerId) {
            return res.status(400).json({ success: false, message: 'New leader ID is required' });
        }

        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Make sure user is project owner (leader)
        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only the current leader can transfer leadership' });
        }

        const oldOwnerId = project.owner;
        const User = require('../models/User');
        const newOwner = await User.findById(newOwnerId);
        
        if (!newOwner) {
            return res.status(404).json({ success: false, message: 'New leader not found' });
        }

        // Move current owner to members list and set new owner
        project.members.addToSet(project.owner);
        project.owner = newOwnerId;
        // Optionally remove new owner from members if they were there
        project.members.pull(newOwnerId);

        await project.save();

        const updatedProject = await Project.findById(project._id)
            .populate('members', 'name email avatar')
            .populate('owner', 'name email');

        // Send email to new owner
        try {
            await sendEmail({
                to: newOwner.email,
                subject: `You are now the leader of: ${updatedProject.title}`,
                text: `Hello ${newOwner.name},\n\nYou have been promoted to the leader of project "${updatedProject.title}" by ${req.user.name}.\n\nView it here: ${process.env.CLIENT_URL}/projects/${updatedProject._id}`
            });
        } catch (error) {
            console.error('Email to new owner failed:', error);
        }

        // Emit updated project
        if (global.io) {
            global.io.to(project._id.toString()).emit('project:updated', updatedProject);
        }

        res.status(200).json({
            success: true,
            data: updatedProject
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Toggle project status (active/inactive)
// @route   PATCH /api/projects/:id/toggle-status
exports.toggleProjectStatus = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Make sure user is project owner (leader)
        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only the leader can toggle project status' });
        }

        // Toggle status
        project.status = project.status === 'active' ? 'archived' : 'active';
        await project.save();

        const updatedProject = await Project.findById(project._id)
            .populate('members', 'name email avatar')
            .populate('owner', 'name email');

        // Emit updated project
        if (global.io) {
            global.io.to(project._id.toString()).emit('project:updated', updatedProject);
        }

        res.status(200).json({
            success: true,
            data: updatedProject
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

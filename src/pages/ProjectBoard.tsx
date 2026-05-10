import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { 
    Layout, 
    Plus, 
    MoreVertical, 
    Calendar, 
    User as UserIcon, 
    ArrowLeft, 
    Loader2, 
    AlertCircle,
    CheckCircle2,
    Clock,
    CircleDashed,
    Trash2,
    Shield,
    MessageSquare,
    Send
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../api/axios';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { AuthUser } from '../context/AuthContext';

interface Task {
    _id: string;
    title: string;
    description?: string;
    status: 'todo' | 'inprogress' | 'done';
    priority: 'low' | 'medium' | 'high';
    project: string;
    assignees?: { name: string; avatar?: string; _id: string }[];
    dueDate?: string;
    dependencies?: string[];
    labels?: string[];
}

interface Comment {
    _id: string;
    text: string;
    author: { name: string; avatar?: string; _id: string };
    task: string;
    createdAt: string;
}

type Assignee = string | { name: string; avatar?: string; _id?: string };

const COLUMNS = [
    { id: 'todo', title: 'To Do', icon: CircleDashed, color: 'bg-white/10 text-slate-200' },
    { id: 'inprogress', title: 'In Progress', icon: Clock, color: 'bg-cyan-400/20 text-cyan-100' },
    { id: 'done', title: 'Done', icon: CheckCircle2, color: 'bg-emerald-400/20 text-emerald-100' }
];

interface ProjectParticipant {
    _id: string;
    name: string;
    email?: string;
    avatar?: string;
}

interface ProjectData {
    _id: string;
    title: string;
    description?: string;
    status: 'active' | 'archived';
    owner?: ProjectParticipant;
    members?: ProjectParticipant[];
}

const ProjectBoard = () => {
    const { id } = useParams<{ id: string }>();
    const { user: currentUser } = useAuth() as { user: AuthUser | null };
    const [project, setProject] = useState<ProjectData | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddTask, setShowAddTask] = useState<string | null>(null);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDueDate, setNewTaskDueDate] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('low');
    const [newTaskAssignees, setNewTaskAssignees] = useState<string[]>([]);
    const [newTaskDependencies, setNewTaskDependencies] = useState<string[]>([]);
    const [newTaskLabels, setNewTaskLabels] = useState<string[]>([]);
    const [labelInput, setLabelInput] = useState('');
    const [commentsByTask, setCommentsByTask] = useState<Record<string, Comment[]>>({});
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
    const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ 
        title: '', 
        description: '', 
        dueDate: '', 
        priority: 'low' as Task['priority'], 
        assignees: [] as string[], 
        dependencies: [] as string[],
        labels: [] as string[]
    });
    const [editLabelInput, setEditLabelInput] = useState('');

    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviting, setInviting] = useState(false);

    const [showLeadershipModal, setShowLeadershipModal] = useState(false);
    const [transferring, setTransferring] = useState(false);

    const [showProjectMenu, setShowProjectMenu] = useState(false);

    const isLeader = !!project && !!currentUser && project.owner?._id === currentUser._id;
    
    const participants = project ? [project.owner, ...(project.members || [])].filter(Boolean) as ProjectParticipant[] : [];

    const getLabelColor = (label: string) => {
        const colors = [
            'bg-pink-100 text-pink-700 border-pink-200',
            'bg-purple-100 text-purple-700 border-purple-200',
            'bg-indigo-100 text-indigo-700 border-indigo-200',
            'bg-blue-100 text-blue-700 border-blue-200',
            'bg-cyan-100 text-cyan-700 border-cyan-200',
            'bg-teal-100 text-teal-700 border-teal-200',
            'bg-emerald-100 text-emerald-700 border-emerald-200',
            'bg-amber-100 text-amber-700 border-amber-200',
            'bg-orange-100 text-orange-700 border-orange-200',
        ];
        let hash = 0;
        for (let i = 0; i < label.length; i++) {
            hash = label.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const checkDependencies = (task: Pick<Task, 'dependencies'>, newStatus: string) => {
        if (newStatus === 'todo') return true;
        if (!task.dependencies || task.dependencies.length === 0) return true;

        const incompletes = task.dependencies.filter(depId => {
            const depTask = tasks.find(t => t._id === depId);
            return !depTask || depTask.status !== 'done';
        });

        if (incompletes.length > 0) {
            const prereqTitles = incompletes
                .map(id => tasks.find(t => t._id === id)?.title || 'Unknown Task')
                .join(', ');
            toast.error(`Prerequisites not completed: ${prereqTitles}`);
            return false;
        }
        return true;
    };

    const getAssigneeName = (assignee: Assignee) => {
        if (typeof assignee === 'string') return 'Assigned';
        return assignee.name || 'Assigned';
    };

    const getAssigneeAvatar = (assignee: Assignee) => {
        if (typeof assignee === 'string') return undefined;
        return assignee.avatar;
    };

    const upsertTaskById = (nextTask: Task) => {
        setTasks(prev => {
            const existingIndex = prev.findIndex(task => task._id === nextTask._id);

            if (existingIndex === -1) {
                return [...prev, nextTask];
            }

            const nextTasks = [...prev];
            nextTasks[existingIndex] = { ...nextTasks[existingIndex], ...nextTask };
            return nextTasks;
        });
    };

    const fetchProjectData = useCallback(async () => {
        if (!id) return;
        try {
            const [projRes, tasksRes] = await Promise.all([
                api.get(`/projects/${id}`),
                api.get(`/tasks?projectId=${id}`)
            ]);
            setProject(projRes.data.data);
            setTasks(tasksRes.data.data);
        } catch (error) {
            toast.error('Failed to load project board');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchProjectData();
    }, [fetchProjectData]);

    // Handle real-time updates
    const handleRemoteTaskUpdate = useCallback((update: any) => {
        if (update._isDeleted) {
            setTasks(prev => prev.filter(t => t._id !== update._id));
        } else if (update._isNew) {
            setTasks(prev => {
                // Prevent duplicate addition
                if (prev.find(t => t._id === update._id)) return prev;
                return [...prev, update];
            });
        } else {
            setTasks(prev => prev.map(t => t._id === update._id ? { ...t, ...update } : t));
        }
    }, []);

    const handleRemoteProjectUpdate = useCallback((updatedProject: any) => {
        setProject(updatedProject);
    }, []);

    const handleRemoteCommentAdded = useCallback((comment: Comment) => {
        setCommentsByTask(prev => ({
            ...prev,
            [comment.task]: [comment, ...(prev[comment.task] || [])]
        }));
    }, []);

    useSocket(id || '', handleRemoteTaskUpdate, handleRemoteCommentAdded, handleRemoteProjectUpdate);

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;
        if (project?.status !== 'active') return;
        
        const task = tasks.find(t => t._id === draggableId);
        if (!task) return;

        const isAssignee = task.assignees?.some(a => (a._id || a) === currentUser?._id);

        if (!isLeader && !isAssignee) {
            toast.error('Only the leader or an assignee can move this task');
            return;
        }

        // Optimistic update
        const updatedStatus = destination.droppableId as Task['status'];
        
        if (!checkDependencies(task, updatedStatus)) return;

        const oldTasks = [...tasks];
        
        setTasks(prev => prev.map(t => t._id === draggableId ? { ...t, status: updatedStatus } : t));

        try {
            await api.put(`/tasks/${draggableId}`, { status: updatedStatus });
            toast.success(`Task moved to ${updatedStatus}`);
        } catch (error) {
            setTasks(oldTasks);
            toast.error('Failed to move task');
        }
    };

    const handleMarkComplete = async (task: Task, e: React.MouseEvent) => {
        e.stopPropagation();
        
        const isAssignee = task.assignees?.some(a => (a._id || a) === currentUser?._id);
        if ((!isLeader && !isAssignee) || project?.status !== 'active') {
            toast.error('Only the leader or an assignee can complete this task');
            return;
        }

        if (!checkDependencies(task, 'done')) return;

        const oldTasks = [...tasks];
        setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: 'done' } : t));

        try {
            await api.put(`/tasks/${task._id}`, { status: 'done' });
            toast.success('Task marked as complete');
        } catch (error) {
            setTasks(oldTasks);
            toast.error('Failed to complete task');
        }
    };

    const handleToggleProjectStatus = async () => {
        if (!isLeader || !project) return;

        try {
            const res = await api.patch(`/projects/${project._id}/toggle-status`);
            setProject(res.data.data);
            setShowProjectMenu(false);
            toast.success(`Project ${res.data.data.status === 'active' ? 'activated' : 'deactivated'} successfully`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update project status');
        }
    };

    const handleAddTask = async (status: string) => {
        if (!isLeader || project?.status !== 'active') return;
        if (!newTaskTitle.trim()) return;
        try {
            const res = await api.post('/tasks', {
                title: newTaskTitle,
                project: id,
                status,
                dueDate: newTaskDueDate || undefined,
                priority: newTaskPriority,
                assignees: newTaskAssignees,
                dependencies: newTaskDependencies,
                labels: newTaskLabels
            });
            upsertTaskById(res.data.data);
            setNewTaskTitle('');
            setNewTaskDueDate('');
            setNewTaskPriority('low');
            setNewTaskAssignees([]);
            setNewTaskDependencies([]);
            setNewTaskLabels([]);
            setLabelInput('');
            setShowAddTask(null);
            toast.success('Task added');
        } catch (error) {
            toast.error('Failed to add task');
        }
    };

    const handleEditTask = (task: Task) => {
        const isAssignee = task.assignees?.some(a => (a._id || a) === currentUser?._id);
        if ((!isLeader && !isAssignee) || project?.status !== 'active') return;
        setEditingTask(task);
        fetchComments(task._id);
        setEditForm({
            title: task.title,
            description: task.description || '',
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
            priority: task.priority || 'low',
            assignees: task.assignees?.map(a => a._id || a as any) || [],
            dependencies: task.dependencies || [],
            labels: task.labels || []
        });
    };

    const handleUpdateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTask || project?.status !== 'active') return;
        
        const isAssignee = editingTask.assignees?.some(a => (a._id || a) === currentUser?._id);
        if (!isLeader && !isAssignee) return;

        // If not leader, only allow status update (though edit mode UI already restricts)
        // If status is changed in the editor (though currently it's not direct in the modal, 
        // if it were, we'd check), but let's check for current status if it's already in progress/done
        if (!checkDependencies({ ...editingTask, ...editForm }, editingTask.status)) return;

        try {
            const dataToUpdate = isLeader ? {
                ...editForm,
                dueDate: editForm.dueDate || null
            } : {
                status: editingTask.status // Actually status isn't even in the edit form yet, it's modified by dragging or mark complete
            };

            const res = await api.put(`/tasks/${editingTask._id}`, dataToUpdate);
            setTasks(prev => prev.map(t => t._id === editingTask._id ? res.data.data : t));
            setEditingTask(null);
            toast.success('Task updated');
        } catch (error) {
            toast.error('Failed to update task');
        }
    };

    const handleDeleteTask = async (taskId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        
        if (!isLeader || project?.status !== 'active') return;
        if (!window.confirm('Are you sure you want to delete this task?')) return;

        try {
            await api.delete(`/tasks/${taskId}`);
            setTasks(prev => prev.filter(t => t._id !== taskId));
            setEditingTask(null);
            toast.success('Task deleted');
        } catch (error) {
            toast.error('Failed to delete task');
        }
    };

    const handleInviteMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLeader || project?.status !== 'active' || !inviteEmail.trim()) return;
        
        setInviting(true);
        try {
            const res = await api.post(`/projects/${id}/invite`, { email: inviteEmail });
            setProject(res.data.data);
            setInviteEmail('');
            setShowInviteModal(false);
            toast.success('Member added successfully');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to add member');
        } finally {
            setInviting(false);
        }
    };

    const fetchComments = async (taskId: string) => {
        if (commentsByTask[taskId]) return; // Already fetched
        try {
            const res = await api.get(`/comments?taskId=${taskId}`);
            setCommentsByTask(prev => ({
                ...prev,
                [taskId]: res.data.data
            }));
        } catch (error) {
            console.error('Failed to fetch comments', error);
        }
    };

    const handleAddComment = async (taskId: string) => {
        if (project?.status !== 'active') return;
        const text = commentInputs[taskId];
        if (!text?.trim()) return;

        try {
            const res = await api.post('/comments', { text, task: taskId });
            // Socket will handle adding it to the list, but we can also do it locally
            // for immediate feedback if we want, but let's rely on socket for consistency
            setCommentInputs(prev => ({ ...prev, [taskId]: '' }));
        } catch (error) {
            toast.error('Failed to add comment');
        }
    };

    const handleTransferLeadership = async (newOwnerId: string) => {
        if (!isLeader || project?.status !== 'active') return;
        if (!window.confirm('Are you sure you want to transfer leadership? You will become a member.')) return;

        setTransferring(true);
        try {
            const res = await api.post(`/projects/${id}/transfer-leadership`, { newOwnerId });
            setProject(res.data.data);
            setShowLeadershipModal(false);
            toast.success('Leadership transferred successfully');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to transfer leadership');
        } finally {
            setTransferring(false);
        }
    };

    if (loading) {
        return (
            <div className="relative min-h-screen overflow-hidden bg-[#06111f] text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.3),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.24),_transparent_30%),linear-gradient(135deg,_#06111f_0%,_#0d1728_45%,_#101b33_100%)]" />
                <div className="relative flex min-h-screen items-center justify-center">
                    <Loader2 className="w-10 h-10 text-cyan-300 animate-spin" />
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="relative min-h-screen overflow-hidden bg-[#06111f] text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.3),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.24),_transparent_30%),linear-gradient(135deg,_#06111f_0%,_#0d1728_45%,_#101b33_100%)]" />
                <div className="relative min-h-screen flex flex-col items-center justify-center text-center px-4">
                    <AlertCircle className="w-12 h-12 text-rose-300 mb-4" />
                    <h1 className="text-2xl font-bold text-white">Project Not Found</h1>
                    <Link to="/" className="mt-4 text-cyan-200 hover:text-cyan-100 underline underline-offset-4">Return to Dashboard</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#06111f] text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.3),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.24),_transparent_30%),linear-gradient(135deg,_#06111f_0%,_#0d1728_45%,_#101b33_100%)]" />
            <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:42px_42px]" />

            <div className="relative flex min-h-screen flex-col">
            <Navbar />

            <header className="border-b border-white/10 bg-white/6 backdrop-blur-xl py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0"
                    >
                        <div className="flex items-center space-x-4">
                            <Link to="/" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <ArrowLeft className="w-5 h-5 text-slate-300" />
                            </Link>
                            <div>
                                <div className="flex items-center space-x-2">
                                    <h1 className="text-2xl font-black text-white">{project.title}</h1>
                                    <span className="px-2 py-0.5 bg-cyan-400/15 text-cyan-100 text-[10px] font-bold uppercase rounded-md tracking-wider border border-cyan-300/20">
                                        Board
                                    </span>
                                </div>
                                <p className="text-sm text-slate-300 mt-0.5">{project.description || 'Project visualization board'}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <div className="flex -space-x-2">
                                {/* Owner badge */}
                                <div className="relative group">
                                    <div className="w-8 h-8 rounded-full border-2 border-cyan-500 bg-slate-800/70 flex items-center justify-center overflow-hidden z-20" title={`Leader: ${project.owner?.name}`}>
                                        {project.owner?.avatar ? (
                                            <img src={project.owner?.avatar} alt={project.owner?.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-[10px] font-bold text-cyan-200">{project.owner?.name[0]}</span>
                                        )}
                                    </div>
                                    <Shield className="absolute -top-1 -right-1 w-3.5 h-3.5 text-cyan-300 fill-cyan-300 z-30" />
                                </div>

                                {project.members?.map((member: any) => (
                                    <div key={member._id} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700/70 flex items-center justify-center overflow-hidden" title={member.name}>
                                        {member.avatar ? (
                                            <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-[10px] font-bold text-slate-200">{member.name[0]}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="h-6 w-px bg-white/20 mx-1" />
                            {isLeader && project?.status === 'active' && (
                                <button 
                                    onClick={() => setShowInviteModal(true)}
                                    className="p-2 text-slate-300 hover:text-cyan-200 hover:bg-cyan-400/10 rounded-full transition-colors"
                                    title="Invite Members"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            )}
                            {isLeader && project?.status === 'active' && (
                                <button 
                                    onClick={() => setShowLeadershipModal(true)}
                                    className="p-2 text-slate-300 hover:text-amber-200 hover:bg-amber-400/10 rounded-full transition-colors"
                                    title="Manage Leadership"
                                >
                                    <Shield className="w-5 h-5" />
                                </button>
                            )}
                            <button 
                                onClick={() => setShowProjectMenu(!showProjectMenu)}
                                className="relative p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                            >
                                <MoreVertical className="w-5 h-5" />
                                {showProjectMenu && (
                                    <div className="absolute right-0 top-12 z-20 min-w-[180px] rounded-3xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
                                        <button
                                            onClick={handleToggleProjectStatus}
                                            className="w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold text-slate-100 transition-colors hover:bg-slate-900/80"
                                        >
                                            {project?.status === 'active' ? 'Deactivate project' : 'Activate project'}
                                        </button>
                                    </div>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            </header>

            {project?.status === 'archived' && (
                <div className="mx-4 md:mx-8 mb-4">
                    <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-center">
                        <p className="text-amber-200 font-semibold">
                            This project is currently deactivated. Only the project leader can reactivate it.
                        </p>
                    </div>
                </div>
            )}

            <main className="flex-1 overflow-x-auto p-4 md:p-8">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="max-w-7xl mx-auto h-full min-w-[800px]"
                >
                    <DragDropContext onDragEnd={onDragEnd}>
                        <div className="grid grid-cols-3 gap-6 h-full">
                            {COLUMNS.map(column => (
                                <div key={column.id} className="flex flex-col h-full bg-white/6 rounded-2xl border border-white/10 p-4 backdrop-blur-xl">
                                    <div className="flex items-center justify-between mb-4 px-2">
                                        <div className="flex items-center space-x-2">
                                            <div className={`p-1.5 rounded-md ${column.color}`}>
                                                <column.icon className="w-4 h-4" />
                                            </div>
                                            <h2 className="font-bold text-white">{column.title}</h2>
                                            <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs font-bold text-slate-300 border border-white/15">
                                                {tasks.filter(t => t.status === column.id).length}
                                            </span>
                                        </div>
                                        {isLeader && project?.status === 'active' && (
                                            <button 
                                                onClick={() => setShowAddTask(column.id)}
                                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                            >
                                                <Plus className="w-4 h-4 text-slate-300" />
                                            </button>
                                        )}
                                    </div>

                                    <Droppable droppableId={column.id}>
                                        {(provided) => (
                                            <div
                                                {...provided.droppableProps}
                                                ref={provided.innerRef}
                                                className="flex-1 min-h-[100px] space-y-3"
                                            >
                                                {tasks
                                                    .filter(task => task.status === column.id)
                                                    .map((task, index) => {
                                                        const draggableProps: any = {
                                                            key: task._id,
                                                            draggableId: task._id,
                                                            index: index,
                                                            isDragDisabled: project?.status !== 'active' || (!isLeader && !task.assignees?.some(a => (a._id || a) === currentUser?._id))
                                                        };
                                                        
                                                        const activeSourceId = hoveredTaskId || editingTask?._id;
                                                        const isActivePrerequisite = activeSourceId && 
                                                            tasks.find(t => t._id === activeSourceId)?.dependencies?.includes(task._id);
                                                        
                                                        const unmetDependencies = task.dependencies?.filter(depId => {
                                                            const dep = tasks.find(t => t._id === depId);
                                                            return !dep || dep.status !== 'done';
                                                        }) || [];
                                                        const hasUnmetDependencies = unmetDependencies.length > 0;

                                                        return (
                                                            <Draggable {...draggableProps}>
                                                                {(provided: any, snapshot: any) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    onClick={() => handleEditTask(task)}
                                                                    onMouseEnter={() => setHoveredTaskId(task._id)}
                                                                    onMouseLeave={() => setHoveredTaskId(null)}
                                                                    className={`bg-white/92 p-4 rounded-xl shadow-[0_14px_36px_rgba(2,6,23,0.28)] border group hover:border-cyan-300/60 transition-all cursor-pointer ${
                                                                        snapshot.isDragging ? 'shadow-xl rotate-1 border-cyan-400' : 
                                                                        isActivePrerequisite ? 'border-cyan-500 ring-2 ring-cyan-300/30 shadow-md transform scale-[1.02]' :
                                                                        'border-slate-200'
                                                                    }`}
                                                                >
                                                                    <div className="flex justify-between items-start mb-3">
                                                                        <span className={`text-[9px] uppercase font-black tracking-widest px-1.5 py-0.5 rounded ${
                                                                            task.priority === 'high' ? 'bg-red-50 text-red-600 border border-red-100' :
                                                                            task.priority === 'medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                                                                            'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                                        }`}>
                                                                            {task.priority || 'low'}
                                                                        </span>
                                                                        <div className="flex items-center space-x-1">
                                                                            {isLeader && project?.status === 'active' && (
                                                                                <button 
                                                                                    onClick={(e) => handleDeleteTask(task._id, e)}
                                                                                    className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-all opacity-0 group-hover:opacity-100"
                                                                                    title="Delete Task"
                                                                                >
                                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            )}
                                                                            {isLeader && project?.status === 'active' && <MoreVertical className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <h3 className="font-semibold text-slate-900 mb-1 leading-snug group-hover:text-cyan-700 transition-colors">
                                                                        {task.title}
                                                                    </h3>

                                                                    {task.labels && task.labels.length > 0 && (
                                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                                            {task.labels.map((label, i) => (
                                                                                <span 
                                                                                    key={i} 
                                                                                    className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${getLabelColor(label)}`}
                                                                                >
                                                                                    {label}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                    
                                                                    {task.dueDate && (
                                                                        <div className={`inline-flex items-center space-x-1 text-[10px] mt-2 mb-3 px-2 py-0.5 rounded-md font-bold transition-all ${
                                                                            new Date(task.dueDate) < new Date() 
                                                                                ? 'bg-red-600 text-white shadow-sm' 
                                                                                : 'bg-gray-100 text-gray-500'
                                                                        }`}>
                                                                            <Calendar className="w-3 h-3" />
                                                                            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                                                                        </div>
                                                                    )}

                                                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                                                                        <div className="flex items-center -space-x-1.5 overflow-hidden">
                                                                            {task.assignees && task.assignees.length > 0 ? (
                                                                                task.assignees.slice(0, 3).map((a, idx) => (
                                                                                    <div 
                                                                                        key={idx} 
                                                                                        className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center overflow-hidden z-10"
                                                                                        title={getAssigneeName(a as Assignee)}
                                                                                    >
                                                                                        {getAssigneeAvatar(a as Assignee) ? (
                                                                                            <img src={getAssigneeAvatar(a as Assignee)} alt={getAssigneeName(a as Assignee)} className="w-full h-full object-cover" />
                                                                                        ) : (
                                                                                            <span className="text-[10px] font-bold text-gray-400">{getAssigneeName(a as Assignee)[0]}</span>
                                                                                        )}
                                                                                    </div>
                                                                                ))
                                                                            ) : (
                                                                                <div className="w-6 h-6 rounded-full bg-gray-50 border-2 border-white flex items-center justify-center overflow-hidden">
                                                                                    <UserIcon className="w-3 h-3 text-gray-300" />
                                                                                </div>
                                                                            )}
                                                                            {task.assignees && task.assignees.length > 3 && (
                                                                                <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center z-20">
                                                                                    <span className="text-[8px] font-bold text-gray-600">+{task.assignees.length - 3}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        <div className="flex items-center space-x-2">
                                                                            {(isLeader || task.assignees?.some(a => (a._id || a) === currentUser?._id)) && task.status !== 'done' && (
                                                                                <button 
                                                                                    onClick={(e) => handleMarkComplete(task, e)}
                                                                                    className="p-1 text-emerald-500 hover:bg-emerald-50 rounded-full transition-all border border-emerald-100 shadow-sm flex items-center justify-center group/complete mr-1"
                                                                                    title="Mark as Complete"
                                                                                 >
                                                                                    <CheckCircle2 className="w-3 h-3 group-hover/complete:scale-110 transition-transform" />
                                                                                 </button>
                                                                            )}
                                                                            <button 
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    const isOpen = !expandedComments[task._id];
                                                                                    setExpandedComments(prev => ({ ...prev, [task._id]: isOpen }));
                                                                                    if (isOpen) fetchComments(task._id);
                                                                                }}
                                                                                className="flex items-center space-x-1 text-slate-400 hover:text-cyan-700 transition-colors"
                                                                            >
                                                                                <MessageSquare className="w-3.5 h-3.5" />
                                                                                <span className="text-[10px] font-bold">
                                                                                    {commentsByTask[task._id]?.length || 0}
                                                                                </span>
                                                                            </button>

                                                                            {task.dependencies && task.dependencies.length > 0 && (
                                                                                <div 
                                                                                    className={`flex items-center space-x-1 ${hasUnmetDependencies ? 'text-red-500' : 'text-emerald-500'}`} 
                                                                                    title={hasUnmetDependencies ? `Unmet prerequisites: ${unmetDependencies.length}` : 'Prerequisites completed'}
                                                                                >
                                                                                    <Shield className={`w-3.5 h-3.5 ${hasUnmetDependencies ? 'animate-pulse' : ''}`} />
                                                                                    <span className="text-[10px] font-bold">{task.dependencies.length}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Inline Comments Section */}
                                                                    <AnimatePresence>
                                                                        {expandedComments[task._id] && (
                                                                            <motion.div
                                                                                initial={{ height: 0, opacity: 0 }}
                                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                                exit={{ height: 0, opacity: 0 }}
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                className="overflow-hidden"
                                                                            >
                                                                                <div className="mt-4 pt-2 border-t border-slate-100 space-y-2">
                                                                                    <div className="max-h-32 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                                                                        {commentsByTask[task._id]?.map(comment => (
                                                                                            <div key={comment._id} className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                                                                <div className="flex items-center justify-between mb-1">
                                                                                                    <span className="text-[8px] font-black text-gray-700 uppercase">
                                                                                                        {comment.author?.name}
                                                                                                    </span>
                                                                                                    <span className="text-[8px] text-gray-400">
                                                                                                        {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                                    </span>
                                                                                                </div>
                                                                                                <p className="text-[10px] text-gray-600 leading-tight">{comment.text}</p>
                                                                                            </div>
                                                                                        ))}
                                                                                        {(!commentsByTask[task._id] || commentsByTask[task._id].length === 0) && (
                                                                                            <p className="text-[9px] text-gray-400 italic text-center py-1">No comments yet.</p>
                                                                                        )}
                                                                                    </div>
                                                                                    
                                                                                    <div className="flex items-center space-x-1">
                                                                                        <input
                                                                                            disabled={project?.status !== 'active'}
                                                                                            value={commentInputs[task._id] || ''}
                                                                                            onChange={(e) => setCommentInputs(prev => ({ ...prev, [task._id]: e.target.value }))}
                                                                                            placeholder="Comment..."
                                                                                            className="flex-1 text-[10px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                                            onKeyDown={(e) => {
                                                                                                if (e.key === 'Enter') {
                                                                                                    e.preventDefault();
                                                                                                    handleAddComment(task._id);
                                                                                                }
                                                                                            }}
                                                                                        />
                                                                                        <button 
                                                                                            disabled={project?.status !== 'active'}
                                                                                            onClick={() => handleAddComment(task._id)}
                                                                                            className="p-1 bg-cyan-50 text-cyan-700 rounded-lg hover:bg-cyan-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                                        >
                                                                                            <Send className="w-3 h-3" />
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            </motion.div>
                                                                        )}
                                                                    </AnimatePresence>
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    );
                                                })}
                                                {provided.placeholder}
                                                
                                                {showAddTask === column.id && (
                                                    <div className="bg-white/95 p-3 rounded-xl border-2 border-cyan-300/40 shadow-lg animate-in fade-in zoom-in duration-200">
                                                        <input
                                                            autoFocus
                                                            disabled={project?.status !== 'active'}
                                                            type="text"
                                                            value={newTaskTitle}
                                                            onChange={(e) => setNewTaskTitle(e.target.value)}
                                                            className="w-full text-sm outline-none mb-3 font-medium text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            placeholder="What needs to be done?"
                                                            onKeyDown={(e) => e.key === 'Enter' && handleAddTask(column.id)}
                                                        />
                                                        <div className="flex items-center space-x-2 mb-3">
                                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                            <input 
                                                                disabled={project?.status !== 'active'}
                                                                type="date"
                                                                value={newTaskDueDate}
                                                                onChange={(e) => setNewTaskDueDate(e.target.value)}
                                                                className="text-[10px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200 outline-none flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            />
                                                            <select
                                                                disabled={project?.status !== 'active'}
                                                                value={newTaskPriority}
                                                                onChange={(e) => setNewTaskPriority(e.target.value as any)}
                                                                className="text-[10px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200 outline-none w-20 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                <option value="low">Low</option>
                                                                <option value="medium">Med</option>
                                                                <option value="high">High</option>
                                                            </select>
                                                            <select
                                                                disabled={project?.status !== 'active'}
                                                                multiple
                                                                value={newTaskAssignees}
                                                                onChange={(e) => setNewTaskAssignees(Array.from(e.target.selectedOptions).map((o: any) => o.value))}
                                                                className="text-[10px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200 outline-none flex-1 h-16 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                {participants.map((member: any) => (
                                                                    <option key={member._id} value={member._id}>{member.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="flex flex-col space-y-1 mb-3">
                                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Prerequisites</label>
                                                            <select
                                                                disabled={project?.status !== 'active'}
                                                                multiple
                                                                value={newTaskDependencies}
                                                                onChange={(e) => setNewTaskDependencies(Array.from(e.target.selectedOptions).map((o: any) => o.value))}
                                                                className="w-full text-[10px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200 outline-none h-16 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                {tasks.map(t => (
                                                                    <option key={t._id} value={t._id}>{t.title}</option>
                                                                ))}
                                                            </select>
                                                            <p className="text-[8px] text-slate-400 italic">Ctrl+Click to select</p>
                                                        </div>
                                                        <div className="flex flex-col space-y-1 mb-3">
                                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Labels</label>
                                                            <div className="flex flex-wrap gap-1 mb-1">
                                                                {newTaskLabels.map((label, i) => (
                                                                    <span 
                                                                        key={i} 
                                                                        onClick={() => project?.status === 'active' && setNewTaskLabels(prev => prev.filter((_, idx) => idx !== i))}
                                                                        className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${project?.status === 'active' ? 'cursor-pointer hover:opacity-70' : 'cursor-not-allowed opacity-50' } ${getLabelColor(label)}`}
                                                                    >
                                                                        {label} {project?.status === 'active' && '×'}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            <input 
                                                                disabled={project?.status !== 'active'}
                                                                type="text"
                                                                value={labelInput}
                                                                onChange={(e) => setLabelInput(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter' && labelInput.trim()) {
                                                                        e.preventDefault();
                                                                        if (!newTaskLabels.includes(labelInput.trim())) {
                                                                            setNewTaskLabels(prev => [...prev, labelInput.trim()]);
                                                                        }
                                                                        setLabelInput('');
                                                                    }
                                                                }}
                                                                placeholder="Add label & press Enter"
                                                                className="text-[10px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                                            />
                                                        </div>
                                                        <div className="flex justify-end space-x-2">
                                                            <button 
                                                                onClick={() => { 
                                                                    setShowAddTask(null); 
                                                                    setNewTaskTitle(''); 
                                                                    setNewTaskDueDate(''); 
                                                                    setNewTaskPriority('low');
                                                                    setNewTaskAssignees([]);
                                                                    setNewTaskDependencies([]);
                                                                    setNewTaskLabels([]);
                                                                    setLabelInput('');
                                                                }}
                                                                className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded font-bold"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button 
                                                                disabled={project?.status !== 'active'}
                                                                onClick={() => handleAddTask(column.id)}
                                                                className="px-2 py-1 text-xs bg-cyan-600 text-white rounded font-bold hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                Add Task
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            ))}
                        </div>
                    </DragDropContext>
                </motion.div>
            </main>

            <Footer />

            {/* Task Edit Modal */}
            <AnimatePresence>
                {editingTask && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setEditingTask(null)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg rounded-[2rem] border border-white/10 bg-white/94 p-8 text-slate-900 shadow-[0_30px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-1 rounded bg-slate-50 mb-2 inline-block ${
                                        editForm.priority === 'high' ? 'text-red-500' :
                                        editForm.priority === 'medium' ? 'text-yellow-600' : 'text-green-500'
                                    }`}>
                                        {editForm.priority} Priority
                                    </span>
                                    <h2 className="text-2xl font-bold text-slate-900 leading-tight">Task Details</h2>
                                </div>
                                <button 
                                    onClick={() => setEditingTask(null)}
                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <AlertCircle className="w-5 h-5 text-slate-400 rotate-45" />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateTask} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
                                    <input
                                        required
                                        type="text"
                                        disabled={!isLeader}
                                        value={editForm.title}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold disabled:opacity-60"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                                    <textarea
                                        rows={3}
                                        disabled={!isLeader}
                                        value={editForm.description}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Add more details..."
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm min-h-[100px] disabled:opacity-60"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Due Date</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="date"
                                                disabled={!isLeader}
                                                value={editForm.dueDate}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, dueDate: e.target.value }))}
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-cyan-500 outline-none transition-all text-sm disabled:opacity-60"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Priority</label>
                                        <select
                                            disabled={!isLeader}
                                            value={editForm.priority}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, priority: e.target.value as any }))}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-cyan-500 outline-none transition-all text-sm font-medium disabled:opacity-60"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Assignees</label>
                                        <div className="relative">
                                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <select
                                                multiple
                                                disabled={!isLeader}
                                                value={editForm.assignees}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, assignees: Array.from(e.target.selectedOptions).map((o: any) => o.value) }))}
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-cyan-500 outline-none transition-all text-sm font-medium disabled:opacity-60 h-24"
                                            >
                                                {participants.map((member: any) => (
                                                    <option key={member._id} value={member._id}>{member.name} ({member.email})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple assignees.</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Prerequisites</label>
                                    <select
                                        multiple
                                        disabled={!isLeader}
                                        value={editForm.dependencies}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, dependencies: Array.from(e.target.selectedOptions).map((o: any) => o.value) }))}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-cyan-500 outline-none transition-all text-sm font-medium h-24 disabled:opacity-60"
                                    >
                                        {tasks.filter(t => t._id !== editingTask?._id).map(t => (
                                            <option key={t._id} value={t._id}>{t.title}</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple dependencies.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Labels</label>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {editForm.labels.map((label, i) => (
                                            <span 
                                                key={i} 
                                                onClick={() => {
                                                    if (!isLeader) return;
                                                    setEditForm(prev => ({ ...prev, labels: prev.labels.filter((_, idx) => idx !== i) }));
                                                }}
                                                className={`text-xs font-bold px-3 py-1 rounded-full border transition-all ${getLabelColor(label)} ${isLeader ? 'cursor-pointer hover:opacity-70' : ''}`}
                                            >
                                                {label} {isLeader && '×'}
                                            </span>
                                        ))}
                                    </div>
                                    {isLeader && (
                                        <input 
                                            type="text"
                                            value={editLabelInput}
                                            onChange={(e) => setEditLabelInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && editLabelInput.trim()) {
                                                    e.preventDefault();
                                                    if (!editForm.labels.includes(editLabelInput.trim())) {
                                                        setEditForm(prev => ({ ...prev, labels: [...prev.labels, editLabelInput.trim()] }));
                                                    }
                                                    setEditLabelInput('');
                                                }
                                            }}
                                            placeholder="Add label & press Enter"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-cyan-500 outline-none transition-all text-sm font-medium"
                                        />
                                    )}
                                </div>

                                <div className="flex space-x-3 pt-2">
                                    {(isLeader || editingTask.assignees?.some(a => (a._id || a) === currentUser?._id)) && editingTask.status !== 'done' && (
                                        <button
                                            type="button"
                                            disabled={project?.status !== 'active'}
                                            onClick={(e: any) => handleMarkComplete(editingTask, e)}
                                            className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <CheckCircle2 className="w-5 h-5" />
                                            <span>Mark Done</span>
                                        </button>
                                    )}
                                    {isLeader ? (
                                        <button
                                            type="submit"
                                            disabled={project?.status !== 'active'}
                                            className="flex-[2] bg-gradient-to-r from-indigo-600 via-cyan-600 to-sky-500 text-white rounded-2xl py-4 font-bold shadow-xl shadow-cyan-200/40 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Save Changes
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setEditingTask(null)}
                                            className="flex-1 bg-slate-100 text-slate-600 rounded-2xl py-4 font-bold hover:bg-slate-200 transition-all"
                                        >
                                            Close
                                        </button>
                                    )}
                                </div>
                                {isLeader && (
                                    <div className="pt-2 border-t border-slate-100">
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteTask(editingTask._id)}
                                            className="w-full text-red-500 font-bold py-2 text-sm hover:bg-red-50 rounded-xl transition-all flex items-center justify-center space-x-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span>Delete Task Permanently</span>
                                        </button>
                                    </div>
                                )}

                                {/* Comments in Modal */}
                                <div className="pt-6 border-t border-slate-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center">
                                            <MessageSquare className="w-4 h-4 mr-2" />
                                            Comments ({commentsByTask[editingTask._id]?.length || 0})
                                        </h3>
                                    </div>
                                    
                                    <div className="bg-slate-50 rounded-2xl p-4 mb-2">
                                        <div className="space-y-4 max-h-[200px] overflow-y-auto mb-4 pr-1">
                                            {commentsByTask[editingTask._id]?.map(comment => (
                                                <div key={comment._id} className="flex space-x-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-xs font-bold text-indigo-600">{comment.author?.name[0]}</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-xs font-bold text-gray-900">{comment.author?.name}</span>
                                                            <span className="text-[10px] text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-600">{comment.text}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!commentsByTask[editingTask._id] || commentsByTask[editingTask._id].length === 0) && (
                                                <div className="text-center py-6">
                                                    <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                                    <p className="text-xs text-gray-400">No discussions yet. Start the conversation!</p>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex space-x-2">
                                            <input 
                                                disabled={project?.status !== 'active'}
                                                value={commentInputs[editingTask._id] || ''}
                                                onChange={(e) => setCommentInputs(prev => ({ ...prev, [editingTask._id]: e.target.value }))}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAddComment(editingTask._id);
                                                    }
                                                }}
                                                placeholder="Write a comment..."
                                                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                            <button 
                                                type="button"
                                                disabled={project?.status !== 'active'}
                                                onClick={() => handleAddComment(editingTask._id)}
                                                className="p-2 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition-all flex items-center justify-center shadow-lg shadow-cyan-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Invite Member Modal */}
            <AnimatePresence>
                {showInviteModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowInviteModal(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-white/94 p-8 text-slate-900 shadow-[0_30px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 leading-tight">Add Member</h2>
                                    <p className="text-slate-500 mt-1">Invite a teammate to this project.</p>
                                </div>
                                <button 
                                    onClick={() => setShowInviteModal(false)}
                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <AlertCircle className="w-5 h-5 text-slate-400 rotate-45" />
                                </button>
                            </div>

                            <form onSubmit={handleInviteMember} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Email Address</label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            required
                                            type="email"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            placeholder="teammate@example.com"
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <button
                                    disabled={inviting}
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-indigo-600 via-cyan-600 to-sky-500 text-white rounded-2xl py-4 font-bold text-lg shadow-xl shadow-cyan-100/50 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-2"
                                >
                                    {inviting ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Send Invitation</span>}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Manage Leadership Modal */}
            <AnimatePresence>
                {showLeadershipModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowLeadershipModal(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg rounded-[2rem] border border-white/10 bg-white/94 p-8 text-slate-900 shadow-[0_30px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl max-h-[80vh] flex flex-col"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 leading-tight">Project Leadership</h2>
                                    <p className="text-slate-500 mt-1">Manage project ownership and transfer leadership.</p>
                                </div>
                                <button 
                                    onClick={() => setShowLeadershipModal(false)}
                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <AlertCircle className="w-5 h-5 text-slate-400 rotate-45" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                                <div className="p-4 bg-cyan-50 border border-cyan-100 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-white border border-cyan-200 flex items-center justify-center overflow-hidden">
                                            {project.owner?.avatar ? (
                                                <img src={project.owner.avatar} alt={project.owner.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="font-bold text-cyan-700">{project.owner?.name[0]}</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{project.owner?.name} (You)</p>
                                            <p className="text-xs text-cyan-700 font-medium uppercase tracking-wider">Current Leader</p>
                                        </div>
                                    </div>
                                    <Shield className="w-5 h-5 text-cyan-700" />
                                </div>

                                <div className="pt-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 px-1">Members</h3>
                                    <div className="space-y-2">
                                        {project.members?.length === 0 ? (
                                            <p className="text-center py-8 text-slate-400 text-sm italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">No members to transfer leadership to.</p>
                                        ) : (
                                            project.members?.map((member: any) => (
                                                <div key={member._id} className="p-3 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:border-cyan-200 transition-colors">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-100 flex items-center justify-center overflow-hidden">
                                                            {member.avatar ? (
                                                                <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="font-bold text-slate-600">{member.name[0]}</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900">{member.name}</p>
                                                            <p className="text-xs text-slate-500">{member.email}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleTransferLeadership(member._id)}
                                                        disabled={transferring}
                                                        className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider bg-slate-100 hover:bg-cyan-600 hover:text-white rounded-lg transition-all"
                                                    >
                                                        Make Leader
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            </div>
        </div>
    );
};

export default ProjectBoard;

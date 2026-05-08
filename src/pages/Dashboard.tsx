import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Layout, ArrowRight, User as UserIcon, X, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface DashboardProject {
    _id: string;
    title: string;
    description?: string;
    status: 'active' | 'archived' | 'completed' | string;
    owner?: { name?: string };
}

const Dashboard = () => {
    const [projects, setProjects] = useState<DashboardProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProject, setNewProject] = useState({ title: '', description: '' });
    const [submitting, setSubmitting] = useState(false);

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            setProjects(res.data.data);
        } catch (error) {
            toast.error('Failed to fetch projects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await api.post('/projects', newProject);
            setProjects([res.data.data, ...projects]);
            toast.success('Project created successfully');
            setIsModalOpen(false);
            setNewProject({ title: '', description: '' });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create project');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#06111f] text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.3),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.24),_transparent_30%),linear-gradient(135deg,_#06111f_0%,_#0d1728_45%,_#101b33_100%)]" />
            <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:42px_42px]" />

            <div className="relative flex min-h-screen flex-col">
                <Navbar />

                <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="mx-auto max-w-7xl"
                    >
                        <div className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-2xl sm:p-8">
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                                <div className="max-w-2xl">
                                    <div className="mb-3 inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100">
                                        Workspace overview
                                    </div>
                                    <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Your Projects</h1>
                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                                        Manage team workspaces, track progress, and jump into boards with a consistent high-contrast interface.
                                    </p>
                                </div>

                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-cyan-600 to-sky-500 px-5 py-3 font-semibold text-white shadow-lg shadow-cyan-900/20 transition-transform hover:-translate-y-0.5 hover:shadow-xl"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>New Project</span>
                                </button>
                            </div>

                            <div className="mt-6 grid gap-4 sm:grid-cols-3">
                                <div className="rounded-2xl border border-white/10 bg-slate-900/35 p-4 backdrop-blur-md">
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total projects</p>
                                    <p className="mt-2 text-2xl font-bold text-white">{projects.length}</p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-slate-900/35 p-4 backdrop-blur-md">
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Active workspaces</p>
                                    <p className="mt-2 text-2xl font-bold text-white">
                                        {projects.filter((project) => project.status === 'active').length}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-slate-900/35 p-4 backdrop-blur-md">
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Quick access</p>
                                    <p className="mt-2 text-2xl font-bold text-white">Kanban boards</p>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-white/6 py-20 shadow-2xl shadow-slate-950/20 backdrop-blur-2xl">
                                <Loader2 className="mb-4 h-10 w-10 animate-spin text-cyan-300" />
                                <p className="font-medium text-slate-300">Loading your workspace...</p>
                            </div>
                        ) : projects.length === 0 ? (
                            <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/6 p-12 text-center shadow-2xl shadow-slate-950/20 backdrop-blur-2xl">
                                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-200">
                                    <Layout className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">No projects yet</h3>
                                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-300">
                                    Get started by creating your first project and inviting your team members to collaborate.
                                </p>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="mt-6 inline-flex items-center gap-2 font-semibold text-cyan-200 underline underline-offset-4 hover:text-cyan-100"
                                >
                                    Start your first project
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <motion.div 
                                variants={{
                                    hidden: { opacity: 0 },
                                    show: {
                                        opacity: 1,
                                        transition: { staggerChildren: 0.08 }
                                    }
                                }}
                                initial="hidden"
                                animate="show"
                                className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                            >
                                <AnimatePresence>
                                    {projects.map((project) => (
                                        <motion.div
                                            key={project._id}
                                            variants={{
                                                hidden: { opacity: 0, y: 10 },
                                                show: { opacity: 1, y: 0 }
                                            }}
                                            className="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/92 p-6 text-slate-900 shadow-[0_20px_60px_rgba(2,6,23,0.25)] backdrop-blur-xl transition-transform hover:-translate-y-1"
                                        >
                                            <div className="absolute -right-10 top-[-1rem] opacity-10 transition-opacity group-hover:opacity-20">
                                                <Layout className="h-28 w-28 text-slate-400" />
                                            </div>

                                            <div className="relative z-10">
                                                <div className="mb-4 flex items-start justify-between">
                                                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                                                        project.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {project.status}
                                                    </span>
                                                </div>

                                                <h3 className="mb-2 truncate text-xl font-bold text-slate-950 transition-colors group-hover:text-cyan-700">
                                                    {project.title}
                                                </h3>
                                                <p className="mb-6 min-h-[40px] text-sm leading-6 text-slate-600 line-clamp-2">
                                                    {project.description || 'No description provided.'}
                                                </p>

                                                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-100 bg-cyan-50">
                                                            <UserIcon className="w-4 h-4 text-cyan-700" />
                                                        </div>
                                                        <span className="text-xs font-medium text-slate-500">
                                                            {project.owner?.name?.split(' ')[0] || 'Unknown'}
                                                        </span>
                                                    </div>
                                                    <Link 
                                                        to={`/projects/${project._id}`}
                                                        className="group/link inline-flex items-center gap-1 text-sm font-bold text-cyan-700 transition-colors hover:text-cyan-800"
                                                    >
                                                        <span>View Board</span>
                                                        <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </motion.div>
                </main>

                <Footer />

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative z-70 w-full max-w-md rounded-[2rem] border border-white/10 bg-white/94 p-8 text-slate-900 shadow-[0_30px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl"
                        >
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            
                            <div className="mb-6">
                                <div className="mb-3 inline-flex rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-700">
                                    New project
                                </div>
                                <h2 className="text-2xl font-black text-slate-950">Create Project</h2>
                                <p className="mt-1 text-sm text-slate-600">Start a new workspace for your team.</p>
                            </div>

                            <form onSubmit={handleCreateProject} className="space-y-5">
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Project Title</label>
                                    <input
                                        required
                                        type="text"
                                        value={newProject.title}
                                        onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition-all focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
                                        placeholder="Enter project name"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Description (Optional)</label>
                                    <textarea
                                        rows={3}
                                        value={newProject.description}
                                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                        className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 outline-none transition-all focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
                                        placeholder="What is this project about?"
                                    />
                                </div>
                                <button
                                    disabled={submitting}
                                    type="submit"
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-cyan-600 to-sky-500 py-3.5 font-semibold text-white shadow-lg shadow-cyan-900/20 transition-transform hover:-translate-y-0.5 disabled:opacity-70"
                                >
                                    {submitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <span>Create Project</span>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
        </div>
    );
};

export default Dashboard;

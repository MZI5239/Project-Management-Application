import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, Info } from 'lucide-react';

const About = () => {
    return (
        <div className="relative min-h-screen overflow-hidden bg-[#06111f] text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.35),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.28),_transparent_30%),linear-gradient(135deg,_#06111f_0%,_#0d1728_45%,_#101b33_100%)]" />
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.15),_transparent_18%)]" />

            <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="rounded-[2rem] border border-white/10 bg-slate-950/75 p-10 shadow-2xl shadow-slate-950/30 backdrop-blur-2xl"
                >
                    <div className="mb-6 flex items-center gap-3 text-cyan-300">
                        <Info className="h-6 w-6" />
                        <h1 className="text-3xl font-black tracking-tight text-white">About TaskFlow</h1>
                    </div>
                    <p className="max-w-3xl text-slate-300 leading-8 sm:text-lg">
                        TaskFlow is a modern Kanban-style collaboration platform built for teams that want secure, real-time task management.
                        It combines role-based access control, socket-powered updates, and an intuitive dashboard experience to keep work moving.
                    </p>

                    <div className="mt-8 grid gap-6 sm:grid-cols-2">
                        <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6">
                            <h2 className="mb-3 text-xl font-semibold text-white">What we do</h2>
                            <p className="text-slate-400 leading-7">
                                Manage tasks, projects, and teams with drag-and-drop boards, secure authentication, and a polished UI designed for productivity.
                            </p>
                        </div>
                        <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6">
                            <h2 className="mb-3 text-xl font-semibold text-white">Why it works</h2>
                            <p className="text-slate-400 leading-7">
                                Real-time updates and clear access controls help reduce friction so your team can collaborate faster and keep everyone aligned.
                            </p>
                        </div>
                    </div>

                    <div className="mt-10 flex items-center justify-between gap-4">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/15"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Dashboard
                        </Link>
                        <span className="text-sm text-slate-400">Built for secure team productivity.</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default About;

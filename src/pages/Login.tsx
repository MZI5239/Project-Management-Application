import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, Sparkles, Zap, Lock, Users } from 'lucide-react';

interface LoginFormValues {
    email: string;
    password: string;
}

const schema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
});

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
        resolver: zodResolver(schema)
    });

    const highlights = [
        { icon: CheckCircle2, label: 'Secure JWT login' },
        { icon: Zap, label: 'Real-time task sync' },
        { icon: Users, label: 'Team collaboration' }
    ];

    const onSubmit = async (data: LoginFormValues) => {
        try {
            await login(data.email, data.password);
            toast.success('Login successful!');
            navigate('/');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#06111f] text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.35),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.28),_transparent_30%),linear-gradient(135deg,_#06111f_0%,_#0d1728_45%,_#101b33_100%)]" />
            <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:42px_42px]" />

            <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
                <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
                    <motion.section
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45 }}
                        className="order-2 lg:order-1"
                    >
                        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/6 p-8 shadow-2xl shadow-slate-950/30 backdrop-blur-2xl sm:p-10">
                            <div className="absolute -right-20 top-[-5rem] h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
                            <div className="absolute -left-16 bottom-[-4rem] h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />

                            <div className="relative z-10 mb-10 flex items-center justify-between gap-4">
                                <div>
                                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        TaskFlow
                                    </div>
                                    <h1 className="max-w-lg text-4xl font-black tracking-tight text-white sm:text-5xl">
                                        Organize work with a sharper, faster dashboard.
                                    </h1>
                                    <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                                        Secure access, real-time collaboration, and beautiful task management built for teams that move fast.
                                    </p>
                                </div>
                            </div>

                            <div className="relative z-10 grid gap-4 sm:grid-cols-3">
                                {highlights.map((item, index) => (
                                    <motion.div
                                        key={item.label}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.35, delay: 0.08 * index }}
                                        className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-md"
                                    >
                                        <item.icon className="h-5 w-5 text-cyan-300" />
                                        <p className="mt-3 text-sm font-medium text-slate-100">{item.label}</p>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="relative z-10 mt-6 grid gap-4 sm:grid-cols-2">
                                <motion.div
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                                    className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-400/20 to-indigo-500/20 p-5"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/70">Live sync</p>
                                            <p className="mt-2 text-2xl font-bold text-white">Realtime</p>
                                        </div>
                                        <div className="rounded-2xl bg-white/10 p-3 text-cyan-200">
                                            <Zap className="h-6 w-6" />
                                        </div>
                                    </div>
                                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                                        <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-cyan-300 via-sky-300 to-indigo-300" />
                                    </div>
                                </motion.div>

                                <motion.div
                                    animate={{ y: [0, 10, 0] }}
                                    transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
                                    className="rounded-3xl border border-white/10 bg-slate-950/40 p-5"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Protected</p>
                                            <p className="mt-2 text-2xl font-bold text-white">JWT + RBAC</p>
                                        </div>
                                        <div className="rounded-2xl bg-emerald-400/10 p-3 text-emerald-300">
                                            <Lock className="h-6 w-6" />
                                        </div>
                                    </div>
                                    <div className="mt-5 flex items-center gap-2 text-sm text-slate-300">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                                        Secure cookie-based sessions
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.08 }}
                        className="order-1 lg:order-2"
                    >
                        <div className="mx-auto max-w-md rounded-[2rem] border border-white/10 bg-white/92 p-8 text-slate-900 shadow-[0_30px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-10">
                            <div className="mb-8 text-center">
                                <div className="mx-auto mb-4 inline-flex rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 p-3 text-white shadow-lg shadow-cyan-950/20">
                                    <Sparkles className="h-6 w-6" />
                                </div>
                                <h2 className="text-3xl font-black tracking-tight text-slate-950">Welcome back</h2>
                                <p className="mt-2 text-sm text-slate-600">Sign in to continue into your workspace.</p>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">Email Address</label>
                                    <input
                                        type="email"
                                        {...register('email')}
                                        className={`w-full rounded-2xl border bg-white px-4 py-3.5 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15 ${errors.email ? 'border-red-400' : 'border-slate-200'}`}
                                        placeholder="you@example.com"
                                    />
                                    {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
                                </div>

                                <div>
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <label className="block text-sm font-semibold text-slate-700">Password</label>
                                        <Link to="/forgot-password" className="text-xs font-semibold text-cyan-700 hover:text-cyan-600">
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <input
                                        type="password"
                                        {...register('password')}
                                        className={`w-full rounded-2xl border bg-white px-4 py-3.5 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15 ${errors.password ? 'border-red-400' : 'border-slate-200'}`}
                                        placeholder="••••••••"
                                    />
                                    {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-cyan-600 to-sky-500 px-5 py-3.5 font-semibold text-white shadow-lg shadow-cyan-900/20 transition-transform hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                </button>
                            </form>

                            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-center text-sm text-slate-600">
                                    Don't have an account?{' '}
                                    <Link to="/register" className="font-semibold text-indigo-700 hover:text-indigo-600">
                                        Register
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </motion.section>
                </div>
            </div>
        </div>
    );
};

export default Login;

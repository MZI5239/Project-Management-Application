import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../api/axios';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Mail, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';

const schema = z.object({
    email: z.string().email('Invalid email address')
});

const ForgotPassword = () => {
    const [submitted, setSubmitted] = useState(false);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(schema)
    });

    const steps = [
        { icon: Mail, label: 'Enter your email' },
        { icon: ShieldCheck, label: 'Receive a secure link' },
        { icon: CheckCircle2, label: 'Set a new password' }
    ];

    const onSubmit = async (data) => {
        try {
            await api.post('/auth/forgot-password', { email: data.email });
            setSubmitted(true);
            toast.success('Reset email sent');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send reset email');
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#06111f] text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.35),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.28),_transparent_30%),linear-gradient(135deg,_#06111f_0%,_#0d1728_45%,_#101b33_100%)]" />
            <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:42px_42px]" />

            <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
                <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr]">
                    <motion.section
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45 }}
                        className="order-2 lg:order-1"
                    >
                        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/6 p-8 shadow-2xl shadow-slate-950/30 backdrop-blur-2xl sm:p-10">
                            <div className="absolute -right-20 top-[-5rem] h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
                            <div className="absolute -left-16 bottom-[-4rem] h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />

                            <div className="relative z-10 mb-10">
                                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Password recovery
                                </div>
                                <h1 className="max-w-lg text-4xl font-black tracking-tight text-white sm:text-5xl">
                                    Secure reset flows with clear, confident guidance.
                                </h1>
                                <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                                    Request a reset link and return to your workspace with a clean, protected password recovery experience.
                                </p>
                            </div>

                            <div className="relative z-10 grid gap-4 sm:grid-cols-3">
                                {steps.map((item, index) => (
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
                                    <Mail className="h-6 w-6" />
                                </div>
                                <h2 className="text-3xl font-black tracking-tight text-slate-950">Reset password</h2>
                                <p className="mt-2 text-sm text-slate-600">We’ll send a secure link to your email.</p>
                            </div>

                            <AnimatePresence mode="wait">
                                {!submitted ? (
                                    <motion.form
                                        key="reset-form"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        onSubmit={handleSubmit(onSubmit)}
                                        className="space-y-5"
                                    >
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

                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-cyan-600 to-sky-500 px-5 py-3.5 font-semibold text-white shadow-lg shadow-cyan-900/20 transition-transform hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
                                        >
                                            <span>{isSubmitting ? 'Sending...' : 'Send Reset Link'}</span>
                                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                        </button>
                                    </motion.form>
                                ) : (
                                    <motion.div
                                        key="reset-success"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-5"
                                    >
                                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
                                            <div className="flex items-start gap-3">
                                                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                                                <p className="text-sm leading-6">
                                                    Check your email for the reset link. We’ve sent instructions if an account exists.
                                                </p>
                                            </div>
                                        </div>
                                        <Link
                                            to="/login"
                                            className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 via-cyan-600 to-sky-500 px-5 py-3.5 font-semibold text-white shadow-lg shadow-cyan-900/20 transition-transform hover:-translate-y-0.5"
                                        >
                                            Return to Login
                                        </Link>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {!submitted && (
                                <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-center text-sm text-slate-600">
                                        Remembered your password?{' '}
                                        <Link to="/login" className="font-semibold text-indigo-700 hover:text-indigo-600">
                                            Sign In
                                        </Link>
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.section>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;

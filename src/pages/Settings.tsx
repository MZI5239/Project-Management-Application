import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Bell, Lock, UserCircle2, Shield, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
    const { user, updateProfile, changePassword } = useAuth();
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [profileForm, setProfileForm] = useState({ name: '', email: '', avatar: '' });
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [notifications, setNotifications] = useState({ email: true, inApp: true });

    useEffect(() => {
        if (user) {
            setProfileForm({
                name: user.name || '',
                email: user.email || '',
                avatar: user.avatar || ''
            });
            setNotifications({
                email: user.preferences?.notifications?.email ?? true,
                inApp: user.preferences?.notifications?.inApp ?? true
            });
        }
    }, [user]);

    const handleProfileSubmit = async (event) => {
        event.preventDefault();
        setSavingProfile(true);
        try {
            await updateProfile({
                name: profileForm.name,
                email: profileForm.email,
                avatar: profileForm.avatar,
                preferences: { notifications }
            });
            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordSubmit = async (event) => {
        event.preventDefault();

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        setSavingPassword(true);
        try {
            await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
            toast.success('Password changed successfully');
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password');
        } finally {
            setSavingPassword(false);
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
                        transition={{ duration: 0.35 }}
                        className="mx-auto max-w-7xl"
                    >
                        <div className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-2xl sm:p-8">
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                                <div className="max-w-2xl">
                                    <div className="mb-3 inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100">
                                        Account preferences
                                    </div>
                                    <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Settings</h1>
                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                                        Edit your profile, control notifications, and keep your account secure in one consistent layout.
                                    </p>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2 lg:w-[420px]">
                                    <div className="rounded-2xl border border-white/10 bg-slate-900/35 p-4 backdrop-blur-md">
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Role</p>
                                        <p className="mt-2 text-lg font-bold capitalize text-white">{user?.role || 'member'}</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-slate-900/35 p-4 backdrop-blur-md">
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</p>
                                        <p className="mt-2 text-lg font-bold text-emerald-300">Active</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
                            <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/92 p-6 text-slate-900 shadow-[0_20px_60px_rgba(2,6,23,0.25)] backdrop-blur-xl sm:p-8 space-y-8">
                                <div className="flex items-center space-x-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                                        <UserCircle2 className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-950">Profile Settings</h2>
                                        <p className="text-sm text-slate-600">Edit your account details and notification preferences.</p>
                                    </div>
                                </div>

                                <form onSubmit={handleProfileSubmit} className="space-y-5">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <label className="block">
                                            <span className="mb-2 block text-sm font-semibold text-slate-700">Name</span>
                                            <input
                                                type="text"
                                                value={profileForm.name}
                                                onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition-all focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
                                            <input
                                                type="email"
                                                value={profileForm.email}
                                                onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition-all focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
                                            />
                                        </label>
                                    </div>

                                    <label className="block">
                                        <span className="mb-2 block text-sm font-semibold text-slate-700">Avatar URL</span>
                                        <input
                                            type="text"
                                            value={profileForm.avatar}
                                            onChange={(e) => setProfileForm((prev) => ({ ...prev, avatar: e.target.value }))}
                                            placeholder="https://..."
                                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition-all focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
                                        />
                                    </label>

                                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                                        <div className="mb-4 flex items-center gap-3">
                                            <Bell className="w-5 h-5 text-cyan-700" />
                                            <h3 className="font-bold text-slate-950">Notification Preferences</h3>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
                                                <div>
                                                    <p className="font-medium text-slate-950">Email notifications</p>
                                                    <p className="text-sm text-slate-500">Receive TaskFlow updates by email.</p>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={notifications.email}
                                                    onChange={(e) => setNotifications((prev) => ({ ...prev, email: e.target.checked }))}
                                                    className="h-5 w-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                                                />
                                            </label>
                                            <label className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
                                                <div>
                                                    <p className="font-medium text-slate-950">In-app notifications</p>
                                                    <p className="text-sm text-slate-500">Show activity alerts inside the app.</p>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={notifications.inApp}
                                                    onChange={(e) => setNotifications((prev) => ({ ...prev, inApp: e.target.checked }))}
                                                    className="h-5 w-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={savingProfile}
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-cyan-600 to-sky-500 px-5 py-3.5 font-semibold text-white shadow-lg shadow-cyan-900/20 transition-transform hover:-translate-y-0.5 disabled:opacity-70"
                                    >
                                        {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                                        <span>{savingProfile ? 'Saving profile...' : 'Save Profile'}</span>
                                    </button>
                                </form>

                                <div className="border-t border-slate-200 pt-8">
                                    <div className="flex items-center space-x-4 mb-6">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                                            <Lock className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-slate-950">Change Password</h2>
                                            <p className="text-sm text-slate-600">Update your login password securely.</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl">
                                        <input
                                            type="password"
                                            placeholder="Current password"
                                            value={passwordForm.currentPassword}
                                            onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition-all focus:border-rose-400 focus:ring-4 focus:ring-rose-500/15"
                                        />
                                        <input
                                            type="password"
                                            placeholder="New password"
                                            value={passwordForm.newPassword}
                                            onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition-all focus:border-rose-400 focus:ring-4 focus:ring-rose-500/15"
                                        />
                                        <input
                                            type="password"
                                            placeholder="Confirm new password"
                                            value={passwordForm.confirmPassword}
                                            onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition-all focus:border-rose-400 focus:ring-4 focus:ring-rose-500/15"
                                        />

                                        <button
                                            type="submit"
                                            disabled={savingPassword}
                                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 to-orange-500 px-5 py-3.5 font-semibold text-white shadow-lg shadow-rose-900/20 transition-transform hover:-translate-y-0.5 disabled:opacity-70"
                                        >
                                            {savingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                                            <span>{savingPassword ? 'Updating password...' : 'Change Password'}</span>
                                        </button>
                                    </form>
                                </div>
                            </section>

                            <section className="space-y-4">
                                {[
                                    {
                                        icon: UserCircle2,
                                        title: 'Account Overview',
                                        description: 'Name, email, avatar, and role details.'
                                    },
                                    {
                                        icon: Bell,
                                        title: 'Notifications',
                                        description: 'Email and in-app notification toggles.'
                                    },
                                    {
                                        icon: Lock,
                                        title: 'Security',
                                        description: 'Password change workflow for your account.'
                                    },
                                    {
                                        icon: Shield,
                                        title: 'Access',
                                        description: 'Your current workspace permissions.'
                                    }
                                ].map((section) => (
                                    <div key={section.title} className="rounded-[1.75rem] border border-white/10 bg-white/6 p-5 text-white shadow-2xl shadow-slate-950/20 backdrop-blur-2xl">
                                        <div className="flex items-start space-x-4">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                                                <section.icon className="w-5 h-5 text-cyan-200" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-semibold text-white">{section.title}</h3>
                                                <p className="mt-1 text-sm leading-6 text-slate-300">{section.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </section>
                        </div>
                    </motion.div>
                </main>

                <Footer />
            </div>
        </div>
    );
};

export default Settings;
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
        <div className="min-h-screen flex flex-col bg-gray-50/50">
            <Navbar />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                >
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
                        <p className="text-gray-600 mt-2">Manage your account and workspace preferences.</p>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
                        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-8">
                            <div className="flex items-center space-x-4 mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
                                    <UserCircle2 className="w-7 h-7 text-indigo-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">Profile Settings</h2>
                                    <p className="text-sm text-gray-500">Edit your account details and notification preferences.</p>
                                </div>
                            </div>

                            <form onSubmit={handleProfileSubmit} className="space-y-5">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <label className="block">
                                        <span className="block text-sm font-medium text-gray-700 mb-2">Name</span>
                                        <input
                                            type="text"
                                            value={profileForm.name}
                                            onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                                            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-gray-700 mb-2">Email</span>
                                        <input
                                            type="email"
                                            value={profileForm.email}
                                            onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                                            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </label>
                                </div>

                                <label className="block">
                                    <span className="block text-sm font-medium text-gray-700 mb-2">Avatar URL</span>
                                    <input
                                        type="text"
                                        value={profileForm.avatar}
                                        onChange={(e) => setProfileForm((prev) => ({ ...prev, avatar: e.target.value }))}
                                        placeholder="https://..."
                                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </label>

                                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <Bell className="w-5 h-5 text-indigo-600" />
                                        <h3 className="font-semibold text-gray-900">Notification Preferences</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="flex items-center justify-between gap-4 rounded-xl bg-white border border-gray-200 px-4 py-3">
                                            <div>
                                                <p className="font-medium text-gray-900">Email notifications</p>
                                                <p className="text-sm text-gray-500">Receive TaskFlow updates by email.</p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={notifications.email}
                                                onChange={(e) => setNotifications((prev) => ({ ...prev, email: e.target.checked }))}
                                                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                        </label>
                                        <label className="flex items-center justify-between gap-4 rounded-xl bg-white border border-gray-200 px-4 py-3">
                                            <div>
                                                <p className="font-medium text-gray-900">In-app notifications</p>
                                                <p className="text-sm text-gray-500">Show activity alerts inside the app.</p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={notifications.inApp}
                                                onChange={(e) => setNotifications((prev) => ({ ...prev, inApp: e.target.checked }))}
                                                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                        </label>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={savingProfile}
                                    className="inline-flex items-center justify-center space-x-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-70"
                                >
                                    {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                                    <span>{savingProfile ? 'Saving profile...' : 'Save Profile'}</span>
                                </button>
                            </form>

                            <div className="border-t border-gray-100 pt-8">
                                <div className="flex items-center space-x-4 mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                                        <Lock className="w-7 h-7 text-red-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
                                        <p className="text-sm text-gray-500">Update your login password securely.</p>
                                    </div>
                                </div>

                                <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl">
                                    <input
                                        type="password"
                                        placeholder="Current password"
                                        value={passwordForm.currentPassword}
                                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                    <input
                                        type="password"
                                        placeholder="New password"
                                        value={passwordForm.newPassword}
                                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                    <input
                                        type="password"
                                        placeholder="Confirm new password"
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-red-500"
                                    />

                                    <button
                                        type="submit"
                                        disabled={savingPassword}
                                        className="inline-flex items-center justify-center space-x-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-70"
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
                                <div key={section.title} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
                                    <div className="flex items-start space-x-4">
                                        <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                                            <section.icon className="w-5 h-5 text-gray-700" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-semibold text-gray-900">{section.title}</h3>
                                            <p className="text-sm text-gray-600 mt-1">{section.description}</p>
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
    );
};

export default Settings;
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Shield, LogOut, Code2, Menu, X, Settings, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            toast.success('Logged out successfully');
            navigate('/login');
        } catch (error) {
            toast.error('Logout failed');
        }
    };

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const navLinks = [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard, color: 'text-slate-200', hover: 'hover:text-cyan-200', bg: 'bg-white/5' },
        { to: '/about', label: 'About', icon: Info, color: 'text-slate-200', hover: 'hover:text-cyan-200', bg: 'bg-white/5' },
        { to: '/settings', label: 'Settings', icon: Settings, color: 'text-slate-200', hover: 'hover:text-cyan-200', bg: 'bg-white/5' },
        ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin Panel', icon: Shield, color: 'text-amber-200', hover: 'hover:text-amber-100', bg: 'bg-amber-400/10' }] : [])
    ];

    return (
        <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 text-white shadow-2xl shadow-slate-950/25 backdrop-blur-2xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 justify-between">
                    <div className="flex items-center space-x-8">
                        <Link to="/" className="flex items-center space-x-2 group">
                            <div className="rounded-lg bg-gradient-to-br from-indigo-600 to-cyan-500 p-1.5 transition-transform group-hover:scale-105">
                                <Code2 className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-black tracking-tight text-white">TaskFlow</span>
                        </Link>

                        <div className="hidden md:flex items-center space-x-4">
                            {navLinks.map((link) => (
                                <Link 
                                    key={link.to}
                                    to={link.to} 
                                    className={`flex items-center space-x-1 rounded-full px-3.5 py-2 text-sm font-semibold ${link.color} ${link.hover} ${link.bg || ''} transition-colors border border-white/10 hover:border-white/20`}
                                >
                                    <link.icon className="w-4 h-4" />
                                    <span>{link.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center space-x-6">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-sm font-semibold text-white">{user?.name}</span>
                            <span className="text-xs text-slate-400 capitalize">{user?.role}</span>
                        </div>
                        
                        <button
                            onClick={handleLogout}
                            className="hidden sm:flex items-center space-x-1 rounded-full border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-200 transition-all hover:bg-rose-400/15 hover:text-rose-100"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                        </button>

                        <button 
                            onClick={toggleMenu}
                            className="md:hidden rounded-lg p-2 text-slate-200 transition-colors hover:bg-white/10"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden overflow-hidden border-t border-white/10 bg-slate-950/90 backdrop-blur-2xl"
                    >
                        <div className="px-4 pt-2 pb-6 space-y-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`flex items-center space-x-3 rounded-2xl px-4 py-3 text-base font-semibold ${link.color} ${link.bg || 'bg-white/5'} border border-white/10 hover:border-white/20`}
                                >
                                    <link.icon className="w-5 h-5" />
                                    <span>{link.label}</span>
                                </Link>
                            ))}
                            <div className="pt-4 border-t border-white/10">
                                <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                    <div className="text-sm font-bold text-white">{user?.name}</div>
                                    <div className="text-xs capitalize text-slate-400">{user?.role}</div>
                                </div>
                                <button
                                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                                    className="mb-3 flex w-full items-center space-x-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-base font-semibold text-rose-200 transition-colors hover:bg-rose-400/15"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;

import React, { useState, useEffect } from 'react';
import { Shield, User as UserIcon, Mail, Settings, CheckCircle2, XCircle, Loader2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface User {
    _id: string;
    name: string;
    email: string;
    role: 'admin' | 'member';
    isActive: boolean;
    createdAt: string;
}

const AdminPanel = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data.data);
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await api.patch(`/admin/users/${userId}/role`, { role: newRole });
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole as 'admin' | 'member' } : u));
            toast.success(`Role updated to ${newRole}`);
        } catch (error) {
            toast.error('Failed to update role');
        }
    };

    const handleToggleStatus = async (userId: string) => {
        try {
            const res = await api.patch(`/admin/users/${userId}/status`);
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: res.data.data.isActive } : u));
            toast.success('Status updated successfully');
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen flex flex-col bg-gray-50/50">
            <Navbar />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center space-x-3">
                                <Shield className="w-8 h-8 text-purple-600" />
                                <span>Admin Panel</span>
                            </h1>
                            <p className="text-gray-500 mt-1">Manage users, roles, and access controls.</p>
                        </div>

                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all text-sm shadow-sm"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
                            <p className="text-gray-500 font-medium">Fetching user data...</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest min-w-[200px]">Name</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Email</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Role</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Status</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <motion.tbody 
                                        variants={{
                                            hidden: { opacity: 0 },
                                            show: { opacity: 1, transition: { staggerChildren: 0.05 }}
                                        }}
                                        initial="hidden"
                                        animate="show"
                                        className="divide-y divide-gray-100"
                                    >
                                        <AnimatePresence>
                                            {filteredUsers.map((user) => (
                                                <motion.tr 
                                                    key={user._id} 
                                                    variants={{
                                                        hidden: { opacity: 0, x: -10 },
                                                        show: { opacity: 1, x: 0 }
                                                    }}
                                                    className="hover:bg-gray-50 transition-colors group"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center border border-purple-100">
                                                                <UserIcon className="w-5 h-5 text-purple-600" />
                                                            </div>
                                                            <span className="font-semibold text-gray-900">{user.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        <div className="flex items-center space-x-2">
                                                            <Mail className="w-4 h-4 text-gray-400" />
                                                            <span>{user.email}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <select
                                                            value={user.role}
                                                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border focus:ring-2 focus:ring-purple-500 outline-none bg-white transition-all ${
                                                                user.role === 'admin' ? 'border-purple-200 text-purple-700' : 'border-gray-200 text-gray-600'
                                                            }`}
                                                        >
                                                            <option value="member">Member</option>
                                                            <option value="admin">Admin</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center">
                                                            {user.isActive ? (
                                                                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                                    <span>Active</span>
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                                                                    <XCircle className="w-3.5 h-3.5" />
                                                                    <span>Inactive</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => handleToggleStatus(user._id)}
                                                            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                                                                user.isActive 
                                                                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100' 
                                                                : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-100'
                                                            }`}
                                                        >
                                                            {user.isActive ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                        {filteredUsers.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="py-20 text-center text-gray-500 font-medium italic">
                                                    No users found matching your search.
                                                </td>
                                            </tr>
                                        )}
                                    </motion.tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </motion.div>
            </main>

            <Footer />
        </div>
    );
};

export default AdminPanel;

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../api/axios';

const schema = z.object({
    email: z.string().email('Invalid email address')
});

const ForgotPassword = () => {
    const [submitted, setSubmitted] = useState(false);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(schema)
    });

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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">TaskFlow</h1>
                    <p className="text-gray-600 mt-2">Reset your password</p>
                </div>

                {!submitted ? (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                {...register('email')}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                                placeholder="you@example.com"
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                ) : (
                    <div className="text-center py-4">
                        <div className="mb-4 bg-green-50 text-green-700 p-4 rounded-lg">
                            Check your email for reset link. We've sent instructions to the email provided if an account exists.
                        </div>
                        <Link to="/login" className="text-indigo-600 font-medium hover:text-indigo-500 transition-colors">
                            Return to Login
                        </Link>
                    </div>
                )}

                {!submitted && (
                    <p className="text-center mt-6 text-sm text-gray-600">
                        Remembered your password?{' '}
                        <Link to="/login" className="text-indigo-600 font-medium hover:text-indigo-500 transition-colors">
                            Sign In
                        </Link>
                    </p>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;

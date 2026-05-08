import React from 'react';
import { Github, Mail, Code2 } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-gray-400 py-12 w-full mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Brand Section */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Code2 className="w-6 h-6 text-indigo-500" />
                            <span className="text-xl font-bold text-white tracking-tight">TaskFlow</span>
                        </div>
                        <p className="text-sm leading-relaxed max-w-xs">
                            Simplify your workflow and boost productivity with our collaborative task management platform.
                        </p>
                    </div>

                    {/* Links Section */}
                    <div>
                        <h4 className="text-white font-semibold mb-4 uppercase text-xs tracking-widest">Connect</h4>
                        <div className="space-y-3">
                            <a href="#" className="flex items-center space-x-2 hover:text-white transition-colors group text-sm">
                                <Mail className="w-4 h-4" />
                                <span>support@taskflow.dev</span>
                            </a>
                            <a href="#" className="flex items-center space-x-2 hover:text-white transition-colors group text-sm">
                                <Github className="w-4 h-4" />
                                <span>github.com/taskflow</span>
                            </a>
                        </div>
                    </div>

                    {/* Copyright Section */}
                    <div className="flex flex-col justify-end items-start md:items-end">
                        <p className="text-sm">
                            © {new Date().getFullYear()} TaskFlow Inc.
                        </p>
                        <p className="text-xs mt-1">
                            Built with passion for efficient teams.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

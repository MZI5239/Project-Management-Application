import React from 'react';
import { Github, Mail, Code2 } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="mt-auto w-full border-t border-white/10 bg-slate-950/90 py-12 text-slate-300 backdrop-blur-2xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Brand Section */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <div className="rounded-lg bg-gradient-to-br from-indigo-600 to-cyan-500 p-1">
                                <Code2 className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-black tracking-tight text-white">TaskFlow</span>
                        </div>
                        <p className="max-w-xs text-sm leading-relaxed text-slate-400">
                            Simplify your workflow and boost productivity with our collaborative task management platform.
                        </p>
                    </div>

                    {/* Links Section */}
                    <div>
                        <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">Connect</h4>
                        <div className="space-y-3">
                            <a href="#" className="flex items-center space-x-2 text-sm transition-colors hover:text-white group">
                                <Mail className="w-4 h-4 text-cyan-300" />
                                <span>support@taskflow.dev</span>
                            </a>
                            <a href="#" className="flex items-center space-x-2 text-sm transition-colors hover:text-white group">
                                <Github className="w-4 h-4 text-cyan-300" />
                                <span>github.com/taskflow</span>
                            </a>
                        </div>
                    </div>

                    {/* Copyright Section */}
                    <div className="flex flex-col justify-end items-start md:items-end">
                        <p className="text-sm text-white">
                            © {new Date().getFullYear()} TaskFlow Inc.
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                            Built with passion for efficient teams.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

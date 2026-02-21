import React, { useState } from 'react';
import { BranchName, User, UserRole } from '../types';
import { ShieldCheck, ArrowRight, AlertCircle, KeyRound, User as UserIcon } from 'lucide-react';
import { api } from '../src/services/api';

interface LoginPageProps {
    onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!username || !password) {
            setError('Please enter both username and password.');
            return;
        }

        setIsLoading(true);
        try {
            const data = await api.auth.login({ username, password });
            if (data.success && data.user) {
                // Successful login
                onLogin({
                    id: data.user.id,
                    name: data.user.name,
                    role: data.user.role as UserRole,
                    branch: data.user.branch as BranchName,
                    clientId: data.user.clientId,
                    avatar: data.user.avatar || undefined
                });
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">

            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[100px]"></div>
            </div>

            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md border border-white/20 relative z-10 overflow-hidden">

                {/* Header Section */}
                <div className="bg-indigo-600 p-8 text-center relative">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform rotate-3">
                        <ShieldCheck size={32} className="text-indigo-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-1">AVR Associates</h1>
                    <p className="text-indigo-100 text-sm opacity-90">CA Practice Management ERP</p>
                </div>

                {/* Login Body */}
                <div className="p-8">
                    <div className="mb-6 text-center">
                        <h2 className="text-lg font-semibold text-slate-800">Secure Sign In</h2>
                        <p className="text-sm text-slate-500">Enter your credentials to access the portal</p>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2 animate-in fade-in">
                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Username</label>
                            <div className="relative">
                                <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                                    placeholder="Enter your username"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Password</label>
                            <div className="relative">
                                <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                                    placeholder="Enter your password"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-3 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 ${isLoading ? 'opacity-80 cursor-wait' : ''}`}
                        >
                            {isLoading ? (
                                <span className="animate-pulse">Authenticating...</span>
                            ) : (
                                <>Access Dashboard <ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400">
                        Secure Connection • 256-bit Encryption • v2.1.0
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
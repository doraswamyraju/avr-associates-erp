import React, { useState } from 'react';
import { BranchName, User, UserRole } from '../types';
import { ShieldCheck, ArrowRight, AlertCircle, KeyRound, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { api } from '../src/services/api';

interface LoginPageProps {
    onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
        <div className="min-h-screen bg-[#050510] flex items-center justify-center p-4 relative overflow-hidden font-inter">

            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo Area */}
                <div className="flex flex-col items-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-500/20 mb-6 transform hover:rotate-6 transition-transform">
                        <ShieldCheck size={40} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight mb-2">AVR Associates</h1>
                    <div className="flex items-center gap-2">
                        <div className="h-px w-8 bg-slate-700"></div>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em]">ERP Ecosystem</p>
                        <div className="h-px w-8 bg-slate-700"></div>
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 p-10 shadow-3xl shadow-black/50 relative overflow-hidden group animate-in zoom-in-95 duration-500">
                    {/* Glass Shine Effect */}
                    <div className="absolute -top-[100%] left-[-100%] w-[300%] h-[300%] bg-gradient-to-br from-white/5 via-transparent to-transparent rotate-45 pointer-events-none group-hover:translate-x-[10%] group-hover:translate-y-[10%] transition-transform duration-1000"></div>

                    <div className="relative">
                        <div className="mb-10">
                            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Enterprise Login</h2>
                            <p className="text-slate-400 text-sm font-medium">Verify your credentials to continue to the workforce hub.</p>
                        </div>

                        {error && (
                            <div className="mb-8 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-bold flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle size={16} className="shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username</label>
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                        <UserIcon size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-14 pr-6 text-sm text-white font-medium focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-600"
                                        placeholder="Enter account ID"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Password</label>
                                    <button
                                        type="button"
                                        onClick={() => alert('Please contact system administrator to reset your password.')}
                                        className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors"
                                    >
                                        Forgot?
                                    </button>
                                </div>
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                        <KeyRound size={18} />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-14 pr-14 text-sm text-white font-medium focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-600"
                                        placeholder="••••••••"
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full overflow-hidden rounded-2xl bg-indigo-600 py-4 text-sm font-black text-white uppercase tracking-widest shadow-2xl shadow-indigo-600/20 transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                            >
                                <div className="relative z-10 flex items-center justify-center gap-3">
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Authenticating...</span>
                                        </div>
                                    ) : (
                                        <>
                                            Secure Access
                                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                                        </>
                                    )}
                                </div>
                            </button>
                        </form>
                    </div>
                </div>

                <div className="mt-8 text-center animate-in fade-in duration-1000 delay-500">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                        Protected by hardware-level security & 256-bit encryption
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
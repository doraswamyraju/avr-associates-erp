import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight, AlertCircle, KeyRound, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { api } from '../src/services/api';

interface ResetPasswordPageProps {
    token: string;
    onComplete: () => void;
}

const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ token, onComplete }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);

    useEffect(() => {
        verifyToken();
    }, [token]);

    const verifyToken = async () => {
        setIsVerifying(true);
        try {
            const data = await api.auth.verifyResetToken(token);
            setUserName(data.name);
        } catch (err: any) {
            setError(err.message || 'This reset link is invalid or has expired.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);
        try {
            await api.auth.resetPassword({ token, password });
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    if (isVerifying) {
        return (
            <div className="min-h-screen bg-[#050510] flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-4 text-white">
                    <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                    <p className="text-sm font-black uppercase tracking-widest text-slate-400">Verifying Security Token...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050510] flex items-center justify-center p-4 relative overflow-hidden font-inter">
            {/* Background elements same as Login */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 p-10 shadow-3xl shadow-black/50 relative overflow-hidden group">
                    <div className="relative">
                        {success ? (
                            <div className="text-center animate-in zoom-in-95 duration-500">
                                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 size={40} className="text-emerald-500" />
                                </div>
                                <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Access Restored</h2>
                                <p className="text-slate-400 text-sm font-medium mb-10">Your password has been updated successfully. You can now access the portal.</p>
                                <button
                                    onClick={onComplete}
                                    className="w-full bg-indigo-600 py-4 rounded-2xl text-sm font-black text-white uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-[0.98]"
                                >
                                    Proceed to Login
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="mb-10">
                                    <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Set New Password</h2>
                                    <p className="text-slate-400 text-sm font-medium">Hello {userName}, please choose a strong password to secure your account.</p>
                                </div>

                                {error && (
                                    <div className="mb-8 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-bold flex items-start gap-3">
                                        <AlertCircle size={16} className="shrink-0" />
                                        <p>{error}</p>
                                    </div>
                                )}

                                <form onSubmit={handleReset} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New Password</label>
                                        <div className="relative group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400">
                                                <KeyRound size={18} />
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-14 pr-14 text-sm text-white font-medium focus:border-indigo-500/50 outline-none transition-all"
                                                placeholder="••••••••"
                                                disabled={isLoading || !!error && !userName}
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

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm Password</label>
                                        <div className="relative group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400">
                                                <KeyRound size={18} />
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-14 pr-14 text-sm text-white font-medium focus:border-indigo-500/50 outline-none transition-all"
                                                placeholder="••••••••"
                                                disabled={isLoading || !!error && !userName}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading || (!!error && !userName)}
                                        className="w-full bg-indigo-600 py-4 rounded-2xl text-sm font-black text-white uppercase tracking-widest hover:bg-indigo-500 transition-all disabled:opacity-50"
                                    >
                                        {isLoading ? 'Updating...' : 'Update Password'}
                                    </button>

                                    {error && !userName && (
                                        <button
                                            type="button"
                                            onClick={onComplete}
                                            className="w-full text-center text-xs font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors mt-4"
                                        >
                                            Return to Login
                                        </button>
                                    )}
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;

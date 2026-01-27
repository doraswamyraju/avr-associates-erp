import React, { useState } from 'react';
import { BranchName, User, UserRole } from '../types';
import { MOCK_CLIENTS } from '../constants';
import { ShieldCheck, User as UserIcon, Building, ArrowRight, Building2, CheckCircle2 } from 'lucide-react';

interface LoginPageProps {
    onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.ADMIN);
    const [selectedClient, setSelectedClient] = useState(MOCK_CLIENTS[0].id);
    const [selectedBranch, setSelectedBranch] = useState<BranchName>(BranchName.VERSATILE);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = () => {
        setIsLoading(true);
        // Simulate network delay for effect
        setTimeout(() => {
            let user: User;

            if (selectedRole === UserRole.CLIENT) {
                const client = MOCK_CLIENTS.find(c => c.id === selectedClient);
                if (!client) return;
                user = {
                    id: client.id,
                    name: client.name,
                    role: UserRole.CLIENT,
                    branch: client.branch,
                    clientId: client.id,
                    avatar: undefined
                };
            } else if (selectedRole === UserRole.EMPLOYEE) {
                user = {
                    id: 'EMP001',
                    name: 'Mahesh B',
                    role: UserRole.EMPLOYEE,
                    branch: selectedBranch, // Use selected branch
                    avatar: 'https://picsum.photos/40/40?random=3'
                };
            } else {
                // Admin
                user = {
                    id: 'ADM001',
                    name: 'Suresh Kumar',
                    role: UserRole.ADMIN,
                    branch: BranchName.ALL,
                    avatar: 'https://picsum.photos/40/40?random=1'
                };
            }

            onLogin(user);
            setIsLoading(false);
        }, 800);
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
                        <h2 className="text-lg font-semibold text-slate-800">Sign In</h2>
                        <p className="text-sm text-slate-500">Select your role to access the dashboard</p>
                    </div>

                    <div className="space-y-5">
                        {/* Role Tabs */}
                        <div className="grid grid-cols-3 bg-slate-100 p-1 rounded-xl">
                            {[UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENT].map((role) => (
                                <button
                                    key={role}
                                    onClick={() => setSelectedRole(role)}
                                    className={`py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex flex-col items-center gap-1 ${
                                        selectedRole === role 
                                        ? 'bg-white text-indigo-600 shadow-sm transform scale-105' 
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    {role === UserRole.ADMIN && <ShieldCheck size={16} />}
                                    {role === UserRole.EMPLOYEE && <UserIcon size={16} />}
                                    {role === UserRole.CLIENT && <Building size={16} />}
                                    {role}
                                </button>
                            ))}
                        </div>

                        {/* Dynamic Inputs based on Role */}
                        <div className="min-h-[80px] space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            
                            {/* Admin Info */}
                            {selectedRole === UserRole.ADMIN && (
                                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-start gap-3">
                                    <CheckCircle2 size={18} className="text-green-500 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">Administrator Access</p>
                                        <p className="text-xs text-slate-500">Full control over all branches, staff, and settings.</p>
                                    </div>
                                </div>
                            )}

                            {/* Employee Branch Selection */}
                            {selectedRole === UserRole.EMPLOYEE && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Select Branch</label>
                                    <div className="relative">
                                        <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <select
                                            value={selectedBranch}
                                            onChange={(e) => setSelectedBranch(e.target.value as BranchName)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow appearance-none"
                                        >
                                            {Object.values(BranchName).filter(b => b !== BranchName.ALL).map(b => (
                                                <option key={b} value={b}>{b}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Client Account Selection */}
                            {selectedRole === UserRole.CLIENT && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Select Account</label>
                                    <select 
                                        value={selectedClient}
                                        onChange={(e) => setSelectedClient(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                                    >
                                        {MOCK_CLIENTS.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button 
                            onClick={handleLogin}
                            disabled={isLoading}
                            className={`w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 ${isLoading ? 'opacity-80 cursor-wait' : ''}`}
                        >
                            {isLoading ? (
                                <span className="animate-pulse">Accessing Secure Server...</span>
                            ) : (
                                <>Access Dashboard <ArrowRight size={18} /></>
                            )}
                        </button>
                    </div>
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
import React, { useState, useEffect } from 'react';
import { BranchName, Staff, TaskStatus, Task, Branch, UserRole } from '../types';
import {
    Search, Plus, MapPin, Mail, Phone, Clock,
    AtSign, Briefcase, User, Edit, Trash2, ShieldCheck, 
    Zap, AlertCircle, CheckCircle2, XCircle, Send,
    BarChart3, Activity, UserCog, UserPlus, Power, Info
} from 'lucide-react';
import { api } from '../src/services/api';

interface StaffManagerProps {
    selectedBranch: BranchName;
    availableBranches: Branch[];
    quickAction?: string | null;
    onQuickActionHandled?: () => void;
}

const StaffManager: React.FC<StaffManagerProps> = ({ selectedBranch, availableBranches, quickAction, onQuickActionHandled }) => {
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<string>('All Roles');

    // Add User Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'employee',
        username: '' // Will be auto-generated or derived
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [staffData, tasksData] = await Promise.all([
                api.getStaff(),
                api.getTasks()
            ]);
            // Show all staff who are NOT explicitly clients
            const organizationalStaff = staffData.filter(s => 
                s.role.toLowerCase() !== 'client'
            );
            setStaffList(organizationalStaff);
            setTasks(tasksData);
        } catch (error) {
            console.error('Failed to fetch staff:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage(null);

        try {
            // Generate a simple username from email if not provided
            const generatedUsername = formData.email.split('@')[0] + Math.floor(Math.random() * 100);
            
            await api.createStaff({
                ...formData,
                username: generatedUsername,
                branch: selectedBranch === BranchName.ALL ? 'Ravulapalem' : selectedBranch,
                hourlyRate: 200 // Default
            });

            setMessage({ type: 'success', text: 'User created and password link sent successfully!' });
            setFormData({ name: '', email: '', phone: '', role: 'employee', username: '' });
            fetchData();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to create user' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSendPasswordLink = async (staffId: string, email: string) => {
        try {
            await api.auth.adminSendResetLink(staffId, email);
            alert('Password link sent successfully!');
        } catch (err: any) {
            alert('Error: ' + err.message);
        }
    };

    const handleDeleteStaff = async (staffId: string, staffName: string) => {
        if (!window.confirm(`Are you sure you want to permanently delete ${staffName}? This will also remove their login access.`)) {
            return;
        }

        try {
            await api.deleteStaff(staffId);
            alert('Staff member deleted successfully.');
            fetchData();
        } catch (err: any) {
            alert('Error: ' + err.message);
        }
    };

    const filteredStaff = staffList.filter(staff => {
        const matchesBranch = selectedBranch === BranchName.ALL || staff.branch === selectedBranch;
        const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            staff.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            staff.phone?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'All Roles' || staff.role.toLowerCase() === filterRole.toLowerCase();
        return matchesBranch && matchesSearch && matchesRole;
    });

    const getStaffAnalytics = (staff: Staff) => {
        const staffTasks = tasks.filter(t => t.assignedTo === staff.name);
        // Simple mock calculations for the demo - in production these come from time_logs table
        const workedHours = staff.isClockedIn ? 20.02 : 0; 
        const trackedHours = staff.mtdTrackedHours || 0.03;
        const untrackedHours = Math.max(0, workedHours - trackedHours);
        const trackedPercent = workedHours > 0 ? (trackedHours / workedHours) * 100 : 0;

        return {
            worked: "20:02:14", // Mocked format for UI excellence
            tracked: trackedHours.toFixed(2),
            untracked: untrackedHours.toFixed(2),
            percent: trackedPercent.toFixed(0)
        };
    };

    return (
        <div className="h-full bg-slate-50 overflow-y-auto font-sans pb-20">
            <div className="p-8 pb-4">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1">VR Hero Admin Panel</p>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Users</h2>
                    </div>
                </div>

                {/* Add User Integrated Form */}
                <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm mb-8">
                    <div className="mb-6">
                        <h3 className="text-xl font-black text-slate-800">Add User</h3>
                        <p className="text-slate-400 text-xs font-medium">A password setup email will be sent automatically.</p>
                    </div>

                    <form onSubmit={handleCreateUser} className="flex flex-wrap items-end gap-4">
                        <div className="flex-1 min-w-[200px] space-y-1.5 focus-within:scale-[1.01] transition-transform">
                            <input 
                                required
                                type="text" 
                                placeholder="Name" 
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                            />
                        </div>
                        <div className="flex-1 min-w-[200px] space-y-1.5">
                            <input 
                                required
                                type="email" 
                                placeholder="Email" 
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                            />
                        </div>
                        <div className="flex-1 min-w-[200px] space-y-1.5">
                            <input 
                                type="tel" 
                                placeholder="Phone" 
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                            />
                        </div>
                        <div className="flex-1 min-w-[150px] space-y-1.5">
                            <select 
                                value={formData.role}
                                onChange={e => setFormData({...formData, role: e.target.value})}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                            >
                                <option value="employee">employee</option>
                                <option value="admin">admin</option>
                            </select>
                        </div>
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 h-[54px]"
                        >
                            {isSubmitting ? <Activity size={18} className="animate-spin" /> : <Send size={18} />}
                            Create User & Send Password Link
                        </button>
                    </form>

                    {message && (
                        <div className={`mt-4 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                            {message.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                            <span className="text-xs font-bold">{message.text}</span>
                        </div>
                    )}
                </div>

                {/* Filters */}
                <div className="flex gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input 
                            type="text" 
                            placeholder="Search by name, email, phone" 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all shadow-sm"
                        />
                    </div>
                    <select 
                        value={filterRole}
                        onChange={e => setFilterRole(e.target.value)}
                        className="px-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold outline-none shadow-sm min-w-[150px]"
                    >
                        <option>All Roles</option>
                        <option>admin</option>
                        <option>employee</option>
                    </select>
                </div>
            </div>

            {/* User Table Part */}
            <div className="px-8">
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <Activity className="animate-spin mx-auto text-indigo-500 mb-4" size={32} />
                                        <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">Initializing Vault...</p>
                                    </td>
                                </tr>
                            ) : filteredStaff.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <Info className="mx-auto text-slate-200 mb-4" size={48} />
                                        <p className="text-slate-400 font-bold text-sm">No organizational members found matching your search.</p>
                                    </td>
                                </tr>
                            ) : filteredStaff.map(staff => (
                                <tr key={staff.id} className="hover:bg-indigo-50/30 transition-colors group">
                                    <td className="px-8 py-6 font-bold text-slate-700">{staff.name}</td>
                                    <td className="px-8 py-6 text-slate-500 text-sm font-medium">{staff.email}</td>
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${staff.role.toLowerCase() === 'admin' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                                            {staff.role}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                            {staff.status || 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <button className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                                                <Edit size={14} /> Edit
                                            </button>
                                            <button className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 hover:text-white transition-all shadow-sm">
                                                <Power size={14} /> Deactivate
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteStaff(staff.id, staff.name)}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                            >
                                                <Trash2 size={14} /> Delete
                                            </button>
                                            <button 
                                                onClick={() => handleSendPasswordLink(staff.id, staff.email || "")}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-sky-50 text-sky-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-sky-600 hover:text-white transition-all shadow-sm"
                                            >
                                                <Send size={14} /> Password Link
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Time Analytics Section */}
                <div className="mt-12 mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                                <BarChart3 className="text-indigo-500" />
                                Time Analytics (Attendance vs Task Logs)
                            </h3>
                            <p className="text-slate-400 text-xs font-medium">Worked hours from clock-in/out and tracked hours from task logs.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Employee</span>
                            <select className="px-4 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none shadow-sm min-w-[200px]">
                                <option>Select</option>
                                {staffList.map(s => <option key={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredStaff.slice(0, 4).map(staff => {
                            const analytics = getStaffAnalytics(staff);
                            return (
                                <div key={staff.id} className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm group hover:border-indigo-100 transition-all">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h4 className="text-lg font-black text-slate-800 tracking-tight">{staff.name}</h4>
                                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                                Worked: {analytics.worked} | Tracked: {analytics.tracked}h | Untracked: {analytics.untracked}h
                                            </p>
                                        </div>
                                        <div className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                            {analytics.percent}% tracked
                                        </div>
                                    </div>
                                    <div className="relative h-2.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                        <div 
                                            className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full transition-all duration-1000 group-hover:bg-indigo-600"
                                            style={{ width: `${analytics.percent}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffManager;
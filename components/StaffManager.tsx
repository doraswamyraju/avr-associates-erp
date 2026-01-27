import React, { useState } from 'react';
import { MOCK_STAFF, MOCK_TASKS } from '../constants';
import { BranchName, Staff, TaskStatus } from '../types';
import { 
    Search, Plus, MapPin, Mail, Phone, MoreHorizontal, Clock, 
    AtSign, Briefcase, User, ChevronRight, List, LayoutGrid,
    IndianRupee, TrendingUp, ShieldCheck, Zap
} from 'lucide-react';

interface StaffManagerProps {
    selectedBranch: BranchName;
}

const StaffManager: React.FC<StaffManagerProps> = ({ selectedBranch }) => {
    const [staffList, setStaffList] = useState<Staff[]>(MOCK_STAFF);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const filteredStaff = staffList.filter(staff => {
        const matchesBranch = selectedBranch === BranchName.ALL || staff.branch === selectedBranch;
        const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              staff.role.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesBranch && matchesSearch;
    });

    const getStaffPerformance = (staffName: string) => {
        const tasks = MOCK_TASKS.filter(t => t.assignedTo === staffName);
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === TaskStatus.COMPLETED || t.status === TaskStatus.FILED).length;
        const pending = total - completed;
        const score = total === 0 ? 0 : Math.round((completed / total) * 100);
        return { total, pending, score };
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            {/* Header Section */}
            <div className="p-6 bg-white border-b border-slate-200 shrink-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Workforce Hub</h2>
                        <p className="text-slate-500 text-sm font-medium">Monitor utilization, effort logs, and payroll metrics.</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
                            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={20} /></button>
                            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><List size={20} /></button>
                        </div>
                        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 shadow-xl shadow-slate-200 transition-all active:scale-95"><Plus size={18} strokeWidth={3} /> Register Employee</button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search by name, role or employee ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm" />
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100 text-[10px] font-black uppercase tracking-[0.15em]"><MapPin size={14} />Branch: {selectedBranch}</div>
                </div>
            </div>

            {/* Scrollable Staff Content */}
            <div className="flex-1 overflow-y-auto p-6 min-h-0 relative">
                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-20">
                        {filteredStaff.map(staff => {
                            const stats = getStaffPerformance(staff.name);
                            return (
                                <div key={staff.id} className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm hover:shadow-2xl hover:border-indigo-200 transition-all duration-500 group relative overflow-hidden flex flex-col">
                                    <div className="flex justify-between items-center mb-8 shrink-0">
                                        <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest border border-slate-100 rounded-lg">ID: {staff.id}</span>
                                        <div className="flex items-center gap-1.5">
                                            {staff.isClockedIn && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>}
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${staff.isClockedIn ? 'text-emerald-600' : 'text-slate-300'}`}>{staff.isClockedIn ? 'Clocked In' : 'Offline'}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-center text-center mb-8 shrink-0">
                                        <div className="relative mb-4 group-hover:scale-105 transition-transform duration-500">
                                            <img src={staff.avatarUrl} alt={staff.name} className="w-24 h-24 rounded-[1.75rem] object-cover border-4 border-white shadow-xl relative z-10"/>
                                            <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-lg border border-slate-100 z-20"><Briefcase size={16} className="text-indigo-600" /></div>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-800 tracking-tight">{staff.name}</h3>
                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.1em] mt-1">{staff.role}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-8 shrink-0">
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">MTD Hours</p>
                                            <p className="text-lg font-black text-slate-800">{staff.mtdTrackedHours}h</p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Utilization</p>
                                            <p className="text-lg font-black text-indigo-600">{stats.score}%</p>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-6 border-t border-slate-50 space-y-3">
                                        <div className="flex items-center gap-3 text-xs font-bold text-slate-500 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100"><AtSign size={14} className="text-slate-300" /><span className="truncate">{staff.email || 'N/A'}</span></div>
                                        <div className="flex gap-2">
                                            <button className="flex-1 py-3 bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"><Mail size={14} /> Email</button>
                                            <button className="flex-1 py-3 bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"><Phone size={14} /> Call</button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-20">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">Identity</th>
                                    <th className="px-6 py-4">Duty Status</th>
                                    <th className="px-6 py-4">Effort Log (MTD)</th>
                                    <th className="px-6 py-4">Billable Rate</th>
                                    <th className="px-6 py-4">Payroll Accrual</th>
                                    <th className="px-6 py-4 text-right">Options</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredStaff.map(staff => {
                                    const stats = getStaffPerformance(staff.name);
                                    return (
                                        <tr key={staff.id} className="hover:bg-indigo-50/30 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <img src={staff.avatarUrl} className="w-10 h-10 rounded-xl object-cover shadow-sm ring-2 ring-white" alt="" />
                                                    <div>
                                                        <p className="font-black text-slate-800 tracking-tight">{staff.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{staff.role}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${staff.isClockedIn ? 'bg-emerald-100 text-emerald-700 shadow-sm shadow-emerald-200/50' : 'bg-slate-100 text-slate-400'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${staff.isClockedIn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                                                    {staff.isClockedIn ? 'On Duty' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={14} className="text-indigo-400" />
                                                        <span className="font-black text-slate-700">{staff.mtdTrackedHours}h Tracked</span>
                                                    </div>
                                                    <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-500 rounded-full" style={{width: `${Math.min(100, (staff.mtdTrackedHours/180)*100)}%`}}></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="font-black text-slate-600 flex items-center gap-1"><IndianRupee size={12}/>{staff.hourlyRate}/hr</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-emerald-600 text-base">₹{(staff.mtdTrackedHours * staff.hourlyRate).toLocaleString()}</span>
                                                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Est. Payout</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-200"><MoreHorizontal size={20}/></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="h-12 w-full"></div>
            </div>
            {isAddModalOpen && <AddStaffModal onClose={() => setIsAddModalOpen(false)} onAdd={(s) => setStaffList([...staffList, s])} />}
        </div>
    );
};

const AddStaffModal: React.FC<{ onClose: () => void, onAdd: (s: Staff) => void }> = ({ onClose, onAdd }) => {
    const [formData, setFormData] = useState({ name: '', role: '', branch: BranchName.RAVULAPALEM, email: '', password: '', rate: 200 });
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onAdd({ id: `S${Math.floor(Math.random() * 900) + 100}`, name: formData.name, role: formData.role, branch: formData.branch, email: formData.email, avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random&bold=true`, isClockedIn: false, hourlyRate: formData.rate, mtdTrackedHours: 0 }); onClose(); };
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div><h3 className="text-xl font-black text-slate-800 tracking-tight">Register Employee</h3><p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">New Staff Account</p></div>
                    <button onClick={onClose} className="w-10 h-10 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"><MoreHorizontal size={20} className="rotate-45" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    <div className="space-y-4">
                        <input required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Full Identity" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        <div className="grid grid-cols-2 gap-4">
                            <input required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Designation" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} />
                            <select className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value as BranchName})}>{Object.values(BranchName).filter(b => b !== BranchName.ALL).map(b => <option key={b}>{b}</option>)}</select>
                        </div>
                        <input required type="email" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Official Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex flex-col gap-2">
                            <label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest ml-1">Hourly Billable Rate (₹)</label>
                            <div className="relative">
                                <IndianRupee size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
                                <input required type="number" className="w-full pl-10 pr-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.rate} onChange={e => setFormData({...formData, rate: parseInt(e.target.value)})} />
                            </div>
                        </div>
                    </div>
                    <div className="pt-4 flex gap-4">
                        <button type="button" onClick={onClose} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                        <button type="submit" className="flex-2 px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 shadow-xl shadow-slate-200 transition-all active:scale-95">Verify & Create</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StaffManager;
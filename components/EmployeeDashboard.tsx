import React, { useState, useEffect } from 'react';
import { BranchName, TaskStatus, Task, User } from '../types';
import { api } from '../src/services/api';
import {
    Briefcase, Clock, AlertCircle, CheckCircle2, TrendingUp,
    List, ArrowRight, User as UserIcon, Calendar, Activity
} from 'lucide-react';
import { TrackerCard } from './Dashboard'; // Reuse the TrackerCard from Dashboard

interface EmployeeDashboardProps {
    selectedBranch: BranchName;
    currentUser: User;
    onNavigate?: (tab: string, params?: any) => void;
}

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ selectedBranch, currentUser, onNavigate }) => {
    const [myTasks, setMyTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            setLoading(true);
            try {
                // In a real scenario, the API could support filtering by assignedTo.
                // For now, we fetch all and filter.
                const tasksData = await api.getTasks();
                const filteredTasks = tasksData.filter((t: Task) => 
                    t.assignedTo === currentUser.name && 
                    (selectedBranch === BranchName.ALL || t.branch === selectedBranch)
                );
                setMyTasks(filteredTasks);
            } catch (error) {
                console.error("Failed to load employee dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        loadDashboardData();
    }, [selectedBranch, currentUser.name]);

    const activeTasksCount = myTasks.filter(t => t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.FILED).length;
    const completedTasksCount = myTasks.filter(t => t.status === TaskStatus.COMPLETED || t.status === TaskStatus.FILED).length;
    const overdueTasksCount = myTasks.filter(t => t.status === TaskStatus.OVERDUE || (new Date(t.dueDate) < new Date() && t.status !== TaskStatus.COMPLETED)).length;

    // SLA tracking - calculate average SLA progress for active tasks
    const activeTasks = myTasks.filter(t => t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.FILED);
    const avgSla = activeTasks.length > 0 
        ? Math.round(activeTasks.reduce((acc, curr) => acc + (curr.slaProgress || 0), 0) / activeTasks.length) 
        : 0;

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden font-sans">
            {loading && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-100 border-t-indigo-600"></div>
                        <p className="text-sm font-black text-indigo-900 uppercase tracking-widest animate-pulse">Syncing Workspace...</p>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-10 min-h-0 relative">
                
                {/* Welcome Header */}
                <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-4">
                            <span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                                Staff Portal
                            </span>
                            <span className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                <Clock size={14} className="text-indigo-400" />
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">
                            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-sky-500">{currentUser.name.split(' ')[0]}</span>
                        </h1>
                        <p className="text-slate-500 font-medium">You have <strong className="text-indigo-600">{activeTasksCount} active tasks</strong> requiring your attention.</p>
                    </div>

                    <div className="relative z-10 flex flex-col items-center justify-center bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 min-w-[200px]">
                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Current Status</div>
                        <div className={`px-6 py-2 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-sm ${currentUser.isClockedIn ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-200 text-slate-500 border border-slate-300'}`}>
                            <div className={`w-2 h-2 rounded-full ${currentUser.isClockedIn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                            {currentUser.isClockedIn ? 'Clocked In' : 'Clocked Out'}
                        </div>
                        {currentUser.isClockedIn && currentUser.clockInTime && (
                            <p className="text-xs text-slate-500 font-bold mt-3">
                                Since {new Date(currentUser.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        )}
                    </div>
                    
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-indigo-50/50 to-transparent pointer-events-none"></div>
                </div>

                {/* Tracker Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <TrackerCard 
                        title="Active Tasks" 
                        count={activeTasksCount} 
                        icon={Briefcase} 
                        actionLabel="View Tasks"
                        variant="indigo"
                        onCardClick={() => onNavigate?.('tasks')}
                    />
                    <TrackerCard 
                        title="Overdue Tasks" 
                        count={overdueTasksCount} 
                        icon={AlertCircle} 
                        actionLabel="Prioritize"
                        variant="rose"
                        onCardClick={() => onNavigate?.('tasks')}
                    />
                    <TrackerCard 
                        title="Completed" 
                        count={completedTasksCount} 
                        icon={CheckCircle2} 
                        actionLabel="History"
                        variant="emerald"
                        onCardClick={() => onNavigate?.('tasks')}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Active Tasks List */}
                    <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                                    <List size={20} className="text-indigo-600" />
                                    Your Current Tasks
                                </h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Sorted by Due Date</p>
                            </div>
                            <button onClick={() => onNavigate?.('tasks')} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors">
                                <ArrowRight size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto max-h-[400px]">
                            {activeTasks.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {activeTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 5).map(task => (
                                        <div key={task.id} className="p-6 flex items-center justify-between hover:bg-indigo-50/30 transition-colors group">
                                            <div className="flex items-start gap-4">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                                                    task.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' : 
                                                    task.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                                    'bg-blue-50 text-blue-600 border-blue-100'
                                                }`}>
                                                    <Briefcase size={18} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{task.serviceType}</h4>
                                                    <p className="text-xs text-slate-500 mt-1">{task.clientName}</p>
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                                            <Calendar size={10} /> {task.dueDate}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                                                            task.status === TaskStatus.REVIEW ? 'bg-purple-100 text-purple-700' :
                                                            task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' :
                                                            'bg-slate-100 text-slate-600'
                                                        }`}>
                                                            {task.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button onClick={() => onNavigate?.('tasks')} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200">
                                                Update
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full p-10 text-slate-400">
                                    <CheckCircle2 size={40} className="mb-4 text-emerald-200" />
                                    <p className="text-sm font-bold uppercase tracking-widest">All caught up!</p>
                                    <p className="text-xs text-slate-400 mt-1">No active tasks assigned to you right now.</p>
                                </div>
                            )}
                        </div>
                        {activeTasks.length > 5 && (
                            <div className="p-4 border-t border-slate-100 text-center bg-slate-50">
                                <button onClick={() => onNavigate?.('tasks')} className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">
                                    View All {activeTasks.length} Tasks
                                </button>
                            </div>
                        )}
                    </div>

                    {/* SLA Performance Widget */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
                                    <Activity size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800">SLA Performance</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Task Completion</p>
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center py-6">
                                <div className="relative w-32 h-32 flex items-center justify-center">
                                    {/* Circular Progress SVG Placeholder */}
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="45" className="stroke-slate-100" strokeWidth="10" fill="none" />
                                        <circle cx="50" cy="50" r="45" className="stroke-indigo-500" strokeWidth="10" fill="none" 
                                            strokeDasharray={`${avgSla * 2.83} 283`} strokeLinecap="round" 
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                        <span className="text-2xl font-black text-slate-800">{avgSla}%</span>
                                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-1">Avg SLA</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-6 mt-4 border border-slate-100">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Quick Links</h4>
                            <div className="space-y-2">
                                <button onClick={() => onNavigate?.('incoming')} className="w-full text-left px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center justify-between">
                                    Incoming Register <ArrowRight size={14} />
                                </button>
                                <button onClick={() => onNavigate?.('clients')} className="w-full text-left px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center justify-between">
                                    Client Directory <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="h-20 w-full shrink-0"></div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;

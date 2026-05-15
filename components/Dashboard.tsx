import React, { useState, useEffect } from 'react';
import { BranchName, TaskStatus, UserRole, Task, Client, Invoice, Staff, User, IncomingRegisterEntry, VisitorRegisterEntry, Project } from '../types';
import { api } from '../src/services/api';
import {
    Users, AlertCircle, CheckCircle2, IndianRupee, Clock, TrendingUp,
    Plus, FileText, Briefcase, Landmark, Shield, List, Bell,
    ArrowRight, PencilLine, UserPlus, ClipboardList, Package,
    FileCheck, Activity, Layers, Coffee, HardHat, FileBarChart,
    Search, UserMinus, Trash2
} from 'lucide-react';

interface DashboardProps {
    selectedBranch: BranchName;
    userRole: UserRole;
    currentUser: User;
    onNavigate?: (tab: string, params?: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ selectedBranch, userRole, currentUser, onNavigate }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [incomingTotal, setIncomingTotal] = useState<number>(0);
    const [visitorRegister, setVisitorRegister] = useState<VisitorRegisterEntry[]>([]);
    const [visitorTotal, setVisitorTotal] = useState<number>(0);
    const [activeProjectsCount, setActiveProjectsCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            setLoading(true);
            try {
                const [tasksData, clientsData, invoicesData, staffData, incomingData, visitorData, incomingStatsData] = await Promise.all([
                    api.getTasks(),
                    api.getClients(),
                    api.getInvoices(),
                    api.getStaff(),
                    api.getIncomingRegister(1, 0, '', selectedBranch),
                    api.getVisitorRegister(),
                    api.getIncomingRegisterStats(selectedBranch)
                ]);
                setTasks(tasksData);
                setClients(clientsData);
                setInvoices(invoicesData);
                setStaffList(staffData);
                setIncomingTotal(incomingData.total || 0);
                const fetchedIncoming = incomingData.data || [];
                setVisitorRegister(visitorData.data || []);
                setVisitorTotal(visitorData.total || 0);
                // Active Projects = Data Received + Work In Progress
                const active = (incomingStatsData['Data Received'] || 0) + (incomingStatsData['Work In Progress'] || 0) + (incomingStatsData['Data Pending'] || 0);
                setActiveProjectsCount(active);
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        loadDashboardData();
    }, [selectedBranch]);

    // Filter Data based on Branch (For those fully loaded)
    const branchFilteredTasks = tasks.filter(t => selectedBranch === BranchName.ALL || t.branch === selectedBranch);
    const branchFilteredClients = clients.filter(c => selectedBranch === BranchName.ALL || c.branch === selectedBranch);
    const branchFilteredVisitors = visitorRegister.filter(v => selectedBranch === BranchName.ALL || v.branch === selectedBranch);
    const branchFilteredStaff = staffList.filter(s => selectedBranch === BranchName.ALL || s.branch === selectedBranch);
    
    // New Calculations for new visuals
    const [pendingVerificationList, setPendingVerificationList] = useState<IncomingRegisterEntry[]>([]);
    
    useEffect(() => {
        const fetchPendingVerification = async () => {
            try {
                // Fetch more records to find pending verifications if needed, or use a larger limit in the main load
                const incomingAll = await api.getIncomingRegister(500, 0, '', selectedBranch);
                const pending = (incomingAll.data || []).filter((item: IncomingRegisterEntry) => item.verifiedStatus !== 'Verified' && item.status !== 'Completed');
                setPendingVerificationList(pending);
            } catch (e) {
                console.error(e);
            }
        };
        fetchPendingVerification();
    }, [selectedBranch]);

    // Branch wise unpaid amounts
    const branchUnpaid: Record<string, number> = {};
    invoices.forEach(inv => {
        if (inv.status === 'Unpaid' || inv.status === 'Overdue') {
            const client = clients.find(c => c.id === inv.clientId);
            const branchName = client?.branch || 'Unknown';
            if (selectedBranch === BranchName.ALL || branchName === selectedBranch) {
                branchUnpaid[branchName] = (branchUnpaid[branchName] || 0) + (inv.amount || 0);
            }
        }
    });

    // Employee wise pending tasks
    const employeePending: Record<string, number> = {};
    tasks.forEach(task => {
        if (task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.FILED) {
            if (selectedBranch === BranchName.ALL || task.branch === selectedBranch) {
                const empName = task.assignedTo || 'Unassigned';
                employeePending[empName] = (employeePending[empName] || 0) + 1;
            }
        }
    });
    // branchFilteredProjects removed - Active Projects now comes from incoming register stats (Data Received + WIP)

    const services = [
        { id: 'gst', name: 'GST', icon: Landmark, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { id: 'tds', name: 'TDS', icon: FileCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { id: 'it', name: 'Income tax', icon: Landmark, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'food', name: 'Food licence', icon: Coffee, color: 'text-amber-600', bg: 'bg-amber-50' },
        { id: 'msme', name: 'MSME', icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50' },
        { id: 'labour', name: 'Labour', icon: HardHat, color: 'text-rose-600', bg: 'bg-rose-50' },
        { id: 'project', name: 'Project Report', icon: TrendingUp, color: 'text-sky-600', bg: 'bg-sky-50' },
        { id: 'projections', name: 'Projections', icon: FileBarChart, color: 'text-teal-600', bg: 'bg-teal-50' },
        { id: 'pf-esi', name: 'PF AND ESI', icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { id: 'tax-audit', name: 'TAX AUDIT', icon: PencilLine, color: 'text-slate-600', bg: 'bg-slate-50' },
        { id: 'other', name: 'Other Services', icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { id: 'catalogue', name: 'Show All Services', icon: List, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { id: 'deleted', name: 'Deleted Users', icon: Trash2, color: 'text-slate-400', bg: 'bg-slate-50' },
    ];

    const TrackerCard = ({ title, count, icon: Icon, actionLabel, onClickAction, variant = 'blue', onCardClick }: any) => {
        const bgColors: any = {
            blue: 'bg-[#67B7D1] hover:bg-[#5AA8C0]',
            indigo: 'bg-indigo-600 hover:bg-indigo-700',
            slate: 'bg-slate-800 hover:bg-slate-900',
            rose: 'bg-rose-500 hover:bg-rose-600',
            emerald: 'bg-emerald-600 hover:bg-emerald-700'
        };

        return (
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-500 flex flex-col h-full">
                <div className="p-10 flex-1 relative cursor-pointer" onClick={onCardClick}>
                    <div className="absolute top-8 right-8 text-slate-100 transition-colors group-hover:text-indigo-100">
                        <Icon size={64} strokeWidth={1.5} />
                    </div>
                    <div className="relative z-10 space-y-2">
                        <h3 className="text-3xl font-black text-slate-800 tracking-tight">{title}</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-slate-900">{count}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Records Found</span>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={onClickAction}
                    className={`w-full py-4 text-white font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-colors border-t border-black/5 ${bgColors[variant] || bgColors.blue}`}
                >
                    {actionLabel} <ArrowRight size={14} />
                </button>
            </div>
        );
    };

    const ServiceTab = ({ id, name, icon: Icon, color, bg }: any) => (
        <div 
            onClick={() => {
                if (id === 'catalogue') {
                    onNavigate?.('services');
                } else if (id === 'deleted') {
                    onNavigate?.('clients');
                } else {
                    onNavigate?.('incoming', { serviceFilter: name });
                }
            }}
            className="bg-white rounded-[1.5rem] border border-slate-100 p-8 flex flex-col items-start gap-4 hover:shadow-xl transition-all duration-300 cursor-pointer group relative overflow-hidden"
        >
            <div className="absolute top-4 right-4 text-slate-100 group-hover:text-indigo-100/50 transition-colors">
                <Icon size={48} />
            </div>
            <h4 className="text-xl font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors relative z-10">{name}</h4>
        </div>
    );

    return (
        <div className="h-full overflow-y-auto custom-scrollbar bg-slate-50/30">
            {loading && <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>}

            <div className="p-10 space-y-12 pb-32 max-w-[1600px] mx-auto">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                    <div>
                        <h2 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">
                            {userRole === UserRole.ADMIN ? 'Hub Central' : 'My Dashboard'}
                        </h2>
                        <p className="text-slate-500 font-bold flex items-center gap-2">
                            <Activity size={16} className="text-indigo-500" />
                            Monitoring <span className="text-indigo-600 px-2 py-0.5 bg-indigo-50 rounded-lg">{selectedBranch}</span> ecosystem.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                         <div className="relative group">
                            <button className="p-4 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 shadow-sm transition-all relative">
                                <Bell size={24} />
                                <span className="absolute top-3 right-3 w-3 h-3 bg-rose-500 rounded-full border-2 border-white"></span>
                            </button>
                         </div>
                        {userRole === UserRole.ADMIN && (
                            <button 
                                onClick={() => onNavigate?.('branches')}
                                className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-50 shadow-lg transition-all active:scale-95 flex items-center gap-3"
                            >
                                <Plus size={18} /> New Branch
                            </button>
                        )}
                        <button 
                            onClick={() => onNavigate?.('tasks', { quickAction: 'NEW_TASK' })}
                            className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-indigo-600 shadow-2xl transition-all active:scale-95 flex items-center gap-3"
                        >
                            <TrendingUp size={18} /> New Engagement
                        </button>
                    </div>
                </div>

                {/* Operations & Reports Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 px-2">
                        <div className="h-px bg-slate-200 flex-1"></div>
                        <h3 className="text-2xl font-black text-indigo-900 tracking-tight uppercase">Operational Intelligence</h3>
                        <div className="h-px bg-slate-200 flex-1"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <TrackerCard 
                            title="Clients" 
                            count={branchFilteredClients.length} 
                            icon={Users} 
                            actionLabel="Add Client"
                            variant="blue"
                            onCardClick={() => onNavigate?.('clients')}
                            onClickAction={(e: any) => { e.stopPropagation(); onNavigate?.('clients', { quickAction: 'NEW_CLIENT' }); }}
                        />
                        <TrackerCard 
                            title="Employees" 
                            count={branchFilteredStaff.length} 
                            icon={UserPlus} 
                            actionLabel="Register Staff"
                            variant="indigo"
                            onCardClick={() => onNavigate?.('staff')}
                            onClickAction={(e: any) => { e.stopPropagation(); onNavigate?.('staff', { quickAction: 'NEW_EMPLOYEE' }); }}
                        />
                         <TrackerCard 
                            title="Active Projects" 
                            count={activeProjectsCount} 
                            icon={Briefcase} 
                            actionLabel="New Project"
                            variant="emerald"
                            onCardClick={() => onNavigate?.('tasks')}
                            onClickAction={(e: any) => { e.stopPropagation(); onNavigate?.('tasks', { quickAction: 'NEW_INCOMING' }); }}
                        />
                        <TrackerCard 
                            title="Audit Reports" 
                            count={24} 
                            icon={FileBarChart} 
                            actionLabel="View Analytics"
                            variant="slate"
                            onCardClick={() => onNavigate?.('reports')}
                            onClickAction={(e: any) => { e.stopPropagation(); onNavigate?.('reports'); }}
                        />
                    </div>
                </div>

                {/* Incoming Data Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 px-2">
                        <div className="h-px bg-slate-200 flex-1"></div>
                        <h3 className="text-2xl font-black text-indigo-900 tracking-tight uppercase">Incoming Data</h3>
                        <div className="h-px bg-slate-200 flex-1"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <TrackerCard 
                            title="Incoming Register" 
                            count={incomingTotal} 
                            icon={PencilLine} 
                            actionLabel="Add Incoming"
                            variant="blue"
                            onCardClick={() => onNavigate?.('incoming')}
                            onClickAction={(e: any) => { e.stopPropagation(); onNavigate?.('incoming', { quickAction: 'NEW_INCOMING' }); }}
                        />
                        <TrackerCard 
                            title="Visitor Register" 
                            count={visitorTotal} 
                            icon={UserPlus} 
                            actionLabel="Add Visitor"
                            variant="blue"
                            onCardClick={() => onNavigate?.('visitors')}
                            onClickAction={(e: any) => { e.stopPropagation(); onNavigate?.('visitors', { quickAction: 'ADD_VISITOR' }); }}
                        />
                    </div>
                </div>

                {/* New Analytical Visuals Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                    {/* Branch Wise Unpaid List */}
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-8 flex flex-col h-[400px]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                                <IndianRupee size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">Unpaid Dues</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Branch Wise Overview</p>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                            {Object.keys(branchUnpaid).length > 0 ? Object.entries(branchUnpaid).sort((a, b) => b[1] - a[1]).map(([branch, amount]) => (
                                <div key={branch} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="font-bold text-slate-700">{branch}</span>
                                    <span className="font-black text-rose-600">₹{amount.toLocaleString()}</span>
                                </div>
                            )) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <CheckCircle2 size={32} className="mb-2 text-emerald-400" />
                                    <p className="font-bold text-sm">No Unpaid Invoices</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Employee Wise Pending List */}
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-8 flex flex-col h-[400px]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                                <Clock size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">Pending Tasks</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Employee Wise Status</p>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                            {Object.keys(employeePending).length > 0 ? Object.entries(employeePending).sort((a, b) => b[1] - a[1]).map(([emp, count]) => (
                                <div key={emp} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-indigo-50 transition-colors">
                                    <span className="font-bold text-slate-700 flex items-center gap-2">
                                        <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-black text-xs">
                                            {emp.substring(0, 2).toUpperCase()}
                                        </div>
                                        {emp}
                                    </span>
                                    <span className="font-black text-amber-600 bg-amber-100 px-3 py-1 rounded-lg">{count} Tasks</span>
                                </div>
                            )) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <CheckCircle2 size={32} className="mb-2 text-emerald-400" />
                                    <p className="font-bold text-sm">No Pending Tasks</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* To Do Verification List */}
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-8 flex flex-col h-[400px]">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight">To Do Verification</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Registers</p>
                                </div>
                            </div>
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-xl text-xs font-black">{pendingVerificationList.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                            {pendingVerificationList.length > 0 ? pendingVerificationList.slice(0, 20).map((item) => (
                                <div key={item.id} onClick={() => onNavigate?.('incoming')} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-black text-slate-800 text-sm line-clamp-1">{item.customerName || 'Unknown Client'}</span>
                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md whitespace-nowrap">{item.date}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium text-slate-600 truncate">{item.serviceName}</span>
                                        <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                                            {item.verifiedStatus || 'Not Verified'}
                                        </span>
                                    </div>
                                </div>
                            )) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <CheckCircle2 size={32} className="mb-2 text-emerald-400" />
                                    <p className="font-bold text-sm">All Verified</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Services Information Section */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4 px-2">
                        <div className="h-px bg-slate-200 flex-1"></div>
                        <h3 className="text-2xl font-black text-indigo-900 tracking-tight uppercase">Services Information</h3>
                        <div className="h-px bg-slate-200 flex-1"></div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {services.map((service) => (
                            <ServiceTab key={service.id} {...service} />
                        ))}
                    </div>
                </div>

                {/* Recent Updates & Notifications Section (Floating at bottom style) */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden mt-12 bg-gradient-to-br from-white to-slate-50">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                                <Bell size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">Recent Activity Hub</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Real-time updates from {selectedBranch}</p>
                            </div>
                        </div>
                        <span className="px-5 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                            12 New Notifications
                        </span>
                    </div>
                    
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar px-2">
                        <div className="divide-y divide-slate-100">
                            {branchFilteredTasks.slice(0, 8).map((update, idx) => (
                                <div key={idx} className="p-6 flex items-start gap-6 hover:bg-white transition-colors group cursor-pointer">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all group-hover:scale-110 ${
                                        update.status === TaskStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                        update.status === TaskStatus.OVERDUE ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                        'bg-blue-50 text-blue-600 border-blue-100'
                                    }`}>
                                        <ClipboardList size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-black text-slate-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{update.clientName}</h4>
                                            <span className="text-[10px] font-bold text-slate-400 font-mono">{update.dueDate}</span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-500 line-clamp-1">{update.serviceType} processing initiated for period {update.period}.</p>
                                        <div className="mt-3 flex items-center gap-4">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                <Users size={12} /> {update.assignedTo || 'System'}
                                            </span>
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                                update.status === TaskStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' : 
                                                'bg-indigo-100 text-indigo-700'
                                            }`}>
                                                {update.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
                        <button 
                            onClick={() => onNavigate?.('tasks')}
                            className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] hover:text-slate-900 transition-colors"
                        >
                            View Comprehensive Log
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const StatusBadge = ({ status }: { status: TaskStatus }) => {
    let styles = "bg-slate-100 text-slate-700 border-slate-200";
    switch (status) {
        case TaskStatus.COMPLETED: styles = "bg-green-50 text-green-700 border-green-200"; break;
        case TaskStatus.FILED: styles = "bg-emerald-50 text-emerald-700 border-emerald-200"; break;
        case TaskStatus.OVERDUE: styles = "bg-red-50 text-red-700 border-red-200"; break;
        case TaskStatus.IN_PROGRESS: styles = "bg-blue-50 text-blue-700 border-blue-200"; break;
        case TaskStatus.REVIEW: styles = "bg-purple-50 text-purple-700 border-purple-200"; break;
        case TaskStatus.PENDING_CLIENT: styles = "bg-amber-50 text-amber-700 border-amber-200"; break;
    }

    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles} flex w-fit items-center gap-1`}>
            {status === TaskStatus.COMPLETED && <CheckCircle2 size={10} />}
            {status === TaskStatus.OVERDUE && <AlertCircle size={10} />}
            {status}
        </span>
    );
}

export default Dashboard;
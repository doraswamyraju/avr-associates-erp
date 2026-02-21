import React, { useState, useEffect } from 'react';
import { BranchName, TaskStatus, UserRole, Task, Client, Invoice, Staff, User } from '../types';
import { api } from '../src/services/api';
import { Users, AlertCircle, CheckCircle2, IndianRupee, Clock, TrendingUp } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const [tasksData, clientsData, invoicesData, staffData] = await Promise.all([
                    api.getTasks(),
                    api.getClients(),
                    api.getInvoices(),
                    api.getStaff()
                ]);
                setTasks(tasksData);
                setClients(clientsData);
                setInvoices(invoicesData);
                setStaffList(staffData);
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        loadDashboardData();
    }, []);

    // Filter Data based on Branch
    const branchFilteredTasks = tasks.filter(t => selectedBranch === BranchName.ALL || t.branch === selectedBranch);
    const branchFilteredClients = clients.filter(c => selectedBranch === BranchName.ALL || c.branch === selectedBranch);
    const branchFilteredInvoices = invoices.filter(i => {
        const client = clients.find(c => c.id === i.clientId);
        return selectedBranch === BranchName.ALL || client?.branch === selectedBranch;
    });

    // Role-based filtering
    const displayTasks = userRole === UserRole.ADMIN
        ? branchFilteredTasks
        : branchFilteredTasks.filter(t => t.assignedTo === currentUser.name);

    // Metrics
    const totalClients = branchFilteredClients.length;
    const pendingTasks = displayTasks.filter(t => t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.FILED).length;
    const overdueTasks = displayTasks.filter(t => t.status === TaskStatus.OVERDUE).length;

    // Admin Specific Metrics
    const paidInvoices = branchFilteredInvoices.filter(i => i.status === 'Paid');
    const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.amount, 0);
    const totalBilled = branchFilteredInvoices.reduce((sum, i) => sum + i.amount, 0);
    const collectionRate = totalBilled > 0 ? Math.round((totalRevenue / totalBilled) * 100) : 0;

    // Compliance Outlook (Next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const upcomingDeadlines = branchFilteredTasks.filter(t => {
        const dueDate = new Date(t.dueDate);
        return dueDate >= new Date() && dueDate <= thirtyDaysFromNow;
    }).length;

    // Chart Data: Status Distribution
    const statusCounts = displayTasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const pieData = Object.keys(statusCounts).map(status => ({
        name: status,
        value: statusCounts[status]
    }));

    // Chart Data: Employee Workload (Admin only)
    const staffWorkload = staffList
        .filter(s => selectedBranch === BranchName.ALL || s.branch === selectedBranch)
        .map(staff => {
            const count = branchFilteredTasks.filter(t =>
                t.assignedTo === staff.name &&
                t.status !== TaskStatus.COMPLETED &&
                t.status !== TaskStatus.FILED
            ).length;
            return {
                name: staff.name,
                pendingTasks: count
            };
        })
        .filter(item => item.pendingTasks > 0)
        .sort((a, b) => b.pendingTasks - a.pendingTasks);

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    const StatCard = ({ title, value, icon: Icon, color, subtext, trend }: any) => (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-xl transition-all duration-300 group">
            <div className="space-y-2">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h3>
                    {trend && (
                        <span className={`text-[10px] font-bold ${trend === 'up' ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {trend === 'up' ? '▲' : '▼'}
                        </span>
                    )}
                </div>
                {subtext && <p className="text-xs font-medium text-slate-400">{subtext}</p>}
            </div>
            <div className={`p-4 rounded-2xl ${color} shadow-lg shadow-current/10 group-hover:scale-110 transition-transform`}>
                <Icon size={24} className="text-white" />
            </div>
        </div>
    );

    const handleStaffBarClick = (data: any) => {
        if (onNavigate && data && data.activePayload && data.activePayload.length > 0) {
            const employeeName = data.activePayload[0].payload.name;
            onNavigate('tasks', { assignee: employeeName });
        }
    };

    return (
        <div className="h-full overflow-y-auto custom-scrollbar relative bg-slate-50/50">
            {loading && <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>}

            <div className="p-8 space-y-8 pb-32">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                                {userRole === UserRole.ADMIN ? 'Executive Hub' : 'My Workspace'}
                            </h2>
                            {userRole === UserRole.EMPLOYEE && (
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${currentUser.isClockedIn ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : 'bg-slate-200 text-slate-500'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${currentUser.isClockedIn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                    {currentUser.isClockedIn ? 'On Duty' : 'Offline'}
                                </span>
                            )}
                        </div>
                        <p className="text-slate-500 text-sm font-medium">Monitoring {selectedBranch} performance & operations.</p>
                    </div>
                    <div className="flex gap-3">
                        {userRole === UserRole.ADMIN && (
                            <button className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 shadow-sm transition-all active:scale-95">
                                Analytics Export
                            </button>
                        )}
                        <button
                            onClick={() => onNavigate && onNavigate('tasks', { quickAction: 'NEW_TASK' })}
                            className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <TrendingUp size={16} /> New Engagement
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title={userRole === UserRole.ADMIN ? "Network Clients" : "Active Assigns"}
                        value={userRole === UserRole.ADMIN ? totalClients : pendingTasks}
                        icon={Users}
                        color="bg-indigo-600"
                        subtext={userRole === UserRole.ADMIN ? "+4.2% growth" : "Primary workload focus"}
                        trend="up"
                    />
                    <StatCard
                        title={userRole === UserRole.ADMIN ? "Revenue Collection" : "Efficiency Score"}
                        value={userRole === UserRole.ADMIN ? `${collectionRate}%` : "94%"}
                        icon={IndianRupee}
                        color="bg-emerald-500"
                        subtext={userRole === UserRole.ADMIN ? "Billed vs Realized" : "+2% vs last month"}
                        trend="up"
                    />
                    <StatCard
                        title="Urgent Actions"
                        value={overdueTasks}
                        icon={AlertCircle}
                        color="bg-rose-500"
                        subtext="Requires immediate focus"
                    />
                    <StatCard
                        title={userRole === UserRole.ADMIN ? "30D Compliance" : "Work Hours (MTD)"}
                        value={userRole === UserRole.ADMIN ? upcomingDeadlines : `${staffList.find(s => s.name === currentUser.name)?.mtdTrackedHours || 0}h`}
                        icon={Clock}
                        color="bg-amber-500"
                        subtext={userRole === UserRole.ADMIN ? "Upcoming critical filings" : "Tracked effort logs"}
                    />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Chart: Distribution or Personal Efficiency */}
                    <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col">
                        <div className="mb-8">
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">Status Distribution</h3>
                            <p className="text-xs font-medium text-slate-400">Total operational breakdown</p>
                        </div>
                        <div className="h-64 flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={8}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                        itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            {pieData.slice(0, 4).map((entry, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Chart: Workload (Admin) or Personalized Task Timeline (Employee) */}
                    <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 tracking-tight">
                                    {userRole === UserRole.ADMIN ? 'Workforce Allocation' : 'Personal Performance'}
                                </h3>
                                <p className="text-xs font-medium text-slate-400">Activity and engagement tracking</p>
                            </div>
                            {userRole === UserRole.ADMIN && <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Click bar to drill down</span>}
                        </div>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={userRole === UserRole.ADMIN ? staffWorkload : [
                                        { name: 'Week 1', tasks: 12 },
                                        { name: 'Week 2', tasks: 18 },
                                        { name: 'Week 3', tasks: 15 },
                                        { name: 'Week 4', tasks: 22 },
                                    ]}
                                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                                    onClick={handleStaffBarClick}
                                    className="cursor-pointer"
                                    barGap={12}
                                >
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                                    />
                                    <Bar
                                        dataKey={userRole === UserRole.ADMIN ? "pendingTasks" : "tasks"}
                                        fill="#6366f1"
                                        radius={[8, 8, 8, 8]}
                                        barSize={32}
                                        className="hover:fill-indigo-400 transition-colors"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Priority List */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div>
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">Priority Engagements</h3>
                            <p className="text-xs font-medium text-slate-400 mt-0.5">Focus items requiring immediate resolution</p>
                        </div>
                        <button onClick={() => onNavigate && onNavigate('tasks')} className="px-5 py-2.5 bg-white border border-slate-200 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm">View Full Registry</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-5">Client Identity</th>
                                    <th className="px-8 py-5">Engagement Type</th>
                                    <th className="px-8 py-5">Due Deadline</th>
                                    <th className="px-8 py-5">Process Status</th>
                                    <th className="px-8 py-5">Assigned To</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {displayTasks.slice(0, 6).map(task => (
                                    <tr key={task.id} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="px-8 py-6 font-black text-slate-800 tracking-tight">{task.clientName}</td>
                                        <td className="px-8 py-6">
                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-100/50">
                                                {task.serviceType}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-slate-500 font-bold">{task.dueDate}</td>
                                        <td className="px-8 py-6">
                                            <StatusBadge status={task.status} />
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-black text-xs text-indigo-600 border border-slate-200 uppercase">
                                                    {(task.assignedTo || '?').charAt(0)}
                                                </div>
                                                <span className="font-bold text-slate-700">{task.assignedTo || 'Unassigned'}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
import React, { useState, useEffect } from 'react';
import { BranchName, TaskStatus, UserRole, Task, Client, Invoice, Staff } from '../types';
import { api } from '../src/services/api';
import { Users, AlertCircle, CheckCircle2, IndianRupee, Clock, TrendingUp } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

interface DashboardProps {
    selectedBranch: BranchName;
    userRole: UserRole;
    onNavigate?: (tab: string, params?: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ selectedBranch, userRole, onNavigate }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [staffList, setStaffList] = useState<Staff[]>([]); // Renamed to avoid reserved word conflict if any
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
    const filteredTasks = tasks.filter(t => selectedBranch === BranchName.ALL || t.branch === selectedBranch);
    const filteredClients = clients.filter(c => selectedBranch === BranchName.ALL || c.branch === selectedBranch);
    const filteredInvoices = invoices.filter(i => {
        const client = clients.find(c => c.id === i.clientId);
        return selectedBranch === BranchName.ALL || client?.branch === selectedBranch;
    });

    // Metrics
    const totalClients = filteredClients.length;
    const pendingTasks = filteredTasks.filter(t => t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.FILED).length;
    const overdueTasks = filteredTasks.filter(t => t.status === TaskStatus.OVERDUE).length;
    const totalRevenue = filteredInvoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0);

    // Chart Data: Status Distribution
    const statusCounts = filteredTasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const pieData = Object.keys(statusCounts).map(status => ({
        name: status,
        value: statusCounts[status]
    }));

    // Chart Data: Employee Workload (Pending Tasks)
    const staffWorkload = staffList
        .filter(s => selectedBranch === BranchName.ALL || s.branch === selectedBranch)
        .map(staff => {
            const count = filteredTasks.filter(t =>
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

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff6b6b'];

    const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-md transition-shadow">
            <div>
                <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
                {subtext && <p className="text-xs text-slate-400 mt-2">{subtext}</p>}
            </div>
            <div className={`p-3 rounded-lg ${color}`}>
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
        <div className="h-full overflow-y-auto custom-scrollbar relative">
            {loading && <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>}
            <div className="p-6 space-y-6 pb-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">
                            {userRole === UserRole.ADMIN ? 'Executive Overview' : 'Staff Dashboard'}
                        </h2>
                        <p className="text-slate-500 text-sm">Welcome back, here's what's happening at {selectedBranch}.</p>
                    </div>
                    <div className="flex gap-2">
                        {userRole === UserRole.ADMIN && (
                            <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50">
                                Export Report
                            </button>
                        )}
                        <button
                            onClick={() => onNavigate && onNavigate('tasks', { quickAction: 'NEW_TASK' })}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm"
                        >
                            + New Task
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Active Clients"
                        value={totalClients}
                        icon={Users}
                        color="bg-blue-500"
                        subtext="+2 this month"
                    />
                    <StatCard
                        title="Pending Tasks"
                        value={pendingTasks}
                        icon={Clock}
                        color="bg-amber-500"
                        subtext={`${Math.round((pendingTasks / filteredTasks.length) * 100 || 0)}% of total workload`}
                    />
                    <StatCard
                        title="Overdue Compliance"
                        value={overdueTasks}
                        icon={AlertCircle}
                        color="bg-red-500"
                        subtext="Requires immediate attention"
                    />
                    {userRole === UserRole.ADMIN && (
                        <StatCard
                            title="Revenue (Jun)"
                            value={`₹${totalRevenue.toLocaleString()}`}
                            icon={IndianRupee}
                            color="bg-emerald-500"
                            subtext="15% vs last month"
                        />
                    )}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Employee Workload Chart - Clickable */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold text-slate-800">Employee Workload (Pending)</h3>
                            <p className="text-xs text-slate-400">Click bar to view tasks</p>
                        </div>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={staffWorkload}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    onClick={handleStaffBarClick}
                                    className="cursor-pointer"
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="pendingTasks" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} name="Pending Tasks" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Task Distribution */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold text-slate-800">Task Status Distribution</h3>
                        </div>
                        <div className="h-72 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Recent Tasks List */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-8">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-800">Priority Tasks</h3>
                        <a href="#" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">View All</a>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-700 font-medium border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Client</th>
                                    <th className="px-6 py-4">Service</th>
                                    <th className="px-6 py-4">Due Date</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Assignee</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredTasks.slice(0, 5).map(task => (
                                    <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-800">{task.clientName}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                {task.serviceType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{task.dueDate}</td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={task.status} />
                                        </td>
                                        <td className="px-6 py-4 flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                                {(task.assignedTo || '?').charAt(0)}
                                            </div>
                                            {task.assignedTo || 'Unassigned'}
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

import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, FileText, Briefcase, CreditCard, User, LogOut,
    Bell, Menu, X, Upload, Download, CheckCircle2, Clock,
    AlertCircle, ChevronRight, Search, File, MessageSquare,
    LifeBuoy, PhoneCall, Headphones, Mail, ExternalLink, Plus
} from 'lucide-react';
import { BranchName, Client, TaskStatus, Invoice, ClientDocument } from '../types';
import { MOCK_TASKS, MOCK_INVOICES, MOCK_DOCUMENTS, MOCK_COMPLIANCE_EVENTS } from '../constants';
import { StatusBadge } from './Dashboard';
import { api } from '../src/services/api';

interface ClientPortalProps {
    client: Client;
    onLogout: () => void;
}

const ClientPortal: React.FC<ClientPortalProps> = ({ client, onLogout }) => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'documents' | 'services' | 'billing' | 'profile'>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [tasks, setTasks] = useState<any[]>([]);
    const [documents, setDocuments] = useState<ClientDocument[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]); // Future: Fetch invoices
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [t, d] = await Promise.all([
                    api.getTasks(client.id),
                    api.getDocuments(client.id)
                ]);
                setTasks(t);
                setDocuments(d);
            } catch (err) {
                console.error("Failed to load portal data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [client.id]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('file', file);
            formData.append('clientId', client.id);

            try {
                await api.uploadDocument(formData);
                const updatedDocs = await api.getDocuments(client.id);
                setDocuments(updatedDocs);
                alert("Document uploaded successfully!");
            } catch (err) {
                alert("Failed to upload document");
            }
        }
    };

    // Filter Data for this Client (using API data)
    const myTasks = tasks; // API already filters by clientID
    const myInvoices = MOCK_INVOICES.filter(i => i.clientId === client.id); // Keeping mock for now as invoices API not fully ready/requested
    const myDocuments = documents;

    // Derived Metrics from Real Data
    const pendingActions = myTasks.filter(t => t.status === TaskStatus.PENDING_CLIENT || t.status === TaskStatus.REVIEW).length;
    const unpaidAmount = myInvoices.filter(i => i.status === 'Unpaid' || i.status === 'Overdue').reduce((acc, curr) => acc + curr.amount, 0);
    const activeServicesCount = myTasks.filter(t => t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.FILED).length;

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const menuItems = [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'services', label: 'Track Services', icon: Briefcase },
        { id: 'documents', label: 'My Documents', icon: FileText },
        { id: 'billing', label: 'Billing & Payments', icon: CreditCard },
        { id: 'profile', label: 'Company Profile', icon: User },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        {/* Welcome Banner */}
                        <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                            <div className="relative z-10">
                                <h1 className="text-2xl font-bold mb-2">Welcome back, {client.name.split(' ')[0]}!</h1>
                                <p className="text-indigo-100 opacity-90">Here's what's happening with your accounts today.</p>
                            </div>
                            <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12 transform origin-bottom-left"></div>
                        </div>

                        {/* Action Items */}
                        {pendingActions > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
                                <div className="p-2 bg-amber-100 text-amber-700 rounded-full shrink-0">
                                    <AlertCircle size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-amber-900">Action Required</h3>
                                    <p className="text-sm text-amber-800 mt-1">You have <span className="font-bold">{pendingActions}</span> items requiring your attention (Approvals or Document Uploads).</p>
                                    <button onClick={() => setActiveTab('services')} className="mt-3 text-sm font-bold text-amber-900 underline decoration-amber-900/30 hover:decoration-amber-900">View Items</button>
                                </div>
                            </div>
                        )}

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Briefcase size={20} /></div>
                                    <span className="text-xs font-bold text-slate-400 uppercase">Ongoing</span>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800">{activeServicesCount}</h3>
                                <p className="text-sm text-slate-500">Active Services</p>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><FileText size={20} /></div>
                                    <span className="text-xs font-bold text-slate-400 uppercase">Vault</span>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800">{myDocuments.length}</h3>
                                <p className="text-sm text-slate-500">Documents Stored</p>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-green-50 text-green-600 rounded-lg"><CreditCard size={20} /></div>
                                    <span className="text-xs font-bold text-slate-400 uppercase">Outstanding</span>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800">₹{unpaidAmount.toLocaleString()}</h3>
                                <p className="text-sm text-slate-500">To Pay</p>
                            </div>
                        </div>

                        {/* Account Manager and Support Options */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Account Manager Card */}
                            <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                        <Headphones size={14} className="text-indigo-600" />
                                        Your Dedicated Partner
                                    </h3>
                                </div>
                                <div className="p-6 flex flex-col items-center text-center flex-1">
                                    <div className="relative mb-4">
                                        <img
                                            src="https://picsum.photos/80/80?random=10"
                                            alt="Account Manager"
                                            className="w-20 h-20 rounded-2xl object-cover ring-4 ring-slate-50 shadow-sm"
                                        />
                                        <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white shadow-sm"></div>
                                    </div>
                                    <h4 className="text-lg font-black text-slate-800 tracking-tight">Suresh K</h4>
                                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4">Senior Partner • {client.branch}</p>

                                    <div className="w-full space-y-2 mb-6">
                                        <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-100">
                                            <Mail size={14} className="text-slate-400 shrink-0" />
                                            <span className="truncate">suresh.k@avr.com</span>
                                        </div>
                                        <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-100">
                                            <PhoneCall size={14} className="text-slate-400 shrink-0" />
                                            <span>+91 98XXX XXXXX</span>
                                        </div>
                                    </div>

                                    <button className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-lg">
                                        Book Consultation
                                    </button>
                                </div>
                            </div>

                            {/* Support Quick Actions */}
                            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                        <LifeBuoy size={14} className="text-indigo-600" />
                                        Support & Assistance
                                    </h3>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Response: 2h</span>
                                </div>
                                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
                                    <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-start gap-4 group cursor-pointer hover:bg-white hover:shadow-lg transition-all">
                                        <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            <MessageSquare size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-slate-800 mb-1">Live Chat</h4>
                                            <p className="text-xs text-slate-500 leading-relaxed">Instant messaging with our compliance team.</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-start gap-4 group cursor-pointer hover:bg-white hover:shadow-lg transition-all">
                                        <div className="p-3 bg-white rounded-xl shadow-sm text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                            <Plus size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-slate-800 mb-1">Raise Ticket</h4>
                                            <p className="text-xs text-slate-500 leading-relaxed">Submit a formal inquiry or issue report.</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-start gap-4 group cursor-pointer hover:bg-white hover:shadow-lg transition-all">
                                        <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            <Search size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-slate-800 mb-1">Knowledge Base</h4>
                                            <p className="text-xs text-slate-500 leading-relaxed">Guides on tax laws and using the portal.</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-white hover:shadow-lg transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-white rounded-xl shadow-sm text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                                <ExternalLink size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-800">Compliance News</h4>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-800 transition-colors" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Timeline */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-6">Recent Activity</h3>
                            <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                                {myTasks.slice(0, 3).map((task, idx) => (
                                    <div key={idx} className="relative flex gap-4">
                                        <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center border-4 border-white shadow-sm z-10 ${task.status === TaskStatus.COMPLETED ? 'bg-green-100 text-green-600' :
                                            task.status === TaskStatus.NEW ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {task.status === TaskStatus.COMPLETED ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">{task.serviceType} <span className="font-normal text-slate-500">for {task.period}</span></p>
                                            <p className="text-xs text-slate-500 mt-0.5">Status updated to <span className="font-medium text-slate-700">{task.status}</span></p>
                                            <p className="text-[10px] text-slate-400 mt-1">Due Date: {task.dueDate}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'services':
                return (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800">Track Services</h2>
                            <button className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-indigo-700">Request New Service</button>
                        </div>

                        <div className="grid gap-4">
                            {myTasks.map(task => (
                                <div key={task.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-lg text-slate-800">{task.serviceType}</h3>
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium border border-slate-200">{task.period}</span>
                                            </div>
                                            <p className="text-xs text-slate-500">Task ID: {task.id}</p>
                                        </div>
                                        <StatusBadge status={task.status} />
                                    </div>

                                    {/* Progress Bar Visual */}
                                    <div className="relative mb-6">
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${task.status === TaskStatus.OVERDUE ? 'bg-red-500' : 'bg-indigo-600'}`}
                                                style={{ width: `${task.slaProgress}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-medium text-slate-400 mt-2 uppercase tracking-wide">
                                            <span>Start</span>
                                            <span>Processing</span>
                                            <span>Review</span>
                                            <span>Filed</span>
                                        </div>
                                    </div>

                                    {/* Action Area */}
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <User size={14} /> Assigned to: <span className="font-medium text-slate-700">{task.assignedTo}</span>
                                        </div>

                                        {task.status === TaskStatus.REVIEW && (
                                            <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-700 flex items-center gap-2 animate-pulse">
                                                <CheckCircle2 size={16} /> Approve Draft
                                            </button>
                                        )}
                                        {task.status === TaskStatus.PENDING_CLIENT && (
                                            <button
                                                onClick={() => setActiveTab('documents')}
                                                className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-amber-600 flex items-center gap-2"
                                            >
                                                <Upload size={16} /> Upload Docs
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'documents':
                return (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800">My Documents</h2>
                            <div className="flex gap-2">
                                <div className="relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="text" placeholder="Search files..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                            </div>
                        </div>

                        {/* Upload Zone */}
                        <div className="border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50/50 p-8 text-center hover:bg-indigo-50 transition-colors cursor-pointer group">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform">
                                <Upload size={24} className="text-indigo-600" />
                            </div>
                            <h4 className="font-bold text-indigo-900">Upload New Document</h4>
                            <p className="text-sm text-indigo-600/70 mt-1">Drag and drop files here, or click to browse</p>
                            <p className="text-xs text-slate-400 mt-4">Supported formats: PDF, JPG, PNG, XLSX (Max 10MB)</p>
                        </div>

                        {/* Document List */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4">Document Name</th>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4">Uploaded</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {myDocuments.map(doc => (
                                        <tr key={doc.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-slate-100 rounded text-slate-500"><File size={16} /></div>
                                                    <span className="font-medium text-slate-800">{doc.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 uppercase text-xs font-bold tracking-wider">{doc.type}</td>
                                            <td className="px-6 py-4 text-slate-500">{doc.uploadDate}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${doc.status === 'Verified' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                                                    }`}>
                                                    {doc.status === 'Verified' && <CheckCircle2 size={10} />}
                                                    {doc.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-indigo-600 hover:text-indigo-800 font-medium text-xs flex items-center gap-1 ml-auto">
                                                    <Download size={14} /> Download
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {myDocuments.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No documents uploaded yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );

            case 'billing':
                return (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <p className="text-slate-500 text-sm font-medium mb-1">Total Outstanding</p>
                                <h3 className="text-3xl font-bold text-slate-800">₹{unpaidAmount.toLocaleString()}</h3>
                            </div>
                            <div className="flex-1 bg-indigo-600 p-6 rounded-xl text-white shadow-md">
                                <p className="text-indigo-200 text-sm font-medium mb-1">Payment Method</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="w-10 h-6 bg-white/20 rounded"></div>
                                    <p className="font-mono">**** 4242</p>
                                </div>
                                <button className="mt-4 text-xs bg-white text-indigo-600 px-3 py-1.5 rounded font-bold hover:bg-indigo-50">Update Method</button>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-200 bg-slate-50">
                                <h3 className="font-bold text-slate-800">Invoice History</h3>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {myInvoices.map(inv => (
                                    <div key={inv.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-full ${inv.status === 'Paid' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{inv.id}</p>
                                                <p className="text-xs text-slate-500">{inv.date} • {inv.items.length} items</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="font-bold text-slate-800">₹{inv.amount.toLocaleString()}</p>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${inv.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {inv.status}
                                                </span>
                                            </div>
                                            {inv.status !== 'Paid' && (
                                                <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-700">
                                                    Pay Now
                                                </button>
                                            )}
                                            {inv.status === 'Paid' && (
                                                <button className="text-slate-400 hover:text-indigo-600">
                                                    <Download size={20} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'profile':
                return (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-800">Company Profile</h2>
                            <button className="text-indigo-600 text-sm font-bold hover:underline">Edit Details</button>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Entity Name</label>
                                    <p className="font-medium text-slate-800 text-lg">{client.name}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Trade Name</label>
                                    <p className="font-medium text-slate-800">{client.tradeName || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Constitution</label>
                                    <p className="font-medium text-slate-800">{client.type}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">PAN Number</label>
                                    <p className="font-mono font-medium text-slate-800">{client.pan}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">GSTIN</label>
                                    <p className="font-mono font-medium text-slate-800">{client.gstin || 'Not Registered'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Contact Email</label>
                                    <p className="font-medium text-slate-800">{client.email}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-6 border-t border-slate-200">
                            <h4 className="font-bold text-slate-800 mb-4">Bank Account Details</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="text-slate-500 block mb-1">Bank Name</span>
                                    <span className="font-medium">{client.bankName || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block mb-1">Account Number</span>
                                    <span className="font-mono font-medium">{client.bankAccountNo || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block mb-1">IFSC Code</span>
                                    <span className="font-mono font-medium">{client.ifscCode || '-'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={toggleSidebar}></div>
            )}

            {/* Sidebar */}
            <aside className={`fixed md:static inset-y-0 left-0 z-30 w-64 bg-indigo-900 text-white transform transition-transform duration-200 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col shadow-xl`}>
                <div className="h-16 flex items-center gap-3 px-6 border-b border-indigo-800">
                    <div className="p-1.5 bg-white rounded-lg text-indigo-900">
                        <Briefcase size={20} />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg tracking-tight">Client Portal</h1>
                        <p className="text-indigo-300 text-[10px] uppercase tracking-wider">AVR Associates</p>
                    </div>
                </div>

                <nav className="flex-1 py-6 px-3 space-y-1">
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id
                                ? 'bg-indigo-800 text-white shadow-lg'
                                : 'text-indigo-200 hover:text-white hover:bg-indigo-800/50'
                                }`}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-indigo-800">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center font-bold text-sm">
                            {client.name.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">{client.name}</p>
                            <p className="text-xs text-indigo-300 truncate">{client.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-800 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
                    >
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={toggleSidebar} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                            <Menu size={20} />
                        </button>
                        <h2 className="text-lg font-bold text-slate-800 md:hidden">AVR Portal</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors relative">
                            <Bell size={20} />
                            {pendingActions > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>}
                        </button>
                    </div>
                </header>

                {/* Content Body */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <div className="max-w-5xl mx-auto pb-20">
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ClientPortal;

import React, { useState } from 'react';
import { BranchName } from '../types';
import { 
    BarChart3, FileText, Download, Eye, ChevronDown, 
    TrendingUp, FileCheck, AlertCircle, Calendar, 
    PieChart, ArrowRight, Filter, Search 
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    AreaChart, Area 
} from 'recharts';

interface ReportsAnalyticsProps {
    selectedBranch: BranchName;
}

const ReportsAnalytics: React.FC<ReportsAnalyticsProps> = ({ selectedBranch }) => {
    // Form States
    const [activeTab, setActiveTab] = useState<'GST' | 'TDS' | 'IT'>('GST');
    const [gstForm, setGstForm] = useState({ type: '', period: '', status: '' });
    const [tdsForm, setTdsForm] = useState({ period: '', status: '' });
    const [itForm, setItForm] = useState({ year: '', status: '' });

    // Mock Preview Data State
    const [showPreview, setShowPreview] = useState(false);

    // Mock Chart Data
    const activityData = [
        { name: 'Mon', reports: 12 },
        { name: 'Tue', reports: 19 },
        { name: 'Wed', reports: 15 },
        { name: 'Thu', reports: 22 },
        { name: 'Fri', reports: 28 },
        { name: 'Sat', reports: 10 },
    ];

    const handleGenerate = () => {
        setShowPreview(true);
    };

    const mockPreviewData = [
        { id: 1, client: 'Sri Venkateswara Traders', type: activeTab === 'GST' ? 'GSTR-1' : activeTab === 'TDS' ? '26Q' : 'ITR-1', period: 'May 2024', status: 'Generated', date: '2024-06-12' },
        { id: 2, client: 'Krishna & Co', type: activeTab === 'GST' ? 'GSTR-3B' : activeTab === 'TDS' ? '24Q' : 'ITR-4', period: 'May 2024', status: 'Pending', date: '2024-06-12' },
        { id: 3, client: 'Ravi Kumar', type: activeTab === 'GST' ? 'GSTR-1' : activeTab === 'TDS' ? '26Q' : 'ITR-1', period: 'May 2024', status: 'Generated', date: '2024-06-11' },
    ];

    return (
        <div className="p-6 h-full overflow-y-auto bg-slate-50 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Reports & Analytics</h1>
                    <p className="text-slate-500 text-sm mt-1">Generate compliance reports and view branch performance.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 shadow-sm flex items-center gap-2">
                        <Filter size={12} /> {selectedBranch}
                    </span>
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-2">
                        <Download size={16} /> Export All
                    </button>
                </div>
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1 */}
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform scale-150">
                        <FileText size={120} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <FileCheck size={24} />
                            </div>
                            <span className="bg-white/20 px-2 py-1 rounded text-xs font-medium">+12%</span>
                        </div>
                        <h3 className="text-3xl font-bold mb-1">1,228</h3>
                        <p className="text-indigo-100 text-sm font-medium opacity-90">Total Reports Generated</p>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <TrendingUp size={24} />
                        </div>
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs font-medium">+5.4%</span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-800 mb-1">15,852</h3>
                    <p className="text-slate-500 text-sm font-medium">Incoming Documents</p>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
                </div>

                {/* Card 3 */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                            <AlertCircle size={24} />
                        </div>
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">Pending</span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-800 mb-1">412</h3>
                    <p className="text-slate-500 text-sm font-medium">Reports Pending Review</p>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500"></div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Report Generator */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Report Generator</h2>
                                <p className="text-slate-500 text-sm">Select a category to customize and download reports.</p>
                            </div>
                            
                            {/* Tabs */}
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                {['GST', 'TDS', 'IT'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => { setActiveTab(tab as any); setShowPreview(false); }}
                                        className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                                            activeTab === tab 
                                            ? 'bg-white text-indigo-600 shadow-sm' 
                                            : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        {tab === 'IT' ? 'Income Tax' : tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                {activeTab === 'GST' && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-700 uppercase">GST Type</label>
                                            <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none">
                                                <option>GSTR-1</option>
                                                <option>GSTR-3B</option>
                                                <option>GSTR-9</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-700 uppercase">Period</label>
                                            <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none">
                                                <option>May 2024</option>
                                                <option>April 2024</option>
                                                <option>Q1 2024</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                                {activeTab === 'TDS' && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-700 uppercase">Form Type</label>
                                            <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none">
                                                <option>24Q (Salary)</option>
                                                <option>26Q (Non-Salary)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-700 uppercase">Quarter</label>
                                            <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none">
                                                <option>Q1 (Apr-Jun)</option>
                                                <option>Q2 (Jul-Sep)</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                                {activeTab === 'IT' && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-700 uppercase">Assessment Year</label>
                                            <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none">
                                                <option>2024-2025</option>
                                                <option>2023-2024</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-700 uppercase">Filing Status</label>
                                            <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none">
                                                <option>All</option>
                                                <option>Filed</option>
                                                <option>Pending</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase">Filing Status</label>
                                    <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none">
                                        <option>All Records</option>
                                        <option>Filed Only</option>
                                        <option>Pending Only</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end border-t border-slate-100 pt-4">
                                <button 
                                    onClick={handleGenerate}
                                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all flex items-center gap-2"
                                >
                                    <FileText size={18} /> Generate Preview
                                </button>
                            </div>
                        </div>

                        {/* Preview Table Section */}
                        {showPreview && (
                            <div className="border-t border-slate-100 bg-slate-50/50 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="p-4 bg-slate-100/50 border-b border-slate-200 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-700 text-sm">Preview Results ({mockPreviewData.length})</h3>
                                    <div className="flex gap-2">
                                        <button className="p-2 hover:bg-white rounded-md text-slate-500 transition-colors"><Download size={16} /></button>
                                        <button className="p-2 hover:bg-white rounded-md text-slate-500 transition-colors"><Eye size={16} /></button>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-slate-600">
                                        <thead className="bg-slate-50 text-slate-700 font-semibold">
                                            <tr>
                                                <th className="px-6 py-3">Client Name</th>
                                                <th className="px-6 py-3">Report Type</th>
                                                <th className="px-6 py-3">Period</th>
                                                <th className="px-6 py-3">Status</th>
                                                <th className="px-6 py-3">Generated</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 bg-white">
                                            {mockPreviewData.map((row) => (
                                                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-3 font-medium text-slate-800">{row.client}</td>
                                                    <td className="px-6 py-3">{row.type}</td>
                                                    <td className="px-6 py-3">{row.period}</td>
                                                    <td className="px-6 py-3">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${row.status === 'Generated' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                                            {row.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-slate-500">{row.date}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Analytics Charts */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <BarChart3 size={20} className="text-indigo-500" /> Activity Volume
                        </h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={activityData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                                    <Tooltip 
                                        cursor={{fill: '#f8fafc'}}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="reports" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-indigo-900 rounded-2xl p-6 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="font-bold text-lg mb-2">Need a Custom Report?</h3>
                            <p className="text-indigo-200 text-sm mb-6">Our automated system can handle complex queries. Ask for a specific audit trail.</p>
                            <button className="w-full bg-white text-indigo-900 py-3 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors">
                                Request Custom Data
                            </button>
                        </div>
                        <div className="absolute top-[-20%] right-[-20%] w-48 h-48 bg-indigo-500 rounded-full blur-3xl opacity-50"></div>
                    </div>
                </div>
            </div>
            
            <div className="pt-8 text-center text-xs text-slate-400">
                Data updated in real-time. © 2024 AVR Associates ERP.
            </div>
        </div>
    );
};

export default ReportsAnalytics;
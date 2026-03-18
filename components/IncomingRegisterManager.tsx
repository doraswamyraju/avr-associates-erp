import React, { useState, useEffect } from 'react';
import { api } from '../src/services/api';
import { BranchName, IncomingRegisterEntry, Client, Staff } from '../types';
import { Search, Plus, MapPin, Eye, Edit, Trash2, ArrowLeft, Save, AlertCircle } from 'lucide-react';

interface IncomingRegisterManagerProps {
    selectedBranch: BranchName;
    quickAction?: string | null;
    onQuickActionHandled?: () => void;
}

const IncomingRegisterManager: React.FC<IncomingRegisterManagerProps> = ({ selectedBranch, quickAction, onQuickActionHandled }) => {
    const [viewMode, setViewMode] = useState<'list' | 'add'>('list');
    const [registers, setRegisters] = useState<IncomingRegisterEntry[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (quickAction === 'NEW_INCOMING') {
            setViewMode('add');
            if (onQuickActionHandled) onQuickActionHandled();
        }
    }, [quickAction, onQuickActionHandled]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [regData, clientsData, staffData] = await Promise.all([
                api.getIncomingRegister(),
                api.getClients(),
                api.getStaff()
            ]);
            setRegisters(regData);
            setClients(clientsData);
            setStaff(staffData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredRegisters = registers.filter(reg => {
        const matchesBranch = selectedBranch === BranchName.ALL || reg.branch === selectedBranch;
        const matchesSearch = 
            (reg.referenceCode?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
            (reg.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || '');
        return matchesBranch && matchesSearch;
    });

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden relative">
            {viewMode === 'list' ? (
                <IncomingRegisterList 
                    registers={filteredRegisters} 
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    selectedBranch={selectedBranch}
                    onAddNew={() => setViewMode('add')} 
                    isLoading={isLoading}
                />
            ) : (
                <IncomingRegisterForm 
                    onCancel={() => setViewMode('list')} 
                    onSuccess={() => { setViewMode('list'); fetchData(); }}
                    clients={clients}
                    staff={staff}
                    selectedBranch={selectedBranch === BranchName.ALL ? 'Ravulapalem' as BranchName : selectedBranch}
                />
            )}
        </div>
    );
};

const IncomingRegisterList: React.FC<{
    registers: IncomingRegisterEntry[],
    searchTerm: string,
    setSearchTerm: (t: string) => void,
    selectedBranch: BranchName,
    onAddNew: () => void,
    isLoading: boolean
}> = ({ registers, searchTerm, setSearchTerm, selectedBranch, onAddNew, isLoading }) => {
    
    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="p-6 bg-white border-b border-slate-200 shrink-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Incoming Register</h2>
                        <p className="text-slate-500 text-sm font-medium">Track all incoming documents, bills, and communications.</p>
                    </div>
                    <button onClick={onAddNew} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-95">
                        <Plus size={18} strokeWidth={3} /> Add Incoming
                    </button>
                </div>
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search by reference code or customer name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm" />
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100 text-[10px] font-black uppercase tracking-[0.15em]"><MapPin size={14} />Branch: {selectedBranch}</div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 relative">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-20">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Ref Code</th>
                                <th className="px-6 py-4">Customer Name</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Options</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-medium">Loading register data...</td></tr>
                            ) : registers.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-medium">No records found.</td></tr>
                            ) : registers.map(reg => (
                                <tr key={reg.id} className="hover:bg-indigo-50/30 transition-colors group">
                                    <td className="px-6 py-5 font-bold text-slate-700">{reg.referenceCode || reg.id}</td>
                                    <td className="px-6 py-5 font-medium text-slate-800">{reg.customerName || '-'}</td>
                                    <td className="px-6 py-5 text-slate-500">{reg.date}</td>
                                    <td className="px-6 py-5">
                                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${
                                            reg.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                            reg.status === 'Work In Progress' ? 'bg-blue-100 text-blue-700' :
                                            reg.status === 'Data Pending' ? 'bg-amber-100 text-amber-700' :
                                            'bg-slate-100 text-slate-600'
                                        }`}>{reg.status}</span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors" title="View"><Eye size={16} strokeWidth={2.5} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const IncomingRegisterForm: React.FC<{
    onCancel: () => void,
    onSuccess: () => void,
    clients: Client[],
    staff: Staff[],
    selectedBranch: BranchName
}> = ({ onCancel, onSuccess, clients, staff, selectedBranch }) => {
    const [formData, setFormData] = useState<Partial<IncomingRegisterEntry>>({
        referenceCode: '',
        customerName: '',
        serviceName: '',
        date: new Date().toISOString().split('T')[0],
        assessmentYear: '',
        period1: '',
        period2: '',
        dueDate: '',
        completedDate: '',
        staffName: '',
        incomingDocuments: '',
        verifiedBy: '',
        verifiedStatus: '',
        arnRefNo: '',
        billNo: '',
        billAmount: undefined,
        modeOfPayment: '',
        paymentInfo: '',
        billStatus: '',
        purposeNarration: '',
        status: 'Data Received',
        remarks: '',
        branch: selectedBranch
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await api.createIncomingRegister(formData as Omit<IncomingRegisterEntry, 'id'>);
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to save incoming register');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="flex flex-col h-full bg-white relative">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 sticky top-0 bg-white/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onCancel} className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
                        <ArrowLeft size={18} strokeWidth={2.5} />
                    </button>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Add New Incoming Register</h2>
                        <div className="text-xs font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest mt-1">
                            <span>Home</span> <span className="text-slate-300">&gt;</span> <span>Incoming Register</span>
                        </div>
                    </div>
                </div>
                <button onClick={handleSubmit} disabled={isLoading} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50">
                    <Save size={16} strokeWidth={3} /> {isLoading ? 'Saving...' : 'Submit'}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-3xl mx-auto space-y-6 pb-20">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold flex items-center gap-2 border border-red-100 shadow-sm animate-in fade-in duration-300">
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                        <div className="p-6 bg-slate-50 border-b border-slate-200">
                            <h3 className="font-bold text-slate-700 uppercase tracking-widest text-xs">Add New Incoming Register Details</h3>
                        </div>
                        <div className="p-8 space-y-6">
                            
                            <div className="space-y-4">
                                <FormInput label="Reference Code" name="referenceCode" value={formData.referenceCode} onChange={handleChange} placeholder="Reference Code" />
                                
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Customer Name</label>
                                    <select name="customerName" value={formData.customerName} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none">
                                        <option value="">Please select customer</option>
                                        {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Service Name</label>
                                    <select name="serviceName" value={formData.serviceName} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none">
                                        <option value="">Please select Service</option>
                                        <option value="GST Registration">GST Registration</option>
                                        <option value="GST Filing">GST Filing</option>
                                        <option value="Income Tax Return">Income Tax Return</option>
                                        <option value="TDS Filing">TDS Filing</option>
                                        <option value="Company Incorporation">Company Incorporation</option>
                                        <option value="Accounting">Accounting</option>
                                    </select>
                                </div>

                                <FormInput label="Date" name="date" type="date" value={formData.date} onChange={handleChange} />
                                <FormInput label="Assessment Year" name="assessmentYear" value={formData.assessmentYear} onChange={handleChange} placeholder="Enter Assessment Year" />
                                
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Period (Range)</label>
                                    <select name="period1" value={formData.period1} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none">
                                        <option value="">Select Period Range...</option>
                                        <option value="JAN to MAR">JAN to MAR</option>
                                        <option value="APR to JUN">APR to JUN</option>
                                        <option value="JUL to SEP">JUL to SEP</option>
                                        <option value="OCT to DEC">OCT to DEC</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Period (Specific)</label>
                                    <select name="period2" value={formData.period2} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none">
                                        <option value="">Select Period...</option>
                                        <option value="JAN">JAN</option>
                                        <option value="FEB">FEB</option>
                                        <option value="MAR">MAR</option>
                                        <option value="APR">APR</option>
                                        <option value="MAY">MAY</option>
                                        <option value="JUN">JUN</option>
                                        <option value="JUL">JUL</option>
                                        <option value="AUG">AUG</option>
                                        <option value="SEP">SEP</option>
                                        <option value="OCT">OCT</option>
                                        <option value="NOV">NOV</option>
                                        <option value="DEC">DEC</option>
                                    </select>
                                </div>

                                <FormInput label="Due Date" name="dueDate" type="date" value={formData.dueDate} onChange={handleChange} />
                                <FormInput label="Completed Date" name="completedDate" type="date" value={formData.completedDate} onChange={handleChange} />
                                
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Staff Name</label>
                                    <select name="staffName" value={formData.staffName} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none">
                                        <option value="">Please select staff</option>
                                        {staff.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Incoming Documents</label>
                                    <textarea name="incomingDocuments" value={formData.incomingDocuments} onChange={handleChange} placeholder="Enter Documents" rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-y"></textarea>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Verified By</label>
                                    <select name="verifiedBy" value={formData.verifiedBy} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none">
                                        <option value="">Please select member</option>
                                        {staff.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Verified Status</label>
                                    <select name="verifiedStatus" value={formData.verifiedStatus} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none">
                                        <option value="">Please Choose Verified Status</option>
                                        <option value="Verified">Verified</option>
                                        <option value="Not Verified">Not Verified</option>
                                        <option value="Pending">Pending</option>
                                    </select>
                                </div>

                                <FormInput label="ARN/Ref No" name="arnRefNo" value={formData.arnRefNo} onChange={handleChange} placeholder="Enter Ref no" />
                                <FormInput label="Bill No" name="billNo" value={formData.billNo} onChange={handleChange} placeholder="Enter Bill no" />
                                <FormInput label="Bill Amount" name="billAmount" type="number" value={formData.billAmount || ''} onChange={handleChange} placeholder="Enter Bill Amount" />
                                
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Mode of Payment</label>
                                    <select name="modeOfPayment" value={formData.modeOfPayment} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none">
                                        <option value="">Please Select Payment Mode</option>
                                        <option value="None">None</option>
                                        <option value="Cash">Cash</option>
                                        <option value="PhonePay">PhonePay</option>
                                        <option value="GPay">GPay</option>
                                        <option value="Multi Payment">Multi Payment</option>
                                    </select>
                                </div>

                                <FormInput label="Payment Info" name="paymentInfo" value={formData.paymentInfo} onChange={handleChange} placeholder="Enter Payment info" />

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Bill Status</label>
                                    <select name="billStatus" value={formData.billStatus} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none">
                                        <option value="">Please Select Paid status</option>
                                        <option value="Paid">Paid</option>
                                        <option value="Unpaid">Unpaid</option>
                                        <option value="Partial">Partial</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Purpose / Narration</label>
                                    <input type="text" name="purposeNarration" value={formData.purposeNarration} onChange={handleChange} placeholder="Enter Purpose" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Status</label>
                                    <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none">
                                        <option value="">Please Select Status</option>
                                        <option value="Data Received">Data Received</option>
                                        <option value="Work In Progress">Work In Progress</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Data Pending">Data Pending</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Remarks</label>
                                    <textarea name="remarks" value={formData.remarks} onChange={handleChange} placeholder="Enter remarks" rows={4} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-y"></textarea>
                                </div>
                                
                                <button type="button" onClick={handleSubmit} disabled={isLoading} className="mt-4 px-8 py-3 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
                                    {isLoading ? 'Submitting...' : 'Submit'}
                                </button>
                                
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FormInput = ({ label, name, value, onChange, placeholder = '', type = 'text' }: any) => (
    <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">{label}</label>
        <input 
            type={type} 
            name={name} 
            value={value || ''} 
            onChange={onChange} 
            placeholder={placeholder}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none" 
        />
    </div>
);

export default IncomingRegisterManager;

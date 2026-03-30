import React, { useState, useEffect } from 'react';
import { api } from '../src/services/api';
import { BranchName, IncomingRegisterEntry, Client, Staff } from '../types';
import { Search, Plus, MapPin, Eye, Edit, Trash2, ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { ExcelImporter } from './ExcelImporter';

interface IncomingRegisterManagerProps {
    selectedBranch: BranchName;
    quickAction?: string | null;
    onQuickActionHandled?: () => void;
    preSelectedClient?: string;
}

const IncomingRegisterManager: React.FC<IncomingRegisterManagerProps> = ({ selectedBranch, quickAction, onQuickActionHandled, preSelectedClient }) => {
    const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');
    const [editingRegister, setEditingRegister] = useState<IncomingRegisterEntry | null>(null);
    const [registers, setRegisters] = useState<IncomingRegisterEntry[]>([]);
    const [totalRegisters, setTotalRegisters] = useState(0);
    const [stats, setStats] = useState({ dataReceived: 0, wip: 0, completed: 0 });
    const [clients, setClients] = useState<Client[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const prevFilters = React.useRef({ debouncedSearch, selectedBranch, limit });

    useEffect(() => {
        let isAborted = false;

        const filtersChanged =
            prevFilters.current.debouncedSearch !== debouncedSearch ||
            prevFilters.current.selectedBranch !== selectedBranch ||
            prevFilters.current.limit !== limit;

        prevFilters.current = { debouncedSearch, selectedBranch, limit };

        const currentPage = filtersChanged ? 1 : page;
        if (filtersChanged) setPage(1);

        const load = async () => {
            setIsLoading(true);
            try {
                const offset = (currentPage - 1) * limit;
                const [regResponse, statsData] = await Promise.all([
                    api.getIncomingRegister(limit, offset, debouncedSearch, selectedBranch),
                    api.getIncomingRegisterStats(selectedBranch)
                ]);

                if (isAborted) return;

                if (filtersChanged || currentPage === 1) {
                    setRegisters(regResponse.data || []);
                } else {
                    setRegisters(prev => [...prev, ...(regResponse.data || [])]);
                }

                setTotalRegisters(regResponse.total || 0);
                setStats({
                    dataReceived: statsData['Data Received'] || 0,
                    wip: statsData['Work In Progress'] || 0,
                    completed: statsData['Completed'] || 0
                });
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                if (!isAborted) setIsLoading(false);
            }
        };

        load();
        return () => { isAborted = true; };
    }, [page, limit, debouncedSearch, selectedBranch, refreshKey]);

    useEffect(() => { fetchDropdownData(); }, []);

    useEffect(() => {
        if (quickAction === 'NEW_INCOMING') {
            setEditingRegister(null);
            setViewMode('add');
            if (onQuickActionHandled) onQuickActionHandled();
        }
    }, [quickAction, onQuickActionHandled]);

    const fetchDropdownData = async () => {
        try {
            const [clientsData, staffData] = await Promise.all([api.getClients(), api.getStaff()]);
            setClients(clientsData);
            setStaff(staffData);
        } catch (error) {
            console.error('Failed to fetch dropdowns:', error);
        }
    };

    const fetchData = async () => {
        setRefreshKey(prev => prev + 1);
    };

    const handleImportRegisters = async (data: any[]) => {
        let successCount = 0;
        for (const row of data) {
            try {
                // Map columns to IncomingRegisterEntry
                const entryData: Partial<IncomingRegisterEntry> = {
                    referenceCode: row['Reference Code'] || row['referenceCode'] || row['Ref.Code'] || '',
                    customerName: row['Customer Name'] || row['customerName'] || row['Client Name'] || '',
                    serviceName: row['Service Name'] || row['serviceName'] || '',
                    date: row['Date'] || row['date'] || row['Entery Date'] || row['Entry Date'] || new Date().toISOString().split('T')[0],
                    assessmentYear: row['Assessment Year'] || row['assessmentYear'] || '',
                    period1: row['Period'] || row['Period 1'] || row['period1'] || '',
                    period2: row['Period 2'] || row['period2'] || '',
                    dueDate: row['Due Date'] || row['dueDate'] || '',
                    completedDate: row['Completed Date'] || row['completedDate'] || '',
                    staffName: row['Staff Name'] || row['staffName'] || '',
                    incomingDocuments: row['Incoming Documents'] || row['incomingDocuments'] || row['Documents'] || '',
                    verifiedBy: row['Verified By'] || row['verifiedBy'] || '',
                    verifiedStatus: row['Verified Status'] || row['verifiedStatus'] || '',
                    arnRefNo: row['Reference No'] || row['ARN Ref No'] || row['arnRefNo'] || '',
                    billNo: row['Bill No'] || row['billNo'] || '',
                    billAmount: row['Bill Amount'] || row['billAmount'] || row['Bill Amt'] || undefined,
                    modeOfPayment: row['Mode Of Payment'] || row['modeOfPayment'] || '',
                    paymentInfo: row['Payment Info'] || row['paymentInfo'] || '',
                    billStatus: row['Bill Status'] || row['billStatus'] || '',
                    purposeNarration: row['Purpose Narration'] || row['purposeNarration'] || '',
                    status: row['Status'] || row['status'] || 'Data Received',
                    remarks: row['Remarks'] || row['remarks'] || '',
                    branch: (row['Branch'] || row['branch'] || selectedBranch) as BranchName,
                };
                
                // If the customer doesn't exist, we could create them automatically, 
                // but let's just use the name for the register entry.
                if (entryData.customerName) {
                    await api.createIncomingRegister(entryData as Omit<IncomingRegisterEntry, 'id'>);
                    successCount++;
                }

                // If customer data is somewhat provided but client does not exist
                const clientExists = clients.find(c => c.name?.toLowerCase() === entryData.customerName?.toLowerCase());
                if (!clientExists && entryData.customerName) {
                    const newClientData = {
                        name: entryData.customerName,
                        phone: row['Mobile Number'] || row['phone'] || row['Phone'] || '', 
                        branch: entryData.branch || selectedBranch,
                        type: 'Individual' as const,
                        status: 'Active' as const,
                        email: '',
                        pan: ''
                    };
                    const newClient = await api.createClient(newClientData as any);
                    
                    if (newClient) {
                        clients.push({
                            ...newClientData,
                            id: newClient.id || `temp-${Date.now()}`
                        } as Client);
                    }
                }
            } catch (err) {
                console.error("Failed to import register row", row, err);
            }
        }
        await fetchData();
        alert(`Successfully imported ${successCount} incoming register records!`);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this entry?')) return;
        try {
            await api.deleteIncomingRegister(id);
            setRegisters(prev => prev.filter(r => r.id !== id));
            setTotalRegisters(prev => prev - 1);
        } catch (err) {
            alert('Failed to delete entry.');
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden relative">
            {viewMode === 'list' ? (
                <IncomingRegisterList 
                    registers={registers} 
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    selectedBranch={selectedBranch}
                    onAddNew={() => { setEditingRegister(null); setViewMode('add'); }} 
                    isLoading={isLoading}
                    onImport={handleImportRegisters}
                    totalRegisters={totalRegisters}
                    page={page}
                    setPage={setPage}
                    limit={limit}
                    stats={stats}
                    onEdit={(reg) => { setEditingRegister(reg); setViewMode('edit'); }}
                    onDelete={handleDelete}
                />
            ) : (
                <IncomingRegisterForm 
                    onCancel={() => setViewMode('list')} 
                    onSuccess={() => { setViewMode('list'); setPage(1); fetchData(); }}
                    clients={clients}
                    staff={staff}
                    selectedBranch={selectedBranch === BranchName.ALL ? 'Ravulapalem' as BranchName : selectedBranch}
                    onClientAdded={(newClient) => setClients(prev => [...prev, newClient])}
                    initialData={editingRegister || undefined}
                    preSelectedClientName={preSelectedClient}
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
    isLoading: boolean,
    onImport: (data: any[]) => Promise<void>,
    totalRegisters: number,
    page: number,
    setPage: React.Dispatch<React.SetStateAction<number>>,
    limit: number,
    stats: { dataReceived: number, wip: number, completed: number },
    onEdit: (reg: IncomingRegisterEntry) => void,
    onDelete: (id: string) => void,
}> = ({ registers, searchTerm, setSearchTerm, selectedBranch, onAddNew, isLoading, onImport, totalRegisters, page, setPage, limit, stats, onEdit, onDelete }) => {

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 50) {
            if (!isLoading && registers.length < totalRegisters) {
                setPage(p => p + 1);
            }
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="p-4 bg-white border-b border-slate-200 shrink-0">
                <div className="flex flex-col gap-4 mb-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-xl font-medium text-slate-700 mr-2">Incoming Register List</h2>
                            <button onClick={onAddNew} className="px-3 py-1.5 bg-sky-500 text-white rounded text-sm shadow-sm hover:bg-sky-600">Add Incoming</button>
                            <button className="px-3 py-1.5 bg-emerald-600 text-white rounded text-sm shadow-sm hover:bg-emerald-700">Paid List</button>
                            <button className="px-3 py-1.5 bg-red-600 text-white rounded text-sm shadow-sm hover:bg-red-700">Unpaid List</button>
                            <button className="px-3 py-1.5 bg-red-500 text-white rounded text-sm shadow-sm hover:bg-red-600">Bad debts</button>
                            <button className="px-3 py-1.5 bg-indigo-900 text-white rounded text-sm shadow-sm hover:bg-indigo-800 uppercase">STAFF WISE LIST</button>
                        </div>
                        <div className="flex gap-2">
                            <ExcelImporter
                                templateName="Incoming Register"
                                requiredColumns={[]}
                                onImport={onImport}
                            />
                            <button className="px-3 py-1.5 bg-orange-400 text-white rounded text-sm shadow-sm hover:bg-orange-500">Print Incoming</button>
                        </div>
                    </div>
                    <div className="text-sm text-slate-700">
                        Data Received <span className="font-bold">{stats.dataReceived}</span> {' | '} 
                        Work in Progress <span className="font-bold">{stats.wip}</span> {' | '} 
                        Completed <span className="font-bold">{stats.completed}</span>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-bold">
                        Showing {registers.length} of {totalRegisters} entries (Auto-loading on scroll)
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative flex items-center">
                            <span className="text-sm text-slate-600 mr-2">Search:</span>
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64 pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-indigo-500 outline-none" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 text-xs font-bold uppercase tracking-wider"><MapPin size={12} />{selectedBranch}</div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto relative bg-white" onScroll={handleScroll}>
                <div className="min-w-max border-b border-slate-200 pb-10">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-white text-slate-700 font-bold border-b border-slate-200">
                            <tr>
                                <th className="px-3 py-3 border-r border-slate-100 whitespace-nowrap">Period</th>
                                <th className="px-3 py-3 border-r border-slate-100 whitespace-nowrap">Ref.Code</th>
                                <th className="px-3 py-3 border-r border-slate-100 whitespace-nowrap">Client Name</th>
                                <th className="px-3 py-3 border-r border-slate-100 whitespace-nowrap">Staff Name</th>
                                <th className="px-3 py-3 border-r border-slate-100 whitespace-nowrap">Documents</th>
                                <th className="px-3 py-3 border-r border-slate-100 whitespace-nowrap">service</th>
                                <th className="px-3 py-3 border-r border-slate-100 whitespace-nowrap">Verified By</th>
                                <th className="px-3 py-3 border-r border-slate-100 whitespace-nowrap">Reference No</th>
                                <th className="px-3 py-3 border-r border-slate-100 whitespace-nowrap">Entry Date</th>
                                <th className="px-3 py-3 border-r border-slate-100 text-red-500 whitespace-nowrap">Due Date</th>
                                <th className="px-3 py-3 border-r border-slate-100 text-red-500 whitespace-nowrap">Completed Date</th>
                                <th className="px-3 py-3 border-r border-slate-100 whitespace-nowrap">Bill status</th>
                                <th className="px-3 py-3 border-r border-slate-100 whitespace-nowrap">Status</th>
                                <th className="px-3 py-3 text-center whitespace-nowrap">OPtions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={14} className="px-6 py-8 text-center text-slate-400 font-medium">Loading register data...</td></tr>
                            ) : registers.length === 0 ? (
                                <tr><td colSpan={14} className="px-6 py-8 text-center text-slate-400 font-medium">No records found.</td></tr>
                            ) : registers.map(reg => (
                                <tr key={reg.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-3 py-3 text-slate-600 border-r border-slate-100 truncate max-w-[120px]" title={reg.period1}>{reg.period1 || '-'}</td>
                                    <td className="px-3 py-3 text-slate-600 border-r border-slate-100">{reg.referenceCode || reg.id}</td>
                                    <td className="px-3 py-3 text-slate-700 border-r border-slate-100 uppercase truncate max-w-[200px]" title={reg.customerName}>{reg.customerName || '-'}</td>
                                    <td className="px-3 py-3 text-slate-600 border-r border-slate-100 truncate max-w-[100px]">{reg.staffName || '-'}</td>
                                    <td className="px-3 py-3 text-slate-600 border-r border-slate-100 uppercase truncate max-w-[200px]" title={reg.incomingDocuments}>{reg.incomingDocuments || '-'}</td>
                                    <td className="px-3 py-3 text-slate-600 border-r border-slate-100 truncate max-w-[150px]">{reg.serviceName || '-'}</td>
                                    <td className="px-3 py-3 text-slate-600 border-r border-slate-100 truncate max-w-[100px]">{reg.verifiedBy || '-'}</td>
                                    <td className="px-3 py-3 text-slate-600 border-r border-slate-100 truncate max-w-[150px]">{reg.arnRefNo || '-'}</td>
                                    <td className="px-3 py-3 text-slate-600 border-r border-slate-100 whitespace-nowrap">{reg.date}</td>
                                    <td className="px-3 py-3 text-red-500 border-r border-slate-100 whitespace-nowrap">{reg.dueDate || '-'}</td>
                                    <td className="px-3 py-3 text-red-500 border-r border-slate-100 whitespace-nowrap">{reg.completedDate || '-'}</td>
                                    <td className="px-3 py-3 border-r border-slate-100">
                                        {reg.billStatus ? (
                                            <span className={`px-2 py-1 text-[10px] font-bold rounded ${
                                                reg.billStatus.toLowerCase() === 'paid' ? 'bg-emerald-500 text-white' :
                                                reg.billStatus.toLowerCase() === 'unpaid' ? 'bg-red-500 text-white' :
                                                'bg-amber-500 text-white'
                                            }`}>{reg.billStatus}</span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-3 py-3 border-r border-slate-100">
                                        <span className={`px-2 py-1 text-[10px] font-bold rounded ${
                                            reg.status === 'Completed' ? 'bg-emerald-500 text-white' :
                                            reg.status === 'Work In Progress' ? 'bg-emerald-500 text-white' :
                                            reg.status === 'Data Pending' ? 'bg-amber-500 text-white' :
                                            'bg-slate-500 text-white'
                                        }`}>{reg.status}</span>
                                    </td>
                                    <td className="px-3 py-3 text-center border-r border-slate-100">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <button onClick={() => onEdit(reg)} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors" title="Edit"><Edit size={14} /></button>
                                            <button onClick={() => onDelete(reg.id)} className="p-1 text-slate-400 hover:text-red-600 transition-colors" title="Delete"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {isLoading && (
                        <div className="w-full py-4 flex items-center justify-center text-slate-400 font-bold text-sm">
                            <div className="animate-spin w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full mr-2"></div>
                            Loading records...
                        </div>
                    )}
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
    selectedBranch: BranchName,
    onClientAdded: (client: Client) => void,
    initialData?: IncomingRegisterEntry,
    preSelectedClientName?: string,
}> = ({ onCancel, onSuccess, clients, staff, selectedBranch, onClientAdded, initialData, preSelectedClientName }) => {
    const isEditing = !!initialData;
    const [formData, setFormData] = useState<Partial<IncomingRegisterEntry>>(initialData ? { ...initialData } : {
        referenceCode: '',
        customerName: preSelectedClientName || '',
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
        branch: selectedBranch,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Quick Add Client State
    const [showAddClientModal, setShowAddClientModal] = useState(false);
    const [newClientName, setNewClientName] = useState('');
    const [newClientPhone, setNewClientPhone] = useState('');
    const [isAddingClient, setIsAddingClient] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            if (isEditing && initialData?.id) {
                await api.updateIncomingRegister(initialData.id, formData);
            } else {
                await api.createIncomingRegister(formData as Omit<IncomingRegisterEntry, 'id'>);
            }
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

    const handleQuickAddClient = async () => {
        if (!newClientName.trim()) return;
        setIsAddingClient(true);
        try {
            const payload = {
                name: newClientName.trim(),
                phone: newClientPhone.trim(),
                branch: selectedBranch,
                type: 'Individual' as const,
                status: 'Active' as const,
                email: ''
            };
            const newClient = await api.createClient(payload as any);
            onClientAdded(newClient);
            setFormData(prev => ({ ...prev, customerName: newClient.name }));
            setShowAddClientModal(false);
            setNewClientName('');
            setNewClientPhone('');
        } catch (err) {
            alert('Failed to add customer. Please try again.');
        } finally {
            setIsAddingClient(false);
        }
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
                                
                                <SearchableCustomerSelect
                                    clients={clients}
                                    value={formData.customerName || ''}
                                    onChange={(name) => setFormData(prev => ({ ...prev, customerName: name }))}
                                    onAddNew={(name) => {
                                        setNewClientName(name);
                                        setShowAddClientModal(true);
                                    }}
                                />
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Service Name</label>
                                    <input 
                                        type="text" 
                                        list="services-list"
                                        name="serviceName" 
                                        value={formData.serviceName} 
                                        onChange={handleChange} 
                                        placeholder="Type or select a service"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none" 
                                    />
                                    <datalist id="services-list">
                                        <option value="GST Registration" />
                                        <option value="GSTR-1 Filing" />
                                        <option value="GSTR-3B Filing" />
                                        <option value="Income Tax Return (ITR-1)" />
                                        <option value="Income Tax Return (ITR-4)" />
                                        <option value="TDS Return" />
                                        <option value="Tax Audit" />
                                        <option value="ROC / Company Law" />
                                        <option value="Accounting & Bookkeeping" />
                                        <option value="Food licence (FSSAI)" />
                                        <option value="MSME Registration" />
                                        <option value="Labour License" />
                                        <option value="Project Report" />
                                        <option value="Projections" />
                                        <option value="PF AND ESI" />
                                        <option value="Other Services" />
                                    </datalist>
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

            {/* Quick Add Client Modal */}
            {showAddClientModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">Quick Add Customer</h3>
                            <button onClick={() => setShowAddClientModal(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors">
                                <Search className="rotate-45" size={16} /> {/* Making an X with Search by rotating or just using a distinct component if X wasn't imported. Actually let's use + rotated */}
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">Customer Name *</label>
                                <input 
                                    type="text" 
                                    value={newClientName} 
                                    onChange={e => setNewClientName(e.target.value)} 
                                    placeholder="Enter full name"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">Phone Number</label>
                                <input 
                                    type="text" 
                                    value={newClientPhone} 
                                    onChange={e => setNewClientPhone(e.target.value)} 
                                    placeholder="Enter phone number"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setShowAddClientModal(false)} className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-200 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleQuickAddClient} disabled={!newClientName.trim() || isAddingClient} className="px-6 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:shadow-none flex items-center gap-2">
                                {isAddingClient ? 'Saving...' : 'Save Customer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const SearchableCustomerSelect = ({ 
    clients, 
    value, 
    onChange, 
    onAddNew 
}: { 
    clients: Client[], 
    value: string, 
    onChange: (name: string) => void, 
    onAddNew: (search: string) => void 
}) => {
    const [search, setSearch] = useState(value || '');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        setSearch(value || '');
    }, [value]);

    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredClients = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).slice(0, 50);

    return (
        <div className="space-y-1.5 relative" ref={wrapperRef}>
            <label className="text-xs font-bold text-slate-700">Customer Name</label>
            <input 
                type="text"
                placeholder="Search or Type to Select"
                value={search}
                onChange={(e) => {
                    setSearch(e.target.value);
                    setIsOpen(true);
                    onChange(e.target.value); // Set form data directly
                }}
                onFocus={() => setIsOpen(true)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            {isOpen && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto w-full">
                    <div 
                        className="px-4 py-3 text-sm font-bold text-indigo-600 hover:bg-indigo-50 cursor-pointer border-b border-slate-100 flex items-center gap-2 sticky top-0 bg-white"
                        onMouseDown={(e) => {
                            e.preventDefault(); // Prevent input blur
                            onAddNew(search);
                            setIsOpen(false);
                        }}
                    >
                        <Plus size={16} /> Add New Customer: <span className="text-slate-700 ml-1">{search || '...'}</span>
                    </div>
                    {filteredClients.length > 0 ? (
                        filteredClients.map(c => (
                            <div 
                                key={c.id} 
                                className="px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                                onMouseDown={(e) => {
                                    e.preventDefault(); // Prevent input blur before onClick fires
                                    onChange(c.name);
                                    setSearch(c.name);
                                    setIsOpen(false);
                                }}
                            >
                                {c.name}
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-3 text-sm text-slate-500 italic">No existing customer found.</div>
                    )}
                </div>
            )}
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

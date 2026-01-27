import React, { useState, useEffect } from 'react';
import { ExcelImporter } from './ExcelImporter';
import { SERVICE_TYPES } from '../constants';
import { BranchName, Client, Project, Task, TaskStatus } from '../types';
import {
    Search, Plus, Mail, Phone, FileText, ArrowLeft, Check,
    ChevronRight, Briefcase, CreditCard, Shield, User,
    Building, LayoutGrid, List, Landmark, MapPin, UserPlus,
    Calendar, Users, Info, Trash2, Edit, FolderOpen
} from 'lucide-react';

import { api } from '../src/services/api';

interface ClientManagerProps {
    selectedBranch: BranchName;
    quickAction?: string | null;
    onQuickActionHandled?: () => void;
}

type ViewState = 'directory' | 'client_detail' | 'onboarding';

const ClientManager: React.FC<ClientManagerProps> = ({ selectedBranch, quickAction, onQuickActionHandled }) => {
    const [viewMode, setViewMode] = useState<ViewState>('directory');
    const [directoryViewType, setDirectoryViewType] = useState<'grid' | 'list'>('list');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
    const [clientIdToEdit, setClientIdToEdit] = useState<Client | undefined>(undefined);
    const [clients, setClients] = useState<Client[]>([]); // Initialize empty
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('All');

    const [searchTerm, setSearchTerm] = useState('');
    const [showEngagementModal, setShowEngagementModal] = useState(false);

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const data = await api.getClients();
                setClients(data);
            } catch (err) {
                setError('Failed to load clients');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchClients();
    }, []);

    useEffect(() => {
        if (quickAction === 'NEW_CLIENT') {
            setViewMode('onboarding');
            if (onQuickActionHandled) onQuickActionHandled();
        }
    }, [quickAction, onQuickActionHandled]);

    const serviceCategories = [
        { id: 'All', label: 'All Clients', icon: User, count: clients.length },
        { id: 'GST', label: 'GST Compliance', icon: Briefcase, count: clients.filter(c => c.selectedServices?.some(s => s.includes('GST'))).length },
        { id: 'INCOME TAX', label: 'Income Tax', icon: FileText, count: clients.filter(c => c.selectedServices?.includes('INCOME TAX')).length },
        { id: 'TDS', label: 'TDS Filing', icon: CreditCard, count: clients.filter(c => c.selectedServices?.includes('TDS')).length },
        { id: 'ROC', label: 'Company Law', icon: Building, count: clients.filter(c => c.type === 'Company' || c.type === 'LLP').length },
        { id: 'TAX AUDIT', label: 'Tax Audits', icon: Shield, count: clients.filter(c => c.selectedServices?.includes('TAX AUDIT')).length },
    ];

    const filteredClients = clients.filter(client => {
        const matchesBranch = selectedBranch === BranchName.ALL || client.branch === selectedBranch;
        const matchesSearch = (client.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (client.pan || '').toLowerCase().includes(searchTerm.toLowerCase());

        if (selectedServiceFilter !== 'All') {
            if (selectedServiceFilter === 'ROC') {
                if (!(client.type === 'Company' || client.type === 'LLP')) return false;
            } else if (selectedServiceFilter === 'GST') {
                if (!client.selectedServices?.some(s => s.includes('GST'))) return false;
            } else {
                if (!client.selectedServices?.includes(selectedServiceFilter)) return false;
            }
        }
        return matchesBranch && matchesSearch;
    });

    const handleBack = () => {
        setViewMode('directory');
        setSelectedClient(null);
    };

    const handleSaveClient = async (clientData: Client) => {
        try {
            if (clientData.id && clientIdToEdit) {
                await api.updateClient(clientData);
                setClients(clients.map(c => c.id === clientData.id ? clientData : c));
            } else {
                const newClient = await api.createClient(clientData);
                setClients([newClient, ...clients]);
            }
            setViewMode('directory');
            setClientIdToEdit(undefined);
        } catch (err) {
            console.error('Failed to save client', err);
        }
    };

    const handleCreateEngagement = async (data: any) => {
        if (!selectedClient) return;
        try {
            await api.createTask({
                clientName: selectedClient.name,
                clientId: selectedClient.id,
                serviceType: data.serviceType,
                dueDate: data.dueDate,
                priority: data.priority,
                status: TaskStatus.NEW,
                branch: selectedClient.branch,
                assignedTo: '',
                period: 'FY24-25',
                slaProgress: 0,
                totalTrackedMinutes: 0
            } as any);
            setShowEngagementModal(false);
            // Ideally refresh tasks in detail view, but for now just close
            alert("Engagement Created Successfully");
        } catch (e: any) {
            console.error("Failed create task", e);
            alert("Failed to create engagement: " + (e.message || "Unknown error"));
        }
    };

    const handleImportClients = async (data: any[]) => {
        // Map Excel columns to Client object
        // Expected headers: Name, Phone, Email, City, Branch, Type
        let successCount = 0;
        for (const row of data) {
            try {
                const client: Client = {
                    id: '', // Backend assigns ID usually, or we generat temp
                    name: row['Name'] || row['name'],
                    phone: row['Phone'] || row['phone'],
                    email: row['Email'] || row['email'],
                    city: row['City'] || row['city'],
                    branch: (row['Branch'] || row['branch'] || selectedBranch) as BranchName,
                    type: (row['Type'] || row['type'] || 'Individual'),
                    pan: row['PAN'] || row['pan'] || '',
                    status: 'Active',
                    // Defaults
                    address: row['Address'] || '',
                    state: 'Andhra Pradesh',
                    pincode: row['Pincode'] || '',
                } as Client;

                if (client.name) {
                    await api.createClient(client);
                    successCount++;
                }
            } catch (err) {
                console.error("Failed to import row", row, err);
            }
        }

        // Refresh list
        const updated = await api.getClients();
        setClients(updated);
        alert(`Successfully imported ${successCount} clients!`);
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedClientIds.length} clients?`)) return;

        let successCount = 0;
        for (const id of selectedClientIds) {
            try {
                await api.deleteClient(id);
                successCount++;
            } catch (e) { console.error("Failed delete", id); }
        }
        setClients(clients.filter(c => !selectedClientIds.includes(c.id)));
        setSelectedClientIds([]);
        alert(`Deleted ${successCount} clients.`);
    };

    const toggleSelection = (id: string) => {
        setSelectedClientIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    if (viewMode === 'onboarding') {
        return <ClientOnboardingWizard
            onBack={() => { setViewMode('directory'); setClientIdToEdit(undefined); }}
            onSave={handleSaveClient}
            defaultBranch={selectedBranch === BranchName.ALL ? BranchName.RAVULAPALEM : selectedBranch}
            initialData={clientIdToEdit}
        />;
    }

    if (viewMode === 'client_detail' && selectedClient) {
        return <AdminClientDetailView
            client={selectedClient}
            onBack={handleBack}
            onEdit={() => { setClientIdToEdit(selectedClient); setViewMode('onboarding'); }}
        />;
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            {loading && <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>}
            {error && <div className="p-4 bg-red-100 text-red-600 font-bold">{error}</div>}
            <div className="p-6 bg-white border-b border-slate-200 shrink-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Client Directory</h2>
                        <p className="text-slate-500 text-sm font-medium">Manage cross-branch portfolios and compliance engagements.</p>
                    </div>
                    <div className="flex gap-3">
                        {selectedClientIds.length > 0 && (
                            <button onClick={handleBulkDelete} className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100">
                                <Trash2 size={16} /> Delete ({selectedClientIds.length})
                            </button>
                        )}
                        <ExcelImporter
                            templateName="Clients"
                            requiredColumns={['Name', 'Phone']}
                            onImport={handleImportClients}
                        />
                        <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
                            <button onClick={() => setDirectoryViewType('grid')} className={`p-2 rounded-lg transition-all ${directoryViewType === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={20} /></button>
                            <button onClick={() => setDirectoryViewType('list')} className={`p-2 rounded-lg transition-all ${directoryViewType === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><List size={20} /></button>
                        </div>
                        <button onClick={() => { setClientIdToEdit(undefined); setViewMode('onboarding'); }} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl transition-all active:scale-95"><UserPlus size={18} /> Onboard Client</button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
                    <div className="overflow-x-auto w-full lg:w-auto hide-scrollbar">
                        <div className="flex gap-4 min-w-max pb-2">
                            {serviceCategories.map((service) => (
                                <button key={service.id} onClick={() => setSelectedServiceFilter(service.id)} className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all ${selectedServiceFilter === service.id ? `bg-slate-900 text-white border-slate-900 shadow-xl` : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}>
                                    <service.icon size={18} />
                                    <span className="font-black text-xs uppercase tracking-widest">{service.label}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black ${selectedServiceFilter === service.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{service.count}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="relative w-full lg:w-96 shrink-0">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search by name or PAN identifier..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm" />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 min-h-0 relative">
                {filteredClients.length > 0 ? (
                    directoryViewType === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-20">
                            {filteredClients.map(client => (
                                <div key={client.id} onClick={() => { setSelectedClient(client); setViewMode('client_detail'); }} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer group flex flex-col relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-2xl border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                                {client.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-800 text-lg leading-tight group-hover:text-indigo-700 transition-colors line-clamp-1">{client.name}</h3>
                                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">{client.id} • {client.type}</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] ${client.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400'}`}>
                                            {client.status}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 py-6 border-y border-slate-50 my-2">
                                        <div><p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">PAN Identifier</p><p className="font-mono text-sm font-black text-slate-700">{client.pan}</p></div>
                                        <div><p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">GSTIN Entity</p><p className="font-mono text-sm font-black text-slate-700 truncate">{client.gstin || 'NONE'}</p></div>
                                    </div>
                                    <div className="mt-6 flex justify-between items-center">
                                        <button className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-2 group-hover:translate-x-1 transition-transform bg-indigo-50/50 px-4 py-2 rounded-xl border border-indigo-100/50">Profile <ChevronRight size={14} strokeWidth={3} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden mb-20">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-700 font-black text-[10px] uppercase tracking-[0.2em] border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-5 w-10">
                                            <div className="w-4 h-4 border-2 border-slate-300 rounded flex items-center justify-center cursor-pointer" onClick={() => setSelectedClientIds(selectedClientIds.length === filteredClients.length ? [] : filteredClients.map(c => c.id))}>
                                                {selectedClientIds.length === filteredClients.length && selectedClientIds.length > 0 && <div className="w-2 h-2 bg-indigo-600 rounded-sm"></div>}
                                            </div>
                                        </th>
                                        <th className="px-6 py-5">Entity</th><th className="px-6 py-5">Status</th><th className="px-6 py-5">Communication</th><th className="px-6 py-5">Branch</th><th className="px-6 py-5 text-right">Action</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredClients.map(client => (
                                        <tr key={client.id} className={`hover:bg-indigo-50/30 transition-colors group cursor-pointer ${selectedClientIds.includes(client.id) ? 'bg-indigo-50/20' : ''}`} onClick={(e) => { if ((e.target as any).closest('.checkbox-area')) return; setSelectedClient(client); setViewMode('client_detail'); }}>
                                            <td className="px-6 py-5 checkbox-area">
                                                <div className="w-4 h-4 border-2 border-slate-300 rounded flex items-center justify-center cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleSelection(client.id); }}>
                                                    {selectedClientIds.includes(client.id) && <div className="w-2 h-2 bg-indigo-600 rounded-sm"></div>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-black text-sm border border-slate-200 group-hover:bg-indigo-600 group-hover:text-white transition-all">{client.name.charAt(0)}</div><div><p className="font-black text-slate-800 text-base tracking-tight">{client.name}</p><p className="text-[10px] text-slate-400 font-black tracking-widest uppercase">{client.pan}</p></div></td>
                                            <td className="px-6 py-5"><span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${client.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-400'}`}>{client.status}</span></td>
                                            <td className="px-6 py-5"><div className="flex flex-col gap-0.5 text-xs text-slate-500 font-bold"><span>{client.phone}</span><span className="opacity-70 lowercase font-medium">{client.email}</span></div></td>
                                            <td className="px-6 py-5"><span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl uppercase tracking-widest">{client.branch}</span></td>
                                            <td className="px-6 py-5 text-right"><button className="text-indigo-600 hover:text-indigo-800 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 ml-auto group-hover:translate-x-1 transition-transform">View <ChevronRight size={14} strokeWidth={3} /></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center py-40 text-slate-400"><Search size={40} className="mb-4 opacity-20" /><h3 className="text-xl font-black uppercase tracking-widest">No Matches Found</h3></div>
                )}
                <div className="h-20 w-full shrink-0"></div>
            </div>
        </div>
    );
};

interface OnboardingProps { onBack: () => void; onSave: (client: Client) => void; defaultBranch: BranchName; initialData?: Client; }
const ClientOnboardingWizard: React.FC<OnboardingProps> = ({ onBack, onSave, defaultBranch, initialData }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<Partial<Client>>(initialData || {
        name: '', tradeName: '', group: '', type: 'Individual', branch: defaultBranch, status: 'Active',
        phone: '', email: '', pan: '', gstin: '', address: '', city: '',
        state: 'Andhra Pradesh', pincode: '', bankName: '', bankAccountNo: '', ifscCode: '',
        fileNumber: '', dob: '', referBy: '', selectedServices: [], serviceDetails: {}
    });

    const steps = [{ id: 1, title: 'Identity', icon: User }, { id: 2, title: 'Contact', icon: MapPin }, { id: 3, title: 'Statutory', icon: Landmark }, { id: 4, title: 'Activation', icon: Briefcase }];

    const updateField = (field: keyof Client, value: any) => setFormData(prev => ({ ...prev, [field]: value }));
    const toggleService = (service: string) => {
        const current = formData.selectedServices || [];
        updateField('selectedServices', current.includes(service) ? current.filter(s => s !== service) : [...current, service]);
    };

    const updateServiceDetail = (service: string, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            serviceDetails: {
                ...prev.serviceDetails,
                [service]: {
                    ...(prev.serviceDetails?.[service] || {}),
                    [field]: value
                }
            }
        }));
    };

    const renderServiceDetails = (service: string) => {
        const details = formData.serviceDetails?.[service] || {};

        const renderInput = (label: string, field: string, placeholder?: string, type: string = 'text') => (
            <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">{label}</label>
                <input
                    type={type}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={details[field] || ''}
                    onChange={e => updateServiceDetail(service, field, e.target.value)}
                    placeholder={placeholder}
                />
            </div>
        );

        return (
            <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex justify-between items-center mb-6">
                    <h5 className="font-black text-slate-800 text-lg flex items-center gap-2"><Briefcase size={18} className="text-indigo-600" /> {service} Details</h5>
                    <button className="px-4 py-2 bg-sky-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-sky-600 transition-colors shadow-lg active:scale-95">Click Link</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {service === 'INCOME TAX' && (
                        <>
                            {renderInput('IT Password', 'password', 'Enter ITR Password', 'password')}
                            {renderInput('Mail ID', 'mailId', 'Linked Mail ID')}
                            <div className="col-span-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-2 block">ITR Type</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Form 16', 'ITR 1', 'ITR 2', 'ITR 3', 'ITR 4', 'ITR 5', 'ITR 6', 'ITR 7'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => updateServiceDetail(service, 'itrType', type)}
                                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider border transition-all ${details.itrType === type ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {(service === 'GST-composition' || service === 'GST-non-composition' || service.includes('GST')) && (
                        <>
                            {renderInput('GST No', 'gstNo', 'Enter GST No')}
                            {renderInput('Mail ID', 'mailId', 'Enter Email ID')}
                            {renderInput('User ID', 'userId', 'Enter GST User ID')}
                            {renderInput('Password', 'password', 'Enter GST Password', 'password')}
                        </>
                    )}

                    {service === 'TDS' && (
                        <>
                            {renderInput('TAN Number', 'tan', 'Enter TAN')}
                            {renderInput('TDS UserID', 'userId', 'Enter TDS User ID')}
                            {renderInput('TDS Password', 'password', 'Enter TDS Password', 'password')}
                            {renderInput('AIN Number', 'ain', 'Enter AIN Num')}
                            {renderInput('Mail ID', 'mailId', 'Enter Email ID')}
                            {renderInput('Mobile Number', 'mobile', 'Enter Mobile Number')}
                        </>
                    )}

                    {service === 'Food Licence' && (
                        <>
                            {renderInput('User ID', 'userId', 'Enter Food User ID')}
                            {renderInput('Password', 'password', 'Enter Food Password', 'password')}
                            {renderInput('REG Mail ID', 'regMailId', 'Enter Email ID')}
                            {renderInput('Mobile Number', 'mobile', 'Enter Mobile Number')}
                        </>
                    )}

                    {service === 'MSME' && (
                        <>
                            {renderInput('Reg No', 'regNo', 'Enter Reg No')}
                            {renderInput('Mail ID', 'mailId', 'Enter Email ID')}
                            {renderInput('Mobile Number', 'mobile', 'Enter Mobile Number')}
                        </>
                    )}

                    {service === 'Labour' && (
                        <>
                            {renderInput('Reg No', 'regNo', 'Enter Reg No')}
                            {renderInput('Mobile Number', 'mobile', 'Enter Mobile Number')}
                            {renderInput('Mail ID', 'mailId', 'Enter Email ID')}
                            {renderInput('Password', 'password', 'Enter Password', 'password')}
                        </>
                    )}

                    {service === 'PF AND ESI' && (
                        <>
                            {renderInput('PF UserID', 'pfUserId', 'Enter PF User ID')}
                            {renderInput('PF Password', 'pfPassword', 'Enter PF Password', 'password')}
                            {renderInput('Mail ID', 'mailId', 'Enter Email ID')}
                            {renderInput('Mobile Number', 'mobile', 'Enter Mobile Number')}
                        </>
                    )}

                    {service === 'Others' && (
                        <>
                            <div className="col-span-2">
                                {renderInput('Details', 'description', 'Enter other service details...')}
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };



    const handleNext = () => currentStep < 4 ? setCurrentStep(currentStep + 1) : onSave({ id: 'C' + Math.random().toString().slice(2, 6), ...(formData as Client) });

    return (
        <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
            <div className="bg-white border-b border-slate-200 p-6 flex items-center gap-4 shrink-0">
                <button onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : onBack()} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-500 transition-all"><ArrowLeft size={24} /></button>
                <div><h2 className="text-xl font-black text-slate-800 tracking-tight leading-none">Complete Practice Onboarding</h2><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-2">Step {currentStep} of 4: {steps[currentStep - 1].title}</p></div>
            </div>
            <div className="flex-1 overflow-y-auto p-10 relative">
                <div className="max-w-4xl mx-auto pb-20">
                    <div className="flex justify-between items-center mb-12 px-10 relative">
                        <div className="absolute top-6 left-10 right-10 h-1 bg-slate-200 -z-0 rounded-full"></div>
                        {steps.map((step) => (
                            <div key={step.id} className="flex flex-col items-center relative z-10">
                                <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center text-sm font-black transition-all ${step.id === currentStep ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200 scale-110' : step.id < currentStep ? 'bg-emerald-500 text-white' : 'bg-white border-4 border-slate-200 text-slate-300'}`}>{step.id < currentStep ? <Check size={20} strokeWidth={3} /> : step.id}</div>
                                <span className={`text-[10px] font-black mt-3 uppercase tracking-widest ${step.id === currentStep ? 'text-indigo-600' : 'text-slate-400'}`}>{step.title}</span>
                            </div>
                        ))}
                    </div>
                    <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-12 min-h-[500px] flex flex-col">
                        <div className="flex-1">
                            {currentStep === 1 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Legal Identity *</label><input required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none" value={formData.name} onChange={e => updateField('name', e.target.value)} placeholder="Full Name as per PAN" /></div>
                                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Group / Family Head</label><input className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none" value={formData.group} onChange={e => updateField('group', e.target.value)} placeholder="e.g. Reliance Group" /></div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Constitution *</label><select className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black focus:ring-4 focus:ring-indigo-100 outline-none uppercase" value={formData.type} onChange={e => updateField('type', e.target.value)}><option>Individual</option><option>Company</option><option>Partnership</option><option>LLP</option></select></div>
                                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Branch Hub *</label><select className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black focus:ring-4 focus:ring-indigo-100 outline-none uppercase" value={formData.branch} onChange={e => updateField('branch', e.target.value)}>{Object.values(BranchName).filter(b => b !== BranchName.ALL).map(b => <option key={b}>{b}</option>)}</select></div>
                                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Internal File No.</label><input className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-black shadow-inner" value={formData.fileNumber} onChange={e => updateField('fileNumber', e.target.value)} placeholder="AVR/24/001" /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Date of Birth / Inc.</label><input type="date" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={formData.dob} onChange={e => updateField('dob', e.target.value)} /></div>
                                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Refer By</label><input className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold shadow-inner" value={formData.referBy} onChange={e => updateField('referBy', e.target.value)} placeholder="Consultant / Staff Name" /></div>
                                    </div>
                                </div>
                            )}
                            {currentStep === 2 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Mobile Contact *</label><input type="tel" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={formData.phone} onChange={e => updateField('phone', e.target.value)} placeholder="+91 00000 00000" /></div>
                                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Official Email</label><input type="email" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={formData.email} onChange={e => updateField('email', e.target.value)} placeholder="client@example.com" /></div>
                                    </div>
                                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Postal Address</label><textarea rows={3} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" value={formData.address} onChange={e => updateField('address', e.target.value)} placeholder="House No, Street, Landmark..." /></div>
                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">City</label><input className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={formData.city} onChange={e => updateField('city', e.target.value)} /></div>
                                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">State</label><input className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={formData.state} onChange={e => updateField('state', e.target.value)} /></div>
                                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Pincode</label><input className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-black" value={formData.pincode} onChange={e => updateField('pincode', e.target.value)} maxLength={6} /></div>
                                    </div>
                                </div>
                            )}
                            {currentStep === 3 && (
                                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="bg-indigo-50/50 p-8 rounded-[2rem] border border-indigo-100">
                                        <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mb-6 flex items-center gap-2"><Shield size={16} /> Statutory Identifiers</h4>
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">PAN Number *</label><input required className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-mono uppercase font-black" value={formData.pan} onChange={e => updateField('pan', e.target.value)} maxLength={10} placeholder="ABCDE1234F" /></div>
                                            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">GSTIN Number</label><input className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-mono uppercase font-black" value={formData.gstin} onChange={e => updateField('gstin', e.target.value)} maxLength={15} placeholder="37ABCDE1234F1Z1" /></div>
                                        </div>
                                    </div>
                                    <div className="bg-emerald-50/50 p-8 rounded-[2rem] border border-emerald-100">
                                        <h4 className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-6 flex items-center gap-2"><Landmark size={16} /> Banking Settlement Data</h4>
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Bank Name</label><input className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm" value={formData.bankName} onChange={e => updateField('bankName', e.target.value)} placeholder="e.g. State Bank of India" /></div>
                                            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">IFSC Code</label><input className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-mono uppercase font-black shadow-sm" value={formData.ifscCode} onChange={e => updateField('ifscCode', e.target.value)} placeholder="SBIN0001234" /></div>
                                            <div className="col-span-2 space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Primary Account Number</label><input className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-mono font-black shadow-sm" value={formData.bankAccountNo} onChange={e => updateField('bankAccountNo', e.target.value)} placeholder="123456789012" /></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {currentStep === 4 && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 mb-8 uppercase">Activation of Practice Compliances</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
                                        {SERVICE_TYPES.map(service => {
                                            const isActive = formData.selectedServices?.includes(service);
                                            return (
                                                <div
                                                    key={service}
                                                    onClick={() => toggleService(service)}
                                                    className={`group p-6 rounded-[2.5rem] cursor-pointer flex items-center gap-6 transition-all duration-300 border-2 ${isActive
                                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xl translate-y-[-4px]'
                                                        : 'bg-slate-50 border-slate-50 hover:bg-white hover:border-slate-100'
                                                        }`}
                                                >
                                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${isActive
                                                        ? 'bg-white border-white text-indigo-600'
                                                        : 'bg-white border-slate-200 text-transparent'
                                                        }`}>
                                                        <Check size={18} strokeWidth={4} />
                                                    </div>
                                                    <span className={`text-[13px] font-black tracking-widest uppercase transition-colors ${isActive ? 'text-white' : 'text-slate-800'}`}>
                                                        {service}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="p-8 bg-indigo-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden flex items-center gap-8">
                                        <div className="w-16 h-16 bg-white/10 rounded-3xl backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
                                            <Shield size={32} className="text-white/80" />
                                        </div>
                                        <div>
                                            <h5 className="text-base font-black uppercase tracking-widest">System Provisioning</h5>
                                            <p className="text-sm text-indigo-200 mt-1 leading-relaxed opacity-80">Finalizing registration will initialize secure client vault access and trigger compliance audit cycles.</p>
                                        </div>
                                        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="pt-10 flex justify-between border-t border-slate-50">
                            <button onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : onBack()} className="px-8 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-red-500 transition-colors">Discard Draft</button>
                            <button onClick={handleNext} className="px-12 py-4 bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-indigo-600 shadow-2xl transition-all active:scale-95 flex items-center gap-3">
                                {currentStep === 4 ? 'ACTIVATE CLIENT' : 'CONTINUE MIGRATION'}
                                {currentStep !== 4 && <ChevronRight size={18} strokeWidth={3} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdminClientDetailView: React.FC<{ client: Client, onBack: () => void, onEdit?: () => void, onNewEngagement?: () => void }> = ({ client, onBack, onEdit, onNewEngagement }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'tasks' | 'profile'>('overview');

    useEffect(() => {
        const fetchRelated = async () => {
            try {
                const [t, p] = await Promise.all([api.getTasks(client.id), api.getProjects(client.id)]);
                setTasks(t);
                setProjects(p);
            } catch (e) {
                console.error("Failed to load client details", e);
            }
        };
        fetchRelated();
    }, [client.id]);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutGrid },
        { id: 'projects', label: 'Projects', icon: Briefcase, count: projects.length },
        { id: 'tasks', label: 'Workflow', icon: List, count: tasks.length },
        { id: 'profile', label: 'Profile Data', icon: User },
    ];

    return (
        <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 flex flex-col shrink-0">
                <div className="p-6 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-3 hover:bg-slate-50 border border-slate-100 rounded-2xl text-slate-500 transition-all"><ArrowLeft size={24} /></button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">{client.name}</h1>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-2">{client.id} • {client.branch} Operations Hub</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onEdit} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white border border-transparent hover:border-slate-200 transition-all flex items-center gap-2"><Edit size={14} /> Edit Record</button>
                        <button onClick={onNewEngagement} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center gap-2"><Plus size={14} /> New Engagement</button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-6 flex gap-6 overflow-x-auto hide-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`pb-4 border-b-4 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                        >
                            <tab.icon size={16} /> {tab.label}
                            {tab.count !== undefined && <span className={`px-2 py-0.5 rounded-md text-[9px] ${activeTab === tab.id ? 'bg-indigo-50' : 'bg-slate-100'}`}>{tab.count}</span>}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 bg-slate-50">
                <div className="max-w-7xl mx-auto space-y-10">

                    {activeTab === 'overview' && (
                        <div className="animate-in fade-in zoom-in-95 duration-200 space-y-10">
                            <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-10">
                                <div className="flex-1 space-y-8">
                                    <div className="flex items-center gap-8">
                                        <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-indigo-100">{client.name.charAt(0)}</div>
                                        <div className="space-y-3">
                                            <div className="flex gap-2"><span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100">{client.type} Constitution</span><span className="px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">Verified Identity</span></div>
                                            <div className="flex items-center gap-8 text-sm font-black text-slate-500 uppercase tracking-tight"><span className="flex items-center gap-2 hover:text-indigo-600 transition-colors cursor-pointer"><Mail size={16} className="text-slate-400" /> {client.email}</span><span className="flex items-center gap-2 hover:text-indigo-600 transition-colors cursor-pointer"><Phone size={16} className="text-slate-400" /> {client.phone}</span></div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-8 pt-10 border-t border-slate-50">
                                        <div><p className="text-[10px] uppercase text-slate-400 font-black tracking-widest mb-1">PAN Identifier</p><p className="font-mono text-sm font-black text-slate-800">{client.pan}</p></div>
                                        <div><p className="text-[10px] uppercase text-slate-400 font-black tracking-widest mb-1">GST Entity</p><p className="font-mono text-sm font-black text-slate-800">{client.gstin || 'UNREGISTERED'}</p></div>
                                        <div><p className="text-[10px] uppercase text-slate-400 font-black tracking-widest mb-1">Regional Branch</p><p className="font-black text-sm text-slate-800">{client.branch}</p></div>
                                        <div><p className="text-[10px] uppercase text-slate-400 font-black tracking-widest mb-1">Assigned Lead</p><div className="flex items-center gap-2"><div className="w-6 h-6 bg-slate-900 rounded-lg flex items-center justify-center text-[10px] font-black text-white">S</div><span className="text-xs font-black text-slate-600">Suresh K</span></div></div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-indigo-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl">
                                    <div className="relative z-10">
                                        <Briefcase className="w-10 h-10 text-indigo-300 mb-4" />
                                        <h3 className="text-3xl font-black mb-1">{projects.length}</h3>
                                        <p className="text-[10px] uppercase tracking-widest text-indigo-300">Active Engagements</p>
                                    </div>
                                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
                                </div>
                                <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl">
                                    <div className="relative z-10">
                                        <List className="w-10 h-10 text-emerald-300 mb-4" />
                                        <h3 className="text-3xl font-black mb-1">{tasks.filter(t => t.status !== 'Completed').length}</h3>
                                        <p className="text-[10px] uppercase tracking-widest text-emerald-300">Pending Tasks</p>
                                    </div>
                                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-400 rounded-full blur-3xl opacity-20"></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'projects' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                            {projects.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {projects.map(p => (
                                        <div key={p.id} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600"><Briefcase size={20} /></div>
                                                <span className="text-[10px] uppercase font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-lg">{p.status}</span>
                                            </div>
                                            <h4 className="font-black text-slate-800 text-xl mb-2">{p.name}</h4>
                                            <p className="text-sm text-slate-500 mb-4 line-clamp-2">{p.description || 'No description provided.'}</p>
                                            <div className="pt-4 border-t border-slate-50 flex justify-between items-center text-xs font-bold text-slate-400">
                                                <span>Budget: ₹{p.budget?.toLocaleString() || '0'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-200 border-dashed">
                                    <Briefcase size={48} className="mx-auto text-slate-200 mb-4" />
                                    <p className="text-slate-400 font-bold">No active projects linked to this client.</p>
                                    <button onClick={onNewEngagement} className="mt-4 text-indigo-600 font-black text-xs uppercase tracking-widest hover:underline">Create First Engagement</button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'tasks' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                            {tasks.length > 0 ? (
                                <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
                                            <tr><th className="px-8 py-5">Service</th><th className="px-8 py-5">Status</th><th className="px-8 py-5">Due Date</th><th className="px-8 py-5">Assignee</th><th className="px-8 py-5 text-right">Priority</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {tasks.map(t => (
                                                <tr key={t.id} className="hover:bg-indigo-50/30 transition-colors">
                                                    <td className="px-8 py-6 font-bold text-slate-800"><div className="flex items-center gap-3"><div className={`w-2 h-2 rounded-full ${t.status === 'Completed' ? 'bg-emerald-500' : 'bg-indigo-500'}`}></div>{t.serviceType}</div></td>
                                                    <td className="px-8 py-6"><span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-xl ${t.status === 'New' ? 'bg-blue-50 text-blue-600' : t.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>{t.status}</span></td>
                                                    <td className="px-8 py-6 font-mono text-xs font-bold text-slate-600 flex items-center gap-2"><Calendar size={14} className="text-slate-300" /> {t.dueDate}</td>
                                                    <td className="px-8 py-6 text-xs font-bold text-slate-600">
                                                        {t.assignedTo ? <div className="flex items-center gap-2"><div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-black">{t.assignedTo.charAt(0)}</div>{t.assignedTo}</div> : <span className="text-slate-400 italic">Unassigned</span>}
                                                    </td>
                                                    <td className="px-8 py-6 text-right"><span className={`text-[10px] font-black uppercase tracking-wider ${t.priority === 'High' ? 'text-red-500' : 'text-slate-400'}`}>{t.priority}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-200 border-dashed">
                                    <List size={48} className="mx-auto text-slate-200 mb-4" />
                                    <p className="text-slate-400 font-bold">No workflow tasks pending.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm">
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest flex items-center gap-3 mb-10"><Info size={20} className="text-indigo-600" /> Supplementary Data</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                    <div><p className="text-[10px] uppercase text-slate-400 font-black mb-2 tracking-widest">Group Affiliation</p><p className="font-black text-slate-800 text-lg">{client.group || 'Stand-alone'}</p></div>
                                    <div><p className="text-[10px] uppercase text-slate-400 font-black mb-2 tracking-widest">Internal Reference</p><p className="font-black text-slate-800 text-lg font-mono">{client.fileNumber || 'Pending'}</p></div>
                                    <div><p className="text-[10px] uppercase text-slate-400 font-black mb-2 tracking-widest">Source Referral</p><p className="font-black text-slate-800 text-lg">{client.referBy || 'Direct'}</p></div>
                                    <div><p className="text-[10px] uppercase text-slate-400 font-black mb-2 tracking-widest">Date of Birth / Inc.</p><p className="font-black text-slate-800 text-lg">{client.dob || 'Not Disclosed'}</p></div>
                                    <div><p className="text-[10px] uppercase text-slate-400 font-black mb-2 tracking-widest">Banking Profile</p><p className="font-black text-slate-800 text-lg">{client.bankName || 'Not Linked'}</p><p className="text-xs font-mono font-bold text-slate-400 mt-1">{client.bankAccountNo}</p></div>
                                    <div className="col-span-1 lg:col-span-3 bg-slate-50 p-6 rounded-2xl border border-slate-100"><p className="text-[10px] uppercase text-slate-400 font-black mb-2 tracking-widest">Registered Address</p><p className="font-bold text-slate-700 leading-relaxed">{client.address}<br />{client.city}, {client.state} - {client.pincode}</p></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const NewEngagementModal: React.FC<{ clientName: string, onClose: () => void, onSave: (data: any) => void }> = ({ clientName, onClose, onSave }) => {
    const [serviceType, setServiceType] = useState('Income Tax Filing');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState('Medium');

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <h3 className="text-lg font-black text-slate-800 mb-1">New Engagement</h3>
                <p className="text-xs text-slate-500 font-bold mb-6 uppercase tracking-wider">For {clientName}</p>

                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Service Type</label>
                        <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={serviceType} onChange={e => setServiceType(e.target.value)}>
                            {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Due Date</label>
                        <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Priority</label>
                        <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={priority} onChange={e => setPriority(e.target.value)}>
                            <option>Low</option><option>Medium</option><option>High</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-4 mt-8 pt-6 border-t border-slate-100">
                    <button onClick={onClose} className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                    <button onClick={() => onSave({ serviceType, dueDate, priority })} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg active:scale-95 transition-all">Create Task</button>
                </div>
            </div>
        </div>
    );
};

export default ClientManager;
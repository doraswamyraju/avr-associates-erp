import React, { useState, useEffect, useRef } from 'react';
import { api } from '../src/services/api';
import { BranchName, VisitorRegisterEntry } from '../types';
import { Search, Plus, Edit, Trash2, ArrowLeft, Save, AlertCircle, MapPin, User, Phone, FileText, Calendar, X, Download } from 'lucide-react';
import { ExcelImporter } from './ExcelImporter';

interface VisitorRegisterManagerProps {
    selectedBranch: BranchName;
    quickAction?: string | null;
    onQuickActionHandled?: () => void;
}

const VisitorRegisterManager: React.FC<VisitorRegisterManagerProps> = ({ selectedBranch, quickAction, onQuickActionHandled }) => {
    const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
    const [editingEntry, setEditingEntry] = useState<VisitorRegisterEntry | null>(null);
    const [visitors, setVisitors] = useState<VisitorRegisterEntry[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const LIMIT = 20;
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [detailEntry, setDetailEntry] = useState<VisitorRegisterEntry | null>(null);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchTerm), 450);
        return () => clearTimeout(t);
    }, [searchTerm]);

    useEffect(() => {
        let isAborted = false;
        const load = async () => {
            setIsLoading(true);
            try {
                const offset = (page - 1) * LIMIT;
                const result = await api.getVisitorRegister(LIMIT, offset, debouncedSearch, selectedBranch);
                if (isAborted) return;

                if (page === 1) {
                    setVisitors(result.data || []);
                } else {
                    setVisitors(prev => [...prev, ...(result.data || [])]);
                }
                setTotal(result.total || 0);
            } catch (e) {
                console.error('Failed to load visitors', e);
            } finally {
                if (!isAborted) setIsLoading(false);
            }
        };

        load();
        return () => { isAborted = true; };
    }, [page, debouncedSearch, selectedBranch, refreshKey]);

    // Reset page on filter change
    useEffect(() => { 
        setVisitors([]); // Clear immediately on filter change
        setPage(1); 
    }, [debouncedSearch, selectedBranch]);

    const fetchData = async () => { 
        if (page === 1) setRefreshKey(prev => prev + 1);
        else setPage(1);
    };

    // Quick action
    useEffect(() => {
        if (quickAction === 'ADD_VISITOR') {
            setEditingEntry(null);
            setViewMode('form');
            if (onQuickActionHandled) onQuickActionHandled();
        }
    }, [quickAction]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 60 && !isLoading && visitors.length < total) {
            setPage(p => p + 1);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this visitor record?')) return;
        try {
            await api.deleteVisitor(id);
            setVisitors(prev => prev.filter(v => v.id !== id));
            setTotal(t => t - 1);
        } catch { alert('Failed to delete.'); }
    };

    const handleImport = async (rows: any[]) => {
        // Map Excel column headers to our schema
        const mapped = rows.map(row => ({
            id: row['ID'] || row['id'] || '',
            visitorName: row['Visitor Name'] || row['visitorName'] || row['name'] || '',
            address:     row['Address']      || row['address']     || '',
            phone:       row['Phone']        || row['phone']       || row['Contact']  || '',
            purpose:     row['Purpose']      || row['purpose']     || '',
            remarks:     row['Remarks']      || row['remarks']     || '',
            visitDate:   row['Visit Date']   || row['visitDate']   || row['Date']     || '',
            branch:      row['Branch']       || row['branch']      || selectedBranch,
            status:      row['Status']       || row['status']      || 'In',
        })).filter(r => r.visitorName);

        if (!mapped.length) { alert('No valid rows found. Make sure "Visitor Name" column exists.'); return; }
        try {
            const res = await api.createVisitorBatch(mapped);
            alert(`✅ Imported ${res.count} visitor record(s)!`);
            setPage(1);
            fetchData();
        } catch (e: any) { alert('Import failed: ' + e.message); }
    };

    if (viewMode === 'form') {
        return (
            <VisitorForm
                initialData={editingEntry || undefined}
                selectedBranch={selectedBranch}
                onCancel={() => { setEditingEntry(null); setViewMode('list'); }}
                onSuccess={() => { setEditingEntry(null); setViewMode('list'); setPage(1); fetchData(); }}
            />
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-white border-b border-slate-200 shrink-0">
                <div className="flex flex-col gap-3 mb-3">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-xl font-bold text-slate-700">Visitor Register</h2>
                            <button
                                onClick={() => { setEditingEntry(null); setViewMode('form'); }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-all"
                            >
                                <Plus size={14} /> Add Visitor
                            </button>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <ExcelImporter
                                templateName="Visitor Register"
                                requiredColumns={[]}
                                onImport={handleImport}
                            />
                            <button className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 shadow-sm transition-all">
                                <Download size={14} /> Export
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-sm font-semibold text-slate-600">
                            Showing {visitors.length} of {total} entries
                        </span>
                        <div className="flex items-center gap-3">
                            <div className="relative flex items-center">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="Search visitors…"
                                    className="pl-9 pr-3 py-1.5 w-56 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                                />
                            </div>
                            <div className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 text-xs font-bold">
                                <MapPin size={12} /> {selectedBranch}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto bg-white" onScroll={handleScroll}>
                <div className="min-w-max">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 border-r border-slate-100">#</th>
                                <th className="px-4 py-3 border-r border-slate-100 whitespace-nowrap">Visitor Name</th>
                                <th className="px-4 py-3 border-r border-slate-100 whitespace-nowrap">Address</th>
                                <th className="px-4 py-3 border-r border-slate-100 whitespace-nowrap">Phone</th>
                                <th className="px-4 py-3 border-r border-slate-100 whitespace-nowrap">Purpose</th>
                                <th className="px-4 py-3 border-r border-slate-100 whitespace-nowrap">Remarks</th>
                                <th className="px-4 py-3 border-r border-slate-100 whitespace-nowrap">Visit Date</th>
                                <th className="px-4 py-3 text-center whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading && visitors.length === 0 ? (
                                <tr><td colSpan={8} className="py-12 text-center text-slate-400 font-medium">Loading...</td></tr>
                            ) : visitors.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-center">
                                        <User size={40} className="mx-auto mb-3 text-slate-200" />
                                        <p className="text-slate-400 font-semibold">No visitors found.</p>
                                        <p className="text-slate-300 text-xs mt-1">Import from Excel or add manually.</p>
                                    </td>
                                </tr>
                            ) : visitors.map((v, i) => (
                                <tr key={v.id} className="hover:bg-indigo-50/30 transition-colors cursor-pointer" onClick={() => setDetailEntry(v)}>
                                    <td className="px-4 py-2.5 text-slate-400 border-r border-slate-100">{(page - 1) * LIMIT + i + 1}</td>
                                    <td className="px-4 py-2.5 font-semibold text-slate-800 border-r border-slate-100 uppercase max-w-[180px] truncate" title={v.visitorName}>{v.visitorName}</td>
                                    <td className="px-4 py-2.5 text-slate-600 border-r border-slate-100 max-w-[160px] truncate" title={v.address}>{v.address || '-'}</td>
                                    <td className="px-4 py-2.5 text-slate-600 border-r border-slate-100 whitespace-nowrap">{v.phone || '-'}</td>
                                    <td className="px-4 py-2.5 text-slate-600 border-r border-slate-100 max-w-[200px] truncate" title={v.purpose}>{v.purpose || '-'}</td>
                                    <td className="px-4 py-2.5 text-slate-500 border-r border-slate-100 max-w-[160px] truncate" title={v.remarks}>{v.remarks || '-'}</td>
                                    <td className="px-4 py-2.5 text-slate-600 border-r border-slate-100 whitespace-nowrap">{v.visitDate || '-'}</td>
                                    <td className="px-4 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                                        <div className="flex items-center justify-center gap-1.5">
                                            <button onClick={() => { setEditingEntry(v); setViewMode('form'); }} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors" title="Edit"><Edit size={14} /></button>
                                            <button onClick={() => handleDelete(v.id)} className="p-1 text-slate-400 hover:text-red-600 transition-colors" title="Delete"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {isLoading && visitors.length > 0 && (
                        <div className="py-4 flex justify-center text-slate-400 text-sm gap-2">
                            <div className="animate-spin w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full" />
                            Loading more...
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {detailEntry && <VisitorDetailModal entry={detailEntry} onClose={() => setDetailEntry(null)} />}
        </div>
    );
};

/* ─── Detail Modal ─────────────────────────────────────────────────── */
const VisitorDetailModal: React.FC<{ entry: VisitorRegisterEntry; onClose: () => void }> = ({ entry, onClose }) => (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 relative animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <button onClick={onClose} className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"><X size={18} /></button>
            <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center">
                    <User size={28} className="text-indigo-600" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase">{entry.visitorName}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{entry.id}</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                {[
                    { label: 'Address',    value: entry.address,   icon: MapPin },
                    { label: 'Phone',      value: entry.phone,     icon: Phone },
                    { label: 'Purpose',    value: entry.purpose,   icon: FileText },
                    { label: 'Visit Date', value: entry.visitDate, icon: Calendar },
                    { label: 'Remarks',    value: entry.remarks,   icon: FileText },
                    { label: 'Status',     value: entry.status,    icon: User },
                ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="bg-slate-50 rounded-2xl p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1"><Icon size={10} /> {label}</p>
                        <p className="text-sm font-semibold text-slate-700">{value || '—'}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

/* ─── Add / Edit Form ───────────────────────────────────────────────── */
const VisitorForm: React.FC<{
    initialData?: VisitorRegisterEntry;
    selectedBranch: BranchName;
    onCancel: () => void;
    onSuccess: () => void;
}> = ({ initialData, selectedBranch, onCancel, onSuccess }) => {
    const isEditing = !!initialData;
    const [formData, setFormData] = useState({
        visitorName: initialData?.visitorName || '',
        address:     initialData?.address     || '',
        phone:       initialData?.phone       || '',
        purpose:     initialData?.purpose     || '',
        remarks:     initialData?.remarks     || '',
        visitDate:   initialData?.visitDate   || new Date().toISOString().split('T')[0],
        status:      initialData?.status      || 'In',
        branch:      initialData?.branch      || selectedBranch,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.visitorName.trim()) { setError('Visitor Name is required.'); return; }
        setIsSaving(true); setError(null);
        try {
            if (isEditing && initialData?.id) {
                await api.updateVisitor(initialData.id, formData);
            } else {
                await api.createVisitor(formData);
            }
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to save.');
        } finally {
            setIsSaving(false);
        }
    };

    const Field = ({ label, name, type = 'text', required = false }: { label: string; name: string; type?: string; required?: boolean }) => (
        <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}{required && ' *'}</label>
            <input
                type={type}
                name={name}
                value={(formData as any)[name]}
                onChange={handleChange}
                required={required}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            />
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-all"><ArrowLeft size={18} /></button>
                    <div>
                        <h2 className="text-lg font-black text-slate-800">{isEditing ? 'Edit Visitor' : 'Add New Visitor'}</h2>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Visitor Register</p>
                    </div>
                </div>
                <button onClick={handleSubmit} disabled={isSaving} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg transition-all active:scale-95 disabled:opacity-50">
                    <Save size={14} /> {isSaving ? 'Saving…' : (isEditing ? 'Update' : 'Save')}
                </button>
            </div>

            {/* Form body */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto space-y-5 pb-20">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl text-sm flex items-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b pb-2">Visitor Information</h3>
                        <Field label="Visitor Name" name="visitorName" required />
                        <Field label="Address" name="address" />
                        <Field label="Phone / Contact" name="phone" type="tel" />
                        <Field label="Purpose of Visit" name="purpose" />
                        <Field label="Visit Date" name="visitDate" type="date" required />
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Remarks</label>
                            <textarea
                                name="remarks"
                                rows={3}
                                value={formData.remarks}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-200 outline-none resize-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</label>
                                <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-200 outline-none">
                                    <option value="In">In</option>
                                    <option value="Out">Out</option>
                                    <option value="Scheduled">Scheduled</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Branch</label>
                                <input type="text" name="branch" value={formData.branch} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VisitorRegisterManager;

import React, { useState, useEffect } from 'react';
import { MOCK_CLIENTS } from '../constants';
import { BranchName, Invoice, InvoiceItem, Client } from '../types';
import { IndianRupee, Download, FileText, Check, AlertCircle, Plus, X, Trash2, Search } from 'lucide-react';
import { api } from '../src/services/api';
import { generateInvoicePDF } from '../src/utils/pdfGenerator';

interface BillingManagerProps {
    selectedBranch: BranchName;
    quickAction?: string | null;
    onQuickActionHandled?: () => void;
}

const BillingManager: React.FC<BillingManagerProps> = ({ selectedBranch, quickAction, onQuickActionHandled }) => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [invs, cls] = await Promise.all([
                    api.getInvoices(),
                    api.getClients()
                ]);
                setInvoices(invs);
                setClients(cls);
            } catch (err) {
                console.error("Failed to load billing data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const filteredInvoices = invoices; // Add branch filtering if needed in future

    useEffect(() => {
        if (quickAction === 'NEW_INVOICE') {
            setIsAddModalOpen(true);
            if (onQuickActionHandled) onQuickActionHandled();
        }
    }, [quickAction, onQuickActionHandled]);

    const handleAddInvoice = async (newInv: Invoice) => {
        try {
            const created = await api.createInvoice(newInv);
            setInvoices([{ ...newInv, id: created.id }, ...invoices]);
            setIsAddModalOpen(false);
        } catch(e) {
            console.error(e);
            alert("Failed to create Invoice");
        }
    };

    const handleDownload = (inv: Invoice) => {
        const client = clients.find(c => c.id === inv.clientId);
        generateInvoicePDF(inv, client);
    };

    return (
        <div className="p-6 h-[calc(100vh-4rem)] relative flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Billing & Accounts</h2>
                    <p className="text-slate-500 text-sm">Manage invoices, receipts, and outstanding payments.</p>
                </div>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm"
                >
                    <Plus size={18} />
                    Generate Invoice
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex-1 overflow-hidden relative">
                {loading && <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">Loading...</div>}
                <div className="overflow-y-auto h-full">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 font-medium border-b border-slate-200 sticky top-0">
                            <tr>
                                <th className="px-6 py-4">Invoice #</th>
                                <th className="px-6 py-4">Client</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredInvoices.map(inv => (
                                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-slate-500">{inv.invoiceNumber || inv.id}</td>
                                    <td className="px-6 py-4 font-medium text-slate-800">{inv.clientName}</td>
                                    <td className="px-6 py-4 text-slate-500">{inv.date}</td>
                                    <td className="px-6 py-4">
                                        <p className="truncate max-w-[200px] text-xs">
                                            {inv.items && inv.items.length > 0 
                                                ? (typeof inv.items[0] === 'string' ? inv.items.join(', ') : inv.items.map((i:any) => i.description).join(', '))
                                                : '-'}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium">₹{(inv.amount || 0).toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                            inv.status === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' :
                                            inv.status === 'Overdue' ? 'bg-red-50 text-red-700 border-red-200' :
                                            'bg-amber-50 text-amber-700 border-amber-200'
                                        }`}>
                                            {inv.status === 'Paid' ? <Check size={12} strokeWidth={3} /> : <AlertCircle size={12} strokeWidth={3} />}
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => handleDownload(inv)} className="text-slate-400 hover:text-indigo-600 transition-colors p-2 rounded-lg hover:bg-indigo-50" title="Download PDF">
                                            <Download size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredInvoices.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center text-slate-400">No invoices generated yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isAddModalOpen && (
                <AddInvoiceModal clients={clients} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddInvoice} />
            )}
        </div>
    );
};

// ----------------------------------------------------------------------
// MODAL COMPONENT: GENERATE INVOICE
// ----------------------------------------------------------------------

const AddInvoiceModal: React.FC<{ clients: Client[], onClose: () => void, onAdd: (i: Invoice) => void }> = ({ clients, onClose, onAdd }) => {
    const [formData, setFormData] = useState({
        clientId: '', 
        date: new Date().toISOString().split('T')[0], 
        dueDate: '',
        status: 'Unpaid' as 'Paid' | 'Unpaid' | 'Overdue',
        notes: ''
    });

    const [clientSearch, setClientSearch] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [items, setItems] = useState<InvoiceItem[]>([{
        id: Math.random().toString(),
        description: '',
        hsnSac: '',
        quantity: 1,
        rate: 0,
        amount: 0
    }]);

    const calculateTotals = () => {
        const subTotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
        const cgst = subTotal * 0.09;
        const sgst = subTotal * 0.09;
        return { subTotal, cgst, sgst, total: subTotal + cgst + sgst };
    };

    const totals = calculateTotals();

    const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        if (field === 'quantity' || field === 'rate') {
            newItems[index].amount = newItems[index].quantity * newItems[index].rate;
        }
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { id: Math.random().toString(), description: '', hsnSac: '', quantity: 1, rate: 0, amount: 0 }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const client = clients.find(c => c.id === formData.clientId);
        if(!client) return alert("Please select a client");

        const newInv: Omit<Invoice, 'id'> = {
            clientId: client.id,
            clientName: client.name,
            date: formData.date,
            dueDate: formData.dueDate,
            amount: totals.total,
            subTotal: totals.subTotal,
            cgst: totals.cgst,
            sgst: totals.sgst,
            igst: 0,
            status: formData.status,
            notes: formData.notes,
            items: items.filter(i => i.description.trim() !== '') // Remove empty lines
        };
        onAdd(newInv as Invoice);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                    <h3 className="font-bold text-slate-800 text-lg">Generate Tax Invoice</h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"><X size={20} /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-6">
                    {/* Header Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="relative">
                            <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-2">Billed To (Client) *</label>
                            <div className="relative">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    required
                                    type="text"
                                    placeholder="Search client name..."
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={clientSearch}
                                    onChange={e => {
                                        setClientSearch(e.target.value);
                                        setShowSuggestions(true);
                                        if (e.target.value === '') setFormData({...formData, clientId: ''});
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                />
                                {showSuggestions && clientSearch.length > 0 && (
                                    <div className="absolute z-[60] left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        {clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).length > 0 ? (
                                            clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).map(c => (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors flex flex-col border-b border-slate-50 last:border-0"
                                                    onClick={() => {
                                                        setFormData({...formData, clientId: c.id});
                                                        setClientSearch(c.name);
                                                        setShowSuggestions(false);
                                                    }}
                                                >
                                                    <span className="font-bold text-slate-800 text-sm">{c.name}</span>
                                                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{c.type} • {c.branch}</span>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-6 text-center">
                                                <p className="text-sm text-slate-400 font-bold">No clients found</p>
                                                <button 
                                                    type="button"
                                                    className="mt-2 text-xs text-indigo-600 font-black uppercase tracking-widest hover:underline"
                                                    onClick={() => setShowSuggestions(false)}
                                                >
                                                    Close
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-2">Invoice Date *</label>
                            <input required type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" 
                                value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-2">Due Date</label>
                            <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" 
                                value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden mt-6">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-100 text-[10px] uppercase tracking-widest text-slate-500 font-black">
                                <tr>
                                    <th className="px-4 py-3">Description of Service</th>
                                    <th className="px-4 py-3 w-32">HSN/SAC</th>
                                    <th className="px-4 py-3 w-20 text-center">Qty</th>
                                    <th className="px-4 py-3 w-32 text-right">Rate (₹)</th>
                                    <th className="px-4 py-3 w-32 text-right">Amount</th>
                                    <th className="px-4 py-3 w-16 text-center"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map((item, index) => (
                                    <tr key={item.id} className="bg-white">
                                        <td className="p-2"><input required placeholder="e.g. Audit Fees FY 23-24" className="w-full px-3 py-2 border rounded-lg text-sm" value={item.description} onChange={e => updateItem(index, 'description', e.target.value)} /></td>
                                        <td className="p-2"><input placeholder="e.g. 998231" className="w-full px-3 py-2 border rounded-lg text-sm" value={item.hsnSac} onChange={e => updateItem(index, 'hsnSac', e.target.value)} /></td>
                                        <td className="p-2"><input required type="number" min="1" className="w-full px-3 py-2 border rounded-lg text-sm text-center" value={item.quantity} onChange={e => updateItem(index, 'quantity', Number(e.target.value))} /></td>
                                        <td className="p-2"><input required type="number" min="0" className="w-full px-3 py-2 border rounded-lg text-sm text-right" value={item.rate} onChange={e => updateItem(index, 'rate', Number(e.target.value))} /></td>
                                        <td className="p-2 text-right font-medium text-slate-800 pr-4">{(item.quantity * item.rate).toLocaleString()}</td>
                                        <td className="p-2 text-center">
                                            {items.length > 1 && (
                                                <button type="button" onClick={() => removeItem(index)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-3 bg-slate-50 border-t border-slate-100">
                            <button type="button" onClick={addItem} className="flex items-center gap-2 text-indigo-600 text-xs font-bold hover:underline px-2">
                                <Plus size={14} /> Add Line Item
                            </button>
                        </div>
                    </div>

                    {/* Totals & Notes */}
                    <div className="flex flex-col md:flex-row gap-8 justify-between mt-6">
                        <div className="flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-2">Terms / Notes</label>
                                <textarea rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" 
                                    placeholder="Enter any specific terms or notes for the client"
                                    value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-2">Invoice Status</label>
                                <select className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold shadow-sm"
                                    value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                                    <option value="Unpaid">Unpaid</option>
                                    <option value="Paid">Paid</option>
                                    <option value="Overdue">Overdue</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="w-full md:w-72 bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-3">
                            <div className="flex justify-between text-sm font-medium text-slate-500">
                                <span>Sub Total</span>
                                <span>₹{totals.subTotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm font-medium text-slate-500">
                                <span>CGST (9%)</span>
                                <span>₹{totals.cgst.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm font-medium text-slate-500">
                                <span>SGST (9%)</span>
                                <span>₹{totals.sgst.toLocaleString()}</span>
                            </div>
                            <div className="pt-3 border-t border-slate-300 flex justify-between items-center text-lg font-black text-indigo-900">
                                <span>Total Value</span>
                                <span>₹{totals.total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex gap-4 pt-8">
                        <button type="button" onClick={onClose} className="flex-1 px-6 py-4 border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-colors">Discard</button>
                        <button type="submit" className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-95">Save & Generate Invoice</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BillingManager;
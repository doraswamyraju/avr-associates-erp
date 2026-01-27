import React, { useState, useEffect } from 'react';
import { MOCK_INVOICES, MOCK_CLIENTS } from '../constants';
import { BranchName, Invoice } from '../types';
import { IndianRupee, Download, FileText, Check, AlertCircle, Plus, X } from 'lucide-react';

interface BillingManagerProps {
    selectedBranch: BranchName;
    quickAction?: string | null;
    onQuickActionHandled?: () => void;
}

const BillingManager: React.FC<BillingManagerProps> = ({ selectedBranch, quickAction, onQuickActionHandled }) => {
    const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Filter Logic
    const filteredInvoices = invoices; 

    // Handle Quick Action
    useEffect(() => {
        if (quickAction === 'NEW_INVOICE') {
            setIsAddModalOpen(true);
            if (onQuickActionHandled) onQuickActionHandled();
        }
    }, [quickAction, onQuickActionHandled]);

    const handleAddInvoice = (newInv: Invoice) => {
        setInvoices([newInv, ...invoices]);
        setIsAddModalOpen(false);
    };

    return (
        <div className="p-6 h-[calc(100vh-4rem)] relative">
             <div className="flex justify-between items-center mb-6">
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

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">Invoice #</th>
                            <th className="px-6 py-4">Client</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Items</th>
                            <th className="px-6 py-4 text-right">Amount</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredInvoices.map(inv => (
                            <tr key={inv.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-mono text-slate-500">{inv.id}</td>
                                <td className="px-6 py-4 font-medium text-slate-800">{inv.clientName}</td>
                                <td className="px-6 py-4 text-slate-500">{inv.date}</td>
                                <td className="px-6 py-4">
                                    <p className="truncate max-w-[200px] text-xs">{inv.items.join(', ')}</p>
                                </td>
                                <td className="px-6 py-4 text-right font-medium">₹{inv.amount.toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                                        inv.status === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' :
                                        inv.status === 'Overdue' ? 'bg-red-50 text-red-700 border-red-200' :
                                        'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}>
                                        {inv.status === 'Paid' ? <Check size={10} /> : <AlertCircle size={10} />}
                                        {inv.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                                        <Download size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isAddModalOpen && (
                <AddInvoiceModal onClose={() => setIsAddModalOpen(false)} onAdd={handleAddInvoice} />
            )}
        </div>
    );
};

// ----------------------------------------------------------------------
// MODAL COMPONENT: GENERATE INVOICE
// ----------------------------------------------------------------------

const AddInvoiceModal: React.FC<{ onClose: () => void, onAdd: (i: Invoice) => void }> = ({ onClose, onAdd }) => {
    const [formData, setFormData] = useState({
        clientId: '', date: new Date().toISOString().split('T')[0], amount: 0, items: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const client = MOCK_CLIENTS.find(c => c.id === formData.clientId);
        if(!client) return;

        const newInv: Invoice = {
            id: `INV-${Math.floor(Math.random() * 100000)}`,
            clientId: client.id,
            clientName: client.name,
            date: formData.date,
            amount: Number(formData.amount),
            status: 'Unpaid',
            items: formData.items.split(',').map(s => s.trim())
        };
        onAdd(newInv);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800">Generate Invoice</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Select Client</label>
                        <select required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})}>
                            <option value="">-- Choose Client --</option>
                            {MOCK_CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Invoice Date</label>
                            <input required type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" 
                                value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                        </div>
                         <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Total Amount (₹)</label>
                            <input required type="number" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" 
                                value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Items (Comma separated)</label>
                        <textarea required rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" 
                            placeholder="e.g. Filing Fees, Consultation, audit"
                            value={formData.items} onChange={e => setFormData({...formData, items: e.target.value})} />
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
                        <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Generate</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BillingManager;
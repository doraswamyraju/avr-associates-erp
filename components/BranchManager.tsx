import React, { useState, useEffect } from 'react';
import { api } from '../src/services/api';
import { Branch } from '../types';
import { Building2, Plus, Trash2, ShieldAlert } from 'lucide-react';

interface BranchManagerProps {
    onBranchCreated?: () => void;
}

const BranchManager: React.FC<BranchManagerProps> = ({ onBranchCreated }) => {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [newBranchName, setNewBranchName] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadBranches = async () => {
        try {
            setLoading(true);
            const data = await api.getBranches();
            setBranches(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load branches');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBranches();
    }, []);

    const handleCreateBranch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBranchName.trim()) return;

        try {
            setSubmitting(true);
            setError(null);
            await api.createBranch(newBranchName);
            setNewBranchName('');
            await loadBranches();
            onBranchCreated?.();
        } catch (err: any) {
            setError(err.message || 'Failed to create branch');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteBranch = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete the branch "${name}"? This might break records linked exclusively to it if it's currently in use.`)) {
            return;
        }

        try {
            setLoading(true);
            await api.deleteBranch(id);
            await loadBranches();
        } catch (err: any) {
            setError(err.message || 'Failed to delete branch');
            setLoading(false);
        }
    };

    return (
        <div className="h-full overflow-y-auto custom-scrollbar bg-slate-50/30 p-10">
            <div className="max-w-4xl mx-auto space-y-8 pb-32">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-[2rem] bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-600/20 shrink-0">
                        <Building2 size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-slate-800 tracking-tight">Branch Management</h2>
                        <p className="text-slate-500 font-bold mt-1">Configure and oversee operation centers</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-center gap-3">
                        <ShieldAlert size={20} />
                        <span className="font-bold text-sm tracking-wide">{error}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Add New Branch Card */}
                    <div className="md:col-span-1 border border-slate-200 bg-white rounded-[2rem] p-8 shadow-xl h-fit sticky top-8">
                        <h3 className="text-lg font-black tracking-tight text-slate-800 mb-6 uppercase flex items-center gap-2">
                            <Plus size={20} className="text-indigo-600" /> New Branch
                        </h3>
                        <form onSubmit={handleCreateBranch} className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Branch Name</label>
                                <input
                                    type="text"
                                    value={newBranchName}
                                    onChange={(e) => setNewBranchName(e.target.value)}
                                    placeholder="e.g. Hyderabad"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:border-indigo-500 transition-colors font-medium"
                                    required
                                    disabled={submitting}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submitting || !newBranchName.trim()}
                                className="w-full bg-indigo-600 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-xl py-4 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {submitting ? 'Creating...' : 'Create Branch'}
                            </button>
                        </form>
                    </div>

                    {/* Branch List */}
                    <div className="md:col-span-2 space-y-4">
                        <h3 className="text-sm font-black tracking-widest text-slate-400 uppercase mb-4 px-2">Active Branches</h3>
                        
                        {loading ? (
                            <div className="animate-pulse space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-24 bg-white rounded-[2rem] border border-slate-100"></div>
                                ))}
                            </div>
                        ) : branches.length === 0 ? (
                            <div className="text-center p-12 bg-white rounded-[2rem] border border-slate-100 border-dashed">
                                <Building2 size={48} className="mx-auto text-slate-300 mb-4" />
                                <p className="text-sm font-bold text-slate-500">No custom branches configured yet.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {branches.map((branch) => (
                                    <div key={branch.id} className="bg-white border border-slate-100 p-6 rounded-[2rem] flex items-center justify-between group hover:shadow-xl transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                <Building2 size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-800 tracking-tight text-xl">{branch.name}</h4>
                                                <p className="text-xs font-bold text-slate-400 font-mono mt-1">ID: {branch.id}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteBranch(branch.id, branch.name)}
                                            className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors"
                                            title="Delete Branch"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BranchManager;

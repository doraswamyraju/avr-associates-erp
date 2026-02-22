
import React, { useState, useEffect } from 'react';
import { ExcelImporter } from './ExcelImporter';
import { MOCK_STAFF } from '../constants';
import { BranchName, TaskStatus, Task, Priority, UserRole, User, Project, ProjectStatus, TimeLogEntry, Client } from '../types';
import { StatusBadge } from './Dashboard';
import { api } from '../src/services/api';
import {
    LayoutGrid, List, Plus, X, Play, Clock, ChevronRight, Search,
    User as UserIcon, StopCircle, IndianRupee, Layers, TrendingUp, Zap,
    MousePointer2, Briefcase, History, AlertTriangle, Trash2, FileText, CreditCard
} from 'lucide-react';

interface TaskManagerProps {
    selectedBranch: BranchName;
    currentUser?: User;
    quickAction?: string | null;
    onQuickActionHandled?: () => void;
    preSelectedAssignee?: string;
    activeTaskTimer?: { task: Task, startTime: Date } | null;
    setActiveTaskTimer?: (timer: { task: Task, startTime: Date } | null) => void;
}





const TaskBoard: React.FC<{ tasks: Task[], viewMode: 'list' | 'kanban', onTaskClick: (t: Task) => void, activeTaskTimer: any }> = ({ tasks, viewMode, onTaskClick, activeTaskTimer }) => {
    if (viewMode === 'list') {
        return (
            <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
                        <tr><th className="px-6 py-4">Assignment</th><th className="px-6 py-4">Client Portfolio</th><th className="px-6 py-4 text-center">Clocked Effort</th><th className="px-6 py-4">Assigned To</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {tasks.map(task => {
                            const isCurrentlyTracking = activeTaskTimer?.task.id === task.id;
                            return (
                                <tr key={task.id} className={`hover:bg-indigo-50/30 cursor-pointer transition-colors ${isCurrentlyTracking ? 'bg-indigo-50/50' : ''}`} onClick={() => onTaskClick(task)}>
                                    <td className="px-6 py-5"><div className="flex items-center gap-3"><div className={`w-2 h-2 rounded-full ${task.priority === Priority.HIGH ? 'bg-red-500' : 'bg-slate-300'}`}></div><div><p className="font-black text-slate-800 tracking-tight">{task.serviceType}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {task.id} • {task.period}</p></div></div></td>
                                    <td className="px-6 py-5 font-bold text-slate-600">{task.clientName}</td>
                                    <td className="px-6 py-5 text-center"><div className={`flex items-center justify-center gap-2 px-3 py-1 rounded-full w-fit mx-auto border ${isCurrentlyTracking ? 'bg-indigo-600 text-white border-indigo-600 animate-pulse' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>{isCurrentlyTracking ? <Zap size={12} className="fill-current" /> : <Clock size={12} />}<span className="text-xs font-black">{Math.floor(task.totalTrackedMinutes / 60)}h {task.totalTrackedMinutes % 60}m</span></div></td>
                                    <td className="px-6 py-5 flex items-center gap-2"><div className="w-8 h-8 bg-indigo-50 text-indigo-700 rounded-lg flex items-center justify-center font-black text-xs shadow-sm">{(task.assignedTo || '?').charAt(0)}</div><span className="font-bold text-slate-600">{task.assignedTo || 'Unassigned'}</span></td>
                                    <td className="px-6 py-5"><StatusBadge status={task.status} /></td>
                                    <td className="px-6 py-5 text-right"><button className="px-5 py-2 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100">Audit</button></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    }

    const cols = [TaskStatus.NEW, TaskStatus.IN_PROGRESS, TaskStatus.PENDING_CLIENT, TaskStatus.REVIEW, TaskStatus.COMPLETED];
    return (
        <div className="flex gap-6 h-full overflow-x-auto pb-8 custom-scrollbar relative">
            {cols.map(col => (
                <div key={col} className="min-w-[320px] flex-1 flex flex-col gap-4">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 px-3 flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${col === TaskStatus.NEW ? 'bg-slate-400' : col === TaskStatus.IN_PROGRESS ? 'bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'bg-emerald-500'}`}></span>{col}</h3>
                    <div className="flex-1 space-y-4 overflow-y-auto px-1 pr-2 custom-scrollbar">
                        {tasks.filter(t => t.status === col).map(task => {
                            const isCurrentlyTracking = activeTaskTimer?.task.id === task.id;
                            return (
                                <div key={task.id} onClick={() => onTaskClick(task)} className={`bg-white p-6 rounded-[2.5rem] border transition-all cursor-pointer group relative overflow-hidden ${isCurrentlyTracking ? 'ring-4 ring-indigo-500/20 border-indigo-500 shadow-2xl' : 'border-slate-200 hover:shadow-xl hover:border-indigo-300 shadow-sm'}`}>
                                    {isCurrentlyTracking && <div className="absolute top-0 right-0 p-2 bg-indigo-600 text-white rounded-bl-2xl animate-pulse shadow-lg"><Zap size={14} className="fill-current" /></div>}
                                    <div className="flex justify-between items-start mb-4"><p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{task.serviceType}</p><span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter ${task.priority === Priority.HIGH ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-slate-50 text-slate-400'}`}>{task.priority}</span></div>
                                    <h4 className="font-black text-slate-800 mb-6 tracking-tight leading-tight text-lg group-hover:text-indigo-700 transition-colors">{task.clientName}</h4>
                                    <div className="flex items-center justify-between mt-auto pt-5 border-t border-slate-50">
                                        <div className={`flex items-center gap-2 ${isCurrentlyTracking ? 'text-indigo-600 font-black' : 'text-slate-400 font-bold'}`}><Clock size={12} /><span className="text-[10px] uppercase tracking-tight">{Math.floor(task.totalTrackedMinutes / 60)}h {task.totalTrackedMinutes % 60}m</span></div>
                                        <div className="w-8 h-8 bg-indigo-50 text-indigo-700 border-2 border-white rounded-xl flex items-center justify-center font-black text-[10px] shadow-sm">{(task.assignedTo || '?').charAt(0)}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

const ProjectCard: React.FC<{ project: Project, progress: number, onClick: () => void }> = ({ project, progress, onClick }) => {
    const costSoFar = (project.totalHoursTracked || 0) * 500;
    const yieldMargin = (project.budget || 0) - costSoFar;
    return (
        <div onClick={onClick} className="bg-white rounded-[3rem] border border-slate-200 p-8 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer group flex flex-col h-full relative overflow-hidden">
            <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="p-5 bg-indigo-600 rounded-[1.5rem] text-white shadow-xl shadow-indigo-100 group-hover:rotate-12 transition-transform duration-500"><Briefcase size={28} strokeWidth={2.5} /></div>
                <div className="flex flex-col items-end gap-2"><span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] ${project.status === ProjectStatus.IN_PROGRESS ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-slate-100 text-slate-500'}`}>{project.status}</span></div>
            </div>
            <h3 className="font-black text-2xl text-slate-800 mb-2 tracking-tight leading-tight group-hover:text-indigo-700 transition-colors">{project.name}</h3>
            <p className="text-[10px] font-black text-slate-400 mb-8 uppercase tracking-[0.2em]">{project.clientName}</p>
            <div className="mt-auto space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-[1.75rem] border border-slate-100 shadow-inner"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Resource Burn</p><p className="text-base font-black text-slate-800">{project.totalHoursTracked} Hours</p></div>
                    <div className="bg-slate-50 p-4 rounded-[1.75rem] border border-slate-100 shadow-inner"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Audit Yield</p><p className={`text-base font-black ${yieldMargin < 0 ? 'text-red-500' : 'text-emerald-500'}`}>₹{yieldMargin.toLocaleString()}</p></div>
                </div>
                <div><div className="flex justify-between text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 mb-3"><span>Velocity</span><span>{progress}%</span></div><div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50"><div className="h-full bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div></div></div>
            </div>
        </div>
    );
};

const ProjectDetailView: React.FC<{ project: Project, tasks: Task[], onBack: () => void, onTaskClick: (t: Task) => void, currentUser?: User, activeTaskTimer: any, onNewTask: () => void }> = ({ project, tasks, onBack, onTaskClick, currentUser, activeTaskTimer, onNewTask }) => {
    const totalHours = tasks.reduce((acc, t) => acc + (t.totalTrackedMinutes / 60), 0);
    const estimatedCost = totalHours * 500;
    const profitability = project.budget ? project.budget - estimatedCost : 0;
    const marginPercent = project.budget ? ((profitability / project.budget) * 100).toFixed(1) : 0;

    const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'documents' | 'financials'>('overview');
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
    const [documents, setDocuments] = useState<any[]>([]);

    const handleImportDocuments = async (data: any[]) => {
        if (!project.clientId) return;

        const newDocs = data.map(row => ({
            clientId: project.clientId,
            taskId: null,
            name: row['Document Name'] || row['Name'] || row['name'] || 'Untitled Document',
            type: row['Type'] || row['type'] || 'pdf',
            status: row['Status'] || row['status'] || 'Pending'
        }));

        if (newDocs.length === 0) return;

        try {
            await api.createDocumentsBatch(newDocs);
            const updatedDocs = await api.getDocuments(project.clientId);
            setDocuments(updatedDocs);
            alert(`Successfully imported ${newDocs.length} documents for requirement tracking.`);
        } catch (e: any) {
            console.error("Batch document import failed", e);
            alert("Failed to import documents: " + e.message);
        }
    };

    useEffect(() => {
        if (activeTab === 'documents' && project.clientId) {
            api.getDocuments(project.clientId).then(docs => setDocuments(docs));
        }
    }, [activeTab, project.clientId]);

    return (
        <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
            <div className="p-6 bg-white border-b border-slate-200 shrink-0">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-400">
                        <button onClick={onBack} className="hover:text-indigo-600 transition-colors flex items-center gap-1"><MousePointer2 size={12} /> Projects</button>
                        <ChevronRight size={14} />
                        <span className="text-slate-800">{project.name}</span>
                    </div>
                </div>

                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2">{project.name}</h1>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-2xl">{project.description}</p>
                    </div>
                    <div className="flex gap-2">
                        {['overview', 'tasks', 'documents', 'financials'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative bg-slate-50/50">
                {activeTab === 'overview' && (
                    <div className="p-8 overflow-y-auto h-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-between">
                                <div className="flex items-center gap-4 mb-8"><div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600"><IndianRupee size={24} strokeWidth={3} /></div><div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Revenue Allocation</p><p className="font-black text-slate-800 text-2xl">₹{project.budget?.toLocaleString()}</p></div></div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs font-bold text-slate-500"><span>Progress</span><span>{Math.floor((estimatedCost / (project.budget || 1)) * 100)}% utilized</span></div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-600 rounded-full" style={{ width: `${(estimatedCost / (project.budget || 1)) * 100}%` }}></div></div>
                                </div>
                            </div>
                            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-between">
                                <div className="flex items-center gap-4 mb-8"><div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600"><TrendingUp size={24} strokeWidth={3} /></div><div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Yield Margin (Est.)</p><p className="font-black text-emerald-600 text-2xl">₹{profitability.toLocaleString()}</p></div></div>
                                <div className="p-4 bg-emerald-50/50 rounded-xl text-xs font-bold text-emerald-700 text-center">
                                    {marginPercent}% Profit Margin
                                </div>
                            </div>
                            <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
                                <div className="relative z-10"><h4 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] mb-4">Engagement Effort</h4><div className="flex items-baseline gap-2"><span className="text-5xl font-black">{Math.floor(totalHours)}</span><span className="text-xl font-bold text-slate-400">HRS</span></div></div>
                                <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-indigo-500 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'tasks' && (
                    <div className="h-full flex flex-col">
                        <div className="p-6 flex items-center justify-between shrink-0">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-3"><Layers size={18} className="text-indigo-600" /> Engagement Tasks</h3>
                            <div className="flex gap-3">
                                <div className="bg-slate-100 rounded-xl p-1 flex">
                                    <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><LayoutGrid size={16} /></button>
                                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><List size={16} /></button>
                                </div>
                                {currentUser?.role !== UserRole.CLIENT && <button onClick={onNewTask} className="bg-slate-900 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all hover:bg-indigo-600">Assign Sub-component</button>}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto px-6 pb-20"><TaskBoard tasks={tasks} viewMode={viewMode} onTaskClick={onTaskClick} activeTaskTimer={activeTaskTimer} /></div>
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="p-8 h-full overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-3"><FileText size={18} className="text-indigo-600" /> Engagement Documents</h3>
                            {currentUser?.role !== UserRole.CLIENT && (
                                <ExcelImporter onImport={handleImportDocuments} />
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {documents.map(doc => (
                                <div key={doc.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:border-indigo-200 transition-all group">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><FileText size={20} /></div>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${doc.status === 'Verified' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{doc.status}</span>
                                    </div>
                                    <h4 className="font-bold text-slate-800 truncate mb-1">{doc.name}</h4>
                                    <p className="text-xs text-slate-400 font-bold uppercase">{doc.type} • {new Date(doc.uploadDate || doc.upload_date).toLocaleDateString()}</p>
                                    <div className="mt-6 pt-6 border-t border-slate-50 flex gap-2">
                                        <button className="flex-1 py-2 bg-slate-50 text-slate-600 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 hover:text-white transition-colors">Download</button>
                                    </div>
                                </div>
                            ))}
                            {documents.length === 0 && (
                                <div className="col-span-full py-20 text-center text-slate-400">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"><FileText size={24} /></div>
                                    <p className="font-medium">No documents linked to this engagement.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'financials' && (
                    <div className="p-8 h-full overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-12 text-center">
                            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 mx-auto mb-6"><CreditCard size={32} /></div>
                            <h3 className="text-2xl font-black text-slate-800 mb-2">Financial Overview</h3>
                            <p className="text-slate-500 max-w-lg mx-auto mb-8">Invoicing and WIP tracking for this engagement is currently being synchronized with the master ledger.</p>
                            <div className="inline-flex gap-8 text-left">
                                <div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Unbilled WIP</p><p className="text-xl font-black text-slate-800">₹{(estimatedCost).toLocaleString()}</p></div>
                                <div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Invoiced</p><p className="text-xl font-black text-slate-800">₹0</p></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const PerformTaskModal: React.FC<{ task: Task, onClose: () => void, onUpdate: (t: Task) => void, activeTaskTimer: any, setActiveTaskTimer: any, currentUser?: User }> = ({ task, onClose, onUpdate, activeTaskTimer, setActiveTaskTimer, currentUser }) => {
    const [status, setStatus] = useState(task.status);
    const [localTimer, setLocalTimer] = useState<number>(0);
    const isCurrentlyActive = activeTaskTimer?.task.id === task.id;

    useEffect(() => {
        let interval: any;
        if (isCurrentlyActive) {
            interval = setInterval(() => {
                const diff = new Date().getTime() - activeTaskTimer.startTime.getTime();
                setLocalTimer(Math.floor(diff / 1000));
            }, 1000);
        } else {
            setLocalTimer(0);
        }
        return () => clearInterval(interval);
    }, [isCurrentlyActive, activeTaskTimer]);

    const formatTime = (s: number) => {
        const hrs = Math.floor(s / 3600);
        const mins = Math.floor((s % 3600) / 60);
        const secs = s % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleToggleTimer = () => {
        if (isCurrentlyActive) {
            const extraMinutes = Math.floor(localTimer / 60);
            const endTime = new Date();
            const newLog: TimeLogEntry = {
                id: 'TL' + Math.random().toString().slice(2, 8),
                taskId: task.id,
                staffId: currentUser?.id || 'SYSTEM',
                staffName: currentUser?.name || 'System User',
                startTime: activeTaskTimer.startTime.toISOString(),
                endTime: endTime.toISOString(),
                durationMinutes: extraMinutes,
                description: 'Work Session Log'
            };

            const updatedLogs = [...(task.timeLogs || []), newLog];
            onUpdate({
                ...task,
                totalTrackedMinutes: task.totalTrackedMinutes + extraMinutes,
                timeLogs: updatedLogs
            });
            setActiveTaskTimer(null);
        } else {
            setActiveTaskTimer({ task, startTime: new Date() });
        }
    };

    const handleSave = () => {
        onUpdate({ ...task, status: status });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-end p-4 animate-in slide-in-from-right duration-500">
            <div className="bg-white h-full w-full max-w-xl shadow-2xl flex flex-col rounded-[3rem] overflow-hidden border border-white/20 relative">
                <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-white shrink-0">
                    <div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-1">TASK MANIFEST • {task.id}</p><h3 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">{task.serviceType}</h3></div>
                    <button onClick={onClose} className="p-4 hover:bg-slate-50 border border-slate-100 rounded-[1.5rem] text-slate-400 transition-all active:scale-90"><X size={28} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl transition-all duration-500 ring-4 ring-slate-100">
                        <div className="relative z-10 flex flex-col items-center">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 mb-8">Active Work Stopwatch</h4>
                            <div className="text-6xl font-black font-mono tracking-widest mb-10 text-white drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">{formatTime(localTimer)}</div>
                            <div className="flex gap-4 w-full">
                                {!isCurrentlyActive ? (
                                    <button onClick={handleToggleTimer} className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95 hover:-translate-y-1"><Play size={20} className="fill-current" /> Start Tracking</button>
                                ) : (
                                    <button onClick={handleToggleTimer} className="flex-1 bg-red-600 hover:bg-red-500 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95 hover:-translate-y-1"><StopCircle size={20} className="fill-current" /> Stop & Log Time</button>
                                )}
                            </div>
                        </div>
                        <div className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-indigo-500 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
                        <div className="absolute bottom-[-10%] left-[-10%] w-60 h-60 bg-purple-500 rounded-full blur-[100px] opacity-10 pointer-events-none"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Aggregate Effort</p><p className="text-xl font-black text-slate-800">{Math.floor(task.totalTrackedMinutes / 60)}h {task.totalTrackedMinutes % 60}m</p></div>
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Target Entity</p><p className="text-xl font-black text-slate-800 truncate">{task.clientName}</p></div>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Clocked Logs</h4>
                        <div className="space-y-3">
                            {(task.timeLogs && task.timeLogs.length > 0) ? task.timeLogs.map((log) => (
                                <div key={log.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                    <div className="flex items-center gap-3"><div className="p-2 bg-slate-50 rounded-xl text-slate-400 border border-slate-100"><History size={16} /></div><div><p className="text-xs font-black text-slate-800">{log.staffName}</p><p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(log.startTime).toLocaleDateString()}</p></div></div>
                                    <span className="text-xs font-black text-indigo-600">{log.durationMinutes}m clocked</span>
                                </div>
                            )) : <p className="text-center text-xs text-slate-400 italic">No billable sessions recorded yet.</p>}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Workflow Progression</h4>
                        <div className="grid grid-cols-2 gap-3">
                            {Object.values(TaskStatus).map(s => (
                                <button key={s} onClick={() => setStatus(s)} className={`p-5 rounded-3xl border text-[10px] font-black uppercase tracking-widest transition-all ${status === s ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100 scale-[1.03]' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200'}`}>{s}</button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Executive Commit Narrative</h4>
                        <textarea rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-[2.5rem] p-8 text-sm font-medium focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all shadow-inner" placeholder="Log critical session details, bottlenecks or audit findings..."></textarea>
                    </div>
                </div>

                <div className="p-10 border-t border-slate-100 flex gap-6 shrink-0 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                    <button onClick={onClose} className="flex-1 py-5 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-red-500 transition-colors">Discard Draft</button>
                    <button onClick={handleSave} className="flex-2 px-12 py-5 bg-slate-900 text-white rounded-[1.75rem] text-[11px] font-black uppercase tracking-[0.4em] hover:bg-indigo-600 shadow-2xl transition-all active:scale-95">Update Lifecycle</button>
                </div>
            </div>
        </div>
    );
};

const NewAllocationModal: React.FC<{ onClose: () => void, onSave: (data: any) => void, clients: Client[], projects: Project[], staff: string[], preSelectedProjectId?: string | null }> = ({ onClose, onSave, clients, projects, staff, preSelectedProjectId }) => {
    const [clientName, setClientName] = useState('');
    const [serviceType, setServiceType] = useState('Income Tax Filing');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [projectId, setProjectId] = useState(preSelectedProjectId || '');
    const [assignedTo, setAssignedTo] = useState('');
    const [filteredClients, setFilteredClients] = useState<Client[]>([]);

    useEffect(() => {
        if (preSelectedProjectId) {
            const project = projects.find(p => p.id === preSelectedProjectId);
            if (project) {
                setProjectId(project.id);
                // Also auto-fill client name
                const client = clients.find(c => c.id === project.clientId);
                if (client) setClientName(client.name);
            }
        }
    }, [preSelectedProjectId, projects, clients]);

    useEffect(() => {
        if (clientName) {
            const exactMatch = clients.find(c => c.name.toLowerCase() === clientName.toLowerCase() && c.name === clientName);
            if (exactMatch) {
                setFilteredClients([]);
            } else {
                setFilteredClients(clients.filter(c => c.name.toLowerCase().includes(clientName.toLowerCase())).slice(0, 5));
            }
        } else {
            setFilteredClients([]);
        }
    }, [clientName, clients]);

    // Auto-select project if only one exists for client
    useEffect(() => {
        const client = clients.find(c => c.name === clientName);
        if (client) {
            const clientProjects = projects.filter(p => p.clientId === client.id);
            if (clientProjects.length === 1) setProjectId(clientProjects[0].id);
        }
    }, [clientName, clients, projects]);

    const clientProjects = clientName ? projects.filter(p => {
        const c = clients.find(cl => cl.name === clientName);
        return c && p.clientId === c.id;
    }) : projects; // Show all projects if no client selected

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <h3 className="text-lg font-black text-slate-800 mb-6">New Resource Allocation</h3>

                <div className="space-y-4">
                    {preSelectedProjectId ? (
                        // Context-aware simplified view (Disabled Inputs)
                        <>
                            <div className="relative">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Client Entity</label>
                                <input disabled className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 outline-none cursor-not-allowed" value={clientName} />
                            </div>

                            {/* Service Type Hidden as requested */}

                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Project Context</label>
                                <select disabled className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 outline-none cursor-not-allowed" value={projectId}>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                        </>
                    ) : (
                        // Standard full view
                        <>
                            <div className="relative">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Client Entity</label>
                                <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Search client..." />
                                {filteredClients.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl mt-1 z-50 overflow-hidden">
                                        {filteredClients.map(c => (
                                            <div key={c.id} onClick={() => { setClientName(c.name); setFilteredClients([]); }} className="px-4 py-3 hover:bg-slate-50 cursor-pointer text-sm font-bold text-slate-700">
                                                {c.name} <span className="text-[10px] text-slate-400 font-normal ml-2">{c.branch}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="relative z-0">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Project Context</label>
                                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={projectId} onChange={e => {
                                    const selectedId = e.target.value;
                                    setProjectId(selectedId);
                                    if (selectedId) {
                                        const matchProj = projects.find(p => p.id === selectedId);
                                        if (matchProj) {
                                            const matchClient = clients.find(c => c.id === matchProj.clientId);
                                            if (matchClient) setClientName(matchClient.name);
                                        }
                                    }
                                }}>
                                    <option value="">-- Standalone Task --</option>
                                    {clientProjects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.status})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Service Type</label>
                                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={serviceType} onChange={e => setServiceType(e.target.value)}>
                                    {['Income Tax Filing', 'GST Compliance', 'Audit Assurance', 'Company Law', 'Consultancy'].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                        </>
                    )}

                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Due Date</label>
                        <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Priority</label>
                            <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={priority} onChange={e => setPriority(e.target.value)}>
                                <option>Low</option><option>Medium</option><option>High</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Assign To</label>
                            <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
                                <option value="">-- Unassigned --</option>
                                {staff.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-8 pt-6 border-t border-slate-100">
                        <button onClick={onClose} className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                        <button onClick={() => onSave({ clientName, serviceType, dueDate, priority, projectId, assignedTo })} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg active:scale-95 transition-all">Allocate</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const NewProjectModal: React.FC<{ onClose: () => void, onSave: (data: any) => void, clients: Client[] }> = ({ onClose, onSave, clients }) => {
    const [clientName, setClientName] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [budget, setBudget] = useState('');
    const [filteredClients, setFilteredClients] = useState<Client[]>([]);

    useEffect(() => {
        if (clientName) {
            const exactMatch = clients.find(c => c.name.toLowerCase() === clientName.toLowerCase() && c.name === clientName);
            if (exactMatch) {
                setFilteredClients([]);
            } else {
                setFilteredClients(clients.filter(c => c.name.toLowerCase().includes(clientName.toLowerCase())).slice(0, 5));
            }
        } else {
            setFilteredClients([]);
        }
    }, [clientName, clients]);

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <h3 className="text-lg font-black text-slate-800 mb-6">New Client Project</h3>

                <div className="space-y-4">
                    <div className="relative">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Client Entity</label>
                        <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Search client..." />
                        {filteredClients.length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl mt-1 z-50 overflow-hidden">
                                {filteredClients.map(c => (
                                    <div key={c.id} onClick={() => { setClientName(c.name); setFilteredClients([]); }} className="px-4 py-3 hover:bg-slate-50 cursor-pointer text-sm font-bold text-slate-700">
                                        {c.name} <span className="text-[10px] text-slate-400 font-normal ml-2">{c.branch}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Project Name</label>
                        <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. FY23-24 Stat Audit" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Description</label>
                        <textarea className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief scope..." />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Est. Revenue (₹)</label>
                        <input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={budget} onChange={e => setBudget(e.target.value)} placeholder="50000" />
                    </div>
                </div>

                <div className="flex gap-4 mt-8 pt-6 border-t border-slate-100">
                    <button onClick={onClose} className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                    <button onClick={() => onSave({ clientName, name, description, budget })} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg active:scale-95 transition-all">Create Project</button>
                </div>
            </div>
        </div>
    );
};


const TaskManager: React.FC<TaskManagerProps> = ({
    selectedBranch,
    currentUser,
    quickAction,
    onQuickActionHandled,
    preSelectedAssignee,
    activeTaskTimer,
    setActiveTaskTimer
}) => {
    const [activeTab, setActiveTab] = useState<'tasks' | 'projects'>('tasks');
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [assigneeFilter, setAssigneeFilter] = useState<string | null>(preSelectedAssignee || null);
    const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');
    const [textSearch, setTextSearch] = useState('');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [showAllocationModal, setShowAllocationModal] = useState(false);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [preSelectedProjectForTask, setPreSelectedProjectForTask] = useState<string | null>(null);

    useEffect(() => {
        if (quickAction === 'NEW_TASK') {
            setShowAllocationModal(true);
            onQuickActionHandled?.();
        } else if (quickAction === 'NEW_PROJECT') {
            setShowProjectModal(true);
            onQuickActionHandled?.();
        }
    }, [quickAction]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [tasksData, projectsData, clientsData] = await Promise.all([
                    api.getTasks(),
                    api.getProjects(),
                    api.getClients()
                ]);
                setTasks(tasksData);
                setProjects(projectsData);
                setClients(clientsData);
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const filteredTasks = tasks.filter(task => {
        const branchMatch = selectedBranch === BranchName.ALL || task.branch === selectedBranch;
        const roleMatch = currentUser?.role === UserRole.EMPLOYEE ? task.assignedTo === currentUser.name : (assigneeFilter ? task.assignedTo === assigneeFilter : true);
        const statusMatch = statusFilter === 'All' || task.status === statusFilter;
        const textMatch = !textSearch || task.clientName.toLowerCase().includes(textSearch.toLowerCase()) || task.serviceType.toLowerCase().includes(textSearch.toLowerCase());
        return branchMatch && roleMatch && statusMatch && textMatch;
    });

    const handleDeleteAllTasks = async () => {
        if (confirm("CRITICAL WARNING: This will delete ALL tasks/engagements from the database. This action cannot be undone. Are you sure?")) {
            try {
                await api.deleteAllTasks();
                setTasks([]);
                alert("System purged. All tasks have been removed.");
            } catch (e) {
                console.error("Failed to delete all", e);
                alert("Failed to delete tasks.");
            }
        }
    }


    const handleDeleteAllProjects = async () => {
        if (confirm("CRITICAL WARNING: This will delete ALL PROJECTS and their linked data. This cannot be undone. Are you sure?")) {
            try {
                await api.deleteAllProjects();
                setProjects([]);
                alert("Projects purged.");
            } catch (e) {
                console.error("Failed to delete projects", e);
            }
        }
    };

    const handleCreateAllocation = async (data: any) => {
        const matchedClient = clients.find(c => c.name === data.clientName);
        if (!matchedClient) { alert("Please select a valid client from the list."); return; }

        try {
            await api.createTask({
                clientName: matchedClient.name,
                clientId: matchedClient.id,
                projectId: data.projectId || undefined,
                serviceType: data.serviceType,
                dueDate: data.dueDate,
                priority: data.priority,
                status: TaskStatus.NEW,
                branch: matchedClient.branch,
                assignedTo: data.assignedTo || undefined,
                period: 'FY24-25',
                slaProgress: 0,
                totalTrackedMinutes: 0
            } as any);

            setShowAllocationModal(false);
            const updated = await api.getTasks();
            setTasks(updated);
            alert("Allocation Created Successfully");
        } catch (e: any) {
            console.error("Failed create task", e);
            alert("Failed to create allocation: " + e.message);
        }
    }


    const handleCreateProject = async (data: any) => {
        const matchedClient = clients.find(c => c.name === data.clientName);
        if (!matchedClient) { alert("Please select a valid client."); return; }

        try {
            await api.createProject({
                name: data.name,
                description: data.description,
                clientId: matchedClient.id,
                status: ProjectStatus.PLANNING, // Default
                startDate: new Date().toISOString().split('T')[0],
                branch: matchedClient.branch,
                priority: Priority.MEDIUM,
                budget: Number(data.budget) || 0,
                totalHoursTracked: 0
            } as any);

            setShowProjectModal(false);
            const updated = await api.getProjects();
            setProjects(updated);
            alert("Project Created Successfully");
        } catch (e: any) {
            console.error("Failed create project", e);
            alert("Failed to create project: " + e.message);
        }
    };

    const handleImportTasks = async (data: any[]) => {
        let successCount = 0;
        const newTasks: Partial<Task>[] = [];

        // 1. Prepare data
        for (const row of data) {
            const clientName = row['Client Name'] || row['Client'] || row['client'];
            const matchedClient = clients.find(c => c.name.toLowerCase() === (clientName || '').trim().toLowerCase());

            if (clientName && matchedClient) {
                newTasks.push({
                    clientName: matchedClient.name,
                    clientId: matchedClient.id,
                    serviceType: row['Service'] || row['service'] || 'General Advisory',
                    dueDate: row['DueDate'] || row['dueDate'] || new Date().toISOString().split('T')[0],
                    status: TaskStatus.NEW,
                    priority: (row['Priority'] || row['priority'] || 'Medium') as Priority,
                    assignedTo: row['Assignee'] || row['assignee'] || '',
                    branch: (row['Branch'] || row['branch'] || selectedBranch) as BranchName,
                    period: row['Period'] || row['period'] || 'FY24-25',
                    slaProgress: 0,
                    totalTrackedMinutes: 0
                });
            }
        }

        if (newTasks.length === 0) {
            alert("No matching clients found for import. Ensure Client names match exactly with the System Directory.");
            return;
        }

        // 2. Batch process
        const BATCH_SIZE = 500;
        const totalBatches = Math.ceil(newTasks.length / BATCH_SIZE);

        // Show loading via a temporary alert or better UI (using window.confirm for now to block or simple logic)
        // Ideally use a loading state, but for quick fix:
        console.log(`Starting import of ${newTasks.length} tasks in ${totalBatches} batches...`);

        try {
            for (let i = 0; i < newTasks.length; i += BATCH_SIZE) {
                const batch = newTasks.slice(i, i + BATCH_SIZE);
                await api.createTasksBatch(batch as any);
                successCount += batch.length;
                console.log(`Processed batch ${Math.floor(i / BATCH_SIZE) + 1}/${totalBatches}`);
            }

            // Refresh tasks
            const updatedTasks = await api.getTasks();
            setTasks(updatedTasks);
            alert(`Successfully imported and linked ${successCount} tasks to existing clients.`);
        } catch (e: any) {
            console.error("Batch import failed", e);
            alert(`Import failed partially. Processed ${successCount} tasks before error: ${e.message}`);
        }
    };

    const getProjectProgress = (projectId: string) => {
        const projectTasks = tasks.filter(t => t.projectId === projectId);
        if (projectTasks.length === 0) return 0;
        const completed = projectTasks.filter(t => t.status === TaskStatus.COMPLETED || t.status === TaskStatus.FILED).length;
        return Math.round((completed / projectTasks.length) * 100);
    };

    if (selectedProject) {
        return (
            <ProjectDetailView
                project={selectedProject}
                tasks={tasks.filter(t => t.projectId === selectedProject.id)}
                onBack={() => setSelectedProject(null)}
                onTaskClick={setSelectedTask}
                currentUser={currentUser}
                activeTaskTimer={activeTaskTimer}
                onNewTask={() => {
                    setPreSelectedProjectForTask(selectedProject.id);
                    setShowAllocationModal(true);
                }}
            />
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-50 overflow-hidden relative">
            {showAllocationModal && <NewAllocationModal
                onClose={() => { setShowAllocationModal(false); setPreSelectedProjectForTask(null); }}
                onSave={handleCreateAllocation}
                clients={clients}
                projects={projects}
                staff={MOCK_STAFF.map(s => s.name)}
                preSelectedProjectId={preSelectedProjectForTask}
            />}
            {showProjectModal && <NewProjectModal onClose={() => setShowProjectModal(false)} onSave={handleCreateProject} clients={clients} />}
            {loading && <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>}
            <div className="p-6 bg-white border-b border-slate-200 shrink-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">{activeTab === 'projects' ? 'Projects Portfolio' : 'Tasks Board'}</h2>
                        <p className="text-slate-500 text-sm font-medium">Precisely audit staff effort across all client portfolios.</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="bg-slate-100 border border-slate-200 rounded-xl p-1 flex shadow-sm">
                            <button onClick={() => setActiveTab('tasks')} className={`px-5 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'tasks' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Tasks</button>
                            <button onClick={() => setActiveTab('projects')} className={`px-5 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'projects' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Projects</button>
                        </div>

                        {activeTab === 'tasks' && tasks.length > 0 && (
                            <button onClick={handleDeleteAllTasks} className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-100 border border-red-100 flex items-center gap-2"><Trash2 size={16} /> Purge Tasks</button>
                        )}
                        {activeTab === 'projects' && projects.length > 0 && (
                            <button onClick={handleDeleteAllProjects} className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-100 border border-red-100 flex items-center gap-2"><Trash2 size={16} /> Purge Projects</button>
                        )}
                        <ExcelImporter
                            onImport={handleImportTasks}
                        />

                        {activeTab === 'tasks' ? (
                            <button onClick={() => { setPreSelectedProjectForTask(null); setShowAllocationModal(true); }} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 shadow-xl transition-all active:scale-95"><Plus size={16} strokeWidth={3} /> New Task</button>
                        ) : (
                            <button onClick={() => setShowProjectModal(true)} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 shadow-xl transition-all active:scale-95"><Plus size={16} strokeWidth={3} /> New Project</button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Search by service, staff or entity..." value={textSearch} onChange={(e) => setTextSearch(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm" /></div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <select className="flex-1 md:flex-none px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-indigo-500 outline-none" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}><option value="All">All Workflow States</option>{Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}</select>
                        <div className="bg-slate-100 rounded-2xl p-1 flex">
                            <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-xl transition-all ${viewMode === 'kanban' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><LayoutGrid size={20} /></button>
                            <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><List size={20} /></button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'tasks' ? (
                    <div className="h-full overflow-y-auto p-6 min-h-0 relative">
                        <TaskBoard tasks={filteredTasks} viewMode={viewMode} onTaskClick={setSelectedTask} activeTaskTimer={activeTaskTimer} />
                    </div>
                ) : (
                    <div className="h-full overflow-y-auto p-6 min-h-0 relative">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                            {projects.map(project => (
                                <ProjectCard key={project.id} project={project} progress={getProjectProgress(project.id)} onClick={() => setSelectedProject(project)} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {
                selectedTask && (
                    <PerformTaskModal
                        task={selectedTask}
                        onClose={() => setSelectedTask(null)}
                        onUpdate={(updated) => setTasks(tasks.map(t => t.id === updated.id ? updated : t))}
                        activeTaskTimer={activeTaskTimer}
                        setActiveTaskTimer={setActiveTaskTimer}
                        currentUser={currentUser}
                    />
                )
            }
        </div >
    );
};
export default TaskManager;

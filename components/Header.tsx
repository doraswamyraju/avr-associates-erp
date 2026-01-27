import React, { useEffect, useState } from 'react';
import { Menu, Bell, Search, ChevronDown, Building2, LogOut, Clock, PlayCircle, StopCircle, Target } from 'lucide-react';
import { BranchName, User, UserRole, Task } from '../types';

interface HeaderProps {
    selectedBranch: BranchName;
    setSelectedBranch: (branch: BranchName) => void;
    toggleSidebar: () => void;
    user: User;
    onLogout: () => void;
    onClockIn: () => void;
    onClockOut: () => void;
    activeTaskTimer?: {task: Task, startTime: Date} | null;
}

const Header: React.FC<HeaderProps> = ({ selectedBranch, setSelectedBranch, toggleSidebar, user, onLogout, onClockIn, onClockOut, activeTaskTimer }) => {
    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    const [taskElapsedTime, setTaskElapsedTime] = useState('00:00');

    // Attendance Timer
    useEffect(() => {
        let interval: any;
        if (user.role === UserRole.EMPLOYEE && user.isClockedIn && user.clockInTime) {
            interval = setInterval(() => {
                const now = new Date();
                const diff = now.getTime() - user.clockInTime!.getTime();
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setElapsedTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            }, 1000);
        } else {
            setElapsedTime('00:00:00');
        }
        return () => clearInterval(interval);
    }, [user.isClockedIn, user.clockInTime, user.role]);

    // Task Stopwatch
    useEffect(() => {
        let taskInterval: any;
        if (activeTaskTimer) {
            taskInterval = setInterval(() => {
                const diff = new Date().getTime() - activeTaskTimer.startTime.getTime();
                const mins = Math.floor(diff / 60000);
                const secs = Math.floor((diff % 60000) / 1000);
                setTaskElapsedTime(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
            }, 1000);
        }
        return () => clearInterval(taskInterval);
    }, [activeTaskTimer]);

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
            <div className="flex items-center gap-4">
                <button onClick={toggleSidebar} className="p-2 hover:bg-slate-100 rounded-md lg:hidden text-slate-600"><Menu size={20} /></button>
                {(user.role === UserRole.ADMIN || !user.role) && (
                    <div className="relative group hidden sm:block">
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-md text-sm font-medium text-slate-700 transition-colors">
                            <Building2 size={16} className="text-indigo-600" />
                            <span>{selectedBranch}</span>
                            <ChevronDown size={14} className="text-slate-400" />
                        </button>
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-100 py-1 hidden group-hover:block z-50">
                            {Object.values(BranchName).map((branch) => (
                                <button key={branch} onClick={() => setSelectedBranch(branch)} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${selectedBranch === branch ? 'text-indigo-600 font-medium' : 'text-slate-700'}`}>{branch}</button>
                            ))}
                        </div>
                    </div>
                )}
                {user.role === UserRole.EMPLOYEE && (
                    <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
                        <Building2 size={14} className="text-indigo-600" />{user.branch} Branch
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3 lg:gap-6">
                {/* Active Task Tracking Display */}
                {activeTaskTimer && (
                    <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 bg-indigo-900 text-white rounded-2xl animate-pulse">
                        <Target size={14} className="text-indigo-400" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase leading-none opacity-70">Tracking: {activeTaskTimer.task.serviceType}</span>
                            <span className="text-xs font-mono font-black">{taskElapsedTime}</span>
                        </div>
                    </div>
                )}

                {user.role === UserRole.EMPLOYEE && (
                    <div className="flex items-center gap-3">
                        {user.isClockedIn ? (
                            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-full px-1 py-1 pr-4 transition-all">
                                <button onClick={onClockOut} className="p-1.5 bg-white rounded-full text-red-500 shadow-sm hover:bg-red-50 transition-colors" title="Clock Out"><StopCircle size={20} /></button>
                                <div className="flex flex-col leading-none">
                                    <span className="text-[10px] font-bold text-green-700 uppercase tracking-wide">On Duty</span>
                                    <span className="font-mono text-sm font-medium text-green-800 w-16">{elapsedTime}</span>
                                </div>
                            </div>
                        ) : (
                            <button onClick={onClockIn} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-semibold hover:bg-indigo-700 shadow-md">
                                <PlayCircle size={18} />Clock In
                            </button>
                        )}
                    </div>
                )}

                <div className="relative hidden md:block">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Global search..." className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 transition-all focus:w-64" />
                </div>

                <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full"><Bell size={20} /><span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span></button>

                <div className="flex items-center gap-3 border-l border-slate-200 pl-3 lg:pl-6 group relative cursor-pointer">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-slate-800">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.role}</p>
                    </div>
                    <img src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} alt="User" className="w-9 h-9 rounded-full border-2 border-white shadow-sm" />
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 py-1 hidden group-hover:block z-50">
                        <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><LogOut size={16} /> Sign Out</button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
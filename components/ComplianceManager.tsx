import React, { useState } from 'react';
import { MOCK_COMPLIANCE_EVENTS } from '../constants';
import { BranchName } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ComplianceManagerProps {
    selectedBranch: BranchName;
}

const ComplianceManager: React.FC<ComplianceManagerProps> = ({ selectedBranch }) => {
    // Mocking June 2024 View
    const [currentMonth, setCurrentMonth] = useState(new Date(2024, 5, 1)); // June 2024 (Month is 0-indexed)
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay(); // 0 = Sunday

    const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Helper to get formatted date string YYYY-MM-DD
    const getDateString = (day: number) => {
        return `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    const getEventsForDate = (dateStr: string) => {
        return MOCK_COMPLIANCE_EVENTS.filter(e => e.dueDate === dateStr);
    };

    const renderCalendarGrid = () => {
        const days = [];
        // Empty slots for previous month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="h-24 bg-slate-50 border border-slate-100/50"></div>);
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = getDateString(day);
            const events = getEventsForDate(dateStr);
            const isToday = day === 12; // Mock "Today" as June 12th
            const isSelected = selectedDate === dateStr;

            days.push(
                <div 
                    key={day} 
                    onClick={() => setSelectedDate(dateStr)}
                    className={`h-24 border border-slate-100 p-2 relative cursor-pointer transition-colors hover:bg-slate-50 ${isToday ? 'bg-indigo-50/30' : 'bg-white'} ${isSelected ? 'ring-2 ring-indigo-500 z-10' : ''}`}
                >
                    <div className="flex justify-between items-start">
                        <span className={`text-sm font-medium ${isToday ? 'bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-700'}`}>
                            {day}
                        </span>
                        {events.length > 0 && (
                            <span className="text-xs font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-100">
                                {events.length} Due
                            </span>
                        )}
                    </div>
                    <div className="mt-2 space-y-1">
                        {events.map(ev => (
                            <div key={ev.id} className="text-[10px] truncate bg-amber-50 text-amber-800 px-1 py-0.5 rounded border border-amber-100">
                                {ev.title}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return days;
    };

    return (
        <div className="p-6 h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-6">
            {/* Calendar Section */}
            <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <CalendarIcon size={20} className="text-indigo-600" />
                            Statutory Compliance Calendar
                        </h2>
                        <span className="text-sm text-slate-500 font-medium px-3 py-1 bg-white border border-slate-200 rounded-full">
                            {monthName}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-500 transition-all">
                            <ChevronLeft size={20} />
                        </button>
                        <button className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-500 transition-all">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
                
                {/* Weekday Header */}
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 overflow-y-auto">
                    {renderCalendarGrid()}
                </div>
            </div>

            {/* Sidebar / Details Panel */}
            <div className="w-full lg:w-96 flex flex-col gap-6">
                
                {/* Selected Date Details */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center justify-between">
                        <span>Upcoming Deadlines</span>
                        {selectedDate && <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded">{selectedDate}</span>}
                    </h3>
                    
                    <div className="space-y-4">
                        {(selectedDate ? getEventsForDate(selectedDate) : MOCK_COMPLIANCE_EVENTS).slice(0, 5).map(event => (
                            <div key={event.id} className="border border-slate-100 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-semibold text-slate-800 text-sm">{event.title}</p>
                                        <p className="text-xs text-slate-500">{event.type} • {event.dueDate}</p>
                                    </div>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${
                                        event.type === 'GST' ? 'bg-indigo-500' : 
                                        event.type === 'Income Tax' ? 'bg-emerald-500' : 'bg-amber-500'
                                    }`}>
                                        {event.type.substring(0, 2)}
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600 mb-3">{event.description}</p>
                                
                                {/* Progress Bar */}
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-500">Filing Status</span>
                                        <span className="font-medium text-slate-700">{event.filingStatus.filed} / {event.filingStatus.total} Clients</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${
                                                (event.filingStatus.filed / event.filingStatus.total) > 0.8 ? 'bg-green-500' : 
                                                (event.filingStatus.filed / event.filingStatus.total) > 0.4 ? 'bg-amber-500' : 'bg-red-500'
                                            }`} 
                                            style={{ width: `${(event.filingStatus.filed / event.filingStatus.total) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {MOCK_COMPLIANCE_EVENTS.length === 0 && (
                        <div className="text-center py-8 text-slate-400">
                            <CheckCircle2 size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No upcoming deadlines.</p>
                        </div>
                    )}
                </div>

                {/* Quick Stats */}
                <div className="bg-indigo-900 rounded-xl shadow-sm p-5 text-white">
                    <h4 className="font-medium text-indigo-100 mb-4">Compliance Health</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                            <p className="text-2xl font-bold">92%</p>
                            <p className="text-xs text-indigo-200">GST Filed</p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                            <p className="text-2xl font-bold text-amber-300">12%</p>
                            <p className="text-xs text-indigo-200">ITR Started</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComplianceManager;
import React from 'react';
import { LayoutDashboard, Users, FileText, Calendar, CreditCard, PieChart, Briefcase, LogOut, Shield, UserCog, ClipboardList, UserCheck } from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    userRole: UserRole;
    onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, setIsOpen, userRole, onLogout }) => {
    
    // Define all possible items with role access control
    const allMenuItems = [
        { id: 'dashboard',  label: 'Dashboard',          icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
        { id: 'tasks',      label: 'Projects & Tasks',    icon: FileText,        roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
        { id: 'incoming',   label: 'Incoming Register',   icon: ClipboardList,   roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
        { id: 'visitors',   label: 'Visitor Register',    icon: UserCheck,       roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
        { id: 'clients',    label: 'Clients',             icon: Users,           roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
        { id: 'staff',      label: 'Staff Directory',     icon: UserCog,         roles: [UserRole.ADMIN] },
        { id: 'compliance', label: 'Compliance',          icon: Calendar,        roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
        { id: 'services',   label: 'Service Catalogue',   icon: Briefcase,       roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
        { id: 'billing',    label: 'Billing & Accounts',  icon: CreditCard,      roles: [UserRole.ADMIN] },
        { id: 'reports',    label: 'Reports & Analytics', icon: PieChart,        roles: [UserRole.ADMIN] },
    ];

    const visibleItems = allMenuItems.filter(item => item.roles.includes(userRole));

    return (
        <>
            {/* Mobile Overlay */}
            <div 
                className={`fixed inset-0 bg-black/50 z-20 lg:hidden ${isOpen ? 'block' : 'hidden'}`}
                onClick={() => setIsOpen(false)}
            />

            {/* Sidebar */}
            <div className={`fixed lg:static inset-y-0 left-0 z-30 bg-slate-900 text-white transform transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 flex flex-col h-full shadow-2xl overflow-hidden group w-64 lg:w-20 lg:hover:w-64`}>
                
                {/* Logo Area */}
                <div className="h-16 flex items-center gap-4 px-6 border-b border-slate-800 bg-slate-900 shrink-0 whitespace-nowrap">
                    <div className="p-2 bg-indigo-600 rounded-lg shrink-0 flex items-center justify-center">
                        <Shield size={18} className="text-white" />
                    </div>
                    <div className="transition-opacity duration-300 lg:opacity-0 lg:group-hover:opacity-100 flex flex-col justify-center">
                        <h1 className="font-bold text-base tracking-tight leading-tight">AVR Associates</h1>
                        <p className="text-slate-400 text-[9px] uppercase tracking-wider leading-tight">ERP System</p>
                    </div>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 py-6 px-3 lg:px-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
                    {visibleItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-4 px-3 lg:px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                                activeTab === item.id 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                        >
                            <item.icon size={18} className="shrink-0 ml-0.5" />
                            <span className="transition-opacity duration-300 lg:opacity-0 lg:group-hover:opacity-100">{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* Footer / Logout */}
                <div className="p-4 border-t border-slate-800 whitespace-nowrap">
                    <button 
                        onClick={onLogout}
                        className="w-full flex items-center gap-4 px-3 lg:px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                    >
                        <LogOut size={18} className="shrink-0 ml-0.5" />
                        <span className="transition-opacity duration-300 lg:opacity-0 lg:group-hover:opacity-100">Sign Out</span>
                    </button>
                    <p className="text-[10px] text-center text-slate-600 mt-4 transition-opacity duration-300 lg:opacity-0 lg:group-hover:opacity-100">v1.0.3 • © 2024 AVR</p>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
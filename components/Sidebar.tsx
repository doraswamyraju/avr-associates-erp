import React from 'react';
import { LayoutDashboard, Users, FileText, Calendar, CreditCard, PieChart, Briefcase, LogOut, Shield, UserCog } from 'lucide-react';
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
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
        { id: 'tasks', label: 'Projects & Tasks', icon: FileText, roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
        { id: 'clients', label: 'Clients', icon: Users, roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
        { id: 'staff', label: 'Staff Directory', icon: UserCog, roles: [UserRole.ADMIN] }, // Admin Only
        { id: 'compliance', label: 'Compliance', icon: Calendar, roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
        { id: 'services', label: 'Service Catalogue', icon: Briefcase, roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
        { id: 'billing', label: 'Billing & Accounts', icon: CreditCard, roles: [UserRole.ADMIN] }, // Admin Only
        { id: 'reports', label: 'Reports & Analytics', icon: PieChart, roles: [UserRole.ADMIN] }, // Admin Only
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
            <div className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 flex flex-col h-full shadow-xl`}>
                
                {/* Logo Area */}
                <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 bg-slate-900">
                    <div className="p-1.5 bg-indigo-600 rounded-lg">
                        <Shield size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg tracking-tight">AVR Associates</h1>
                        <p className="text-slate-400 text-[10px] uppercase tracking-wider">ERP System</p>
                    </div>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                    {visibleItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                activeTab === item.id 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* Footer / Logout */}
                <div className="p-4 border-t border-slate-800">
                    <button 
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                    <p className="text-[10px] text-center text-slate-600 mt-4">v1.0.3 • © 2024 AVR</p>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
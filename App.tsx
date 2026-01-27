import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ClientManager from './components/ClientManager';
import ClientPortal from './components/ClientPortal';
import TaskManager from './components/TaskManager';
import BillingManager from './components/BillingManager';
import ComplianceManager from './components/ComplianceManager';
import ReportsAnalytics from './components/ReportsAnalytics';
import ServiceCatalogue from './components/ServiceCatalogue';
import StaffManager from './components/StaffManager';
import LoginPage from './components/LoginPage';
import { BranchName, User, UserRole, Task } from './types';
import { MOCK_CLIENTS } from './constants';
import { Hammer, Plus, UserPlus, FileText, Briefcase, CreditCard, UserCog } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedBranch, setSelectedBranch] = useState<BranchName>(BranchName.ALL);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Task-wise Timer Global State
  const [activeTaskTimer, setActiveTaskTimer] = useState<{task: Task, startTime: Date} | null>(null);

  // Navigation Params state
  const [pageParams, setPageParams] = useState<any>(null);

  // Quick Action State
  const [quickAction, setQuickAction] = useState<string | null>(null);
  const [isFabOpen, setIsFabOpen] = useState(false);

  // Clock In State
  const handleClockIn = () => {
    if (user) {
      setUser({ ...user, isClockedIn: true, clockInTime: new Date() });
    }
  };

  const handleClockOut = () => {
    if (user) {
      setUser({ ...user, isClockedIn: false, clockInTime: undefined });
      // Also stop task timer if running
      setActiveTaskTimer(null);
    }
  };

  const handleQuickAction = (action: string) => {
    if (action === 'NEW_CLIENT') setActiveTab('clients');
    if (action === 'NEW_TASK' || action === 'NEW_PROJECT') setActiveTab('tasks');
    if (action === 'NEW_INVOICE') setActiveTab('billing');
    if (action === 'NEW_EMPLOYEE') setActiveTab('staff');
    
    setQuickAction(action);
    setIsFabOpen(false);
  };

  const resetQuickAction = () => setQuickAction(null);

  const handleNavigation = (tab: string, params?: any) => {
    if (params) {
        setPageParams(params);
    }
    setActiveTab(tab);
  };

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  if (user.role === UserRole.CLIENT) {
    const clientData = MOCK_CLIENTS.find(c => c.id === user.clientId);
    if (!clientData) return <div className="p-20 text-center">Client profile not found.</div>;
    return <ClientPortal client={clientData} onLogout={() => setUser(null)} />;
  }

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard selectedBranch={selectedBranch} userRole={user.role} onNavigate={handleNavigation} />;
      case 'clients':
        return <ClientManager selectedBranch={selectedBranch} quickAction={quickAction} onQuickActionHandled={resetQuickAction} />;
      case 'tasks':
        return (
            <TaskManager 
                selectedBranch={selectedBranch} 
                currentUser={user} 
                quickAction={quickAction} 
                onQuickActionHandled={resetQuickAction}
                preSelectedAssignee={pageParams?.assignee}
                activeTaskTimer={activeTaskTimer}
                setActiveTaskTimer={setActiveTaskTimer}
            />
        );
      case 'billing':
        return <BillingManager selectedBranch={selectedBranch} quickAction={quickAction} onQuickActionHandled={resetQuickAction} />;
      case 'compliance':
        return <ComplianceManager selectedBranch={selectedBranch} />;
      case 'reports':
        return <ReportsAnalytics selectedBranch={selectedBranch} />;
      case 'services':
        return <ServiceCatalogue selectedBranch={selectedBranch} />;
      case 'staff':
        return <StaffManager selectedBranch={selectedBranch} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Hammer size={64} className="mb-4 text-slate-300" />
            <h2 className="text-2xl font-bold text-slate-600 uppercase tracking-widest">Under Construction</h2>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative font-sans antialiased">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        userRole={user.role}
        onLogout={() => setUser(null)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header 
          selectedBranch={selectedBranch} 
          setSelectedBranch={setSelectedBranch} 
          toggleSidebar={toggleSidebar}
          user={user}
          onLogout={() => setUser(null)}
          onClockIn={handleClockIn}
          onClockOut={handleClockOut}
          activeTaskTimer={activeTaskTimer}
        />

        <main className="flex-1 overflow-hidden relative">
          {renderContent()}
        </main>

        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">
            {isFabOpen && (
                <div className="flex flex-col gap-3 animate-in slide-in-from-bottom-4 duration-300">
                     <button onClick={() => handleQuickAction('NEW_EMPLOYEE')} className="flex items-center gap-3 bg-white text-slate-700 px-5 py-2.5 rounded-2xl shadow-2xl border border-slate-100 hover:bg-indigo-50 transition-all hover:-translate-y-1">
                        <span className="text-xs font-black uppercase tracking-widest">Register Employee</span>
                        <div className="p-2 bg-pink-100 text-pink-600 rounded-xl"><UserCog size={16} /></div>
                    </button>
                    <button onClick={() => handleQuickAction('NEW_INVOICE')} className="flex items-center gap-3 bg-white text-slate-700 px-5 py-2.5 rounded-2xl shadow-2xl border border-slate-100 hover:bg-indigo-50 transition-all hover:-translate-y-1">
                        <span className="text-xs font-black uppercase tracking-widest">Raise Invoice</span>
                        <div className="p-2 bg-green-100 text-green-600 rounded-xl"><CreditCard size={16} /></div>
                    </button>
                    <button onClick={() => handleQuickAction('NEW_PROJECT')} className="flex items-center gap-3 bg-white text-slate-700 px-5 py-2.5 rounded-2xl shadow-2xl border border-slate-100 hover:bg-indigo-50 transition-all hover:-translate-y-1">
                        <span className="text-xs font-black uppercase tracking-widest">Initiate Project</span>
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><Briefcase size={16} /></div>
                    </button>
                    <button onClick={() => handleQuickAction('NEW_TASK')} className="flex items-center gap-3 bg-white text-slate-700 px-5 py-2.5 rounded-2xl shadow-2xl border border-slate-100 hover:bg-indigo-50 transition-all hover:-translate-y-1">
                        <span className="text-xs font-black uppercase tracking-widest">Assign Task</span>
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-xl"><FileText size={16} /></div>
                    </button>
                    <button onClick={() => handleQuickAction('NEW_CLIENT')} className="flex items-center gap-3 bg-white text-slate-700 px-5 py-2.5 rounded-2xl shadow-2xl border border-slate-100 hover:bg-indigo-50 transition-all hover:-translate-y-1">
                        <span className="text-xs font-black uppercase tracking-widest">Onboard Client</span>
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-xl"><UserPlus size={16} /></div>
                    </button>
                </div>
            )}
            <button onClick={() => setIsFabOpen(!isFabOpen)} className={`w-16 h-16 rounded-[2rem] shadow-2xl flex items-center justify-center text-white transition-all duration-500 hover:scale-110 active:scale-95 ${isFabOpen ? 'bg-slate-900 rotate-[135deg]' : 'bg-indigo-600'}`}>
                <Plus size={32} strokeWidth={2.5} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default App;
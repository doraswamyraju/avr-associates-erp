import { BranchName, Client, Task, TaskStatus, Priority, Invoice, Staff, ServiceItem, ComplianceEvent, Appointment, ClientDocument, Project, ProjectStatus, TaskHistoryLog } from './types';

export const MOCK_CLIENTS: Client[] = [
    { id: 'C001', name: 'Sri Venkateswara Traders', pan: 'ABCDE1234F', type: 'Partnership', branch: BranchName.RAVULAPALEM, phone: '9876543210', email: 'svt@example.com', status: 'Active' },
    { id: 'C002', name: 'Krishna & Co.', pan: 'FGHIJ5678K', type: 'Company', branch: BranchName.AMALAPURAM, phone: '9988776655', email: 'acc@krishna.com', status: 'Active' },
    { id: 'C003', name: 'Ravi Kumar V', pan: 'KLMNO9012P', type: 'Individual', branch: BranchName.ATREYAPURAM, phone: '9123456789', email: 'ravi@gmail.com', status: 'Active' },
    { id: 'C004', name: 'Versatile Tech Solutions', pan: 'PQRST3456T', type: 'LLP', branch: BranchName.VERSATILE, phone: '8877665544', email: 'info@versatile.tech', status: 'Active' },
    { id: 'C005', name: 'Lakshmi Textiles', pan: 'UVWXY7890Z', type: 'Partnership', branch: BranchName.RAVULAPALEM, phone: '7766554433', email: 'lt@example.com', status: 'Inactive' },
];

export const MOCK_PROJECTS: Project[] = [
    {
        id: 'PRJ-001',
        name: 'Internal Financial Audit FY 23-24',
        description: 'Complete internal audit including stock verification and ledger scrutiny.',
        clientId: 'C002',
        clientName: 'Krishna & Co.',
        status: ProjectStatus.IN_PROGRESS,
        startDate: '2024-05-01',
        dueDate: '2024-07-30',
        manager: 'Suresh K',
        branch: BranchName.AMALAPURAM,
        priority: Priority.HIGH,
        budget: 50000,
        totalHoursTracked: 45
    },
    {
        id: 'PRJ-002',
        name: 'Company Incorporation & Setup',
        description: 'End-to-end setup for new subsidiary including PAN, TAN, GST, and ROC.',
        clientId: 'C004',
        clientName: 'Versatile Tech Solutions',
        status: ProjectStatus.PLANNING,
        startDate: '2024-06-15',
        dueDate: '2024-08-15',
        manager: 'Priya D',
        branch: BranchName.VERSATILE,
        priority: Priority.MEDIUM,
        budget: 25000,
        totalHoursTracked: 0
    }
];

export const MOCK_TASKS: Task[] = [
    { id: 'T001', clientId: 'C001', clientName: 'Sri Venkateswara Traders', serviceType: 'GSTR-3B', period: 'May 2024', dueDate: '2024-06-20', status: TaskStatus.COMPLETED, assignedTo: 'Suresh K', priority: Priority.HIGH, branch: BranchName.RAVULAPALEM, slaProgress: 100, totalTrackedMinutes: 120 },
    { id: 'T002', clientId: 'C001', clientName: 'Sri Venkateswara Traders', serviceType: 'TDS 24Q', period: 'Q1 24-25', dueDate: '2024-07-31', status: TaskStatus.IN_PROGRESS, assignedTo: 'Ramesh M', priority: Priority.MEDIUM, branch: BranchName.RAVULAPALEM, slaProgress: 45, totalTrackedMinutes: 450 },
    { id: 'T003', clientId: 'C002', clientName: 'Krishna & Co.', projectId: 'PRJ-001', serviceType: 'Tax Audit', period: 'FY 23-24', dueDate: '2024-09-30', status: TaskStatus.NEW, assignedTo: 'Priya D', priority: Priority.HIGH, branch: BranchName.AMALAPURAM, slaProgress: 0, totalTrackedMinutes: 0 },
    { id: 'T004', clientId: 'C003', clientName: 'Ravi Kumar V', serviceType: 'ITR-1', period: 'AY 24-25', dueDate: '2024-07-31', status: TaskStatus.PENDING_CLIENT, assignedTo: 'Anil B', priority: Priority.LOW, branch: BranchName.ATREYAPURAM, slaProgress: 20, totalTrackedMinutes: 60 },
    { id: 'T005', clientId: 'C004', clientName: 'Versatile Tech Solutions', projectId: 'PRJ-002', serviceType: 'GSTR-1', period: 'May 2024', dueDate: '2024-06-11', status: TaskStatus.OVERDUE, assignedTo: 'Mahesh B', priority: Priority.HIGH, branch: BranchName.VERSATILE, slaProgress: 100, totalTrackedMinutes: 180 },
    { id: 'T007', clientId: 'C002', clientName: 'Krishna & Co.', projectId: 'PRJ-001', serviceType: 'GSTR-3B', period: 'May 2024', dueDate: '2024-06-20', status: TaskStatus.REVIEW, assignedTo: 'Priya D', priority: Priority.HIGH, branch: BranchName.AMALAPURAM, slaProgress: 80, totalTrackedMinutes: 95 },
];

export const MOCK_STAFF: Staff[] = [
    { id: 'S001', name: 'Suresh K', role: 'Senior Accountant', branch: BranchName.RAVULAPALEM, email: 'suresh@avr.com', avatarUrl: 'https://picsum.photos/40/40?random=1', isClockedIn: true, hourlyRate: 500, mtdTrackedHours: 168 },
    { id: 'S002', name: 'Priya D', role: 'Branch Manager', branch: BranchName.AMALAPURAM, email: 'priya@avr.com', avatarUrl: 'https://picsum.photos/40/40?random=2', isClockedIn: true, hourlyRate: 800, mtdTrackedHours: 152 },
    { id: 'S003', name: 'Mahesh B', role: 'Article Assistant', branch: BranchName.VERSATILE, email: 'mahesh@avr.com', avatarUrl: 'https://picsum.photos/40/40?random=3', isClockedIn: false, hourlyRate: 200, mtdTrackedHours: 120 },
];

export const SERVICE_TYPES = [
    'GST RETURNS', 'INCOME TAX', 'TDS', 'ROC/COMPANY LAW', 'TAX AUDIT', 'PROJECT REPORTS', 'ACCOUNTING', 'PAYROLL/PF/ESI'
];

export const MOCK_SERVICES: ServiceItem[] = [
    { id: 'SRV-001', name: 'GST Registration', category: 'GST', standardFee: 2500, description: 'New GST Registration for Proprietorship/Partnership.', documentsRequired: ['PAN', 'Aadhar', 'Rent Agreement', 'Electricity Bill'] },
    { id: 'SRV-002', name: 'GSTR-3B Filing', category: 'GST', standardFee: 1000, description: 'Monthly summary return filing.', documentsRequired: ['Sales Data', 'Purchase Data'] },
    { id: 'SRV-003', name: 'ITR-1 Filing', category: 'Income Tax', standardFee: 1500, description: 'Salaried individuals with income up to 50 Lakhs.', documentsRequired: ['Form 16', 'Bank Statements'] },
];

export const MOCK_COMPLIANCE_EVENTS: ComplianceEvent[] = [
    { id: 'EVT-001', title: 'GSTR-1 (Monthly)', dueDate: '2024-06-11', type: 'GST', description: 'Outward supplies for May 2024', filingStatus: { total: 45, filed: 42 } },
];

export const MOCK_APPOINTMENTS: Appointment[] = [
    { id: 'APT-001', clientId: 'C001', clientName: 'Sri Venkateswara Traders', date: '2024-06-15', time: '10:30', type: 'Consultation', status: 'Scheduled', notes: 'Discuss annual tax planning' },
];

export const MOCK_DOCUMENTS: ClientDocument[] = [
    { id: 'DOC-001', clientId: 'C001', name: 'Sales_Register_May.pdf', type: 'PDF', uploadDate: '2024-06-10', status: 'Verified' },
];

export const MOCK_TASK_HISTORY: TaskHistoryLog[] = [
    { id: 'H001', taskId: 'T001', action: 'Created', details: 'Task created automatically', performedBy: 'System', timestamp: '2024-05-20 09:00 AM' },
    { id: 'H003', taskId: 'T001', action: 'Time Log', details: 'Clocked 2h 30m on drafting', performedBy: 'Suresh K', timestamp: '2024-06-01 10:15 AM' },
];

export const MOCK_INVOICES: Invoice[] = [
    { id: 'INV-1023', clientId: 'C001', clientName: 'Sri Venkateswara Traders', date: '2024-06-01', amount: 15000, status: 'Paid', items: ['Retainer Fee - May', 'GSTR-3B Filing'] },
];
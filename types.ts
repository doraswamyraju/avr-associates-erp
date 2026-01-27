export enum TaskStatus {
    NEW = 'New',
    IN_PROGRESS = 'In Progress',
    PENDING_CLIENT = 'Pending Client',
    REVIEW = 'Under Review',
    FILED = 'Filed',
    COMPLETED = 'Completed',
    OVERDUE = 'Overdue'
}

export enum ProjectStatus {
    PLANNING = 'Planning',
    IN_PROGRESS = 'In Progress',
    ON_HOLD = 'On Hold',
    COMPLETED = 'Completed',
    ARCHIVED = 'Archived'
}

export enum Priority {
    HIGH = 'High',
    MEDIUM = 'Medium',
    LOW = 'Low'
}

export enum BranchName {
    RAVULAPALEM = 'Ravulapalem',
    ATREYAPURAM = 'Atreyapuram',
    AMALAPURAM = 'Amalapuram',
    VERSATILE = 'Versatile',
    ALL = 'All Branches'
}

export enum UserRole {
    ADMIN = 'Admin',
    EMPLOYEE = 'Employee',
    CLIENT = 'Client'
}

export interface User {
    id: string;
    name: string;
    role: UserRole;
    avatar?: string;
    clientId?: string; 
    branch?: BranchName;
    isClockedIn?: boolean;
    clockInTime?: Date;
}

export interface Client {
    id: string;
    name: string;
    pan: string;
    gstin?: string;
    type: 'Individual' | 'Company' | 'Partnership' | 'LLP';
    branch: BranchName;
    phone: string;
    email: string;
    status: 'Active' | 'Inactive';
    group?: string;
    tradeName?: string;
    dob?: string;
    address?: string;
    city?: string;
    pincode?: string;
    state?: string;
    fileNumber?: string;
    bankAccountNo?: string;
    bankName?: string;
    ifscCode?: string;
    referBy?: string;
    selectedServices?: string[];
    serviceDetails?: Record<string, any>;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    clientId: string;
    clientName: string;
    status: ProjectStatus;
    startDate: string;
    dueDate: string;
    manager: string;
    branch: BranchName;
    priority: Priority;
    budget?: number;
    totalHoursTracked?: number;
}

export interface TimeLogEntry {
    id: string;
    taskId: string;
    staffId: string;
    staffName: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    description: string;
}

export interface Task {
    id: string;
    clientId: string;
    clientName: string;
    projectId?: string;
    serviceType: string;
    period: string;
    dueDate: string;
    status: TaskStatus;
    assignedTo: string;
    priority: Priority;
    branch: BranchName;
    slaProgress: number;
    totalTrackedMinutes: number;
    timeLogs?: TimeLogEntry[];
}

export interface TaskHistoryLog {
    id: string;
    taskId: string;
    action: 'Status Change' | 'Assignment' | 'Comment' | 'Created' | 'Upload' | 'Time Log';
    details: string;
    performedBy: string;
    timestamp: string;
}

export interface Invoice {
    id: string;
    clientId: string;
    clientName: string;
    date: string;
    amount: number;
    status: 'Paid' | 'Unpaid' | 'Overdue';
    items: string[];
}

export interface Staff {
    id: string;
    name: string;
    role: string;
    branch: BranchName;
    avatarUrl: string;
    email?: string;
    isClockedIn?: boolean;
    hourlyRate: number; // For project profitability
    mtdTrackedHours: number; // For payroll management
}

export interface KPI {
    title: string;
    value: string | number;
    change?: string;
    trend: 'up' | 'down' | 'neutral';
    iconName: string;
}

export interface ServiceItem {
    id: string;
    name: string;
    category: string;
    standardFee: number;
    description: string;
    documentsRequired: string[];
}

export interface ComplianceEvent {
    id: string;
    title: string;
    dueDate: string;
    type: 'GST' | 'Income Tax' | 'TDS' | 'ROC' | 'PF/ESI';
    description: string;
    filingStatus: { total: number; filed: number };
}

export interface Appointment {
    id: string;
    clientId: string;
    clientName: string;
    date: string;
    time: string;
    type: 'Consultation' | 'Filing Review' | 'Audit Discussion' | 'General';
    status: 'Scheduled' | 'Completed' | 'Cancelled';
    notes?: string;
}

export interface ClientDocument {
    id: string;
    clientId: string;
    taskId?: string;
    name: string;
    type: string;
    uploadDate: string;
    status: 'Pending' | 'Verified';
}
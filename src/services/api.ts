// src/services/api.ts

import { Client, Project, Task, Invoice, Staff, IncomingRegisterEntry } from '../../types';

const API_BASE_URL = import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost/avr-associates-erp/api');

export const api = {
    // Auth
    auth: {
        login: async (credentials: any): Promise<any> => {
            const response = await fetch(`${API_BASE_URL}/auth.php?action=login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Login failed');
            }
            return response.json();
        },
        forgotPassword: async (email: string): Promise<any> => {
            const response = await fetch(`${API_BASE_URL}/auth.php?action=forgot_password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Request failed');
            }
            return response.json();
        },
        resetPassword: async (data: any): Promise<any> => {
            const response = await fetch(`${API_BASE_URL}/auth.php?action=reset_password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Reset failed');
            }
            return response.json();
        },
        verifyResetToken: async (token: string): Promise<any> => {
            const response = await fetch(`${API_BASE_URL}/auth.php?action=verify_token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Invalid token');
            }
            return response.json();
        },
        adminSendResetLink: async (userId: string, email: string): Promise<any> => {
            const response = await fetch(`${API_BASE_URL}/auth.php?action=admin_send_reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, email })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to send reset link');
            }
            return response.json();
        }
    },

    // Clients
    getClients: async (limit?: number, offset?: number, search?: string, branch?: string, status?: string, type?: string): Promise<any> => {
        const params = new URLSearchParams();
        if (limit !== undefined) params.append('limit', limit.toString());
        if (offset !== undefined) params.append('offset', offset.toString());
        if (search) params.append('search', search);
        if (branch) params.append('branch', branch);
        if (status) params.append('status', status);
        if (type) params.append('type', type);

        const url = `${API_BASE_URL}/clients.php${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch clients');
        return response.json();
    },

    createClient: async (client: Omit<Client, 'id'>): Promise<Client> => {
        const response = await fetch(`${API_BASE_URL}/clients.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(client)
        });
        if (!response.ok) {
            let errorMsg = 'Failed to create client';
            try {
                const errorData = await response.json();
                errorMsg = errorData.error || errorMsg;
            } catch (e) {
                // If it's not JSON, try text
            }
            throw new Error(errorMsg);
        }
        return response.json();
    },

    updateClient: async (client: Client): Promise<Client> => {
        const response = await fetch(`${API_BASE_URL}/clients.php`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(client)
        });
        if (!response.ok) throw new Error('Failed to update client');
        // Return updated client or just success
        return client;
    },

    deleteClient: async (id: string): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/clients.php?id=${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete client');
        return response.json();
    },

    // Projects
    getProjects: async (clientId?: string): Promise<Project[]> => {
        const url = clientId
            ? `${API_BASE_URL}/projects.php?clientId=${clientId}`
            : `${API_BASE_URL}/projects.php`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch projects');
        return response.json();
    },

    createProject: async (project: Omit<Project, 'id'>): Promise<Project> => {
        const response = await fetch(`${API_BASE_URL}/projects.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(project)
        });
        if (!response.ok) throw new Error('Failed to create project');
        return response.json();
    },

    deleteProject: async (id: string): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/projects.php?id=${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete project');
        return response.json();
    },

    deleteAllProjects: async (): Promise<{ message: string }> => {
        const response = await fetch(`${API_BASE_URL}/projects.php?all=true`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete all projects');
        return response.json();
    },

    // Tasks
    getTasks: async (clientId?: string): Promise<Task[]> => {
        const url = clientId
            ? `${API_BASE_URL}/tasks.php?clientId=${clientId}`
            : `${API_BASE_URL}/tasks.php`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch tasks');
        return response.json();
    },

    createTask: async (task: Omit<Task, 'id'>): Promise<Task> => {
        const response = await fetch(`${API_BASE_URL}/tasks.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });
        if (!response.ok) throw new Error('Failed to create task');
        return response.json();
    },

    updateTask: async (task: Partial<Task> & { id: string }): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/tasks.php`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });
        if (!response.ok) throw new Error('Failed to update task');
        return response.json();
    },

    createTasksBatch: async (tasks: Omit<Task, 'id'>[]): Promise<{ count: number, ids: string[] }> => {
        const response = await fetch(`${API_BASE_URL}/tasks.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tasks)
        });
        if (!response.ok) throw new Error('Failed to create tasks batch');
        return response.json();
    },

    deleteAllTasks: async (): Promise<{ message: string }> => {
        const response = await fetch(`${API_BASE_URL}/tasks.php?all=true`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete all tasks');
        return response.json();
    },

    // Invoices
    getInvoices: async (clientId?: string): Promise<Invoice[]> => {
        const url = clientId 
            ? `${API_BASE_URL}/invoices.php?clientId=${clientId}`
            : `${API_BASE_URL}/invoices.php`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch invoices');
        return response.json();
    },

    createInvoice: async (invoice: Omit<Invoice, 'id'> | Invoice): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/invoices.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invoice)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create invoice');
        }
        return response.json();
    },

    // Staff
    getStaff: async (): Promise<Staff[]> => {
        const response = await fetch(`${API_BASE_URL}/staff.php`);
        if (!response.ok) throw new Error('Failed to fetch staff');
        return response.json();
    },

    createStaff: async (staffData: any): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/staff.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(staffData)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create staff');
        }
        return response.json();
    },

    deleteStaff: async (id: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/staff.php?id=${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete staff');
        }
        return response.json();
    },

    // Documents
    uploadDocument: async (formData: FormData) => {
        const response = await fetch(`${API_BASE_URL}/documents.php`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) throw new Error('Upload failed');
        return response.json();
    },

    getDocuments: async (clientId: string) => {
        const response = await fetch(`${API_BASE_URL}/documents.php?clientId=${clientId}`);
        if (!response.ok) throw new Error('Failed to fetch documents');
        return response.json();
    },

    createDocumentsBatch: async (documents: any[]) => {
        const response = await fetch(`${API_BASE_URL}/documents.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(documents)
        });
        if (!response.ok) throw new Error('Failed to create documents batch');
        return response.json();
    },

    // Time Logs
    createTimeLog: async (log: any): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/time_logs.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(log)
        });
        if (!response.ok) throw new Error('Failed to create time log');
        return response.json();
    },
    
    // Registers
    getIncomingRegister: async (limit: number = 100, offset: number = 0, search: string = '', branch: string = 'All Branches', clientExactName: string = '', serviceName: string = ''): Promise<{data: IncomingRegisterEntry[], total: number}> => {
        const params = new URLSearchParams({
            limit: limit.toString(),
            offset: offset.toString(),
            search,
            branch
        });
        if (clientExactName) params.append('clientExactName', clientExactName);
        if (serviceName) params.append('serviceName', serviceName);
        const response = await fetch(`${API_BASE_URL}/incoming_register.php?${params}`);
        if (!response.ok) throw new Error('Failed to fetch incoming register');
        return response.json();
    },

    getIncomingRegisterStats: async (branch: string = 'All Branches'): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/incoming_register.php?stats=true&branch=${encodeURIComponent(branch)}`);
        if (!response.ok) throw new Error('Failed to fetch stats');
        return response.json();
    },

    createIncomingRegister: async (data: Omit<IncomingRegisterEntry, 'id'>): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/incoming_register.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.details 
                ? `${errorData.error}: ${errorData.details}` 
                : (errorData.error || 'Failed to create entry');
            throw new Error(errorMessage);
        }
        return response.json();
    },

    updateIncomingRegister: async (id: string, data: Partial<IncomingRegisterEntry>): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/incoming_register.php`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, id })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update entry');
        }
        return response.json();
    },

    deleteIncomingRegister: async (id: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/incoming_register.php?id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete entry');
        return response.json();
    },

    getVisitorRegister: async (limit = 20, offset = 0, search = '', branch = 'All Branches'): Promise<{ data: any[], total: number }> => {
        const params = new URLSearchParams({ limit: String(limit), offset: String(offset), search, branch });
        const response = await fetch(`${API_BASE_URL}/visitor_register.php?${params}`);
        if (!response.ok) throw new Error('Failed to fetch visitor register');
        return response.json();
    },

    createVisitorBatch: async (rows: any[]): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/visitor_register.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rows)
        });
        if (!response.ok) throw new Error('Failed to save visitors');
        return response.json();
    },

    createVisitor: async (data: any): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/visitor_register.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([data])
        });
        if (!response.ok) throw new Error('Failed to create visitor');
        return response.json();
    },

    updateVisitor: async (id: string, data: any): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/visitor_register.php`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, id })
        });
        if (!response.ok) throw new Error('Failed to update visitor');
        return response.json();
    },

    deleteVisitor: async (id: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/visitor_register.php?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete visitor');
        return response.json();
    },

    getTimeLogs: async (taskId: string): Promise<any[]> => {
        const response = await fetch(`${API_BASE_URL}/time_logs.php?taskId=${taskId}`);
        if (!response.ok) throw new Error('Failed to fetch time logs');
        return response.json();
    },

    // Branches
    getBranches: async (): Promise<any[]> => {
        const response = await fetch(`${API_BASE_URL}/branches.php`);
        if (!response.ok) throw new Error('Failed to fetch branches');
        return response.json();
    },

    createBranch: async (name: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/branches.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create branch');
        }
        return response.json();
    },

    deleteBranch: async (id: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/branches.php?id=${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete branch');
        return response.json();
    }
};

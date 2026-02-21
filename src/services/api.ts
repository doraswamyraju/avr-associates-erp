// src/services/api.ts

import { Client, Project, Task, Invoice, Staff } from '../../types';

const API_BASE_URL = import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost/avr-associates-erp/api');

export const api = {
    // Auth
    auth: {
        login: async (credentials: any): Promise<any> => {
            const response = await fetch(`${API_BASE_URL}/auth.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials) // username and password
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Login failed');
            }
            return response.json();
        }
    },

    // Clients
    getClients: async (): Promise<Client[]> => {
        const response = await fetch(`${API_BASE_URL}/clients.php`);
        if (!response.ok) throw new Error('Failed to fetch clients');
        return response.json();
    },

    createClient: async (client: Omit<Client, 'id'>): Promise<Client> => {
        const response = await fetch(`${API_BASE_URL}/clients.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(client)
        });
        if (!response.ok) throw new Error('Failed to create client');
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
    getInvoices: async (): Promise<Invoice[]> => {
        const response = await fetch(`${API_BASE_URL}/invoices.php`);
        if (!response.ok) throw new Error('Failed to fetch invoices');
        return response.json();
    },

    // Staff
    getStaff: async (): Promise<Staff[]> => {
        const response = await fetch(`${API_BASE_URL}/staff.php`);
        if (!response.ok) throw new Error('Failed to fetch staff');
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
    }
};

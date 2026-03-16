-- Seed Data for AVR Associates ERP

USE avr_erp_db;

-- 1. Insert Staff/Users
INSERT INTO staff (id, name, role, branch, email, hourly_rate) VALUES
('STAFF-001', 'Suresh Kumar', 'Admin', 'Ravulapalem', 'suresh@avr.com', 500.00),
('STAFF-002', 'Rameshwari', 'Senior Accountant', 'Ravulapalem', 'rameshwari@avr.com', 300.00),
('STAFF-003', 'Venkatesh', 'Junior Accountant', 'Atreyapuram', 'venkat@avr.com', 200.00);

-- 2. Insert Clients
INSERT INTO clients (id, name, type, branch, phone, email, status, city) VALUES
('CL-001', 'Tech Solutions Pvt Ltd', 'Company', 'Ravulapalem', '9876543210', 'info@techsol.com', 'Active', 'Kakinada'),
('CL-002', 'Srinivas Traders', 'Partnership', 'Atreyapuram', '9876543211', 'srinivas@traders.com', 'Active', 'Rajahmundry'),
('CL-003', 'Dr. Anjali Rao', 'Individual', 'Amalapuram', '9876543212', 'anjali@clinic.com', 'Active', 'Amalapuram'),
('CL-004', 'Global Exports', 'Company', 'Versatile', '9876543213', 'contact@global.com', 'Inactive', 'Vizag');

-- 3. Insert Tasks (Populates "Pending Tasks" and "Task Status Distribution" Chart)
INSERT INTO tasks (id, client_id, service_type, due_date, status, assigned_to, priority, branch) VALUES
('TSK-101', 'CL-001', 'GST Filing - Oct', '2023-11-20', 'Completed', 'Suresh Kumar', 'High', 'Ravulapalem'),
('TSK-102', 'CL-001', 'Annual Audit', '2023-12-31', 'In Progress', 'Suresh Kumar', 'High', 'Ravulapalem'),
('TSK-103', 'CL-002', 'GST Filing - Oct', '2023-11-20', 'Completed', 'Rameshwari', 'Medium', 'Atreyapuram'),
('TSK-104', 'CL-003', 'ITR Filing', '2023-07-31', 'Completed', 'Venkatesh', 'Medium', 'Amalapuram'),
('TSK-105', 'CL-002', 'TDS Return Q3', '2024-01-31', 'New', 'Rameshwari', 'High', 'Atreyapuram'),
('TSK-106', 'CL-004', 'Company Registration', '2023-12-15', 'Pending Client', 'Suresh Kumar', 'Medium', 'Versatile'),
('TSK-107', 'CL-001', 'ROC Compliance', '2023-10-30', 'Overdue', 'Rameshwari', 'High', 'Ravulapalem');

-- 4. Insert Usage/Projects
INSERT INTO projects (id, name, client_id, status, start_date, due_date, manager, branch, priority, budget) VALUES
('PRJ-001', 'End of Year Audit 2023', 'CL-001', 'In Progress', '2023-12-01', '2024-03-31', 'Suresh Kumar', 'Ravulapalem', 'High', 50000.00);

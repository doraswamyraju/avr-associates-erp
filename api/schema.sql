-- Database: avr_erp_db

CREATE DATABASE IF NOT EXISTS avr_erp_db;
USE avr_erp_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role ENUM('Admin', 'Employee', 'Client') NOT NULL,
    avatar VARCHAR(255),
    client_id VARCHAR(50),
    branch ENUM('Ravulapalem', 'Atreyapuram', 'Amalapuram', 'Versatile', 'All Branches'),
    is_clocked_in BOOLEAN DEFAULT FALSE,
    clock_in_time DATETIME
);

-- Clients Table
CREATE TABLE IF NOT EXISTS clients (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    pan VARCHAR(20),
    gstin VARCHAR(20),
    type ENUM('Individual', 'Company', 'Partnership', 'LLP'),
    branch ENUM('Ravulapalem', 'Atreyapuram', 'Amalapuram', 'Versatile', 'All Branches'),
    phone VARCHAR(20),
    email VARCHAR(100),
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    group_name VARCHAR(100),
    trade_name VARCHAR(150),
    dob DATE,
    address TEXT,
    city VARCHAR(100),
    pincode VARCHAR(20),
    state VARCHAR(50),
    file_number VARCHAR(50),
    bank_account_no VARCHAR(50),
    bank_name VARCHAR(100),
    ifsc_code VARCHAR(20),
    refer_by VARCHAR(100)
);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    client_id VARCHAR(50),
    status ENUM('Planning', 'In Progress', 'On Hold', 'Completed', 'Archived'),
    start_date DATE,
    due_date DATE,
    manager VARCHAR(100),
    branch ENUM('Ravulapalem', 'Atreyapuram', 'Amalapuram', 'Versatile', 'All Branches'),
    priority ENUM('High', 'Medium', 'Low'),
    budget DECIMAL(15, 2),
    total_hours_tracked DECIMAL(10, 2) DEFAULT 0,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(50) PRIMARY KEY,
    client_id VARCHAR(50),
    project_id VARCHAR(50),
    service_type VARCHAR(100),
    period VARCHAR(50),
    due_date DATE,
    status ENUM('New', 'In Progress', 'Pending Client', 'Under Review', 'Filed', 'Completed', 'Overdue'),
    assigned_to VARCHAR(100),
    priority ENUM('High', 'Medium', 'Low'),
    branch ENUM('Ravulapalem', 'Atreyapuram', 'Amalapuram', 'Versatile', 'All Branches'),
    sla_progress INT DEFAULT 0,
    total_tracked_minutes INT DEFAULT 0,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- Time Logs Table
CREATE TABLE IF NOT EXISTS time_logs (
    id VARCHAR(50) PRIMARY KEY,
    task_id VARCHAR(50),
    staff_id VARCHAR(50),
    start_time DATETIME,
    end_time DATETIME,
    duration_minutes INT,
    description TEXT,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(50) PRIMARY KEY,
    client_id VARCHAR(50),
    date DATE,
    amount DECIMAL(15, 2),
    status ENUM('Paid', 'Unpaid', 'Overdue'),
    items JSON,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Staff Table
CREATE TABLE IF NOT EXISTS staff (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(100),
    branch ENUM('Ravulapalem', 'Atreyapuram', 'Amalapuram', 'Versatile', 'All Branches'),
    avatar_url VARCHAR(255),
    email VARCHAR(100),
    is_clocked_in BOOLEAN DEFAULT FALSE,
    hourly_rate DECIMAL(10, 2),
    mtd_tracked_hours DECIMAL(10, 2) DEFAULT 0
);

-- Service Items Table
CREATE TABLE IF NOT EXISTS service_items (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100),
    standard_fee DECIMAL(15, 2),
    description TEXT,
    documents_required JSON
);

-- Compliance Events Table
CREATE TABLE IF NOT EXISTS compliance_events (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(150),
    due_date DATE,
    type ENUM('GST', 'Income Tax', 'TDS', 'ROC', 'PF/ESI'),
    description TEXT,
    filing_status JSON
);

-- Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(50) PRIMARY KEY,
    client_id VARCHAR(50),
    date DATE,
    time TIME,
    type ENUM('Consultation', 'Filing Review', 'Audit Discussion', 'General'),
    status ENUM('Scheduled', 'Completed', 'Cancelled'),
    notes TEXT,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Client Documents Table
CREATE TABLE IF NOT EXISTS client_documents (
    id VARCHAR(50) PRIMARY KEY,
    client_id VARCHAR(50),
    task_id VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    upload_date DATE,
    status ENUM('Pending', 'Verified'),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

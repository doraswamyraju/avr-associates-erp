<?php
require_once 'db_connect.php';

try {
    $pdo->beginTransaction();

    // Clear existing data
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
    $tables = ['clients', 'projects', 'tasks', 'staff', 'invoices', 'appointments', 'client_documents'];
    foreach ($tables as $table) {
        $pdo->exec("DELETE FROM $table");
    }
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

    // Seed Clients
    $clients = [
        ['C001', 'Sri Venkateswara Traders', 'ABCDE1234F', NULL, 'Partnership', 'Ravulapalem', '9876543210', 'svt@example.com', 'Active'],
        ['C002', 'Krishna & Co.', 'FGHIJ5678K', NULL, 'Company', 'Amalapuram', '9988776655', 'acc@krishna.com', 'Active'],
        ['C003', 'Ravi Kumar V', 'KLMNO9012P', NULL, 'Individual', 'Atreyapuram', '9123456789', 'ravi@gmail.com', 'Active'],
        ['C004', 'Versatile Tech Solutions', 'PQRST3456T', NULL, 'LLP', 'Versatile', '8877665544', 'info@versatile.tech', 'Active'],
        ['C005', 'Lakshmi Textiles', 'UVWXY7890Z', NULL, 'Partnership', 'Ravulapalem', '7766554433', 'lt@example.com', 'Inactive']
    ];

    $stmt = $pdo->prepare("INSERT INTO clients (id, name, pan, gstin, type, branch, phone, email, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($clients as $client) {
        $stmt->execute($client);
    }

    // Seed Projects
    $projects = [
        ['PRJ-001', 'Internal Financial Audit FY 23-24', 'Complete internal audit including stock verification and ledger scrutiny.', 'C002', 'In Progress', '2024-05-01', '2024-07-30', 'Suresh K', 'Amalapuram', 'High', 50000, 45],
        ['PRJ-002', 'Company Incorporation & Setup', 'End-to-end setup for new subsidiary including PAN, TAN, GST, and ROC.', 'C004', 'Planning', '2024-06-15', '2024-08-15', 'Priya D', 'Versatile', 'Medium', 25000, 0]
    ];
    
    $stmt = $pdo->prepare("INSERT INTO projects (id, name, description, client_id, status, start_date, due_date, manager, branch, priority, budget, total_hours_tracked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($projects as $project) {
        $stmt->execute($project);
    }

    // Seed Tasks
    $tasks = [
        ['T001', 'C001', NULL, 'GSTR-3B', 'May 2024', '2024-06-20', 'Completed', 'Suresh K', 'High', 'Ravulapalem', 100, 120],
        ['T002', 'C001', NULL, 'TDS 24Q', 'Q1 24-25', '2024-07-31', 'In Progress', 'Ramesh M', 'Medium', 'Ravulapalem', 45, 450],
        ['T003', 'C002', 'PRJ-001', 'Tax Audit', 'FY 23-24', '2024-09-30', 'New', 'Priya D', 'High', 'Amalapuram', 0, 0],
        ['T004', 'C003', NULL, 'ITR-1', 'AY 24-25', '2024-07-31', 'Pending Client', 'Anil B', 'Low', 'Atreyapuram', 20, 60],
        ['T005', 'C004', 'PRJ-002', 'GSTR-1', 'May 2024', '2024-06-11', 'Overdue', 'Mahesh B', 'High', 'Versatile', 100, 180],
        ['T007', 'C002', 'PRJ-001', 'GSTR-3B', 'May 2024', '2024-06-20', 'Under Review', 'Priya D', 'High', 'Amalapuram', 80, 95]
    ];

    $stmt = $pdo->prepare("INSERT INTO tasks (id, client_id, project_id, service_type, period, due_date, status, assigned_to, priority, branch, sla_progress, total_tracked_minutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($tasks as $task) {
        $stmt->execute($task);
    }

    $pdo->commit();
    echo json_encode(['message' => 'Database seeded successfully']);

} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['error' => 'Seed failed: ' . $e->getMessage()]);
}
?>

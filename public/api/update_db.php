<?php
require_once 'db_connect.php';

try {
    $sql = "SHOW COLUMNS FROM clients LIKE 'service_details'";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();

    if ($stmt->rowCount() == 0) {
        $sql = "ALTER TABLE clients ADD COLUMN service_details JSON";
        $pdo->exec($sql);
        echo "Column 'service_details' added successfully.<br>";
    }
    else {
        echo "Column 'service_details' already exists.<br>";
    }

    // Add username and password_hash to users table (migration)
    $sql = "SHOW COLUMNS FROM users LIKE 'username'";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();

    if ($stmt->rowCount() == 0) {
        $sql = "ALTER TABLE users ADD COLUMN username VARCHAR(100) UNIQUE, ADD COLUMN password_hash VARCHAR(255)";
        $pdo->exec($sql);
        echo "Columns 'username', 'password_hash' added successfully to 'users'.<br>";
    }
    else {
        echo "Columns 'username', 'password_hash' already exist in 'users'.<br>";
    }

    // Update Incoming Register Table Structure
    $pdo->exec("DROP TABLE IF EXISTS incoming_register");
    $pdo->exec("CREATE TABLE incoming_register (
        id VARCHAR(50) PRIMARY KEY,
        reference_code VARCHAR(150),
        customer_name VARCHAR(150),
        service_name VARCHAR(150),
        date DATE NOT NULL,
        assessment_year VARCHAR(50),
        period_1 VARCHAR(50),
        period_2 VARCHAR(50),
        due_date DATE,
        completed_date DATE,
        staff_name VARCHAR(150),
        incoming_documents TEXT,
        verified_by VARCHAR(150),
        verified_status VARCHAR(50),
        arn_ref_no VARCHAR(100),
        bill_no VARCHAR(100),
        bill_amount DECIMAL(15, 2),
        mode_of_payment VARCHAR(50),
        payment_info VARCHAR(255),
        bill_status VARCHAR(50),
        purpose_narration TEXT,
        status VARCHAR(50) DEFAULT 'Data Pending',
        remarks TEXT,
        branch VARCHAR(100)
    )");
    echo "Table 'incoming_register' recreated with new expanded schema.<br>";

    // Add Visitor Register Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS visitor_register (
        id VARCHAR(50) PRIMARY KEY,
        date DATE NOT NULL,
        visitor_name VARCHAR(150) NOT NULL,
        purpose TEXT,
        contact_no VARCHAR(20),
        entry_time DATETIME,
        exit_time DATETIME,
        branch ENUM('Ravulapalem', 'Atreyapuram', 'Amalapuram', 'Versatile', 'All Branches'),
        status ENUM('In', 'Out') DEFAULT 'In'
    )");
    echo "Table 'visitor_register' checked/created.<br>";

    // Add Branches Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS branches (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(150) UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");
    echo "Table 'branches' checked/created.<br>";

    // Seed initial branches if table is empty
    $stmt = $pdo->query("SELECT COUNT(*) FROM branches");
    if ($stmt->fetchColumn() == 0) {
        $initial_branches = ['Ravulapalem', 'Atreyapuram', 'Amalapuram', 'Versatile', 'All Branches'];
        $insertStmt = $pdo->prepare("INSERT INTO branches (id, name) VALUES (?, ?)");
        foreach ($initial_branches as $idx => $bname) {
            $insertStmt->execute(['BR-'.($idx+1), $bname]);
        }
        echo "Initial branches seeded.<br>";
    }

    // Alter ENUM branch columns to VARCHAR(100)
    $tablesToAlter = [
        'users', 'clients', 'projects', 'tasks', 'staff', 'incoming_register', 'visitor_register'
    ];
    
    foreach ($tablesToAlter as $table) {
        try {
            $sql = "ALTER TABLE `$table` MODIFY COLUMN `branch` VARCHAR(100)";
            $pdo->exec($sql);
            echo "Altered branch column in `$table` to VARCHAR.<br>";
        } catch (PDOException $e) {
            echo "Skipped altering `$table` (might not exist): " . $e->getMessage() . "<br>";
        }
    }

}
catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>

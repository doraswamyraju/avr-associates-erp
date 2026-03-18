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

    // Add Incoming Register Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS incoming_register (
        id VARCHAR(50) PRIMARY KEY,
        date DATE NOT NULL,
        sender_name VARCHAR(150) NOT NULL,
        mode ENUM('Courier', 'Hand', 'Post', 'Email') NOT NULL,
        subject TEXT,
        received_by VARCHAR(100),
        branch ENUM('Ravulapalem', 'Atreyapuram', 'Amalapuram', 'Versatile', 'All Branches'),
        status ENUM('Pending', 'Processed', 'Filed') DEFAULT 'Pending'
    )");
    echo "Table 'incoming_register' checked/created.<br>";

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

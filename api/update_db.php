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
    } else {
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
    } else {
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

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>

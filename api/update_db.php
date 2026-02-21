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

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>

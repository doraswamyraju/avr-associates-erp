<?php
require_once 'db_connect.php';

header('Content-Type: text/plain');

try {
    echo "Starting Setup and Migration...\n";

    // 1. Fix Schema (Add missing columns to users)
    $columns = [
        'email' => "ALTER TABLE users ADD COLUMN email VARCHAR(100) AFTER name",
        'reset_token' => "ALTER TABLE users ADD COLUMN reset_token VARCHAR(100) NULL AFTER branch",
        'token_expiry' => "ALTER TABLE users ADD COLUMN token_expiry DATETIME NULL AFTER reset_token"
    ];

    foreach ($columns as $col => $sql) {
        $check = $pdo->query("SHOW COLUMNS FROM users LIKE '$col'")->fetch();
        if (!$check) {
            $pdo->exec($sql);
            echo "Added column '$col'.\n";
        } else {
            echo "Column '$col' already exists.\n";
        }
    }

    // 2. Create/Update Admin User
    $username = 'admin@avrassociate.com';
    $password = 'Admin@123';
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $id = 'USR-ADMIN-001';

    // Check if user already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if ($user) {
        $update = $pdo->prepare("UPDATE users SET password_hash = ?, role = 'Admin', name = 'System Admin', email = ? WHERE username = ?");
        $update->execute([$passwordHash, $username, $username]);
        echo "Admin user '$username' updated successfully.\n";
    } else {
        $insert = $pdo->prepare("INSERT INTO users (id, username, password_hash, name, role, email, branch) 
                                VALUES (?, ?, ?, ?, 'Admin', ?, 'All Branches')");
        $insert->execute([$id, $username, $passwordHash, 'System Admin', $username]);
        echo "Admin user '$username' created successfully.\n";
    }

    echo "\nSetup Complete. You can now login with:\n";
    echo "Username: $username\n";
    echo "Password: $password\n";

} catch (PDOException $e) {
    http_response_code(500);
    echo "Error: " . $e->getMessage();
}
?>

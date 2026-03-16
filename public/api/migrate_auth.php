<?php
require_once 'db_connect.php';

try {
    // Check if columns already exist to avoid errors
    $check_email = $pdo->query("SHOW COLUMNS FROM users LIKE 'email'")->fetch();
    if (!$check_email) {
        $pdo->exec("ALTER TABLE users ADD COLUMN email VARCHAR(100) AFTER name");
        echo "Column 'email' added to 'users' table.\n";
    }

    $check_token = $pdo->query("SHOW COLUMNS FROM users LIKE 'reset_token'")->fetch();
    if (!$check_token) {
        $pdo->exec("ALTER TABLE users ADD COLUMN reset_token VARCHAR(100) NULL AFTER branch");
        echo "Column 'reset_token' added to 'users' table.\n";
    }

    $check_expiry = $pdo->query("SHOW COLUMNS FROM users LIKE 'token_expiry'")->fetch();
    if (!$check_expiry) {
        $pdo->exec("ALTER TABLE users ADD COLUMN token_expiry DATETIME NULL AFTER reset_token");
        echo "Column 'token_expiry' added to 'users' table.\n";
    }

    echo "Migration completed successfully.\n";
} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
?>

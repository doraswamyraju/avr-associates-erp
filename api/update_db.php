<?php
require_once 'db_connect.php';

try {
    $sql = "SHOW COLUMNS FROM clients LIKE 'service_details'";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    
    if ($stmt->rowCount() == 0) {
        $sql = "ALTER TABLE clients ADD COLUMN service_details JSON";
        $pdo->exec($sql);
        echo "Column 'service_details' added successfully.";
    } else {
        echo "Column 'service_details' already exists.";
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>

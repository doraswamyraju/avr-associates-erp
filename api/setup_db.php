<?php
require_once 'db_connect.php';

try {
    // Read schema.sql
    $sql = file_get_contents(__DIR__ . '/schema.sql');
    
    // Execute schema
    $pdo->exec($sql);
    
    echo json_encode(['message' => 'Database and tables created successfully']);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Setup failed: ' . $e->getMessage()]);
}
?>

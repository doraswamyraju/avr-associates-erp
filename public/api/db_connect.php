<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE, PUT");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json");

// Handle CORS Pre-Flight
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

$charset = 'utf8mb4';

// Environment Detection
if ($_SERVER['HTTP_HOST'] === 'localhost' || $_SERVER['HTTP_HOST'] === '127.0.0.1') {
    // Local Development
    $host = 'localhost';
    $db   = 'avr_erp_db';
    $user = 'root'; 
    $pass = '';     
} else {
    // Production (Hostinger VPS)
    $host = '127.0.0.1'; // Use IP instead of localhost to avoid socket issues
    
    if (file_exists(__DIR__ . '/../db_production_config.php')) {
        include __DIR__ . '/../db_production_config.php';
    } elseif (file_exists(__DIR__ . '/../../db_production_config.php')) {
        include __DIR__ . '/../../db_production_config.php';
    } else {
        // Fallback / Placeholder - CHANGE THESE ON SERVER or use the config file approach
        $db   = 'u123456789_avr_erp'; 
        $user = 'u123456789_avr_user'; 
        $pass = 'YOUR_DB_PASSWORD';   
    }
}

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    // If database does not exist, try connecting without dbname and create it
    if (strpos($e->getMessage(), "Unknown database") !== false) {
        try {
            $dsn_no_db = "mysql:host=$host;charset=$charset";
            $pdo = new PDO($dsn_no_db, $user, $pass, $options);
        } catch (\PDOException $e2) {
             http_response_code(500);
             echo json_encode(['error' => 'Connection failed: ' . $e2->getMessage()]);
             exit;
        }
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Connection failed: ' . $e->getMessage()]);
        exit;
    }
}
?>

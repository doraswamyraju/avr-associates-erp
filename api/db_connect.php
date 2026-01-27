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

$host = 'localhost';
$db   = 'avr_erp_db';
$user = 'root'; // Default XAMPP user
$pass = '';     // Default XAMPP password
$charset = 'utf8mb4';

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
             echo json_encode(['error' => 'Connection failed: ' . $e2->getMessage()]);
             exit;
        }
    } else {
        echo json_encode(['error' => 'Connection failed: ' . $e->getMessage()]);
        exit;
    }
}
?>

<?php
require_once 'db_connect.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

// Get raw POST data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!isset($data['username']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Username and password are required']);
    exit;
}

$username = $data['username'];
$password = $data['password'];

try {
    $stmt = $pdo->prepare("SELECT id, name, role, avatar, client_id, branch FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        $stmt_hash = $pdo->prepare("SELECT password_hash FROM users WHERE username = ?");
        $stmt_hash->execute([$username]);
        $hashRow = $stmt_hash->fetch(PDO::FETCH_ASSOC);

        if (password_verify($password, $hashRow['password_hash'])) {
            // Unset sensitive data just in case
            unset($user['password_hash']);
            
            // Send back successful response
            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => $user['id'],
                    'name' => $user['name'],
                    'role' => $user['role'],
                    'branch' => $user['branch'],
                    'clientId' => $user['client_id'], // Camel case to match frontend
                    'avatar' => $user['avatar']
                ]
            ]);
            exit;
        }
    }
    
    // Auth failed
    http_response_code(401);
    echo json_encode(['error' => 'Invalid username or password']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>

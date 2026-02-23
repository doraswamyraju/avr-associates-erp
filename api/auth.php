<?php
require_once 'db_connect.php';
require_once 'mail_utils.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Support action parameter in URL or POST body
$action = $_GET['action'] ?? $data['action'] ?? 'login';

switch ($action) {
    case 'login':
        handleLogin($pdo, $data);
        break;
    case 'forgot_password':
        handleForgotPassword($pdo, $data);
        break;
    case 'reset_password':
        handleResetPassword($pdo, $data);
        break;
    case 'verify_token':
        handleVerifyToken($pdo, $data);
        break;
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
        break;
}

function handleLogin($pdo, $data) {
    if (!isset($data['username']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Username and password are required']);
        exit;
    }

    $username = $data['username'];
    $password = $data['password'];

    try {
        $stmt = $pdo->prepare("SELECT id, name, role, avatar, client_id, branch, email, password_hash FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($password, $user['password_hash'])) {
            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => $user['id'],
                    'name' => $user['name'],
                    'role' => $user['role'],
                    'branch' => $user['branch'],
                    'clientId' => $user['client_id'],
                    'avatar' => $user['avatar'],
                    'email' => $user['email']
                ]
            ]);
            exit;
        }
        
        http_response_code(401);
        echo json_encode(['error' => 'Invalid username or password']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function handleForgotPassword($pdo, $data) {
    if (!isset($data['email'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Email is required']);
        exit;
    }

    $email = $data['email'];

    try {
        $stmt = $pdo->prepare("SELECT id, name FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            $token = bin2hex(random_bytes(32));
            $expiry = date('Y-m-d H:i:s', strtotime('+1 hour'));

            $update = $pdo->prepare("UPDATE users SET reset_token = ?, token_expiry = ? WHERE id = ?");
            $update->execute([$token, $expiry, $user['id']]);

            send_password_reset_email($email, $user['name'], $token);

            echo json_encode(['success' => true, 'message' => 'Password reset link sent to your email.']);
        } else {
            // Don't reveal if user exists or not for security, but usually in internal ERPs it's fine.
            // Let's be semi-vague but helpful.
            echo json_encode(['success' => true, 'message' => 'If this email is registered, a reset link has been sent.']);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'error: ' . $e->getMessage()]);
    }
}

function handleResetPassword($pdo, $data) {
    if (!isset($data['token']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Token and password are required']);
        exit;
    }

    $token = $data['token'];
    $password = $data['password'];

    try {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE reset_token = ? AND token_expiry > NOW()");
        $stmt->execute([$token]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $update = $pdo->prepare("UPDATE users SET password_hash = ?, reset_token = NULL, token_expiry = NULL WHERE id = ?");
            $update->execute([$hash, $user['id']]);

            echo json_encode(['success' => true, 'message' => 'Password updated successfully. You can now login.']);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid or expired token']);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'error: ' . $e->getMessage()]);
    }
}

function handleVerifyToken($pdo, $data) {
    if (!isset($data['token'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Token is required']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT name FROM users WHERE reset_token = ? AND token_expiry > NOW()");
        $stmt->execute([$data['token']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            echo json_encode(['success' => true, 'name' => $user['name']]);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid or expired token']);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'error: ' . $e->getMessage()]);
    }
}
?>


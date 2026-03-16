<?php
require_once 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT * FROM staff");
        $staff = $stmt->fetchAll();
        
        // Convert camelCase to snake_case for frontend compatibility if needed, 
        // but Typescript types usually map directly. 
        // However, DB columns are snake_case. 
        // We might need to transform keys or handle it in frontend.
        // For simplicity, let's assume frontend can map or we use fetchAll(PDO::FETCH_ASSOC) which gives snake_case.
        
        $formattedStaff = array_map(function($s) {
            return [
                'id' => $s['id'],
                'name' => $s['name'],
                'role' => $s['role'],
                'branch' => $s['branch'],
                'avatarUrl' => $s['avatar_url'],
                'email' => $s['email'],
                'isClockedIn' => (bool)$s['is_clocked_in'],
                'hourlyRate' => (float)$s['hourly_rate'],
                'mtdTrackedHours' => (float)$s['mtd_tracked_hours']
            ];
        }, $staff);

        echo json_encode($formattedStaff);
        break;

    case 'POST':
        require_once 'mail_utils.php';
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['name']) || !isset($data['username'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing name or username']);
            exit;
        }

        try {
            $pdo->beginTransaction();

            $id = $data['id'] ?? ('S' . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT));
            $email = $data['email'] ?? null;
            
            // Generate token for password setting
            $resetToken = bin2hex(random_bytes(32));
            $tokenExpiry = date('Y-m-d H:i:s', strtotime('+24 hours'));

            // Insert into staff table
            $sqlStaff = "INSERT INTO staff (id, name, role, branch, avatar_url, email, is_clocked_in, hourly_rate, mtd_tracked_hours) 
                        VALUES (:id, :name, :role, :branch, :avatar_url, :email, :is_clocked_in, :hourly_rate, :mtd_tracked_hours)";
            
            $stmtStaff = $pdo->prepare($sqlStaff);
            $stmtStaff->execute([
                ':id' => $id,
                ':name' => $data['name'],
                ':role' => $data['role'] ?? 'Employee',
                ':branch' => $data['branch'] ?? 'Ravulapalem',
                ':avatar_url' => $data['avatarUrl'] ?? "https://ui-avatars.com/api/?name=" . urlencode($data['name']) . "&background=random&bold=true",
                ':email' => $email,
                ':is_clocked_in' => 0,
                ':hourly_rate' => $data['hourlyRate'] ?? 200,
                ':mtd_tracked_hours' => 0
            ]);

            // Insert into users table for login
            // Use a temporary random password if none provided, but reset_token is what matters
            $tempPassword = bin2hex(random_bytes(8));
            $passwordHash = password_hash($data['password'] ?? $tempPassword, PASSWORD_DEFAULT);
            
            $sqlUser = "INSERT INTO users (id, username, password_hash, name, role, avatar, branch, email, reset_token, token_expiry) 
                        VALUES (:id, :username, :password_hash, :name, 'Employee', :avatar, :branch, :email, :reset_token, :token_expiry)";
            
            $stmtUser = $pdo->prepare($sqlUser);
            $stmtUser->execute([
                ':id' => $id,
                ':username' => $data['username'],
                ':password_hash' => $passwordHash,
                ':name' => $data['name'],
                ':avatar' => $data['avatarUrl'] ?? null,
                ':branch' => $data['branch'] ?? 'Ravulapalem',
                ':email' => $email,
                ':reset_token' => $resetToken,
                ':token_expiry' => $tokenExpiry
            ]);

            $pdo->commit();

            // Send Welcome Email if email is provided
            if ($email) {
                send_welcome_email($email, $data['name'], $data['username'], $resetToken);
            }

            echo json_encode(['success' => true, 'message' => 'Staff created and welcome email triggered.', 'id' => $id]);
        } catch (PDOException $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
}
?>

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
        $data = json_decode(file_get_contents('php://input'), true);
        
        $sql = "INSERT INTO staff (id, name, role, branch, avatar_url, email, is_clocked_in, hourly_rate, mtd_tracked_hours) 
                VALUES (:id, :name, :role, :branch, :avatar_url, :email, :is_clocked_in, :hourly_rate, :mtd_tracked_hours)";
        
        $stmt = $pdo->prepare($sql);
        
        if (!isset($data['id'])) {
            $data['id'] = 'S' . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
        }

        try {
            $stmt->execute([
                ':id' => $data['id'],
                ':name' => $data['name'],
                ':role' => $data['role'],
                ':branch' => $data['branch'] ?? 'Ravulapalem',
                ':avatar_url' => $data['avatarUrl'] ?? null,
                ':email' => $data['email'] ?? null,
                ':is_clocked_in' => $data['isClockedIn'] ?? 0,
                ':hourly_rate' => $data['hourlyRate'] ?? 0,
                ':mtd_tracked_hours' => $data['mtdTrackedHours'] ?? 0
            ]);
            echo json_encode(['message' => 'Staff created', 'id' => $data['id']]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
}
?>

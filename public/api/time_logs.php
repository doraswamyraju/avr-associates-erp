<?php
require_once 'db_connect.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['taskId']) || !isset($data['staffId']) || !isset($data['durationMinutes'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields', 'received' => $data]);
            exit;
        }

        $sql = "INSERT INTO time_logs (id, task_id, staff_id, start_time, end_time, duration_minutes, description) 
                VALUES (:id, :task_id, :staff_id, :start_time, :end_time, :duration_minutes, :description)";
        
        $stmt = $pdo->prepare($sql);
        
        $id = $data['id'] ?? 'TL-' . str_pad(mt_rand(1, 999999), 6, '0', STR_PAD_LEFT);
        
        try {
            $stmt->execute([
                ':id' => $id,
                ':task_id' => $data['taskId'],
                ':staff_id' => $data['staffId'],
                ':start_time' => $data['startTime'],
                ':end_time' => $data['endTime'],
                ':duration_minutes' => $data['durationMinutes'],
                ':description' => $data['description'] ?? 'Work session log'
            ]);
            echo json_encode(['message' => 'Time log created', 'id' => $id]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error', 'details' => $e->getMessage(), 'sql' => $sql]);
        }
        break;

    case 'GET':
        if (!isset($_GET['taskId'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing taskId parameter']);
            exit;
        }

        $sql = "SELECT tl.*, s.name as staffName 
                FROM time_logs tl 
                LEFT JOIN staff s ON tl.staff_id = s.id 
                WHERE tl.task_id = :taskId 
                ORDER BY tl.end_time DESC";
                
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':taskId' => $_GET['taskId']]);
        
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $formattedLogs = array_map(function($l) {
            return [
                'id' => $l['id'],
                'taskId' => $l['task_id'],
                'staffId' => $l['staff_id'],
                'staffName' => $l['staffName'] ?: 'Unknown Staff',
                'startTime' => $l['start_time'],
                'endTime' => $l['end_time'],
                'durationMinutes' => (int)$l['duration_minutes'],
                'description' => $l['description']
            ];
        }, $logs);

        echo json_encode($formattedLogs);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>

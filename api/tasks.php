<?php
require_once 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Fetch tasks with client and project names (optional)
        $sql = "SELECT t.*, c.name as clientName 
                FROM tasks t 
                LEFT JOIN clients c ON t.client_id = c.id";
        
        $params = [];
        if (isset($_GET['clientId'])) {
            $sql .= " WHERE t.client_id = :clientId";
            $params[':clientId'] = $_GET['clientId'];
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        $tasks = $stmt->fetchAll();
        echo json_encode($tasks);
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        
        $sql = "INSERT INTO tasks (id, client_id, project_id, service_type, period, due_date, status, assigned_to, priority, branch, sla_progress, total_tracked_minutes) 
                VALUES (:id, :client_id, :project_id, :service_type, :period, :due_date, :status, :assigned_to, :priority, :branch, :sla_progress, :total_tracked_minutes)";
        
        $stmt = $pdo->prepare($sql);
        
        if (!isset($data['id'])) {
            $data['id'] = 'T' . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
        }

        try {
            $stmt->execute([
                ':id' => $data['id'],
                ':client_id' => $data['clientId'],
                ':project_id' => $data['projectId'] ?? null,
                ':service_type' => $data['serviceType'] ?? null,
                ':period' => $data['period'] ?? null,
                ':due_date' => $data['dueDate'] ?? null,
                ':status' => $data['status'] ?? 'New',
                ':assigned_to' => $data['assignedTo'] ?? null,
                ':priority' => $data['priority'] ?? 'Medium',
                ':branch' => $data['branch'] ?? 'Ravulapalem',
                ':sla_progress' => $data['slaProgress'] ?? 0,
                ':total_tracked_minutes' => $data['totalTrackedMinutes'] ?? 0
            ]);
            echo json_encode(['message' => 'Task created', 'id' => $data['id']]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
}
?>

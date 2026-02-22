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
        
        $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $formattedTasks = array_map(function($t) {
            return [
                'id' => $t['id'],
                'clientId' => $t['client_id'],
                'clientName' => $t['clientName'],
                'projectId' => $t['project_id'],
                'serviceType' => $t['service_type'],
                'period' => $t['period'],
                'dueDate' => $t['due_date'],
                'status' => $t['status'],
                'assignedTo' => $t['assigned_to'],
                'priority' => $t['priority'],
                'branch' => $t['branch'],
                'slaProgress' => (int)$t['sla_progress'],
                'totalTrackedMinutes' => (int)$t['total_tracked_minutes']
            ];
        }, $tasks);

        echo json_encode($formattedTasks);
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Determine if batch or single
        $isBatch = isset($input[0]);
        $tasksData = $isBatch ? $input : [$input];
        
        $responseIds = [];
        $errors = [];
        
        // Transaction for batch
        $pdo->beginTransaction();
        
        try {
            $sql = "INSERT INTO tasks (id, client_id, project_id, service_type, period, due_date, status, assigned_to, priority, branch, sla_progress, total_tracked_minutes) 
                    VALUES (:id, :client_id, :project_id, :service_type, :period, :due_date, :status, :assigned_to, :priority, :branch, :sla_progress, :total_tracked_minutes)";
            $stmt = $pdo->prepare($sql);

            foreach ($tasksData as $data) {
                // Generate robust unique ID: T_timestamp_random
                if (!isset($data['id'])) {
                    $data['id'] = 'T_' . uniqid() . '_' . mt_rand(100, 999);
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
                    $responseIds[] = $data['id'];
                } catch (PDOException $e) {
                    // Collect errors but try to continue if possible, or just fail batch?
                    // For now, fail hard on batch to ensure integrity or log error
                    throw $e;
                }
            }
            
            $pdo->commit();
            echo json_encode(['message' => 'Tasks created', 'ids' => $responseIds, 'count' => count($responseIds)]);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
    case 'DELETE':
        if (isset($_GET['all']) && $_GET['all'] === 'true') {
            $sql = "DELETE FROM tasks";
            $stmt = $pdo->prepare($sql);
            $stmt->execute();
            echo json_encode(['message' => 'All tasks deleted']);
        } elseif (isset($_GET['id'])) {
            $sql = "DELETE FROM tasks WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':id' => $_GET['id']]);
            echo json_encode(['message' => 'Task deleted']);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Missing ID or all parameter']);
        }
        break;
}
?>

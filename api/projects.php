<?php
require_once 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Fetch projects with client names
        $sql = "SELECT p.*, c.name as clientName 
                FROM projects p 
                LEFT JOIN clients c ON p.client_id = c.id";
                
        if (isset($_GET['clientId'])) {
            $sql .= " WHERE p.client_id = :clientId";
        }
        
        $stmt = $pdo->prepare($sql);
        
        if (isset($_GET['clientId'])) {
            $stmt->execute([':clientId' => $_GET['clientId']]);
        } else {
            $stmt->execute();
        }
        
        $projects = $stmt->fetchAll();
        echo json_encode($projects);
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        
        $sql = "INSERT INTO projects (id, name, description, client_id, status, start_date, due_date, manager, branch, priority, budget, total_hours_tracked) 
                VALUES (:id, :name, :description, :client_id, :status, :start_date, :due_date, :manager, :branch, :priority, :budget, :total_hours_tracked)";
        
        $stmt = $pdo->prepare($sql);
        
        if (!isset($data['id'])) {
            $data['id'] = 'PRJ-' . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
        }

        try {
            $stmt->execute([
                ':id' => $data['id'],
                ':name' => $data['name'],
                ':description' => $data['description'] ?? null,
                ':client_id' => $data['clientId'],
                ':status' => $data['status'] ?? 'Planning',
                ':start_date' => $data['startDate'] ?? null,
                ':due_date' => $data['dueDate'] ?? null,
                ':manager' => $data['manager'] ?? null,
                ':branch' => $data['branch'] ?? 'Ravulapalem',
                ':priority' => $data['priority'] ?? 'Medium',
                ':budget' => $data['budget'] ?? 0,
                ':total_hours_tracked' => $data['totalHoursTracked'] ?? 0
            ]);
            echo json_encode(['message' => 'Project created', 'id' => $data['id']]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        if (isset($_GET['all']) && $_GET['all'] == 'true') {
            $sql = "DELETE FROM projects";
            $stmt = $pdo->prepare($sql);
            try {
                $stmt->execute();
                echo json_encode(['message' => 'All projects deleted']);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => $e->getMessage()]);
            }
        } elseif (isset($_GET['id'])) {
            $sql = "DELETE FROM projects WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            try {
                $stmt->execute([':id' => $_GET['id']]);
                echo json_encode(['message' => 'Project deleted']);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Missing ID or all parameter']);
        }
        break;
}
?>

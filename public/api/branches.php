<?php
require_once 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT * FROM branches ORDER BY created_at ASC");
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($data);
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['name']) || empty(trim($input['name']))) {
            http_response_code(400);
            echo json_encode(['error' => 'Branch name is required']);
            break;
        }

        $id = $input['id'] ?? 'BR-' . time();
        $name = trim($input['name']);

        $sql = "INSERT INTO branches (id, name) VALUES (:id, :name)";
        $stmt = $pdo->prepare($sql);
        
        try {
            $stmt->execute([':id' => $id, ':name' => $name]);
            echo json_encode(['message' => 'Branch created', 'id' => $id, 'name' => $name]);
        } catch (PDOException $e) {
            http_response_code(500);
            if ($e->getCode() == 23000) { // Duplicate key
                echo json_encode(['error' => 'Branch name already exists']);
            } else {
                echo json_encode(['error' => $e->getMessage()]);
            }
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing branch id']);
            break;
        }

        $stmt = $pdo->prepare("DELETE FROM branches WHERE id = ?");
        try {
            $stmt->execute([$id]);
            echo json_encode(['message' => 'Branch deleted']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>

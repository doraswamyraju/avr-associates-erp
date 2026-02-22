<?php
require_once 'db_connect.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

// Ensure upload directory exists
$uploadDir = __DIR__ . '/uploads/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

switch ($method) {
    case 'POST':
        // Handle Batch Document Creation via JSON
        if (isset($_SERVER["CONTENT_TYPE"]) && strpos($_SERVER["CONTENT_TYPE"], "application/json") !== false) {
            $json = file_get_contents('php://input');
            $documents = json_decode($json, true);

            if (!is_array($documents) || empty($documents)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid or empty documents array']);
                exit;
            }

            try {
                $pdo->beginTransaction();
                $stmt = $pdo->prepare("INSERT INTO client_documents (id, client_id, task_id, name, type, upload_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
                
                $uploadDate = date('Y-m-d');
                $count = 0;
                $ids = [];

                foreach ($documents as $doc) {
                    $id = uniqid('DOC');
                    $clientId = $doc['clientId'] ?? null;
                    $taskId = $doc['taskId'] ?? null;
                    $name = $doc['name'] ?? 'Untitled';
                    $type = $doc['type'] ?? 'unknown';
                    $status = $doc['status'] ?? 'Pending';

                    if (!$clientId) continue;

                    $stmt->execute([$id, $clientId, $taskId, $name, $type, $uploadDate, $status]);
                    $ids[] = $id;
                    $count++;
                }

                $pdo->commit();
                echo json_encode(['success' => true, 'count' => $count, 'ids' => $ids]);
            } catch (Exception $e) {
                $pdo->rollBack();
                http_response_code(500);
                echo json_encode(['error' => 'Database error during batch insert']);
            }
            exit;
        }

        // Handle File Upload
        if (!isset($_FILES['file']) || !isset($_POST['clientId'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing file or client ID']);
            exit;
        }

        $clientId = $_POST['clientId'];
        $taskId = $_POST['taskId'] ?? null; // Optional
        $file = $_FILES['file'];
        $fileName = basename($file['name']);
        $targetPath = $uploadDir . time() . '_' . $fileName;

        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $id = uniqid('DOC');
            $uploadDate = date('Y-m-d');
            $status = 'Pending';
            $type = pathinfo($fileName, PATHINFO_EXTENSION);

            $stmt = $pdo->prepare("INSERT INTO client_documents (id, client_id, task_id, name, type, upload_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
            if ($stmt->execute([$id, $clientId, $taskId, $fileName, $type, $uploadDate, $status])) {
                echo json_encode(['success' => true, 'id' => $id, 'message' => 'File uploaded successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Database error']);
            }
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to move uploaded file']);
        }
        break;

    case 'GET':
        // Get Documents for Client
        $clientId = $_GET['clientId'] ?? null;
        if (!$clientId) {
            http_response_code(400);
            echo json_encode(['error' => 'Client ID required']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT * FROM client_documents WHERE client_id = ? ORDER BY upload_date DESC");
        $stmt->execute([$clientId]);
        $documents = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($documents);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>

<?php
require_once 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT * FROM incoming_register");
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $formatted = array_map(function($i) {
            return [
                'id' => $i['id'],
                'date' => $i['date'],
                'senderName' => $i['sender_name'],
                'mode' => $i['mode'],
                'subject' => $i['subject'],
                'receivedBy' => $i['received_by'],
                'branch' => $i['branch'],
                'status' => $i['status']
            ];
        }, $data);

        echo json_encode($formatted);
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        if (!isset($input['id'])) {
            $input['id'] = 'INC-' . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
        }

        $sql = "INSERT INTO incoming_register (id, date, sender_name, mode, subject, received_by, branch, status) 
                VALUES (:id, :date, :sender_name, :mode, :subject, :received_by, :branch, :status)";
        
        $stmt = $pdo->prepare($sql);
        try {
            $stmt->execute([
                ':id' => $input['id'],
                ':date' => $input['date'],
                ':sender_name' => $input['senderName'],
                ':mode' => $input['mode'],
                ':subject' => $input['subject'] ?? null,
                ':received_by' => $input['receivedBy'] ?? null,
                ':branch' => $input['branch'] ?? 'Ravulapalem',
                ':status' => $input['status'] ?? 'Pending'
            ]);
            echo json_encode(['message' => 'Entry created', 'id' => $input['id']]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
}
?>

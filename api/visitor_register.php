<?php
require_once 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT * FROM visitor_register");
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $formatted = array_map(function($v) {
            return [
                'id' => $v['id'],
                'date' => $v['date'],
                'visitorName' => $v['visitor_name'],
                'purpose' => $v['purpose'],
                'contactNo' => $v['contact_no'],
                'entryTime' => $v['entry_time'],
                'exitTime' => $v['exit_time'],
                'branch' => $v['branch'],
                'status' => $v['status']
            ];
        }, $data);

        echo json_encode($formatted);
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        if (!isset($input['id'])) {
            $input['id'] = 'VIS-' . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
        }

        $sql = "INSERT INTO visitor_register (id, date, visitor_name, purpose, contact_no, entry_time, exit_time, branch, status) 
                VALUES (:id, :date, :visitor_name, :purpose, :contact_no, :entry_time, :exit_time, :branch, :status)";
        
        $stmt = $pdo->prepare($sql);
        try {
            $stmt->execute([
                ':id' => $input['id'],
                ':date' => $input['date'],
                ':visitor_name' => $input['visitorName'],
                ':purpose' => $input['purpose'] ?? null,
                ':contact_no' => $input['contactNo'] ?? null,
                ':entry_time' => $input['entryTime'] ?? null,
                ':exit_time' => $input['exitTime'] ?? null,
                ':branch' => $input['branch'] ?? 'Ravulapalem',
                ':status' => $input['status'] ?? 'In'
            ]);
            echo json_encode(['message' => 'Entry created', 'id' => $input['id']]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
}
?>

<?php
require_once 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $sql = "SELECT i.*, c.name as clientName 
                FROM invoices i 
                LEFT JOIN clients c ON i.client_id = c.id";
        
        $stmt = $pdo->query($sql);
        $invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $formattedInvoices = array_map(function($i) {
            return [
                'id' => $i['id'],
                'clientId' => $i['client_id'],
                'clientName' => $i['clientName'],
                'date' => $i['date'],
                'amount' => (float)$i['amount'],
                'status' => $i['status'],
                'items' => json_decode($i['items'])
            ];
        }, $invoices);
        
        echo json_encode($formattedInvoices);
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        
        $sql = "INSERT INTO invoices (id, client_id, date, amount, status, items) 
                VALUES (:id, :client_id, :date, :amount, :status, :items)";
        
        $stmt = $pdo->prepare($sql);
        
        if (!isset($data['id'])) {
            $data['id'] = 'INV-' . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
        }

        try {
            $stmt->execute([
                ':id' => $data['id'],
                ':client_id' => $data['clientId'],
                ':date' => $data['date'],
                ':amount' => $data['amount'],
                ':status' => $data['status'] ?? 'Unpaid',
                ':items' => json_encode($data['items'] ?? [])
            ]);
            echo json_encode(['message' => 'Invoice created', 'id' => $data['id']]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
}
?>

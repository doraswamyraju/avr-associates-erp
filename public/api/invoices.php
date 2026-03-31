<?php
require_once 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $clientId = $_GET['clientId'] ?? '';
        $sql = "SELECT i.*, c.name as clientName 
                FROM invoices i 
                LEFT JOIN clients c ON i.client_id = c.id";
                
        $params = [];
        if (!empty($clientId)) {
            $sql .= " WHERE i.client_id = :clientId";
            $params[':clientId'] = $clientId;
        }

        $sql .= " ORDER BY i.date DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $formattedInvoices = array_map(function($i) {
            return [
                'id' => $i['id'],
                'invoiceNumber' => $i['invoice_number'] ?? $i['id'],
                'clientId' => $i['client_id'],
                'clientName' => $i['clientName'],
                'date' => $i['date'],
                'dueDate' => $i['due_date'],
                'amount' => (float)$i['amount'],
                'subTotal' => isset($i['sub_total']) ? (float)$i['sub_total'] : null,
                'cgst' => isset($i['cgst']) ? (float)$i['cgst'] : null,
                'sgst' => isset($i['sgst']) ? (float)$i['sgst'] : null,
                'igst' => isset($i['igst']) ? (float)$i['igst'] : null,
                'notes' => $i['notes'],
                'status' => $i['status'],
                'items' => json_decode($i['items'])
            ];
        }, $invoices);
        
        echo json_encode($formattedInvoices);
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        
        $sql = "INSERT INTO invoices (id, invoice_number, client_id, date, due_date, sub_total, cgst, sgst, igst, amount, status, notes, items) 
                VALUES (:id, :invoice_number, :client_id, :date, :due_date, :sub_total, :cgst, :sgst, :igst, :amount, :status, :notes, :items)";
        
        $stmt = $pdo->prepare($sql);
        
        if (!isset($data['id'])) {
            $data['id'] = 'INV-' . str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);
        }

        try {
            $stmt->execute([
                ':id' => $data['id'],
                ':invoice_number' => $data['invoiceNumber'] ?? $data['id'],
                ':client_id' => $data['clientId'],
                ':date' => $data['date'],
                ':due_date' => $data['dueDate'] ?? null,
                ':sub_total' => $data['subTotal'] ?? 0,
                ':cgst' => $data['cgst'] ?? 0,
                ':sgst' => $data['sgst'] ?? 0,
                ':igst' => $data['igst'] ?? 0,
                ':amount' => $data['amount'],
                ':status' => $data['status'] ?? 'Unpaid',
                ':notes' => $data['notes'] ?? null,
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

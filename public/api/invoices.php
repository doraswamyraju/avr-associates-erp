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

            // Email automation for manual invoices
            try {
                require_once 'mail_utils.php';
                $cStmt = $pdo->prepare("SELECT name, email FROM clients WHERE id = ?");
                $cStmt->execute([$data['clientId']]);
                $client = $cStmt->fetch(PDO::FETCH_ASSOC);

                if ($client) {
                    $clientName = $client['name'];
                    $clientEmail = $client['email'];
                    $invNum = $data['invoiceNumber'] ?? $data['id'];

                    $emailSubject = "Invoice Generated - AVR Associates";
                    $emailMessage = "
                        <h3 style='font-size: 20px; font-weight: 800; margin-bottom: 16px;'>New Invoice Generated</h3>
                        <p>An official tax invoice has been generated for your recent engagement with <span class='highlight'>AVR Associates</span>.</p>
                        <div style='background: #f8fafc; padding: 24px; border-radius: 16px; margin: 24px 0; border: 1px solid #e2e8f0;'>
                            <p style='margin: 0 0 10px;'><strong>Invoice No:</strong> <span class='highlight'>$invNum</span></p>
                            <p style='margin: 0 0 10px;'><strong>Date:</strong> " . $data['date'] . "</p>
                            <p style='margin: 0;'><strong>Total Amount:</strong> ₹" . number_format($data['amount'], 2) . "</p>
                        </div>
                        <p>You can download the PDF from your client portal.</p>
                    ";

                    if (!empty($clientEmail)) {
                        send_erp_email($clientEmail, $emailSubject, $emailMessage);
                    }
                    send_erp_email('rajugariventures@gmail.com', "[ADMIN] Manual Invoice Generated: $clientName", "
                        <p><strong>Client:</strong> $clientName ({$data['clientId']})</p>
                        <p style='font-size: 18px; font-weight: bold;'>Amount: ₹" . number_format($data['amount'], 2) . "</p>
                        <p>Invoice #: $invNum</p>
                        <hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;'>
                        $emailMessage
                    ");
                }
            } catch (Throwable $mailErr) {
                // Don't fail the invoice if mail failing
            }

            echo json_encode(['message' => 'Invoice created', 'id' => $data['id']]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
}
?>

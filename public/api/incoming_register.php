<?php
require_once 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['stats'])) {
            $branch = $_GET['branch'] ?? 'All Branches';
            $sql = "SELECT status, COUNT(*) as count FROM incoming_register ";
            $params = [];
            if ($branch !== 'All Branches') {
                $sql .= "WHERE branch = :branch ";
                $params[':branch'] = $branch;
            }
            $sql .= "GROUP BY status";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            $stats = ['Data Received' => 0, 'Work In Progress' => 0, 'Completed' => 0, 'Data Pending' => 0];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                if (isset($stats[$row['status']])) {
                    $stats[$row['status']] = (int)$row['count'];
                }
            }
            $stats['Data Received'] += $stats['Data Pending'];
            echo json_encode($stats);
            break;
        }

        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
        $search = $_GET['search'] ?? '';
        $branch = $_GET['branch'] ?? 'All Branches';
        $clientExactName = $_GET['clientExactName'] ?? '';
        $serviceName = $_GET['serviceName'] ?? '';
        
        $sql = "SELECT * FROM incoming_register WHERE 1=1 ";
        $countSql = "SELECT COUNT(*) FROM incoming_register WHERE 1=1 ";
        $params = [];
        
        if ($branch !== 'All Branches') {
            $sql .= "AND branch = :branch ";
            $countSql .= "AND branch = :branch ";
            $params[':branch'] = $branch;
        }
        if (!empty($search)) {
            $sql .= "AND (LOWER(reference_code) LIKE :search1 OR LOWER(customer_name) LIKE :search2) ";
            $countSql .= "AND (LOWER(reference_code) LIKE :search1 OR LOWER(customer_name) LIKE :search2) ";
            $searchVal = '%' . strtolower($search) . '%';
            $params[':search1'] = $searchVal;
            $params[':search2'] = $searchVal;
        }
        if (!empty($clientExactName)) {
            $sql .= "AND customer_name = :clientExactName ";
            $countSql .= "AND customer_name = :clientExactName ";
            $params[':clientExactName'] = $clientExactName;
        }
        if (!empty($serviceName)) {
            $sql .= "AND service_name = :serviceName ";
            $countSql .= "AND service_name = :serviceName ";
            $params[':serviceName'] = $serviceName;
        }
        
        $sql .= "ORDER BY date DESC LIMIT " . (int)$limit . " OFFSET " . (int)$offset;
        
        $stmt = $pdo->prepare($sql);
        $countStmt = $pdo->prepare($countSql);
        
        foreach($params as $key => $val) {
            $stmt->bindValue($key, $val);
            $countStmt->bindValue($key, $val);
        }
        
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $countStmt->execute();
        $total = (int)$countStmt->fetchColumn();
        
        $formatted = array_map(function($i) {
            return [
                'id' => $i['id'],
                'referenceCode' => $i['reference_code'],
                'customerName' => $i['customer_name'],
                'serviceName' => $i['service_name'],
                'date' => $i['date'],
                'assessmentYear' => $i['assessment_year'],
                'period1' => $i['period_1'],
                'period2' => $i['period_2'],
                'dueDate' => $i['due_date'],
                'completedDate' => $i['completed_date'],
                'staffName' => $i['staff_name'],
                'incomingDocuments' => $i['incoming_documents'],
                'verifiedBy' => $i['verified_by'],
                'verifiedStatus' => $i['verified_status'],
                'arnRefNo' => $i['arn_ref_no'],
                'billNo' => $i['bill_no'],
                'billAmount' => $i['bill_amount'] !== null ? (float)$i['bill_amount'] : null,
                'modeOfPayment' => $i['mode_of_payment'],
                'paymentInfo' => $i['payment_info'],
                'billStatus' => $i['bill_status'],
                'purposeNarration' => $i['purpose_narration'],
                'status' => $i['status'],
                'remarks' => $i['remarks'],
                'branch' => $i['branch']
            ];
        }, $data);

        echo json_encode(['data' => $formatted, 'total' => $total]);
        break;

    case 'POST':
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);
        if (!is_array($input)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON input', 'details' => json_last_error_msg()]);
            exit;
        }
        if (empty($input['id'])) {
            $input['id'] = 'INC-' . substr(uniqid(), -6) . mt_rand(10, 99);
        }

        $sql = "INSERT INTO incoming_register (
            id, reference_code, customer_name, service_name, date, assessment_year, 
            period_1, period_2, due_date, completed_date, staff_name, incoming_documents, 
            verified_by, verified_status, arn_ref_no, bill_no, bill_amount, 
            mode_of_payment, payment_info, bill_status, purpose_narration, status, remarks, branch
        ) VALUES (
            :id, :reference_code, :customer_name, :service_name, :date, :assessment_year, 
            :period_1, :period_2, :due_date, :completed_date, :staff_name, :incoming_documents, 
            :verified_by, :verified_status, :arn_ref_no, :bill_no, :bill_amount, 
            :mode_of_payment, :payment_info, :bill_status, :purpose_narration, :status, :remarks, :branch
        )";
        
        try {
            $stmt = $pdo->prepare($sql);
            
            // Format dates from Excel numeric values if needed or fallback to today
            $date = $input['date'] ?? null;
            if (is_numeric($date)) {
                $date = gmdate("Y-m-d", (int)(($date - 25569) * 86400)); 
            } elseif (empty($date)) {
                $date = date('Y-m-d');
            } else {
                // If it's a string like '01-01-2026', just pass it, MySQL usually parses it or we can strtotime
                $timestamp = strtotime((string)$date);
                $date = $timestamp ? date('Y-m-d', $timestamp) : date('Y-m-d');
            }
            
            // Safely truncate strings and handle empty number fields
            $safeRefCode = isset($input['referenceCode']) ? substr((string)$input['referenceCode'], 0, 50) : null;
            $safeCustomer = isset($input['customerName']) ? substr((string)$input['customerName'], 0, 100) : null;
            $safePhone = isset($input['phone']) ? substr((string)$input['phone'], 0, 20) : null;
            
            $billAmt = isset($input['billAmount']) && $input['billAmount'] !== '' ? (float)$input['billAmount'] : null;

            $stmt->execute([
                ':id' => $input['id'],
                ':reference_code' => $safeRefCode,
                ':customer_name' => $safeCustomer,
                ':service_name' => isset($input['serviceName']) ? substr((string)$input['serviceName'], 0, 100) : null,
                ':date' => $date,
                ':assessment_year' => isset($input['assessmentYear']) ? substr((string)$input['assessmentYear'], 0, 20) : null,
                ':period_1' => isset($input['period1']) ? substr((string)$input['period1'], 0, 50) : null,
                ':period_2' => isset($input['period2']) ? substr((string)$input['period2'], 0, 50) : null,
                ':due_date' => (!empty($input['dueDate']) && (strtotime($input['dueDate']) || is_numeric($input['dueDate']))) ? (is_numeric($input['dueDate']) ? gmdate("Y-m-d", (int)(($input['dueDate'] - 25569) * 86400)) : date('Y-m-d', strtotime($input['dueDate']))) : null,
                ':completed_date' => (!empty($input['completedDate']) && (strtotime($input['completedDate']) || is_numeric($input['completedDate']))) ? (is_numeric($input['completedDate']) ? gmdate("Y-m-d", (int)(($input['completedDate'] - 25569) * 86400)) : date('Y-m-d', strtotime($input['completedDate']))) : null,
                ':staff_name' => isset($input['staffName']) ? substr((string)$input['staffName'], 0, 100) : null,
                ':incoming_documents' => isset($input['incomingDocuments']) ? substr((string)$input['incomingDocuments'], 0, 1000) : null,
                ':verified_by' => isset($input['verifiedBy']) ? substr((string)$input['verifiedBy'], 0, 100) : null,
                ':verified_status' => isset($input['verifiedStatus']) ? substr((string)$input['verifiedStatus'], 0, 50) : null,
                ':arn_ref_no' => isset($input['arnRefNo']) ? substr((string)$input['arnRefNo'], 0, 100) : null,
                ':bill_no' => isset($input['billNo']) ? substr((string)$input['billNo'], 0, 50) : null,
                ':bill_amount' => $billAmt,
                ':mode_of_payment' => isset($input['modeOfPayment']) ? substr((string)$input['modeOfPayment'], 0, 50) : null,
                ':payment_info' => isset($input['paymentInfo']) ? substr((string)$input['paymentInfo'], 0, 500) : null,
                ':bill_status' => isset($input['billStatus']) ? substr((string)$input['billStatus'], 0, 50) : null,
                ':purpose_narration' => isset($input['purposeNarration']) ? substr((string)$input['purposeNarration'], 0, 500) : null,
                ':status' => isset($input['status']) ? substr((string)$input['status'], 0, 50) : 'Data Received',
                ':remarks' => isset($input['remarks']) ? substr((string)$input['remarks'], 0, 1000) : null,
                ':branch' => isset($input['branch']) ? substr((string)$input['branch'], 0, 100) : 'All Branches'
            ]);

            // AUTOMATION: Generate Invoice and Send Email if Bill Amount is provided
            if ($billAmt > 0 && !empty($safeCustomer)) {
                // 1. Fetch Client Details
                $cStmt = $pdo->prepare("SELECT id, email FROM clients WHERE name = ? LIMIT 1");
                $cStmt->execute([$safeCustomer]);
                $client = $cStmt->fetch(PDO::FETCH_ASSOC);

                if ($client) {
                    $clientId = $client['id'];
                    $clientEmail = $client['email'];

                    // 2. Create Invoice Record
                    $invId = 'INV-' . strtoupper(substr(uniqid(), -8));
                    $invNum = 'INV/' . date('Y') . '/' . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
                    
                    $invSql = "INSERT INTO invoices (id, invoice_number, client_id, date, amount, status, items) 
                               VALUES (:id, :invoice_number, :client_id, :date, :amount, 'Unpaid', :items)";
                    $invStmt = $pdo->prepare($invSql);
                    
                    $items = [
                        [
                            'description' => 'Service Engagement: ' . ($input['serviceName'] ?? 'General Consult'),
                            'quantity' => 1,
                            'rate' => $billAmt,
                            'amount' => $billAmt
                        ]
                    ];

                    $invStmt->execute([
                        ':id' => $invId,
                        ':invoice_number' => $invNum,
                        ':client_id' => $clientId,
                        ':date' => $date,
                        ':amount' => $billAmt,
                        ':items' => json_encode($items)
                    ]);

                    // 3. Dispatch Emails
                    require_once 'mail_utils.php';
                    
                    $emailSubject = "Engagement Confirmed & Invoice Raised - AVR Associates";
                    $emailMessage = "
                        <h3 style='font-size: 20px; font-weight: 800; margin-bottom: 16px;'>Engagement Confirmed</h3>
                        <p>Thank you for choosing <span class='highlight'>AVR Associates</span>. We have successfully registered your new service request.</p>
                        
                        <div style='background: #f8fafc; padding: 24px; border-radius: 16px; margin: 24px 0; border: 1px solid #e2e8f0;'>
                            <p style='margin: 0 0 10px;'><strong>Reference ID:</strong> " . $input['id'] . "</p>
                            <p style='margin: 0 0 10px;'><strong>Service:</strong> " . ($input['serviceName'] ?? 'N/A') . "</p>
                            <p style='margin: 0 0 10px;'><strong>Invoice No:</strong> <span class='highlight'>$invNum</span></p>
                            <p style='margin: 0;'><strong>Total Amount:</strong> ₹" . number_format($billAmt, 2) . "</p>
                        </div>
                        
                        <p>Our team has initiated the process. You can track the progress and download your official tax invoice from the portal.</p>
                        
                        <p style='text-align: center;'>
                            <a href='https://avr-associates-erp.pages.dev' class='button'>Open Client Portal</a>
                        </p>
                    ";

                    // Send to Client if email exists
                    if (!empty($clientEmail)) {
                        send_erp_email($clientEmail, $emailSubject, $emailMessage);
                    }

                    // Always send copy to Admin
                    $adminSubject = "[ADMIN] New Engagement & Invoice: $safeCustomer";
                    $adminMessage = "
                        <p><strong>Client:</strong> $safeCustomer ($clientId)</p>
                        <p><strong>Branch:</strong> " . ($input['branch'] ?? 'N/A') . "</p>
                        <hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;'>
                        $emailMessage
                    ";
                    send_erp_email('rajugariventures@gmail.com', $adminSubject, $adminMessage);
                }
            }

            echo json_encode(['message' => 'Entry created and automation triggered', 'id' => $input['id']]);
        } catch (Throwable $e) {
            http_response_code(500);
            $msg = mb_convert_encoding($e->getMessage(), 'UTF-8', 'UTF-8');
            echo json_encode([
                'error' => 'Row Failed (Constraint or Format Error)',
                'details' => $msg
            ], JSON_INVALID_UTF8_SUBSTITUTE);
        }
        break;

    case 'PUT':
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);
        if (empty($input['id'])) {
            http_response_code(400); echo json_encode(['error' => 'Missing ID']); exit;
        }
        $updateFields = [];
        $params = [':id' => $input['id']];
        $keyMap = [
            'referenceCode' => 'reference_code', 'customerName' => 'customer_name', 'serviceName' => 'service_name', 
            'date' => 'date', 'assessmentYear' => 'assessment_year', 'period1' => 'period_1', 'period2' => 'period_2', 
            'dueDate' => 'due_date', 'completedDate' => 'completed_date', 'staffName' => 'staff_name', 
            'incomingDocuments' => 'incoming_documents', 'verifiedBy' => 'verified_by', 'verifiedStatus' => 'verified_status', 
            'arnRefNo' => 'arn_ref_no', 'billNo' => 'bill_no', 'billAmount' => 'bill_amount', 
            'modeOfPayment' => 'mode_of_payment', 'paymentInfo' => 'payment_info', 'billStatus' => 'bill_status', 
            'purposeNarration' => 'purpose_narration', 'status' => 'status', 'remarks' => 'remarks', 'branch' => 'branch'
        ];
        foreach ($keyMap as $jsKey => $dbCol) {
            if (array_key_exists($jsKey, $input)) {
                $updateFields[] = "$dbCol = :$dbCol";
                $val = $input[$jsKey];
                
                // Keep numbers/floats properly parsed, but if string is empty make it null
                if ($val === '') {
                    $val = null;
                }
                
                // Format dates
                if ($jsKey === 'date' || $jsKey === 'dueDate' || $jsKey === 'completedDate') {
                    if (!empty($val) && (strtotime($val) || is_numeric($val))) {
                        $val = is_numeric($val) ? gmdate("Y-m-d", (int)(($val - 25569) * 86400)) : date('Y-m-d', strtotime($val));
                    }
                }
                
                $params[":$dbCol"] = $val;
            }
        }
        
        if (!empty($updateFields)) {
            $sql = "UPDATE incoming_register SET " . implode(', ', $updateFields) . " WHERE id = :id";
            try {
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                echo json_encode(['message' => 'Updated successfully']);
            } catch (Throwable $e) {
                http_response_code(500); echo json_encode(['error' => $e->getMessage()]);
            }
        } else {
            echo json_encode(['message' => 'No fields to update']);
        }
        break;

    case 'DELETE':
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true) ?? [];
        $id = $_GET['id'] ?? $input['id'] ?? '';
        if ($id) {
            $stmt = $pdo->prepare("DELETE FROM incoming_register WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['message' => 'Deleted successfully']);
        } else {
            http_response_code(400); echo json_encode(['error' => 'Missing ID']);
        }
        break;
}
?>

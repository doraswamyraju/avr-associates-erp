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
        
        $sql = "SELECT * FROM incoming_register WHERE 1=1 ";
        $countSql = "SELECT COUNT(*) FROM incoming_register WHERE 1=1 ";
        $params = [];
        
        if ($branch !== 'All Branches') {
            $sql .= "AND branch = :branch ";
            $countSql .= "AND branch = :branch ";
            $params[':branch'] = $branch;
        }
        if (!empty($search)) {
            $sql .= "AND (reference_code LIKE :search OR customer_name LIKE :search) ";
            $countSql .= "AND (reference_code LIKE :search OR customer_name LIKE :search) ";
            $params[':search'] = '%' . $search . '%';
        }
        if (!empty($clientExactName)) {
            $sql .= "AND customer_name = :clientExactName ";
            $countSql .= "AND customer_name = :clientExactName ";
            $params[':clientExactName'] = $clientExactName;
        }
        
        $sql .= "ORDER BY date DESC LIMIT " . (int)$limit . " OFFSET " . (int)$offset;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $countStmt = $pdo->prepare($countSql);
        $countStmt->execute($params);
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
                ':status' => isset($input['status']) ? substr((string)$input['status'], 0, 50) : 'Data Pending',
                ':remarks' => isset($input['remarks']) ? substr((string)$input['remarks'], 0, 1000) : null,
                ':branch' => isset($input['branch']) ? substr((string)$input['branch'], 0, 100) : 'All Branches'
            ]);
            echo json_encode(['message' => 'Entry created', 'id' => $input['id']]);
        } catch (Throwable $e) {
            http_response_code(500);
            $msg = mb_convert_encoding($e->getMessage(), 'UTF-8', 'UTF-8');
            echo json_encode([
                'error' => 'Row Failed (Constraint or Format Error)',
                'details' => $msg
            ], JSON_INVALID_UTF8_SUBSTITUTE);
        }
        break;
}
?>

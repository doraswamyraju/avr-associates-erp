<?php
require_once 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT * FROM incoming_register ORDER BY date DESC");
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
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

        echo json_encode($formatted);
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        if (!isset($input['id'])) {
            $input['id'] = 'INC-' . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
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
        
        $stmt = $pdo->prepare($sql);
        try {
            $stmt->execute([
                ':id' => $input['id'],
                ':reference_code' => $input['referenceCode'] ?? null,
                ':customer_name' => $input['customerName'] ?? null,
                ':service_name' => $input['serviceName'] ?? null,
                ':date' => $input['date'] ?? date('Y-m-d'),
                ':assessment_year' => $input['assessmentYear'] ?? null,
                ':period_1' => $input['period1'] ?? null,
                ':period_2' => $input['period2'] ?? null,
                ':due_date' => $input['dueDate'] ?? null,
                ':completed_date' => $input['completedDate'] ?? null,
                ':staff_name' => $input['staffName'] ?? null,
                ':incoming_documents' => $input['incomingDocuments'] ?? null,
                ':verified_by' => $input['verifiedBy'] ?? null,
                ':verified_status' => $input['verifiedStatus'] ?? null,
                ':arn_ref_no' => $input['arnRefNo'] ?? null,
                ':bill_no' => $input['billNo'] ?? null,
                ':bill_amount' => $input['billAmount'] ?? null,
                ':mode_of_payment' => $input['modeOfPayment'] ?? null,
                ':payment_info' => $input['paymentInfo'] ?? null,
                ':bill_status' => $input['billStatus'] ?? null,
                ':purpose_narration' => $input['purposeNarration'] ?? null,
                ':status' => $input['status'] ?? 'Data Pending',
                ':remarks' => $input['remarks'] ?? null,
                ':branch' => $input['branch'] ?? 'All Branches'
            ]);
            echo json_encode(['message' => 'Entry created', 'id' => $input['id']]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
}
?>

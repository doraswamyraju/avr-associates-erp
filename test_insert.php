<?php
require_once 'public/api/db_connect.php';

$input = [
    'period1' => 44531.00011574074,
    'referenceCode' => 7945,
    'customerName' => 'KALLURI SIVA KUMAR',
    'phone' => 9440112485,
    'staffName' => 22,
    'date' => 44531,
    'id' => 'INC-12345678'
];

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
    
    $date = $input['date'] ?? null;
    if (is_numeric($date)) {
        $date = gmdate("Y-m-d", (int)(($date - 25569) * 86400)); 
    } elseif (empty($date)) {
        $date = date('Y-m-d');
    } else {
        $timestamp = strtotime((string)$date);
        $date = $timestamp ? date('Y-m-d', $timestamp) : date('Y-m-d');
    }
    
    $safeRefCode = isset($input['referenceCode']) ? substr((string)$input['referenceCode'], 0, 50) : null;
    $safeCustomer = isset($input['customerName']) ? substr((string)$input['customerName'], 0, 100) : null;
    
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
    echo "SUCCESS\n";
} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}

<?php
require_once 'db_connect.php';

// Ensure the table has the address and remarks columns (add if missing)
try {
    $pdo->exec("ALTER TABLE visitor_register ADD COLUMN IF NOT EXISTS address VARCHAR(300) NULL");
    $pdo->exec("ALTER TABLE visitor_register ADD COLUMN IF NOT EXISTS remarks TEXT NULL");
} catch (Throwable $e) { /* Ignore if already exists */ }

header('Content-Type: application/json');
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $branch = $_GET['branch'] ?? 'All Branches';
        $search = isset($_GET['search']) ? trim($_GET['search']) : '';
        $limit  = isset($_GET['limit'])  ? (int)$_GET['limit']  : 20;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

        $where  = [];
        $params = [];

        if ($branch !== 'All Branches') {
            $where[]            = "branch = :branch";
            $params[':branch']  = $branch;
        }
        if ($search !== '') {
            $where[]             = "(LOWER(visitor_name) LIKE :search1 OR LOWER(purpose) LIKE :search2 OR LOWER(address) LIKE :search3)";
            $params[':search1']  = '%' . strtolower($search) . '%';
            $params[':search2']  = '%' . strtolower($search) . '%';
            $params[':search3']  = '%' . strtolower($search) . '%';
        }

        $whereStr = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        // Total count
        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM visitor_register $whereStr");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        // Data
        $sql  = "SELECT * FROM visitor_register $whereStr ORDER BY id DESC LIMIT :limit OFFSET :offset";
        $stmt = $pdo->prepare($sql);
        foreach ($params as $k => $v) $stmt->bindValue($k, $v);
        $stmt->bindValue(':limit',  $limit,  PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $formatted = array_map(function($v) {
            return [
                'id'          => $v['id'],
                'visitorName' => $v['visitor_name'],
                'address'     => $v['address'] ?? '',
                'phone'       => $v['contact_no'] ?? '',
                'purpose'     => $v['purpose'] ?? '',
                'remarks'     => $v['remarks'] ?? '',
                'visitDate'   => $v['date'] ?? '',
                'entryTime'   => $v['entry_time'] ?? '',
                'exitTime'    => $v['exit_time'] ?? '',
                'branch'      => $v['branch'] ?? '',
                'status'      => $v['status'] ?? '',
            ];
        }, $data);

        echo json_encode(['data' => $formatted, 'total' => $total]);
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        if (!is_array($input)) { http_response_code(400); echo json_encode(['error' => 'Invalid JSON']); exit; }

        // Support batch import (array of arrays)
        $rows = isset($input[0]) ? $input : [$input];
        $created = 0;

        $sql = "INSERT INTO visitor_register 
                    (id, date, visitor_name, address, purpose, contact_no, remarks, entry_time, exit_time, branch, status)
                VALUES 
                    (:id, :date, :visitor_name, :address, :purpose, :contact_no, :remarks, :entry_time, :exit_time, :branch, :status)
                ON DUPLICATE KEY UPDATE
                    visitor_name = VALUES(visitor_name), address = VALUES(address),
                    purpose = VALUES(purpose), contact_no = VALUES(contact_no),
                    remarks = VALUES(remarks), date = VALUES(date)";

        $stmt = $pdo->prepare($sql);

        foreach ($rows as $row) {
            if (empty($row['id'])) $row['id'] = 'VIS-' . substr(uniqid(), -8);

            // Parse date: Excel serial or string
            $rawDate = $row['visitDate'] ?? $row['date'] ?? null;
            if (is_numeric($rawDate)) {
                $date = gmdate("Y-m-d", (int)(($rawDate - 25569) * 86400));
            } elseif (!empty($rawDate)) {
                $ts   = strtotime((string)$rawDate);
                $date = $ts ? date('Y-m-d H:i:s', $ts) : date('Y-m-d');
            } else {
                $date = date('Y-m-d');
            }

            try {
                $stmt->execute([
                    ':id'           => $row['id'],
                    ':date'         => $date,
                    ':visitor_name' => substr((string)($row['visitorName'] ?? ''), 0, 200),
                    ':address'      => substr((string)($row['address'] ?? ''), 0, 300),
                    ':purpose'      => substr((string)($row['purpose'] ?? ''), 0, 500),
                    ':contact_no'   => substr((string)($row['phone'] ?? $row['contactNo'] ?? ''), 0, 30),
                    ':remarks'      => substr((string)($row['remarks'] ?? ''), 0, 1000),
                    ':entry_time'   => $row['entryTime'] ?? null,
                    ':exit_time'    => $row['exitTime'] ?? null,
                    ':branch'       => substr((string)($row['branch'] ?? 'Ravulapalem'), 0, 100),
                    ':status'       => substr((string)($row['status'] ?? 'In'), 0, 50),
                ]);
                $created++;
            } catch (Throwable $e) {
                // log and continue for batch imports
                error_log("Visitor insert error: " . $e->getMessage());
            }
        }

        echo json_encode(['message' => "$created record(s) saved", 'count' => $created]);
        break;

    case 'PUT':
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['id'])) { http_response_code(400); echo json_encode(['error' => 'Missing ID']); exit; }

        $fields = [];
        $params = [':id' => $input['id']];
        $map = [
            'visitorName' => 'visitor_name', 'address' => 'address',
            'phone' => 'contact_no', 'purpose' => 'purpose',
            'remarks' => 'remarks', 'visitDate' => 'date',
            'entryTime' => 'entry_time', 'exitTime' => 'exit_time',
            'branch' => 'branch', 'status' => 'status'
        ];
        foreach ($map as $js => $db) {
            if (array_key_exists($js, $input)) {
                $fields[]       = "$db = :$db";
                $params[":$db"] = $input[$js] === '' ? null : $input[$js];
            }
        }
        if ($fields) {
            $pdo->prepare("UPDATE visitor_register SET " . implode(', ', $fields) . " WHERE id = :id")->execute($params);
        }
        echo json_encode(['message' => 'Updated']);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? json_decode(file_get_contents('php://input'), true)['id'] ?? '';
        if ($id) {
            $pdo->prepare("DELETE FROM visitor_register WHERE id = ?")->execute([$id]);
            echo json_encode(['message' => 'Deleted']);
        } else {
            http_response_code(400); echo json_encode(['error' => 'Missing ID']);
        }
        break;
}
?>

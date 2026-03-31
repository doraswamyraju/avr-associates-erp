<?php
require_once 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
        $search = $_GET['search'] ?? '';
        $branch = $_GET['branch'] ?? 'All Branches';
        $status = $_GET['status'] ?? '';
        $type = $_GET['type'] ?? '';

        // Note: For backwards compatibility with dropdowns, if no limit is specifically requested and we just want all (or large number),
        // we should still allow it. But the UI usually asks for simple lists without params vs specific views.
        // If a request comes without limit, we'll just return all of them to not break existing staff/client dropdowns.
        $isPaginated = isset($_GET['limit']) || isset($_GET['search']);

        $sql = "SELECT id, name, pan, gstin, type, branch, phone, email, status, group_name, trade_name, dob, address, city, pincode, state, file_number, bank_account_no, bank_name, ifsc_code, refer_by, service_details FROM clients WHERE 1=1";
        $countSql = "SELECT COUNT(*) FROM clients WHERE 1=1";
        $params = [];

        if ($branch !== 'All Branches') {
            $sql .= " AND branch = :branch";
            $countSql .= " AND branch = :branch";
            $params[':branch'] = $branch;
        }

        if (!empty($status)) {
            $sql .= " AND status = :status";
            $countSql .= " AND status = :status";
            $params[':status'] = $status;
        }
        
        if (!empty($type)) {
            $sql .= " AND type = :type";
            $countSql .= " AND type = :type";
            $params[':type'] = $type;
        }

        if (!empty($search)) {
            $sql .= " AND (LOWER(name) LIKE :s1 OR LOWER(pan) LIKE :s2 OR LOWER(phone) LIKE :s3 OR LOWER(email) LIKE :s4)";
            $countSql .= " AND (LOWER(name) LIKE :s1 OR LOWER(pan) LIKE :s2 OR LOWER(phone) LIKE :s3 OR LOWER(email) LIKE :s4)";
            $searchVal = '%' . strtolower($search) . '%';
            $params[':s1'] = $searchVal;
            $params[':s2'] = $searchVal;
            $params[':s3'] = $searchVal;
            $params[':s4'] = $searchVal;
        }

        $sql .= " ORDER BY name ASC";
        
        if ($isPaginated) {
            $sql .= " LIMIT " . (int)$limit . " OFFSET " . (int)$offset;
        }

        $stmt = $pdo->prepare($sql);
        $countStmt = $pdo->prepare($countSql);
        
        foreach($params as $k => $v) {
            $stmt->bindValue($k, $v);
            $countStmt->bindValue($k, $v);
        }

        try {
            $stmt->execute();
            $clients = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Un-JSON the service details for frontend consumption
            foreach ($clients as &$c) {
                if (!empty($c['service_details'])) {
                    $c['serviceDetails'] = json_decode($c['service_details'], true);
                } else {
                    $c['serviceDetails'] = [];
                }
                unset($c['service_details']);
            }

            if ($isPaginated) {
                $countStmt->execute();
                $total = (int)$countStmt->fetchColumn();
                echo json_encode(['data' => $clients, 'total' => $total]);
            } else {
                echo json_encode($clients);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID required']);
            break;
        }

        $sql = "UPDATE clients SET 
                name = :name, pan = :pan, gstin = :gstin, type = :type, branch = :branch, 
                phone = :phone, email = :email, status = :status, group_name = :group_name, 
                trade_name = :trade_name, dob = :dob, address = :address, city = :city, 
                pincode = :pincode, state = :state, file_number = :file_number, 
                bank_account_no = :bank_account_no, bank_name = :bank_name, 
                ifsc_code = :ifsc_code, refer_by = :refer_by, service_details = :service_details
                WHERE id = :id";
        
        try {
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':id' => $data['id'],
                ':name' => $data['name'],
                ':pan' => $data['pan'] ?? null,
                ':gstin' => $data['gstin'] ?? null,
                ':type' => $data['type'] ?? 'Individual',
                ':branch' => $data['branch'] ?? 'Ravulapalem',
                ':phone' => $data['phone'] ?? null,
                ':email' => $data['email'] ?? null,
                ':status' => $data['status'] ?? 'Active',
                ':group_name' => $data['group'] ?? null,
                ':trade_name' => $data['tradeName'] ?? null,
                ':dob' => $data['dob'] ?? null,
                ':address' => $data['address'] ?? null,
                ':city' => $data['city'] ?? null,
                ':pincode' => $data['pincode'] ?? null,
                ':state' => $data['state'] ?? null,
                ':file_number' => $data['fileNumber'] ?? null,
                ':bank_account_no' => $data['bankAccountNo'] ?? null,
                ':bank_name' => $data['bankName'] ?? null,
                ':ifsc_code' => $data['ifscCode'] ?? null,
                ':refer_by' => $data['referBy'] ?? null,
                ':service_details' => isset($data['serviceDetails']) ? json_encode($data['serviceDetails']) : null
            ]);
            echo json_encode(['message' => 'Client updated']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'POST':
        require_once 'mail_utils.php';
        $data = json_decode(file_get_contents('php://input'), true);
        
        $sql = "INSERT INTO clients (id, name, pan, gstin, type, branch, phone, email, status, group_name, trade_name, dob, address, city, pincode, state, file_number, bank_account_no, bank_name, ifsc_code, refer_by, service_details) 
                VALUES (:id, :name, :pan, :gstin, :type, :branch, :phone, :email, :status, :group_name, :trade_name, :dob, :address, :city, :pincode, :state, :file_number, :bank_account_no, :bank_name, :ifsc_code, :refer_by, :service_details)";
        
        // Generate robust unique ID instead of simple random to prevent collisions
        if (empty($data['id'])) {
            $data['id'] = 'C' . substr(uniqid(), -6) . mt_rand(10, 99);
        }

        try {
            $pdo->beginTransaction();
            $stmt = $pdo->prepare($sql);
            
            // Truncate strings to prevent SQL truncation errors during mass import
            $safePhone = isset($data['phone']) ? substr((string)$data['phone'], 0, 20) : null;
            $safeEmail = isset($data['email']) ? substr((string)$data['email'], 0, 100) : null;
            $safeName = isset($data['name']) ? substr((string)$data['name'], 0, 100) : '';

            $stmt->execute([
                ':id' => $data['id'],
                ':name' => $safeName,
                ':pan' => $data['pan'] ?? null,
                ':gstin' => $data['gstin'] ?? null,
                ':type' => $data['type'] ?? 'Individual',
                ':branch' => $data['branch'] ?? 'Ravulapalem',
                ':phone' => $safePhone,
                ':email' => $safeEmail,
                ':status' => $data['status'] ?? 'Active',
                ':group_name' => $data['group'] ?? null,
                ':trade_name' => $data['tradeName'] ?? null,
                ':dob' => $data['dob'] ?? null,
                ':address' => $data['address'] ?? null,
                ':city' => $data['city'] ?? null,
                ':pincode' => $data['pincode'] ?? null,
                ':state' => $data['state'] ?? null,
                ':file_number' => $data['fileNumber'] ?? null,
                ':bank_account_no' => $data['bankAccountNo'] ?? null,
                ':bank_name' => $data['bankName'] ?? null,
                ':ifsc_code' => $data['ifscCode'] ?? null,
                ':refer_by' => $data['referBy'] ?? null,
                ':service_details' => isset($data['serviceDetails']) ? json_encode($data['serviceDetails']) : null
            ]);

            // Create system user for the client
            if ($safeEmail) {
                $resetToken = bin2hex(random_bytes(32));
                $tokenExpiry = date('Y-m-d H:i:s', strtotime('+24 hours'));
                
                // Username can be email or generated from name
                $username = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $safeName)) . mt_rand(100, 999);
                $username = substr($username, 0, 20); // truncate username in case name was very long
                $tempPassword = bin2hex(random_bytes(8));
                $passwordHash = password_hash($tempPassword, PASSWORD_DEFAULT);

                $sqlUser = "INSERT INTO users (id, username, password_hash, name, role, avatar, branch, client_id, email, reset_token, token_expiry) 
                            VALUES (:id, :username, :password_hash, :name, 'Client', :avatar, :branch, :client_id, :email, :reset_token, :token_expiry)";
                
                $stmtUser = $pdo->prepare($sqlUser);
                $stmtUser->execute([
                    ':id' => 'U-' . $data['id'], // Prefix client ID for user table uniqueness
                    ':username' => $username,
                    ':password_hash' => $passwordHash,
                    ':name' => $safeName,
                    ':avatar' => null,
                    ':branch' => $data['branch'] ?? 'Ravulapalem',
                    ':client_id' => $data['id'],
                    ':email' => $safeEmail,
                    ':reset_token' => $resetToken,
                    ':token_expiry' => $tokenExpiry
                ]);

                send_welcome_email($safeEmail, $safeName, $username, $resetToken);
            }

            $pdo->commit();
            echo json_encode(['message' => 'Client created and user account initialized', 'id' => $data['id']]);
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            http_response_code(500);
            $msg = mb_convert_encoding($e->getMessage(), 'UTF-8', 'UTF-8');
            echo json_encode([
                'error' => 'Client Creation Failed',
                'details' => $msg
            ], JSON_INVALID_UTF8_SUBSTITUTE);
        }
        break;

    case 'DELETE':
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare("DELETE FROM clients WHERE id = :id");
            $stmt->execute([':id' => $_GET['id']]);
            echo json_encode(['message' => 'Client deleted']);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'ID required']);
        }
        break;
}
?>

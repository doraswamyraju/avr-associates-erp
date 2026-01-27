<?php
require_once 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT * FROM clients");
        $clients = $stmt->fetchAll();
        echo json_encode($clients);
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
                ifsc_code = :ifsc_code, refer_by = :refer_by
                WHERE id = :id";
        
        $stmt = $pdo->prepare($sql);
        try {
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
                ':refer_by' => $data['referBy'] ?? null
            ]);
            echo json_encode(['message' => 'Client updated']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        
        $sql = "INSERT INTO clients (id, name, pan, gstin, type, branch, phone, email, status, group_name, trade_name, dob, address, city, pincode, state, file_number, bank_account_no, bank_name, ifsc_code, refer_by) 
                VALUES (:id, :name, :pan, :gstin, :type, :branch, :phone, :email, :status, :group_name, :trade_name, :dob, :address, :city, :pincode, :state, :file_number, :bank_account_no, :bank_name, :ifsc_code, :refer_by)";
        
        $stmt = $pdo->prepare($sql);
        
        // Generate ID if not provided or empty string
        if (empty($data['id'])) {
            $data['id'] = 'C' . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
        }

        try {
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
                ':refer_by' => $data['referBy'] ?? null
            ]);
            echo json_encode(['message' => 'Client created', 'id' => $data['id']]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
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

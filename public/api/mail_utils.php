<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

// Path to PHPMailer files
$phpmailer_path = __DIR__ . '/libs/PHPMailer/';
if (file_exists($phpmailer_path . 'PHPMailer.php')) {
    require_once $phpmailer_path . 'Exception.php';
    require_once $phpmailer_path . 'PHPMailer.php';
    require_once $phpmailer_path . 'SMTP.php';
}

/**
 * Utility function to send emails.
 * Using PHPMailer with Gmail SMTP for reliability.
 */
function send_erp_email($to, $subject, $message) {
    // If PHPMailer is not available, fallback to basic mail() and log it
    if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) {
        $headers = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
        $headers .= "From: AVR Associates <rajugariventures@gmail.com>" . "\r\n";
        $html = "<html><body><div style='font-family: sans-serif;'>$message</div></body></html>";
        
        $log_file = __DIR__ . '/../mail_log.txt';
        file_put_contents($log_file, "[" . date('Y-m-d H:i:s') . "] FALLBACK TO mail(): TO: $to | SUBJECT: $subject\n", FILE_APPEND);
        return @mail($to, $subject, $html, $headers);
    }

    $mail = new PHPMailer(true);

    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        // User provided credentials
        $mail->Username   = 'rajugariventures@gmail.com';
        $mail->Password   = 'vsyndrgwqprwtkgo';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;

        // Recipients
        $mail->setFrom('rajugariventures@gmail.com', 'AVR Associates ERP');
        if (is_array($to)) {
            foreach($to as $address) $mail->addAddress($address);
        } else {
            $mail->addAddress($to);
        }

        // Content
        $mail->isHTML(true);
        $mail->Subject = $subject;
        
        $html_template = "
        <html>
        <head>
            <style>
                body { font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; line-height: 1.6; background-color: #f8fafc; }
                .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
                .header { background: #4f46e5; color: white; padding: 40px 20px; text-align: center; }
                .content { padding: 40px; }
                .footer { padding: 30px; text-align: center; font-size: 12px; color: #94a3b8; background-color: #f1f5f9; }
                .button { display: inline-block; padding: 14px 28px; background: #4f46e5; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: bold; margin-top: 24px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2); }
                .highlight { color: #4f46e5; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1 style='margin:0; font-size: 24px; letter-spacing: -0.025em; font-weight: 800;'>AVR ASSOCIATES</h1>
                    <p style='margin:5px 0 0; opacity: 0.8; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em;'>ERP Ecosystem</p>
                </div>
                <div class='content'>
                    $message
                </div>
                <div class='footer'>
                    <p>&copy; " . date('Y') . " AVR Associates & Co. All rights reserved.</p>
                    <p>Ravulapalem | Hyderabad | Bangalore</p>
                </div>
            </div>
        </body>
        </html>
        ";
        
        $mail->Body = $html_template;
        $mail->send();

        // Log sucess
        $log_file = __DIR__ . '/../mail_log.txt';
        file_put_contents($log_file, "[" . date('Y-m-d H:i:s') . "] SMTP SUCCESS: TO: " . (is_array($to) ? implode(',', $to) : $to) . " | SUBJECT: $subject\n", FILE_APPEND);
        
        return true;
    } catch (Exception $e) {
        $log_file = __DIR__ . '/../mail_log.txt';
        file_put_contents($log_file, "[" . date('Y-m-d H:i:s') . "] SMTP ERROR: {$mail->ErrorInfo}\n", FILE_APPEND);
        return false;
    }
}

function send_welcome_email($to, $name, $username, $reset_token) {
    $reset_link = "http://" . $_SERVER['HTTP_HOST'] . "/?action=reset&token=" . $reset_token;
    
    $subject = "Welcome to AVR Associates ERP Ecosystem";
    $message = "
        <h3 style='font-size: 20px; font-weight: 800; margin-bottom: 16px;'>Hello $name,</h3>
        <p>A new account has been created for you in the <span class='highlight'>AVR Associates ERP</span> system.</p>
        <div style='background: #f8fafc; padding: 20px; border-radius: 16px; margin: 24px 0; border: 1px solid #e2e8f0;'>
            <p style='margin:0;'><strong>Username:</strong> $username</p>
        </div>
        <p>Before you can log in, you must set your password by clicking the button below:</p>
        <p style='text-align: center;'>
            <a href='$reset_link' class='button'>Set Your Password</a>
        </p>
        <p style='margin-top: 24px; font-size: 13px; color: #64748b;'>This link will expire in 24 hours. If you didn't expect this, please contact support.</p>
    ";
    
    return send_erp_email($to, $subject, $message);
}

function send_password_reset_email($to, $name, $reset_token) {
    $reset_link = "http://" . $_SERVER['HTTP_HOST'] . "/?action=reset&token=" . $reset_token;
    
    $subject = "Password Reset Request - AVR Associates ERP";
    $message = "
        <h3 style='font-size: 20px; font-weight: 800; margin-bottom: 16px;'>Hello $name,</h3>
        <p>We received a request to reset your password for your account.</p>
        <p>Click the button below to secure your account with a new password:</p>
        <p style='text-align: center;'>
            <a href='$reset_link' class='button'>Reset Password</a>
        </p>
        <p style='margin-top: 24px; font-size: 13px; color: #64748b;'>This link will expire in 1 hour. If you did not request this, please ignore this email.</p>
    ";
    
    return send_erp_email($to, $subject, $message);
}

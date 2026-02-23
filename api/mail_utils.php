<?php

/**
 * Utility function to send emails.
 * In a real production environment, you might use PHPMailer or a service like SendGrid.
 * For this ERP, we'll start with a flexible wrapper around PHP's mail().
 */
function send_erp_email($to, $subject, $message) {
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: AVR Associates <noreply@avr-associates.com>" . "\r\n";
    $headers .= "Reply-To: support@avr-associates.com" . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    // The message should be HTML
    $html_template = "
    <html>
    <head>
        <style>
            body { font-family: 'Inter', sans-serif; color: #333; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
            .header { background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { padding: 30px; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #777; }
            .button { display: inline-block; padding: 12px 24px; background: #4f46e5; color: white !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2>AVR Associates ERP</h2>
            </div>
            <div class='content'>
                $message
            </div>
            <div class='footer'>
                <p>&copy; " . date('Y') . " AVR Associates. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    ";

    // For development/debugging, if we can't send real mail, we log it to a file
    $log_file = __DIR__ . '/../mail_log.txt';
    $log_entry = "[" . date('Y-m-d H:i:s') . "] TO: $to | SUBJECT: $subject\nBODY:\n$message\n------------------------------\n";
    file_put_contents($log_file, $log_entry, FILE_APPEND);

    // Try sending
    return @mail($to, $subject, $html_template, $headers);
}

function send_welcome_email($to, $name, $username, $reset_token) {
    $reset_link = "http://" . $_SERVER['HTTP_HOST'] . "/?action=reset&token=" . $reset_token;
    
    $subject = "Welcome to AVR Associates ERP Ecosystem";
    $message = "
        <h3>Hello $name,</h3>
        <p>A new account has been created for you in the AVR Associates ERP system.</p>
        <p><strong>Username:</strong> $username</p>
        <p>Before you can log in, you must set your password by clicking the button below:</p>
        <p style='text-align: center;'>
            <a href='$reset_link' class='button'>Set Your Password</a>
        </p>
        <p>This link will expire in 24 hours.</p>
        <p>If the button doesn't work, copy and paste this link into your browser:<br>$reset_link</p>
    ";
    
    return send_erp_email($to, $subject, $message);
}

function send_password_reset_email($to, $name, $reset_token) {
    $reset_link = "http://" . $_SERVER['HTTP_HOST'] . "/?action=reset&token=" . $reset_token;
    
    $subject = "Password Reset Request - AVR Associates ERP";
    $message = "
        <h3>Hello $name,</h3>
        <p>We received a request to reset your password for your AVR Associates ERP account.</p>
        <p>Click the button below to set a new password:</p>
        <p style='text-align: center;'>
            <a href='$reset_link' class='button'>Reset Password</a>
        </p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
        <p>If the button doesn't work, copy and paste this link into your browser:<br>$reset_link</p>
    ";
    
    return send_erp_email($to, $subject, $message);
}

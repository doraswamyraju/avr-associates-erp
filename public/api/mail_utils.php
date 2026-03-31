<?php

/**
 * Helper to read SMTP responses
 */
function get_smtp_response($socket) {
    $response = "";
    while ($str = fgets($socket, 515)) {
        $response .= $str;
        if (substr($str, 3, 1) == " ") break;
    }
    return $response;
}

/**
 * Robust SMTP Email Sender
 * Directly communicates with smtp.gmail.com without extra library requirements.
 */
function send_erp_email($to, $subject, $message) {
    $user = 'rajugariventures@gmail.com';
    $pass = 'vsyndrgwqprwtkgo';
    $host = 'smtp.gmail.com';
    $port = 587;
    $from = 'rajugariventures@gmail.com';

    $html_template = "
    <html>
    <head>
        <style>
            body { font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; line-height: 1.6; background-color: #f8fafc; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
            .header { background: #4f46e5; color: white; padding: 40px 20px; text-align: center; }
            .content { padding: 40px; }
            .footer { padding: 30px; text-align: center; font-size: 12px; color: #94a3b8; background-color: #f1f5f9; }
            .button { display: inline-block; padding: 14px 28px; background: #4f46e5; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: bold; margin-top: 24px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'><h1 style='margin:0;'>AVR ASSOCIATES</h1></div>
            <div class='content'>$message</div>
            <div class='footer'>&copy; " . date('Y') . " AVR Associates & Co.</div>
        </div>
    </body>
    </html>";

    try {
        $timeout = 10;
        $socket = @fsockopen($host, $port, $errno, $errstr, $timeout);
        if (!$socket) {
            // Fallback to mail() if socket fails
            $headers = "MIME-Version: 1.0\r\nContent-type:text/html;charset=UTF-8\r\nFrom: AVR Associates <$from>\r\n";
            return @mail(is_array($to) ? implode(',', $to) : $to, $subject, $html_template, $headers);
        }

        get_smtp_response($socket); 
        fwrite($socket, "EHLO " . ($_SERVER['HTTP_HOST'] ?? 'localhost') . "\r\n");
        get_smtp_response($socket);
        
        fwrite($socket, "STARTTLS\r\n");
        get_smtp_response($socket);
        stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);

        fwrite($socket, "EHLO " . ($_SERVER['HTTP_HOST'] ?? 'localhost') . "\r\n");
        get_smtp_response($socket);

        fwrite($socket, "AUTH LOGIN\r\n");
        get_smtp_response($socket);
        fwrite($socket, base64_encode($user) . "\r\n");
        get_smtp_response($socket);
        fwrite($socket, base64_encode($pass) . "\r\n");
        $auth = get_smtp_response($socket);

        if (strpos($auth, '235') === false) {
            fclose($socket);
            return false;
        }

        $to_list = is_array($to) ? $to : [$to];
        foreach($to_list as $recipient) {
            fwrite($socket, "MAIL FROM: <$from>\r\n");
            get_smtp_response($socket);
            fwrite($socket, "RCPT TO: <$recipient>\r\n");
            get_smtp_response($socket);
            fwrite($socket, "DATA\r\n");
            get_smtp_response($socket);

            $headers = "MIME-Version: 1.0\r\nContent-type: text/html; charset=UTF-8\r\nTo: $recipient\r\nFrom: AVR Associates <$from>\r\nSubject: $subject\r\nDate: " . date('r') . "\r\n";
            fwrite($socket, $headers . "\r\n" . $html_template . "\r\n.\r\n");
            get_smtp_response($socket);
        }

        fwrite($socket, "QUIT\r\n");
        fclose($socket);
        return true;
    } catch (Exception $e) {
        return false;
    }
}

function send_welcome_email($to, $name, $username, $reset_token) {
    $reset_link = "https://" . $_SERVER['HTTP_HOST'] . "/?action=reset&token=" . $reset_token;
    return send_erp_email($to, "Welcome to AVR Associates", "<p>Hello $name,</p><p>Your username is: $username</p><p><a href='$reset_link' class='button'>Set Password</a></p>");
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

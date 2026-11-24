<?php
/**
 * Jason FX Academy — classic Gmail SMTP lead endpoint (PHP).
 * POST /api/lead.php  — JSON or form-encoded.
 *
 * This is the SMTP route. It does NOT run on Cloudflare Pages (Pages is
 * static + Workers). Use it on any PHP host / cPanel hosting:
 *   1. composer require phpmailer/phpmailer
 *   2. Copy config.example.php to config.php and fill in your Gmail details.
 *      Use a Gmail App Password, not your normal Gmail password.
 *      Google Account > Security > 2-Step Verification > App passwords.
 *   3. Point the form at /api/lead.php instead of /api/lead.
 *
 * On Cloudflare Pages, use functions/api/lead.js (Gmail API) instead.
 * See GMAIL_SETUP.md.
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require __DIR__ . '/config.php';           // defines GMAIL_USER, GMAIL_APP_PASSWORD, LEAD_TO_EMAIL
require __DIR__ . '/../vendor/autoload.php'; // PHPMailer, via Composer

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: $_POST;
if (!is_array($body)) $body = [];

if (!empty($body['website'])) { echo json_encode(['ok' => true]); exit; } // honeypot

$name       = trim($body['name'] ?? '');
$email      = trim($body['email'] ?? '');
$whatsapp   = trim($body['whatsapp'] ?? '');
$experience = trim($body['experience'] ?? '');
$market     = trim($body['market'] ?? '');
$country    = trim($body['country'] ?? '');

if (mb_strlen($name) < 2) { http_response_code(400); echo json_encode(['ok'=>false,'message'=>'Please add your full name.']); exit; }
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { http_response_code(400); echo json_encode(['ok'=>false,'message'=>'Please add a valid email address.']); exit; }

$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = GMAIL_USER;            // your Gmail address
    $mail->Password   = GMAIL_APP_PASSWORD;    // 16-character App Password, no spaces
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;
    $mail->CharSet    = 'UTF-8';

    $mail->setFrom(GMAIL_USER, 'Jason FX Academy');
    $mail->addAddress(LEAD_TO_EMAIL);
    $mail->addReplyTo($email, $name);
    $mail->Subject = "New Jason FX Academy lead — {$name}";
    $mail->isHTML(true);
    $mail->Body = sprintf(
        '<h2>New Jason FX Academy lead</h2>
         <p><strong>Name:</strong> %s<br><strong>Email:</strong> %s<br><strong>WhatsApp:</strong> %s<br>
         <strong>Experience:</strong> %s<br><strong>Wants to trade:</strong> %s<br><strong>Country:</strong> %s</p>
         <p>Reply to this lead at %s.</p>',
        htmlspecialchars($name), htmlspecialchars($email), htmlspecialchars($whatsapp ?: '—'),
        htmlspecialchars($experience ?: '—'), htmlspecialchars($market ?: '—'), htmlspecialchars($country ?: '—'),
        htmlspecialchars($email)
    );
    $mail->AltBody = "New lead from jasonfxacademy.com\nName: $name\nEmail: $email\nWhatsApp: $whatsapp\nExperience: $experience\nWants to trade: $market\nCountry: $country";

    $mail->send();
    echo json_encode(['ok' => true, 'message' => 'Lead sent.']);
} catch (Exception $e) {
    http_response_code(502);
    echo json_encode(['ok' => false, 'message' => 'Gmail SMTP could not send the lead email. Check the App Password and Gmail settings.']);
}

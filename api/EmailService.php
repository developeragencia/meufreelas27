<?php
/**
 * MeuFreelas - Envio de e-mails via PHPMailer (SMTP Hostinger)
 * Requer: Composer e phpmailer/phpmailer (api/composer.phar install --no-dev)
 * Remetente: noreply@meufreelas.com.br
 */

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

class EmailService
{
    private string $host;
    private int $port;
    private string $user;
    private string $pass;
    private string $fromEmail;
    private string $fromName;

    public function __construct(array $env)
    {
        $this->host = trim($env['SMTP_HOST'] ?? 'smtp.hostinger.com');
        $this->port = (int)($env['SMTP_PORT'] ?? 465);
        $this->user = trim($env['SMTP_USER'] ?? '');
        $this->pass = $env['SMTP_PASS'] ?? '';
        $this->fromEmail = trim($env['SMTP_FROM'] ?? 'noreply@meufreelas.com.br');
        $this->fromName = trim($env['SMTP_FROM_NAME'] ?? 'MeuFreelas');
    }

    public function isConfigured(): bool
    {
        return $this->user !== '' && $this->pass !== '';
    }

    /**
     * Envia e-mail via SMTP (PHPMailer).
     * Porta 465 = SSL, 587 = STARTTLS (Hostinger).
     */
    public function send(string $to, string $subject, string $bodyHtml, string $bodyText = ''): bool
    {
        if (!$this->isConfigured()) {
            error_log('EmailService: SMTP não configurado. Defina SMTP_USER e SMTP_PASS no api/.env ou variáveis de ambiente.');
            return false;
        }

        $to = trim($to);
        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
            error_log('EmailService: e-mail inválido: ' . $to);
            return false;
        }

        $autoload = __DIR__ . '/vendor/autoload.php';
        if (!file_exists($autoload)) {
            error_log('EmailService: execute na pasta api: php composer.phar install --no-dev');
            return false;
        }
        require_once $autoload;

        try {
            $mail = new PHPMailer(true);
            $mail->isSMTP();
            $mail->Host = $this->host;
            $mail->SMTPAuth = true;
            $mail->Username = $this->user;
            $mail->Password = $this->pass;
            $mail->SMTPSecure = $this->port === 465 ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = $this->port;
            $mail->CharSet = PHPMailer::CHARSET_UTF8;
            $mail->Encoding = 'base64';
            $mail->setFrom($this->fromEmail, $this->fromName);
            $mail->addAddress($to);
            $mail->Subject = $subject;
            $mail->isHTML(true);
            $mail->Body = $bodyHtml;
            $mail->AltBody = $bodyText ?: strip_tags(preg_replace('/<br\s*\/?>/i', "\n", $bodyHtml));

            $mail->send();
            return true;
        } catch (PHPMailerException $e) {
            $msg = (isset($mail) && $mail instanceof PHPMailer) ? $mail->ErrorInfo : $e->getMessage();
            error_log('EmailService: ' . $msg);
            return false;
        }
    }

    private function layout(string $title, string $content, string $ctaText = '', string $ctaUrl = ''): string
    {
        $cta = '';
        if ($ctaText !== '' && $ctaUrl !== '') {
            $cta = '<p style="margin:24px 0;"><a href="' . htmlspecialchars($ctaUrl) . '" style="background:#003366;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;">' . htmlspecialchars($ctaText) . '</a></p>';
        }
        return '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#333;">'
            . '<div style="margin-bottom:24px;"><strong style="font-size:20px;color:#003366;">meu<span style="font-weight:300;">freelas</span></strong></div>'
            . '<h2 style="color:#003366;">' . htmlspecialchars($title) . '</h2>'
            . '<div style="line-height:1.6;">' . $content . '</div>'
            . $cta
            . '<p style="margin-top:32px;font-size:12px;color:#666;">Este e-mail foi enviado por MeuFreelas. Não responda diretamente.</p>'
            . '</body></html>';
    }

    public function sendActivationEmail(string $to, string $name, string $type, string $activationLink): bool
    {
        $tipo = $type === 'freelancer' ? 'freelancer' : 'contratante';
        $subject = 'Ative sua conta MeuFreelas';
        $content = '<p>Olá, <strong>' . htmlspecialchars($name) . '</strong>!</p>'
            . '<p>Sua conta foi criada. Você está cadastrado como <strong>' . $tipo . '</strong>.</p>'
            . '<p><strong>Ative sua conta</strong> clicando no botão abaixo. Só depois disso você poderá acessar o painel.</p>';
        return $this->send($to, $subject, $this->layout('Ative sua conta', $content, 'Ativar minha conta', $activationLink), "Olá, $name! Ative sua conta em: $activationLink");
    }

    public function sendWelcomeActivation(string $to, string $name, string $type): bool
    {
        $tipo = $type === 'freelancer' ? 'freelancer' : 'contratante';
        $subject = 'Bem-vindo ao MeuFreelas';
        $content = '<p>Olá, <strong>' . htmlspecialchars($name) . '</strong>!</p>'
            . '<p>Sua conta está ativa. Você está cadastrado como <strong>' . $tipo . '</strong>.</p>'
            . '<p>Já pode acessar o painel e começar a usar a plataforma.</p>';
        $loginUrl = 'https://meufreelas.com.br/login';
        return $this->send($to, $subject, $this->layout('Conta ativada', $content, 'Acessar minha conta', $loginUrl), "Olá, $name! Acesse: $loginUrl");
    }

    public function sendProposalApproved(string $to, string $freelancerName, string $projectTitle, string $clientName): bool
    {
        $subject = 'Sua proposta foi aprovada – ' . $projectTitle;
        $content = '<p>Olá, <strong>' . htmlspecialchars($freelancerName) . '</strong>!</p>'
            . '<p>Sua proposta para o projeto <strong>' . htmlspecialchars($projectTitle) . '</strong> foi aprovada por <strong>' . htmlspecialchars($clientName) . '</strong>.</p>'
            . '<p>Acesse o painel para ver os detalhes e iniciar o trabalho.</p>';
        $url = 'https://meufreelas.com.br/freelancer/proposals';
        return $this->send($to, $subject, $this->layout('Proposta aprovada', $content, 'Ver propostas', $url), "Sua proposta para $projectTitle foi aprovada. Acesse: $url");
    }

    public function sendNewProposalToClient(string $to, string $clientName, string $projectTitle, string $freelancerName): bool
    {
        $subject = 'Nova proposta em: ' . $projectTitle;
        $content = '<p>Olá, <strong>' . htmlspecialchars($clientName) . '</strong>!</p>'
            . '<p>Você recebeu uma nova proposta de <strong>' . htmlspecialchars($freelancerName) . '</strong> no projeto <strong>' . htmlspecialchars($projectTitle) . '</strong>.</p>'
            . '<p>Acesse o painel para revisar e aprovar ou recusar.</p>';
        $url = 'https://meufreelas.com.br/my-projects';
        return $this->send($to, $subject, $this->layout('Nova proposta', $content, 'Ver projeto', $url), "Nova proposta de $freelancerName em $projectTitle. Acesse: $url");
    }

    public function sendSubscriptionActivated(string $to, string $name, string $planName, string $expiryDate): bool
    {
        $subject = 'Assinatura ativada – MeuFreelas ' . $planName;
        $content = '<p>Olá, <strong>' . htmlspecialchars($name) . '</strong>!</p>'
            . '<p>Sua assinatura do plano <strong>' . htmlspecialchars($planName) . '</strong> foi ativada.</p>'
            . '<p>Válida até: <strong>' . htmlspecialchars($expiryDate) . '</strong>.</p>'
            . '<p>Aproveite os benefícios exclusivos no painel.</p>';
        $url = 'https://meufreelas.com.br/premium';
        return $this->send($to, $subject, $this->layout('Assinatura ativada', $content, 'Ver assinatura', $url), "Assinatura $planName ativada. Válida até $expiryDate. Acesse: $url");
    }

    public function sendSubscriptionReminder(string $to, string $name, string $planName, int $daysLeft): bool
    {
        $subject = 'Sua assinatura MeuFreelas renova em ' . $daysLeft . ' dia(s)';
        $content = '<p>Olá, <strong>' . htmlspecialchars($name) . '</strong>!</p>'
            . '<p>Seu plano <strong>' . htmlspecialchars($planName) . '</strong> renova em <strong>' . $daysLeft . ' dia(s)</strong>.</p>'
            . '<p>Mantenha seus benefícios ativos renovando no painel.</p>';
        $url = 'https://meufreelas.com.br/premium';
        return $this->send($to, $subject, $this->layout('Lembrete de renovação', $content, 'Renovar assinatura', $url), "Assinatura renova em $daysLeft dias. Acesse: $url");
    }

    public function sendPaymentReceived(string $to, string $name, string $amount, string $projectTitle): bool
    {
        $subject = 'Pagamento recebido – ' . $amount;
        $content = '<p>Olá, <strong>' . htmlspecialchars($name) . '</strong>!</p>'
            . '<p>Você recebeu um pagamento de <strong>' . htmlspecialchars($amount) . '</strong> referente ao projeto <strong>' . htmlspecialchars($projectTitle) . '</strong>.</p>'
            . '<p>O valor será creditado conforme o prazo da plataforma.</p>';
        $url = 'https://meufreelas.com.br/payments';
        return $this->send($to, $subject, $this->layout('Pagamento recebido', $content, 'Ver pagamentos', $url), "Pagamento de $amount recebido. Projeto: $projectTitle. Acesse: $url");
    }

    public function sendPaymentConfirmation(string $to, string $name, string $amount, string $freelancerName): bool
    {
        $subject = 'Pagamento confirmado – ' . $amount;
        $content = '<p>Olá, <strong>' . htmlspecialchars($name) . '</strong>!</p>'
            . '<p>Seu pagamento de <strong>' . htmlspecialchars($amount) . '</strong> para <strong>' . htmlspecialchars($freelancerName) . '</strong> foi processado com sucesso.</p>'
            . '<p>O freelancer será notificado e o valor será repassado conforme nossos termos.</p>';
        $url = 'https://meufreelas.com.br/payments';
        return $this->send($to, $subject, $this->layout('Pagamento confirmado', $content, 'Ver pagamentos', $url), "Pagamento de $amount confirmado. Acesse: $url");
    }

    public function sendPasswordReset(string $to, string $name, string $resetLink, int $expiryMinutes = 60): bool
    {
        $subject = 'Redefinir senha – MeuFreelas';
        $content = '<p>Olá, <strong>' . htmlspecialchars($name) . '</strong>!</p>'
            . '<p>Você solicitou a redefinição de senha. Clique no botão abaixo (válido por ' . $expiryMinutes . ' minutos):</p>'
            . '<p>Se não foi você, ignore este e-mail.</p>';
        return $this->send($to, $subject, $this->layout('Redefinir senha', $content, 'Redefinir senha', $resetLink), "Redefina sua senha: $resetLink");
    }

    public function sendProjectCompleted(string $to, string $clientName, string $projectTitle, string $freelancerName): bool
    {
        $subject = 'Projeto concluído: ' . $projectTitle;
        $content = '<p>Olá, <strong>' . htmlspecialchars($clientName) . '</strong>!</p>'
            . '<p>O projeto <strong>' . htmlspecialchars($projectTitle) . '</strong> foi marcado como concluído por <strong>' . htmlspecialchars($freelancerName) . '</strong>.</p>'
            . '<p>Confira o resultado e finalize o pagamento no painel.</p>';
        $url = 'https://meufreelas.com.br/my-projects';
        return $this->send($to, $subject, $this->layout('Projeto concluído', $content, 'Ver projetos', $url), "Projeto $projectTitle concluído. Acesse: $url");
    }
}

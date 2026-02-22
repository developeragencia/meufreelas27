# Composer e PHPMailer (e-mails MeuFreelas)

## O que está instalado

- **Composer** (composer.phar na pasta api/) – gerenciador de dependências PHP.
- **PHPMailer** (vendor/phpmailer/phpmailer) – envio de e-mails via SMTP (Hostinger).

## No seu computador (desenvolvimento)

Para instalar ou atualizar dependências:

```bash
cd api
php composer.phar install --no-dev
```

## No servidor (Hostinger / deploy)

A pasta **vendor/** deve ser enviada junto com a api/ no deploy. Assim o PHPMailer já funciona sem rodar Composer no servidor.

Se no servidor não houver a pasta vendor/, acesse a pasta da API (por SSH ou Gerenciador de Arquivos) e execute:

```bash
php composer.phar install --no-dev
```

Ou baixe o composer.phar em https://getcomposer.org/download/ e coloque na pasta api/, depois execute o comando acima.

## Variáveis de ambiente

Configure no .env ou no painel da Hostinger:

- SMTP_HOST=smtp.hostinger.com
- SMTP_PORT=465 (ou 587)
- SMTP_USER=noreply@meufreelas.com.br
- SMTP_PASS=senha da caixa de e-mail

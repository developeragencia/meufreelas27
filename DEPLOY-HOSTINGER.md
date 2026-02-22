# Deploy MeuFreelas — 100% Hostinger

Este projeto está configurado **somente para Hostinger**. Não há configurações de Netlify ou outros provedores.

---

## O que o projeto usa

| Item | Detalhe |
|------|--------|
| **Frontend** | React 19 + Vite 7 + TypeScript |
| **Roteamento** | HashRouter (URLs: `https://meufreelas.com.br/#/projects`) |
| **Servidor** | Apache (Hostinger) — `.htaccess` na pasta `public` |
| **Dados** | localStorage (até conectar o banco) |

---

## Checklist antes do deploy

- [x] `vite.config.ts`: `base: '/'`
- [x] `index.html`: canonical e Open Graph em `https://meufreelas.com.br`
- [x] `robots.txt` e `sitemap.xml` com domínio correto
- [x] `public/.htaccess`: HTTPS, SPA e 404 para Hostinger
- [x] Nenhum arquivo ou referência à Netlify
- [ ] Rodar `npm install` e `npm run build` na pasta `app`
- [ ] Enviar **apenas** o conteúdo de `app/dist` para a pasta pública do domínio na Hostinger
- [ ] (Opcional) Adicionar imagem `og-image.jpg` em `public` (1200x630px) para redes sociais

---

## Passo a passo na Hostinger

### 1. Build local (com URL da API para salvar usuários no banco)

Para o **cadastro e login salvarem no banco**, o build precisa da URL da API. Na raiz do repositório:

```bash
cd app
cp .env.example .env
# Edite app/.env e deixe: VITE_API_URL=https://meufreelas.com.br/api
npm install
npm run build
```

Se `VITE_API_URL` não estiver definido no momento do build, o app usa só localStorage e **nenhum usuário é salvo no banco**.

### 2. O que enviar (só a pasta dist)

O build **já copia a pasta api/** para dentro de `dist/api/`. Você envia **só o conteúdo de `app/dist`** para a raiz do site (ex.: `public_html/`).

Estrutura no servidor após o upload:

```
public_html/
  index.html
  assets/
  404.php
  .htaccess
  api/
    .env          ← já vem do build (edite no servidor: DB_PASS e SMTP_PASS)
    .env.example
    .htaccess
    setup.php
    auth.php
    health.php
    EmailService.php
    ...
```

No servidor: abra `api/.env` e preencha **DB_PASS** (senha do MySQL) e **SMTP_PASS** (senha do e-mail noreply). Depois acesse **https://meufreelas.com.br/api/setup.php** uma vez.

### 3. Configurações no painel Hostinger

- **Domínio:** aponte o domínio (ou subdomínio) para a pasta onde você enviou os arquivos.
- **SSL:** ative SSL gratuito (Let’s Encrypt) para HTTPS.
- **PHP/Node:** para este frontend estático não é obrigatório; quando houver API/backend, use a opção adequada (ex.: Node ou PHP na Hostinger).

---

## .htaccess (já incluso)

O arquivo `app/public/.htaccess` é copiado para `dist` no build e já contém:

- Redirecionamento HTTP → HTTPS (301)
- Regras de rewrite para SPA (qualquer rota → `index.html`)
- `ErrorDocument 404` → `/index.html`
- Cache para imagens e CSS/JS
- Headers de segurança (X-Content-Type-Options, X-Frame-Options)

Não é necessário criar outro `.htaccess` na Hostinger.

---

## Banco de dados e API (cadastro/login salvando usuários)

1. **Envie a pasta `api/`** para o servidor (ex.: `public_html/api/` ou a pasta do domínio).
2. **Crie `api/.env`** no servidor com os dados do MySQL da Hostinger:
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`
3. **Rode o setup uma vez:** abra no navegador `https://meufreelas.com.br/api/setup.php`. Deve retornar `"ok": true` e "Teste de escrita em users: sucesso". Se aparecer erro, corrija o `.env` e rode de novo.
4. **Verifique:** abra `https://meufreelas.com.br/api/health.php`. Deve mostrar `"database": "on"` e `"usersCount": 0` (ou o número de usuários).
5. **Build do app com API:** no passo 1 acima, use `app/.env` com `VITE_API_URL=https://meufreelas.com.br/api` antes de `npm run build`. Assim o frontend chama a API e os usuários passam a ser salvos na tabela `users`.

---

## E-mails automáticos (SMTP Hostinger)

A API envia e-mails automáticos (boas-vindas, aprovação, assinatura, pagamento, etc.) via SMTP da Hostinger.

**Configuração:**

1. No painel Hostinger: **E-mails** → **Conectar apps e dispositivos** → use **smtp.hostinger.com**, porta **465**, SSL/TLS.
2. Crie ou use a caixa **noreply@meufreelas.com.br** (recomendado para envios automáticos).
3. No servidor, no arquivo **`api/.env`**, adicione (com a senha real da caixa de e-mail):

```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=noreply@meufreelas.com.br
SMTP_PASS=senha_da_caixa_noreply
SMTP_FROM=noreply@meufreelas.com.br
SMTP_FROM_NAME=MeuFreelas
```

**E-mails implementados:** ativação de cadastro (após registro), aprovação de proposta, nova proposta ao cliente, assinatura ativada, lembrete de renovação, pagamento recebido/confirmado, redefinição de senha, projeto concluído. O envio de boas-vindas já é disparado no cadastro; os demais são chamados quando você integrar as ações correspondentes na API (propostas, pagamentos, etc.).

---

## Resumo

- **Tudo é Hostinger:** servidor Apache, `.htaccess`, sem Netlify.
- **Deploy:** build em `app` → enviar conteúdo de `app/dist` para a pasta pública do domínio.
- **HTTPS:** ativar SSL no painel e usar o `.htaccess` já incluso.

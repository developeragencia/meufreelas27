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

### 1. Build local

Na raiz do repositório:

```bash
cd app
npm install
npm run build
```

### 2. O que enviar

Envie **todo o conteúdo** da pasta **`app/dist`** para a pasta pública do seu domínio na Hostinger (geralmente `public_html` ou a pasta do domínio `meufreelas.com.br`).

Estrutura esperada na raiz do site:

```
index.html
assets/
favicon.svg
manifest.json
robots.txt
sitemap.xml
.htaccess
og-image.jpg   (opcional; criar se quiser preview em redes sociais)
```

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

## Quando tiver o banco de dados

1. Copie `app/.env.example` para `app/.env` e preencha com os dados que a Hostinger fornecer.
2. Se houver backend/API, configure a URL da API (ex.: `VITE_API_URL`) no `.env` e faça um novo build antes de subir de novo.

---

## Resumo

- **Tudo é Hostinger:** servidor Apache, `.htaccess`, sem Netlify.
- **Deploy:** build em `app` → enviar conteúdo de `app/dist` para a pasta pública do domínio.
- **HTTPS:** ativar SSL no painel e usar o `.htaccess` já incluso.

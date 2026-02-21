# MeuFreelas — Frontend

Plataforma para conectar clientes e freelancers. Deploy configurado **somente para Hostinger**.

## Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS + shadcn/ui
- React Router (HashRouter)

## Desenvolvimento

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

## Build para produção (Hostinger)

```bash
npm install
npm run build
```

Enviar o conteúdo da pasta **`dist`** para a pasta pública do domínio na Hostinger. Ver **`../DEPLOY-HOSTINGER.md`** no repositório para o passo a passo completo.

## Scripts

| Comando     | Descrição              |
|------------|------------------------|
| `npm run dev`    | Servidor de desenvolvimento |
| `npm run build`  | Build de produção          |
| `npm run preview`| Preview do build           |
| `npm run lint`   | ESLint                     |

## Estrutura relevante

- `src/pages/` — Páginas
- `src/sections/` — Seções (Header, Footer, etc.)
- `src/contexts/` — Auth e outros contextos
- `public/` — Arquivos estáticos (favicon, manifest, .htaccess, robots, sitemap)

Nenhuma configuração de Netlify ou outro provedor — deploy apenas na Hostinger.

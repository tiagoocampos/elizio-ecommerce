# Elizio home&móveis: frontend

Loja e painel admin (React + Vite + TypeScript, Tailwind e shadcn/ui). Consome a API descrita em `../docs/API.md`.

## Rodar

```bash
cp .env.example .env   # preencha VITE_API_URL e VITE_WHATSAPP_NUMBER
npm install
npm run dev            # http://localhost:5173
npm run build          # tsc -b && vite build
```

No backend, defina `FRONTEND_URL` com a origem do frontend (CORS e retorno do Mercado Pago).

## Variáveis

| Variável | Descrição |
|---|---|
| `VITE_API_URL` | URL do backend, sem barra final |
| `VITE_WHATSAPP_NUMBER` | Só dígitos, com DDI (ex.: `5554999999999`). Sem ela, os botões de WhatsApp somem |
| `VITE_INSTAGRAM_URL` | Padrão `https://instagram.com/eliziohomemoveis` |

## Conteúdo a preencher

- `src/assets/hero.jpg`: foto do hero da home (sem ela, usa um gradiente marrom).
- `src/content/testimonials.ts`: depoimentos reais (vazio = seção oculta).
- `src/config/store.ts`: endereço e e-mail da loja (vazio = coluna oculta).
- Logo em PNG transparente: a logo atual (`src/assets/logo.jpg`) tem fundo bege e só aparece em cards.

## Deploy (Vercel)

`vercel.json` já reescreve todas as rotas para `/index.html` (SPA). Configure as variáveis `VITE_*` no painel.

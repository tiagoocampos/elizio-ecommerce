# PROJECT_CONTEXT.md: Elizio Home&Móveis (ecommerce de móveis rústicos)

> Contexto do projeto para o agente de IA. Leia INTEIRO antes de qualquer tarefa.
> Estado descrito: 22/10/2026. Em caso de conflito entre este arquivo e o código, o código vence; me avise da divergência.

## 1. Quem é quem
- **Cliente:** Elizio Home&Móveis, loja de móveis rústicos exclusivos e decoração (Instagram @eliziohomemoveis). Hoje vende por Instagram e WhatsApp. Entrega "na porta" do comprador.
- **Dono do código:** Tiago, desenvolvedor freelancer, que escreve a lógica de domínio complexa e usa o agente para o trabalho mecânico. Prefere respostas em português e código no padrão do Mandala.
- **Usuários do sistema:** CUSTOMER (comprador) e ADMIN (o Elizio, no painel).

## 2. O negócio (respostas do próprio Elizio)
- ~20 peças no catálogo inicial.
- **Tudo sob encomenda**: o prazo de produção é um dado central do produto. O estoque quase não importa.
- **Frete:** ele faz entregas próximas com uma Fiorino (preço fixo por região) e, quando é longe, usa uma transportadora (valor cotado na mão, pedido a pedido).
- **Pagamento:** online, Pix e cartão, via Mercado Pago (conta do próprio Elizio).
- Quem prefere negociar pode chamar no WhatsApp (botão no front; o backend não participa).

## 3. Objetivo e prazo
Entregar um ecommerce funcional: o Elizio cadastra peças e o cliente compra e paga. O backend precisa ficar pronto em 22/10/2026. Escopo enxuto: tudo que não está neste arquivo é fase 2 (cupons, relatórios, e-mail, avaliações).

## 4. Stack e ambiente
- Node.js + Express 5 + TypeScript 7, ESM (`"type": "module"`, `module: nodenext`).
- **Imports locais SEMPRE com extensão .js** (ex.: `import x from "./x.js"`).
- Prisma 7 + PostgreSQL com `@prisma/adapter-pg`. O client é gerado em `src/generated/prisma` (no .gitignore). Importe de `../generated/prisma/client.js` e os enums de `../generated/prisma/enums.js`. A config do Prisma fica em `prisma.config.ts` (o schema não tem `url`).
- Zod v4 (`z.email`, `z.cuid`), JWT (jsonwebtoken), bcrypt, multer (memória), Cloudinary, mercadopago, cors, dotenv.
- **tsconfig estrito:** `exactOptionalPropertyTypes` (declare opcionais como `campo?: T | undefined`), `noUncheckedIndexedAccess` (arrays indexados podem ser undefined) e `"types": []`. O código precisa passar em `npx tsc --noEmit`.
- Deploy previsto: backend no Railway, frontend na Vercel. Build do backend: `prisma generate && tsc`. Em produção rodar `prisma migrate deploy`.
- Desenvolvimento em Windows (Git Bash). Postgres local em `localhost:5432/elizio`.
- Variáveis de ambiente: PORT, DATABASE_URL, JWT_SECRET (obrigatória, o server falha sem ela), CLOUDINARY_*, MERCADOPAGO_ACCESS_TOKEN, FRONTEND_URL, BACKEND_URL, ADMIN_EMAIL, ADMIN_PASSWORD. NUNCA leia, imprima nem comite o conteúdo do `.env`.

## 5. Arquitetura (herdada do projeto Mandala Cristais)
O Elizio segue EXATAMENTE a arquitetura do Mandala (projeto anterior do Tiago, usado como referência de código, somente leitura):
- `src/routes.ts` único; middlewares na ordem `isAuthenticated, isAdmin, validateSchema(...)`.
- `controllers/<dominio>/XController.ts`: classe com `async handle(req, res)`. Sem regra de negócio.
- `services/<dominio>/XService.ts`: classe com `async execute(props)`, regra de negócio e Prisma direto.
- `schemas/`: Zod no formato `z.object({ body, query, params })`.
- `exceptions/<Dominio>Errors.ts`: uma classe por erro, com `statusCode` e mensagem em português, com `Object.setPrototypeOf`.
- `middlewares/`, `config/`, `utils/`, `prisma/index.ts`.
- **Sem DTO, sem mapper, sem repository.** Nos services use `select` para nunca expor campos sensíveis (ex.: passwordHash).
- Nomes de arquivo em PascalCase (`CreateOrderService.ts`); funções soltas em camelCase.
- Código em inglês; mensagens para o usuário em português.
- Campos da API em camelCase. O usuário logado fica em `req.userId` (no Mandala era `req.user_id`).

### Diferenças deliberadas em relação ao Mandala
| Tema | Mandala | Elizio |
|---|---|---|
| Dinheiro | Int em centavos | Decimal(10,2) em reais. Cálculo em `Prisma.Decimal`; a API devolve `number` |
| Ids | uuid | **cuid** (não use `.uuid()`) |
| Produto | 1 imagem + preço + estoque | N imagens (`images String[]`) + **variações** com preço (e estoque opcional) |
| Carrinho | Cart no backend | **Sem Cart**: fica no frontend; o pedido recebe os itens no body |
| Frete | Melhor Envio | Fiorino por faixa de CEP, transportadora cotada à mão, retirada |
| Pagamento recusado | cancela o pedido e devolve estoque | mantém o pedido aberto para nova tentativa |
| Login | revela se o e-mail existe | sempre "E-mail ou senha inválidos" |

## 6. Estado atual do repositório (já pronto)
Base: `server.ts`, `routes.ts` (só `POST /users`), prisma client, `errorHandler` (Zod, P2002, erros com statusCode, Multer, 500), `validateSchema`, `isAuthenticated`, `isAdmin`, `config/multer` (5 MB, jpeg/png/webp), `config/cloudinary`, `exceptions/UserErrors` e `InvalidToken`, `CreateUser` (controller e service). Schema Prisma e migration `init` aplicados.
Todo o resto do backend falta (ver o prompt de execução).

## 7. Modelo de dados (prisma/schema.prisma)
Não altere os models sem avisar.
- **User:** id, name, email único, passwordHash, phone?, role (CUSTOMER|ADMIN, padrão CUSTOMER).
- **Address:** userId, zipCode (8 dígitos), street, number, complement?, district, city, state (CHAR 2).
- **Category:** name único, slug único.
- **Product:** name, slug único, description, categoryId, madeToOrder (padrão true), leadTimeDays?, widthCm?, depthCm?, heightCm?, weightKg?, images String[] (a primeira é a principal), active (soft delete).
- **ProductVariant:** productId, label (ex.: "Envelhecido, 1,80m"), price, stock? (null = sob encomenda, sem controle), sku? único.
- **ShippingZone:** name, cepStart, cepEnd (strings de 8 dígitos), price, minDays, maxDays, active.
- **Order:** userId, status, snapshot do endereço (ship*, mais addressId opcional), shippingMethod (LOCAL_ZONE|CARRIER|PICKUP), shippingZoneId?, shippingCost? (null = aguardando cotação), shippingNote?, subtotal, total, items, payments.
- **OrderItem:** orderId, variantId, snapshots productName, variantLabel, unitPrice, quantity.
- **Payment:** orderId (um pedido pode ter vários), provider (padrão "mercadopago"), externalId? único (id do pagamento no MP), status, amount, method?.
- **Enums:**
  - OrderStatus: AWAITING_SHIPPING_QUOTE, PENDING_PAYMENT, PAID, IN_PRODUCTION, SHIPPED, DELIVERED, CANCELED.
  - PaymentStatus: PENDING, APPROVED, REJECTED, REFUNDED.

## 8. Regras de negócio (invariantes)
1. Preço, subtotal, frete e total vêm SEMPRE do banco, nunca do frontend.
2. O pedido guarda snapshots (endereço, nome do produto, rótulo da variação, preço unitário): editar produto ou endereço depois não altera pedidos antigos.
3. **Produto vendido nunca é apagado:** "excluir" produto = `active = false` (OrderItem referencia a variação com RESTRICT). O mesmo vale para ShippingZone (`active = false`). Variação que já tem pedido não pode ser removida.
4. **Fluxo do frete:**
   - Fiorino (LOCAL_ZONE): o CEP do endereço precisa cair numa zona ativa; frete = preço da zona; pedido nasce PENDING_PAYMENT.
   - Transportadora (CARRIER): o pedido nasce AWAITING_SHIPPING_QUOTE com `shippingCost = null`. O Elizio informa o valor no painel, o total é recalculado e o pedido vai para PENDING_PAYMENT. O cliente NÃO paga antes disso.
   - Retirada (PICKUP): frete 0.
5. CEP: normalize para 8 dígitos (só números) na entrada; a comparação com `cepStart`/`cepEnd` é por string.
6. Estoque só é controlado quando `stock != null`. O decremento é atômico (`updateMany` com `stock >= qty`). Ao cancelar, devolve.
7. Pagamento via Mercado Pago Checkout Pro. A confirmação vem do webhook, que SEMPRE consulta a API do MP (não confia no body) e é idempotente. O valor aprovado precisa bater com `order.total`.
8. Transições de status do pedido seguem um mapa fixo (ver prompt de execução). Só ADMIN altera status.
9. Segurança: bcrypt 10 rounds; JWT de 7 dias; login com mensagem genérica; nenhuma resposta devolve passwordHash; rotas de admin exigem `isAuthenticated` + `isAdmin`; CORS restrito ao FRONTEND_URL.

## 9. Mapa de rotas alvo
- **Públicas:** POST /users, POST /session, GET /category, GET /products, GET /product/:slug, POST /shipping/quote, POST /payment/webhook, GET /health.
- **Autenticadas:** GET /me, POST/GET/PUT/DELETE /address, POST /order, GET /orders, GET /order/:orderId, POST /payment/preference.
- **Admin:** POST /category, PUT/DELETE /category/:id, POST/PUT/DELETE /product, GET /admin/products, GET /admin/orders, GET /admin/orders/:orderId, PATCH /admin/orders/:orderId/shipping-quote, PATCH /order/:orderId/status, GET/POST/PUT/DELETE /admin/shipping-zones.

## 10. Decisões em aberto (NÃO invente; sinalize e siga o padrão abaixo)
- **Pagamento integral ou sinal + restante:** o Elizio ainda não respondeu. Implemente pagamento integral. O schema já aceita vários Payments por pedido para uma futura mudança.
- **Faixas de CEP e preços da Fiorino:** ainda não informados. Seed só com exemplos marcados "EXEMPLO" e atrás de `SEED_SAMPLE_DATA=true`.
- **Prazo médio de produção:** informado por produto (`leadTimeDays`), sem valor padrão.
- **Quem cadastra as 20 peças** (Elizio no painel ou Tiago): o backend precisa funcionar para os dois casos.

## 11. Fora do escopo (fase 2)
Cupons, relatórios e dashboard, e-mails (confirmação, marketing), recuperação de senha, avaliações, Checkout Transparente, cálculo de frete por API (Melhor Envio), gestão de usuários pelo admin, testes automatizados.

## 12. Convenções de trabalho
- Não faça git commit nem push. Não altere o projeto de referência (Mandala).
- Rode `npx tsc --noEmit` ao fim de cada bloco de trabalho.
- Não adicione dependências além do necessário (ex.: `mercadopago`) e não crie camadas ou pastas novas.
- Registre em `docs/API.md` toda rota criada (método, caminho, auth, exemplo de body/query).
- Se algo exigir mudar o schema, as regras acima ou a arquitetura: pare e pergunte em vez de decidir sozinho.
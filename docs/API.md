# API Elizio Home&Móveis

Base URL local: `http://localhost:3333` (variável `PORT`). Todas as respostas são JSON.

- **Autenticação:** header `Authorization: Bearer <token>` (token vem de `POST /session`, validade 7 dias).
- **Dinheiro:** sempre `number` em reais (ex.: `1500.5`). Nas entradas: positivo, no máximo 2 casas decimais.
- **Ids:** strings (cuid; o id de usuário é uuid). Não presuma formato.
- **Erros:** `{ "error": "mensagem em português" }`. Erros de validação (400) vêm como `{ "error": "Erro de validação", "details": [{ "message", "path" }] }`.
- Códigos usados: 400 validação/regra, 401 sem token ou credencial inválida, 403 sem permissão, 404 não encontrado, 409 conflito, 502 falha no upload de imagem.

## Rotas

| Método | Caminho | Auth | Descrição |
|---|---|---|---|
| GET | `/health` | pública | Status do servidor |
| POST | `/users` | pública | Cadastro de cliente |
| POST | `/session` | pública | Login |
| GET | `/me` | usuário | Dados do usuário logado |
| GET | `/category` | pública | Lista categorias |
| POST | `/category` | admin | Cria categoria |
| PUT | `/category/:id` | admin | Renomeia categoria |
| DELETE | `/category/:id` | admin | Remove categoria (409 se tiver produtos) |
| GET | `/products` | pública | Lista produtos ativos (`?categoryId=`) |
| GET | `/product/:slug` | pública | Detalhe de produto ativo |
| GET | `/admin/products` | admin | Lista todos, inclusive inativos |
| POST | `/product` | admin | Cria produto (multipart) |
| PUT | `/product` | admin | Atualiza produto (multipart) |
| DELETE | `/product?productId=` | admin | Desativa produto (soft delete) |
| POST | `/address` | usuário | Cria endereço |
| GET | `/address` | usuário | Lista endereços do usuário |
| PUT | `/address?addressId=` | usuário | Atualiza endereço |
| DELETE | `/address?addressId=` | usuário | Remove endereço |
| POST | `/shipping/quote` | pública | Opções de frete para um CEP |
| GET | `/admin/shipping-zones` | admin | Lista zonas de entrega |
| POST | `/admin/shipping-zones` | admin | Cria zona |
| PUT | `/admin/shipping-zones/:id` | admin | Atualiza zona |
| DELETE | `/admin/shipping-zones/:id` | admin | Desativa zona (soft delete) |
| POST | `/order` | usuário | Cria pedido |
| GET | `/orders` | usuário | Pedidos do usuário |
| GET | `/order/:orderId` | usuário | Pedido do usuário (404 se não for dele) |
| GET | `/admin/orders` | admin | Todos os pedidos (`?status=`) |
| GET | `/admin/orders/:orderId` | admin | Detalhe completo |
| PATCH | `/admin/orders/:orderId/shipping-quote` | admin | Informa o frete da transportadora |
| PATCH | `/order/:orderId/status` | admin | Muda o status do pedido |
| POST | `/payment/preference` | usuário | Gera o link de pagamento (Mercado Pago) |
| POST | `/payment/webhook` | pública | Notificações do Mercado Pago |

---

## Auth

### POST `/users`
```json
{ "name": "Maria", "email": "maria@email.com", "password": "senha12345", "phone": "11999998888" }
```
`password` mínimo 8; `phone` opcional (10 a 15 caracteres). Campos extras (ex.: `role`) são descartados: o cadastro sempre cria `CUSTOMER`.
Resposta 201: `{ id, name, email, phone, role, createdAt }`. E-mail repetido: 409.

### POST `/session`
```json
{ "email": "maria@email.com", "password": "senha12345" }
```
Resposta: `{ id, name, email, role, token }`. Qualquer falha: 401 `"E-mail ou senha inválidos"`.

### GET `/me`
Resposta: `{ id, name, email, phone, role, createdAt }`.

## Categorias

### POST `/category` · PUT `/category/:id`
```json
{ "name": "Estantes" }
```
Nome de 3 a 45 caracteres. O `slug` é gerado (e ganha `-2`, `-3`... se já existir). Resposta: `{ id, name, slug }`.

### GET `/category`
Resposta: `[{ "id", "name", "slug" }]` ordenado por nome.

## Produtos

### GET `/products?categoryId=<id>`
Só produtos ativos. Resposta (cada item):
```json
{
  "id": "...", "name": "Mesa de Jantar Rústica", "slug": "mesa-de-jantar-rustica",
  "description": "...", "madeToOrder": true, "leadTimeDays": 30,
  "widthCm": 180, "depthCm": 90, "heightCm": 78, "weightKg": 45.5,
  "images": ["https://.../principal.png", "https://.../segunda.png"],
  "active": true,
  "category": { "id": "...", "name": "Mesas", "slug": "mesas" },
  "variants": [{ "id": "...", "label": "Natural, 1,80m", "price": 1200, "stock": null }],
  "priceFrom": 1200
}
```
`images[0]` é a imagem principal. `stock: null` = sob encomenda (sem controle de estoque). `priceFrom` = menor preço entre as variações.

### GET `/product/:slug`
Mesmo formato de um item acima. 404 se não existir ou estiver inativo.

### GET `/admin/products`
Mesmo formato, incluindo inativos e as variações completas (com `sku`).

### POST `/product` (admin, `multipart/form-data`)
| Campo | Obrigatório | Observação |
|---|---|---|
| `name`, `description`, `categoryId` | sim | |
| `images` | sim | 1 a 8 arquivos (jpeg/png/webp, 5 MB cada). O primeiro é a imagem principal |
| `variants` | sim | string JSON, mínimo 1 item (veja abaixo) |
| `madeToOrder` | não | `"true"` / `"false"` (padrão true) |
| `leadTimeDays`, `widthCm`, `depthCm`, `heightCm` | não | inteiros positivos |
| `weightKg` | não | positivo, até 2 casas |

`variants`:
```json
[
  { "label": "Envelhecido, 1,80m", "price": 1500.5, "stock": 3, "sku": "MESA-ENV-180" },
  { "label": "Natural, 1,80m", "price": 1200 }
]
```
`stock` ausente ou `null` = sob encomenda. `sku` opcional e único. Resposta 201: o produto (formato admin). Se o upload ou a criação falhar, as imagens já enviadas são apagadas do Cloudinary.

### PUT `/product` (admin, `multipart/form-data`)
`productId` é obrigatório; todo o resto é opcional e só o que for enviado muda.

- `images`: arquivos novos. Sem `keepImages`, são **acrescentados** às imagens atuais.
- `keepImages`: string JSON com as URLs a manter, ex.: `["https://.../a.png"]`. Cada URL precisa pertencer ao produto (senão 400). Lista final = `keepImages` + arquivos novos, nessa ordem; as imagens que saírem são apagadas do Cloudinary só depois de o banco confirmar. Não é possível ficar sem nenhuma imagem, nem passar de 8 no total (400 `"Máximo de 8 imagens por produto."`, validado antes de qualquer upload).
- `variants`: string JSON com a **lista final**. Item com `id` é atualizado: `label` e `price` são sempre aplicados; `stock` e `sku` **ausentes não são alterados**, `"stock": null` explícito = sem controle de estoque (sob encomenda) e `"sku": null` explícito limpa o sku. Item sem `id` é criado com os valores enviados (`stock`/`sku` ausentes = `null`); variação que sumiu da lista é removida. Variação que já foi vendida não pode ser removida: 409 `"Variação já vendida; não pode ser removida."`. Tudo numa transação. Sem `variants`, as variações não são tocadas.
- `name` novo atualiza o `slug`.
- `active`: `"true"`/`"false"` (reativa um produto desativado).

```json
{ "productId": "...", "variants": [
  { "id": "<id existente>", "label": "Envelhecido, 1,80m", "price": 1600 },
  { "id": "<outro id>", "label": "Natural", "price": 1200, "stock": null, "sku": null },
  { "label": "Nova variação", "price": 2000 }
] }
```
(enviado como campo de formulário `variants` = JSON em texto; `application/json` também é aceito quando não há arquivos.)

### DELETE `/product?productId=<id>`
Desativa (`active=false`); nunca apaga, porque pedidos referenciam as variações.

## Endereços

### POST `/address`
```json
{ "zipCode": "01310-100", "street": "Avenida Paulista", "number": "1000", "complement": "Sala 2", "district": "Bela Vista", "city": "São Paulo", "state": "sp" }
```
`zipCode` é normalizado para 8 dígitos (`"01310100"`); `state` vira maiúscula (2 letras); `complement` opcional. Resposta 201: o endereço.

### PUT `/address?addressId=<id>`
Corpo parcial (qualquer campo acima). Endereço de outro usuário: 403; inexistente: 404.

### DELETE `/address?addressId=<id>`
Resposta: `{ "message": "Endereço deletado com sucesso" }`. Pedidos antigos mantêm o snapshot do endereço.

## Frete

### POST `/shipping/quote`
```json
{ "zipCode": "01310-100" }
```
Resposta:
```json
{
  "localZone": { "id": "...", "name": "Zona 1", "price": 80, "minDays": 1, "maxDays": 3 },
  "carrier": { "available": true, "note": "Frete por transportadora, cotado pelo vendedor após o pedido" },
  "pickup": { "available": true }
}
```
`localZone` é a zona **ativa** que contém o CEP, ou `null` se nenhuma (nesse caso só transportadora ou retirada).

### Zonas (admin)
`POST /admin/shipping-zones` e `PUT /admin/shipping-zones/:id`:
```json
{ "name": "Zona Sul", "cepStart": "04000000", "cepEnd": "04999999", "price": 80, "minDays": 1, "maxDays": 3 }
```
`cepStart <= cepEnd` e `minDays <= maxDays`, senão 400. No PUT todos os campos são opcionais e pode-se enviar `"active": true` para reativar. `DELETE` desativa (`active=false`). `GET` lista todas (ativas primeiro). Cada zona: `{ id, name, cepStart, cepEnd, price, minDays, maxDays, active }`.

## Pedidos

### POST `/order`
```json
{
  "addressId": "...",
  "shippingMethod": "LOCAL_ZONE",
  "items": [{ "variantId": "...", "quantity": 2 }, { "variantId": "...", "quantity": 1 }]
}
```
- `items`: mínimo 1, `quantity` inteiro de 1 a 20, sem `variantId` repetido. Preços e nomes vêm do banco; o pedido guarda snapshot do endereço, do nome do produto, do rótulo e do preço unitário.
- `shippingMethod`:
  - `PICKUP`: frete 0, status `PENDING_PAYMENT`.
  - `LOCAL_ZONE`: usa a zona ativa do CEP do endereço (sem zona: 400 `"CEP fora da área de entrega própria; escolha transportadora"`), status `PENDING_PAYMENT`.
  - `CARRIER`: `shippingCost: null`, status `AWAITING_SHIPPING_QUOTE` (o vendedor informa o frete depois; o cliente só paga após isso).
- Variação com `stock` definido tem o estoque decrementado atomicamente (400 `Estoque insuficiente` se faltar).

Resposta 201:
```json
{
  "id": "...", "status": "PENDING_PAYMENT", "shippingMethod": "LOCAL_ZONE",
  "shippingZoneId": "...", "shippingCost": 80, "shippingNote": null,
  "subtotal": 4400, "total": 4480,
  "shipZipCode": "01310100", "shipStreet": "...", "shipNumber": "...", "shipComplement": null,
  "shipDistrict": "...", "shipCity": "...", "shipState": "SP",
  "items": [{ "id": "...", "variantId": "...", "productName": "...", "variantLabel": "...", "unitPrice": 1600, "quantity": 2 }],
  "createdAt": "...", "updatedAt": "..."
}
```

### GET `/orders` · GET `/order/:orderId`
Pedidos do usuário logado, com `items`. Pedido de outro usuário: 404.

### GET `/admin/orders?status=PAID`
Com `user { id, name, email }`, `items` e `payments`. `status` é opcional (um dos valores de OrderStatus).

### GET `/admin/orders/:orderId`
Detalhe: `user` (com `phone`), `items`, `payments` e `shippingZone`.

### PATCH `/admin/orders/:orderId/shipping-quote`
```json
{ "shippingCost": 350.75, "shippingNote": "Transportadora X, prazo 10 dias" }
```
Só vale para `shippingMethod = CARRIER` com status `AWAITING_SHIPPING_QUOTE` (senão 400). Atualiza o frete, recalcula `total = subtotal + shippingCost` e muda o status para `PENDING_PAYMENT`.

### PATCH `/order/:orderId/status`
```json
{ "status": "IN_PRODUCTION" }
```
Transições permitidas (qualquer outra: 400 `"Transição de status inválida"`):

| De | Para |
|---|---|
| AWAITING_SHIPPING_QUOTE | CANCELED |
| PENDING_PAYMENT | PAID (pagamento combinado por fora), CANCELED |
| PAID | IN_PRODUCTION, CANCELED |
| IN_PRODUCTION | SHIPPED, CANCELED |
| SHIPPED | DELIVERED |
| DELIVERED, CANCELED | nenhuma |

Ao cancelar, o estoque das variações com controle de estoque é devolvido.

## Pagamento (Mercado Pago, Checkout Pro)

### POST `/payment/preference`
```json
{ "orderId": "..." }
```
Resposta: `{ "orderId": "...", "checkoutUrl": "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=..." }`. Redirecione o cliente para `checkoutUrl`.

- Pedido de outro usuário: 404.
- `AWAITING_SHIPPING_QUOTE`: 400 `"Aguardando a cotação do frete pelo vendedor"`.
- Qualquer status diferente de `PENDING_PAYMENT` (pago, cancelado...): 400.
- Retorno do cliente: `${FRONTEND_URL}/payment/success|failure|pending` (`auto_return` só com `FRONTEND_URL` https).

### POST `/payment/webhook`
Chamado pelo Mercado Pago (`notification_url = ${BACKEND_URL}/payment/webhook`). Trata os tópicos `payment` e `merchant_order`; o conteúdo do body **não é confiado**: o pagamento é sempre consultado na API do MP. Idempotente. Responde 200 (inclusive para eventos ignorados) e 500 só em falha transitória, para o MP reenviar.

| Status no MP | Efeito |
|---|---|
| `approved` | Se o valor == `order.total` e o pedido está `PENDING_PAYMENT`: Payment `APPROVED` + pedido `PAID`. Valor divergente: não paga (log de erro). Pedido já `CANCELED`: só o Payment vira `APPROVED` (log: reembolso manual) |
| `rejected`, `cancelled` | Payment `REJECTED`; o pedido continua `PENDING_PAYMENT` (cliente pode tentar de novo); estoque não muda |
| `refunded`, `charged_back` | Payment `REFUNDED`; o pedido não muda |
| `pending`, `in_process`, `authorized` | Payment `PENDING` |

## Fluxo completo (resumo)

1. `POST /users` → `POST /session` (guarda o `token`).
2. `GET /products` / `GET /product/:slug` (carrinho fica no frontend).
3. `POST /address`.
4. `POST /shipping/quote` com o CEP e escolha do método.
5. `POST /order` com `addressId`, `shippingMethod` e `items`.
6. Se `CARRIER`: o admin faz `PATCH /admin/orders/:orderId/shipping-quote`.
7. `POST /payment/preference` → redireciona para `checkoutUrl`.
8. Mercado Pago chama `POST /payment/webhook` → pedido `PAID`.
9. Admin avança o pedido: `IN_PRODUCTION` → `SHIPPED` → `DELIVERED`.

## Variáveis de ambiente

`PORT`, `DATABASE_URL`, `JWT_SECRET` (obrigatória), `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `MERCADOPAGO_ACCESS_TOKEN`, `FRONTEND_URL` (também define o CORS), `BACKEND_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`. Para o seed: `npx prisma db seed` (ou `npm run seed`); `SEED_SAMPLE_DATA=true` cria 2 zonas de frete de EXEMPLO (nunca em produção).

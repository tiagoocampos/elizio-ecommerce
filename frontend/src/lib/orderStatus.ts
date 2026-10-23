import type { OrderStatus, PaymentStatus, ShippingMethod } from "@/types/api";

export const ORDER_STATUSES: OrderStatus[] = [
  "AWAITING_SHIPPING_QUOTE",
  "PENDING_PAYMENT",
  "PAID",
  "IN_PRODUCTION",
  "SHIPPED",
  "DELIVERED",
  "CANCELED",
];

export const orderStatusLabel: Record<OrderStatus, string> = {
  AWAITING_SHIPPING_QUOTE: "Aguardando cotação do frete",
  PENDING_PAYMENT: "Aguardando pagamento",
  PAID: "Pago",
  IN_PRODUCTION: "Em produção",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado",
};

export const orderStatusClass: Record<OrderStatus, string> = {
  AWAITING_SHIPPING_QUOTE: "bg-amber/20 text-[#7A4A0C] border-amber/40",
  PENDING_PAYMENT: "bg-amber/20 text-[#7A4A0C] border-amber/40",
  PAID: "bg-emerald-100 text-emerald-900 border-emerald-200",
  IN_PRODUCTION: "bg-sky-100 text-sky-900 border-sky-200",
  SHIPPED: "bg-indigo-100 text-indigo-900 border-indigo-200",
  DELIVERED: "bg-emerald-200 text-emerald-950 border-emerald-300",
  CANCELED: "bg-red-100 text-red-900 border-red-200",
};

/** Transições permitidas pelo contrato (PATCH /order/:orderId/status). */
export const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  AWAITING_SHIPPING_QUOTE: ["CANCELED"],
  PENDING_PAYMENT: ["PAID", "CANCELED"],
  PAID: ["IN_PRODUCTION", "CANCELED"],
  IN_PRODUCTION: ["SHIPPED", "CANCELED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELED: [],
};

/** Etapas da linha do tempo do cliente (cancelado fica fora do fluxo normal). */
export const orderTimeline: OrderStatus[] = ["PENDING_PAYMENT", "PAID", "IN_PRODUCTION", "SHIPPED", "DELIVERED"];

export const shippingMethodLabel: Record<ShippingMethod, string> = {
  LOCAL_ZONE: "Entrega própria",
  CARRIER: "Transportadora",
  PICKUP: "Retirada na loja",
};

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  REJECTED: "Recusado",
  REFUNDED: "Estornado",
};

/** Mensagem de acompanhamento para o cliente, por status. */
export const orderStatusMessage: Partial<Record<OrderStatus, string>> = {
  PAID: "Pagamento confirmado! Em breve começamos a produção da sua peça.",
  IN_PRODUCTION: "Sua peça está em produção.",
  SHIPPED: "Seu pedido foi enviado.",
  DELIVERED: "Pedido entregue. Obrigado pela confiança!",
  CANCELED: "Este pedido foi cancelado.",
};

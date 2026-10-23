// Tipos que espelham o contrato em docs/API.md. Dinheiro sempre em reais (number).

export type Role = "CUSTOMER" | "ADMIN";

export type OrderStatus =
  | "AWAITING_SHIPPING_QUOTE"
  | "PENDING_PAYMENT"
  | "PAID"
  | "IN_PRODUCTION"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELED";

export type PaymentStatus = "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED";

export type ShippingMethod = "LOCAL_ZONE" | "CARRIER" | "PICKUP";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  createdAt: string;
}

export interface Session {
  id: string;
  name: string;
  email: string;
  role: Role;
  token: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Variant {
  id: string;
  label: string;
  price: number;
  /** null = sob encomenda, sem controle de estoque */
  stock: number | null;
  /** Só vem nas rotas de admin */
  sku?: string | null;
  productId?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  madeToOrder: boolean;
  leadTimeDays: number | null;
  widthCm: number | null;
  depthCm: number | null;
  heightCm: number | null;
  weightKg: number | null;
  /** A primeira é a imagem principal */
  images: string[];
  active: boolean;
  categoryId?: string;
  category: Category;
  variants: Variant[];
  /** Menor preço entre as variações (não vem em POST/PUT /product) */
  priceFrom?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Address {
  id: string;
  userId?: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  district: string;
  city: string;
  state: string;
}

export interface AddressInput {
  zipCode: string;
  street: string;
  number: string;
  complement?: string | undefined;
  district: string;
  city: string;
  state: string;
}

export interface ShippingZone {
  id: string;
  name: string;
  cepStart: string;
  cepEnd: string;
  price: number;
  minDays: number;
  maxDays: number;
  active: boolean;
}

export interface ShippingZoneInput {
  name: string;
  cepStart: string;
  cepEnd: string;
  price: number;
  minDays: number;
  maxDays: number;
  active?: boolean;
}

export interface ShippingQuote {
  localZone: {
    id: string;
    name: string;
    price: number;
    minDays: number;
    maxDays: number;
  } | null;
  carrier: { available: boolean; note: string };
  pickup: { available: boolean };
}

export interface OrderItem {
  id: string;
  orderId?: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  unitPrice: number;
  quantity: number;
}

export interface Payment {
  id: string;
  orderId: string;
  provider: string;
  externalId: string | null;
  status: PaymentStatus;
  amount: number;
  method: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderUser {
  id: string;
  name: string;
  email: string;
  /** Só no detalhe do admin */
  phone?: string | null;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  addressId: string | null;
  shipZipCode: string;
  shipStreet: string;
  shipNumber: string;
  shipComplement: string | null;
  shipDistrict: string;
  shipCity: string;
  shipState: string;
  shippingMethod: ShippingMethod;
  shippingZoneId: string | null;
  /** null = aguardando cotação (CARRIER) */
  shippingCost: number | null;
  shippingNote: string | null;
  subtotal: number;
  total: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  /** Só nas rotas de admin */
  user?: OrderUser;
  payments?: Payment[];
  shippingZone?: ShippingZone | null;
}

export interface CreateOrderInput {
  addressId: string;
  shippingMethod: ShippingMethod;
  items: { variantId: string; quantity: number }[];
}

export interface PreferenceResponse {
  orderId: string;
  checkoutUrl: string;
}

/** Item do campo `variants` (JSON) no POST/PUT /product */
export interface VariantPayload {
  id?: string;
  label: string;
  price: number;
  stock: number | null;
  sku: string | null;
}

export interface ApiErrorDetail {
  message: string;
  path?: string | number;
}

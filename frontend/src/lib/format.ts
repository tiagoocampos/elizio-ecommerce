const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatCurrency(value: number): string {
  return currency.format(value);
}

export function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value));
}

export function formatDateTime(value: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** 01310100 -> 01310-100 (aceita digitação parcial) */
export function formatZip(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

/** 54999998888 -> (54) 99999-8888 (aceita digitação parcial) */
export function formatPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Número curto e legível do pedido (o id é um cuid longo). */
export function shortOrderId(id: string): string {
  return `#${id.slice(-8).toUpperCase()}`;
}

/** Soma em centavos para evitar erro de ponto flutuante na exibição. */
export function sumMoney(values: number[]): number {
  return values.reduce((total, value) => total + Math.round(value * 100), 0) / 100;
}

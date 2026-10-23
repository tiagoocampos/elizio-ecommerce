import { storeConfig } from "@/config/store";

export function hasWhatsapp(): boolean {
  return storeConfig.whatsappNumber.length > 0;
}

/** Link wa.me com mensagem pré-preenchida. `number` opcional (ex.: telefone do cliente no admin). */
export function whatsappLink(message?: string, number: string = storeConfig.whatsappNumber): string {
  const digits = number.replace(/\D/g, "");
  const params = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${params}`;
}

/** Telefone brasileiro sem DDI ganha o 55. */
export function brazilianPhoneToWhatsapp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length <= 11 ? `55${digits}` : digits;
}

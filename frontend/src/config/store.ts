// Dados da loja. Preencha endereço e e-mail quando o Elizio informar:
// campos vazios não aparecem na página de contato.

export const storeConfig = {
  name: "Elizio",
  tagline: "home&móveis",
  whatsappNumber: ((import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) ?? "").replace(/\D/g, ""),
  instagramUrl: (import.meta.env.VITE_INSTAGRAM_URL as string | undefined) || "https://instagram.com/eliziohomemoveis",
  instagramHandle: "@eliziohomemoveis",
  // TODO: pedir ao Elizio o endereço da loja (aparece na seção de contato quando preenchido).
  address: "",
  // TODO: pedir ao Elizio o e-mail de contato (aparece na seção de contato quando preenchido).
  email: "",
};

export interface Testimonial {
  name: string;
  text: string;
  /** URL ou import de uma foto da peça na casa do cliente (opcional) */
  image?: string;
}

// TODO: pedir ao Elizio depoimentos REAIS de clientes (nome, texto e, se possível, foto da peça).
// Enquanto esta lista estiver vazia, a seção de depoimentos fica oculta na home.
// Não invente depoimentos.
export const testimonials: Testimonial[] = [];

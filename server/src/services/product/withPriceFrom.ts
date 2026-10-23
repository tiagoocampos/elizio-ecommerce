import { Prisma } from "../../generated/prisma/client.js";

// Acrescenta `priceFrom` (menor preço entre as variações) ao produto.
export function withPriceFrom<T extends { variants: { price: Prisma.Decimal }[] }>(product: T) {
    const [first, ...rest] = product.variants.map((variant) => variant.price);
    const priceFrom = first === undefined ? null : Prisma.Decimal.min(first, ...rest);

    return { ...product, priceFrom };
}

import type { Prisma } from "../../generated/prisma/client.js";

// Visão pública: sem sku (produtos inativos são filtrados no where).
export const publicProductInclude = {
    category: { select: { id: true, name: true, slug: true } },
    variants: {
        select: { id: true, label: true, price: true, stock: true },
        orderBy: { price: "asc" },
    },
} satisfies Prisma.ProductInclude;

// Visão do admin: variações completas (com sku).
export const adminProductInclude = {
    category: { select: { id: true, name: true, slug: true } },
    variants: { orderBy: { id: "asc" } },
} satisfies Prisma.ProductInclude;

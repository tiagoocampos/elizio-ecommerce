import prismaClient from "../../prisma/index.js";

// Zona ATIVA que contém o CEP (8 dígitos; comparação por string). Se houver sobreposição,
// vence a faixa mais estreita (a mais específica); empate: a de menor preço.
export async function findZoneByZip(zip: string) {
    const zones = await prismaClient.shippingZone.findMany({
        where: {
            active: true,
            cepStart: { lte: zip },
            cepEnd: { gte: zip },
        },
    });

    const width = (zone: { cepStart: string; cepEnd: string }) => Number(zone.cepEnd) - Number(zone.cepStart);

    const sorted = [...zones].sort((a, b) => width(a) - width(b) || a.price.comparedTo(b.price));

    return sorted[0] ?? null;
}

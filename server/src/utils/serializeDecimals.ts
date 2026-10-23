import { Prisma } from "../generated/prisma/client.js";

// Converte recursivamente Prisma.Decimal em number para devolver na API.
export function serializeDecimals<T>(value: T): any {
    if (Prisma.Decimal.isDecimal(value)) {
        return (value as Prisma.Decimal).toNumber();
    }

    if (value instanceof Date) {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map((item) => serializeDecimals(item));
    }

    if (value !== null && typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value).map(([key, item]) => [key, serializeDecimals(item)])
        );
    }

    return value;
}

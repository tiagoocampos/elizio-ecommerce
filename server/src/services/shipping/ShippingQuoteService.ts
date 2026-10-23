import { findZoneByZip } from "./findZoneByZip.js";

interface ShippingQuoteServiceProps {
    zipCode: string;
}

class ShippingQuoteService {
    async execute({ zipCode }: ShippingQuoteServiceProps) {
        const zone = await findZoneByZip(zipCode);

        return {
            localZone: zone
                ? {
                    id: zone.id,
                    name: zone.name,
                    price: zone.price.toNumber(),
                    minDays: zone.minDays,
                    maxDays: zone.maxDays,
                }
                : null,
            carrier: {
                available: true,
                note: "Frete por transportadora, cotado pelo vendedor após o pedido",
            },
            pickup: {
                available: true,
            },
        };
    }
}

export { ShippingQuoteService };

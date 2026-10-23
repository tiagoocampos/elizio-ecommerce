import { Prisma } from "../../generated/prisma/client.js";
import prismaClient from "../../prisma/index.js";
import { serializeDecimals } from "../../utils/serializeDecimals.js";

interface CreateShippingZoneServiceProps {
    name: string;
    cepStart: string;
    cepEnd: string;
    price: number;
    minDays: number;
    maxDays: number;
}

class CreateShippingZoneService {
    async execute({ name, cepStart, cepEnd, price, minDays, maxDays }: CreateShippingZoneServiceProps) {
        const zone = await prismaClient.shippingZone.create({
            data: {
                name,
                cepStart,
                cepEnd,
                price: new Prisma.Decimal(price),
                minDays,
                maxDays,
            },
        });

        return serializeDecimals(zone);
    }
}

export { CreateShippingZoneService };

import { Prisma } from "../../generated/prisma/client.js";
import { InvalidDeliveryDaysError, InvalidZipRangeError, ShippingZoneNotFoundError } from "../../exceptions/ShippingErrors.js";
import prismaClient from "../../prisma/index.js";
import { serializeDecimals } from "../../utils/serializeDecimals.js";

interface UpdateShippingZoneServiceProps {
    id: string;
    name?: string | undefined;
    cepStart?: string | undefined;
    cepEnd?: string | undefined;
    price?: number | undefined;
    minDays?: number | undefined;
    maxDays?: number | undefined;
    active?: boolean | undefined;
}

class UpdateShippingZoneService {
    async execute({ id, name, cepStart, cepEnd, price, minDays, maxDays, active }: UpdateShippingZoneServiceProps) {
        const zone = await prismaClient.shippingZone.findUnique({ where: { id } });

        if (!zone) {
            throw new ShippingZoneNotFoundError();
        }

        // valida a combinação final (campo novo + o que já estava salvo)
        if ((cepStart ?? zone.cepStart) > (cepEnd ?? zone.cepEnd)) {
            throw new InvalidZipRangeError();
        }

        if ((minDays ?? zone.minDays) > (maxDays ?? zone.maxDays)) {
            throw new InvalidDeliveryDaysError();
        }

        const updated = await prismaClient.shippingZone.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(cepStart !== undefined && { cepStart }),
                ...(cepEnd !== undefined && { cepEnd }),
                ...(price !== undefined && { price: new Prisma.Decimal(price) }),
                ...(minDays !== undefined && { minDays }),
                ...(maxDays !== undefined && { maxDays }),
                ...(active !== undefined && { active }),
            },
        });

        return serializeDecimals(updated);
    }
}

export { UpdateShippingZoneService };

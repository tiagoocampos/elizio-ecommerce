import prismaClient from "../../prisma/index.js";
import { findAddressOrFail } from "./findAddressOrFail.js";

interface UpdateAddressProps {
    id: string;
    userId: string;
    zipCode?: string | undefined;
    street?: string | undefined;
    number?: string | undefined;
    complement?: string | null | undefined;
    district?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
}

class UpdateAddressService {
    async execute({ id, userId, zipCode, street, number, complement, district, city, state }: UpdateAddressProps) {
        await findAddressOrFail({ id, userId });

        const address = await prismaClient.address.update({
            where: { id },
            data: {
                ...(zipCode !== undefined && { zipCode }),
                ...(street !== undefined && { street }),
                ...(number !== undefined && { number }),
                ...(complement !== undefined && { complement }),
                ...(district !== undefined && { district }),
                ...(city !== undefined && { city }),
                ...(state !== undefined && { state }),
            },
        });

        return address;
    }
}

export { UpdateAddressService };

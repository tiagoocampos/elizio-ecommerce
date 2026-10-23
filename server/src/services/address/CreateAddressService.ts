import prismaClient from "../../prisma/index.js";

interface CreateAddressProps {
    userId: string;
    zipCode: string;
    street: string;
    number: string;
    complement?: string | null | undefined;
    district: string;
    city: string;
    state: string;
}

class CreateAddressService {
    async execute({ userId, zipCode, street, number, complement, district, city, state }: CreateAddressProps) {
        const address = await prismaClient.address.create({
            data: {
                userId,
                zipCode,
                street,
                number,
                complement: complement ?? null,
                district,
                city,
                state,
            },
        });

        return address;
    }
}

export { CreateAddressService };

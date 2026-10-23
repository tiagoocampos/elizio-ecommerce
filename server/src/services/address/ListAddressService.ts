import prismaClient from "../../prisma/index.js";

interface ListAddressProps {
    userId: string;
}

class ListAddressService {
    async execute({ userId }: ListAddressProps) {
        const addresses = await prismaClient.address.findMany({
            where: { userId },
            orderBy: { id: "desc" },
        });

        return addresses;
    }
}

export { ListAddressService };

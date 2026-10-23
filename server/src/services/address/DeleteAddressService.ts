import prismaClient from "../../prisma/index.js";
import { findAddressOrFail } from "./findAddressOrFail.js";

interface DeleteAddressServiceProps {
    id: string;
    userId: string;
}

class DeleteAddressService {
    async execute({ id, userId }: DeleteAddressServiceProps) {
        await findAddressOrFail({ id, userId });

        // Pedidos guardam um snapshot do endereço; a referência vira null (onDelete: SetNull).
        await prismaClient.address.delete({ where: { id } });

        return { message: "Endereço deletado com sucesso" };
    }
}

export { DeleteAddressService };

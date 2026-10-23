import { ShippingZoneNotFoundError } from "../../exceptions/ShippingErrors.js";
import prismaClient from "../../prisma/index.js";

interface DeleteShippingZoneServiceProps {
    id: string;
}

class DeleteShippingZoneService {
    async execute({ id }: DeleteShippingZoneServiceProps) {
        const zone = await prismaClient.shippingZone.findUnique({ where: { id } });

        if (!zone) {
            throw new ShippingZoneNotFoundError();
        }

        // Soft delete: pedidos antigos referenciam a zona.
        await prismaClient.shippingZone.update({
            where: { id },
            data: { active: false },
        });

        return { message: "Zona de entrega desativada com sucesso" };
    }
}

export { DeleteShippingZoneService };

import { OrderNotFoundError } from "../../exceptions/OrdersErrors.js";
import prismaClient from "../../prisma/index.js";
import { serializeDecimals } from "../../utils/serializeDecimals.js";

interface GetOrderAdminServiceProps {
    orderId: string;
}

class GetOrderAdminService {
    async execute({ orderId }: GetOrderAdminServiceProps) {
        const order = await prismaClient.order.findUnique({
            where: { id: orderId },
            include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
                items: true,
                payments: { orderBy: { createdAt: "desc" } },
                shippingZone: true,
            },
        });

        if (!order) {
            throw new OrderNotFoundError();
        }

        return serializeDecimals(order);
    }
}

export { GetOrderAdminService };

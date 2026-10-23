import { OrderNotFoundError } from "../../exceptions/OrdersErrors.js";
import prismaClient from "../../prisma/index.js";
import { serializeDecimals } from "../../utils/serializeDecimals.js";

interface GetOrderServiceProps {
    userId: string;
    orderId: string;
}

class GetOrderService {
    async execute({ userId, orderId }: GetOrderServiceProps) {
        const order = await prismaClient.order.findFirst({
            where: { id: orderId, userId },
            include: { items: true },
        });

        if (!order) {
            throw new OrderNotFoundError();
        }

        return serializeDecimals(order);
    }
}

export { GetOrderService };

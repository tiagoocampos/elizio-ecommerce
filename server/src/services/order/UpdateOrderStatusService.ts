import type { OrderStatus } from "../../generated/prisma/enums.js";
import { InvalidStatusTransitionError, OrderNotFoundError } from "../../exceptions/OrdersErrors.js";
import prismaClient from "../../prisma/index.js";
import { serializeDecimals } from "../../utils/serializeDecimals.js";

interface UpdateOrderStatusServiceProps {
    orderId: string;
    status: OrderStatus;
}

// PAID manual existe para pagamento combinado por fora do Mercado Pago.
const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
    AWAITING_SHIPPING_QUOTE: ["CANCELED"],
    PENDING_PAYMENT: ["PAID", "CANCELED"],
    PAID: ["IN_PRODUCTION", "CANCELED"],
    IN_PRODUCTION: ["SHIPPED", "CANCELED"],
    SHIPPED: ["DELIVERED"],
    DELIVERED: [],
    CANCELED: [],
};

class UpdateOrderStatusService {
    async execute({ orderId, status }: UpdateOrderStatusServiceProps) {
        const order = await prismaClient.order.findUnique({ where: { id: orderId } });

        if (!order) {
            throw new OrderNotFoundError();
        }

        if (!allowedTransitions[order.status].includes(status)) {
            throw new InvalidStatusTransitionError();
        }

        const updated = await prismaClient.$transaction(async (tx) => {
            // O filtro pelo status lido evita transição dupla em requisições concorrentes
            // (ex.: dois cancelamentos devolvendo o estoque duas vezes).
            const result = await tx.order.updateMany({
                where: { id: orderId, status: order.status },
                data: { status },
            });

            if (result.count === 0) {
                throw new InvalidStatusTransitionError();
            }

            if (status === "CANCELED") {
                const items = await tx.orderItem.findMany({ where: { orderId } });

                // Só devolve estoque de variações com controle (stock != null).
                for (const item of items) {
                    await tx.productVariant.updateMany({
                        where: { id: item.variantId, stock: { not: null } },
                        data: { stock: { increment: item.quantity } },
                    });
                }
            }

            return tx.order.findUniqueOrThrow({
                where: { id: orderId },
                include: { items: true },
            });
        });

        console.log(`Pedido ${orderId}: ${order.status} -> ${status}`);

        return serializeDecimals(updated);
    }
}

export { UpdateOrderStatusService };

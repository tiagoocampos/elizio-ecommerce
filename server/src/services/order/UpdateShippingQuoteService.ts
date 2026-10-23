import { Prisma } from "../../generated/prisma/client.js";
import { OrderNotFoundError, ShippingQuoteNotAllowedError } from "../../exceptions/OrdersErrors.js";
import prismaClient from "../../prisma/index.js";
import { serializeDecimals } from "../../utils/serializeDecimals.js";

interface UpdateShippingQuoteServiceProps {
    orderId: string;
    shippingCost: number;
    shippingNote?: string | undefined;
}

class UpdateShippingQuoteService {
    async execute({ orderId, shippingCost, shippingNote }: UpdateShippingQuoteServiceProps) {
        const order = await prismaClient.order.findUnique({ where: { id: orderId } });

        if (!order) {
            throw new OrderNotFoundError();
        }

        if (order.shippingMethod !== "CARRIER" || order.status !== "AWAITING_SHIPPING_QUOTE") {
            throw new ShippingQuoteNotAllowedError();
        }

        const cost = new Prisma.Decimal(shippingCost);

        // O filtro por status evita aplicar a cotação duas vezes em requisições concorrentes.
        const result = await prismaClient.order.updateMany({
            where: { id: orderId, status: "AWAITING_SHIPPING_QUOTE" },
            data: {
                shippingCost: cost,
                total: order.subtotal.plus(cost),
                status: "PENDING_PAYMENT",
                ...(shippingNote !== undefined && { shippingNote }),
            },
        });

        if (result.count === 0) {
            throw new ShippingQuoteNotAllowedError();
        }

        const updated = await prismaClient.order.findUniqueOrThrow({
            where: { id: orderId },
            include: { items: true },
        });

        return serializeDecimals(updated);
    }
}

export { UpdateShippingQuoteService };

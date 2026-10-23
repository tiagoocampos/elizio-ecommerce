import { Preference } from "mercadopago";
import { Prisma } from "../../generated/prisma/client.js";
import { getMercadoPagoClient } from "../../config/mercadopago.js";
import { OrderNotFoundError } from "../../exceptions/OrdersErrors.js";
import { OrderAwaitingQuoteError, OrderNotPayableError, PaymentCreationError } from "../../exceptions/PaymentErrors.js";
import prismaClient from "../../prisma/index.js";

interface CreatePreferenceServiceProps {
    orderId: string;
    userId: string;
}

class CreatePreferenceService {
    async execute({ orderId, userId }: CreatePreferenceServiceProps) {
        const frontendUrl = process.env.FRONTEND_URL;
        const backendUrl = process.env.BACKEND_URL;

        if (!frontendUrl || !backendUrl) {
            console.error("FRONTEND_URL e BACKEND_URL precisam estar definidos para criar a preferência de pagamento.");
            throw new PaymentCreationError();
        }

        const order = await prismaClient.order.findFirst({
            where: { id: orderId, userId },
            include: { items: true },
        });

        if (!order) {
            throw new OrderNotFoundError();
        }

        if (order.status === "AWAITING_SHIPPING_QUOTE") {
            throw new OrderAwaitingQuoteError();
        }

        if (order.status !== "PENDING_PAYMENT") {
            throw new OrderNotPayableError();
        }

        // Usa o snapshot do pedido (nome, rótulo e preço no momento da compra), não o produto atual.
        const items = [
            ...order.items.map((item) => ({
                id: item.variantId,
                title: `${item.productName} - ${item.variantLabel}`,
                unit_price: item.unitPrice.toNumber(),
                quantity: item.quantity,
                currency_id: "BRL",
            })),
            ...(order.shippingCost && order.shippingCost.greaterThan(0)
                ? [{
                    id: "frete",
                    title: "Frete",
                    unit_price: order.shippingCost.toNumber(),
                    quantity: 1,
                    currency_id: "BRL",
                }]
                : []),
        ];

        const itemsTotal = items.reduce(
            (sum, item) => sum.plus(new Prisma.Decimal(item.unit_price).times(item.quantity)),
            new Prisma.Decimal(0)
        );

        if (!itemsTotal.equals(order.total)) {
            console.error(`Pedido ${order.id}: soma dos itens (${itemsTotal}) diferente do total (${order.total}).`);
            throw new PaymentCreationError();
        }

        const preferenceBody = {
            items,
            external_reference: order.id,
            back_urls: {
                success: `${frontendUrl}/payment/success`,
                failure: `${frontendUrl}/payment/failure`,
                pending: `${frontendUrl}/payment/pending`,
            },
            notification_url: `${backendUrl}/payment/webhook`,
            // O Mercado Pago recusa auto_return com URL de retorno em localhost (http).
            ...(frontendUrl.startsWith("https") && { auto_return: "approved" }),
        };

        let checkoutUrl: string | undefined;

        try {
            const preference = new Preference(getMercadoPagoClient());
            const response = await preference.create({ body: preferenceBody });

            checkoutUrl = response.init_point;
        } catch (error) {
            console.error(`Erro ao criar preferência do pedido ${order.id}:`, error);
            throw new PaymentCreationError();
        }

        if (!checkoutUrl) {
            console.error(`Mercado Pago não devolveu init_point para o pedido ${order.id}.`);
            throw new PaymentCreationError();
        }

        // Reaproveita o Payment ainda sem pagamento associado; senão cria um novo.
        const pendingPayment = await prismaClient.payment.findFirst({
            where: { orderId: order.id, status: "PENDING", externalId: null },
            orderBy: { createdAt: "desc" },
        });

        if (pendingPayment) {
            await prismaClient.payment.update({
                where: { id: pendingPayment.id },
                data: { amount: order.total },
            });
        } else {
            await prismaClient.payment.create({
                data: {
                    orderId: order.id,
                    provider: "mercadopago",
                    status: "PENDING",
                    amount: order.total,
                },
            });
        }

        return {
            orderId: order.id,
            checkoutUrl,
        };
    }
}

export { CreatePreferenceService };

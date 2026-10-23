import { Payment } from "mercadopago";
import { Prisma } from "../../generated/prisma/client.js";
import type { PaymentStatus } from "../../generated/prisma/enums.js";
import { getMercadoPagoClient } from "../../config/mercadopago.js";
import prismaClient from "../../prisma/index.js";

interface PaymentInfo {
    id: string;
    status: string;
    externalReference: string | null;
    method: string | null;
    amount: Prisma.Decimal;
}

type WebhookQuery = Record<string, unknown>;

class WebhookService {
    async execute(body: any, query: WebhookQuery = {}) {
        // O body do webhook NUNCA é fonte de verdade: ele só indica qual id consultar na API do MP.
        const topic = String(body.type ?? body.topic ?? query.type ?? query.topic ?? "");
        const resourceId = body.data?.id ?? query["data.id"] ?? body.id ?? query.id;

        if (!resourceId) {
            return;
        }

        let paymentId: string | null = null;

        if (topic === "payment") {
            paymentId = String(resourceId);
        } else if (topic.includes("merchant_order")) {
            // A notificação de merchant_order carrega os pagamentos do pedido; serve de caminho
            // alternativo quando a de "payment" não chega.
            paymentId = await this.findPaymentIdInMerchantOrder(String(resourceId));
        } else {
            return;
        }

        if (!paymentId || !/^\d+$/.test(paymentId)) {
            return;
        }

        const paymentInfo = await this.fetchPayment(paymentId);

        if (!paymentInfo) {
            return;
        }

        await this.applyPaymentInfo(paymentInfo);
    }

    private async findPaymentIdInMerchantOrder(merchantOrderId: string): Promise<string | null> {
        const response = await fetch(`https://api.mercadopago.com/merchant_orders/${encodeURIComponent(merchantOrderId)}`, {
            headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` },
        });

        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            // falha transitória: deixa o controller responder 500 para o MP reenviar
            throw new Error(`Falha ao consultar merchant_order ${merchantOrderId}: HTTP ${response.status}`);
        }

        const merchantOrder = (await response.json()) as {
            payments?: { id: number; status: string }[];
        };

        const payments = merchantOrder.payments ?? [];
        const relevant = payments.find((payment) => payment.status === "approved") ?? payments[payments.length - 1];

        return relevant ? String(relevant.id) : null;
    }

    private async fetchPayment(paymentId: string): Promise<PaymentInfo | null> {
        try {
            const payment = await new Payment(getMercadoPagoClient()).get({ id: paymentId });

            return {
                id: String(payment.id),
                status: String(payment.status),
                externalReference: payment.external_reference ?? null,
                method: payment.payment_method_id ?? null,
                amount: new Prisma.Decimal(payment.transaction_amount ?? 0),
            };
        } catch (error) {
            // pagamento inexistente (ex.: notificação de teste do MP): ignora em vez de pedir reenvio
            if ((error as { status?: number }).status === 404) {
                console.warn(`Pagamento ${paymentId} não encontrado no Mercado Pago; webhook ignorado.`);
                return null;
            }
            throw error;
        }
    }

    // Idempotente: o mesmo pagamento do MP sempre cai no mesmo Payment local.
    private async findOrClaimPayment(info: PaymentInfo, orderId: string, orderTotal: Prisma.Decimal) {
        const existing = await prismaClient.payment.findUnique({ where: { externalId: info.id } });

        if (existing) {
            return existing.orderId === orderId ? existing : null;
        }

        // Payment criado na preferência ainda sem pagamento associado
        const unclaimed = await prismaClient.payment.findFirst({
            where: { orderId, externalId: null },
            orderBy: { createdAt: "desc" },
        });

        try {
            if (unclaimed) {
                const claimed = await prismaClient.payment.updateMany({
                    where: { id: unclaimed.id, externalId: null },
                    data: { externalId: info.id },
                });

                if (claimed.count > 0) {
                    return prismaClient.payment.findUniqueOrThrow({ where: { id: unclaimed.id } });
                }
            } else {
                // nova tentativa de pagamento (cliente voltou ao link de uma preferência anterior)
                return await prismaClient.payment.create({
                    data: {
                        orderId,
                        provider: "mercadopago",
                        externalId: info.id,
                        status: "PENDING",
                        amount: orderTotal,
                    },
                });
            }
        } catch (error) {
            if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) {
                throw error;
            }
        }

        // webhooks concorrentes para o mesmo pagamento: o outro já gravou o externalId
        const raced = await prismaClient.payment.findUnique({ where: { externalId: info.id } });
        return raced && raced.orderId === orderId ? raced : null;
    }

    private async applyPaymentInfo(info: PaymentInfo) {
        if (!info.externalReference) {
            console.warn(`Pagamento ${info.id} sem external_reference; ignorado.`);
            return;
        }

        const order = await prismaClient.order.findUnique({ where: { id: info.externalReference } });

        if (!order) {
            console.warn(`Pagamento ${info.id}: pedido ${info.externalReference} não encontrado; ignorado.`);
            return;
        }

        const payment = await this.findOrClaimPayment(info, order.id, order.total);

        if (!payment) {
            console.error(`Pagamento ${info.id} já está vinculado a outro pedido; ignorado.`);
            return;
        }

        // REFUNDED é final; APPROVED só pode virar REFUNDED.
        if (payment.status === "REFUNDED") {
            return;
        }

        const setPaymentStatus = (status: PaymentStatus) =>
            prismaClient.payment.update({
                where: { id: payment.id },
                data: { status, method: info.method ?? payment.method },
            });

        switch (info.status) {
            case "approved": {
                if (payment.status === "APPROVED") {
                    return;
                }

                if (!info.amount.equals(order.total)) {
                    console.error(
                        `Pagamento ${info.id} do pedido ${order.id}: valor aprovado (${info.amount}) difere do total (${order.total}); NÃO marcado como pago.`
                    );
                    return;
                }

                if (order.status === "PENDING_PAYMENT") {
                    const marked = await prismaClient.$transaction(async (tx) => {
                        await tx.payment.update({
                            where: { id: payment.id },
                            data: { status: "APPROVED", method: info.method ?? payment.method },
                        });

                        const result = await tx.order.updateMany({
                            where: { id: order.id, status: "PENDING_PAYMENT" },
                            data: { status: "PAID" },
                        });

                        return result.count > 0;
                    });

                    if (marked) {
                        console.log(`Pedido ${order.id}: PENDING_PAYMENT -> PAID (pagamento ${info.id})`);
                    } else {
                        console.warn(`Pedido ${order.id} mudou de status durante a aprovação do pagamento ${info.id}; confira manualmente.`);
                    }
                    return;
                }

                await setPaymentStatus("APPROVED");

                if (order.status === "CANCELED") {
                    console.warn(`Pagamento ${info.id} aprovado para o pedido CANCELADO ${order.id}: reembolso manual necessário.`);
                } else {
                    console.warn(`Pagamento ${info.id} aprovado para o pedido ${order.id} em ${order.status}: possível pagamento duplicado, confira manualmente.`);
                }
                return;
            }

            case "rejected":
            case "cancelled": {
                // O pedido continua aberto para o cliente tentar de novo; estoque não é alterado.
                if (payment.status === "PENDING") {
                    await setPaymentStatus("REJECTED");
                    console.log(`Pagamento ${info.id} do pedido ${order.id}: ${info.status}`);
                }
                return;
            }

            case "refunded":
            case "charged_back": {
                await setPaymentStatus("REFUNDED");
                console.warn(`Pagamento ${info.id} do pedido ${order.id}: ${info.status}. O pedido não foi alterado; trate manualmente.`);
                return;
            }

            default: {
                // pending, in_process, authorized...
                if (payment.status === "PENDING") {
                    await setPaymentStatus("PENDING");
                }
                return;
            }
        }
    }
}

export { WebhookService };

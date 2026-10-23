import { z } from "zod";
import { OrderStatus, ShippingMethod } from "../generated/prisma/enums.js";
import { money } from "./shippingSchema.js";

export const createOrderSchema = z.object({
    body: z.object({
        addressId: z.string({ message: "O addressId deve ser um texto" }).min(1, { message: "O addressId deve ser informado" }),
        shippingMethod: z.enum(ShippingMethod, { message: "Escolha uma forma de entrega válida (LOCAL_ZONE, CARRIER ou PICKUP)" }),
        items: z
            .array(
                z.object({
                    variantId: z.string({ message: "O variantId deve ser um texto" }).min(1, { message: "O variantId deve ser informado" }),
                    quantity: z
                        .number({ message: "A quantidade deve ser um número" })
                        .int({ message: "A quantidade deve ser inteira" })
                        .min(1, { message: "A quantidade mínima é 1" })
                        .max(20, { message: "A quantidade máxima por item é 20" }),
                }),
                { message: "Informe os itens do pedido" }
            )
            .min(1, { message: "O pedido precisa ter pelo menos 1 item" })
            .refine((items) => new Set(items.map((item) => item.variantId)).size === items.length, {
                message: "Não repita a mesma variação; some as quantidades",
            }),
    }),
});

export const orderIdParamsSchema = z.object({
    params: z.object({
        orderId: z.string().min(1),
    }),
});

export const listOrdersAdminSchema = z.object({
    query: z.object({
        status: z.enum(OrderStatus, { message: "Status inválido" }).optional(),
    }),
});

export const updateOrderStatusSchema = z.object({
    body: z.object({
        status: z.enum(OrderStatus, { message: "Status inválido" }),
    }),
    params: z.object({
        orderId: z.string().min(1),
    }),
});

export const updateShippingQuoteSchema = z.object({
    body: z.object({
        shippingCost: money("O frete"),
        shippingNote: z.string().trim().min(1).max(500).optional(),
    }),
    params: z.object({
        orderId: z.string().min(1),
    }),
});

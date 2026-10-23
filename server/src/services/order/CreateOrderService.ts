import { Prisma } from "../../generated/prisma/client.js";
import type { ShippingMethod } from "../../generated/prisma/enums.js";
import { InsufficientStockError, ItemUnavailableError } from "../../exceptions/OrdersErrors.js";
import { LocalZoneUnavailableError } from "../../exceptions/ShippingErrors.js";
import prismaClient from "../../prisma/index.js";
import { serializeDecimals } from "../../utils/serializeDecimals.js";
import { findAddressOrFail } from "../address/findAddressOrFail.js";
import { findZoneByZip } from "../shipping/findZoneByZip.js";

interface CreateOrderServiceProps {
    userId: string;
    addressId: string;
    shippingMethod: ShippingMethod;
    items: { variantId: string; quantity: number }[];
}

class CreateOrderService {
    async execute({ userId, addressId, shippingMethod, items }: CreateOrderServiceProps) {
        const address = await findAddressOrFail({ id: addressId, userId });

        // Preços, nomes e estoque vêm sempre do banco, nunca do frontend.
        const variants = await prismaClient.productVariant.findMany({
            where: { id: { in: items.map((item) => item.variantId) } },
            include: { product: { select: { name: true, active: true } } },
        });

        const lines = items.map((item) => {
            const variant = variants.find((candidate) => candidate.id === item.variantId);

            if (!variant || !variant.product.active) {
                throw new ItemUnavailableError();
            }

            return { variant, quantity: item.quantity };
        });

        const subtotal = lines.reduce(
            (sum, line) => sum.plus(line.variant.price.times(line.quantity)),
            new Prisma.Decimal(0)
        );

        // Frete: PICKUP = 0; LOCAL_ZONE = preço da zona ativa do CEP; CARRIER = a cotar (null).
        let shippingCost: Prisma.Decimal | null = null;
        let shippingZoneId: string | null = null;

        if (shippingMethod === "PICKUP") {
            shippingCost = new Prisma.Decimal(0);
        } else if (shippingMethod === "LOCAL_ZONE") {
            const zone = await findZoneByZip(address.zipCode);

            if (!zone) {
                throw new LocalZoneUnavailableError();
            }

            shippingCost = zone.price;
            shippingZoneId = zone.id;
        }

        const total = subtotal.plus(shippingCost ?? 0);

        const order = await prismaClient.$transaction(async (tx) => {
            // Decremento atômico: só passa se ainda houver estoque suficiente.
            for (const { variant, quantity } of lines) {
                if (variant.stock === null) {
                    continue;
                }

                const result = await tx.productVariant.updateMany({
                    where: { id: variant.id, stock: { gte: quantity } },
                    data: { stock: { decrement: quantity } },
                });

                if (result.count === 0) {
                    throw new InsufficientStockError(`${variant.product.name} - ${variant.label}`);
                }
            }

            return tx.order.create({
                data: {
                    userId,
                    status: shippingMethod === "CARRIER" ? "AWAITING_SHIPPING_QUOTE" : "PENDING_PAYMENT",
                    addressId: address.id,
                    shipZipCode: address.zipCode,
                    shipStreet: address.street,
                    shipNumber: address.number,
                    shipComplement: address.complement,
                    shipDistrict: address.district,
                    shipCity: address.city,
                    shipState: address.state,
                    shippingMethod,
                    shippingZoneId,
                    shippingCost,
                    subtotal,
                    total,
                    items: {
                        create: lines.map(({ variant, quantity }) => ({
                            variantId: variant.id,
                            productName: variant.product.name,
                            variantLabel: variant.label,
                            unitPrice: variant.price,
                            quantity,
                        })),
                    },
                },
                include: { items: true },
            });
        });

        return serializeDecimals(order);
    }
}

export { CreateOrderService };

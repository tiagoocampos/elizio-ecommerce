import type { OrderStatus } from "../../generated/prisma/enums.js";
import prismaClient from "../../prisma/index.js";
import { serializeDecimals } from "../../utils/serializeDecimals.js";

interface ListOrdersAdminServiceProps {
    status?: OrderStatus | undefined;
}

class ListOrdersAdminService {
    async execute({ status }: ListOrdersAdminServiceProps) {
        const orders = await prismaClient.order.findMany({
            where: status !== undefined ? { status } : {},
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { id: true, name: true, email: true } },
                items: true,
                payments: true,
            },
        });

        return serializeDecimals(orders);
    }
}

export { ListOrdersAdminService };

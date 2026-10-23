import prismaClient from "../../prisma/index.js";
import { serializeDecimals } from "../../utils/serializeDecimals.js";

interface ListOrdersServiceProps {
    userId: string;
}

class ListOrdersService {
    async execute({ userId }: ListOrdersServiceProps) {
        const orders = await prismaClient.order.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: { items: true },
        });

        return serializeDecimals(orders);
    }
}

export { ListOrdersService };

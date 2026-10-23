import prismaClient from "../../prisma/index.js";
import { serializeDecimals } from "../../utils/serializeDecimals.js";
import { publicProductInclude } from "./productInclude.js";
import { withPriceFrom } from "./withPriceFrom.js";

interface ListProductsServiceProps {
    categoryId?: string | undefined;
}

class ListProductsService {
    async execute({ categoryId }: ListProductsServiceProps) {
        const products = await prismaClient.product.findMany({
            where: {
                active: true,
                ...(categoryId !== undefined && { categoryId }),
            },
            include: publicProductInclude,
            orderBy: { createdAt: "desc" },
        });

        return serializeDecimals(products.map(withPriceFrom));
    }
}

export { ListProductsService };

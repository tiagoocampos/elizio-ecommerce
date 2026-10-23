import prismaClient from "../../prisma/index.js";
import { serializeDecimals } from "../../utils/serializeDecimals.js";
import { adminProductInclude } from "./productInclude.js";
import { withPriceFrom } from "./withPriceFrom.js";

class ListProductsAdminService {
    async execute() {
        const products = await prismaClient.product.findMany({
            include: adminProductInclude,
            orderBy: { createdAt: "desc" },
        });

        return serializeDecimals(products.map(withPriceFrom));
    }
}

export { ListProductsAdminService };

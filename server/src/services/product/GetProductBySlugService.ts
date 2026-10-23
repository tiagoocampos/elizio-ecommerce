import { ProductNotFoundError } from "../../exceptions/ProductErrors.js";
import prismaClient from "../../prisma/index.js";
import { serializeDecimals } from "../../utils/serializeDecimals.js";
import { publicProductInclude } from "./productInclude.js";
import { withPriceFrom } from "./withPriceFrom.js";

interface GetProductBySlugServiceProps {
    slug: string;
}

class GetProductBySlugService {
    async execute({ slug }: GetProductBySlugServiceProps) {
        const product = await prismaClient.product.findFirst({
            where: { slug, active: true },
            include: publicProductInclude,
        });

        if (!product) {
            throw new ProductNotFoundError();
        }

        return serializeDecimals(withPriceFrom(product));
    }
}

export { GetProductBySlugService };

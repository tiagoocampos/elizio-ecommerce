import { ProductNotFoundError } from "../../exceptions/ProductErrors.js";
import prismaClient from "../../prisma/index.js";

interface DeleteProductServiceProps {
    productId: string;
}

class DeleteProductService {
    async execute({ productId }: DeleteProductServiceProps) {
        const product = await prismaClient.product.findUnique({ where: { id: productId } });

        if (!product) {
            throw new ProductNotFoundError();
        }

        // Soft delete: OrderItem referencia a variação com RESTRICT, então o produto nunca é apagado.
        await prismaClient.product.update({
            where: { id: productId },
            data: { active: false },
        });

        return { message: "Produto desativado com sucesso" };
    }
}

export { DeleteProductService };

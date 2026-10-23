import { CategoryHasProductsError, CategoryNotFoundError } from "../../exceptions/CategoryErrors.js";
import prismaClient from "../../prisma/index.js";

interface DeleteCategoryServiceProps {
    id: string;
}

class DeleteCategoryService {
    async execute({ id }: DeleteCategoryServiceProps) {
        const category = await prismaClient.category.findUnique({ where: { id } });

        if (!category) {
            throw new CategoryNotFoundError();
        }

        const productsCount = await prismaClient.product.count({ where: { categoryId: id } });

        if (productsCount > 0) {
            throw new CategoryHasProductsError();
        }

        await prismaClient.category.delete({ where: { id } });

        return { message: "Categoria deletada com sucesso" };
    }
}

export { DeleteCategoryService };

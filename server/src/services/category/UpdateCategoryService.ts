import { CategoryAlreadyExistsError, CategoryNotFoundError } from "../../exceptions/CategoryErrors.js";
import prismaClient from "../../prisma/index.js";
import { uniqueSlug } from "../../utils/uniqueSlug.js";

interface UpdateCategoryServiceProps {
    id: string;
    name: string;
}

class UpdateCategoryService {
    async execute({ id, name }: UpdateCategoryServiceProps) {
        const category = await prismaClient.category.findUnique({ where: { id } });

        if (!category) {
            throw new CategoryNotFoundError();
        }

        const nameAlreadyExists = await prismaClient.category.findFirst({
            where: { name, NOT: { id } },
        });

        if (nameAlreadyExists) {
            throw new CategoryAlreadyExistsError();
        }

        const slug = await uniqueSlug("category", name, id);

        const categoryUpdate = await prismaClient.category.update({
            where: { id },
            data: { name, slug },
            select: {
                id: true,
                name: true,
                slug: true,
            }
        });

        return categoryUpdate;
    }
}

export { UpdateCategoryService };

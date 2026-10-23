import { CategoryAlreadyExistsError } from "../../exceptions/CategoryErrors.js";
import prismaClient from "../../prisma/index.js";
import { uniqueSlug } from "../../utils/uniqueSlug.js";

interface CreateCategoryProps {
    name: string;
}

class CreateCategoryService {
    async execute({ name }: CreateCategoryProps) {
        const nameAlreadyExists = await prismaClient.category.findUnique({ where: { name } });

        if (nameAlreadyExists) {
            throw new CategoryAlreadyExistsError();
        }

        const slug = await uniqueSlug("category", name);

        const category = await prismaClient.category.create({
            data: { name, slug },
            select: {
                id: true,
                name: true,
                slug: true,
            }
        });

        return category;
    }
}

export { CreateCategoryService };

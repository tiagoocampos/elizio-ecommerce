import prismaClient from "../../prisma/index.js";

class ListCategoriesService {
    async execute() {
        const categories = await prismaClient.category.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
            },
            orderBy: {
                name: "asc",
            },
        });

        return categories;
    }
}

export { ListCategoriesService };

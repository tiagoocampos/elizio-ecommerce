import { Prisma } from "../../generated/prisma/client.js";
import { CategoryNotFoundError } from "../../exceptions/CategoryErrors.js";
import { ImageRequiredError } from "../../exceptions/ProductErrors.js";
import prismaClient from "../../prisma/index.js";
import { deleteImagesByUrl, uploadImages, type ImageFile } from "../../utils/uploadImage.js";
import { serializeDecimals } from "../../utils/serializeDecimals.js";
import { uniqueSlug } from "../../utils/uniqueSlug.js";
import { adminProductInclude } from "./productInclude.js";

interface VariantInput {
    label: string;
    price: number;
    stock?: number | null | undefined;
    sku?: string | null | undefined;
}

interface CreateProductServiceProps {
    name: string;
    description: string;
    categoryId: string;
    madeToOrder?: boolean | undefined;
    leadTimeDays?: number | undefined;
    widthCm?: number | undefined;
    depthCm?: number | undefined;
    heightCm?: number | undefined;
    weightKg?: number | undefined;
    variants: VariantInput[];
    files: ImageFile[];
}

class CreateProductService {
    async execute({
        name,
        description,
        categoryId,
        madeToOrder,
        leadTimeDays,
        widthCm,
        depthCm,
        heightCm,
        weightKg,
        variants,
        files,
    }: CreateProductServiceProps) {
        if (files.length === 0) {
            throw new ImageRequiredError();
        }

        const category = await prismaClient.category.findUnique({ where: { id: categoryId } });

        if (!category) {
            throw new CategoryNotFoundError();
        }

        const slug = await uniqueSlug("product", name);

        // A primeira imagem do array é a principal.
        const images = await uploadImages(files);

        try {
            const product = await prismaClient.product.create({
                data: {
                    name,
                    slug,
                    description,
                    categoryId,
                    images,
                    ...(madeToOrder !== undefined && { madeToOrder }),
                    ...(leadTimeDays !== undefined && { leadTimeDays }),
                    ...(widthCm !== undefined && { widthCm }),
                    ...(depthCm !== undefined && { depthCm }),
                    ...(heightCm !== undefined && { heightCm }),
                    ...(weightKg !== undefined && { weightKg: new Prisma.Decimal(weightKg) }),
                    variants: {
                        create: variants.map((variant) => ({
                            label: variant.label,
                            price: new Prisma.Decimal(variant.price),
                            stock: variant.stock ?? null,
                            sku: variant.sku ?? null,
                        })),
                    },
                },
                include: adminProductInclude,
            });

            return serializeDecimals(product);
        } catch (error) {
            // compensação: o produto não foi criado, então as imagens enviadas ficariam órfãs
            await deleteImagesByUrl(images);
            throw error;
        }
    }
}

export { CreateProductService };

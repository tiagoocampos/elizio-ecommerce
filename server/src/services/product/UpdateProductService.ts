import { Prisma } from "../../generated/prisma/client.js";
import { CategoryNotFoundError } from "../../exceptions/CategoryErrors.js";
import {
    ImageRequiredError,
    InvalidKeepImagesError,
    ProductNotFoundError,
    TooManyImagesError,
    VariantAlreadySoldError,
    VariantNotFoundError,
} from "../../exceptions/ProductErrors.js";
import prismaClient from "../../prisma/index.js";
import { deleteImagesByUrl, uploadImages, type ImageFile } from "../../utils/uploadImage.js";
import { serializeDecimals } from "../../utils/serializeDecimals.js";
import { uniqueSlug } from "../../utils/uniqueSlug.js";
import { adminProductInclude } from "./productInclude.js";

const MAX_IMAGES = 8;

interface VariantInput {
    id?: string | undefined;
    label: string;
    price: number;
    stock?: number | null | undefined;
    sku?: string | null | undefined;
}

interface UpdateProductServiceProps {
    productId: string;
    name?: string | undefined;
    description?: string | undefined;
    categoryId?: string | undefined;
    madeToOrder?: boolean | undefined;
    active?: boolean | undefined;
    leadTimeDays?: number | undefined;
    widthCm?: number | undefined;
    depthCm?: number | undefined;
    heightCm?: number | undefined;
    weightKg?: number | undefined;
    keepImages?: string[] | undefined;
    variants?: VariantInput[] | undefined;
    files: ImageFile[];
}

class UpdateProductService {
    async execute({
        productId,
        name,
        description,
        categoryId,
        madeToOrder,
        active,
        leadTimeDays,
        widthCm,
        depthCm,
        heightCm,
        weightKg,
        keepImages,
        variants,
        files,
    }: UpdateProductServiceProps) {
        const product = await prismaClient.product.findUnique({
            where: { id: productId },
            include: { variants: { select: { id: true } } },
        });

        if (!product) {
            throw new ProductNotFoundError();
        }

        if (categoryId !== undefined) {
            const category = await prismaClient.category.findUnique({ where: { id: categoryId } });
            if (!category) {
                throw new CategoryNotFoundError();
            }
        }

        // --- imagens: lista final = keepImages + arquivos novos (nessa ordem) ---
        let finalImages: string[] | undefined;
        let removedImages: string[] = [];

        if (keepImages !== undefined || files.length > 0) {
            const kept = [...new Set(keepImages ?? product.images)];

            if (kept.some((url) => !product.images.includes(url))) {
                throw new InvalidKeepImagesError();
            }

            if (kept.length + files.length === 0) {
                throw new ImageRequiredError();
            }

            // validado antes de qualquer upload no Cloudinary
            if (kept.length + files.length > MAX_IMAGES) {
                throw new TooManyImagesError();
            }

            removedImages = product.images.filter((url) => !kept.includes(url));
            finalImages = kept;
        }

        // --- variações: valida antes de subir qualquer arquivo ---
        let removedVariantIds: string[] = [];

        if (variants !== undefined) {
            const existingIds = new Set(product.variants.map((variant) => variant.id));
            const sentIds = variants.flatMap((variant) => (variant.id !== undefined ? [variant.id] : []));

            if (new Set(sentIds).size !== sentIds.length || sentIds.some((id) => !existingIds.has(id))) {
                throw new VariantNotFoundError();
            }

            removedVariantIds = [...existingIds].filter((id) => !sentIds.includes(id));

            if (removedVariantIds.length > 0) {
                const soldCount = await prismaClient.orderItem.count({
                    where: { variantId: { in: removedVariantIds } },
                });

                if (soldCount > 0) {
                    throw new VariantAlreadySoldError();
                }
            }
        }

        const slug = name !== undefined && name !== product.name
            ? await uniqueSlug("product", name, productId)
            : undefined;

        const newImages = files.length > 0 ? await uploadImages(files) : [];

        if (finalImages !== undefined) {
            finalImages = [...finalImages, ...newImages];
        }

        try {
            const updated = await prismaClient.$transaction(async (tx) => {
                if (variants !== undefined) {
                    if (removedVariantIds.length > 0) {
                        await tx.productVariant.deleteMany({ where: { id: { in: removedVariantIds } } });
                    }

                    for (const variant of variants) {
                        const price = new Prisma.Decimal(variant.price);

                        if (variant.id !== undefined) {
                            // Em variação existente, stock/sku ausentes = não alterar; null explícito = limpar.
                            await tx.productVariant.update({
                                where: { id: variant.id },
                                data: {
                                    label: variant.label,
                                    price,
                                    ...(variant.stock !== undefined && { stock: variant.stock }),
                                    ...(variant.sku !== undefined && { sku: variant.sku }),
                                },
                            });
                        } else {
                            await tx.productVariant.create({
                                data: {
                                    productId,
                                    label: variant.label,
                                    price,
                                    stock: variant.stock ?? null,
                                    sku: variant.sku ?? null,
                                },
                            });
                        }
                    }
                }

                return tx.product.update({
                    where: { id: productId },
                    data: {
                        ...(name !== undefined && { name }),
                        ...(slug !== undefined && { slug }),
                        ...(description !== undefined && { description }),
                        ...(categoryId !== undefined && { categoryId }),
                        ...(madeToOrder !== undefined && { madeToOrder }),
                        ...(active !== undefined && { active }),
                        ...(leadTimeDays !== undefined && { leadTimeDays }),
                        ...(widthCm !== undefined && { widthCm }),
                        ...(depthCm !== undefined && { depthCm }),
                        ...(heightCm !== undefined && { heightCm }),
                        ...(weightKg !== undefined && { weightKg: new Prisma.Decimal(weightKg) }),
                        ...(finalImages !== undefined && { images: finalImages }),
                    },
                    include: adminProductInclude,
                });
            });

            // só depois de o banco confirmar é seguro apagar as imagens removidas
            await deleteImagesByUrl(removedImages);

            return serializeDecimals(updated);
        } catch (error) {
            // compensação: as imagens novas não ficaram associadas a nenhum produto
            await deleteImagesByUrl(newImages);

            // corrida: um pedido passou a referenciar a variação entre a checagem e o delete
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
                throw new VariantAlreadySoldError();
            }

            throw error;
        }
    }
}

export { UpdateProductService };

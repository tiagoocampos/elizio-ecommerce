import prismaClient from "../prisma/index.js";
import { generateSlug } from "./generateSlug.js";

type SlugModel = "category" | "product";

// Gera o slug de `text`; se já existir, acrescenta -2, -3... `ignoreId` ignora o próprio registro (update).
export async function uniqueSlug(model: SlugModel, text: string, ignoreId?: string): Promise<string> {
    const base = generateSlug(text) || "item";
    let candidate = base;
    let suffix = 1;

    while (true) {
        const where = {
            slug: candidate,
            ...(ignoreId !== undefined && { NOT: { id: ignoreId } }),
        };

        const existing = model === "category"
            ? await prismaClient.category.findFirst({ where, select: { id: true } })
            : await prismaClient.product.findFirst({ where, select: { id: true } });

        if (!existing) {
            return candidate;
        }

        suffix += 1;
        candidate = `${base}-${suffix}`;
    }
}

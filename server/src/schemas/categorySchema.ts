import { z } from "zod";

const categoryName = z
    .string({ message: "O nome da categoria deve ser um texto" })
    .trim()
    .min(3, { message: "O nome da categoria deve ter no mínimo 3 caracteres" })
    .max(45, { message: "O nome deve ter no máximo 45 caracteres" });

export const createCategorySchema = z.object({
    body: z.object({
        name: categoryName,
    })
})

export const updateCategorySchema = z.object({
    body: z.object({
        name: categoryName,
    }),
    params: z.object({
        id: z.string().min(1),
    }),
})

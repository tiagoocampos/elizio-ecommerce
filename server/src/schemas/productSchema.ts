import { z } from "zod";

// --- helpers para multipart/form-data: tudo chega como texto ---

const emptyToUndefined = (value: unknown) => (value === "" || value === null ? undefined : value);

const optionalPositiveInt = (message: string) =>
    z.preprocess(emptyToUndefined, z.coerce.number({ message }).int({ message }).positive({ message }).optional());

const hasMaxTwoDecimals = (value: number) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;

const optionalWeight = z.preprocess(
    emptyToUndefined,
    z.coerce
        .number({ message: "O peso deve ser um número" })
        .positive({ message: "O peso deve ser positivo" })
        .max(999999.99, { message: "Peso inválido" })
        .refine(hasMaxTwoDecimals, { message: "O peso deve ter no máximo 2 casas decimais" })
        .optional()
);

const formBoolean = z.preprocess(
    (value) => (value === "true" ? true : value === "false" ? false : emptyToUndefined(value)),
    z.boolean({ message: "Use true ou false" }).optional()
);

// aceita string JSON (multipart) ou o array já pronto (application/json)
const jsonArray = <T extends z.ZodType>(item: T, message: string) =>
    z.preprocess((value) => {
        if (typeof value !== "string") {
            return value;
        }
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }, z.array(item, { message }));

const price = z
    .number({ message: "O preço deve ser um número" })
    .positive({ message: "O preço deve ser positivo" })
    .max(99999999.99, { message: "Preço inválido" })
    .refine(hasMaxTwoDecimals, { message: "O preço deve ter no máximo 2 casas decimais" });

const variantFields = {
    label: z.string({ message: "O rótulo da variação é obrigatório" }).trim().min(1, { message: "O rótulo da variação é obrigatório" }),
    price,
    // ausente ou null = sob encomenda, sem controle de estoque
    stock: z.number().int({ message: "O estoque deve ser inteiro" }).min(0, { message: "O estoque não pode ser negativo" }).nullish(),
    sku: z.string().trim().min(1).nullish(),
};

const createVariantSchema = z.object(variantFields);

const updateVariantSchema = z.object({
    id: z.string().min(1).optional(),
    ...variantFields,
});

const variantsMessage = "variants deve ser um array JSON de variações";

export const createProductSchema = z.object({
    body: z.object({
        name: z.string({ message: "O nome é obrigatório" }).trim().min(2, { message: "O nome deve ter no mínimo 2 caracteres" }).max(120, { message: "O nome deve ter no máximo 120 caracteres" }),
        description: z.string({ message: "A descrição é obrigatória" }).trim().min(1, { message: "A descrição é obrigatória" }),
        categoryId: z.string({ message: "A categoria é obrigatória" }).min(1, { message: "A categoria é obrigatória" }),
        madeToOrder: formBoolean,
        leadTimeDays: optionalPositiveInt("O prazo deve ser um número inteiro positivo"),
        widthCm: optionalPositiveInt("A largura deve ser um número inteiro positivo"),
        depthCm: optionalPositiveInt("A profundidade deve ser um número inteiro positivo"),
        heightCm: optionalPositiveInt("A altura deve ser um número inteiro positivo"),
        weightKg: optionalWeight,
        variants: jsonArray(createVariantSchema, variantsMessage).pipe(
            z.array(createVariantSchema).min(1, { message: "Informe pelo menos 1 variação" })
        ),
    }),
});

export const updateProductSchema = z.object({
    body: z.object({
        productId: z.string({ message: "O productId é obrigatório" }).min(1, { message: "O productId é obrigatório" }),
        name: z.string().trim().min(2, { message: "O nome deve ter no mínimo 2 caracteres" }).max(120, { message: "O nome deve ter no máximo 120 caracteres" }).optional(),
        description: z.string().trim().min(1, { message: "A descrição não pode ser vazia" }).optional(),
        categoryId: z.string().min(1).optional(),
        madeToOrder: formBoolean,
        active: formBoolean,
        leadTimeDays: optionalPositiveInt("O prazo deve ser um número inteiro positivo"),
        widthCm: optionalPositiveInt("A largura deve ser um número inteiro positivo"),
        depthCm: optionalPositiveInt("A profundidade deve ser um número inteiro positivo"),
        heightCm: optionalPositiveInt("A altura deve ser um número inteiro positivo"),
        weightKg: optionalWeight,
        keepImages: jsonArray(z.string().min(1), "keepImages deve ser um array JSON de URLs").optional(),
        variants: jsonArray(updateVariantSchema, variantsMessage)
            .pipe(z.array(updateVariantSchema).min(1, { message: "Informe pelo menos 1 variação" }))
            .optional(),
    }),
});

export const listProductsSchema = z.object({
    query: z.object({
        categoryId: z.string().min(1).optional(),
    }),
});

export const productSlugSchema = z.object({
    params: z.object({
        slug: z.string().min(1),
    }),
});

export const deleteProductSchema = z.object({
    query: z.object({
        productId: z.string({ message: "O productId é obrigatório" }).min(1, { message: "O productId é obrigatório" }),
    }),
});

import z from "zod";

export const createUserSchema = z.object({
    body: z.object({
        name: z.string({message: "Nome é obrigatório"}).min(1, { message: "Nome é obrigatório" }),
        email: z.email({message: "O email deve ser válido"}),
        password: z.string({message: "A senha deve ser do tipo texto"}).min(8, { message: "A senha deve ter no mínimo 8 caracteres" }),
        phone: z
            .string({ message: "O telefone deve ser do tipo texto" })
            .min(10, { message: "Informe um telefone válido com DDD" })
            .max(15, { message: "Telefone inválido" })
            .optional(),
    }),
})

export const authUserSchema = z.object({
    body: z.object({
        email: z.email({ message: "O email deve ser válido" }),
        password: z.string({ message: "A senha deve ser do tipo texto" }).min(1, { message: "Informe a senha" }),
    }),
})

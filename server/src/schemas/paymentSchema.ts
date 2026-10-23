import { z } from "zod";

export const createPreferenceSchema = z.object({
    body: z.object({
        orderId: z.string({ message: "O orderId deve ser um texto" }).min(1, { message: "O orderId deve ser informado" }),
    }),
});

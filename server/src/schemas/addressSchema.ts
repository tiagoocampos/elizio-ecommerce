import { z } from "zod";
import { zipCodeSchema } from "./zipCodeSchema.js";

const state = z
    .string({ message: "O estado deve ser do tipo texto" })
    .trim()
    .regex(/^[a-zA-Z]{2}$/, { message: "Use a sigla do estado (ex: RS)" })
    .transform((value) => value.toUpperCase());

export const createAddressSchema = z.object({
    body: z.object({
        zipCode: zipCodeSchema,
        street: z.string({ message: "A rua deve ser do tipo texto" }).trim().min(3, { message: "Informe a rua" }),
        number: z.string({ message: "O número deve ser do tipo texto" }).trim().min(1, { message: "Informe o número" }),
        complement: z.string().trim().min(1).nullish(),
        district: z.string({ message: "O bairro deve ser do tipo texto" }).trim().min(2, { message: "Informe o bairro" }),
        city: z.string({ message: "A cidade deve ser do tipo texto" }).trim().min(2, { message: "Informe a cidade" }),
        state,
    }),
});

export const updateAddressSchema = z.object({
    body: z.object({
        zipCode: zipCodeSchema.optional(),
        street: z.string().trim().min(3, { message: "Informe a rua" }).optional(),
        number: z.string().trim().min(1, { message: "Informe o número" }).optional(),
        complement: z.string().trim().min(1).nullish(),
        district: z.string().trim().min(2, { message: "Informe o bairro" }).optional(),
        city: z.string().trim().min(2, { message: "Informe a cidade" }).optional(),
        state: state.optional(),
    }),
    query: z.object({
        addressId: z.string({ message: "O addressId deve ser um texto" }).min(1, { message: "O addressId deve ser informado" }),
    }),
});

export const deleteAddressSchema = z.object({
    query: z.object({
        addressId: z.string({ message: "O addressId deve ser um texto" }).min(1, { message: "O addressId deve ser informado" }),
    }),
});

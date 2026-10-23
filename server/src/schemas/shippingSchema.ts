import { z } from "zod";
import { zipCodeSchema } from "./zipCodeSchema.js";

const hasMaxTwoDecimals = (value: number) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;

export const money = (label: string) =>
    z
        .number({ message: `${label} deve ser um número` })
        .min(0, { message: `${label} não pode ser negativo` })
        .max(99999999.99, { message: `${label} inválido` })
        .refine(hasMaxTwoDecimals, { message: `${label} deve ter no máximo 2 casas decimais` });

const days = (label: string) =>
    z.number({ message: `${label} deve ser um número` }).int({ message: `${label} deve ser inteiro` }).min(0, { message: `${label} não pode ser negativo` });

export const shippingQuoteSchema = z.object({
    body: z.object({
        zipCode: zipCodeSchema,
    }),
});

export const createShippingZoneSchema = z.object({
    body: z
        .object({
            name: z.string({ message: "O nome é obrigatório" }).trim().min(2, { message: "O nome deve ter no mínimo 2 caracteres" }),
            cepStart: zipCodeSchema,
            cepEnd: zipCodeSchema,
            price: money("O preço"),
            minDays: days("O prazo mínimo"),
            maxDays: days("O prazo máximo"),
        })
        .refine((body) => body.cepStart <= body.cepEnd, { message: "O CEP inicial deve ser menor ou igual ao CEP final", path: ["cepStart"] })
        .refine((body) => body.minDays <= body.maxDays, { message: "O prazo mínimo deve ser menor ou igual ao prazo máximo", path: ["minDays"] }),
});

export const updateShippingZoneSchema = z.object({
    body: z.object({
        name: z.string().trim().min(2, { message: "O nome deve ter no mínimo 2 caracteres" }).optional(),
        cepStart: zipCodeSchema.optional(),
        cepEnd: zipCodeSchema.optional(),
        price: money("O preço").optional(),
        minDays: days("O prazo mínimo").optional(),
        maxDays: days("O prazo máximo").optional(),
        active: z.boolean({ message: "active deve ser true ou false" }).optional(),
    }),
    params: z.object({
        id: z.string().min(1),
    }),
});

export const deleteShippingZoneSchema = z.object({
    params: z.object({
        id: z.string().min(1),
    }),
});

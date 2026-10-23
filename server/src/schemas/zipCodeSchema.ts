import { z } from "zod";
import { InvalidZipCodeError } from "../exceptions/AddressErrors.js";
import { normalizeZip } from "../utils/normalizeZip.js";

// Aceita "01310-100" ou "01310100" e devolve só os 8 dígitos.
export const zipCodeSchema = z
    .string({ message: "O CEP deve ser do tipo texto" })
    .transform((value, ctx) => {
        try {
            return normalizeZip(value);
        } catch (error) {
            if (error instanceof InvalidZipCodeError) {
                ctx.issues.push({ code: "custom", message: error.message, input: value });
                return z.NEVER;
            }
            throw error;
        }
    });

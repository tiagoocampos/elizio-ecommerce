import { InvalidZipCodeError } from "../exceptions/AddressErrors.js";

// Remove tudo que não for dígito e exige exatamente 8 dígitos.
export function normalizeZip(zip: string): string {
    const digits = zip.replace(/\D/g, "");

    if (digits.length !== 8) {
        throw new InvalidZipCodeError();
    }

    return digits;
}

import "dotenv/config";
import { MercadoPagoConfig } from "mercadopago";
import { PaymentCreationError } from "../exceptions/PaymentErrors.js";

let client: MercadoPagoConfig | null = null;

// O token não é exigido no startup: só falha quando o pagamento for realmente usado.
export function getMercadoPagoClient(): MercadoPagoConfig {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!accessToken) {
        console.error("MERCADOPAGO_ACCESS_TOKEN não definido no .env; pagamentos indisponíveis.");
        throw new PaymentCreationError();
    }

    client ??= new MercadoPagoConfig({ accessToken });

    return client;
}

import { Request, Response } from "express";
import { WebhookService } from "../../services/payment/WebhookService.js";

class WebhookController {
    async handle(req: Request, res: Response) {
        try {
            const webhookService = new WebhookService();

            await webhookService.execute(req.body ?? {}, req.query);

            return res.status(200).json({ ok: true });
        } catch (error) {
            // 500 só em falha transitória, para o Mercado Pago reenviar a notificação.
            console.error("Erro ao processar webhook do Mercado Pago:", error);

            return res.status(500).json({
                ok: false,
                message: "Erro ao processar webhook.",
            });
        }
    }
}

export { WebhookController };

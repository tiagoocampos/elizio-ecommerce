import { Request, Response } from 'express';
import { CreatePreferenceService } from '../../services/payment/CreatePreferenceService.js';

class CreatePreferenceController {
    async handle(req: Request, res: Response) {
        const { orderId } = req.body;

        const createPreferenceService = new CreatePreferenceService();
        const payment = await createPreferenceService.execute({ orderId, userId: req.userId });

        return res.json(payment);
    }
}

export { CreatePreferenceController };

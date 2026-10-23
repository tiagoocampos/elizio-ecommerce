import { Request, Response } from 'express';
import { UpdateShippingQuoteService } from '../../services/order/UpdateShippingQuoteService.js';

class UpdateShippingQuoteController {
    async handle(req: Request, res: Response) {
        const { orderId } = req.params as { orderId: string };
        const { shippingCost, shippingNote } = req.body;

        const updateShippingQuoteService = new UpdateShippingQuoteService();
        const order = await updateShippingQuoteService.execute({ orderId, shippingCost, shippingNote });

        return res.json(order);
    }
}

export { UpdateShippingQuoteController };

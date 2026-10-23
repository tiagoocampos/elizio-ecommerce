import { Request, Response } from 'express';
import { ShippingQuoteService } from '../../services/shipping/ShippingQuoteService.js';

class ShippingQuoteController {
    async handle(req: Request, res: Response) {
        const { zipCode } = req.body;

        const shippingQuoteService = new ShippingQuoteService();
        const quote = await shippingQuoteService.execute({ zipCode });

        return res.json(quote);
    }
}

export { ShippingQuoteController };

import { Request, Response } from 'express';
import { CreateShippingZoneService } from '../../services/shipping/CreateShippingZoneService.js';

class CreateShippingZoneController {
    async handle(req: Request, res: Response) {
        const { name, cepStart, cepEnd, price, minDays, maxDays } = req.body;

        const createShippingZoneService = new CreateShippingZoneService();
        const zone = await createShippingZoneService.execute({ name, cepStart, cepEnd, price, minDays, maxDays });

        return res.status(201).json(zone);
    }
}

export { CreateShippingZoneController };

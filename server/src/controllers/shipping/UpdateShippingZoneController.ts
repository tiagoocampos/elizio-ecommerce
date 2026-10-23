import { Request, Response } from 'express';
import { UpdateShippingZoneService } from '../../services/shipping/UpdateShippingZoneService.js';

class UpdateShippingZoneController {
    async handle(req: Request, res: Response) {
        const { id } = req.params as { id: string };
        const { name, cepStart, cepEnd, price, minDays, maxDays, active } = req.body;

        const updateShippingZoneService = new UpdateShippingZoneService();
        const zone = await updateShippingZoneService.execute({ id, name, cepStart, cepEnd, price, minDays, maxDays, active });

        return res.json(zone);
    }
}

export { UpdateShippingZoneController };

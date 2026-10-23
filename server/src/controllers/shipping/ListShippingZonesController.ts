import { Request, Response } from 'express';
import { ListShippingZonesService } from '../../services/shipping/ListShippingZonesService.js';

class ListShippingZonesController {
    async handle(req: Request, res: Response) {
        const listShippingZonesService = new ListShippingZonesService();
        const zones = await listShippingZonesService.execute();

        return res.json(zones);
    }
}

export { ListShippingZonesController };

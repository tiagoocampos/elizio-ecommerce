import { Request, Response } from 'express';
import { DeleteShippingZoneService } from '../../services/shipping/DeleteShippingZoneService.js';

class DeleteShippingZoneController {
    async handle(req: Request, res: Response) {
        const { id } = req.params as { id: string };

        const deleteShippingZoneService = new DeleteShippingZoneService();
        const result = await deleteShippingZoneService.execute({ id });

        return res.json(result);
    }
}

export { DeleteShippingZoneController };

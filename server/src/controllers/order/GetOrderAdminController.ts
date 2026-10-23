import { Request, Response } from 'express';
import { GetOrderAdminService } from '../../services/order/GetOrderAdminService.js';

class GetOrderAdminController {
    async handle(req: Request, res: Response) {
        const { orderId } = req.params as { orderId: string };

        const getOrderAdminService = new GetOrderAdminService();
        const order = await getOrderAdminService.execute({ orderId });

        return res.json(order);
    }
}

export { GetOrderAdminController };

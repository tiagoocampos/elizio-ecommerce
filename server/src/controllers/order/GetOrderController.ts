import { Request, Response } from 'express';
import { GetOrderService } from '../../services/order/GetOrderService.js';

class GetOrderController {
    async handle(req: Request, res: Response) {
        const { orderId } = req.params as { orderId: string };

        const getOrderService = new GetOrderService();
        const order = await getOrderService.execute({ userId: req.userId, orderId });

        return res.json(order);
    }
}

export { GetOrderController };

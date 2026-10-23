import { Request, Response } from 'express';
import { UpdateOrderStatusService } from '../../services/order/UpdateOrderStatusService.js';

class UpdateOrderStatusController {
    async handle(req: Request, res: Response) {
        const { orderId } = req.params as { orderId: string };
        const { status } = req.body;

        const updateOrderStatusService = new UpdateOrderStatusService();
        const order = await updateOrderStatusService.execute({ orderId, status });

        return res.json(order);
    }
}

export { UpdateOrderStatusController };

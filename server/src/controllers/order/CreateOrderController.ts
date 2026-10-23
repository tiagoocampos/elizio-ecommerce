import { Request, Response } from 'express';
import { CreateOrderService } from '../../services/order/CreateOrderService.js';

class CreateOrderController {
    async handle(req: Request, res: Response) {
        const { addressId, shippingMethod, items } = req.body;

        const createOrderService = new CreateOrderService();
        const order = await createOrderService.execute({
            userId: req.userId,
            addressId,
            shippingMethod,
            items,
        });

        return res.status(201).json(order);
    }
}

export { CreateOrderController };

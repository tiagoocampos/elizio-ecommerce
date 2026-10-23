import { Request, Response } from 'express';
import { ListOrdersService } from '../../services/order/ListOrdersService.js';

class ListOrdersController {
    async handle(req: Request, res: Response) {
        const listOrdersService = new ListOrdersService();
        const orders = await listOrdersService.execute({ userId: req.userId });

        return res.json(orders);
    }
}

export { ListOrdersController };

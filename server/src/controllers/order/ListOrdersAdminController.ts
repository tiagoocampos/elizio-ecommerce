import { Request, Response } from 'express';
import type { OrderStatus } from '../../generated/prisma/enums.js';
import { ListOrdersAdminService } from '../../services/order/ListOrdersAdminService.js';

class ListOrdersAdminController {
    async handle(req: Request, res: Response) {
        const status = req.query.status as OrderStatus | undefined;

        const listOrdersAdminService = new ListOrdersAdminService();
        const orders = await listOrdersAdminService.execute({ status });

        return res.json(orders);
    }
}

export { ListOrdersAdminController };

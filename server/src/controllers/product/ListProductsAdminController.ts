import { Request, Response } from 'express';
import { ListProductsAdminService } from '../../services/product/ListProductsAdminService.js';

class ListProductsAdminController {
    async handle(req: Request, res: Response) {
        const listProductsAdminService = new ListProductsAdminService();
        const products = await listProductsAdminService.execute();

        return res.json(products);
    }
}

export { ListProductsAdminController };

import { Request, Response } from 'express';
import { ListProductsService } from '../../services/product/ListProductsService.js';

class ListProductsController {
    async handle(req: Request, res: Response) {
        const categoryId = req.query.categoryId as string | undefined;

        const listProductsService = new ListProductsService();
        const products = await listProductsService.execute({ categoryId });

        return res.json(products);
    }
}

export { ListProductsController };

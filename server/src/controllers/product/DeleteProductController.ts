import { Request, Response } from 'express';
import { DeleteProductService } from '../../services/product/DeleteProductService.js';

class DeleteProductController {
    async handle(req: Request, res: Response) {
        const productId = req.query.productId as string;

        const deleteProductService = new DeleteProductService();
        const result = await deleteProductService.execute({ productId });

        return res.json(result);
    }
}

export { DeleteProductController };

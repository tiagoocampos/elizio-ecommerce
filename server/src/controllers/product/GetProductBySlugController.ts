import { Request, Response } from 'express';
import { GetProductBySlugService } from '../../services/product/GetProductBySlugService.js';

class GetProductBySlugController {
    async handle(req: Request, res: Response) {
        const { slug } = req.params as { slug: string };

        const getProductBySlugService = new GetProductBySlugService();
        const product = await getProductBySlugService.execute({ slug });

        return res.json(product);
    }
}

export { GetProductBySlugController };

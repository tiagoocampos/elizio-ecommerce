import { Request, Response } from 'express';
import { UpdateProductService } from '../../services/product/UpdateProductService.js';

class UpdateProductController {
    async handle(req: Request, res: Response) {
        const files = ((req.files as Express.Multer.File[] | undefined) ?? []).map((file) => ({
            buffer: file.buffer,
            name: file.originalname,
        }));

        const updateProductService = new UpdateProductService();
        const product = await updateProductService.execute({ ...req.body, files });

        return res.json(product);
    }
}

export { UpdateProductController };

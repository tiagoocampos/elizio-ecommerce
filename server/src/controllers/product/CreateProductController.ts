import { Request, Response } from 'express';
import { CreateProductService } from '../../services/product/CreateProductService.js';

class CreateProductController {
    async handle(req: Request, res: Response) {
        const files = ((req.files as Express.Multer.File[] | undefined) ?? []).map((file) => ({
            buffer: file.buffer,
            name: file.originalname,
        }));

        const createProductService = new CreateProductService();
        const product = await createProductService.execute({ ...req.body, files });

        return res.status(201).json(product);
    }
}

export { CreateProductController };

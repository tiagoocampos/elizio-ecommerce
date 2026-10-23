import { Request, Response } from 'express';
import { UpdateCategoryService } from '../../services/category/UpdateCategoryService.js';

class UpdateCategoryController {
    async handle(req: Request, res: Response) {
        const { id } = req.params as { id: string };
        const { name } = req.body;
        const updateCategoryService = new UpdateCategoryService();
        const category = await updateCategoryService.execute({ id, name });
        return res.json(category);
    }
}

export { UpdateCategoryController };

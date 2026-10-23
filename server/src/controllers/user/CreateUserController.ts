import { Request, Response } from 'express';
import { CreateUserService } from '../../services/user/CreateUserService.js';

class CreateUserController{
    async handle(req: Request, res: Response){
        const { name, email, password, phone } = req.body;
        const createUserService = new CreateUserService();
        const user = await createUserService.execute({ name, email, password, phone });
        return res.status(201).json(user);
    }
}

export { CreateUserController };

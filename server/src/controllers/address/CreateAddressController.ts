import { Request, Response } from 'express';
import { CreateAddressService } from '../../services/address/CreateAddressService.js';

class CreateAddressController {
    async handle(req: Request, res: Response) {
        const { zipCode, street, number, complement, district, city, state } = req.body;

        const createAddressService = new CreateAddressService();
        const address = await createAddressService.execute({
            userId: req.userId,
            zipCode,
            street,
            number,
            complement,
            district,
            city,
            state,
        });

        return res.status(201).json(address);
    }
}

export { CreateAddressController };

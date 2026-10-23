import { Request, Response } from 'express';
import { ListAddressService } from '../../services/address/ListAddressService.js';

class ListAddressController {
    async handle(req: Request, res: Response) {
        const listAddressService = new ListAddressService();
        const addresses = await listAddressService.execute({ userId: req.userId });

        return res.json(addresses);
    }
}

export { ListAddressController };

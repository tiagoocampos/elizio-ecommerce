import { Request, Response } from 'express';
import { DeleteAddressService } from '../../services/address/DeleteAddressService.js';

class DeleteAddressController {
    async handle(req: Request, res: Response) {
        const addressId = req.query.addressId as string;

        const deleteAddressService = new DeleteAddressService();
        const result = await deleteAddressService.execute({ id: addressId, userId: req.userId });

        return res.json(result);
    }
}

export { DeleteAddressController };

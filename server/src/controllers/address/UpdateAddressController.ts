import { Request, Response } from 'express';
import { UpdateAddressService } from '../../services/address/UpdateAddressService.js';

class UpdateAddressController {
    async handle(req: Request, res: Response) {
        const addressId = req.query.addressId as string;
        const { zipCode, street, number, complement, district, city, state } = req.body;

        const updateAddressService = new UpdateAddressService();
        const address = await updateAddressService.execute({
            id: addressId,
            userId: req.userId,
            zipCode,
            street,
            number,
            complement,
            district,
            city,
            state,
        });

        return res.json(address);
    }
}

export { UpdateAddressController };

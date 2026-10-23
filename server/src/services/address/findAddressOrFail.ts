import { AddressNotFoundError, AddressNotOwnedError } from "../../exceptions/AddressErrors.js";
import prismaClient from "../../prisma/index.js";

interface FindAddressOrFailProps {
    id: string;
    userId: string;
}

export async function findAddressOrFail({ id, userId }: FindAddressOrFailProps) {
    const address = await prismaClient.address.findUnique({ where: { id } });

    if (!address) {
        throw new AddressNotFoundError();
    }

    if (address.userId !== userId) {
        throw new AddressNotOwnedError();
    }

    return address;
}

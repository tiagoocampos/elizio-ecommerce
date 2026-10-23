import { UserNotFoundError } from "../../exceptions/UserErrors.js";
import prismaClient from "../../prisma/index.js";

class DetailUserService {
    async execute(userId: string) {
        const user = await prismaClient.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true,
            },
        });

        if (!user) {
            throw new UserNotFoundError();
        }

        return user;
    }
}

export { DetailUserService };

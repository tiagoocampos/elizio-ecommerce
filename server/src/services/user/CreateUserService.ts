import { hash } from "bcrypt";
import { UserAlreadyExistsError } from "../../exceptions/UserErrors.js";
import prisma from "../../prisma/index.js";


interface CreateUserServiceProps{
    name: string;
    email: string;
    password: string;
    phone?: string | null | undefined;
}

class CreateUserService{
    async execute({name, email, password, phone}: CreateUserServiceProps){

        const userAlreadyExists = await prisma.user.findUnique({
            where: {
                email,
            },
        });

        if(userAlreadyExists){
            throw new UserAlreadyExistsError();
        }

        const passwordHash = await hash(password, 10);
        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                phone: phone ?? null,
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true,
            },
        });

        return user;
    }
}

export { CreateUserService };

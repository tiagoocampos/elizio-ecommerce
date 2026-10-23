import { compare, hashSync } from "bcrypt";
import jwt from "jsonwebtoken";
import prismaClient from "../../prisma/index.js";
import { InvalidCredentialsError } from "../../exceptions/UserErrors.js";

// Hash descartável: mantém o tempo de resposta parecido quando o e-mail não existe.
const DUMMY_HASH = hashSync("dummy-password", 10);

interface AuthUserProps {
    email: string;
    password: string;
}

class AuthUserService {
    async execute({ email, password }: AuthUserProps) {
        const user = await prismaClient.user.findUnique({
            where: { email },
        });

        // Mesma resposta para e-mail inexistente e senha errada: não revela se o e-mail existe.
        const passwordMatch = await compare(password, user?.passwordHash ?? DUMMY_HASH);

        if (!user || !passwordMatch) {
            throw new InvalidCredentialsError();
        }

        const token = jwt.sign({}, process.env.JWT_SECRET as string, {
            subject: user.id,
            expiresIn: "7d",
        });

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token,
        };
    }
}

export { AuthUserService };

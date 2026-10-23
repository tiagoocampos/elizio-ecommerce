import { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedUserError } from "../exceptions/UserErrors.js";
import prismaClient from "../prisma/index.js";

export const isAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.userId;

    if (!userId) {
        throw new UnauthorizedUserError();
    }

    const user = await prismaClient.user.findUnique({
        where: { id: userId },
        select: { role: true }
    });

    if (user?.role !== "ADMIN") {
        throw new ForbiddenError();
    }

    return next();
}

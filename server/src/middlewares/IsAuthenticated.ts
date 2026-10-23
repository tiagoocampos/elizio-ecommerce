import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { InvalidToken } from "../exceptions/InvalidToken.js";

interface PayLoad {
    sub: string
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
    const authToken = req.headers.authorization;

    if (!authToken) {
        throw new InvalidToken();
    }

    const [, token] = authToken.split(" ");

    if (!token) {
        throw new InvalidToken();
    }

    try {
        const { sub } = jwt.verify(token, process.env.JWT_SECRET as string) as PayLoad;
        req.userId = sub;

        return next();
    } catch (error) {
        throw new InvalidToken();
    }
}

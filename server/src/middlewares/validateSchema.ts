import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";

export const validateSchema =
    (schema: ZodType) => async (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsed = (await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params
            })) as { body?: unknown };

            // req.query e req.params são somente leitura no Express 5; só o body é reescrito
            // (aplica coerce/transform e descarta campos desconhecidos).
            if (parsed.body !== undefined) {
                req.body = parsed.body;
            }

            return next();
        } catch (error) {
            return next(error);
        }
    }

import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client.js";

export const errorHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    if (error instanceof ZodError) {
        return res.status(400).json({
            error: "Erro de validação",
            details: error.issues.map((issue) => ({
                message: issue.message,
                path: issue.path[1],
            })),
        });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return res.status(409).json({
            error: "Já existe um registro com esse valor.",
        });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        return res.status(409).json({
            error: "Registro vinculado a outros dados.",
        });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return res.status(404).json({
            error: "Registro não encontrado.",
        });
    }

    const statusCode = (error as { statusCode?: unknown }).statusCode;
    if (typeof statusCode === "number") {
        return res.status(statusCode).json({
            error: error.message,
        });
    }

    if (error.name === "MulterError" || error.message?.startsWith("Invalid file type")) {
        const code = (error as { code?: string }).code;
        const message =
            code === "LIMIT_FILE_SIZE" ? "Cada imagem pode ter no máximo 5 MB."
            : code === "LIMIT_UNEXPECTED_FILE" || code === "LIMIT_FILE_COUNT" ? "Imagens demais ou em campo inesperado (máximo de 8 imagens)."
            : error.message?.startsWith("Invalid file type") ? "Formato de imagem inválido: use JPEG, PNG ou WEBP."
            : "Falha no envio da imagem.";
        return res.status(400).json({ error: message });
    }

    console.error(error);
    return res.status(500).json({
        error: "Erro interno do servidor",
    });
};

export class UnauthorizedUserError extends Error {
    public statusCode: number = 401
    constructor() {
        super("Usuário não autorizado");
        this.name = "UnauthorizedUserError";
        Object.setPrototypeOf(this, UnauthorizedUserError.prototype);
    }
}

export class ForbiddenError extends Error {
    public statusCode: number = 403
    constructor() {
        super("Acesso negado");
        this.name = "ForbiddenError";
        Object.setPrototypeOf(this, ForbiddenError.prototype);
    }
}

export class UserAlreadyExistsError extends Error {
    public statusCode: number = 409
    constructor() {
        super("Usuário já existe");
        this.name = "UserAlreadyExistsError";
        Object.setPrototypeOf(this, UserAlreadyExistsError.prototype);
    }
}

export class InvalidCredentialsError extends Error {
    public statusCode: number = 401
    constructor() {
        super("E-mail ou senha inválidos");
        this.name = "InvalidCredentialsError";
        Object.setPrototypeOf(this, InvalidCredentialsError.prototype);
    }
}

export class UserNotFoundError extends Error {
    public statusCode: number = 404
    constructor() {
        super("Usuário não encontrado");
        this.name = "UserNotFoundError";
        Object.setPrototypeOf(this, UserNotFoundError.prototype);
    }
}

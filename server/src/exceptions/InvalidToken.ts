export class InvalidToken extends Error {
    public statusCode: number = 401
    constructor() {
        super("Token inválido ou expirado");
        this.name = "InvalidToken";
        Object.setPrototypeOf(this, InvalidToken.prototype);
    }
}

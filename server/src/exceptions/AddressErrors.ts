export class InvalidZipCodeError extends Error {
    public statusCode: number = 400
    constructor() {
        super("Informe um CEP válido com 8 dígitos");
        this.name = "InvalidZipCodeError";
        Object.setPrototypeOf(this, InvalidZipCodeError.prototype);
    }
}

export class AddressNotFoundError extends Error {
    public statusCode: number = 404
    constructor() {
        super("Endereço não encontrado");
        this.name = "AddressNotFoundError";
        Object.setPrototypeOf(this, AddressNotFoundError.prototype);
    }
}

export class AddressNotOwnedError extends Error {
    public statusCode: number = 403
    constructor() {
        super("Este endereço não pertence ao usuário autenticado");
        this.name = "AddressNotOwnedError";
        Object.setPrototypeOf(this, AddressNotOwnedError.prototype);
    }
}

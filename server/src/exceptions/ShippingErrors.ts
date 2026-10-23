export class ShippingZoneNotFoundError extends Error {
    public statusCode: number = 404
    constructor() {
        super("Zona de entrega não encontrada");
        this.name = "ShippingZoneNotFoundError";
        Object.setPrototypeOf(this, ShippingZoneNotFoundError.prototype);
    }
}

export class InvalidZipRangeError extends Error {
    public statusCode: number = 400
    constructor() {
        super("O CEP inicial deve ser menor ou igual ao CEP final");
        this.name = "InvalidZipRangeError";
        Object.setPrototypeOf(this, InvalidZipRangeError.prototype);
    }
}

export class InvalidDeliveryDaysError extends Error {
    public statusCode: number = 400
    constructor() {
        super("O prazo mínimo deve ser menor ou igual ao prazo máximo");
        this.name = "InvalidDeliveryDaysError";
        Object.setPrototypeOf(this, InvalidDeliveryDaysError.prototype);
    }
}

export class LocalZoneUnavailableError extends Error {
    public statusCode: number = 400
    constructor() {
        super("CEP fora da área de entrega própria; escolha transportadora");
        this.name = "LocalZoneUnavailableError";
        Object.setPrototypeOf(this, LocalZoneUnavailableError.prototype);
    }
}

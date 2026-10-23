export class OrderNotFoundError extends Error {
    public statusCode: number = 404
    constructor() {
        super("Pedido não encontrado");
        this.name = "OrderNotFoundError";
        Object.setPrototypeOf(this, OrderNotFoundError.prototype);
    }
}

export class ItemUnavailableError extends Error {
    public statusCode: number = 400
    constructor() {
        super("Um ou mais itens do pedido não existem ou não estão mais disponíveis");
        this.name = "ItemUnavailableError";
        Object.setPrototypeOf(this, ItemUnavailableError.prototype);
    }
}

export class InsufficientStockError extends Error {
    public statusCode: number = 400
    constructor(itemName?: string) {
        super(itemName
            ? `Estoque insuficiente para "${itemName}"`
            : "O produto não possui estoque suficiente para a quantidade solicitada.");
        this.name = "InsufficientStockError";
        Object.setPrototypeOf(this, InsufficientStockError.prototype);
    }
}

export class InvalidStatusTransitionError extends Error {
    public statusCode: number = 400
    constructor() {
        super("Transição de status inválida");
        this.name = "InvalidStatusTransitionError";
        Object.setPrototypeOf(this, InvalidStatusTransitionError.prototype);
    }
}

export class ShippingQuoteNotAllowedError extends Error {
    public statusCode: number = 400
    constructor() {
        super("Este pedido não está aguardando cotação de frete");
        this.name = "ShippingQuoteNotAllowedError";
        Object.setPrototypeOf(this, ShippingQuoteNotAllowedError.prototype);
    }
}

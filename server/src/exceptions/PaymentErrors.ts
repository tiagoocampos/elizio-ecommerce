export class PaymentCreationError extends Error {
    public statusCode: number = 500
    constructor() {
        super("Erro ao criar o pagamento");
        this.name = "PaymentCreationError";
        Object.setPrototypeOf(this, PaymentCreationError.prototype);
    }
}

export class OrderAwaitingQuoteError extends Error {
    public statusCode: number = 400
    constructor() {
        super("Aguardando a cotação do frete pelo vendedor");
        this.name = "OrderAwaitingQuoteError";
        Object.setPrototypeOf(this, OrderAwaitingQuoteError.prototype);
    }
}

export class OrderNotPayableError extends Error {
    public statusCode: number = 400
    constructor() {
        super("Este pedido não está disponível para pagamento");
        this.name = "OrderNotPayableError";
        Object.setPrototypeOf(this, OrderNotPayableError.prototype);
    }
}

export class ProductNotFoundError extends Error {
    public statusCode: number = 404
    constructor() {
        super("Produto não encontrado");
        this.name = "ProductNotFoundError";
        Object.setPrototypeOf(this, ProductNotFoundError.prototype);
    }
}

export class ImageRequiredError extends Error {
    public statusCode: number = 400
    constructor() {
        super("É obrigatório enviar pelo menos uma imagem");
        this.name = "ImageRequiredError";
        Object.setPrototypeOf(this, ImageRequiredError.prototype);
    }
}

export class TooManyImagesError extends Error {
    public statusCode: number = 400
    constructor() {
        super("Máximo de 8 imagens por produto.");
        this.name = "TooManyImagesError";
        Object.setPrototypeOf(this, TooManyImagesError.prototype);
    }
}

export class ImageUploadError extends Error {
    public statusCode: number = 502
    constructor() {
        super("Erro ao fazer upload da imagem");
        this.name = "ImageUploadError";
        Object.setPrototypeOf(this, ImageUploadError.prototype);
    }
}

export class InvalidKeepImagesError extends Error {
    public statusCode: number = 400
    constructor() {
        super("keepImages contém imagem que não pertence ao produto");
        this.name = "InvalidKeepImagesError";
        Object.setPrototypeOf(this, InvalidKeepImagesError.prototype);
    }
}

export class VariantNotFoundError extends Error {
    public statusCode: number = 400
    constructor() {
        super("Variação informada não pertence ao produto");
        this.name = "VariantNotFoundError";
        Object.setPrototypeOf(this, VariantNotFoundError.prototype);
    }
}

export class VariantAlreadySoldError extends Error {
    public statusCode: number = 409
    constructor() {
        super("Variação já vendida; não pode ser removida.");
        this.name = "VariantAlreadySoldError";
        Object.setPrototypeOf(this, VariantAlreadySoldError.prototype);
    }
}

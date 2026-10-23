export class CategoryNotFoundError extends Error {
    public statusCode: number = 404
    constructor() {
        super("Categoria não encontrada");
        this.name = "CategoryNotFoundError";
        Object.setPrototypeOf(this, CategoryNotFoundError.prototype);
    }
}

export class CategoryAlreadyExistsError extends Error {
    public statusCode: number = 409
    constructor() {
        super("Categoria já cadastrada");
        this.name = "CategoryAlreadyExistsError";
        Object.setPrototypeOf(this, CategoryAlreadyExistsError.prototype);
    }
}

export class CategoryHasProductsError extends Error {
    public statusCode: number = 409
    constructor() {
        super("Não é possível excluir uma categoria que possui produtos");
        this.name = "CategoryHasProductsError";
        Object.setPrototypeOf(this, CategoryHasProductsError.prototype);
    }
}

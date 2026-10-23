import { Router } from "express";
import multer from "multer";
import uploadConfig from "./config/multer.js";
import { validateSchema } from "./middlewares/validateSchema.js";
import { isAuthenticated } from "./middlewares/IsAuthenticated.js";
import { isAdmin } from "./middlewares/IsAdmin.js";

import { createUserSchema, authUserSchema } from "./schemas/userSchema.js";
import { CreateUserController } from "./controllers/user/CreateUserController.js";
import { AuthUserController } from "./controllers/user/AuthUserController.js";
import { DetailUserController } from "./controllers/user/DetailUserController.js";

import { createCategorySchema, updateCategorySchema } from "./schemas/categorySchema.js";
import { ListCategoriesController } from "./controllers/category/ListCategoriesController.js";
import { CreateCategoryController } from "./controllers/category/CreateCategoryController.js";
import { UpdateCategoryController } from "./controllers/category/UpdateCategoryController.js";
import { DeleteCategoryController } from "./controllers/category/DeleteCategoryController.js";

import { createProductSchema, updateProductSchema, listProductsSchema, productSlugSchema, deleteProductSchema } from "./schemas/productSchema.js";
import { CreateProductController } from "./controllers/product/CreateProductController.js";
import { UpdateProductController } from "./controllers/product/UpdateProductController.js";
import { DeleteProductController } from "./controllers/product/DeleteProductController.js";
import { ListProductsController } from "./controllers/product/ListProductsController.js";
import { ListProductsAdminController } from "./controllers/product/ListProductsAdminController.js";
import { GetProductBySlugController } from "./controllers/product/GetProductBySlugController.js";

import { createAddressSchema, updateAddressSchema, deleteAddressSchema } from "./schemas/addressSchema.js";
import { CreateAddressController } from "./controllers/address/CreateAddressController.js";
import { ListAddressController } from "./controllers/address/ListAddressController.js";
import { UpdateAddressController } from "./controllers/address/UpdateAddressController.js";
import { DeleteAddressController } from "./controllers/address/DeleteAddressController.js";

import { shippingQuoteSchema, createShippingZoneSchema, updateShippingZoneSchema, deleteShippingZoneSchema } from "./schemas/shippingSchema.js";
import { ShippingQuoteController } from "./controllers/shipping/ShippingQuoteController.js";
import { ListShippingZonesController } from "./controllers/shipping/ListShippingZonesController.js";
import { CreateShippingZoneController } from "./controllers/shipping/CreateShippingZoneController.js";
import { UpdateShippingZoneController } from "./controllers/shipping/UpdateShippingZoneController.js";
import { DeleteShippingZoneController } from "./controllers/shipping/DeleteShippingZoneController.js";

import { createOrderSchema, orderIdParamsSchema, listOrdersAdminSchema, updateOrderStatusSchema, updateShippingQuoteSchema } from "./schemas/orderSchema.js";
import { CreateOrderController } from "./controllers/order/CreateOrderController.js";
import { ListOrdersController } from "./controllers/order/ListOrdersController.js";
import { GetOrderController } from "./controllers/order/GetOrderController.js";
import { ListOrdersAdminController } from "./controllers/order/ListOrdersAdminController.js";
import { GetOrderAdminController } from "./controllers/order/GetOrderAdminController.js";
import { UpdateShippingQuoteController } from "./controllers/order/UpdateShippingQuoteController.js";
import { UpdateOrderStatusController } from "./controllers/order/UpdateOrderStatusController.js";

import { createPreferenceSchema } from "./schemas/paymentSchema.js";
import { CreatePreferenceController } from "./controllers/payment/CreatePreferenceController.js";
import { WebhookController } from "./controllers/payment/WebhookController.js";

const router = Router();
const upload = multer(uploadConfig);

router.get("/health", (req, res) => {
    return res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Auth / usuário
router.post("/users", validateSchema(createUserSchema), new CreateUserController().handle);
router.post("/session", validateSchema(authUserSchema), new AuthUserController().handle);
router.get("/me", isAuthenticated, new DetailUserController().handle);

// Categorias
router.get("/category", new ListCategoriesController().handle);
router.post("/category", isAuthenticated, isAdmin, validateSchema(createCategorySchema), new CreateCategoryController().handle);
router.put("/category/:id", isAuthenticated, isAdmin, validateSchema(updateCategorySchema), new UpdateCategoryController().handle);
router.delete("/category/:id", isAuthenticated, isAdmin, new DeleteCategoryController().handle);

// Produtos
router.get("/products", validateSchema(listProductsSchema), new ListProductsController().handle);
router.get("/product/:slug", validateSchema(productSlugSchema), new GetProductBySlugController().handle);
router.get("/admin/products", isAuthenticated, isAdmin, new ListProductsAdminController().handle);
router.post("/product", isAuthenticated, isAdmin, upload.array("images", 8), validateSchema(createProductSchema), new CreateProductController().handle);
router.put("/product", isAuthenticated, isAdmin, upload.array("images", 8), validateSchema(updateProductSchema), new UpdateProductController().handle);
router.delete("/product", isAuthenticated, isAdmin, validateSchema(deleteProductSchema), new DeleteProductController().handle);

// Endereços
router.post("/address", isAuthenticated, validateSchema(createAddressSchema), new CreateAddressController().handle);
router.get("/address", isAuthenticated, new ListAddressController().handle);
router.put("/address", isAuthenticated, validateSchema(updateAddressSchema), new UpdateAddressController().handle);
router.delete("/address", isAuthenticated, validateSchema(deleteAddressSchema), new DeleteAddressController().handle);

// Frete
router.post("/shipping/quote", validateSchema(shippingQuoteSchema), new ShippingQuoteController().handle);
router.get("/admin/shipping-zones", isAuthenticated, isAdmin, new ListShippingZonesController().handle);
router.post("/admin/shipping-zones", isAuthenticated, isAdmin, validateSchema(createShippingZoneSchema), new CreateShippingZoneController().handle);
router.put("/admin/shipping-zones/:id", isAuthenticated, isAdmin, validateSchema(updateShippingZoneSchema), new UpdateShippingZoneController().handle);
router.delete("/admin/shipping-zones/:id", isAuthenticated, isAdmin, validateSchema(deleteShippingZoneSchema), new DeleteShippingZoneController().handle);

// Pedidos
router.post("/order", isAuthenticated, validateSchema(createOrderSchema), new CreateOrderController().handle);
router.get("/orders", isAuthenticated, new ListOrdersController().handle);
router.get("/order/:orderId", isAuthenticated, validateSchema(orderIdParamsSchema), new GetOrderController().handle);
router.get("/admin/orders", isAuthenticated, isAdmin, validateSchema(listOrdersAdminSchema), new ListOrdersAdminController().handle);
router.get("/admin/orders/:orderId", isAuthenticated, isAdmin, validateSchema(orderIdParamsSchema), new GetOrderAdminController().handle);
router.patch("/admin/orders/:orderId/shipping-quote", isAuthenticated, isAdmin, validateSchema(updateShippingQuoteSchema), new UpdateShippingQuoteController().handle);
router.patch("/order/:orderId/status", isAuthenticated, isAdmin, validateSchema(updateOrderStatusSchema), new UpdateOrderStatusController().handle);

// Pagamento (Mercado Pago)
router.post("/payment/preference", isAuthenticated, validateSchema(createPreferenceSchema), new CreatePreferenceController().handle);
router.post("/payment/webhook", new WebhookController().handle);

export { router }

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const https_1 = require("firebase-functions/v2/https");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// Import configurations
require("./config/firebaseAdmin");
// Import controllers
const orderController_1 = require("./controllers/orderController");
const inventoryController_1 = require("./controllers/inventoryController");
const productController_1 = require("./controllers/productController");
const categoryController_1 = require("./controllers/categoryController");
const dashboardController_1 = require("./controllers/dashboardController");
const paymentController_1 = require("./controllers/paymentController");
// Import middlewares
const authMiddleware_1 = require("./middlewares/authMiddleware");
const errorMiddleware_1 = require("./middlewares/errorMiddleware");
const app = (0, express_1.default)();
// Global middlewares
app.use((0, cors_1.default)({ origin: true }));
// Use urlencoded for PayHere
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
// ─── PUBLIC ENDPOINTS ─────────────────────────────────────────────────────────
// Products (public read)
app.get('/api/v1/products/featured', productController_1.ProductController.featured);
app.get('/api/v1/products', productController_1.ProductController.list);
app.get('/api/v1/products/:id', productController_1.ProductController.getById);
// Categories (public read)
app.get('/api/v1/categories', categoryController_1.CategoryController.list);
// Orders (public checkout)
app.post('/api/v1/orders', orderController_1.OrderController.create);
// Payments (webhooks)
app.post('/api/v1/payments/payhere-notify', paymentController_1.PaymentController.payhereNotify);
// ─── ADMIN ENDPOINTS ──────────────────────────────────────────────────────────
// All admin routes require valid Firebase Auth token
app.use('/api/v1/admin', authMiddleware_1.authenticateToken);
// Dashboard
app.get('/api/v1/admin/dashboard/stats', dashboardController_1.DashboardController.getStats);
app.get('/api/v1/admin/dashboard/revenue-chart', dashboardController_1.DashboardController.getRevenueChart);
// Orders management
app.get('/api/v1/admin/orders', (0, authMiddleware_1.requirePermission)('orders.read'), orderController_1.OrderController.list);
app.patch('/api/v1/admin/orders/:id/status', (0, authMiddleware_1.requirePermission)('orders.update'), orderController_1.OrderController.updateStatus);
// Product management
app.post('/api/v1/admin/products', (0, authMiddleware_1.requirePermission)('products.write'), productController_1.ProductController.create);
app.patch('/api/v1/admin/products/:id', (0, authMiddleware_1.requirePermission)('products.write'), productController_1.ProductController.update);
app.delete('/api/v1/admin/products/:id', (0, authMiddleware_1.requirePermission)('products.delete'), productController_1.ProductController.remove);
// Category management
app.post('/api/v1/admin/categories', (0, authMiddleware_1.requirePermission)('products.write'), categoryController_1.CategoryController.create);
app.patch('/api/v1/admin/categories/:id', (0, authMiddleware_1.requirePermission)('products.write'), categoryController_1.CategoryController.update);
app.delete('/api/v1/admin/categories/:id', (0, authMiddleware_1.requirePermission)('products.delete'), categoryController_1.CategoryController.remove);
// Inventory management
app.put('/api/v1/admin/inventory/:sku', (0, authMiddleware_1.requirePermission)('inventory.update'), inventoryController_1.InventoryController.updateStock);
app.get('/api/v1/admin/inventory', (0, authMiddleware_1.requirePermission)('inventory.read'), inventoryController_1.InventoryController.list);
// Fallback error-handling middleware (must be last)
app.use(errorMiddleware_1.errorHandler);
// Export REST API Cloud Function
exports.api = (0, https_1.onRequest)({
    cors: true,
    maxInstances: 10,
    minInstances: 0,
    secrets: ['RESEND_API_KEY']
}, app);
//# sourceMappingURL=index.js.map
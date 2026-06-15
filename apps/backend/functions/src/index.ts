import { onRequest } from 'firebase-functions/v2/https';
import express from 'express';
import cors from 'cors';

// Import configurations
import './config/firebaseAdmin';

// Import controllers
import { OrderController } from './controllers/orderController';
import { InventoryController } from './controllers/inventoryController';
import { ProductController } from './controllers/productController';
import { CategoryController } from './controllers/categoryController';
import { DashboardController } from './controllers/dashboardController';
import { PaymentController } from './controllers/paymentController';

// Import middlewares
import { authenticateToken, requirePermission } from './middlewares/authMiddleware';
import { errorHandler } from './middlewares/errorMiddleware';

const app = express();

// Global middlewares
app.use(cors({ origin: true }));
// Use urlencoded for PayHere
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ─── PUBLIC ENDPOINTS ─────────────────────────────────────────────────────────

// Products (public read)
app.get('/api/v1/products/featured', ProductController.featured);
app.get('/api/v1/products', ProductController.list);
app.get('/api/v1/products/:id', ProductController.getById);

// Categories (public read)
app.get('/api/v1/categories', CategoryController.list);

// Orders (public checkout)
app.post('/api/v1/orders', OrderController.create);

// Payments (webhooks)
app.post('/api/v1/payments/payhere-notify', PaymentController.payhereNotify);

// ─── ADMIN ENDPOINTS ──────────────────────────────────────────────────────────

// All admin routes require valid Firebase Auth token
app.use('/api/v1/admin', authenticateToken);

// Dashboard
app.get('/api/v1/admin/dashboard/stats', DashboardController.getStats);
app.get('/api/v1/admin/dashboard/revenue-chart', DashboardController.getRevenueChart);

// Orders management
app.get(
  '/api/v1/admin/orders',
  requirePermission('orders.read'),
  OrderController.list
);
app.patch(
  '/api/v1/admin/orders/:id/status',
  requirePermission('orders.update'),
  OrderController.updateStatus
);

// Product management
app.post(
  '/api/v1/admin/products',
  requirePermission('products.write'),
  ProductController.create
);
app.patch(
  '/api/v1/admin/products/:id',
  requirePermission('products.write'),
  ProductController.update
);
app.delete(
  '/api/v1/admin/products/:id',
  requirePermission('products.delete'),
  ProductController.remove
);

// Category management
app.post(
  '/api/v1/admin/categories',
  requirePermission('products.write'),
  CategoryController.create
);
app.patch(
  '/api/v1/admin/categories/:id',
  requirePermission('products.write'),
  CategoryController.update
);
app.delete(
  '/api/v1/admin/categories/:id',
  requirePermission('products.delete'),
  CategoryController.remove
);

// Inventory management
app.put(
  '/api/v1/admin/inventory/:sku',
  requirePermission('inventory.update'),
  InventoryController.updateStock
);
app.get(
  '/api/v1/admin/inventory',
  requirePermission('inventory.read'),
  InventoryController.list
);

// Fallback error-handling middleware (must be last)
app.use(errorHandler);

// Export REST API Cloud Function
export const api = onRequest(
  {
    cors: true,
    maxInstances: 10,
    minInstances: 0,
    secrets: ['RESEND_API_KEY']
  },
  app
);

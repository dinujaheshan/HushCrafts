"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = exports.PAYHERE_MERCHANT_SECRET = exports.PAYHERE_MERCHANT_ID = void 0;
const orderService_1 = require("../services/orderService");
const shared_utils_1 = require("@hush-craft/shared-utils");
const firebaseAdmin_1 = require("../config/firebaseAdmin");
const zod_1 = require("zod");
const crypto = __importStar(require("crypto"));
exports.PAYHERE_MERCHANT_ID = '1224797';
exports.PAYHERE_MERCHANT_SECRET = 'MzQ4NDU0NTAyNjI2NTQwNDA0Mjc5MDU1NzEzNjM0ODk4NDc2MzA=';
const OrderListQuerySchema = zod_1.z.object({
    status: zod_1.z.enum(['pending', 'confirmed', 'processing', 'packed', 'dispatched', 'delivered', 'completed', 'cancelled', 'returned', 'refunded']).optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).optional().default(20),
    page: zod_1.z.coerce.number().int().min(1).optional().default(1)
});
class OrderController {
    /**
     * GET /api/v1/admin/orders — paginated order list for admin
     */
    static async list(req, res, next) {
        try {
            const { status, limit } = OrderListQuerySchema.parse(req.query);
            let query = firebaseAdmin_1.db.collection('orders')
                .where('isDeleted', '==', false)
                .orderBy('createdAt', 'desc')
                .limit(limit + 1);
            if (status) {
                query = firebaseAdmin_1.db.collection('orders')
                    .where('isDeleted', '==', false)
                    .where('orderStatus', '==', status)
                    .orderBy('createdAt', 'desc')
                    .limit(limit + 1);
            }
            const snapshot = await query.get();
            const docs = snapshot.docs;
            const hasMore = docs.length > limit;
            const orders = docs.slice(0, limit).map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            return res.status(200).json({ success: true, data: { orders, hasMore, count: orders.length } });
        }
        catch (err) {
            return next(err);
        }
    }
    /**
     * POST /api/v1/orders — Handle checkout creation request
     */
    static async create(req, res, next) {
        try {
            const validatedPayload = shared_utils_1.CheckoutRequestSchema.parse(req.body);
            const order = await orderService_1.OrderService.createOrder(validatedPayload);
            const amountFormatted = order.total.toFixed(2);
            const currency = 'LKR';
            const merchantSecretHash = crypto.createHash('md5').update(exports.PAYHERE_MERCHANT_SECRET).digest('hex').toUpperCase();
            const hashStr = exports.PAYHERE_MERCHANT_ID + order.orderId + amountFormatted + currency + merchantSecretHash;
            const hash = crypto.createHash('md5').update(hashStr).digest('hex').toUpperCase();
            const itemsTitle = order.items.map((i) => i.name).join(', ');
            return res.status(201).json({
                success: true,
                data: {
                    merchantId: exports.PAYHERE_MERCHANT_ID,
                    returnUrl: 'http://localhost:3000/order-confirmation/' + order.orderId,
                    cancelUrl: 'http://localhost:3000/checkout',
                    notifyUrl: 'https://hushcrafts.firebaseapp.com/api/v1/payments/payhere-notify',
                    orderId: order.orderId,
                    orderTitle: itemsTitle,
                    amount: amountFormatted,
                    firstName: order.customerDetails.fullName.split(' ')[0] || 'Customer',
                    lastName: order.customerDetails.fullName.split(' ').slice(1).join(' ') || '.',
                    email: order.customerDetails.email || 'customer@hushcraft.lk',
                    phone: order.customerDetails.mobileNumber,
                    address: order.shippingAddress.addressLine1,
                    city: order.shippingAddress.city,
                    hash: hash,
                    status: 'pending',
                    createdAt: new Date().toISOString()
                }
            });
        }
        catch (err) {
            return next(err);
        }
    }
    /**
     * PATCH /api/v1/admin/orders/:id/status — Update order status
     */
    static async updateStatus(req, res, next) {
        try {
            const orderId = req.params.id;
            const validatedPayload = shared_utils_1.OrderStatusUpdateSchema.parse(req.body);
            const updatedBy = req.user?.uid || 'admin_user';
            await orderService_1.OrderService.updateOrderStatus(orderId, validatedPayload.status, validatedPayload.trackingNumber || null, validatedPayload.carrier || null, validatedPayload.note || null, updatedBy);
            return res.status(200).json({
                success: true,
                data: {
                    orderId,
                    status: validatedPayload.status,
                    updatedAt: new Date().toISOString()
                }
            });
        }
        catch (err) {
            return next(err);
        }
    }
}
exports.OrderController = OrderController;
//# sourceMappingURL=orderController.js.map
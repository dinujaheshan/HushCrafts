import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/orderService';
import { CheckoutRequestSchema, OrderStatusUpdateSchema } from '@hush-craft/shared-utils';
import { db } from '../config/firebaseAdmin';
import { z } from 'zod';
import * as crypto from 'crypto';

export const PAYHERE_MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID || '';
export const PAYHERE_MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET || '';

const OrderListQuerySchema = z.object({
  status: z.enum(['pending','confirmed','processing','packed','dispatched','delivered','completed','cancelled','returned','refunded']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  page: z.coerce.number().int().min(1).optional().default(1)
});

export class OrderController {
  /**
   * GET /api/v1/admin/orders — paginated order list for admin
   */
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, limit } = OrderListQuerySchema.parse(req.query);

      let query: FirebaseFirestore.Query = db.collection('orders')
        .where('isDeleted', '==', false)
        .orderBy('createdAt', 'desc')
        .limit(limit + 1);

      if (status) {
        query = db.collection('orders')
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
    } catch (err) {
      return next(err);
    }
  }

  /**
   * POST /api/v1/orders — Handle checkout creation request
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedPayload = CheckoutRequestSchema.parse(req.body);
      const order = await OrderService.createOrder(validatedPayload);

      const amountFormatted = order.total.toFixed(2);
      const currency = 'LKR';
      const merchantSecretHash = crypto.createHash('md5').update(PAYHERE_MERCHANT_SECRET).digest('hex').toUpperCase();
      const hashStr = PAYHERE_MERCHANT_ID + order.orderId + amountFormatted + currency + merchantSecretHash;
      const hash = crypto.createHash('md5').update(hashStr).digest('hex').toUpperCase();

      const itemsTitle = order.items.map((i: any) => i.name).join(', ');

      return res.status(201).json({
        success: true,
        data: {
          merchantId: PAYHERE_MERCHANT_ID,
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
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PATCH /api/v1/admin/orders/:id/status — Update order status
   */
  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = req.params.id;
      const validatedPayload = OrderStatusUpdateSchema.parse(req.body);
      const updatedBy = req.user?.uid || 'admin_user';

      await OrderService.updateOrderStatus(
        orderId,
        validatedPayload.status,
        validatedPayload.trackingNumber || null,
        validatedPayload.carrier || null,
        validatedPayload.note || null,
        updatedBy
      );

      return res.status(200).json({
        success: true,
        data: {
          orderId,
          status: validatedPayload.status,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (err) {
      return next(err);
    }
  }
}

import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebaseAdmin';
import { z } from 'zod';

const InventoryUpdateBodySchema = z.object({
  quantity: z.number().int().nonnegative('Quantity cannot be negative'),
  lowStockThreshold: z.number().int().nonnegative('Threshold cannot be negative')
});

const InventoryListQuerySchema = z.object({
  status: z.enum(['in_stock', 'low_stock', 'out_of_stock']).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50)
});

export class InventoryController {
  /**
   * GET /api/v1/admin/inventory — list inventory with optional status filter
   */
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, limit } = InventoryListQuerySchema.parse(req.query);

      let query: FirebaseFirestore.Query = db.collection('inventory')
        .orderBy('updatedAt', 'desc')
        .limit(limit);

      if (status) {
        query = db.collection('inventory')
          .where('status', '==', status)
          .orderBy('updatedAt', 'desc')
          .limit(limit);
      }

      const snapshot = await query.get();
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      return res.status(200).json({ success: true, data: { inventory: items, count: items.length } });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PUT /api/v1/admin/inventory/:sku — update stock count and status
   */
  static async updateStock(req: Request, res: Response, next: NextFunction) {
    try {
      const sku = req.params.sku;
      const { quantity, lowStockThreshold } = InventoryUpdateBodySchema.parse(req.body);

      const inventoryRef = db.collection('inventory').doc(sku);

      const status = quantity === 0
        ? 'out_of_stock'
        : quantity <= lowStockThreshold
          ? 'low_stock'
          : 'in_stock';

      await inventoryRef.update({
        quantity,
        lowStockThreshold,
        status,
        updatedAt: new Date()
      });

      return res.status(200).json({
        success: true,
        data: { sku, quantity, status }
      });
    } catch (err) {
      return next(err);
    }
  }
}

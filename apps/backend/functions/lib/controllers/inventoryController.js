"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryController = void 0;
const firebaseAdmin_1 = require("../config/firebaseAdmin");
const zod_1 = require("zod");
const InventoryUpdateBodySchema = zod_1.z.object({
    quantity: zod_1.z.number().int().nonnegative('Quantity cannot be negative'),
    lowStockThreshold: zod_1.z.number().int().nonnegative('Threshold cannot be negative')
});
const InventoryListQuerySchema = zod_1.z.object({
    status: zod_1.z.enum(['in_stock', 'low_stock', 'out_of_stock']).optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(200).optional().default(50)
});
class InventoryController {
    /**
     * GET /api/v1/admin/inventory — list inventory with optional status filter
     */
    static async list(req, res, next) {
        try {
            const { status, limit } = InventoryListQuerySchema.parse(req.query);
            let query = firebaseAdmin_1.db.collection('inventory')
                .orderBy('updatedAt', 'desc')
                .limit(limit);
            if (status) {
                query = firebaseAdmin_1.db.collection('inventory')
                    .where('status', '==', status)
                    .orderBy('updatedAt', 'desc')
                    .limit(limit);
            }
            const snapshot = await query.get();
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return res.status(200).json({ success: true, data: { inventory: items, count: items.length } });
        }
        catch (err) {
            return next(err);
        }
    }
    /**
     * PUT /api/v1/admin/inventory/:sku — update stock count and status
     */
    static async updateStock(req, res, next) {
        try {
            const sku = req.params.sku;
            const { quantity, lowStockThreshold } = InventoryUpdateBodySchema.parse(req.body);
            const inventoryRef = firebaseAdmin_1.db.collection('inventory').doc(sku);
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
        }
        catch (err) {
            return next(err);
        }
    }
}
exports.InventoryController = InventoryController;
//# sourceMappingURL=inventoryController.js.map
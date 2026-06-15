"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const firebaseAdmin_1 = require("../config/firebaseAdmin");
const shared_utils_1 = require("@hush-craft/shared-utils");
const zod_1 = require("zod");
const notificationService_1 = require("../services/notificationService");
const ProductQuerySchema = zod_1.z.object({
    categoryId: zod_1.z.string().optional(),
    status: zod_1.z.enum(['published', 'draft', 'archived']).optional().default('published'),
    sort: zod_1.z.enum(['createdAt', 'basePrice', 'name']).optional().default('createdAt'),
    order: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
    limit: zod_1.z.coerce.number().int().min(1).max(100).optional().default(20),
    page: zod_1.z.coerce.number().int().min(1).optional().default(1)
});
class ProductController {
    /**
     * GET /api/v1/products — list products with filters and pagination
     */
    static async list(req, res, next) {
        try {
            const query = ProductQuerySchema.parse(req.query);
            let dbQuery = firebaseAdmin_1.db.collection('products')
                .where('isDeleted', '==', false)
                .where('status', '==', query.status)
                .orderBy(query.sort, query.order)
                .limit(query.limit + 1); // fetch one extra to determine hasMore
            if (query.categoryId) {
                dbQuery = dbQuery.where('categoryIds', 'array-contains', query.categoryId);
            }
            const snapshot = await dbQuery.get();
            const docs = snapshot.docs;
            const hasMore = docs.length > query.limit;
            const items = docs.slice(0, query.limit).map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            return res.status(200).json({
                success: true,
                data: {
                    products: items,
                    hasMore,
                    page: query.page,
                    limit: query.limit,
                    count: items.length
                }
            });
        }
        catch (err) {
            return next(err);
        }
    }
    /**
     * GET /api/v1/products/:id — fetch a single product with its variants
     */
    static async getById(req, res, next) {
        try {
            const productRef = firebaseAdmin_1.db.collection('products').doc(req.params.id);
            const [productSnap, variantsSnap] = await Promise.all([
                productRef.get(),
                productRef.collection('variants').orderBy('attributes.size').get()
            ]);
            if (!productSnap.exists || productSnap.data()?.isDeleted) {
                return res.status(404).json({
                    success: false,
                    error: { code: 'NOT_FOUND', message: `Product not found: ${req.params.id}` }
                });
            }
            const variants = variantsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return res.status(200).json({
                success: true,
                data: {
                    id: productSnap.id,
                    ...productSnap.data(),
                    variants
                }
            });
        }
        catch (err) {
            return next(err);
        }
    }
    /**
     * GET /api/v1/products/featured — returns best sellers and new arrivals
     */
    static async featured(req, res, next) {
        try {
            const [bestSellers, newArrivals] = await Promise.all([
                firebaseAdmin_1.db.collection('products')
                    .where('isDeleted', '==', false)
                    .where('status', '==', 'published')
                    .where('isBestSeller', '==', true)
                    .orderBy('createdAt', 'desc')
                    .limit(8)
                    .get(),
                firebaseAdmin_1.db.collection('products')
                    .where('isDeleted', '==', false)
                    .where('status', '==', 'published')
                    .orderBy('createdAt', 'desc')
                    .limit(8)
                    .get()
            ]);
            return res.status(200).json({
                success: true,
                data: {
                    bestSellers: bestSellers.docs.map(d => ({ id: d.id, ...d.data() })),
                    newArrivals: newArrivals.docs.map(d => ({ id: d.id, ...d.data() }))
                }
            });
        }
        catch (err) {
            return next(err);
        }
    }
    /**
     * POST /api/v1/products — create a new product (admin only)
     */
    static async create(req, res, next) {
        try {
            const validated = shared_utils_1.ProductSchema.parse(req.body);
            const now = new Date();
            const productRef = firebaseAdmin_1.db.collection('products').doc();
            await productRef.set({
                ...validated,
                id: productRef.id,
                isBestSeller: false,
                isFeatured: false,
                variants: [],
                totalSold: 0,
                reviewCount: 0,
                averageRating: 0,
                isDeleted: false,
                deletedAt: null,
                createdAt: now,
                updatedAt: now,
                createdBy: req.user?.uid || 'admin'
            });
            // Send launch email alert if product is published immediately
            if (validated.status === 'published') {
                notificationService_1.NotificationService.sendNewProductAlert({
                    id: productRef.id,
                    name: validated.name,
                    description: validated.summary || validated.description || '',
                    price: validated.basePrice,
                    image: validated.images?.[0] || ''
                }).catch(err => console.error('Failed to send product launch email alert:', err));
            }
            return res.status(201).json({
                success: true,
                data: { id: productRef.id }
            });
        }
        catch (err) {
            return next(err);
        }
    }
    /**
     * PATCH /api/v1/products/:id — update product fields (admin only)
     */
    static async update(req, res, next) {
        try {
            const productRef = firebaseAdmin_1.db.collection('products').doc(req.params.id);
            const snap = await productRef.get();
            if (!snap.exists || snap.data()?.isDeleted) {
                return res.status(404).json({
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Product not found' }
                });
            }
            const updateData = { ...req.body, updatedAt: new Date(), updatedBy: req.user?.uid };
            delete updateData.id;
            delete updateData.createdAt;
            await productRef.update(updateData);
            return res.status(200).json({
                success: true,
                data: { id: req.params.id, updated: true }
            });
        }
        catch (err) {
            return next(err);
        }
    }
    /**
     * DELETE /api/v1/products/:id — soft delete (admin only)
     */
    static async remove(req, res, next) {
        try {
            const productRef = firebaseAdmin_1.db.collection('products').doc(req.params.id);
            await productRef.update({
                isDeleted: true,
                status: 'archived',
                deletedAt: new Date(),
                updatedAt: new Date()
            });
            return res.status(200).json({
                success: true,
                data: { id: req.params.id, deleted: true }
            });
        }
        catch (err) {
            return next(err);
        }
    }
}
exports.ProductController = ProductController;
//# sourceMappingURL=productController.js.map
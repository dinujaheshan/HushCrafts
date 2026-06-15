"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const firebaseAdmin_1 = require("../config/firebaseAdmin");
const zod_1 = require("zod");
const CategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    slug: zod_1.z.string().min(2).regex(/^[a-z0-9-]+$/),
    description: zod_1.z.string().optional(),
    image: zod_1.z.string().url().optional(),
    sortOrder: zod_1.z.number().int().nonnegative().optional().default(0)
});
class CategoryController {
    /**
     * GET /api/v1/categories — all active categories
     */
    static async list(req, res, next) {
        try {
            const snapshot = await firebaseAdmin_1.db.collection('categories')
                .where('isActive', '==', true)
                .orderBy('sortOrder', 'asc')
                .get();
            const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return res.status(200).json({ success: true, data: { categories } });
        }
        catch (err) {
            return next(err);
        }
    }
    /**
     * POST /api/v1/categories — create category (admin)
     */
    static async create(req, res, next) {
        try {
            const validated = CategorySchema.parse(req.body);
            const now = new Date();
            const ref = firebaseAdmin_1.db.collection('categories').doc(validated.slug);
            const existing = await ref.get();
            if (existing.exists) {
                return res.status(409).json({
                    success: false,
                    error: { code: 'CONFLICT', message: `Category slug '${validated.slug}' already exists` }
                });
            }
            await ref.set({
                ...validated,
                isActive: true,
                productCount: 0,
                createdAt: now,
                updatedAt: now
            });
            return res.status(201).json({ success: true, data: { id: validated.slug } });
        }
        catch (err) {
            return next(err);
        }
    }
    /**
     * PATCH /api/v1/categories/:id — update category (admin)
     */
    static async update(req, res, next) {
        try {
            const ref = firebaseAdmin_1.db.collection('categories').doc(req.params.id);
            const snap = await ref.get();
            if (!snap.exists) {
                return res.status(404).json({
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Category not found' }
                });
            }
            await ref.update({ ...req.body, updatedAt: new Date() });
            return res.status(200).json({ success: true, data: { id: req.params.id, updated: true } });
        }
        catch (err) {
            return next(err);
        }
    }
    /**
     * DELETE /api/v1/categories/:id — soft-deactivate (admin)
     */
    static async remove(req, res, next) {
        try {
            const ref = firebaseAdmin_1.db.collection('categories').doc(req.params.id);
            await ref.update({ isActive: false, updatedAt: new Date() });
            return res.status(200).json({ success: true, data: { id: req.params.id, deactivated: true } });
        }
        catch (err) {
            return next(err);
        }
    }
}
exports.CategoryController = CategoryController;
//# sourceMappingURL=categoryController.js.map
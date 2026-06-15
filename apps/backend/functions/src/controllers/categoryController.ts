import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebaseAdmin';
import { z } from 'zod';

const CategorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  image: z.string().url().optional(),
  sortOrder: z.number().int().nonnegative().optional().default(0)
});

export class CategoryController {
  /**
   * GET /api/v1/categories — all active categories
   */
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const snapshot = await db.collection('categories')
        .where('isActive', '==', true)
        .orderBy('sortOrder', 'asc')
        .get();

      const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      return res.status(200).json({ success: true, data: { categories } });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * POST /api/v1/categories — create category (admin)
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = CategorySchema.parse(req.body);
      const now = new Date();

      const ref = db.collection('categories').doc(validated.slug);
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
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PATCH /api/v1/categories/:id — update category (admin)
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const ref = db.collection('categories').doc(req.params.id);
      const snap = await ref.get();

      if (!snap.exists) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Category not found' }
        });
      }

      await ref.update({ ...req.body, updatedAt: new Date() });

      return res.status(200).json({ success: true, data: { id: req.params.id, updated: true } });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * DELETE /api/v1/categories/:id — soft-deactivate (admin)
   */
  static async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const ref = db.collection('categories').doc(req.params.id);
      await ref.update({ isActive: false, updatedAt: new Date() });
      return res.status(200).json({ success: true, data: { id: req.params.id, deactivated: true } });
    } catch (err) {
      return next(err);
    }
  }
}

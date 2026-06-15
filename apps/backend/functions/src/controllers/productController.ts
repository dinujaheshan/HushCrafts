import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebaseAdmin';
import { ProductSchema } from '@hush-craft/shared-utils';
import { z } from 'zod';
import { NotificationService } from '../services/notificationService';

const ProductQuerySchema = z.object({
  categoryId: z.string().optional(),
  status: z.enum(['published', 'draft', 'archived']).optional().default('published'),
  sort: z.enum(['createdAt', 'basePrice', 'name']).optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  page: z.coerce.number().int().min(1).optional().default(1)
});

export class ProductController {
  /**
   * GET /api/v1/products — list products with filters and pagination
   */
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = ProductQuerySchema.parse(req.query);

      let dbQuery: FirebaseFirestore.Query = db.collection('products')
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
    } catch (err) {
      return next(err);
    }
  }

  /**
   * GET /api/v1/products/:id — fetch a single product with its variants
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const productRef = db.collection('products').doc(req.params.id);
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
    } catch (err) {
      return next(err);
    }
  }

  /**
   * GET /api/v1/products/featured — returns best sellers and new arrivals
   */
  static async featured(req: Request, res: Response, next: NextFunction) {
    try {
      const [bestSellers, newArrivals] = await Promise.all([
        db.collection('products')
          .where('isDeleted', '==', false)
          .where('status', '==', 'published')
          .where('isBestSeller', '==', true)
          .orderBy('createdAt', 'desc')
          .limit(8)
          .get(),
        db.collection('products')
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
    } catch (err) {
      return next(err);
    }
  }

  /**
   * POST /api/v1/products — create a new product (admin only)
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = ProductSchema.parse(req.body);
      const now = new Date();

      const productRef = db.collection('products').doc();
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
        NotificationService.sendNewProductAlert({
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
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PATCH /api/v1/products/:id — update product fields (admin only)
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const productRef = db.collection('products').doc(req.params.id);
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
    } catch (err) {
      return next(err);
    }
  }

  /**
   * DELETE /api/v1/products/:id — soft delete (admin only)
   */
  static async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const productRef = db.collection('products').doc(req.params.id);
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
    } catch (err) {
      return next(err);
    }
  }
}

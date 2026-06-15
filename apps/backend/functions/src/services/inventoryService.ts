import { db } from '../config/firebaseAdmin';
import { NotificationService } from './notificationService';

export class InventoryService {
  /**
   * Deduct stock atomic transaction helper
   */
  static async verifyAndDeductStock(transaction: FirebaseFirestore.Transaction, items: Array<{ productId: string; variantId: string; sku: string; quantity: number }>) {
    const inventoryRefs = items.map(item => ({
      ref: db.collection('inventory').doc(item.sku),
      item
    }));

    const readPromises = inventoryRefs.map(({ ref }) => transaction.get(ref));
    const snapshots = await Promise.all(readPromises);

    const updates: Array<{ ref: FirebaseFirestore.DocumentReference; qty: number; threshold: number; status: string }> = [];
    const lowStockAlerts: Array<{ sku: string; qty: number; threshold: number }> = [];

    for (let i = 0; i < snapshots.length; i++) {
      const snapshot = snapshots[i];
      const { ref, item } = inventoryRefs[i];

      if (!snapshot.exists) {
        throw new Error(`Inventory record not found for SKU: ${item.sku}`);
      }

      const data = snapshot.data()!;
      const currentQty = data.quantity || 0;
      const reservedQty = data.reservedQuantity || 0;
      const availableQty = currentQty - reservedQty;

      if (availableQty < item.quantity) {
        throw new Error(`Insufficient stock for variant ${item.sku}. Available: ${availableQty}, Requested: ${item.quantity}`);
      }

      const nextQty = currentQty - item.quantity;
      const threshold = data.lowStockThreshold || 5;
      
      let nextStatus = 'in_stock';
      if (nextQty <= 0) {
        nextStatus = 'out_of_stock';
      } else if (nextQty <= threshold) {
        nextStatus = 'low_stock';
        lowStockAlerts.push({ sku: item.sku, qty: nextQty, threshold });
      }

      updates.push({
        ref,
        qty: nextQty,
        threshold,
        status: nextStatus
      });
    }

    // Apply writes
    for (const update of updates) {
      transaction.update(update.ref, {
        quantity: update.qty,
        status: update.status,
        updatedAt: new Date()
      });
    }

    return lowStockAlerts;
  }

  /**
   * Revert reserved stock if order gets cancelled
   */
  static async restoreStock(items: Array<{ sku: string; quantity: number }>) {
    await db.runTransaction(async (transaction) => {
      for (const item of items) {
        const ref = db.collection('inventory').doc(item.sku);
        const snapshot = await transaction.get(ref);
        if (snapshot.exists) {
          const data = snapshot.data()!;
          const currentQty = data.quantity || 0;
          const nextQty = currentQty + item.quantity;
          const threshold = data.lowStockThreshold || 5;

          const nextStatus = nextQty > threshold ? 'in_stock' : nextQty > 0 ? 'low_stock' : 'out_of_stock';

          transaction.update(ref, {
            quantity: nextQty,
            status: nextStatus,
            updatedAt: new Date()
          });
        }
      }
    });
  }

  /**
   * Process and dispatch any low stock warnings
   */
  static async handleLowStockAlerts(alerts: Array<{ sku: string; qty: number; threshold: number }>) {
    // Read admin contact settings
    const settingsDoc = await db.collection('settings').doc('store_settings').get();
    const adminEmail = settingsDoc.exists ? settingsDoc.data()?.values?.adminEmail : 'admin@hushcraft.lk';

    for (const alert of alerts) {
      // Send alerts
      await NotificationService.sendLowStockAlert(adminEmail, alert.sku, alert.qty, alert.threshold);
      
      // Write system notification doc
      await db.collection('notifications').add({
        recipientId: 'admin',
        title: 'Low Stock Alert',
        message: `SKU ${alert.sku} has fallen to low stock level (${alert.qty} pairs left).`,
        type: 'low_stock',
        isRead: false,
        createdAt: new Date()
      });
    }
  }
}

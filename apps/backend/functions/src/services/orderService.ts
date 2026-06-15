import { db } from '../config/firebaseAdmin';
import { InventoryService } from './inventoryService';
import { CustomerService } from './customerService';
import { NotificationService } from './notificationService';
import { getShippingFee } from '@hush-craft/shared-utils';
import { CheckoutRequest } from '@hush-craft/shared-types';

// Side-effect descriptor collected inside a transaction and executed after commit
interface OrderSideEffects {
  lowStockAlerts: Array<{ sku: string; qty: number; threshold: number }>;
  confirmationEmail: { email: string; customerName: string; items: any[]; total: number } | null;
}

interface StatusSideEffects {
  restoreStockItems: Array<{ sku: string; quantity: number }> | null;
  shippedEmail: { email: string; customerName: string; carrier: string; trackingNumber: string } | null;
  invoiceEmail: { email: string; customerName: string; order: any } | null;
  statusUpdateEmail: { email: string; customerName: string; status: string; note: string | null } | null;
}

export class OrderService {
  /**
   * Initialize a new order transactionally.
   * Side effects (emails, low-stock alerts) are dispatched AFTER the transaction commits.
   * Firebase Admin v12 Transaction does not have afterCommit() — we use post-runTransaction .then().
   */
  static async createOrder(payload: CheckoutRequest): Promise<any> {
    const orderId = `HC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Capture side effects to run after commit
    let sideEffects: OrderSideEffects = { lowStockAlerts: [], confirmationEmail: null };
    let finalTotal = 0;

    await db.runTransaction(async (transaction) => {
      let subtotal = 0;
      const verifiedItems: any[] = [];

      // Validate prices and items
      for (const item of payload.items) {
        const productRef = db.collection('products').doc(item.productId);
        const productSnap = await transaction.get(productRef);

        if (!productSnap.exists || productSnap.data()?.status !== 'published') {
          throw new Error(`Product not found or not published: ${item.productId}`);
        }

        const productData = productSnap.data()!;
        const variantRef = productRef.collection('variants').doc(item.variantId);
        const variantSnap = await transaction.get(variantRef);

        if (!variantSnap.exists) {
          throw new Error(`Variant not found: ${item.variantId}`);
        }

        const variantData = variantSnap.data()!;
        const itemPrice = variantData.price !== null ? variantData.price : productData.basePrice;

        subtotal += itemPrice * item.quantity;

        verifiedItems.push({
          productId: item.productId,
          variantId: item.variantId,
          sku: item.sku,
          name: productData.name,
          variantName: `${variantData.attributes?.color || ''} / ${variantData.attributes?.size || ''}`,
          price: itemPrice,
          quantity: item.quantity,
          image: variantData.image || productData.images[0] || ''
        });
      }

      // Compute shipping fee based on Sri Lankan districts
      const shippingFee = getShippingFee(payload.shippingAddress.district);

      // Handle coupon discount
      let discountAmount = 0;
      let couponCode = payload.couponCode || null;

      if (couponCode) {
        const couponRef = db.collection('coupons').doc(couponCode.toUpperCase());
        const couponSnap = await transaction.get(couponRef);

        if (couponSnap.exists) {
          const coupon = couponSnap.data()!;
          const now = new Date();
          const startDate = coupon.startDate.toDate();
          const endDate = coupon.endDate.toDate();

          if (
            coupon.isActive &&
            now >= startDate &&
            now <= endDate &&
            subtotal >= coupon.minOrderValue &&
            coupon.usedCount < coupon.usageLimit
          ) {
            if (coupon.discountType === 'percentage') {
              discountAmount = subtotal * (coupon.discountValue / 100);
            } else {
              discountAmount = coupon.discountValue;
            }
            // Increment coupon usage atomically
            transaction.update(couponRef, {
              usedCount: coupon.usedCount + 1,
              updatedAt: new Date()
            });
          } else {
            couponCode = null;
          }
        } else {
          couponCode = null;
        }
      }

      const total = subtotal + shippingFee - discountAmount;
      finalTotal = total;

      // Verify and deduct inventory levels (reads + writes inside transaction)
      const lowStockAlerts = await InventoryService.verifyAndDeductStock(transaction, payload.items);

      // Upsert customer profile inside transaction
      const customerId = await CustomerService.upsertCustomerOnCheckout(
        transaction,
        payload.customerDetails,
        total,
        payload.userId
      );

      // Save order document
      const orderRef = db.collection('orders').doc(orderId);
      transaction.set(orderRef, {
        id: orderId,
        customerId,
        customerDetails: payload.customerDetails,
        shippingAddress: payload.shippingAddress,
        billingAddress: payload.billingAddress || null,
        items: verifiedItems,
        subtotal,
        couponCode,
        discountAmount,
        shippingFee,
        total,
        paymentMethod: payload.paymentMethod || 'PayHere',
        paymentStatus: 'pending',
        orderStatus: 'pending',
        notes: payload.notes || null,
        trackingNumber: null,
        carrier: null,
        timeline: [
          {
            status: 'pending',
            timestamp: new Date(),
            note: `Order submitted successfully via checkout (${payload.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'})`,
            updatedBy: 'system'
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        isDeleted: false
      });

      // Record side effects for post-commit dispatch
      sideEffects = {
        lowStockAlerts,
        confirmationEmail: (payload.paymentMethod === 'cod' && payload.customerDetails.email) ? {
          email: payload.customerDetails.email,
          customerName: payload.customerDetails.fullName,
          items: verifiedItems,
          total
        } : null
      };
    });

    // --- Post-commit side effects (outside transaction) ---
    const postCommitTasks: Promise<void>[] = [];

    if (sideEffects.lowStockAlerts.length > 0) {
      postCommitTasks.push(InventoryService.handleLowStockAlerts(sideEffects.lowStockAlerts));
    }

    if (sideEffects.confirmationEmail) {
      const { email, customerName, items, total } = sideEffects.confirmationEmail;
      postCommitTasks.push(
        NotificationService.sendOrderConfirmation(email, orderId, customerName, items, total, payload.paymentMethod || 'cod')
      );
    }

    // Fire-and-forget: do not block the HTTP response
    Promise.all(postCommitTasks).catch((err) =>
      console.error('[Post-commit side effects error]:', err)
    );

    return {
      orderId,
      total: finalTotal,
      items: payload.items,
      customerDetails: payload.customerDetails,
      shippingAddress: payload.shippingAddress,
      billingAddress: payload.billingAddress || null,
      paymentMethod: payload.paymentMethod || 'PayHere'
    };
  }

  /**
   * Transition order status and coordinate side effects.
   * Side effects run after the transaction commits.
   */
  static async updateOrderStatus(
    orderId: string,
    status: string,
    trackingNumber: string | null = null,
    carrier: string | null = null,
    note: string | null = null,
    updatedBy: string
  ) {
    const orderRef = db.collection('orders').doc(orderId);
    let sideEffects: StatusSideEffects = {
      restoreStockItems: null,
      shippedEmail: null,
      invoiceEmail: null,
      statusUpdateEmail: null
    };

    await db.runTransaction(async (transaction) => {
      const orderSnap = await transaction.get(orderRef);

      if (!orderSnap.exists) {
        throw new Error(`Order ${orderId} does not exist`);
      }

      const orderData = orderSnap.data()!;
      const currentStatus = orderData.orderStatus;

      if (currentStatus === status) {
        return; // No transition needed
      }

      const updatePayload: Record<string, any> = {
        orderStatus: status,
        updatedAt: new Date(),
        timeline: [
          ...orderData.timeline,
          {
            status,
            timestamp: new Date(),
            note: note || `Order status updated from ${currentStatus} to ${status}`,
            updatedBy
          }
        ]
      };

      if (trackingNumber) updatePayload.trackingNumber = trackingNumber;
      if (carrier) updatePayload.carrier = carrier;

      if (status === 'completed') {
        updatePayload.paymentStatus = 'completed';
      }

      transaction.update(orderRef, updatePayload);

      // Collect side effects for post-commit dispatch
      if (status === 'cancelled' && currentStatus !== 'cancelled') {
        sideEffects.restoreStockItems = orderData.items;
      }

      if (status === 'dispatched' && orderData.customerDetails?.email) {
        sideEffects.shippedEmail = {
          email: orderData.customerDetails.email,
          customerName: orderData.customerDetails.fullName,
          carrier: carrier || 'Courier Service',
          trackingNumber: trackingNumber || ''
        };
      } else if (status === 'completed' && orderData.customerDetails?.email) {
        sideEffects.invoiceEmail = {
          email: orderData.customerDetails.email,
          customerName: orderData.customerDetails.fullName,
          order: { ...orderData, orderStatus: status, paymentStatus: 'completed' }
        };
      } else if (orderData.customerDetails?.email) {
        sideEffects.statusUpdateEmail = {
          email: orderData.customerDetails.email,
          customerName: orderData.customerDetails.fullName,
          status: status,
          note: note
        };
      }
    });

    // --- Post-commit side effects ---
    const postCommitTasks: Promise<void>[] = [];

    if (sideEffects.restoreStockItems) {
      postCommitTasks.push(InventoryService.restoreStock(sideEffects.restoreStockItems));
    }

    if (sideEffects.shippedEmail) {
      const { email, customerName, carrier: c, trackingNumber: tn } = sideEffects.shippedEmail;
      postCommitTasks.push(
        NotificationService.sendOrderShipped(email, orderId, customerName, c, tn)
      );
    }

    if (sideEffects.invoiceEmail) {
      const { email, customerName, order } = sideEffects.invoiceEmail;
      postCommitTasks.push(
        NotificationService.sendOrderInvoiceEmail(email, orderId, customerName, order)
      );
    }

    if (sideEffects.statusUpdateEmail) {
      const { email, customerName, status: s, note: n } = sideEffects.statusUpdateEmail;
      postCommitTasks.push(
        NotificationService.sendStatusUpdateEmail(email, orderId, customerName, s, n)
      );
    }

    Promise.all(postCommitTasks).catch((err) =>
      console.error('[Post-commit status side effects error]:', err)
    );
  }
}

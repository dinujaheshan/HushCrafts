import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/orderService';
import { PAYHERE_MERCHANT_SECRET } from './orderController';
import * as crypto from 'crypto';
import { db } from '../config/firebaseAdmin';
import { NotificationService } from '../services/notificationService';

export class PaymentController {
  static async payhereNotify(req: Request, res: Response, next: NextFunction) {
    try {
      // PayHere sends data as form-urlencoded which Express body-parser will parse into req.body
      const {
        merchant_id,
        order_id,
        payment_id,
        payhere_amount,
        payhere_currency,
        status_code,
        md5sig
      } = req.body;

      // Verify signature
      const merchantSecretHash = crypto.createHash('md5').update(PAYHERE_MERCHANT_SECRET).digest('hex').toUpperCase();
      const localSig = crypto.createHash('md5')
        .update(merchant_id + order_id + payhere_amount + payhere_currency + status_code + merchantSecretHash)
        .digest('hex').toUpperCase();

      if (localSig !== md5sig) {
        console.error('PayHere Signature Verification Failed for order:', order_id);
        return res.status(400).send('Invalid signature');
      }

      // Check if status is success
      if (status_code === '2') {
        // Payment success
        await OrderService.updateOrderStatus(
          order_id,
          'confirmed',
          null,
          null,
          `Payment successful (PayHere ID: ${payment_id})`,
          'system'
        );

        // Fetch order to send email
        const orderSnap = await db.collection('orders').doc(order_id).get();
        if (orderSnap.exists) {
          const order = orderSnap.data()!;
          if (order.customerDetails?.email) {
            await NotificationService.sendOrderConfirmation(
              order.customerDetails.email,
              order_id,
              order.customerDetails.fullName,
              order.items,
              order.total
            );
          }
        }
      } else if (status_code === '0' || status_code === '-1' || status_code === '-2' || status_code === '-3') {
        // Payment failed or cancelled
        await OrderService.updateOrderStatus(
          order_id,
          'cancelled',
          null,
          null,
          `Payment failed or cancelled (Status Code: ${status_code})`,
          'system'
        );
      }

      // PayHere expects a 200 OK
      return res.status(200).send('OK');
    } catch (err) {
      console.error('PayHere webhook error:', err);
      // Return 200 to prevent PayHere from continually retrying on an unrecoverable logic error
      return res.status(200).send('Error processed'); 
    }
  }
}

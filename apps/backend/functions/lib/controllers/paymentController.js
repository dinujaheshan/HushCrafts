"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const orderService_1 = require("../services/orderService");
const orderController_1 = require("./orderController");
const crypto = __importStar(require("crypto"));
const firebaseAdmin_1 = require("../config/firebaseAdmin");
const notificationService_1 = require("../services/notificationService");
class PaymentController {
    static async payhereNotify(req, res, next) {
        try {
            // PayHere sends data as form-urlencoded which Express body-parser will parse into req.body
            const { merchant_id, order_id, payment_id, payhere_amount, payhere_currency, status_code, md5sig } = req.body;
            // Verify signature
            const merchantSecretHash = crypto.createHash('md5').update(orderController_1.PAYHERE_MERCHANT_SECRET).digest('hex').toUpperCase();
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
                await orderService_1.OrderService.updateOrderStatus(order_id, 'confirmed', null, null, `Payment successful (PayHere ID: ${payment_id})`, 'system');
                // Fetch order to send email
                const orderSnap = await firebaseAdmin_1.db.collection('orders').doc(order_id).get();
                if (orderSnap.exists) {
                    const order = orderSnap.data();
                    if (order.customerDetails?.email) {
                        await notificationService_1.NotificationService.sendOrderConfirmation(order.customerDetails.email, order_id, order.customerDetails.fullName, order.items, order.total);
                    }
                }
            }
            else if (status_code === '0' || status_code === '-1' || status_code === '-2' || status_code === '-3') {
                // Payment failed or cancelled
                await orderService_1.OrderService.updateOrderStatus(order_id, 'cancelled', null, null, `Payment failed or cancelled (Status Code: ${status_code})`, 'system');
            }
            // PayHere expects a 200 OK
            return res.status(200).send('OK');
        }
        catch (err) {
            console.error('PayHere webhook error:', err);
            // Return 200 to prevent PayHere from continually retrying on an unrecoverable logic error
            return res.status(200).send('Error processed');
        }
    }
}
exports.PaymentController = PaymentController;
//# sourceMappingURL=paymentController.js.map
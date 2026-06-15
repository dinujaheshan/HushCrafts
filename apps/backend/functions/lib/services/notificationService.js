"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const resend_1 = require("resend");
const firebaseAdmin_1 = require("../config/firebaseAdmin");
// Read key from environments (or fallback for local emulators/testing)
const resendApiKey = process.env.RESEND_API_KEY || 're_57dFSYNL_MJHTnsDLM6rHujDZ922yArZT';
const resend = new resend_1.Resend(resendApiKey);
// SMTP configuration (e.g. Gmail SMTP using App Password)
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_USER = process.env.SMTP_USER || 'hushcraftslk@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || 'kkyj jmrg qekd dpll'; // Configured with your App Password!
// NOTE: Free Resend accounts require a verified domain. Until hushcraft.lk is verified,
// use onboarding@resend.dev (Resend's default from address that always works on free tier).
// Once the domain is verified in the Resend dashboard, change to: Hush Craft <noreply@hushcraft.lk>
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'Hush Craft <onboarding@resend.dev>';
class NotificationService {
    /**
     * Log email status inside Firestore email_logs
     */
    static async logEmail(recipient, template, subject, status, errorMessage = null) {
        try {
            await firebaseAdmin_1.db.collection('email_logs').add({
                recipient,
                template,
                subject,
                status,
                errorMessage,
                sentAt: new Date()
            });
        }
        catch (err) {
            console.error('Failed to log email entry:', err);
        }
    }
    /**
     * Private helper to route email sending to Resend or SMTP (Gmail)
     */
    static async sendEmail(to, subject, html) {
        // 1. Resend API takes precedence if key is configured (i.e. not default/dummy)
        if (resendApiKey && resendApiKey !== 're_dummy_key') {
            await resend.emails.send({
                from: SENDER_EMAIL,
                to,
                subject,
                html
            });
            return;
        }
        // 2. SMTP (Gmail with App Password) fallback
        if (SMTP_PASS) {
            const transporter = nodemailer_1.default.createTransport({
                host: SMTP_HOST,
                port: SMTP_PORT,
                secure: SMTP_PORT === 465,
                auth: {
                    user: SMTP_USER,
                    pass: SMTP_PASS
                }
            });
            await transporter.sendMail({
                from: `Hush Craft <${SMTP_USER}>`,
                to,
                subject,
                html
            });
            return;
        }
        // 3. Fallback mock logs
        console.log(`[Email Mock] to: ${to} | subject: ${subject}`);
    }
    /**
     * Premium branded HTML wrapper for all Hush Craft emails
     */
    static getBrandedEmailWrapper(title, bodyContent) {
        return `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #fcfbfa; margin: 0; padding: 0; width: 100%; -webkit-text-size-adjust: none; -ms-text-size-adjust: none;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fcfbfa; padding: 20px 0;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #f2ece9; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);">
                <!-- Header -->
                <tr>
                  <td align="center" style="background-color: #ffe4ec; padding: 30px 20px; border-bottom: 3px solid #7d4f3b;">
                    <span style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: bold; color: #7d4f3b; letter-spacing: 2px;">HUSH CRAFT</span>
                    <div style="font-size: 10px; color: #8a6d5c; font-weight: 600; text-transform: uppercase; letter-spacing: 4px; margin-top: 5px;">Elegant Handmade Slippers</div>
                  </td>
                </tr>
                <!-- Body Content -->
                <tr>
                  <td style="padding: 40px 30px; color: #4a4a4a; line-height: 1.6; font-size: 15px;">
                    ${bodyContent}
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td align="center" style="background-color: #fcfbfa; padding: 25px 20px; border-top: 1px solid #f2ece9; color: #8a6d5c; font-size: 12px;">
                    <p style="margin: 0; font-weight: 600;">Hush Craft Sri Lanka</p>
                    <p style="margin: 4px 0 0 0; font-size: 11px; color: #b09a8f;">Crafting comfort and elegance for your feet.</p>
                    <div style="margin-top: 15px; border-top: 1px dashed #e5dad4; padding-top: 15px; font-size: 10px; color: #b09a8f;">
                      This email was sent to you regarding your activity on Hush Craft.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `;
    }
    static chunkArray(array, size) {
        const chunked = [];
        for (let i = 0; i < array.length; i += size) {
            chunked.push(array.slice(i, i + size));
        }
        return chunked;
    }
    /**
     * Trigger launch alert campaign to all registered users when a product is published
     */
    static async sendNewProductAlert(product) {
        try {
            const userSnaps = await firebaseAdmin_1.db.collection('users').get();
            const emails = userSnaps.docs
                .map(doc => doc.data().email)
                .filter(email => email && email.includes('@'));
            if (emails.length === 0) {
                console.log('No user emails found to send product launch alerts.');
                return;
            }
            console.log(`Sending new product launch alerts for ${product.name} to ${emails.length} subscribers.`);
            const chunks = this.chunkArray(emails, 90);
            for (const chunk of chunks) {
                await this.sendProductLaunchEmail(chunk, product);
            }
        }
        catch (err) {
            console.error('Error fetching users for product alert:', err);
        }
    }
    static async sendProductLaunchEmail(bccEmails, product) {
        const subject = `✨ New Arrival: ${product.name} is now available!`;
        const productUrl = `https://hushcrafts.firebaseapp.com/shop/${product.id}`;
        const htmlContent = `
      <h2 style="color: #7d4f3b; margin-top: 0; font-family: 'Playfair Display', serif; font-size: 22px;">Introducing Our Latest Slipper: ${product.name}!</h2>
      <p>Hello there,</p>
      <p>We are thrilled to launch our newest addition to the Hush Craft collection. Handmade with care, designed for elegance and unmatched comfort.</p>
      
      ${product.image ? `
        <div style="text-align: center; margin: 25px 0;">
          <img src="${product.image}" alt="${product.name}" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #f2ece9; max-height: 250px; object-fit: cover;" />
        </div>
      ` : ''}
      
      <div style="background-color: #fcfbfa; padding: 20px; border-left: 4px solid #7d4f3b; border-radius: 6px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #7d4f3b;">${product.name}</h3>
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">${product.description}</p>
        <p style="margin: 0; font-weight: bold; font-size: 16px; color: #7d4f3b;">Price: LKR ${product.price.toLocaleString()}</p>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${productUrl}" style="background-color: #7d4f3b; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 30px; font-weight: bold; font-size: 14px; display: inline-block; letter-spacing: 0.5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          View Product Details & Shop
        </a>
      </div>
    `;
        const finalHtml = this.getBrandedEmailWrapper(subject, htmlContent);
        try {
            if (resendApiKey && resendApiKey !== 're_dummy_key') {
                const toEmail = SENDER_EMAIL.includes('<') ? SENDER_EMAIL.split('<')[1].replace('>', '') : SENDER_EMAIL;
                await resend.emails.send({
                    from: SENDER_EMAIL,
                    to: toEmail,
                    bcc: bccEmails,
                    subject,
                    html: finalHtml
                });
                return;
            }
            if (SMTP_PASS) {
                const transporter = nodemailer_1.default.createTransport({
                    host: SMTP_HOST,
                    port: SMTP_PORT,
                    secure: SMTP_PORT === 465,
                    auth: { user: SMTP_USER, pass: SMTP_PASS }
                });
                await transporter.sendMail({
                    from: `Hush Craft <${SMTP_USER}>`,
                    to: SMTP_USER,
                    bcc: bccEmails,
                    subject,
                    html: finalHtml
                });
                return;
            }
            console.log(`[Launch Email Mock] bcc: ${bccEmails.length} recipients | subject: ${subject}`);
        }
        catch (err) {
            console.error('Failed to send product launch email chunk:', err);
        }
    }
    /**
     * Send order confirmation email to the customer
     */
    static async sendOrderConfirmation(email, orderId, customerName, items, total, paymentMethod = 'online') {
        const subject = `Order Confirmed - ${orderId}`;
        const paymentLabel = paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Paid via PayHere Secure Online Payment';
        const bodyContent = `
      <h2 style="color: #7d4f3b; margin-top: 0; font-family: 'Playfair Display', serif; font-size: 20px;">Thank you for your order, ${customerName}!</h2>
      <p>We have successfully received your order <strong>${orderId}</strong> and are preparing it for packaging.</p>
      <p><strong>Payment Method:</strong> ${paymentLabel}</p>
      
      <h3 style="color: #7d4f3b; margin-top: 25px; font-size: 15px; border-bottom: 1px solid #f2ece9; padding-bottom: 5px;">Items Ordered</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <thead>
          <tr style="border-bottom: 1px solid #7d4f3b; font-weight: bold; color: #7d4f3b;">
            <th style="text-align: left; padding: 8px 0;">Product</th>
            <th style="text-align: center; padding: 8px 0; width: 60px;">Qty</th>
            <th style="text-align: right; padding: 8px 0; width: 100px;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr style="border-bottom: 1px dashed #e5dad4;">
              <td style="padding: 10px 0; color: #4a4a4a;">${item.name} <span style="font-size: 11px; color: #8a6d5c;">(${item.variantName || 'Standard'})</span></td>
              <td style="text-align: center; padding: 10px 0; color: #4a4a4a;">${item.quantity}</td>
              <td style="text-align: right; padding: 10px 0; font-weight: bold; color: #7d4f3b;">LKR ${item.price.toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div style="margin-top: 20px; text-align: right; font-size: 16px; font-weight: bold; color: #7d4f3b;">
        Total Amount: LKR ${total.toLocaleString()}
      </div>
    `;
        const finalHtml = this.getBrandedEmailWrapper(subject, bodyContent);
        try {
            await this.sendEmail(email, subject, finalHtml);
            await this.logEmail(email, 'order_confirmation', subject, 'sent');
        }
        catch (err) {
            console.error('Failed to send confirmation email:', err);
            await this.logEmail(email, 'order_confirmation', subject, 'failed', err.message);
        }
    }
    /**
     * Send order shipping update email with courier tracking URL
     */
    static async sendOrderShipped(email, orderId, customerName, carrier, trackingNumber) {
        const subject = `Your order ${orderId} has been shipped!`;
        const trackingUrl = carrier.toLowerCase().includes('pronto')
            ? `https://pronto.lk/tracking?no=${trackingNumber}`
            : `https://koombiyocourier.lk/tracking?id=${trackingNumber}`;
        const bodyContent = `
      <h2 style="color: #7d4f3b; margin-top: 0; font-family: 'Playfair Display', serif; font-size: 20px;">On its way!</h2>
      <p>Hi ${customerName}, your order <strong>${orderId}</strong> has been handed over to our delivery partner.</p>
      
      <div style="background-color: #ffe4ec; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #ffd1df;">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #4a4a4a;"><strong>Delivery Partner:</strong> ${carrier}</p>
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #4a4a4a;"><strong>Tracking Number:</strong> ${trackingNumber}</p>
        <p style="margin: 15px 0 0 0;"><a href="${trackingUrl}" style="background-color: #7d4f3b; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 20px; font-weight: bold; font-size: 12px; display: inline-block; letter-spacing: 0.5px;">Track Your Package</a></p>
      </div>
      
      <p>If there are any issues with the delivery, please contact our support team.</p>
    `;
        const finalHtml = this.getBrandedEmailWrapper(subject, bodyContent);
        try {
            await this.sendEmail(email, subject, finalHtml);
            await this.logEmail(email, 'order_shipped', subject, 'sent');
        }
        catch (err) {
            console.error('Failed to send shipping email:', err);
            await this.logEmail(email, 'order_shipped', subject, 'failed', err.message);
        }
    }
    /**
     * Sends a detailed order invoice receipt when an order status is updated to completed
     */
    static async sendOrderInvoiceEmail(email, orderId, customerName, order) {
        const subject = `Invoice Receipt - Order Completed ${orderId}`;
        const subtotal = order.subtotal || 0;
        const shippingFee = order.shippingFee || 0;
        const discount = order.discountAmount || 0;
        const total = order.total || 0;
        const paymentLabel = order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Paid Online (PayHere)';
        const address = order.shippingAddress;
        const items = order.items || [];
        const bodyContent = `
      <div style="border-bottom: 2px dashed #f2ece9; padding-bottom: 15px; margin-bottom: 20px;">
        <h2 style="color: #7d4f3b; margin: 0; font-family: 'Playfair Display', serif; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">Invoice / Receipt</h2>
        <p style="margin: 5px 0 0 0; color: #8a6d5c; font-size: 13px;">Thank you for your purchase! Below is your official invoice receipt details.</p>
      </div>

      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 25px; font-size: 13px;">
        <tr>
          <td width="50%" valign="top" style="padding-right: 10px; line-height: 1.5;">
            <strong style="color: #7d4f3b;">Invoice Details:</strong><br />
            Invoice ID: <strong>${orderId}</strong><br />
            Date: ${order.createdAt ? new Date(order.createdAt.seconds ? order.createdAt.seconds * 1000 : order.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}<br />
            Payment Mode: <strong>${paymentLabel}</strong><br />
          </td>
          <td width="50%" valign="top" style="padding-left: 10px; line-height: 1.5;">
            <strong style="color: #7d4f3b;">Delivery Address:</strong><br />
            ${customerName}<br />
            ${address.addressLine1}${address.addressLine2 ? `, ${address.addressLine2}` : ''}<br />
            ${address.city}, ${address.district}<br />
            Mobile: ${order.customerDetails?.mobileNumber || ''}
          </td>
        </tr>
      </table>

      <h3 style="color: #7d4f3b; font-size: 14px; border-bottom: 1px solid #7d4f3b; padding-bottom: 5px; margin-top: 30px;">Itemized Invoice</h3>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
        <thead>
          <tr style="border-bottom: 1px solid #f2ece9; font-weight: bold; color: #7d4f3b;">
            <th style="text-align: left; padding: 10px 0;">Item Details</th>
            <th style="text-align: center; padding: 10px 0; width: 60px;">Qty</th>
            <th style="text-align: right; padding: 10px 0; width: 100px;">Price</th>
            <th style="text-align: right; padding: 10px 0; width: 100px;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item) => `
            <tr style="border-bottom: 1px dashed #f2ece9;">
              <td style="padding: 12px 0; vertical-align: middle;">
                <div style="font-weight: bold; color: #4a4a4a;">${item.name}</div>
                <div style="font-size: 11px; color: #8a6d5c;">${item.variantName || 'Standard'}</div>
              </td>
              <td style="text-align: center; padding: 12px 0; color: #4a4a4a;">${item.quantity}</td>
              <td style="text-align: right; padding: 12px 0; color: #4a4a4a;">LKR ${item.price.toLocaleString()}</td>
              <td style="text-align: right; padding: 12px 0; font-weight: bold; color: #7d4f3b;">LKR ${(item.price * item.quantity).toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 15px; font-size: 13px; border-top: 2px solid #7d4f3b; padding-top: 10px;">
        <tr>
          <td width="55%"></td>
          <td width="45%">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="line-height: 1.5;">
              <tr>
                <td style="padding: 4px 0; color: #666;">Subtotal:</td>
                <td style="padding: 4px 0; text-align: right; color: #4a4a4a;">LKR ${subtotal.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #666;">Shipping Fee:</td>
                <td style="padding: 4px 0; text-align: right; color: #4a4a4a;">LKR ${shippingFee.toLocaleString()}</td>
              </tr>
              ${discount > 0 ? `
                <tr>
                  <td style="padding: 4px 0; color: #e11d48; font-weight: 500;">Discount:</td>
                  <td style="padding: 4px 0; text-align: right; color: #e11d48; font-weight: 500;">- LKR ${discount.toLocaleString()}</td>
                </tr>
              ` : ''}
              <tr style="border-top: 1px solid #f2ece9;">
                <td style="padding: 8px 0; font-weight: bold; color: #7d4f3b; font-size: 14px;">Grand Total:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #7d4f3b; font-size: 14px;">LKR ${total.toLocaleString()}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <div style="background-color: #ffe4ec; padding: 15px; border-radius: 8px; text-align: center; margin-top: 30px; border: 1px solid #ffd1df;">
        <span style="font-size: 12px; color: #7d4f3b; font-weight: 600;">✨ WE HOPE YOU LOVE YOUR NEW SLIPPERS!</span>
        <p style="margin: 4px 0 0 0; font-size: 11px; color: #8a6d5c;">If you have any feedback or questions, simply reply to this email or contact support.</p>
      </div>
    `;
        const finalHtml = this.getBrandedEmailWrapper(subject, bodyContent);
        try {
            await this.sendEmail(email, subject, finalHtml);
            await this.logEmail(email, 'order_invoice', subject, 'sent');
        }
        catch (err) {
            console.error('Failed to send invoice email:', err);
            await this.logEmail(email, 'order_invoice', subject, 'failed', err.message);
        }
    }
    /**
     * Send status update email notification
     */
    static async sendStatusUpdateEmail(email, orderId, customerName, status, note = null) {
        const subject = `Order Update - Order ${orderId} has changed status`;
        const STATUS_DESCRIPTIONS = {
            pending: 'is currently pending validation.',
            confirmed: 'has been confirmed and is now queued for packaging and delivery.',
            processing: 'is now being hand-crafted and prepared by our design team.',
            packed: 'has been beautifully packed and is ready for collection by our courier partner.',
            dispatched: 'has been handed over to our delivery partner and is on its way to you.',
            delivered: 'has been successfully delivered! We hope you enjoy your new sandals.',
            cancelled: 'has been cancelled. If this is an error, please get in touch with our customer service.',
            returned: 'has been processed as returned to our central warehouse.',
            refunded: 'has been successfully refunded. The amount should reflect in your account soon.'
        };
        const statusText = STATUS_DESCRIPTIONS[status] || `has transitioned to status: ${status}.`;
        const bodyContent = `
      <h2 style="color: #7d4f3b; margin-top: 0; font-family: 'Playfair Display', serif; font-size: 20px;">Your Order Has Been Updated</h2>
      <p>Hi ${customerName},</p>
      <p>We are writing to inform you that your order <strong>${orderId}</strong> ${statusText}</p>

      <div style="background-color: #fcfbfa; padding: 20px; border-left: 4px solid #7d4f3b; border-radius: 6px; margin: 25px 0;">
        <p style="margin: 0; font-size: 14px; color: #4a4a4a;">
          Current Order Status: <strong style="color: #7d4f3b; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px;">${status}</strong>
        </p>
        ${note ? `
          <p style="margin: 10px 0 0 0; font-size: 13px; color: #666; font-style: italic;">
            <strong>Message from Hush Craft:</strong> "${note}"
          </p>
        ` : ''}
      </div>

      <p>You can track and view your order history directly on your <a href="https://hushcrafts.firebaseapp.com/account" style="color: #7d4f3b; font-weight: bold; text-decoration: underline;">Hush Craft Profile Account</a>.</p>
    `;
        const finalHtml = this.getBrandedEmailWrapper(subject, bodyContent);
        try {
            await this.sendEmail(email, subject, finalHtml);
            await this.logEmail(email, 'order_status_update', subject, 'sent');
        }
        catch (err) {
            console.error('Failed to send status update email:', err);
            await this.logEmail(email, 'order_status_update', subject, 'failed', err.message);
        }
    }
    /**
     * Send low stock warning email to store manager
     */
    static async sendLowStockAlert(adminEmail, sku, quantity, threshold) {
        const subject = `[ALERT] Low Stock Level - SKU: ${sku}`;
        const bodyContent = `
      <h2 style="color: #cc0000; margin-top: 0; font-family: 'Playfair Display', serif; font-size: 20px;">Low Stock Level Alert</h2>
      <p>The inventory level for product variation <strong>${sku}</strong> has fallen below its low stock threshold.</p>
      
      <div style="background-color: #ffebeb; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 5px solid #cc0000;">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #4a4a4a;"><strong>SKU Reference:</strong> ${sku}</p>
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #cc0000; font-weight: bold;"><strong>Available Stock:</strong> ${quantity}</p>
        <p style="margin: 0; font-size: 14px; color: #4a4a4a;"><strong>Low Stock Threshold:</strong> ${threshold}</p>
      </div>
      
      <p>Please update inventory stock via the Hush Craft Admin panel immediately.</p>
    `;
        const finalHtml = this.getBrandedEmailWrapper(subject, bodyContent);
        try {
            await this.sendEmail(adminEmail, subject, finalHtml);
        }
        catch (err) {
            console.error('Failed to send low stock email:', err);
        }
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=notificationService.js.map
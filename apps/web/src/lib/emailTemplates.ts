// Hush Craft Email Templates for Client-Side Fallback Testing

export function getBrandedEmailWrapper(title: string, bodyContent: string): string {
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

export function getOrderConfirmationTemplate(orderId: string, customerName: string, items: any[], total: number, paymentMethod: string): string {
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

  return getBrandedEmailWrapper(subject, bodyContent);
}

export function getOrderInvoiceTemplate(orderId: string, customerName: string, order: any): string {
  const subject = `Invoice Receipt - Order Completed ${orderId}`;
  
  const subtotal = order.subtotal || 0;
  const shippingFee = order.shippingFee || 0;
  const discount = order.discountAmount || 0;
  const total = order.total || 0;
  const paymentLabel = order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Paid Online (PayHere)';
  const address = order.shippingAddress || {};
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
          Date: ${new Date().toLocaleDateString()}<br />
          Payment Mode: <strong>${paymentLabel}</strong><br />
        </td>
        <td width="50%" valign="top" style="padding-left: 10px; line-height: 1.5;">
          <strong style="color: #7d4f3b;">Delivery Address:</strong><br />
          ${customerName}<br />
          ${address.addressLine1 || ''}${address.addressLine2 ? `, ${address.addressLine2}` : ''}<br />
          ${address.city || ''}, ${address.district || ''}<br />
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
        ${items.map((item: any) => `
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

  return getBrandedEmailWrapper(subject, bodyContent);
}

export function getStatusUpdateTemplate(orderId: string, customerName: string, status: string, note: string | null = null): string {
  const subject = `Order Update - Order ${orderId} has changed status`;
  
  const STATUS_DESCRIPTIONS: Record<string, string> = {
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

    <p>You can track and view your order history directly on your <a href="http://localhost:3000/account" style="color: #7d4f3b; font-weight: bold; text-decoration: underline;">Hush Craft Profile Account</a>.</p>
  `;

  return getBrandedEmailWrapper(subject, bodyContent);
}

export function getProductLaunchTemplate(product: { name: string; description: string; price: number; image: string; id: string }): string {
  const subject = `✨ New Arrival: ${product.name} is now available!`;
  const productUrl = `http://localhost:3000/shop/${product.id}`;
  
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

  return getBrandedEmailWrapper(subject, htmlContent);
}

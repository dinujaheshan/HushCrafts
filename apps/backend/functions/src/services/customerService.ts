import { db } from '../config/firebaseAdmin';

export class CustomerService {
  /**
   * Upserts customer record on checkout and updates order summaries
   */
  static async upsertCustomerOnCheckout(
    transaction: FirebaseFirestore.Transaction,
    customerDetails: { fullName: string; mobileNumber: string; email: string | null },
    orderTotal: number,
    userId?: string | null
  ): Promise<string> {
    const customerPhone = customerDetails.mobileNumber.trim();
    let customerId: string;
    let customerDoc: any = null;

    if (userId) {
      const customerRef = db.collection('customers').doc(userId);
      const customerSnap = await transaction.get(customerRef);
      if (customerSnap.exists) {
        customerDoc = customerSnap;
        customerId = userId;
      } else {
        customerId = userId;
      }
    } else {
      const customerQuery = db.collection('customers')
        .where('phone', '==', customerPhone)
        .where('isDeleted', '==', false)
        .limit(1);

      const snapshots = await transaction.get(customerQuery);
      if (!snapshots.empty) {
        customerDoc = snapshots.docs[0];
        customerId = customerDoc.id;
      } else {
        const newCustomerRef = db.collection('customers').doc();
        customerId = newCustomerRef.id;
      }
    }
    
    const splitName = customerDetails.fullName.split(' ');
    const firstName = splitName[0];
    const lastName = splitName.slice(1).join(' ') || '';

    if (!customerDoc) {
      // Create new customer profile
      const newCustomerRef = db.collection('customers').doc(customerId);

      transaction.set(newCustomerRef, {
        firstName,
        lastName,
        email: customerDetails.email || null,
        phone: customerPhone,
        totalOrders: 1,
        totalSpent: orderTotal,
        lastOrderAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        isDeleted: false
      });
    } else {
      // Update existing profile
      const data = customerDoc.data();

      const nextOrders = (data.totalOrders || 0) + 1;
      const nextSpent = (data.totalSpent || 0) + orderTotal;

      transaction.update(customerDoc.ref, {
        firstName,
        lastName,
        email: customerDetails.email || data.email,
        totalOrders: nextOrders,
        totalSpent: nextSpent,
        lastOrderAt: new Date(),
        updatedAt: new Date()
      });
    }

    return customerId;
  }
}

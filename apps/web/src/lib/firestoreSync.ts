/**
 * Firestore sync utilities for Cart and Wishlist.
 * Syncs user's cart and wishlist to Firestore so it persists across devices.
 */
import { db } from './firebase';
import {
  doc, collection, getDocs, setDoc, deleteDoc,
  writeBatch, serverTimestamp, addDoc, Timestamp
} from 'firebase/firestore';
import type { CartItem } from '@/store/cartStore';
import type { WishlistItem } from '@/store/wishlistStore';

// ─── CART SYNC ─────────────────────────────────────────────────────────────

export async function saveCartToFirestore(uid: string, items: CartItem[]) {
  try {
    const batch = writeBatch(db);
    const cartRef = collection(db, 'users', uid, 'cart');

    // Delete all existing cart docs first
    const existing = await getDocs(cartRef);
    existing.docs.forEach(d => batch.delete(d.ref));

    // Add new items
    items.forEach(item => {
      const itemRef = doc(cartRef, item.variantId);
      batch.set(itemRef, item);
    });

    await batch.commit();
  } catch (e) {
    console.error('Error saving cart to Firestore:', e);
  }
}

export async function loadCartFromFirestore(uid: string): Promise<CartItem[]> {
  try {
    const cartRef = collection(db, 'users', uid, 'cart');
    const snapshot = await getDocs(cartRef);
    return snapshot.docs.map(d => d.data() as CartItem);
  } catch (e) {
    console.error('Error loading cart from Firestore:', e);
    return [];
  }
}

export async function clearCartInFirestore(uid: string) {
  try {
    const batch = writeBatch(db);
    const cartRef = collection(db, 'users', uid, 'cart');
    const existing = await getDocs(cartRef);
    existing.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  } catch (e) {
    console.error('Error clearing cart in Firestore:', e);
  }
}

// ─── WISHLIST SYNC ─────────────────────────────────────────────────────────

export async function saveWishlistToFirestore(uid: string, items: WishlistItem[]) {
  try {
    const batch = writeBatch(db);
    const wishlistRef = collection(db, 'users', uid, 'wishlist');

    // Delete all existing
    const existing = await getDocs(wishlistRef);
    existing.docs.forEach(d => batch.delete(d.ref));

    // Add new items
    items.forEach(item => {
      const itemRef = doc(wishlistRef, item.productId);
      batch.set(itemRef, item);
    });

    await batch.commit();
  } catch (e) {
    console.error('Error saving wishlist to Firestore:', e);
  }
}

export async function loadWishlistFromFirestore(uid: string): Promise<WishlistItem[]> {
  try {
    const wishlistRef = collection(db, 'users', uid, 'wishlist');
    const snapshot = await getDocs(wishlistRef);
    return snapshot.docs.map(d => d.data() as WishlistItem);
  } catch (e) {
    console.error('Error loading wishlist from Firestore:', e);
    return [];
  }
}

// ─── ORDERS ───────────────────────────────────────────────────────────────

export interface OrderItem {
  productId: string;
  variantId: string;
  sku: string;
  name: string;
  variantName: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id?: string;
  uid: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  customerDetails: {
    fullName: string;
    mobileNumber: string;
    email: string | null;
  };
  shippingAddress: {
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    district: string;
    postalCode: string | null;
  };
  billingAddress?: {
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    district: string;
    postalCode: string | null;
  } | null;
  paymentMethod: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  notes: string | null;
  paymentProofUrl?: string | null;
  paymentProofPublicId?: string | null;
  createdAt?: Timestamp | null;
}

export async function createOrder(order: Order): Promise<string | null> {
  try {
    const orderId = order.id || doc(collection(db, 'orders')).id;
    const orderRef = doc(db, 'orders', orderId);
    
    await setDoc(orderRef, {
      ...order,
      id: orderId,
      createdAt: serverTimestamp()
    });

    // Also save under user's orders subcollection for easy querying
    const userOrderRef = doc(db, 'users', order.uid, 'orders', orderId);
    await setDoc(userOrderRef, {
      orderId: orderId,
      status: order.status,
      total: order.total,
      itemCount: order.items.length,
      items: order.items,
      paymentMethod: order.paymentMethod,
      createdAt: serverTimestamp()
    });

    return orderId;
  } catch (e) {
    console.error('Error creating order:', e);
    return null;
  }
}

export async function getUserOrders(uid: string): Promise<Array<{ orderId: string; status: string; total: number; itemCount: number; items?: OrderItem[]; paymentMethod?: string; createdAt: Timestamp | null }>> {
  try {
    const userOrdersRef = collection(db, 'users', uid, 'orders');
    const snapshot = await getDocs(userOrdersRef);
    return snapshot.docs.map(d => d.data() as { orderId: string; status: string; total: number; itemCount: number; items?: OrderItem[]; paymentMethod?: string; createdAt: Timestamp | null });
  } catch (e) {
    console.error('Error fetching user orders:', e);
    return [];
  }
}

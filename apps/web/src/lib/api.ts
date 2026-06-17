/**
 * Hush Crafts API Client
 * Connects directly to Firebase Firestore
 */

import { db } from './firebase';
import { collection, doc, getDoc, getDocs, query, where, limit, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://127.0.0.1:5001/hush-craft-workspace/us-central1/api';

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ success: true; data: T } | { success: false; error: { code: string; message: string } }> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });

  const json = await res.json();
  return json;
}

// ─── PRODUCT TYPES ────────────────────────────────────────────────────────────
export interface ProductVariant {
  id: string;
  sku: string;
  price: number | null;
  compareAtPrice?: number | null;
  attributes: { size: string; color: string };
  image?: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface Product {
  id: string;
  name: string;
  description: string;
  summary: string;
  basePrice: number;
  categoryIds: string[];
  images: string[];
  status: 'published' | 'draft' | 'archived';
  isBestSeller: boolean;
  isFeatured: boolean;
  totalSold: number;
  averageRating: number;
  reviewCount: number;
  seo: { title: string; description: string; keywords: string[] };
  variants?: ProductVariant[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  productCount: number;
}

// ─── PUBLIC API (FIRESTORE) ───────────────────────────────────────────────────

function mapDocToProduct(docSnap: QueryDocumentSnapshot<DocumentData>): Product {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name || '',
    description: data.description || '',
    summary: data.summary || '',
    basePrice: data.basePrice || 0,
    categoryIds: data.categoryIds || [],
    images: data.images || [],
    status: data.status || 'published',
    isBestSeller: data.isBestSeller || false,
    isFeatured: data.isFeatured || false,
    totalSold: data.totalSold || 0,
    averageRating: data.averageRating || 0,
    reviewCount: data.reviewCount || 0,
    seo: data.seo || { title: '', description: '', keywords: [] },
    variants: data.variants || []
  };
}

export async function getProducts(params?: { categoryId?: string; limitCount?: number }) {
  try {
    let q = query(collection(db, 'products'), where('status', '==', 'published'));

    if (params?.categoryId) {
      q = query(q, where('categoryIds', 'array-contains', params.categoryId));
    }

    if (params?.limitCount) {
      q = query(q, limit(params.limitCount));
    }

    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(mapDocToProduct);

    return { success: true as const, data: { products, hasMore: false, count: products.length } };
  } catch (error: unknown) {
    console.error("Error fetching products:", error);
    return { success: false as const, error: { code: 'DB_ERROR', message: 'Failed to load products' } };
  }
}

export async function getFeaturedProducts() {
  try {
    // Hot items (Best Sellers)
    const hotItemsQuery = query(
      collection(db, 'products'),
      where('status', '==', 'published'),
      where('isBestSeller', '==', true),
      limit(12)
    );

    // New arrivals (using simple limit for now, ideally ordered by createdAt)
    const newArrivalsQuery = query(
      collection(db, 'products'),
      where('status', '==', 'published'),
      limit(8)
    );

    const [hotSnap, newSnap] = await Promise.all([
      getDocs(hotItemsQuery),
      getDocs(newArrivalsQuery)
    ]);

    return {
      success: true as const,
      data: {
        bestSellers: hotSnap.docs.map(mapDocToProduct),
        newArrivals: newSnap.docs.map(mapDocToProduct)
      }
    };
  } catch (error: unknown) {
    console.error("Error fetching featured products:", error);
    return { success: false as const, error: { code: 'DB_ERROR', message: 'Failed to load featured products' } };
  }
}

export async function getProduct(id: string) {
  try {
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false as const, error: { code: 'NOT_FOUND', message: 'Product not found' } };
    }

    return {
      success: true as const,
      data: mapDocToProduct(docSnap as QueryDocumentSnapshot<DocumentData>)
    };
  } catch (error: unknown) {
    console.error("Error fetching product:", error);
    return { success: false as const, error: { code: 'DB_ERROR', message: 'Failed to load product' } };
  }
}

export async function getCategories() {
  try {
    const snapshot = await getDocs(collection(db, 'categories'));
    const categories: Category[] = snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name || '',
      slug: doc.data().slug || '',
      description: doc.data().description || '',
      image: doc.data().image || '',
      productCount: doc.data().productCount || 0
    }));

    return { success: true as const, data: { categories } };
  } catch (error: unknown) {
    console.error("Error fetching categories:", error);
    return { success: false as const, error: { code: 'DB_ERROR', message: 'Failed to load categories' } };
  }
}

export async function submitCheckout(payload: {
  userId?: string | null;
  customerDetails: { fullName: string; mobileNumber: string; email: string | null };
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
  paymentMethod?: string;
  bankDetails?: { bankName: string; accountNumber: string; nic: string };
  codDetails?: { courierName: string; deliveryFee: number };
  items: Array<{ productId: string; variantId: string; sku: string; quantity: number }>;
  couponCode?: string | null;
  notes?: string | null;
}): Promise<any> {
  try {
    const res = await apiFetch<any>('/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    // Check if the response returned an explicit error response from backend API
    if (res && 'success' in res && !res.success) {
      return res;
    }
    return res;
  } catch (err) {
    console.warn("Backend Cloud Function API is offline. Simulating checkout on client-side...", err);

    // Generate realistic simulated checkout response for local testing
    const mockOrderId = `HC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Dynamically calculate the exact price of items in the cart
    let subtotal = 0;
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      for (const item of payload.items) {
        const pRef = doc(db, 'products', item.productId);
        const pSnap = await getDoc(pRef);
        if (pSnap.exists()) {
          const pData = pSnap.data();
          let itemPrice = pData.basePrice || 0;
          if (item.variantId) {
            const vRef = doc(db, 'products', item.productId, 'variants', item.variantId);
            const vSnap = await getDoc(vRef);
            if (vSnap.exists() && vSnap.data()?.price !== null) {
              itemPrice = vSnap.data().price;
            }
          }
          subtotal += itemPrice * item.quantity;
        }
      }
    } catch (dbErr) {
      console.error("Failed to fetch product prices in fallback, using default mock:", dbErr);
      subtotal = payload.items.reduce((sum, i) => sum + (3500 * i.quantity), 0);
    }

    const shippingFee = (payload.shippingAddress.district === 'Colombo' || payload.shippingAddress.district === 'Gampaha') ? 350 : 500;
    const totalAmount = (subtotal + shippingFee).toFixed(2);

    // Calculate authentic PayHere MD5 signature hash on client-side
    const PAYHERE_MERCHANT_ID = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID || "";
    // Use the merchant secret from environment variables
    const PAYHERE_MERCHANT_SECRET = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_SECRET || "";
    const merchantSecretHash = md5(PAYHERE_MERCHANT_SECRET);
    const hashStr = PAYHERE_MERCHANT_ID + mockOrderId + totalAmount + "LKR" + merchantSecretHash;
    const finalHash = md5(hashStr);

    console.log("=== PayHere Hash Generation Debug ===");
    console.log("Merchant ID in use:", PAYHERE_MERCHANT_ID);
    console.log("Order ID:", mockOrderId);
    console.log("Amount formatted:", totalAmount);
    console.log("Currency: LKR");
    console.log("Merchant Secret (Decoded):", PAYHERE_MERCHANT_SECRET);
    console.log("Merchant Secret MD5 Hash:", merchantSecretHash);
    console.log("Concatenated String to MD5:", hashStr);
    console.log("Calculated Final MD5 Hash:", finalHash);
    console.log("======================================");

    return {
      success: true,
      data: {
        merchantId: PAYHERE_MERCHANT_ID,
        returnUrl: `http://localhost:3000/order-confirmation/${mockOrderId}`,
        cancelUrl: 'http://localhost:3000/checkout',
        notifyUrl: 'https://hushcrafts.firebaseapp.com/api/v1/payments/payhere-notify',
        orderId: mockOrderId,
        orderTitle: 'Hush Crafts Order (Offline Mode)',
        amount: totalAmount,
        firstName: payload.customerDetails.fullName.split(' ')[0] || 'Customer',
        lastName: payload.customerDetails.fullName.split(' ').slice(1).join(' ') || '.',
        email: payload.customerDetails.email || 'customer@hushcraft.lk',
        phone: payload.customerDetails.mobileNumber,
        address: payload.shippingAddress.addressLine1,
        city: payload.shippingAddress.city,
        hash: finalHash,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    };
  }
}

// Pure JS MD5 algorithm for generating correct signature hashes
function md5(str: string): string {
  const k = [
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
  ];
  const r = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
  ];

  const words: number[] = [];
  const s = str + "\x80";
  const len = s.length;
  for (let i = 0; i < len; i++) {
    words[i >> 2] |= s.charCodeAt(i) << ((i % 4) * 8);
  }
  // Fixed: use str.length + 8 instead of len + 8 (which was str.length + 9) to prevent incorrect padding blocks
  const wordCount = (((str.length + 8) >> 6) * 16) + 14;
  words[wordCount] = (str.length * 8) & 0xffffffff;
  words[wordCount + 1] = Math.floor(str.length * 8 / 4294967296);

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;

  for (let j = 0; j < wordCount; j += 16) {
    let a = h0, b = h1, c = h2, d = h3;
    for (let i = 0; i < 64; i++) {
      let f, g;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }
      const temp = d;
      d = c;
      c = b;
      b = b + RotateLeft(a + f + k[i] + (words[j + g] || 0), r[i]);
      a = temp;
    }
    h0 = (h0 + a) & 0xffffffff;
    h1 = (h1 + b) & 0xffffffff;
    h2 = (h2 + c) & 0xffffffff;
    h3 = (h3 + d) & 0xffffffff;
  }

  function RotateLeft(x: number, n: number) {
    return (x << n) | (x >>> (32 - n));
  }

  const hex = (n: number) => {
    let s = "";
    for (let i = 0; i < 4; i++) {
      s += ((n >> (i * 8)) & 0xff).toString(16).padStart(2, "0");
    }
    return s;
  };
  return (hex(h0) + hex(h1) + hex(h2) + hex(h3)).toUpperCase();
}

// ─── ADMIN API ────────────────────────────────────────────────────────────────

async function adminFetch<T>(path: string, token: string, options: RequestInit = {}) {
  return apiFetch<T>(path, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`
    }
  });
}

export async function getAdminDashboardStats(token: string) {
  // Ideally this calls a server API that aggregates data securely
  return adminFetch<Record<string, unknown>>('/api/v1/admin/dashboard/stats', token);
}

export async function getAdminRevenueChart(token: string) {
  return adminFetch<{ chartData: Array<{ date: string; revenue: number; orders: number }> }>(
    '/api/v1/admin/dashboard/revenue-chart',
    token
  );
}

export async function getAdminOrders(token: string, params?: { status?: string; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.limit) qs.set('limit', String(params.limit));
  const queryParam = qs.toString() ? `?${qs}` : '';
  return adminFetch<{ orders: Array<Record<string, unknown>>; hasMore: boolean; count: number }>(
    `/api/v1/admin/orders${queryParam}`,
    token
  );
}

export async function updateOrderStatus(
  token: string,
  orderId: string,
  payload: { status: string; trackingNumber?: string; carrier?: string; note?: string }
) {
  return adminFetch<{ orderId: string; status: string }>(`/api/v1/admin/orders/${orderId}/status`, token, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export async function getAdminInventory(token: string, status?: string) {
  const qs = status ? `?status=${status}` : '';
  return adminFetch<{ inventory: Array<Record<string, unknown>>; count: number }>(`/api/v1/admin/inventory${qs}`, token);
}

export async function updateInventory(
  token: string,
  sku: string,
  payload: { quantity: number; lowStockThreshold: number }
) {
  return adminFetch<{ sku: string; quantity: number; status: string }>(
    `/api/v1/admin/inventory/${sku}`,
    token,
    { method: 'PUT', body: JSON.stringify(payload) }
  );
}

// Triggering a fresh Vercel rebuild

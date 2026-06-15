export interface User {
  id: string; // Auth UID
  email: string;
  displayName: string;
  photoURL: string | null;
  isActive: boolean;
  createdAt: any; // Firestore Timestamp
  updatedAt: any;
  deletedAt: any | null;
  isDeleted: boolean;
}

export interface Role {
  id: string; // 'super_admin' | 'store_manager' | 'fulfillment_staff'
  name: string;
  description: string;
  createdAt: any;
  updatedAt: any;
}

export interface Permission {
  id: string; // 'products.create'
  module: string; // 'products'
  action: string; // 'create'
  description: string;
  createdAt: any;
}

export interface UserRole {
  id: string; // userId
  roleIds: string[];
  updatedAt: any;
  updatedBy: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  summary: string;
  basePrice: number;
  categoryIds: string[];
  images: string[];
  status: 'draft' | 'published' | 'archived';
  rating: number;
  reviewCount: number;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  createdAt: any;
  updatedAt: any;
  deletedAt: any | null;
  isDeleted: boolean;
}

export interface ProductVariant {
  id: string;
  sku: string;
  price: number | null;
  compareAtPrice: number | null;
  attributes: {
    size: string; // e.g. '38'
    color: string; // e.g. 'Beige'
  };
  image: string | null;
  createdAt: any;
  updatedAt: any;
}

export interface Inventory {
  id: string; // SKU
  productId: string;
  variantId: string;
  quantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  createdAt: any;
  updatedAt: any;
}

export interface OrderItem {
  productId: string;
  variantId: string;
  sku: string;
  name: string;
  variantName: string; // 'Beige / 38'
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string; // HC-YYYYMMDD-XXXX
  customerId: string | null;
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
  items: OrderItem[];
  subtotal: number;
  couponCode: string | null;
  discountAmount: number;
  shippingFee: number;
  total: number;
  paymentMethod: 'PayHere' | 'COD' | 'online' | 'cod';
  paymentStatus: 'pending' | 'completed' | 'refunded';
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'packed' | 'dispatched' | 'delivered' | 'completed' | 'cancelled' | 'returned' | 'refunded';
  notes: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  timeline: Array<{
    status: string;
    timestamp: any;
    note: string | null;
    updatedBy: string;
  }>;
  createdAt: any;
  updatedAt: any;
  deletedAt: any | null;
  isDeleted: boolean;
}

export interface Customer {
  id: string; // Auth UID or generated guest ID
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: any;
  createdAt: any;
  updatedAt: any;
  deletedAt: any | null;
  isDeleted: boolean;
}

export interface CustomerAddress {
  id: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  district: string;
  postalCode: string | null;
  isDefault: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Wishlist {
  id: string; // productId
  createdAt: any;
}

export interface CartItem {
  id: string; // variantId
  quantity: number;
  addedAt: any;
}

export interface Review {
  id: string;
  productId: string;
  customerId: string | null;
  customerName: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Coupon {
  id: string; // Code e.g. 'WELCOME10'
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  minOrderValue: number;
  usageLimit: number;
  usedCount: number;
  startDate: any;
  endDate: any;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Notification {
  id: string;
  recipientId: string; // userId or 'admin'
  title: string;
  message: string;
  type: 'order_status' | 'low_stock' | 'system';
  isRead: boolean;
  createdAt: any;
}

export interface EmailLog {
  id: string;
  recipient: string;
  template: string;
  subject: string;
  status: 'sent' | 'failed';
  errorMessage: string | null;
  sentAt: any;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  details: {
    targetId: string;
    before: Record<string, any> | null;
    after: Record<string, any> | null;
  };
  ipAddress: string;
  userAgent: string;
  timestamp: any;
}

export interface AnalyticsEvent {
  id: string;
  sessionId: string;
  customerId: string | null;
  eventName: string;
  eventParams: Record<string, any>;
  timestamp: any;
}

export interface Settings {
  id: string; // 'store_settings' | 'shipping_settings' | 'email_settings'
  values: Record<string, any>;
  updatedAt: any;
  updatedBy: string;
}

export interface MediaLibrary {
  id: string;
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  createdAt: any;
}

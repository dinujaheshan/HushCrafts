import { Order, Inventory, OrderItem } from './models';

export interface BaseApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiResponseError;
}

export interface ApiResponseError {
  code: string;
  message: string;
  details?: Array<{
    field: string;
    issue: string;
  }>;
}

// Checkout contracts
export interface CheckoutRequest {
  userId?: string | null;
  customerDetails: {
    fullName: string;
    mobileNumber: string;
    email: string | null;
  };
  shippingAddress: {
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    district: string; // validated against Sri Lankan districts list
    postalCode: string | null;
  };
  billingAddress?: {
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    district: string;
    postalCode: string | null;
  } | null;
  paymentMethod?: 'online' | 'cod' | 'PayHere' | 'COD';
  items: Array<{
    productId: string;
    variantId: string;
    sku: string;
    quantity: number;
  }>;
  couponCode?: string | null;
  notes?: string | null;
}

export interface CheckoutResponse {
  orderId: string;
  total: number;
  status: string;
  createdAt: string;
}

// Order management contracts
export interface OrderStatusUpdateRequest {
  status: Order['orderStatus'];
  trackingNumber?: string | null;
  carrier?: string | null;
  note?: string | null;
}

export interface OrderStatusUpdateResponse {
  orderId: string;
  status: Order['orderStatus'];
  updatedAt: string;
}

// Inventory management contracts
export interface InventoryUpdateRequest {
  quantity: number;
  lowStockThreshold: number;
}

export interface InventoryUpdateResponse {
  sku: string;
  quantity: number;
  status: Inventory['status'];
}

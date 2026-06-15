import { Order, Inventory } from './models';
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
export interface InventoryUpdateRequest {
    quantity: number;
    lowStockThreshold: number;
}
export interface InventoryUpdateResponse {
    sku: string;
    quantity: number;
    status: Inventory['status'];
}
//# sourceMappingURL=api.d.ts.map
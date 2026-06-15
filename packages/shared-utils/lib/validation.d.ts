import { z } from 'zod';
export declare const CustomerDetailsSchema: z.ZodObject<{
    fullName: z.ZodString;
    mobileNumber: z.ZodString;
    email: z.ZodUnion<[z.ZodUnion<[z.ZodNullable<z.ZodString>, z.ZodEffects<z.ZodString, null, string>]>, z.ZodLiteral<null>]>;
}, "strip", z.ZodTypeAny, {
    fullName: string;
    mobileNumber: string;
    email: string | null;
}, {
    fullName: string;
    mobileNumber: string;
    email: string | null;
}>;
export declare const ShippingAddressSchema: z.ZodObject<{
    addressLine1: z.ZodString;
    addressLine2: z.ZodEffects<z.ZodUnion<[z.ZodNullable<z.ZodString>, z.ZodLiteral<"">]>, string | null, string | null>;
    city: z.ZodString;
    district: z.ZodEnum<["Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya", "Galle", "Matara", "Hambantota", "Jaffna", "Mannar", "Vavuniya", "Mullaitivu", "Kilinochchi", "Batticaloa", "Ampara", "Trincomalee", "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla", "Moneragala", "Ratnapura", "Kegalle"]>;
    postalCode: z.ZodUnion<[z.ZodUnion<[z.ZodNullable<z.ZodString>, z.ZodEffects<z.ZodString, null, string>]>, z.ZodLiteral<null>]>;
}, "strip", z.ZodTypeAny, {
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    district: "Colombo" | "Gampaha" | "Kalutara" | "Kandy" | "Matale" | "Nuwara Eliya" | "Galle" | "Matara" | "Hambantota" | "Jaffna" | "Mannar" | "Vavuniya" | "Mullaitivu" | "Kilinochchi" | "Batticaloa" | "Ampara" | "Trincomalee" | "Kurunegala" | "Puttalam" | "Anuradhapura" | "Polonnaruwa" | "Badulla" | "Moneragala" | "Ratnapura" | "Kegalle";
    postalCode: string | null;
}, {
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    district: "Colombo" | "Gampaha" | "Kalutara" | "Kandy" | "Matale" | "Nuwara Eliya" | "Galle" | "Matara" | "Hambantota" | "Jaffna" | "Mannar" | "Vavuniya" | "Mullaitivu" | "Kilinochchi" | "Batticaloa" | "Ampara" | "Trincomalee" | "Kurunegala" | "Puttalam" | "Anuradhapura" | "Polonnaruwa" | "Badulla" | "Moneragala" | "Ratnapura" | "Kegalle";
    postalCode: string | null;
}>;
export declare const CartItemSchema: z.ZodObject<{
    productId: z.ZodString;
    variantId: z.ZodString;
    sku: z.ZodString;
    quantity: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    productId: string;
    variantId: string;
    sku: string;
    quantity: number;
}, {
    productId: string;
    variantId: string;
    sku: string;
    quantity: number;
}>;
export declare const CheckoutRequestSchema: z.ZodObject<{
    userId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    customerDetails: z.ZodObject<{
        fullName: z.ZodString;
        mobileNumber: z.ZodString;
        email: z.ZodUnion<[z.ZodUnion<[z.ZodNullable<z.ZodString>, z.ZodEffects<z.ZodString, null, string>]>, z.ZodLiteral<null>]>;
    }, "strip", z.ZodTypeAny, {
        fullName: string;
        mobileNumber: string;
        email: string | null;
    }, {
        fullName: string;
        mobileNumber: string;
        email: string | null;
    }>;
    shippingAddress: z.ZodObject<{
        addressLine1: z.ZodString;
        addressLine2: z.ZodEffects<z.ZodUnion<[z.ZodNullable<z.ZodString>, z.ZodLiteral<"">]>, string | null, string | null>;
        city: z.ZodString;
        district: z.ZodEnum<["Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya", "Galle", "Matara", "Hambantota", "Jaffna", "Mannar", "Vavuniya", "Mullaitivu", "Kilinochchi", "Batticaloa", "Ampara", "Trincomalee", "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla", "Moneragala", "Ratnapura", "Kegalle"]>;
        postalCode: z.ZodUnion<[z.ZodUnion<[z.ZodNullable<z.ZodString>, z.ZodEffects<z.ZodString, null, string>]>, z.ZodLiteral<null>]>;
    }, "strip", z.ZodTypeAny, {
        addressLine1: string;
        addressLine2: string | null;
        city: string;
        district: "Colombo" | "Gampaha" | "Kalutara" | "Kandy" | "Matale" | "Nuwara Eliya" | "Galle" | "Matara" | "Hambantota" | "Jaffna" | "Mannar" | "Vavuniya" | "Mullaitivu" | "Kilinochchi" | "Batticaloa" | "Ampara" | "Trincomalee" | "Kurunegala" | "Puttalam" | "Anuradhapura" | "Polonnaruwa" | "Badulla" | "Moneragala" | "Ratnapura" | "Kegalle";
        postalCode: string | null;
    }, {
        addressLine1: string;
        addressLine2: string | null;
        city: string;
        district: "Colombo" | "Gampaha" | "Kalutara" | "Kandy" | "Matale" | "Nuwara Eliya" | "Galle" | "Matara" | "Hambantota" | "Jaffna" | "Mannar" | "Vavuniya" | "Mullaitivu" | "Kilinochchi" | "Batticaloa" | "Ampara" | "Trincomalee" | "Kurunegala" | "Puttalam" | "Anuradhapura" | "Polonnaruwa" | "Badulla" | "Moneragala" | "Ratnapura" | "Kegalle";
        postalCode: string | null;
    }>;
    billingAddress: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        addressLine1: z.ZodString;
        addressLine2: z.ZodEffects<z.ZodUnion<[z.ZodNullable<z.ZodString>, z.ZodLiteral<"">]>, string | null, string | null>;
        city: z.ZodString;
        district: z.ZodEnum<["Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya", "Galle", "Matara", "Hambantota", "Jaffna", "Mannar", "Vavuniya", "Mullaitivu", "Kilinochchi", "Batticaloa", "Ampara", "Trincomalee", "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla", "Moneragala", "Ratnapura", "Kegalle"]>;
        postalCode: z.ZodUnion<[z.ZodUnion<[z.ZodNullable<z.ZodString>, z.ZodEffects<z.ZodString, null, string>]>, z.ZodLiteral<null>]>;
    }, "strip", z.ZodTypeAny, {
        addressLine1: string;
        addressLine2: string | null;
        city: string;
        district: "Colombo" | "Gampaha" | "Kalutara" | "Kandy" | "Matale" | "Nuwara Eliya" | "Galle" | "Matara" | "Hambantota" | "Jaffna" | "Mannar" | "Vavuniya" | "Mullaitivu" | "Kilinochchi" | "Batticaloa" | "Ampara" | "Trincomalee" | "Kurunegala" | "Puttalam" | "Anuradhapura" | "Polonnaruwa" | "Badulla" | "Moneragala" | "Ratnapura" | "Kegalle";
        postalCode: string | null;
    }, {
        addressLine1: string;
        addressLine2: string | null;
        city: string;
        district: "Colombo" | "Gampaha" | "Kalutara" | "Kandy" | "Matale" | "Nuwara Eliya" | "Galle" | "Matara" | "Hambantota" | "Jaffna" | "Mannar" | "Vavuniya" | "Mullaitivu" | "Kilinochchi" | "Batticaloa" | "Ampara" | "Trincomalee" | "Kurunegala" | "Puttalam" | "Anuradhapura" | "Polonnaruwa" | "Badulla" | "Moneragala" | "Ratnapura" | "Kegalle";
        postalCode: string | null;
    }>>>;
    paymentMethod: z.ZodDefault<z.ZodOptional<z.ZodEnum<["online", "cod", "PayHere", "COD"]>>>;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        variantId: z.ZodString;
        sku: z.ZodString;
        quantity: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        productId: string;
        variantId: string;
        sku: string;
        quantity: number;
    }, {
        productId: string;
        variantId: string;
        sku: string;
        quantity: number;
    }>, "many">;
    couponCode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    customerDetails: {
        fullName: string;
        mobileNumber: string;
        email: string | null;
    };
    shippingAddress: {
        addressLine1: string;
        addressLine2: string | null;
        city: string;
        district: "Colombo" | "Gampaha" | "Kalutara" | "Kandy" | "Matale" | "Nuwara Eliya" | "Galle" | "Matara" | "Hambantota" | "Jaffna" | "Mannar" | "Vavuniya" | "Mullaitivu" | "Kilinochchi" | "Batticaloa" | "Ampara" | "Trincomalee" | "Kurunegala" | "Puttalam" | "Anuradhapura" | "Polonnaruwa" | "Badulla" | "Moneragala" | "Ratnapura" | "Kegalle";
        postalCode: string | null;
    };
    paymentMethod: "online" | "cod" | "PayHere" | "COD";
    items: {
        productId: string;
        variantId: string;
        sku: string;
        quantity: number;
    }[];
    userId?: string | null | undefined;
    billingAddress?: {
        addressLine1: string;
        addressLine2: string | null;
        city: string;
        district: "Colombo" | "Gampaha" | "Kalutara" | "Kandy" | "Matale" | "Nuwara Eliya" | "Galle" | "Matara" | "Hambantota" | "Jaffna" | "Mannar" | "Vavuniya" | "Mullaitivu" | "Kilinochchi" | "Batticaloa" | "Ampara" | "Trincomalee" | "Kurunegala" | "Puttalam" | "Anuradhapura" | "Polonnaruwa" | "Badulla" | "Moneragala" | "Ratnapura" | "Kegalle";
        postalCode: string | null;
    } | null | undefined;
    couponCode?: string | null | undefined;
    notes?: string | null | undefined;
}, {
    customerDetails: {
        fullName: string;
        mobileNumber: string;
        email: string | null;
    };
    shippingAddress: {
        addressLine1: string;
        addressLine2: string | null;
        city: string;
        district: "Colombo" | "Gampaha" | "Kalutara" | "Kandy" | "Matale" | "Nuwara Eliya" | "Galle" | "Matara" | "Hambantota" | "Jaffna" | "Mannar" | "Vavuniya" | "Mullaitivu" | "Kilinochchi" | "Batticaloa" | "Ampara" | "Trincomalee" | "Kurunegala" | "Puttalam" | "Anuradhapura" | "Polonnaruwa" | "Badulla" | "Moneragala" | "Ratnapura" | "Kegalle";
        postalCode: string | null;
    };
    items: {
        productId: string;
        variantId: string;
        sku: string;
        quantity: number;
    }[];
    userId?: string | null | undefined;
    billingAddress?: {
        addressLine1: string;
        addressLine2: string | null;
        city: string;
        district: "Colombo" | "Gampaha" | "Kalutara" | "Kandy" | "Matale" | "Nuwara Eliya" | "Galle" | "Matara" | "Hambantota" | "Jaffna" | "Mannar" | "Vavuniya" | "Mullaitivu" | "Kilinochchi" | "Batticaloa" | "Ampara" | "Trincomalee" | "Kurunegala" | "Puttalam" | "Anuradhapura" | "Polonnaruwa" | "Badulla" | "Moneragala" | "Ratnapura" | "Kegalle";
        postalCode: string | null;
    } | null | undefined;
    paymentMethod?: "online" | "cod" | "PayHere" | "COD" | undefined;
    couponCode?: string | null | undefined;
    notes?: string | null | undefined;
}>;
export declare const OrderStatusUpdateSchema: z.ZodObject<{
    status: z.ZodEnum<["pending", "confirmed", "processing", "packed", "dispatched", "delivered", "completed", "cancelled", "returned", "refunded"]>;
    trackingNumber: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    carrier: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    note: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "confirmed" | "processing" | "packed" | "dispatched" | "delivered" | "completed" | "cancelled" | "returned" | "refunded";
    trackingNumber?: string | null | undefined;
    carrier?: string | null | undefined;
    note?: string | null | undefined;
}, {
    status: "pending" | "confirmed" | "processing" | "packed" | "dispatched" | "delivered" | "completed" | "cancelled" | "returned" | "refunded";
    trackingNumber?: string | null | undefined;
    carrier?: string | null | undefined;
    note?: string | null | undefined;
}>;
export declare const ProductVariantSchema: z.ZodObject<{
    sku: z.ZodString;
    price: z.ZodNullable<z.ZodNumber>;
    compareAtPrice: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    attributes: z.ZodObject<{
        size: z.ZodString;
        color: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        size: string;
        color: string;
    }, {
        size: string;
        color: string;
    }>;
}, "strip", z.ZodTypeAny, {
    sku: string;
    price: number | null;
    attributes: {
        size: string;
        color: string;
    };
    compareAtPrice?: number | null | undefined;
}, {
    sku: string;
    price: number | null;
    attributes: {
        size: string;
        color: string;
    };
    compareAtPrice?: number | null | undefined;
}>;
export declare const ProductSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    summary: z.ZodString;
    basePrice: z.ZodNumber;
    categoryIds: z.ZodArray<z.ZodString, "many">;
    images: z.ZodArray<z.ZodString, "many">;
    status: z.ZodEnum<["draft", "published", "archived"]>;
    seo: z.ZodObject<{
        title: z.ZodString;
        description: z.ZodString;
        keywords: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        description: string;
        title: string;
        keywords: string[];
    }, {
        description: string;
        title: string;
        keywords: string[];
    }>;
}, "strip", z.ZodTypeAny, {
    status: "draft" | "published" | "archived";
    name: string;
    description: string;
    summary: string;
    basePrice: number;
    categoryIds: string[];
    images: string[];
    seo: {
        description: string;
        title: string;
        keywords: string[];
    };
}, {
    status: "draft" | "published" | "archived";
    name: string;
    description: string;
    summary: string;
    basePrice: number;
    categoryIds: string[];
    images: string[];
    seo: {
        description: string;
        title: string;
        keywords: string[];
    };
}>;
//# sourceMappingURL=validation.d.ts.map
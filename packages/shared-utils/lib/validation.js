"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductSchema = exports.ProductVariantSchema = exports.OrderStatusUpdateSchema = exports.CheckoutRequestSchema = exports.CartItemSchema = exports.ShippingAddressSchema = exports.CustomerDetailsSchema = void 0;
const zod_1 = require("zod");
const districts_1 = require("./districts");
// Sri Lankan Mobile regex: +947XXXXXXXX, 07XXXXXXXX, 7XXXXXXXX
const LK_MOBILE_REGEX = /^(?:\+94|0)?7[0-9]{8}$/;
exports.CustomerDetailsSchema = zod_1.z.object({
    fullName: zod_1.z.string()
        .min(3, 'Full name must be at least 3 characters long')
        .max(100, 'Full name cannot exceed 100 characters'),
    mobileNumber: zod_1.z.string()
        .regex(LK_MOBILE_REGEX, 'Please enter a valid Sri Lankan mobile number (e.g. 0771234567)'),
    email: zod_1.z.string()
        .email('Please enter a valid email address')
        .nullable()
        .or(zod_1.z.string().length(0).transform(() => null))
        .or(zod_1.z.literal(null))
});
exports.ShippingAddressSchema = zod_1.z.object({
    addressLine1: zod_1.z.string()
        .min(5, 'Address line 1 must be at least 5 characters long')
        .max(150, 'Address is too long'),
    addressLine2: zod_1.z.string()
        .max(150, 'Address line 2 is too long')
        .nullable()
        .or(zod_1.z.literal(''))
        .transform(val => val === '' ? null : val),
    city: zod_1.z.string()
        .min(2, 'City name is too short')
        .max(50, 'City name is too long'),
    district: zod_1.z.enum(districts_1.SRI_LANKAN_DISTRICTS, {
        errorMap: () => ({ message: 'Please select a valid Sri Lankan district' })
    }),
    postalCode: zod_1.z.string()
        .regex(/^[0-9]{5}$/, 'Postal code must be exactly 5 digits')
        .nullable()
        .or(zod_1.z.string().length(0).transform(() => null))
        .or(zod_1.z.literal(null))
});
exports.CartItemSchema = zod_1.z.object({
    productId: zod_1.z.string().min(1, 'Product ID is required'),
    variantId: zod_1.z.string().min(1, 'Variant ID is required'),
    sku: zod_1.z.string().min(1, 'SKU is required'),
    quantity: zod_1.z.number().int().min(1, 'Quantity must be at least 1').max(20, 'Quantity cannot exceed 20 per item')
});
exports.CheckoutRequestSchema = zod_1.z.object({
    userId: zod_1.z.string().nullable().optional(),
    customerDetails: exports.CustomerDetailsSchema,
    shippingAddress: exports.ShippingAddressSchema,
    billingAddress: exports.ShippingAddressSchema.nullable().optional(),
    paymentMethod: zod_1.z.enum(['online', 'cod', 'PayHere', 'COD']).optional().default('online'),
    items: zod_1.z.array(exports.CartItemSchema).min(1, 'Cart must contain at least 1 item'),
    couponCode: zod_1.z.string().nullable().optional(),
    notes: zod_1.z.string().max(500, 'Notes cannot exceed 500 characters').nullable().optional()
});
exports.OrderStatusUpdateSchema = zod_1.z.object({
    status: zod_1.z.enum([
        'pending',
        'confirmed',
        'processing',
        'packed',
        'dispatched',
        'delivered',
        'completed',
        'cancelled',
        'returned',
        'refunded'
    ]),
    trackingNumber: zod_1.z.string().nullable().optional(),
    carrier: zod_1.z.string().nullable().optional(),
    note: zod_1.z.string().max(250).nullable().optional()
});
exports.ProductVariantSchema = zod_1.z.object({
    sku: zod_1.z.string().min(3, 'SKU is required'),
    price: zod_1.z.number().positive('Price must be greater than 0').nullable(),
    compareAtPrice: zod_1.z.number().positive().nullable().optional(),
    attributes: zod_1.z.object({
        size: zod_1.z.string().min(1, 'Size is required'),
        color: zod_1.z.string().min(1, 'Color is required')
    })
});
exports.ProductSchema = zod_1.z.object({
    name: zod_1.z.string().min(3, 'Product name is required'),
    description: zod_1.z.string().min(10, 'Product description must be at least 10 characters'),
    summary: zod_1.z.string().max(250, 'Product summary cannot exceed 250 characters'),
    basePrice: zod_1.z.number().positive('Price must be greater than 0'),
    categoryIds: zod_1.z.array(zod_1.z.string()).min(1, 'Select at least one category'),
    images: zod_1.z.array(zod_1.z.string().url('Invalid image URL')).min(1, 'Add at least one product image'),
    status: zod_1.z.enum(['draft', 'published', 'archived']),
    seo: zod_1.z.object({
        title: zod_1.z.string().max(70, 'Meta title is too long'),
        description: zod_1.z.string().max(160, 'Meta description is too long'),
        keywords: zod_1.z.array(zod_1.z.string())
    })
});
//# sourceMappingURL=validation.js.map
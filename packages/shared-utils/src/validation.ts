import { z } from 'zod';
import { SRI_LANKAN_DISTRICTS } from './districts';

// Sri Lankan Mobile regex: +947XXXXXXXX, 07XXXXXXXX, 7XXXXXXXX
const LK_MOBILE_REGEX = /^(?:\+94|0)?7[0-9]{8}$/;

export const CustomerDetailsSchema = z.object({
  fullName: z.string()
    .min(3, 'Full name must be at least 3 characters long')
    .max(100, 'Full name cannot exceed 100 characters'),
  mobileNumber: z.string()
    .regex(LK_MOBILE_REGEX, 'Please enter a valid Sri Lankan mobile number (e.g. 0771234567)'),
  email: z.string()
    .email('Please enter a valid email address')
    .nullable()
    .or(z.string().length(0).transform(() => null))
    .or(z.literal(null))
});

export const ShippingAddressSchema = z.object({
  addressLine1: z.string()
    .min(5, 'Address line 1 must be at least 5 characters long')
    .max(150, 'Address is too long'),
  addressLine2: z.string()
    .max(150, 'Address line 2 is too long')
    .nullable()
    .or(z.literal(''))
    .transform(val => val === '' ? null : val),
  city: z.string()
    .min(2, 'City name is too short')
    .max(50, 'City name is too long'),
  district: z.enum(SRI_LANKAN_DISTRICTS, {
    errorMap: () => ({ message: 'Please select a valid Sri Lankan district' })
  }),
  postalCode: z.string()
    .regex(/^[0-9]{5}$/, 'Postal code must be exactly 5 digits')
    .nullable()
    .or(z.string().length(0).transform(() => null))
    .or(z.literal(null))
});

export const CartItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().min(1, 'Variant ID is required'),
  sku: z.string().min(1, 'SKU is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(20, 'Quantity cannot exceed 20 per item')
});

export const CheckoutRequestSchema = z.object({
  userId: z.string().nullable().optional(),
  customerDetails: CustomerDetailsSchema,
  shippingAddress: ShippingAddressSchema,
  billingAddress: ShippingAddressSchema.nullable().optional(),
  paymentMethod: z.enum(['online', 'cod', 'PayHere', 'COD']).optional().default('online'),
  items: z.array(CartItemSchema).min(1, 'Cart must contain at least 1 item'),
  couponCode: z.string().nullable().optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').nullable().optional()
});

export const OrderStatusUpdateSchema = z.object({
  status: z.enum([
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
  trackingNumber: z.string().nullable().optional(),
  carrier: z.string().nullable().optional(),
  note: z.string().max(250).nullable().optional()
});

export const ProductVariantSchema = z.object({
  sku: z.string().min(3, 'SKU is required'),
  price: z.number().positive('Price must be greater than 0').nullable(),
  compareAtPrice: z.number().positive().nullable().optional(),
  attributes: z.object({
    size: z.string().min(1, 'Size is required'),
    color: z.string().min(1, 'Color is required')
  })
});

export const ProductSchema = z.object({
  name: z.string().min(3, 'Product name is required'),
  description: z.string().min(10, 'Product description must be at least 10 characters'),
  summary: z.string().max(250, 'Product summary cannot exceed 250 characters'),
  basePrice: z.number().positive('Price must be greater than 0'),
  categoryIds: z.array(z.string()).min(1, 'Select at least one category'),
  images: z.array(z.string().url('Invalid image URL')).min(1, 'Add at least one product image'),
  status: z.enum(['draft', 'published', 'archived']),
  seo: z.object({
    title: z.string().max(70, 'Meta title is too long'),
    description: z.string().max(160, 'Meta description is too long'),
    keywords: z.array(z.string())
  })
});

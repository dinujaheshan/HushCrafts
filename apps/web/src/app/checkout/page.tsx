'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft, ArrowRight, ShoppingBag, MapPin, User,
  Phone, Mail, CheckCircle, Loader2, Package
} from '@/components/MaterialIcons';
import { useCartStore } from '@/store/cartStore';
import { submitCheckout, getProduct } from '@/lib/api';
import { SRI_LANKAN_DISTRICTS } from '@hush-craft/shared-utils';
import { createOrder } from '@/lib/firestoreSync';
import { useAuthStore } from '@/store/authStore';

type Step = 'details' | 'address' | 'review';

interface CheckoutForm {
  fullName: string;
  mobileNumber: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  district: string;
  postalCode: string;
  notes: string;

  sameAsBilling: boolean;
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  billingDistrict?: string;
  billingPostalCode?: string;
  paymentMethod: 'online' | 'cod';
}

const SHIPPING_FEES: Record<string, number> = {
  Colombo: 350,
  Gampaha: 350
};

const DEFAULT_SHIPPING = 500;

function CheckoutContent() {
  const router = useRouter();
  const { items, getSubtotal, shippingFee, setShippingFee, clearCart } = useCartStore();
  const { user, updateUser } = useAuthStore();
  const searchParams = useSearchParams();
  const isBuyNow = searchParams.get('buyNow') === 'true';
  const buyNowProductId = searchParams.get('productId');
  const buyNowVariantId = searchParams.get('variantId');
  const buyNowSku = searchParams.get('sku');
  const buyNowQty = parseInt(searchParams.get('qty') || '1', 10);

  const [buyNowItem, setBuyNowItem] = useState<any>(null);
  const [payhereData, setPayhereData] = useState<any>(null);

  const [step, setStep] = useState<Step>('details');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm<CheckoutForm>({
    defaultValues: {
      district: 'Colombo',
      sameAsBilling: true,
      paymentMethod: 'online'
    }
  });

  const watchedDistrict = watch('district');
  const watchSameAsBilling = watch('sameAsBilling');
  const watchPaymentMethod = watch('paymentMethod');

  // Reset form values once user store is hydrated or user changes
  useEffect(() => {
    if (user) {
      reset({
        district: user.shippingAddress?.district || 'Colombo',
        fullName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name || '',
        mobileNumber: user.mobile || '',
        email: user.email || '',
        addressLine1: user.shippingAddress?.addressLine1 || '',
        addressLine2: user.shippingAddress?.addressLine2 || '',
        city: user.shippingAddress?.city || '',
        postalCode: user.shippingAddress?.postalCode || '',
        sameAsBilling: user.billingAddress ? false : true,
        billingDistrict: user.billingAddress?.district || 'Colombo',
        billingAddressLine1: user.billingAddress?.addressLine1 || '',
        billingAddressLine2: user.billingAddress?.addressLine2 || '',
        billingCity: user.billingAddress?.city || '',
        billingPostalCode: user.billingAddress?.postalCode || '',
        paymentMethod: 'online'
      });
    }
  }, [user, reset]);

  useEffect(() => {
    useCartStore.persist.rehydrate();
    if (isBuyNow && buyNowProductId) {
      getProduct(buyNowProductId).then(res => {
        if (res.success) {
          const product = res.data;
          const variant = product.variants?.find((v: any) => v.id === buyNowVariantId);
          setBuyNowItem({
            productId: buyNowProductId,
            variantId: buyNowVariantId,
            sku: buyNowSku,
            quantity: buyNowQty,
            name: product.name,
            variantName: variant ? `${variant.attributes.color} / ${variant.attributes.size}` : 'Default',
            price: variant?.price ?? product.basePrice,
            image: variant?.image || product.images?.[0] || ''
          });
        }
      });
    }
  }, [isBuyNow, buyNowProductId, buyNowVariantId, buyNowSku, buyNowQty]);

  useEffect(() => {
    const fee = SHIPPING_FEES[watchedDistrict] ?? DEFAULT_SHIPPING;
    setShippingFee(fee);
  }, [watchedDistrict, setShippingFee]);

  const activeItems = isBuyNow && buyNowItem ? [buyNowItem] : items;
  const subtotal = isBuyNow && buyNowItem ? buyNowItem.price * buyNowItem.quantity : getSubtotal();
  const total = subtotal + shippingFee;

  async function onSubmit(data: CheckoutForm) {
    if (activeItems.length === 0) return;
    setSubmitting(true);
    setError(null);

    const billingAddress = data.sameAsBilling
      ? {
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2 || null,
          city: data.city,
          district: data.district,
          postalCode: data.postalCode || null
        }
      : {
          addressLine1: data.billingAddressLine1 || data.addressLine1,
          addressLine2: data.billingAddressLine2 || null,
          city: data.billingCity || data.city,
          district: data.billingDistrict || data.district,
          postalCode: data.billingPostalCode || null
        };

    const res = await submitCheckout({
      userId: user?.uid || null,
      customerDetails: {
        fullName: data.fullName,
        mobileNumber: data.mobileNumber,
        email: data.email || null
      },
      shippingAddress: {
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || null,
        city: data.city,
        district: data.district,
        postalCode: data.postalCode || null
      },
      billingAddress,
      paymentMethod: data.paymentMethod,
      items: activeItems.map(i => ({
        productId: i.productId,
        variantId: i.variantId,
        sku: i.sku,
        quantity: i.quantity
      })),
      notes: data.notes || null
    });

    setSubmitting(false);

    if (res.success) {
      setOrderPlaced(true);

      // Save order to Firestore
      if (user?.uid) {
        const orderItems = activeItems.map(i => ({
          productId: i.productId,
          variantId: i.variantId || `${i.productId}-default`,
          sku: i.sku || `SKU-${i.productId}`,
          name: i.name,
          variantName: i.variantName || 'Standard',
          price: i.price,
          quantity: i.quantity,
          image: i.image || ''
        }));

        const sAddr = {
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2 || null,
          city: data.city,
          district: data.district,
          postalCode: data.postalCode || null
        };

        await createOrder({
          id: res.data.orderId,
          uid: user.uid,
          status: 'pending',
          items: orderItems,
          customerDetails: {
            fullName: data.fullName,
            mobileNumber: data.mobileNumber,
            email: data.email || null
          },
          shippingAddress: sAddr,
          billingAddress,
          paymentMethod: data.paymentMethod === 'cod' ? 'cod' : 'PayHere',
          subtotal,
          shippingFee,
          total,
          notes: data.notes || null
        }).then(() => {
          // Trigger order confirmation email locally via Next.js API route
          if (data.email) {
            import('@/lib/emailTemplates').then(({ getOrderConfirmationTemplate }) => {
              const html = getOrderConfirmationTemplate(
                res.data.orderId,
                data.fullName,
                orderItems,
                total,
                data.paymentMethod
              );
              fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to: data.email,
                  subject: `Order Confirmed - ${res.data.orderId}`,
                  html
                })
              }).catch(e => console.error('Error sending confirmation email:', e));
            });
          }
        }).catch(console.error);

        // Auto-save checkout addresses to user profile in Firestore
        try {
          const { doc, updateDoc } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase');
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            shippingAddress: sAddr,
            billingAddress
          });
        } catch (addrErr) {
          console.error('Error updating profile addresses on checkout:', addrErr);
        }

        // Auto-save to authStore
        updateUser({
          shippingAddress: sAddr,
          billingAddress
        });
      }

      if (data.paymentMethod === 'cod') {
        if (!isBuyNow) clearCart();
        router.push(`/order-confirmation/${res.data.orderId}`);
      } else {
        setPayhereData(res.data);
        setTimeout(() => {
          if (!isBuyNow) clearCart();
          (document.getElementById('payhere-form') as HTMLFormElement)?.submit();
        }, 500);
      }
    } else {
      setSubmitting(false);
      setError(res.error?.message || 'Something went wrong. Please try again.');
    }
  }

  const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
    { key: 'details', label: 'Your Details', icon: <User size={14} /> },
    { key: 'address', label: 'Delivery', icon: <MapPin size={14} /> },
    { key: 'review', label: 'Review Order', icon: <ShoppingBag size={14} /> }
  ];

  if (activeItems.length === 0 && !payhereData && !orderPlaced && (!isBuyNow || (isBuyNow && !buyNowItem))) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <ShoppingBag size={48} className="text-muted-foreground mx-auto" />
          <h1 className="font-serif text-2xl font-semibold text-foreground">Your cart is empty</h1>
          <p className="text-muted-foreground">Add some items before checking out.</p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Browse Collection <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Back link */}
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={14} /> Continue Shopping
        </Link>

        <h1 className="font-serif text-3xl font-semibold text-foreground mb-8"
          style={{ fontFamily: 'var(--font-serif)' }}>
          Checkout
        </h1>

        {/* Step indicator */}
        <div className="flex items-center justify-between gap-1 mb-10 overflow-x-auto pb-4 scrollbar-hide" id="checkout-steps">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center flex-1">
              <button
                onClick={() => {
                  if (s.key === 'details') setStep('details');
                  if (s.key === 'address' && step !== 'details') setStep('address');
                }}
                className="flex items-center gap-2 shrink-0"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s.key
                    ? 'bg-primary text-primary-foreground'
                    : steps.indexOf(steps.find(x => x.key === step)!) > i
                    ? 'bg-green-600 text-white'
                    : 'bg-secondary text-muted-foreground'
                }`}>
                  {steps.indexOf(steps.find(x => x.key === step)!) > i ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${step === s.key ? 'text-primary' : 'text-muted-foreground'}`}>
                  {s.label}
                </span>
              </button>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-px mx-3 transition-colors ${
                  steps.indexOf(steps.find(x => x.key === step)!) > i ? 'bg-green-600' : 'bg-border'
                }`} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col-reverse lg:grid lg:grid-cols-5 gap-8">
            {/* Form area */}
            <div className="lg:col-span-3 space-y-6">

              {/* Step 1: Customer Details */}
              {step === 'details' && (
                <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
                  <h2 className="font-semibold text-lg text-foreground flex items-center gap-2">
                    <User size={18} className="text-primary" /> Your Details
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                        Full Name *
                      </label>
                      <input
                        {...register('fullName', { required: 'Full name is required', minLength: { value: 3, message: 'At least 3 characters' } })}
                        id="checkout-full-name"
                        placeholder="Amaya Perera"
                        className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors bg-background"
                      />
                      {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                        Mobile Number *
                      </label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          {...register('mobileNumber', {
                            required: 'Mobile number is required',
                            pattern: {
                              value: /^(?:\+94|0)?7[0-9]{8}$/,
                              message: 'Enter a valid Sri Lankan number (e.g. 0771234567)'
                            }
                          })}
                          id="checkout-mobile"
                          placeholder="0771234567"
                          className="w-full pl-9 pr-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors bg-background"
                        />
                      </div>
                      {errors.mobileNumber && <p className="text-xs text-destructive mt-1">{errors.mobileNumber.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                        Email (optional — for order confirmation)
                      </label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          {...register('email')}
                          id="checkout-email"
                          type="email"
                          placeholder="hello@example.com"
                          className="w-full pl-9 pr-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors bg-background"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep('address')}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Continue to Delivery <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {/* Step 2: Shipping Address */}
              {step === 'address' && (
                <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-lg text-foreground flex items-center gap-2">
                      <MapPin size={18} className="text-primary" /> Delivery Address
                    </h2>
                    <button type="button" onClick={() => setStep('details')} className="text-xs text-primary hover:underline">
                      ← Back
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                        District *
                      </label>
                      <select
                        {...register('district', { required: 'District is required' })}
                        id="checkout-district"
                        className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors bg-background"
                      >
                        {SRI_LANKAN_DISTRICTS.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      {errors.district && <p className="text-xs text-destructive mt-1">{errors.district.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                        City *
                      </label>
                      <input
                        {...register('city', { required: 'City is required' })}
                        id="checkout-city"
                        placeholder="Colombo"
                        className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors bg-background"
                      />
                      {errors.city && <p className="text-xs text-destructive mt-1">{errors.city.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                        Address Line 1 *
                      </label>
                      <input
                        {...register('addressLine1', { required: 'Address is required', minLength: { value: 5, message: 'At least 5 characters' } })}
                        id="checkout-address1"
                        placeholder="No. 45, Flower Road"
                        className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors bg-background"
                      />
                      {errors.addressLine1 && <p className="text-xs text-destructive mt-1">{errors.addressLine1.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                        Address Line 2 (optional)
                      </label>
                      <input
                        {...register('addressLine2')}
                        id="checkout-address2"
                        placeholder="Apartment, floor, landmark..."
                        className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors bg-background"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                          Postal Code
                        </label>
                        <input
                          {...register('postalCode')}
                          id="checkout-postal"
                          placeholder="00300"
                          className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors bg-background"
                        />
                      </div>
                      <div className="flex items-end">
                        <div className="w-full p-3 bg-secondary/60 rounded-xl text-xs text-muted-foreground text-center">
                          🚚 Shipping: <strong className="text-foreground">LKR {shippingFee}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Same as Billing Checkbox */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                      <input
                        type="checkbox"
                        id="checkout-same-as-billing"
                        {...register('sameAsBilling')}
                        className="w-4 h-4 text-primary focus:ring-primary border-border rounded"
                      />
                      <label htmlFor="checkout-same-as-billing" className="text-sm font-medium text-foreground select-none cursor-pointer">
                        Billing Address is the same as Shipping Address
                      </label>
                    </div>

                    {!watchSameAsBilling && (
                      <div className="space-y-4 pt-4 border-t border-border">
                        <h3 className="font-semibold text-base text-foreground">Billing Address</h3>
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                            Billing District *
                          </label>
                          <select
                            {...register('billingDistrict', { required: !watchSameAsBilling ? 'Billing district is required' : false })}
                            id="checkout-billing-district"
                            className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors bg-background"
                          >
                            {SRI_LANKAN_DISTRICTS.map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                          {errors.billingDistrict && <p className="text-xs text-destructive mt-1">{errors.billingDistrict.message}</p>}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                            Billing City *
                          </label>
                          <input
                            {...register('billingCity', { required: !watchSameAsBilling ? 'Billing city is required' : false })}
                            id="checkout-billing-city"
                            placeholder="Colombo"
                            className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors bg-background"
                          />
                          {errors.billingCity && <p className="text-xs text-destructive mt-1">{errors.billingCity.message}</p>}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                            Billing Address Line 1 *
                          </label>
                          <input
                            {...register('billingAddressLine1', { required: !watchSameAsBilling ? 'Billing address is required' : false })}
                            id="checkout-billing-address1"
                            placeholder="No. 45, Flower Road"
                            className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors bg-background"
                          />
                          {errors.billingAddressLine1 && <p className="text-xs text-destructive mt-1">{errors.billingAddressLine1.message}</p>}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                            Billing Address Line 2 (optional)
                          </label>
                          <input
                            {...register('billingAddressLine2')}
                            id="checkout-billing-address2"
                            placeholder="Apartment, floor, landmark..."
                            className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors bg-background"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                            Billing Postal Code
                          </label>
                          <input
                            {...register('billingPostalCode')}
                            id="checkout-billing-postal"
                            placeholder="00300"
                            className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors bg-background"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                        Order Notes (optional)
                      </label>
                      <textarea
                        {...register('notes')}
                        id="checkout-notes"
                        rows={3}
                        placeholder="Any special instructions for your order..."
                        className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors bg-background resize-none"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep('review')}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Review Order <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {/* Step 3: Review & Place Order */}
              {step === 'review' && (
                <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-lg text-foreground flex items-center gap-2">
                      <ShoppingBag size={18} className="text-primary" /> Review Your Order
                    </h2>
                    <button type="button" onClick={() => setStep('address')} className="text-xs text-primary hover:underline">
                      ← Back
                    </button>
                  </div>

                  {/* Items review */}
                  <div className="space-y-3">
                    {activeItems.map((item: any) => (
                      <div key={item.variantId} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                        <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                          <Package size={18} className="text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground line-clamp-1">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.variantName} × {item.quantity}</p>
                        </div>
                        <span className="text-sm font-semibold text-primary">
                          LKR {(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-3 pt-2">
                    <h3 className="font-semibold text-base text-foreground">Select Payment Method</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        watchPaymentMethod === 'online'
                          ? 'border-primary bg-primary/5 text-primary font-medium'
                          : 'border-border hover:border-primary/50 text-foreground/80'
                      }`}>
                        <input
                          type="radio"
                          value="online"
                          {...register('paymentMethod')}
                          className="w-4 h-4 text-primary focus:ring-primary border-border"
                        />
                        <div>
                          <p className="text-sm font-semibold">Online Payment</p>
                          <p className="text-[10px] opacity-75">Pay via PayHere Portal</p>
                        </div>
                      </label>

                      <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        watchPaymentMethod === 'cod'
                          ? 'border-primary bg-primary/5 text-primary font-medium'
                          : 'border-border hover:border-primary/50 text-foreground/80'
                      }`}>
                        <input
                          type="radio"
                          value="cod"
                          {...register('paymentMethod')}
                          className="w-4 h-4 text-primary focus:ring-primary border-border"
                        />
                        <div>
                          <p className="text-sm font-semibold">Cash on Delivery (COD)</p>
                          <p className="text-[10px] opacity-75">Pay in cash on delivery</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {watchPaymentMethod === 'online' ? (
                    <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                      <p className="text-sm font-semibold text-primary mb-1">💳 SECURE ONLINE PAYMENT</p>
                      <p className="text-xs text-muted-foreground">
                        You will be redirected to PayHere to securely complete your payment of <strong className="text-foreground">LKR {total.toLocaleString()}</strong>.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                      <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-1">🚚 CASH ON DELIVERY (COD)</p>
                      <p className="text-xs text-muted-foreground">
                        Order total of <strong className="text-foreground">LKR {total.toLocaleString()}</strong> will be paid in cash to our delivery partner.
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="p-4 bg-destructive/10 rounded-xl border border-destructive/30 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    id="place-order-btn"
                    disabled={submitting || (watchPaymentMethod === 'online' && payhereData !== null)}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-base hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      watchPaymentMethod === 'online' ? (
                        <><Loader2 size={18} className="animate-spin" /> Redirecting to PayHere...</>
                      ) : (
                        <><Loader2 size={18} className="animate-spin" /> Placing Order...</>
                      )
                    ) : watchPaymentMethod === 'online' && payhereData !== null ? (
                      <><Loader2 size={18} className="animate-spin" /> Redirecting to PayHere...</>
                    ) : (
                      <>Place Order (LKR {total.toLocaleString()}) <ArrowRight size={16} /></>
                    )}
                  </button>

                </div>
              )}
            </div>

            {/* Order summary sidebar */}
            <div className="lg:col-span-2">
              <div className="sticky top-24 bg-card rounded-2xl border border-border p-5 space-y-4">
                <h3 className="font-semibold text-foreground">Order Summary</h3>

                <div className="space-y-2.5 max-h-60 overflow-y-auto">
                  {activeItems.map((item: any) => (
                    <div key={item.variantId} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground line-clamp-1 flex-1">
                        {item.name} <span className="text-xs">×{item.quantity}</span>
                      </span>
                      <span className="font-medium text-foreground ml-2 shrink-0">
                        LKR {(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-3 space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>LKR {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Shipping</span>
                    <span>LKR {shippingFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-foreground border-t border-border pt-2 text-base">
                    <span>Total</span>
                    <span className="text-primary">LKR {total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-[10px] text-muted-foreground text-center leading-relaxed">
                  By placing your order, you agree to our
                  <Link href="/terms" className="text-primary hover:underline mx-1">Terms of Service</Link>
                  and
                  <Link href="/privacy" className="text-primary hover:underline ml-1">Privacy Policy</Link>.
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Hidden PayHere Form - Moved outside main form */}
        {payhereData && (
          <form id="payhere-form" method="post" action="https://sandbox.payhere.lk/pay/checkout" className="hidden">
            <input type="hidden" name="merchant_id" value={payhereData.merchantId} />
            <input type="hidden" name="return_url" value={payhereData.returnUrl} />
            <input type="hidden" name="cancel_url" value={payhereData.cancelUrl} />
            <input type="hidden" name="notify_url" value={payhereData.notifyUrl} />
            
            <input type="hidden" name="order_id" value={payhereData.orderId} />
            <input type="hidden" name="items" value={payhereData.orderTitle} />
            <input type="hidden" name="currency" value="LKR" />
            <input type="hidden" name="amount" value={payhereData.amount} />
            
            <input type="hidden" name="first_name" value={payhereData.firstName} />
            <input type="hidden" name="last_name" value={payhereData.lastName} />
            <input type="hidden" name="email" value={payhereData.email} />
            <input type="hidden" name="phone" value={payhereData.phone} />
            <input type="hidden" name="address" value={payhereData.address} />
            <input type="hidden" name="city" value={payhereData.city} />
            <input type="hidden" name="country" value="Sri Lanka" />
            <input type="hidden" name="hash" value={payhereData.hash} />
          </form>
        )}
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">Loading checkout...</p>
        </div>
      </main>
    }>
      <CheckoutContent />
    </Suspense>
  );
}

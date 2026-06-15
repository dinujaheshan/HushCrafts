'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Minus, Plus, ShoppingBag, Trash2, ArrowRight } from '@/components/MaterialIcons';
import { useCartStore } from '@/store/cartStore';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, getSubtotal, getTotal, shippingFee } = useCartStore();

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const subtotal = getSubtotal();
  const total = getTotal();

  return (
    <>
      {/* Backdrop */}
      <div
        id="cart-drawer-backdrop"
        className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <aside
        id="cart-drawer"
        role="dialog"
        aria-label="Shopping cart"
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-background shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}> 
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-primary" />
            <h2 className="font-serif text-lg font-semibold text-foreground">
              Your Cart
              {items.length > 0 && (
                <span className="ml-2 text-sm font-sans font-normal text-muted-foreground">
                  ({items.reduce((n, i) => n + i.quantity, 0)} items)
                </span>
              )}
            </h2>
          </div>
          <button
            id="cart-drawer-close"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary transition-colors text-foreground/60"
            aria-label="Close cart"
          >
            <X size={16} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto py-4 px-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
                <ShoppingBag size={32} className="text-primary/40" />
              </div>
              <div>
                <p className="font-medium text-foreground">Your cart is empty</p>
                <p className="text-sm text-muted-foreground mt-1">Add some beautiful slippers!</p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.variantId} className="flex gap-3 py-3 border-b border-border/50 last:border-0">
                  {/* Image */}
                  <div className="w-18 h-18 rounded-lg overflow-hidden bg-secondary flex-shrink-0 relative" style={{ width: 72, height: 72 }}>
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="72px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <ShoppingBag size={24} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground leading-tight line-clamp-1">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.variantName}</p>

                    <div className="flex items-center justify-between mt-2">
                      {/* Qty control */}
                      <div className="flex items-center gap-1.5 border border-border rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-secondary transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-secondary transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-primary">
                          LKR {(item.price * item.quantity).toLocaleString()}
                        </span>
                        <button
                          onClick={() => removeItem(item.variantId)}
                          className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer summary */}
        {items.length > 0 && (
          <div className="border-t border-border px-5 py-5 space-y-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>LKR {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Shipping (estimate)</span>
              <span>LKR {shippingFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-semibold text-foreground border-t border-border pt-3">
              <span>Total</span>
              <span className="text-primary text-lg">LKR {total.toLocaleString()}</span>
            </div>

            <Link
              href="/checkout"
              onClick={onClose}
              id="cart-drawer-checkout-btn"
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors mt-4"
            >
              Proceed to Checkout <ArrowRight size={16} />
            </Link>

            <button
              onClick={onClose}
              className="w-full py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

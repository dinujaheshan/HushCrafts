import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Package, Phone, ArrowRight, Home } from '@/components/MaterialIcons';

export const metadata: Metadata = {
  title: 'Order Confirmed',
  description: 'Your Hush Craft order has been placed successfully. Thank you for shopping with us!'
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderConfirmationPage({ params }: Props) {
  const { id } = await params;

  return (
    <main className="min-h-screen py-16">
      <div className="container mx-auto px-4 max-w-2xl text-center">
        {/* Success icon */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle size={52} className="text-green-600" />
          </div>
        </div>

        <h1 className="font-serif text-4xl font-semibold text-foreground mb-3"
          style={{ fontFamily: 'var(--font-serif)' }}>
          Order Confirmed! 🎉
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed mb-2">
          Thank you for shopping with <strong className="text-primary">Hush Craft</strong>.
        </p>
        <p className="text-muted-foreground">
          Your handcrafted slippers are being prepared with love.
        </p>

        {/* Order ID card */}
        <div className="mt-8 bg-card rounded-2xl border border-border p-6 text-left">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Package size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Order ID</p>
              <p className="font-mono font-bold text-foreground text-lg">{id}</p>
            </div>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0 mt-0.5">1</div>
              <div>
                <p className="font-medium text-sm text-foreground">Order Received</p>
                <p className="text-xs text-muted-foreground">We&apos;ve received your order and will start preparing it shortly.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 opacity-50">
              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-muted-foreground text-xs font-bold shrink-0 mt-0.5">2</div>
              <div>
                <p className="font-medium text-sm text-foreground">Being Prepared</p>
                <p className="text-xs text-muted-foreground">Your slippers will be carefully handcrafted and packaged.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 opacity-50">
              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-muted-foreground text-xs font-bold shrink-0 mt-0.5">3</div>
              <div>
                <p className="font-medium text-sm text-foreground">Out for Delivery</p>
                <p className="text-xs text-muted-foreground">Your order will be dispatched and on its way to you.</p>
              </div>
            </div>
          </div>
        </div>

        {/* COD notice */}
        <div className="mt-6 p-5 bg-secondary/60 rounded-2xl border border-secondary text-left">
          <div className="flex items-start gap-3">
            <Phone size={18} className="text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-sm text-foreground mb-1">
                Cash on Delivery Reminder
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Our delivery partner will call you before arriving. Please have the exact cash amount ready.
                Your order total will be confirmed via SMS or WhatsApp.
              </p>
            </div>
          </div>
        </div>

        {/* Email confirmation note */}
        <p className="mt-6 text-xs text-muted-foreground">
          If you provided an email, you&apos;ll receive a confirmation shortly.
          For tracking or queries, contact us at{' '}
          <a href="mailto:hello@hushcraft.lk" className="text-primary hover:underline">
            hello@hushcraft.lk
          </a>
          {' '}or WhatsApp{' '}
          <a href="https://wa.me/94771234567" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            +94 77 123 4567
          </a>.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mt-10 justify-center">
          <Link
            href="/shop"
            id="continue-shopping-btn"
            className="flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Continue Shopping <ArrowRight size={16} />
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-8 py-3.5 border border-border text-foreground rounded-xl font-medium hover:bg-secondary transition-colors"
          >
            <Home size={16} /> Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

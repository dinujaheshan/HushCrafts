import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Package, CreditCard, Truck, RefreshCw, Scale } from '@/components/MaterialIcons';

export const metadata: Metadata = {
  title: 'Terms of Service | Hush Craft',
  description: 'Review the terms and conditions governing the use of Hush Craft website and our purchasing agreement.',
};

export default function TermsOfServicePage() {
  const lastUpdated = 'June 14, 2026';

  const sections = [
    {
      icon: <Package className="text-primary" size={24} />,
      title: '1. Products & Handmade Character',
      content: (
        <p>
          Hush Craft slippers are individually handcrafted by local Sri Lankan artisans. 
          Due to the nature of handmade work, slight variations in stitching, color tone, and texture are natural characteristics that make each pair unique. 
          We make every effort to display product images as accurately as possible, but variations can occur.
        </p>
      ),
    },
    {
      icon: <CreditCard className="text-primary" size={24} />,
      title: '2. Pricing and Payment',
      content: (
        <div className="space-y-3">
          <p>
            All prices listed on our website are in Sri Lankan Rupees (LKR). We reserve the right to update product prices at any time. We support multiple payment methods:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Cash on Delivery (COD) for convenience island-wide.</li>
            <li>Direct Bank Transfer (requires receipt verification).</li>
            <li>Secure Credit/Debit Card payment methods online.</li>
          </ul>
        </div>
      ),
    },
    {
      icon: <Truck className="text-primary" size={24} />,
      title: '3. Deliveries and Shipping Policy',
      content: (
        <p>
          We offer island-wide shipping in Sri Lanka. Orders are typically processed and shipped within 1–2 business days. 
          Delivery takes 2–5 business days depending on location. 
          Free delivery is automatically applied on all orders exceeding LKR 3,000. 
          Hush Craft is not liable for shipping delays caused by unexpected courier service issues.
        </p>
      ),
    },
    {
      icon: <RefreshCw className="text-primary" size={24} />,
      title: '4. Returns and Exchanges',
      content: (
        <p>
          Your satisfaction is our priority. We offer a 7-day hassle-free return policy from the date of delivery. 
          Returned slippers must be unworn, undamaged, and kept in their original packaging. 
          Please contact our customer support team via WhatsApp (+94 71 367 0089) or email to initiate a return or exchange.
        </p>
      ),
    },
    {
      icon: <Scale className="text-primary" size={24} />,
      title: '5. Intellectual Property and Governing Law',
      content: (
        <p>
          All content included on this website, including designs, text, logos, custom images, graphics, and animations, is the property of Hush Craft and is protected by intellectual property laws. 
          These terms and agreements are governed by and construed in accordance with the laws of Sri Lanka.
        </p>
      ),
    },
  ];

  return (
    <main className="min-h-screen py-16 bg-gradient-to-br from-muted/20 via-transparent to-muted/10">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="space-y-4 mb-12 border-b border-border/80 pb-8">
          <h1 className="font-serif text-4xl md:text-5xl font-semibold text-foreground"
              style={{ fontFamily: 'var(--font-serif)' }}>
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Last updated: <span className="text-foreground">{lastUpdated}</span>
          </p>
          <p className="text-base text-muted-foreground leading-relaxed">
            Welcome to Hush Craft. By using our website or placing an order, you agree to comply with and be bound by the following terms and conditions. Please read them carefully.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {sections.map((sec, idx) => (
            <div
              key={idx}
              className="bg-background border border-border/60 rounded-2xl p-6 md:p-8 hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  {sec.icon}
                </div>
                <h2 className="text-xl font-semibold text-foreground">{sec.title}</h2>
              </div>
              <div className="text-muted-foreground text-sm leading-relaxed pl-1">
                {sec.content}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Footer */}
        <div className="mt-12 text-center bg-primary/5 border border-primary/10 rounded-2xl p-8">
          <h3 className="font-semibold text-lg text-foreground mb-2">Have Questions About Our Terms?</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
            If you need clarification regarding our purchase agreements, returns, or shipping terms, contact us.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 text-sm font-semibold">
            <a href="mailto:hushcrafts26@gmail.com" className="text-primary hover:underline">
              hushcrafts26@gmail.com
            </a>
            <span className="hidden sm:inline text-muted-foreground/40">•</span>
            <a href="tel:+94713670089" className="text-primary hover:underline">
              +94 71 367 0089
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

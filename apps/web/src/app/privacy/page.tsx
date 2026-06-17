import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Eye, CheckCircle } from '@/components/MaterialIcons';

export const metadata: Metadata = {
  title: 'Privacy Policy | Hush Crafts',
  description: 'Learn how Hush Crafts collects, uses, and protects your personal information. Your privacy is our priority.',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'June 14, 2026';

  const sections = [
    {
      icon: <Shield className="text-primary" size={24} />,
      title: '1. Information We Collect',
      content: (
        <div className="space-y-3">
          <p>
            We collect information you provide directly to us when creating an account, placing an order, subscribing to our newsletter, or contacting customer support. This information may include:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Personal Identifiers: Name, email address, phone number, shipping and billing addresses.</li>
            <li>Transaction Details: Products purchased, transaction amount, date of purchase.</li>
            <li>Account Details: Password hashes (stored securely) and communication preferences.</li>
          </ul>
        </div>
      ),
    },
    {
      icon: <Lock className="text-primary" size={24} />,
      title: '2. How We Use Your Information',
      content: (
        <div className="space-y-3">
          <p>
            Hush Crafts uses your personal data to provide a seamless shopping experience. Specific uses include:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Order Processing: Processing payments, printing shipping labels, and managing deliveries across Sri Lanka.</li>
            <li>Customer Support: Addressing queries, handling returns, and resolving product issues.</li>
            <li>Marketing Communication: Sending updates, newsletters, and promotional offers (only if you have opted in). You can opt out at any time.</li>
            <li>Platform Improvement: Analyzing website usage patterns to optimize user experience and security.</li>
          </ul>
        </div>
      ),
    },
    {
      icon: <Eye className="text-primary" size={24} />,
      title: '3. Sharing of Information',
      content: (
        <div className="space-y-3">
          <p>
            We respect your privacy and will never sell, rent, or trade your personal information to third parties. We only share information with trusted service partners to fulfill your orders:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Delivery Partners: Sri Lankan courier services to deliver your packages to your doorstep.</li>
            <li>Payment Processors: Secure payment gateways for processing card payments. Your credit card details are encrypted and never stored on our servers.</li>
            <li>Legal Obligations: If required by Sri Lankan law or regulatory authorities.</li>
          </ul>
        </div>
      ),
    },
    {
      icon: <CheckCircle className="text-primary" size={24} />,
      title: '4. Security and Retention',
      content: (
        <p>
          We employ robust administrative, technical, and physical security measures (including SSL/TLS encryption) to protect your personal data against unauthorized access, loss, or alteration. We retain your information only as long as necessary to fulfill the transactions and comply with legal requirements.
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
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Last updated: <span className="text-foreground">{lastUpdated}</span>
          </p>
          <p className="text-base text-muted-foreground leading-relaxed">
            At Hush Crafts, we are committed to safeguarding the privacy of our website visitors and customers. 
            This policy outlines how we handle, protect, and respect your personal information.
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
          <h3 className="font-semibold text-lg text-foreground mb-2">Have Questions About Your Privacy?</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
            If you have any questions or concern regarding how we handle your personal data, feel free to contact us.
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

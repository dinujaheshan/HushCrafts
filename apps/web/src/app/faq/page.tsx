import type { Metadata } from 'next';
import { ChevronDown } from '@/components/MaterialIcons';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | Hush Craft',
  description: 'Find answers to your questions about shipping, returns, sizing, and product care.',
};

export default function FAQPage() {
  const faqs = [
    {
      question: 'How long does shipping take?',
      answer: 'Standard island-wide shipping typically takes 3-5 business days. Express shipping is available within Colombo limits for next-day delivery.'
    },
    {
      question: 'What is your return policy?',
      answer: 'We accept returns within 7 days of delivery for unworn items in their original condition and packaging. Please contact our support team to initiate a return.'
    },
    {
      question: 'Are your slippers true to size?',
      answer: 'Yes, our slippers fit true to standard Asian sizing. If you are between sizes, we recommend sizing up for open-toed sandals and true-to-size for closed mules.'
    },
    {
      question: 'How do I clean my handmade slippers?',
      answer: 'For fabric flowers and straps, gently dab with a damp cloth. Do not machine wash. Keep them away from extreme heat and prolonged direct sunlight to preserve the colors.'
    },
    {
      question: 'Do you offer custom designs?',
      answer: 'Currently, we focus on our curated collections, but we do occasionally take custom color requests for bridal parties or large events. Please email us for inquiries.'
    }
  ];

  return (
    <main className="py-20 min-h-[70vh]">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="font-serif text-4xl font-semibold text-foreground mb-4 text-center">Frequently Asked Questions</h1>
        <p className="text-center text-muted-foreground mb-12">Everything you need to know about our products and services.</p>
        
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <details key={idx} className="group border border-border bg-card rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between gap-4 p-6 font-medium cursor-pointer hover:text-primary transition-colors">
                <span>{faq.question}</span>
                <ChevronDown size={18} className="text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-6 pb-6 text-muted-foreground text-sm leading-relaxed border-t border-border/50 pt-4">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
        
        <div className="mt-16 text-center p-8 bg-primary/5 rounded-3xl border border-primary/10">
          <h2 className="font-serif text-xl font-semibold text-foreground mb-2">Still have questions?</h2>
          <p className="text-muted-foreground text-sm mb-6">We're here to help. Send us a message and we'll respond as soon as possible.</p>
          <a href="mailto:hushcrafts26@gmail.com" className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors">
            Contact Support
          </a>
        </div>
      </div>
    </main>
  );
}

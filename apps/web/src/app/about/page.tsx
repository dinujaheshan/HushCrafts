import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Star, Award, Users, Sparkles, ArrowRight } from '@/components/MaterialIcons';

export const metadata: Metadata = {
  title: 'About Us | Hush Craft',
  description: 'Learn the story behind Hush Craft — handcrafted slippers made with love in Sri Lanka by passionate artisans.',
};

const values = [
  {
    icon: <Heart size={24} />,
    title: 'Made with Love',
    description: 'Every pair is handcrafted by skilled artisans who pour their heart into every stitch and detail.'
  },
  {
    icon: <Award size={24} />,
    title: 'Premium Quality',
    description: 'We source only the finest materials to ensure your slippers are as durable as they are beautiful.'
  },
  {
    icon: <Users size={24} />,
    title: 'Community First',
    description: 'We support local craftspeople and give back to the communities that make our products possible.'
  },
  {
    icon: <Sparkles size={24} />,
    title: 'Unique Designs',
    description: 'From vibrant florals to minimalist elegance — each design is crafted to express your individual style.'
  },
];

const stats = [
  { value: '500+', label: 'Happy Customers' },
  { value: '50+', label: 'Unique Designs' },
  { value: '100%', label: 'Handcrafted' },
  { value: '2+', label: 'Years of Craft' },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-primary/5 via-background to-primary/10 overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(var(--primary)/0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsl(var(--primary)/0.1) 0%, transparent 40%)'
        }} />
        <div className="container mx-auto px-4 text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest mb-6">
            <Heart size={12} /> Our Story
          </span>
          <h1 className="font-serif text-5xl md:text-7xl font-semibold text-foreground mb-6 leading-tight"
            style={{ fontFamily: 'var(--font-serif)' }}>
            Crafted with <span className="text-primary">Heart</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Hush Craft was born from a simple belief — every woman deserves footwear that feels as beautiful as it looks. We create handmade slippers that tell a story.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/logo.jpg"
                  alt="Hush Craft Artisan"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent" />
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-4 right-4 md:-bottom-6 md:-right-6 bg-primary text-primary-foreground rounded-2xl p-5 shadow-xl">
                <Star size={20} className="mb-1 fill-current" />
                <p className="font-bold text-2xl leading-none">4.9</p>
                <p className="text-xs opacity-80 mt-1">Avg Rating</p>
              </div>
            </div>

            <div>
              <h2 className="font-serif text-4xl font-semibold text-foreground mb-6"
                style={{ fontFamily: 'var(--font-serif)' }}>
                How It All Began
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Hush Craft started as a passion project in Pitakotte, Sri Lanka — a small home workshop with big dreams. Our founder, inspired by the rich tradition of Sri Lankan craftsmanship, wanted to bring elegant, handmade footwear to women who appreciate artistry in everyday things.
                </p>
                <p>
                  Each pair of Hush Craft slippers is made by hand, using carefully selected fabrics, floral embellishments, and thoughtful construction. No two pairs are ever exactly the same — just like the women who wear them.
                </p>
                <p>
                  What started as a small side hustle has grown into a beloved brand, delivering comfort and elegance island-wide. We&apos;re proud to say that every Hush Craft slipper carries a piece of our soul.
                </p>
              </div>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 mt-8 px-8 py-3.5 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                Shop Our Collection <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-serif text-4xl md:text-5xl font-bold text-primary-foreground mb-2"
                  style={{ fontFamily: 'var(--font-serif)' }}>
                  {stat.value}
                </p>
                <p className="text-primary-foreground/70 text-sm font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="font-serif text-4xl font-semibold text-foreground mb-4"
              style={{ fontFamily: 'var(--font-serif)' }}>
              What We Stand For
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Our values guide every decision we make — from the materials we choose to the way we treat our customers.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((val) => (
              <div key={val.title} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-md transition-all group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {val.icon}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{val.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{val.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-4xl font-semibold text-foreground mb-4"
            style={{ fontFamily: 'var(--font-serif)' }}>
            Ready to Step Into Elegance?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Browse our latest collection and find the perfect pair that speaks to your style.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop" className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-all hover:shadow-lg hover:-translate-y-0.5">
              Shop Now <ArrowRight size={18} />
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-3.5 border border-border text-foreground rounded-full font-semibold hover:border-primary hover:text-primary transition-all">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

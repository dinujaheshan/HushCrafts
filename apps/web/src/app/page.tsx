import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Star,
  Shield,
  Truck,
  RefreshCw,
  Heart,
} from '@/components/MaterialIcons';
import { getFeaturedProducts, getCategories } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import HeroCarousel from '@/components/HeroCarousel';
import DotGridBackground from '@/components/DotGridBackground';
import TikTokSection from '@/components/TikTokSection';
import InteractiveDotText from '@/components/InteractiveDotText';
import TestimonialSlider from '@/components/TestimonialSlider';
import CategoryCarousel from '@/components/CategoryCarousel';

export const metadata: Metadata = {
  title: 'Hush Crafts | Luxury Handmade Slippers Sri Lanka',
  description:
    'Discover premium handmade slippers crafted with love in Sri Lanka. Elegant, comfortable, and uniquely yours. Free island-wide shipping on orders over LKR 3,000.',
  openGraph: {
    title: 'Hush Crafts | Luxury Handmade Slippers Sri Lanka',
    description: 'Premium handmade slippers crafted with love in Sri Lanka.',
    images: [{ url: '/images/new-hero-1.png', width: 1200, height: 630, alt: 'Hush Crafts handmade slippers collection' }],
    type: 'website',
  },
};

// Revalidate every 10 minutes for near-real-time data
export const revalidate = 600;

async function getHomeData() {
  const [featuredRes, categoriesRes] = await Promise.all([
    getFeaturedProducts(),
    getCategories()
  ]);

  return {
    bestSellers: featuredRes.success ? featuredRes.data.bestSellers.slice(0, 8) : [],
    newArrivals: featuredRes.success ? featuredRes.data.newArrivals.slice(0, 8) : [],
    categories: categoriesRes.success ? categoriesRes.data.categories : []
  };
}

export default async function HomePage() {
  const { bestSellers, newArrivals, categories } = await getHomeData();

  const testimonials = [
    {
      id: 1,
      name: 'Amaya Perera',
      location: 'Colombo',
      rating: 5,
      text: 'Absolutely in love with my Hush Crafts slippers! The quality is unreal for the price. Soft, elegant, and everyone keeps asking where I got them.',
      avatar: 'AP'
    },
    {
      id: 2,
      name: 'Dilani Fernando',
      location: 'Kandy',
      rating: 5,
      text: 'Ordered as a gift for my mom and she cried happy tears. The packaging was so beautiful and the slippers fit perfectly. 100% ordering again!',
      avatar: 'DF'
    },
    {
      id: 3,
      name: 'Sanduni Jayawardena',
      location: 'Galle',
      rating: 5,
      text: "I've tried many handmade slipper brands but nothing comes close to Hush Crafts. The attention to detail is incredible and delivery was super fast!",
      avatar: 'SJ'
    }
  ];

  const features = [
    {
      icon: <Heart size={20} aria-hidden="true" />,
      title: 'Handcrafted with Love',
      desc: 'Every pair is individually crafted by skilled artisans using premium materials.'
    },
    {
      icon: <Truck size={20} aria-hidden="true" />,
      title: 'Island-wide Delivery',
      desc: 'Free delivery across Sri Lanka for orders over LKR 3,000. Cash on delivery available.'
    },
    {
      icon: <Shield size={20} aria-hidden="true" />,
      title: 'Quality Guaranteed',
      desc: "We stand behind every pair we sell. Unhappy? We'll make it right."
    },
    {
      icon: <RefreshCw size={20} aria-hidden="true" />,
      title: 'Easy Returns',
      desc: '7-day hassle-free return policy on all unworn items in original packaging.'
    }
  ];

  return (
    <main>
      {/* ─── HERO ─────────────────────────────────────────────────────────────── */}
      <section
        id="hero"
        aria-label="Hero — Step Into Elegance"
        className="relative min-h-[85vh] flex items-center overflow-hidden bg-gradient-to-br from-muted/30 via-transparent to-muted/10 z-10"
      >
        <DotGridBackground />
        {/* Decorative circles */}
        <div aria-hidden="true" className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-20 bg-[radial-gradient(circle,var(--primary),transparent)]" />
        <div aria-hidden="true" className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full opacity-10 bg-[radial-gradient(circle,var(--secondary),transparent)]" />

        <div className="container mx-auto px-6 lg:px-16 py-16 md:py-20">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-stretch">
            {/* Hero Carousel — first on mobile, right on desktop */}
            <div className="relative w-full h-72 sm:h-96 md:h-auto md:min-h-[480px] md:order-last">
              <HeroCarousel />
            </div>

            {/* Hero text — second on mobile, left on desktop */}
            <div className="space-y-5 md:space-y-6 md:flex md:flex-col md:justify-center">
              <h1
                className="text-5xl sm:text-5xl md:text-6xl font-serif font-semibold text-foreground leading-tight"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                Step Into
                <br />
                <span className="text-primary italic">Elegance</span>
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
                Discover our collection of premium handmade slippers — crafted for women who
                appreciate beauty in the details. Each pair tells a story.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/shop"
                  id="hero-shop-cta"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  Shop Collection <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <Link
                  href="/shop?filter=bestsellers"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-primary/20 text-primary rounded-xl font-semibold hover:border-primary hover:bg-primary/5 transition-all"
                >
                  Best Sellers
                </Link>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-4 pt-2">
                <div className="flex -space-x-2" aria-hidden="true">
                  {['A', 'D', 'S', 'M'].map((l, i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-xs font-bold text-white ${
                        ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-destructive'][i]
                      }`}
                    >
                      {l}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-0.5" aria-label="5 star rating">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} className="text-amber-400 fill-amber-400" aria-hidden="true" />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Loved by <strong className="text-foreground">2,000+</strong> customers
                  </p>
                </div>
              </div>

              {/* Interactive Dot Text Animation */}
              <div className="w-full h-28 md:h-36 relative mt-6 md:mt-10" aria-hidden="true">
                <InteractiveDotText text="Hush Crafts" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CATEGORY CAROUSEL ────────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section id="categories" aria-label="Shop by Category" className="py-10 bg-background border-b border-border/40">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">
                  Browse by Style
                </p>
                <h2
                  className="font-serif text-2xl md:text-3xl font-semibold text-foreground"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  Shop by Category
                </h2>
              </div>
              <Link
                href="/shop"
                className="hidden md:flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all"
              >
                View All <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <CategoryCarousel categories={categories} />
        </section>
      )}

      {/* ─── FEATURES / WHY CHOOSE US ─────────────────────────────────────────── */}
      <section id="features" aria-label="Why Choose Hush Crafts" className="py-14 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="flex flex-col items-center text-center gap-3 p-5"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-sm text-foreground">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BEST SELLERS ─────────────────────────────────────────────────────── */}
      <section id="best-sellers" aria-label="Best Selling Slippers" className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">
                Customer Favourites
              </p>
              <h2
                className="font-serif text-3xl md:text-4xl font-semibold text-foreground"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                Best Sellers
              </h2>
            </div>
            <Link
              href="/shop?filter=bestsellers"
              className="hidden md:flex items-center gap-2 text-sm font-medium text-primary hover:gap-3 transition-all"
            >
              View All <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          {bestSellers.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {bestSellers.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5" aria-hidden="true">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-border/50 animate-pulse">
                  <div className="aspect-[4/5] bg-secondary" />
                  <div className="p-3.5 space-y-2">
                    <div className="h-4 bg-secondary rounded w-3/4" />
                    <div className="h-4 bg-secondary rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-8 md:hidden">
            <Link
              href="/shop?filter=bestsellers"
              className="inline-flex items-center gap-2 px-6 py-3 border border-primary/20 text-primary rounded-xl text-sm font-medium hover:bg-primary/5 transition-colors"
            >
              View All Best Sellers <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── NEW ARRIVALS ──────────────────────────────────────────────────────── */}
      <section id="new-arrivals" aria-label="New Arrival Slippers" className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">
                Fresh In
              </p>
              <h2
                className="font-serif text-3xl md:text-4xl font-semibold text-foreground"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                New Arrivals
              </h2>
            </div>
            <Link
              href="/shop?sort=newest"
              className="hidden md:flex items-center gap-2 text-sm font-medium text-primary hover:gap-3 transition-all"
            >
              View All <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          {newArrivals.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {newArrivals.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5" aria-hidden="true">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-border/50 animate-pulse">
                  <div className="aspect-[4/5] bg-secondary" />
                  <div className="p-3.5 space-y-2">
                    <div className="h-4 bg-secondary rounded w-3/4" />
                    <div className="h-4 bg-secondary rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── PROMOTIONAL BANNER ───────────────────────────────────────────────── */}
      <section
        id="promo-banner"
        aria-label="New Collection Promotional Banner"
        className="relative overflow-hidden bg-gradient-to-r from-primary via-[#d63070] to-primary/80"
      >
        {/* Decorative blobs */}
        <div aria-hidden="true" className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-16 right-1/3 w-80 h-80 rounded-full bg-black/10 blur-3xl" />
        <div aria-hidden="true" className="absolute top-0 left-1/2 w-px h-full bg-white/10" />

        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col md:flex-row items-center gap-0">
            {/* Text content */}
            <div className="flex-1 py-12 md:py-16 text-center md:text-left">
              <span className="inline-block text-white/80 text-xs font-bold uppercase tracking-[0.25em] mb-3">
                ✨ Limited Time Offer
              </span>
              <h2
                className="font-serif text-3xl md:text-5xl font-bold text-white leading-tight mb-4"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                New Collection
                <br />
                <span className="text-yellow-200">Now Available</span>
              </h2>
              <p className="text-white/80 text-sm md:text-base max-w-sm mx-auto md:mx-0 mb-8 leading-relaxed">
                Handcrafted with love — explore our freshest designs before they sell out. Island-wide delivery available.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Link
                  href="/shop?sort=newest"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-primary rounded-xl font-bold text-sm hover:bg-yellow-50 transition-all hover:shadow-xl hover:-translate-y-0.5"
                >
                  Shop New Arrivals <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border-2 border-white/40 text-white rounded-xl font-semibold text-sm hover:border-white hover:bg-white/10 transition-all"
                >
                  Browse All
                </Link>
              </div>
            </div>

            {/* Decorative product image */}
            <div className="hidden md:block relative w-72 h-80 shrink-0 self-end">
              <Image
                src="/images/pink-sandals.png"
                alt="New collection — pink handmade slippers by Hush Crafts"
                fill
                className="object-contain object-bottom drop-shadow-2xl"
                sizes="288px"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─────────────────────────────────────────────────────── */}
      <section id="testimonials" aria-label="Customer Reviews and Testimonials" className="py-24 bg-muted/10 relative overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.15] pointer-events-none" />
        <div className="container mx-auto px-4 max-w-5xl">
          <TestimonialSlider testimonials={testimonials} />
        </div>
      </section>

      <TikTokSection />

      {/* ─── CTA BANNER ───────────────────────────────────────────────────────── */}
      <section
        id="cta-banner"
        aria-label="Shop the Collection Call to Action"
        className="py-20 bg-primary"
      >
        <div className="container mx-auto px-4 text-center">
          <p className="text-primary-foreground/80 text-xs font-semibold uppercase tracking-widest mb-4">
            Limited Edition Collection
          </p>
          <h2
            className="font-serif text-4xl md:text-5xl font-semibold text-primary-foreground mb-4"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Treat Yourself Today
          </h2>
          <p className="text-primary-foreground/90 max-w-lg mx-auto mb-8 leading-relaxed">
            Our artisans craft each pair by hand in small batches. When they&apos;re gone, they&apos;re gone.
            Don&apos;t miss out on your perfect pair.
          </p>
          <Link
            href="/shop"
            id="cta-shop-btn"
            className="inline-flex items-center gap-2 px-10 py-4 bg-background text-primary rounded-xl font-semibold text-base hover:bg-background/90 transition-all hover:shadow-xl hover:-translate-y-0.5"
          >
            Shop the Collection <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}

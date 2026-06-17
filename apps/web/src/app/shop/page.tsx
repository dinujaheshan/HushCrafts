import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getProducts, getCategories } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import SortDropdown from '@/components/SortDropdown';
import { SlidersHorizontal } from '@/components/MaterialIcons';

export const metadata: Metadata = {
  title: 'Shop All Slippers',
  description:
    'Browse our full collection of premium handmade slippers. Filter by category, size, and style. Free island-wide shipping on orders over LKR 3,000.',
};

export const revalidate = 300;

interface SearchParams {
  categoryId?: string;
  sort?: string;
  filter?: string;
  q?: string;
  minPrice?: string;
  maxPrice?: string;
}

import { redirect } from 'next/navigation';

async function ShopContent({ searchParams }: { searchParams: SearchParams }) {
  const [productsRes, categoriesRes] = await Promise.all([
    getProducts({
      categoryId: searchParams.categoryId,
      limitCount: 24
    }),
    getCategories()
  ]);

  let products = productsRes.success ? productsRes.data.products : [];
  const categories = categoriesRes.success ? categoriesRes.data.categories : [];

  // Filter by price
  if (searchParams.minPrice) {
    products = products.filter(p => p.basePrice >= parseInt(searchParams.minPrice as string));
  }
  if (searchParams.maxPrice) {
    products = products.filter(p => p.basePrice <= parseInt(searchParams.maxPrice as string));
  }

  // Sort products
  if (searchParams.sort) {
    if (searchParams.sort === 'price-asc') {
      products.sort((a, b) => a.basePrice - b.basePrice);
    } else if (searchParams.sort === 'price-desc') {
      products.sort((a, b) => b.basePrice - a.basePrice);
    } else if (searchParams.sort === 'hotitems') {
      products.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar filters */}
      <aside className="lg:w-56 shrink-0">
        <div className="lg:sticky lg:top-24 space-y-4 lg:space-y-6">
          <div>
            <h3 className="font-semibold text-xs uppercase tracking-widest text-muted-foreground mb-3 hidden lg:block">
              Categories
            </h3>
            <ul className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none -mx-4 px-4 lg:mx-0 lg:px-0">
              <li className="shrink-0">
                <a
                  href="/shop"
                  className={`block px-4 py-2 lg:px-3 lg:py-2 rounded-full lg:rounded-lg text-xs lg:text-sm transition-colors ${
                    !searchParams.categoryId
                      ? 'bg-primary border border-primary text-primary-foreground lg:bg-primary/10 lg:border-transparent lg:text-primary font-medium'
                      : 'bg-card border border-border text-muted-foreground hover:border-primary/40 lg:bg-transparent lg:border-transparent lg:hover:bg-primary lg:hover:text-primary-foreground'
                  }`}
                >
                  All Products
                </a>
              </li>
              {categories.map(cat => (
                <li key={cat.id} className="shrink-0">
                  <a
                    href={`/shop?categoryId=${cat.id}`}
                    className={`block px-4 py-2 lg:px-3 lg:py-2 rounded-full lg:rounded-lg text-xs lg:text-sm transition-colors ${
                      searchParams.categoryId === cat.id
                        ? 'bg-primary border border-primary text-primary-foreground lg:bg-primary/10 lg:border-transparent lg:text-primary font-medium'
                        : 'bg-card border border-border text-muted-foreground hover:border-primary/40 lg:bg-transparent lg:border-transparent lg:hover:bg-primary lg:hover:text-primary-foreground'
                    }`}
                  >
                    {cat.name}
                    <span className="ml-1 opacity-70">({cat.productCount})</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-xs uppercase tracking-widest text-muted-foreground mb-3 hidden lg:block">
              Price Range
            </h3>
            <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none -mx-4 px-4 lg:mx-0 lg:px-0">
              {[
                { label: 'Under LKR 2,000', href: '/shop?maxPrice=2000' },
                { label: 'LKR 2,000 – 3,500', href: '/shop?minPrice=2000&maxPrice=3500' },
                { label: 'LKR 3,500+', href: '/shop?minPrice=3500' },
              ].map(({ label, href }) => (
                <a
                  key={href}
                  href={href}
                  className="shrink-0 block px-4 py-2 lg:px-3 lg:py-2 rounded-full lg:rounded-lg text-xs lg:text-sm bg-card border border-border text-muted-foreground hover:border-primary/40 lg:bg-transparent lg:border-transparent lg:hover:bg-primary lg:hover:text-primary-foreground transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Products grid */}
      <div className="flex-1">
        {searchParams.sort === 'hotitems' && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/20 via-destructive/10 to-primary/5 border border-primary/20 flex items-center justify-between shadow-sm">
            <div>
              <h2 className="font-serif text-lg font-semibold text-primary flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" /> Hot Items
              </h2>
              <p className="text-sm text-foreground/80 mt-1">Our most popular and trending pieces right now.</p>
            </div>
          </div>
        )}

        {products.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              Showing <strong className="text-foreground">{products.length}</strong> products
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
              <SlidersHorizontal size={24} className="text-muted-foreground" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-foreground mb-2">No products found</h3>
            <p className="text-muted-foreground text-sm">Try removing some filters or browse all products.</p>
            <a
              href="/shop"
              className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              View All Products
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default async function ShopPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {
  const resolvedParams = await searchParams;

  return (
    <main className="py-10">
      <div className="container mx-auto px-4">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground"
              style={{ fontFamily: 'var(--font-serif)' }}>
              Our Collection
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Handcrafted with love, designed for you
            </p>
          </div>

          {/* Sort dropdown */}
          <SortDropdown initialSort={resolvedParams.sort} />
        </div>

        <Suspense
          fallback={
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-border/50 animate-pulse">
                  <div className="aspect-[4/5] bg-muted/30" />
                  <div className="p-3.5 space-y-2">
                    <div className="h-4 bg-muted/30 rounded w-3/4" />
                    <div className="h-4 bg-muted/30 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          }
        >
          <ShopContent searchParams={resolvedParams} />
        </Suspense>
      </div>
    </main>
  );
}

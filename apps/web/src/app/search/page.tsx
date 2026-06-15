import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getProducts } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import { Search as SearchIcon } from '@/components/MaterialIcons';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Search Results',
  description: 'Search for your favorite handmade slippers.',
};

export const revalidate = 300;

interface SearchParams {
  q?: string;
}

async function SearchContent({ searchParams }: { searchParams: SearchParams }) {
  const productsRes = await getProducts({ limitCount: 100 });
  let products = productsRes.success ? productsRes.data.products : [];

  const query = searchParams.q?.toLowerCase() || '';

  if (query) {
    products = products.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.description?.toLowerCase().includes(query) ||
      p.summary?.toLowerCase().includes(query)
    );
  }

  return (
    <div className="flex-1">
      {products.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground mb-6">
            Showing <strong className="text-foreground">{products.length}</strong> results for &quot;<strong className="text-foreground">{searchParams.q}</strong>&quot;
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
            <SearchIcon size={24} className="text-muted-foreground" />
          </div>
          <h3 className="font-serif text-xl font-semibold text-foreground mb-2">No results found</h3>
          <p className="text-muted-foreground text-sm">We couldn't find anything matching &quot;{searchParams.q}&quot;. Try adjusting your search.</p>
          <Link
            href="/shop"
            className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Browse All Products
          </Link>
        </div>
      )}
    </div>
  );
}

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {
  const resolvedParams = await searchParams;

  return (
    <main className="py-10 min-h-[60vh]">
      <div className="container mx-auto px-4">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground"
            style={{ fontFamily: 'var(--font-serif)' }}>
            Search Results
          </h1>
        </div>

        <Suspense
          fallback={
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
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
          <SearchContent searchParams={resolvedParams} />
        </Suspense>
      </div>
    </main>
  );
}

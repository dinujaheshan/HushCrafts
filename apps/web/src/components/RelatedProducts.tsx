'use client';

import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { getProducts, type Product } from '@/lib/api';
import { Loader2 } from './MaterialIcons';

export default function RelatedProducts({ categoryId, currentProductId }: { categoryId: string, currentProductId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getProducts({ categoryId });
        if (res.success) {
          const filtered = res.data.products.filter(p => p.id !== currentProductId).slice(0, 4);
          setProducts(filtered);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [categoryId, currentProductId]);

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  if (products.length === 0) return null;

  return (
    <div className="mt-24 pt-12 border-t border-border">
      <h2 className="font-serif text-2xl font-semibold text-foreground mb-8">You May Also Like</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {products.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}

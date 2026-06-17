'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown } from './MaterialIcons';

export default function SortDropdown({ initialSort }: { initialSort?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = initialSort || 'newest';

  return (
    <div className="relative">
      <select
        className="appearance-none pl-4 pr-10 py-2.5 text-sm border border-border rounded-xl bg-background text-foreground focus:outline-none focus:border-primary cursor-pointer"
        value={currentSort}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set('sort', e.target.value);
          router.push(`/shop?${params.toString()}`);
        }}
      >
        <option value="newest">Newest First</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
        <option value="hotitems">Hot Items</option>
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
    </div>
  );
}

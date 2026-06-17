'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from '@/components/MaterialIcons';
import type { Category } from '@/lib/api';

interface CategoryCarouselProps {
  categories: Category[];
}

export default function CategoryCarousel({ categories }: CategoryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollLeft() {
    scrollRef.current?.scrollBy({ left: -260, behavior: 'smooth' });
  }

  function scrollRight() {
    scrollRef.current?.scrollBy({ left: 260, behavior: 'smooth' });
  }

  return (
    <div className="relative group/carousel">
      {/* Left Arrow */}
      <button
        onClick={scrollLeft}
        aria-label="Scroll categories left"
        className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-background/95 border border-border shadow-md text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all opacity-0 group-hover/carousel:opacity-100 duration-200"
      >
        <ChevronLeft size={18} aria-hidden="true" />
      </button>

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className="flex gap-6 md:gap-8 overflow-x-auto scrollbar-none px-4 md:px-16 pb-2 pt-1"
        style={{ scrollSnapType: 'x mandatory' }}
        role="list"
        aria-label="Product categories"
      >
        {categories.map(cat => (
          <Link
            key={cat.id}
            href={`/shop?categoryId=${cat.id}`}
            id={`category-${cat.id}`}
            role="listitem"
            className="group flex flex-col items-center gap-3 transition-transform duration-300 hover:-translate-y-1 shrink-0"
            style={{ scrollSnapAlign: 'start' }}
          >
            {/* Round image */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-2 border-primary/10 group-hover:border-primary transition-all bg-muted shadow-sm group-hover:shadow-lg duration-300">
              {cat.image ? (
                <Image
                  src={cat.image}
                  alt={`${cat.name} category — handmade slippers by Hush Crafts`}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  sizes="(max-width: 640px) 80px, (max-width: 768px) 96px, 112px"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary/40 font-serif">
                    {cat.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Name below — outside circle */}
            <span
              className="font-serif text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors text-center max-w-[90px] leading-tight"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {cat.name}
            </span>
          </Link>
        ))}
      </div>

      {/* Right Arrow */}
      <button
        onClick={scrollRight}
        aria-label="Scroll categories right"
        className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-background/95 border border-border shadow-md text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all opacity-0 group-hover/carousel:opacity-100 duration-200"
      >
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </div>
  );
}

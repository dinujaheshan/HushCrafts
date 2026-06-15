'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const HERO_IMAGES = [
  {
    src: '/images/new-hero-1.png',
    alt: 'Hush Craft founder next to premium shipping packages',
    badgeText: 'New Arrivals',
    badgePrice: 'LKR 2,850'
  },
  {
    src: '/images/new-hero-2.png',
    alt: 'Happy Hush Craft customer holding beautiful handmade slippers',
    badgeText: 'Island-wide Delivery',
    badgePrice: 'Free over 3000'
  }
];

export default function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000); // 5 seconds interval
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative rounded-3xl overflow-hidden w-full shadow-2xl bg-muted/30 h-64 sm:h-80 md:h-full md:max-w-[560px]">
      {HERO_IMAGES.map((img, index) => (
        <div
          key={img.src}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={img.src}
            alt={img.alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={index === 0}
          />
          {/* Subtle gradient overlay to make badge pop */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
          
          {/* Floating badge */}
          <div className="absolute bottom-6 left-6 right-6 bg-background/95 backdrop-blur-sm rounded-2xl p-3 shadow-lg transform transition-transform duration-500 translate-y-0">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-foreground text-sm">{img.badgeText}</p>
                <p className="text-primary text-lg font-bold">{img.badgePrice}</p>
              </div>
              <Link
                href="/shop"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      ))}
      
      {/* Carousel dots indicator */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2">
        {HERO_IMAGES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex ? 'bg-primary w-4' : 'bg-white/60 hover:bg-white'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

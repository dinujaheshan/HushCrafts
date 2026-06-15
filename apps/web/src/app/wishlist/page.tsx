'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, ShoppingBag, Heart } from '@/components/MaterialIcons';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';

export default function WishlistPage() {
  const [mounted, setMounted] = useState(false);
  const { items, removeItem } = useWishlistStore();
  const { addItem } = useCartStore();

  useEffect(() => {
    useWishlistStore.persist.rehydrate();
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Deduplicate items (safety guard against duplicate productIds in persisted store)
  const uniqueItems = items.filter(
    (item, index, self) =>
      item.productId && self.findIndex(i => i.productId === item.productId) === index
  );

  return (
    <main className="min-h-screen py-12 bg-muted/20">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-8 flex items-center gap-3">
          <Heart size={32} className="text-primary" /> My Wishlist
        </h1>

        {uniqueItems.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart size={40} className="text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              You haven't saved any items to your wishlist yet. Start exploring our collections and save your favorite styles!
            </p>
            <Link 
              href="/shop" 
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-all hover:shadow-md"
            >
              Explore Shop
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {uniqueItems.map((item, index) => (
              <div key={item.productId || index} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm group">
                <Link href={`/shop/${item.productId}`} className="block relative aspect-square bg-muted/30 overflow-hidden">
                  <Image 
                    src={item.image} 
                    alt={item.name} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      removeItem(item.productId);
                    }}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-destructive hover:bg-destructive hover:text-white transition-colors shadow-sm"
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 size={16} />
                  </button>
                </Link>
                <div className="p-5">
                  <Link href={`/shop/${item.productId}`} className="block mb-2">
                    <h3 className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1">{item.name}</h3>
                  </Link>
                  <p className="font-semibold text-foreground mb-4">Rs. {item.price.toLocaleString()}</p>
                  
                  <button 
                    onClick={() => {
                      addItem({
                        productId: item.productId,
                        variantId: `${item.productId}-default`,
                        sku: `SKU-${item.productId}`,
                        name: item.name,
                        variantName: 'Standard',
                        price: item.price,
                        quantity: 1,
                        image: item.image
                      });
                      removeItem(item.productId);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-primary text-primary rounded-xl font-medium hover:bg-primary hover:text-white transition-all text-sm"
                  >
                    <ShoppingBag size={18} /> Move to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

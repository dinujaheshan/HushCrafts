'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Star, Eye, Heart } from '@/components/MaterialIcons';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import type { Product } from '@/lib/api';

interface ProductCardProps {
  product: Product;
}

import { useRouter } from 'next/navigation';

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  
  const addItem = useCartStore(s => s.addItem);
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore();
  
  const wishlisted = wishlistItems.some(i => i.productId === product.id);

  const displayPrice = product.basePrice;
  const image = product.images?.[0] || '';
  const secondImage = product.images?.[1] || image;

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      variantId: `${product.id}-default`,
      sku: `${product.id}-SKU`,
      name: product.name,
      variantName: 'Default',
      price: displayPrice,
      quantity: 1,
      image
    });
  }

  function handleViewProduct(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/shop/${product.id}`);
  }

  return (
    <article
      className={`group relative rounded-2xl overflow-hidden transition-all duration-300 ${
        product.isBestSeller 
          ? 'bg-gradient-to-b from-primary/5 to-card border-2 border-primary/20 hover:border-primary shadow-sm hover:shadow-primary/20' 
          : 'bg-card border border-border/50 hover:border-primary/20 hover:shadow-lg'
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={`/shop/${product.id}`} className="block" id={`product-card-${product.id}`}>
        {/* Image container */}
        <div className="relative aspect-[4/5] overflow-hidden bg-muted/30">
          {image ? (
            <>
              <Image
                src={hovered && secondImage !== image ? secondImage : image}
                alt={product.name}
                fill
                className="object-cover transition-all duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ShoppingBag size={40} className="text-muted-foreground/30" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.isBestSeller && (
              <span className="px-2.5 py-1 bg-gradient-to-r from-[#ff4d4d] to-primary text-white text-[10px] font-bold rounded-sm uppercase tracking-wider shadow-md animate-pulse border border-white/20">
                Hot Item
              </span>
            )}
            {product.isFeatured && (
              <span className="px-2.5 py-1 bg-accent text-accent-foreground text-[10px] font-semibold rounded-full tracking-wide uppercase">
                Featured
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={(e) => { 
              e.preventDefault(); 
              if (wishlisted) {
                removeFromWishlist(product.id);
              } else {
                addToWishlist({
                  productId: product.id,
                  name: product.name,
                  price: displayPrice,
                  image: image
                });
              }
            }}
            className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-sm transition-all duration-200 ${
              wishlisted
                ? 'bg-primary text-primary-foreground opacity-100'
                : 'bg-background/80 text-foreground/60 opacity-100 lg:opacity-0 lg:group-hover:opacity-100'
            }`}
            aria-label="Add to wishlist"
          >
            <Heart size={14} fill={wishlisted ? 'currentColor' : 'none'} />
          </button>

          {/* Quick actions overlay */}
          <div className={`hidden lg:flex absolute inset-x-0 bottom-0 p-3 gap-2 transition-all duration-200 ${
            hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}>
            <button
              onClick={handleQuickAdd}
              id={`quick-add-${product.id}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-primary/95 backdrop-blur-sm text-primary-foreground rounded-xl text-xs font-semibold hover:bg-primary transition-colors"
              aria-label={`Add ${product.name} to cart`}
            >
              <ShoppingBag size={13} /> Add to Cart
            </button>
            <button
              onClick={handleViewProduct}
              className="w-10 flex items-center justify-center bg-background/90 backdrop-blur-sm rounded-xl hover:bg-background transition-colors"
              aria-label="View product"
            >
              <Eye size={14} className="text-foreground/70" />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-3.5">
          <h3 className="font-medium text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {product.reviewCount > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={10}
                    className={i < Math.round(product.averageRating) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}
                  />
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground">({product.reviewCount})</span>
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-semibold text-primary">
              LKR {displayPrice.toLocaleString()}
            </span>
            <button
              onClick={handleQuickAdd}
              className="lg:hidden w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md active:scale-95 transition-transform"
              aria-label="Add to cart"
            >
              <ShoppingBag size={14} />
            </button>
          </div>
        </div>
      </Link>
    </article>
  );
}

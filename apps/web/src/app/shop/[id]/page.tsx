'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import {
  Star, ShoppingBag, Heart, Share2, ChevronLeft, Check,
  Truck, Shield, RefreshCw, Package
} from '@/components/MaterialIcons';
import { getProduct, type ProductVariant } from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import RelatedProducts from '@/components/RelatedProducts';
import Reviews from '@/components/Reviews';

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const addItem = useCartStore(s => s.addItem);
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore();
  
  const isWishlisted = product ? wishlistItems.some(i => i.productId === product.id) : false;

  useEffect(() => {
    async function load() {
      const res = await getProduct(productId);
      if (!res.success) { setLoading(false); return; }
      setProduct(res.data);
      if (res.data.variants && res.data.variants.length > 0) {
        setSelectedVariant(res.data.variants.find((v: ProductVariant) => v.status === 'in_stock') || res.data.variants[0]);
      }
      setLoading(false);
    }
    load();
  }, [productId]);

  function handleAddToCart() {
    if (!product) return;
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id || `${product.id}-default`,
      sku: selectedVariant?.sku || product.id,
      name: product.name,
      variantName: selectedVariant
        ? `${selectedVariant.attributes.color} / ${selectedVariant.attributes.size}`
        : 'Default',
      price: selectedVariant?.price ?? product.basePrice,
      quantity,
      image: product.images?.[0] || ''
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: product?.summary,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  }

  if (loading) {
    return (
      <main className="py-10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 animate-pulse">
            <div className="aspect-square rounded-2xl bg-muted/30" />
            <div className="space-y-4">
              <div className="h-8 bg-muted/30 rounded w-2/3" />
              <div className="h-6 bg-muted/30 rounded w-1/4" />
              <div className="h-4 bg-muted/30 rounded" />
              <div className="h-4 bg-muted/30 rounded w-5/6" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="py-20 text-center">
        <div className="container mx-auto px-4">
          <Package size={48} className="text-muted-foreground mx-auto mb-4" />
          <h1 className="font-serif text-2xl font-semibold text-foreground mb-2">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">This product doesn&apos;t exist or has been removed.</p>
          <Link href="/shop" className="px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
            Browse All Products
          </Link>
        </div>
      </main>
    );
  }

  const displayPrice = selectedVariant?.price ?? product.basePrice;

  // Group variants by color
  const colorGroups: Record<string, ProductVariant[]> = {};
  (product.variants || []).forEach((v: ProductVariant) => {
    const color = v.attributes.color;
    if (!colorGroups[color]) colorGroups[color] = [];
    colorGroups[color].push(v);
  });

  return (
    <main className="py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-foreground transition-colors">Shop</Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
          {/* ── Images ── */}
          <div className="space-y-3">
            {/* Main image */}
            <div className="group relative aspect-square rounded-2xl overflow-hidden bg-muted/30">
              {product.images?.[selectedImage] ? (
                <Image
                  src={product.images[selectedImage]}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Package size={60} className="text-muted-foreground/30" />
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                      selectedImage === i ? 'border-primary' : 'border-transparent hover:border-primary/30'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} view ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Details ── */}
          <div className="space-y-6">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground leading-tight"
                style={{ fontFamily: 'var(--font-serif)' }}>
                {product.name}
              </h1>

              {/* Rating */}
              {product.reviewCount > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < Math.round(product.averageRating) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.averageRating?.toFixed(1)} ({product.reviewCount} reviews)
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="mt-3">
                <span className="text-3xl font-bold text-primary">
                  LKR {displayPrice.toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-muted-foreground text-sm leading-relaxed">{product.description}</p>

            {/* Color selector */}
            {Object.keys(colorGroups).length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  Color: <span className="text-foreground normal-case font-normal">
                    {selectedVariant?.attributes.color}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(colorGroups).map(color => {
                    const colorVariants = colorGroups[color];
                    const isSelected = selectedVariant?.attributes.color === color;
                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedVariant(
                          colorVariants.find(v => v.status === 'in_stock') || colorVariants[0]
                        )}
                        className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary font-medium'
                            : 'border-border text-muted-foreground hover:border-primary/40'
                        }`}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size selector */}
            {selectedVariant && Object.keys(colorGroups).length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Size: <span className="text-foreground normal-case font-normal">
                      {selectedVariant.attributes.size}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(colorGroups[selectedVariant.attributes.color] || []).map((v: ProductVariant) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      disabled={v.status === 'out_of_stock'}
                      className={`w-12 h-12 rounded-xl border text-sm font-medium transition-all ${
                        selectedVariant.id === v.id
                          ? 'border-primary bg-primary text-primary-foreground'
                          : v.status === 'out_of_stock'
                          ? 'border-border text-muted-foreground/40 line-through cursor-not-allowed'
                          : 'border-border text-foreground hover:border-primary'
                      }`}
                    >
                      {v.attributes.size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Quantity
              </p>
              <div className="flex items-center border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-secondary transition-colors text-foreground"
                >
                  −
                </button>
                <span className="w-12 text-center font-semibold text-sm">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(20, quantity + 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-secondary transition-colors text-foreground"
                >
                  +
                </button>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex gap-3">
              <button
                id="add-to-cart-btn"
                onClick={handleAddToCart}
                disabled={selectedVariant?.status === 'out_of_stock'}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-semibold transition-all ${
                  addedToCart
                    ? 'bg-green-600 text-white'
                    : selectedVariant?.status === 'out_of_stock'
                    ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg'
                }`}
              >
                {addedToCart ? (
                  <><Check size={18} /> Added to Cart</>
                ) : selectedVariant?.status === 'out_of_stock' ? (
                  'Out of Stock'
                ) : (
                  <><ShoppingBag size={18} /> Add to Cart</>
                )}
              </button>

              <button
                onClick={() => {
                  if (isWishlisted) {
                    removeFromWishlist(product.id);
                  } else {
                    addToWishlist({
                      productId: product.id,
                      name: product.name,
                      price: displayPrice,
                      image: product.images?.[0] || ''
                    });
                  }
                }}
                className={`w-12 h-12 flex items-center justify-center border rounded-xl transition-all ${
                  isWishlisted
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-border text-foreground/60 hover:border-primary hover:bg-primary/5 hover:text-primary'
                }`}
                aria-label="Add to wishlist"
              >
                <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>

              <button
                onClick={handleShare}
                className="w-12 h-12 flex items-center justify-center border border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-foreground/60"
                aria-label="Share product"
              >
                <Share2 size={18} />
              </button>
            </div>

            {/* Checkout link */}
            <button
              onClick={() => {
                const params = new URLSearchParams({
                  buyNow: 'true',
                  productId: product.id,
                  variantId: selectedVariant?.id || `${product.id}-default`,
                  sku: selectedVariant?.sku || product.id,
                  qty: quantity.toString()
                });
                window.location.href = `/checkout?${params.toString()}`;
              }}
              className="flex items-center justify-center gap-2 w-full py-3.5 border-2 border-primary text-primary rounded-xl font-semibold hover:bg-primary/5 transition-colors"
            >
              Buy Now
            </button>

            {/* Trust signals */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-4 border-t border-border/50">
              {[
                { icon: <Truck size={20} />, label: 'Island-wide Delivery' },
                { icon: <Shield size={20} />, label: 'Quality Guaranteed' },
                { icon: <RefreshCw size={20} />, label: '7-Day Returns' },
              ].map(({ icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 text-center p-2 bg-secondary/20 rounded-xl justify-center">
                  <span className="text-primary shrink-0">{icon}</span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground font-semibold leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Reviews productId={product.id} />
        <RelatedProducts categoryId={product.categoryIds?.[0] || 'c1'} currentProductId={product.id} />
      </div>
    </main>
  );
}

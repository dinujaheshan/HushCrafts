'use client';

import { useState, useEffect, useRef } from 'react';
import { Star, ChevronLeft, ChevronRight, Sparkles } from '@/components/MaterialIcons';

interface Testimonial {
  id: number;
  name: string;
  location: string;
  rating: number;
  text: string;
  avatar: string;
}

interface TestimonialSliderProps {
  testimonials: Testimonial[];
}

export default function TestimonialSlider({ testimonials }: TestimonialSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const active = testimonials[activeIndex];

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      handleNext();
    }, 6000); // Slide every 6 seconds
  };

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeIndex]);

  const handleNext = () => {
    setAnimate(false);
    setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
      setAnimate(true);
    }, 200);
  };

  const handlePrev = () => {
    setAnimate(false);
    setTimeout(() => {
      setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
      setAnimate(true);
    }, 200);
  };

  const selectTestimonial = (index: number) => {
    if (index === activeIndex) return;
    setAnimate(false);
    setTimeout(() => {
      setActiveIndex(index);
      setAnimate(true);
    }, 200);
  };

  return (
    <div className="grid md:grid-cols-12 gap-10 items-center">
      <style>{`
        @keyframes testimonialProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .testimonial-progress-bar {
          animation: testimonialProgress 6000ms linear forwards;
        }
      `}</style>

      {/* Left Column - Stats & Navigation */}
      <div className="md:col-span-5 space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-xs font-semibold text-primary">
          <Sparkles size={12} className="animate-pulse" />
          Real Customer Reviews
        </div>
        <h2 className="font-serif text-3xl md:text-5xl font-semibold text-foreground leading-tight"
            style={{ fontFamily: 'var(--font-serif)' }}>
          Loved by Women
          <br />
          <span className="text-primary italic">Across Sri Lanka</span>
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
          Hear from our beautiful community who experience the handcrafted elegance, comfort, and premium quality of Hush Crafts.
        </p>

        {/* Brand Rating Summary */}
        <div className="pt-2 flex items-center gap-4">
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex flex-col justify-center items-center text-center shrink-0 w-24">
            <span className="text-3xl font-bold font-serif text-primary">5.0</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-1">Average</span>
          </div>
          <div>
            <div className="flex gap-0.5 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className="fill-amber-400" />
              ))}
            </div>
            <p className="text-sm text-foreground font-semibold mt-1">
              Loved by 2,000+ Customers
            </p>
            <p className="text-xs text-muted-foreground">
              Based on verified purchase surveys.
            </p>
          </div>
        </div>

        {/* Navigation Buttons (Desktop) */}
        <div className="hidden md:flex items-center gap-3 pt-4">
          <button
            onClick={handlePrev}
            className="w-12 h-12 rounded-full border border-border bg-background flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 group shadow-sm hover:shadow"
            aria-label="Previous Review"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={handleNext}
            className="w-12 h-12 rounded-full border border-border bg-background flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 group shadow-sm hover:shadow"
            aria-label="Next Review"
          >
            <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Right Column - Layered 3D Testimonial Card */}
      <div className="md:col-span-7 relative flex flex-col items-center">
        {/* Layered background card decor */}
        <div className="absolute inset-0 bg-primary/5 rounded-3xl transform translate-x-2 translate-y-3 rotate-1 scale-[0.98] border border-primary/10 -z-10" />
        <div className="absolute inset-0 bg-muted/60 rounded-3xl transform -translate-x-2 -translate-y-2 -rotate-1 scale-[0.99] border border-border/40 -z-20" />

        {/* Glowing aura */}
        <div className="absolute -inset-10 bg-[radial-gradient(circle,var(--primary),transparent)] opacity-10 blur-3xl pointer-events-none -z-30" />

        {/* Main Testimonial Card */}
        <div className="w-full bg-background border border-border/60 shadow-xl rounded-3xl p-8 md:p-10 relative overflow-hidden flex flex-col min-h-[300px] justify-between">
          {/* Progress bar indicator */}
          <div className="absolute top-0 left-0 h-1 w-full bg-muted overflow-hidden">
            <div
              key={activeIndex}
              className="h-full bg-primary/60 testimonial-progress-bar origin-left"
            />
          </div>

          {/* Large decorative quotation mark */}
          <span className="absolute right-8 top-6 text-primary/10 font-serif text-[120px] leading-none select-none pointer-events-none">
            “
          </span>

          <div className={`transition-all duration-300 transform space-y-6 ${animate ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}>
            {/* Stars */}
            <div className="flex gap-0.5 text-amber-400">
              {[...Array(active.rating)].map((_, i) => (
                <Star key={i} size={18} className="fill-amber-400 drop-shadow-sm" />
              ))}
            </div>

            {/* Testimonial Text */}
            <blockquote className="font-serif text-lg md:text-xl text-foreground/90 italic leading-relaxed font-medium">
              &ldquo;{active.text}&rdquo;
            </blockquote>

            {/* Customer Profile & Verified badge */}
            <div className="flex items-center gap-4 pt-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-base font-bold shadow-md shrink-0 ring-4 ring-primary/10">
                {active.avatar}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-base text-foreground">{active.name}</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                    <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-emerald-600" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                    </svg>
                    Verified Buyer
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">{active.location}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Thumbnail Avatars / Indicators below card */}
        <div className="flex items-center justify-center gap-3 mt-8 z-10">
          {testimonials.map((t, idx) => (
            <button
              key={t.id}
              onClick={() => selectTestimonial(idx)}
              className={`group flex items-center gap-2 p-1 rounded-full transition-all duration-300 ${
                idx === activeIndex 
                  ? 'bg-primary/10 pr-3 border border-primary/20 scale-105 shadow-sm' 
                  : 'hover:bg-muted scale-100'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                idx === activeIndex 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary'
              }`}>
                {t.avatar}
              </div>
              {idx === activeIndex && (
                <span className="text-xs font-semibold text-primary transition-all duration-300">
                  {t.name.split(' ')[0]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Navigation buttons (Mobile) */}
        <div className="flex md:hidden items-center justify-center gap-4 mt-6">
          <button
            onClick={handlePrev}
            className="w-10 h-10 rounded-full border border-border bg-background flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-sm"
            aria-label="Previous Review"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={handleNext}
            className="w-10 h-10 rounded-full border border-border bg-background flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-sm"
            aria-label="Next Review"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

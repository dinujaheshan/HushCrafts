'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Instagram, Facebook, Mail, Phone, MapPin, ArrowRight, Youtube, Tiktok } from '@/components/MaterialIcons';

export default function Footer() {
  const pathname = usePathname();
  const year = new Date().getFullYear();

  // Hide footer on auth and admin pages
  if (pathname === '/login' || pathname === '/register' || pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="bg-[#1a0a12] text-white border-t border-border">
      {/* Newsletter CTA */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-serif text-2xl font-semibold text-white">
                Join the Hush Crafts Family
              </h3>
              <p className="text-white/60 text-sm mt-1">
                Get exclusive offers, new arrivals & styling tips directly in your inbox.
              </p>
            </div>
            <form className="flex gap-2 w-full md:w-auto" id="footer-newsletter-form">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 md:w-72 px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                Subscribe <ArrowRight size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main footer links */}
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand & Social */}
          <div className="md:col-span-5">
            <Link href="/" className="flex items-center gap-3" id="footer-logo">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/20">
                <Image 
                  src="/images/logo.jpg" 
                  alt="Hush Crafts Logo" 
                  fill 
                  className="object-cover"
                />
              </div>
              <span className="font-serif text-2xl font-semibold text-primary">Hush Crafts</span>
            </Link>
            <p className="text-white/50 text-sm mt-3 leading-relaxed max-w-sm">
              Handcrafted slippers made with love in Sri Lanka. Premium quality, unique designs to elevate your everyday style.
            </p>
            <div className="flex gap-3 mt-6">
              <a href="https://instagram.com/hush_crafts" target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-primary hover:text-white transition-all" title="Instagram">
                <Instagram size={15} />
              </a>
              <a href="https://www.facebook.com/share/18ZuEstYHJ/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors" title="Facebook">
                <Facebook size={15} />
              </a>
              <a href="https://youtube.com/@hushcrafts" target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-primary hover:text-white transition-all" title="YouTube">
                <Youtube size={15} />
              </a>
              <a href="https://www.tiktok.com/@hushcrafts?is_from_webapp=1&sender_device=pc" target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-primary hover:text-white transition-all" title="TikTok">
                <Tiktok size={15} />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div className="md:col-span-3">
            <h4 className="font-semibold text-white text-sm mb-4 tracking-wide uppercase">Shop & Support</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'All Products', href: '/shop' },
                { label: 'New Arrivals', href: '/shop?sort=newest' },
                { label: 'About Us', href: '/about' },
                { label: 'Contact Us', href: '/contact' },
                { label: 'FAQ', href: '/faq' },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-white/50 hover:text-primary text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div className="md:col-span-4">
            <h4 className="font-semibold text-white text-sm mb-4 tracking-wide uppercase">Get In Touch</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-white/60 text-sm">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 text-primary">
                  <Phone size={14} />
                </div>
                <div className="mt-1.5">
                  <a href="tel:+94713670089" className="hover:text-primary transition-colors font-medium text-white/80">
                    +94 71 367 0089
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3 text-white/60 text-sm">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 text-primary">
                  <Mail size={14} />
                </div>
                <div className="mt-1.5">
                  <a href="mailto:hushcrafts26@gmail.com" className="hover:text-primary transition-colors font-medium text-white/80">
                    hushcrafts26@gmail.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3 text-white/60 text-sm">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 text-primary">
                  <MapPin size={14} />
                </div>
                <div className="mt-1.5 leading-relaxed text-white/80">
                  Pitakotte, Kotte,<br />Sri Lanka
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-white/30 text-xs">
            © {year} Hush Crafts. All rights reserved.
          </p>
          <div className="flex gap-5 text-xs text-white/30">
            <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white/60 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

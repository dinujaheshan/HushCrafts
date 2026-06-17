'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Menu, X, Search, Heart, User, Sun, Moon, LogOut, Bell } from '@/components/MaterialIcons';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useTheme } from 'next-themes';
import CartDrawer from './CartDrawer';
import { useAuthStore, type User as AuthUser } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { loadCartFromFirestore, loadWishlistFromFirestore } from '@/lib/firestoreSync';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchParams = useSearchParams();
  const sort = searchParams?.get('sort');
  const [mounted, setMounted] = useState(false);
  const [cacheBuster, setCacheBuster] = useState('');
  const cartOpen = useUiStore(s => s.isCartOpen);
  const setCartOpen = useUiStore(s => s.setCartOpen);
  const [searchQuery, setSearchQuery] = useState('');
  const { theme, setTheme } = useTheme();
  const items = useCartStore(s => s.items);
  const totalItems = items.reduce((n, i) => n + i.quantity, 0);
  const wishlistItems = useWishlistStore(s => s.items);
  // Deduplicate for accurate count (guards against stale localStorage data)
  const validWishlistItems = wishlistItems.filter(
    (item, index, self) => item.productId && self.findIndex(i => i.productId === item.productId) === index
  );
  const totalWishlistItems = validWishlistItems.length;
  const { user, login, logout } = useAuthStore();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Listen to client notifications
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    
    let unsubscribe: () => void = () => {};

    // Lazy load firestore
    import('firebase/firestore').then(({ collection, query, where, onSnapshot }) => {
      import('@/lib/firebase').then(({ db }) => {
        const q = query(
          collection(db, 'client_notifications'),
          where('email', '==', user.email.toLowerCase())
        );

        unsubscribe = onSnapshot(q, (snapshot: any) => {
          const list = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Sort newest first in memory to avoid index requirement
          list.sort((a: any, b: any) => {
            const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
            const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
            return timeB - timeA;
          });
          
          setNotifications(list);
        }, (err: any) => {
          console.error("Error reading client notifications:", err);
        });
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      await updateDoc(doc(db, 'client_notifications', notificationId), {
        isRead: true
      });
    } catch (e) {
      console.error("Failed to mark notification as read:", e);
    }
  };

  const handleSearch = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMenuOpen(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setCacheBuster(`?t=${Date.now()}`);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    
    // Firebase Auth Listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData: AuthUser = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email || '',
          firstName: '',
          lastName: '',
          mobile: '',
          photoURL: firebaseUser.photoURL || '',
          shippingAddress: null,
          billingAddress: null
        };
        
        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase');
          
          // Auto-signout admin accounts from client-side instance to avoid session mixing
          const adminDocRef = doc(db, 'admins', firebaseUser.uid);
          const adminDocSnap = await getDoc(adminDocRef);
          if (adminDocSnap.exists()) {
            console.warn("Admin detected on client auth instance. Auto-signing out from client...");
            await signOut(auth);
            return;
          }

          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            userData.firstName = data.firstName || '';
            userData.lastName = data.lastName || '';
            userData.mobile = data.mobile || '';
            userData.photoURL = data.photoURL || userData.photoURL;
            userData.shippingAddress = data.shippingAddress || null;
            userData.billingAddress = data.billingAddress || null;
            if (data.firstName || data.lastName) {
              userData.name = `${data.firstName || ''} ${data.lastName || ''}`.trim();
            }
          }
        } catch (e) {
          console.error("Error fetching user data", e);
        }
        
        login(userData);
        
        // Load cart and wishlist from Firestore for this user
        try {
          const [firestoreCart, firestoreWishlist] = await Promise.all([
            loadCartFromFirestore(firebaseUser.uid),
            loadWishlistFromFirestore(firebaseUser.uid)
          ]);
          
          if (firestoreCart.length > 0) {
            // Merge Firestore cart with localStorage cart
            const cartStore = useCartStore.getState();
            firestoreCart.forEach(item => cartStore.addItem(item));
          }
          
          if (firestoreWishlist.length > 0) {
            // Replace localStorage wishlist with Firestore wishlist
            const wishlistStore = useWishlistStore.getState();
            // Clear existing and load from Firestore
            wishlistStore.clearWishlist();
            firestoreWishlist.forEach(item => wishlistStore.addItem(item));
          }
        } catch (e) {
          console.error('Error loading user data from Firestore:', e);
        }
      } else {
        logout();
        // Clear local cart and wishlist on logout
        useCartStore.getState().clearCart();
        useWishlistStore.getState().clearWishlist();
        fetch('/api/auth/session', { method: 'DELETE' }).catch(console.error);
      }
    });

    return () => {
      window.removeEventListener('scroll', onScroll);
      unsubscribe();
    };
  }, [login, logout]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  // Hydrate cart and wishlist from localStorage
  useEffect(() => {
    useCartStore.persist.rehydrate();
    useWishlistStore.persist.rehydrate();
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Hide navbar on auth and admin pages
  if (pathname === '/login' || pathname === '/register' || pathname?.startsWith('/admin')) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const navLinks = [
    { label: 'Shop All', href: '/shop' },
    { label: 'Collections', href: '/shop?view=collections' },
    { label: 'Hot Items', href: '/shop?sort=hotitems' },
  ];

  return (
    <>
      {/* Main Navbar */}
      <header
        id="main-navbar"
        className={`sticky top-0 z-50 w-full transition-all duration-300 bg-primary ${
          scrolled ? 'shadow-md' : ''
        }`}
      >
        <div className="container mx-auto px-4">
          {/* Top Bar - Hidden on mobile */}
          <div className="hidden md:flex justify-between items-center h-8 text-[11px] font-medium text-white/90 tracking-wide uppercase border-b border-white/10">
            <div className="flex items-center">
              {mounted && user ? (
                <span>Hi, Welcome <span className="font-bold text-white">{user.firstName ? `${user.firstName} ${user.lastName}`.trim() : user.name}</span>!</span>
              ) : (
                <span>Welcome to Hush Craft</span>
              )}
            </div>
            <div className="flex items-center gap-6">
              <Link href="/about" className="hover:text-white transition-colors">About Us</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="hover:text-white transition-colors flex items-center gap-1">
                {mounted && theme === 'dark' ? <><Sun size={12} /> Light</> : <><Moon size={12} /> Dark</>}
              </button>
            </div>
          </div>

          {/* Main Bar */}
          <div className="flex items-center justify-between h-16 md:h-20 gap-4 md:gap-8 pb-2 md:pb-0 pt-2 md:pt-0">
            
            {/* Left aligned Hamburger + Logo + Brand Name */}
            <div className="flex items-center gap-2">
              {/* Mobile menu toggle */}
              <button
                className="md:hidden text-white hover:bg-white/10 p-2 rounded-lg transition-colors flex flex-col justify-center items-center w-10 h-10 gap-1.5 relative"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
              >
                <span className={`h-0.5 bg-white rounded-full transition-all duration-300 transform ${menuOpen ? 'rotate-45 translate-y-2' : ''} w-6`} />
                <span className={`h-0.5 bg-white rounded-full transition-all duration-300 ${menuOpen ? 'opacity-0 w-0' : 'w-6'}`} />
                <span className={`h-0.5 bg-white rounded-full transition-all duration-300 transform ${menuOpen ? '-rotate-45 -translate-y-2' : ''} w-6`} />
              </button>

              {/* Logo */}
              <Link href="/" className="flex shrink-0 items-center gap-2" id="nav-logo">
                <div className="relative w-10 h-10 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-white/20 shadow-md">
                  <Image 
                    src="/images/logo.jpg" 
                    alt="Hush Crafts Logo" 
                    fill 
                    className="object-cover"
                  />
                </div>
                {/* Mobile brand name with shimmer */}
                <span
                  className="md:hidden text-lg font-serif font-bold tracking-tight brand-shimmer"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  Hush Crafts
                </span>
                {/* Desktop brand name plain white */}
                <span
                  className="hidden md:block text-3xl font-serif font-bold text-white tracking-tight"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  Hush Crafts
                </span>
              </Link>
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-3xl">
              <div className="flex w-full shadow-sm">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                  placeholder="Search in Hush Crafts" 
                  className="w-full h-11 pl-4 pr-4 rounded-l-lg bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button 
                  onClick={handleSearch}
                  className="h-11 w-12 bg-[#ffe4ec] text-primary flex items-center justify-center rounded-r-lg transition-colors hover:bg-[#ffd1df]" 
                  aria-label="Search"
                >
                  <Search size={20} />
                </button>
              </div>
            </div>

            {/* Right actions - Hidden on Mobile */}
            <div className="hidden md:flex items-center shrink-0 gap-1 md:gap-2">
              {/* Auth / User Account */}
              {mounted && user ? (
                <div className="flex items-center gap-1">
                  {/* Notifications Bell */}
                  <div className="relative">
                    <button
                      onClick={() => setNotificationsOpen(!notificationsOpen)}
                      className="flex flex-col items-center p-2 text-white hover:bg-white/10 rounded-lg transition-colors relative cursor-pointer"
                      aria-label="Notifications"
                    >
                      <div className="relative">
                        <Bell size={24} />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-white text-primary text-[9px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      <span className="hidden md:block text-[10px] font-medium mt-0.5">Inbox</span>
                    </button>
                    {notificationsOpen && (
                      <div className="absolute right-0 mt-2 w-80 bg-background border border-border rounded-2xl shadow-xl z-50 p-4 max-h-[360px] overflow-y-auto">
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
                          <h4 className="font-semibold text-sm text-foreground">My Notifications</h4>
                          {unreadCount > 0 && (
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">{unreadCount} New</span>
                          )}
                        </div>
                        <div className="space-y-2.5">
                          {notifications.length > 0 ? (
                            notifications.map(n => (
                              <div key={n.id} className={`p-2.5 rounded-xl border transition-all ${n.isRead ? 'border-border/40 bg-secondary/10' : 'border-primary/20 bg-primary/5'}`}>
                                <div className="flex justify-between items-start">
                                  <h5 className="font-bold text-xs text-foreground pr-4">{n.title || 'Notification'}</h5>
                                  {!n.isRead && (
                                    <button 
                                      onClick={() => handleMarkAsRead(n.id)}
                                      className="text-[9px] font-extrabold uppercase tracking-wider text-primary hover:underline cursor-pointer"
                                    >
                                      Mark read
                                    </button>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed whitespace-pre-wrap">{n.message}</p>
                                <span className="text-[9px] text-muted-foreground/60 block mt-1.5 font-medium">
                                  {n.createdAt?.seconds 
                                    ? new Date(n.createdAt.seconds * 1000).toLocaleDateString()
                                    : new Date(n.createdAt || 0).toLocaleDateString()
                                  }
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-center text-xs text-muted-foreground py-6 font-medium">No new support replies.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
 
                  <button 
                    onClick={handleLogout}
                    className="hidden md:flex flex-col items-center p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                    aria-label="Sign Out"
                  >
                    <LogOut size={24} />
                    <span className="text-[10px] font-medium mt-0.5">Sign out</span>
                  </button>
                  <Link
                    href="/account"
                    className="flex flex-col items-center p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="User Account"
                  >
                    {user.photoURL ? (
                      <div className="w-[24px] h-[24px] rounded-full overflow-hidden border border-white/50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`${user.photoURL}${cacheBuster}`} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ) : (
                      <User size={24} />
                    )}
                    <span className="hidden md:block text-[10px] font-medium mt-0.5">Account</span>
                  </Link>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex flex-col items-center p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Sign In"
                >
                  <User size={24} />
                  <span className="hidden md:block text-[10px] font-medium mt-0.5">Sign In</span>
                </Link>
              )}

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="flex flex-col items-center p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Wishlist"
              >
                <div className="relative">
                  <Heart size={24} />
                  {totalWishlistItems > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-background text-primary text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                      {totalWishlistItems}
                    </span>
                  )}
                </div>
                <span className="hidden md:block text-[10px] font-medium mt-0.5">Wishlist</span>
              </Link>

              {/* Cart */}
              <button
                id="nav-cart"
                onClick={() => setCartOpen(true)}
                className="flex flex-col items-center p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Open cart"
              >
                <div className="relative">
                  <ShoppingBag size={24} />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-background text-primary text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                      {totalItems}
                    </span>
                  )}
                </div>
                <span className="hidden md:block text-[10px] font-medium mt-0.5">Cart</span>
              </button>
            </div>
          </div>
        </div>

        {/* Categories Bottom Bar */}
        <div className="hidden md:block bg-background border-b border-border shadow-sm">
          <div className="container mx-auto px-4 flex items-center justify-center gap-10 h-10 text-sm font-semibold">
            <Link href="/shop" className={`text-foreground/80 hover:text-primary transition-colors uppercase tracking-wide ${!sort ? 'font-bold text-primary' : ''}`}>Shop</Link>
            <Link href="/shop?sort=newest" className={`text-foreground/80 hover:text-primary transition-colors uppercase tracking-wide ${sort === 'newest' ? 'font-bold text-primary' : ''}`}>New Arrivals</Link>
            <Link href="/shop?sort=hotitems" className={`text-foreground/80 hover:text-primary transition-colors flex items-center gap-1.5 uppercase tracking-wide ${sort === 'hotitems' ? 'font-bold text-primary' : ''}`}><span className="w-2 h-2 rounded-full bg-destructive animate-pulse" /> Hot Items</Link>
          </div>
        </div>
      </header>

      {/* Mobile Menu Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Mobile Menu Drawer (Slide-in from Left) */}
      <aside
        className={`fixed top-0 left-0 z-[60] h-full w-72 bg-background shadow-2xl flex flex-col transition-transform duration-300 ease-out md:hidden ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header inside drawer */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card shrink-0">
          <span className="font-serif text-lg font-bold text-primary" style={{ fontFamily: 'var(--font-serif)' }}>Hush Crafts</span>
          <button
            onClick={() => setMenuOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary transition-colors text-foreground/60"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search inside drawer */}
        <div className="px-5 pt-4 pb-2 border-b border-border shrink-0">
          <form onSubmit={handleSearch} className="flex w-full shadow-sm">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in Hush Crafts" 
              className="w-full h-10 pl-3 pr-3 rounded-l-md bg-secondary text-foreground text-sm border-y border-l border-border focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button 
              type="submit"
              className="h-10 w-10 bg-primary/10 text-primary flex items-center justify-center rounded-r-md border border-border border-l-0 transition-colors hover:bg-primary/20" 
              aria-label="Search"
            >
              <Search size={18} />
            </button>
          </form>
        </div>

        {/* Links inside drawer */}
        <nav className="flex flex-col py-4 px-5 gap-3.5 overflow-y-auto flex-1">
          {/* Main Store Pages */}
          <Link href="/shop" className="text-base font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-3 px-1 py-1" onClick={() => setMenuOpen(false)}>
            Shop All
          </Link>
          <Link href="/shop?categoryId=collections" className="text-base font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-3 px-1 py-1" onClick={() => setMenuOpen(false)}>
            Collections
          </Link>
          <Link href="/shop?sort=hotitems" className="text-base font-semibold text-destructive hover:text-destructive/80 flex items-center gap-3 px-1 py-1 transition-colors" onClick={() => setMenuOpen(false)}>
            <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" /> Hot Items
          </Link>
          
          <div className="h-px bg-border my-1 shrink-0" />
          
          {/* E-commerce Actions */}
          
          {/* Cart Button */}
          <button 
            onClick={() => { setMenuOpen(false); setCartOpen(true); }}
            className="text-left text-base font-medium text-foreground hover:text-primary flex items-center justify-between px-1 py-1.5 transition-colors w-full cursor-pointer"
          >
            <span className="flex items-center gap-3">
              <ShoppingBag size={20} className="text-foreground/70" /> My Cart
            </span>
            {totalItems > 0 && (
              <span className="min-w-[20px] h-[20px] bg-primary text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1.5">
                {totalItems}
              </span>
            )}
          </button>

          {/* Wishlist Link */}
          <Link 
            href="/wishlist" 
            className="text-base font-medium text-foreground hover:text-primary flex items-center justify-between px-1 py-1.5 transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            <span className="flex items-center gap-3">
              <Heart size={20} className="text-foreground/70" /> My Wishlist
            </span>
            {totalWishlistItems > 0 && (
              <span className="min-w-[20px] h-[20px] bg-primary text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1.5">
                {totalWishlistItems}
              </span>
            )}
          </Link>

          {/* Notifications Accordion for Logged in Users */}
          {user && (
            <div className="flex flex-col">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="text-left text-base font-medium text-foreground hover:text-primary flex items-center justify-between px-1 py-1.5 transition-colors w-full cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <Bell size={20} className="text-foreground/70" /> Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="min-w-[20px] h-[20px] bg-primary text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1.5 animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {notificationsOpen && (
                <div className="mt-2 pl-8 pr-1 py-2 space-y-2 bg-secondary/15 rounded-xl border border-border/40 max-h-48 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map(n => (
                      <div key={n.id} className={`p-2 rounded-lg border text-xs ${n.isRead ? 'border-border bg-background/50' : 'border-primary/20 bg-primary/5'}`}>
                        <div className="flex justify-between items-start gap-1">
                          <span className="font-bold text-foreground">{n.title || 'Notification'}</span>
                          {!n.isRead && (
                            <button 
                              onClick={() => handleMarkAsRead(n.id)}
                              className="text-[9px] font-extrabold uppercase text-primary hover:underline cursor-pointer"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                        <p className="text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic py-1">No notifications.</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="h-px bg-border my-1 shrink-0" />

          {/* User Profile / Auth */}
          {user ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/20 border border-border/40">
                {user.photoURL ? (
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-border/50 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`${user.photoURL}${cacheBuster}`} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <User size={18} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{user.firstName ? `${user.firstName} ${user.lastName}`.trim() : user.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
              <Link href="/account" className="text-base font-medium text-foreground hover:text-primary flex items-center gap-3 px-1 py-1 transition-colors" onClick={() => setMenuOpen(false)}>
                <User size={20} className="text-foreground/70" /> My Account
              </Link>
              <button 
                onClick={() => { handleLogout(); setMenuOpen(false); }} 
                className="text-left text-base font-medium text-destructive/80 hover:text-destructive flex items-center gap-3 px-1 py-1 transition-colors cursor-pointer"
              >
                <LogOut size={20} /> Sign Out
              </button>
            </div>
          ) : (
            <Link href="/login" className="text-base font-medium text-foreground hover:text-primary flex items-center gap-3 px-1 py-1 transition-colors" onClick={() => setMenuOpen(false)}>
              <User size={20} className="text-foreground/70" /> Sign In / Register
            </Link>
          )}

          <div className="h-px bg-border my-1 shrink-0" />

          {/* Theme switcher & Info */}
          <button 
            onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); setMenuOpen(false); }} 
            className="text-left text-base font-medium text-foreground hover:text-primary flex items-center gap-3 px-1 py-1 transition-colors cursor-pointer w-full"
          >
            {theme === 'dark' ? (
              <><Sun size={20} className="text-foreground/70" /> Switch to Light Mode</>
            ) : (
              <><Moon size={20} className="text-foreground/70" /> Switch to Dark Mode</>
            )}
          </button>

          <Link href="/about" className="text-base font-medium text-foreground/80 hover:text-primary transition-colors flex items-center gap-3 px-1 py-1" onClick={() => setMenuOpen(false)}>
            About Us
          </Link>
          <Link href="/contact" className="text-base font-medium text-foreground/80 hover:text-primary transition-colors flex items-center gap-3 px-1 py-1" onClick={() => setMenuOpen(false)}>
            Contact Us
          </Link>
        </nav>
      </aside>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}

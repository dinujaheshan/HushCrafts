'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import {
  LayoutDashboard, ShoppingCart, Package, Users,
  BarChart3, Settings, Warehouse, ChevronRight,
  LogOut, Bell, Sun, Moon, Loader2, ShieldAlert,
  MessageCircle, Mail, Menu, X
} from '@/components/MaterialIcons';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import { adminAuth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close mobile sidebar drawer automatically when transitioning paths
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const admin = useAdminAuthStore((s) => s.admin);
  const isHydrated = useAdminAuthStore((s) => s.isHydrated);
  const loginAdmin = useAdminAuthStore((s) => s.login);
  const logoutAdmin = useAdminAuthStore((s) => s.logout);

  // Mount logic for next-themes to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen to Auth State and sync with Firestore if Zustand state is empty
  useEffect(() => {
    if (!isHydrated) return;

    const unsubscribe = onAuthStateChanged(adminAuth, async (firebaseUser) => {
      if (firebaseUser) {
        if (!admin) {
          try {
            // Fetch profile from Firestore
            const adminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid));
            if (adminDoc.exists() && adminDoc.data().isActive) {
              const data = adminDoc.data();
              loginAdmin({
                uid: firebaseUser.uid,
                name: data.name || 'Admin User',
                email: data.email || firebaseUser.email || '',
                role: data.role || 'admin',
                permissions: data.permissions || {
                  manageProducts: false,
                  productCreate: false,
                  productUpdate: false,
                  productDelete: false,
                  manageCategories: false,
                  categoryCreate: false,
                  categoryUpdate: false,
                  categoryDelete: false,
                  manageInventory: false,
                  inventoryUpdate: false,
                  manageOrders: false,
                  orderUpdate: false,
                  orderDelete: false,
                  manageCustomers: false,
                  customerUpdate: false,
                  customerDelete: false,
                  manageAnalytics: false,
                  manageFeedbacks: false,
                  feedbackApprove: false,
                  feedbackDelete: false,
                  manageMessages: false,
                  messageReply: false,
                  messageDelete: false,
                  manageAdmins: false,
                },
                isActive: true,
                createdAt: data.createdAt,
              });
            } else {
              // Not authorized or inactive
              handleLogout();
            }
          } catch (err) {
            console.error('Error fetching admin profile from Firestore:', err);
            handleLogout();
          }
        }
        setLoading(false);
      } else {
        // No firebase user
        if (pathname !== '/admin/login') {
          handleLogout();
        } else {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [isHydrated, admin, pathname]);

  const handleLogout = async () => {
    try {
      await signOut(adminAuth);
      await fetch('/api/auth/admin-session', { method: 'DELETE' });
      logoutAdmin();
      router.push('/admin/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Show loading indicator until hydrated and checked
  if (loading || !isHydrated || !admin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-foreground transition-colors duration-200">
        <Loader2 size={40} className="text-primary animate-spin" />
        <p className="text-sm font-medium tracking-wide">Loading Secure Admin Session...</p>
      </div>
    );
  }

  // ─── NAV ITEM PERMISSION CHECKS ───
  const hasPermission = (href: string): boolean => {
    if (admin.role === 'super_admin') return true;
    const permissions = admin.permissions;
    if (href === '/admin') return true; // dashboard open to all admins
    if (href.startsWith('/admin/orders')) return permissions.manageOrders;
    if (href.startsWith('/admin/products')) return permissions.manageProducts;
    if (href.startsWith('/admin/categories')) return permissions.manageCategories ?? permissions.manageProducts;
    if (href.startsWith('/admin/inventory')) return permissions.manageInventory;
    if (href.startsWith('/admin/customers')) return permissions.manageCustomers;
    if (href.startsWith('/admin/analytics')) return permissions.manageAnalytics;
    if (href.startsWith('/admin/feedbacks')) return permissions.manageFeedbacks;
    if (href.startsWith('/admin/messages')) return permissions.manageMessages;
    if (href.startsWith('/admin/settings')) return permissions.manageAdmins;
    return false;
  };

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} />, allowed: true },
    { href: '/admin/orders', label: 'Orders', icon: <ShoppingCart size={18} />, allowed: hasPermission('/admin/orders') },
    { href: '/admin/products', label: 'Products', icon: <Package size={18} />, allowed: hasPermission('/admin/products') },
    { href: '/admin/categories', label: 'Categories', icon: <Package size={18} />, allowed: hasPermission('/admin/categories') },
    { href: '/admin/inventory', label: 'Inventory', icon: <Warehouse size={18} />, allowed: hasPermission('/admin/inventory') },
    { href: '/admin/customers', label: 'Customers', icon: <Users size={18} />, allowed: hasPermission('/admin/customers') },
    { href: '/admin/feedbacks', label: 'Feedbacks', icon: <MessageCircle size={18} />, allowed: hasPermission('/admin/feedbacks') },
    { href: '/admin/messages', label: 'Messages', icon: <Mail size={18} />, allowed: hasPermission('/admin/messages') },
    { href: '/admin/analytics', label: 'Analytics', icon: <BarChart3 size={18} />, allowed: hasPermission('/admin/analytics') },
    { href: '/admin/settings', label: 'Settings', icon: <Settings size={18} />, allowed: hasPermission('/admin/settings') },
  ];

  const currentPathAllowed = hasPermission(pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-200">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
      
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 border-r border-border flex flex-col bg-card shadow-sm transition-transform duration-300 lg:static lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Logo and Brand */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-card/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden relative border border-border shadow-sm">
              <Image
                src="/images/logo.jpg"
                alt="Hush Crafts"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="font-serif font-bold text-sm leading-tight text-foreground">Hush Crafts</p>
              <p className="text-[10px] uppercase tracking-wider text-primary font-bold">Admin Portal</p>
            </div>
          </div>
          
          {/* Mobile menu close drawer trigger */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 hover:bg-secondary rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label="Close Sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            if (!item.allowed) return null;
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 group ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                }`}
              >
                <span className={active ? 'text-primary-foreground transition-transform duration-200 ease-out transform group-hover:translate-x-1 group-hover:scale-110' : 'text-muted-foreground group-hover:text-foreground transition-transform duration-200 ease-out transform group-hover:translate-x-1 group-hover:scale-110'}>
                  {item.icon}
                </span>
                <span className="flex-1 text-left">{item.label}</span>
                {active && <ChevronRight size={14} className="text-primary-foreground" />}
              </Link>
            );
          })}
        </nav>

        {/* Profile Footer */}
        <div className="p-4 border-t border-border bg-secondary/20 flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-inner uppercase">
              {admin.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{admin.name}</p>
              <p className="text-[9px] uppercase tracking-wider text-primary font-extrabold mt-0.5">
                {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-border rounded-xl text-xs font-bold text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-all duration-200"
          >
            <LogOut size={14} /> Log Out System
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-secondary/10">
        {/* Top bar */}
        <header className="h-16 border-b border-border flex items-center justify-between px-4 sm:px-8 bg-card/50 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger menu trigger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 hover:bg-secondary rounded-xl text-foreground cursor-pointer"
              aria-label="Open Sidebar"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
              <span>Control Panel</span>
              <span className="hidden sm:inline">/</span>
              <span className="text-foreground hidden sm:inline">
                {pathname === '/admin' ? 'Dashboard' : pathname.split('/').pop()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-border bg-card hover:bg-secondary/80 transition-all text-foreground/75 cursor-pointer"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            )}

            <button
              className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-border bg-card hover:bg-secondary/80 transition-all text-foreground/75 cursor-pointer"
              aria-label="Notifications"
            >
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            </button>
          </div>
        </header>

        {/* Page content window */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          {currentPathAllowed ? (
            children
          ) : (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 bg-card border border-border rounded-3xl shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
                <ShieldAlert size={36} />
              </div>
              <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
              <p className="text-muted-foreground text-sm max-w-md mt-2 leading-relaxed">
                You do not have permission to view this section. Please ask a Super Admin to enable the necessary access permissions for you.
              </p>
              <Link
                href="/admin"
                className="mt-6 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary/95 transition-all shadow-md shadow-primary/10"
              >
                Back to Dashboard
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Loader2, ShieldAlert, CheckCircle2, Sparkles } from '@/components/MaterialIcons';
import { adminAuth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import Image from 'next/image';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDbEmpty, setIsDbEmpty] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initSuccess, setInitSuccess] = useState(false);
  const loginAdmin = useAdminAuthStore((s) => s.login);

  // Check if any admin exists in the database
  useEffect(() => {
    async function checkAdmins() {
      try {
        const querySnapshot = await getDocs(collection(db, 'admins'));
        setIsDbEmpty(querySnapshot.empty);
      } catch (err) {
        console.error('Error checking admins list in Firestore:', err);
        // Fallback: assume empty if database permissions block query
        setIsDbEmpty(true);
      }
    }
    checkAdmins();
  }, []);

  const handleSetupAdmins = async () => {
    setIsInitializing(true);
    setError(null);
    try {
      // 1. Create Super Admin Auth and Firestore Record
      const superCred = await createUserWithEmailAndPassword(adminAuth, 'superadmin@hushcraft.lk', 'superadmin123');
      await setDoc(doc(db, 'admins', superCred.user.uid), {
        uid: superCred.user.uid,
        name: 'Super Admin',
        email: 'superadmin@hushcraft.lk',
        role: 'super_admin',
        isActive: true,
        permissions: {
          manageProducts: true,
          manageInventory: true,
          manageOrders: true,
          manageCustomers: true,
          manageAnalytics: true,
          manageFeedbacks: true,
          manageMessages: true,
        },
        createdAt: new Date().toISOString(),
      });
      await signOut(adminAuth);

      // 2. Create Regular Admin Auth and Firestore Record
      const adminCred = await createUserWithEmailAndPassword(adminAuth, 'admin@hushcraft.lk', 'admin123');
      await setDoc(doc(db, 'admins', adminCred.user.uid), {
        uid: adminCred.user.uid,
        name: 'System Admin',
        email: 'admin@hushcraft.lk',
        role: 'admin',
        isActive: true,
        permissions: {
          manageProducts: true,
          manageInventory: true,
          manageOrders: true,
          manageCustomers: false,
          manageAnalytics: false,
          manageFeedbacks: false,
          manageMessages: false,
        },
        createdAt: new Date().toISOString(),
      });
      await signOut(adminAuth);

      setInitSuccess(true);
      setIsDbEmpty(false);
    } catch (err: any) {
      console.error('Initialization failed:', err);
      setError(err.message || 'Failed to initialize default administrator accounts.');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Authenticate with Admin Firebase Auth
      const userCredential = await signInWithEmailAndPassword(adminAuth, email, password);
      const user = userCredential.user;

      // Verify administrator record in Firestore
      const adminDoc = await getDoc(doc(db, 'admins', user.uid));

      if (!adminDoc.exists()) {
        await signOut(adminAuth);
        setError('This email is not registered as an authorized administrator.');
        setIsLoading(false);
        return;
      }

      const adminData = adminDoc.data();

      if (!adminData.isActive) {
        await signOut(adminAuth);
        setError('Your administrator account is currently inactive. Contact Super Admin.');
        setIsLoading(false);
        return;
      }

      // Securely store the token in the session cookie
      const token = await user.getIdToken();
      const res = await fetch('/api/auth/admin-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        throw new Error('Failed to establish session on server.');
      }

      // Update local Zustand state
      loginAdmin({
        uid: user.uid,
        name: adminData.name || 'Admin User',
        email: adminData.email || email,
        role: adminData.role || 'admin',
        permissions: adminData.permissions || {
          manageProducts: false,
          manageInventory: false,
          manageOrders: false,
          manageCustomers: false,
          manageAnalytics: false,
        },
        isActive: true,
        createdAt: adminData.createdAt,
      });

      // Redirect to dashboard
      router.push('/admin');
    } catch (err: any) {
      console.error('Admin login error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid administrator email or password.');
      } else {
        setError(err.message || 'An error occurred during authentication.');
      }
      await signOut(adminAuth);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground transition-colors duration-200 p-4 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 shadow-2xl relative overflow-hidden bg-background ring-1 ring-border">
            <Image 
              src="/images/logo.jpg" 
              alt="Hush Crafts" 
              fill
              className="object-cover" 
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground font-serif tracking-tight">Admin Portal</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to manage Hush Craft store</p>
        </div>

        {/* Database setup notification helper */}
        {isDbEmpty && !initSuccess && (
          <div className="bg-card border border-primary/30 rounded-2xl p-5 mb-5 space-y-3 shadow-xl backdrop-blur-md">
            <div className="flex items-start gap-3">
              <Sparkles size={18} className="text-primary mt-0.5" />
              <div>
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">First-Time Setup</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  It looks like your administrator database is empty. Let&apos;s automatically seed default credentials for testing.
                </p>
              </div>
            </div>
            <button
              onClick={handleSetupAdmins}
              disabled={isInitializing}
              className="w-full py-2 px-3 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isInitializing ? (
                <>
                  <Loader2 size={12} className="animate-spin" /> Seeding Database...
                </>
              ) : (
                'Create Default Administrators'
              )}
            </button>
          </div>
        )}

        {initSuccess && (
          <div className="bg-card border border-green-500/30 rounded-2xl p-5 mb-5 shadow-xl backdrop-blur-md">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-green-500 mt-0.5" />
              <div>
                <h3 className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">Database Seeded!</h3>
                <p className="text-xs text-foreground/80 mt-1 leading-relaxed">
                  Default credentials successfully created:
                </p>
                <div className="mt-2 space-y-1 font-mono text-[10px] text-muted-foreground">
                  <p>🔑 <span className="text-foreground font-semibold">superadmin@hushcraft.lk</span> / superadmin123 (Super Admin)</p>
                  <p>🔑 <span className="text-foreground font-semibold">admin@hushcraft.lk</span> / admin123 (Regular Admin)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl backdrop-blur-md">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl mb-4 leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">
                Administrator Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@hushcraft.lk"
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border text-foreground rounded-xl text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border text-foreground rounded-xl text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/40"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/95 transition-all disabled:opacity-70 mt-6 active:scale-[0.98] cursor-pointer"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Secure Access Login'}
              {!isLoading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          <ShieldAlert size={14} className="text-muted-foreground/75" />
          Protected Admin Area - Authorized Only
        </div>
      </div>
    </main>
  );
}

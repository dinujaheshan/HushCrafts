'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, ArrowRight, Loader2, Home } from '@/components/MaterialIcons';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';

function LoginContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');
  const safeRedirect = redirectPath && redirectPath.startsWith('/') && !redirectPath.startsWith('//')
    ? redirectPath
    : '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Verify this is a client user and not an administrator
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      const adminDoc = await getDoc(doc(db, 'admins', user.uid));
      
      if (adminDoc.exists()) {
        const { signOut } = await import('firebase/auth');
        await signOut(auth);
        setError('Administrator accounts cannot log in to the client store. Please use a customer account.');
        setIsLoading(false);
        return;
      }

      const token = await user.getIdToken();
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      router.push(safeRedirect);
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else {
        setError('Failed to sign in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen grid md:grid-cols-2">
      {/* Left Side: Illustration Panel */}
      <div className="hidden md:flex relative flex-col justify-between bg-primary/5 p-12 overflow-hidden border-r border-border/50">
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <Image
            src="/images/auth_login_illustration_clean.png"
            alt="Login Illustration"
            fill
            className="object-cover opacity-90"
            priority
          />
        </div>
        
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
            <Home size={18} /> Back to Home
          </Link>
        </div>

        <div className="relative z-10 text-foreground mt-auto bg-background/80 backdrop-blur-md p-6 rounded-2xl border border-border/50 shadow-sm max-w-md">
          <h2 className="font-serif text-3xl font-semibold mb-2 text-primary" style={{ fontFamily: 'var(--font-serif)' }}>
            Step Into Elegance
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Log in to access your wishlist, track orders, and experience a faster checkout for your premium handmade slippers.
          </p>
        </div>
      </div>

      {/* Right Side: Form Panel */}
      <div className="flex justify-center p-6 sm:p-12 bg-background relative overflow-y-auto max-h-screen scrollbar-hide">
        <div className="md:hidden absolute top-6 left-6 z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
            <Home size={18} /> Home
          </Link>
        </div>

        <div className="w-full max-w-md space-y-8 my-auto py-12">
          <div className="text-center flex flex-col items-center">
            <div className="mb-6">
              <Image 
                src="/images/logo.jpg" 
                alt="Hush Crafts" 
                width={100} 
                height={100} 
                className="rounded-full object-cover shadow-sm ring-4 ring-primary/10" 
              />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-3" style={{ fontFamily: 'var(--font-serif)' }}>
              Welcome Back
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Please enter your details to sign in.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@example.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 border-2 border-muted-foreground rounded text-primary focus:ring-primary focus:ring-offset-background transition-colors cursor-pointer"
                  />
                </div>
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  Remember me
                </span>
              </label>
              <Link href="/forgot-password" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-base hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none mt-4"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Sign In'}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="text-center text-sm font-medium text-muted-foreground pt-4">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary hover:text-primary/80 transition-colors">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-primary" />
      </main>
    }>
      <LoginContent />
    </Suspense>
  );
}

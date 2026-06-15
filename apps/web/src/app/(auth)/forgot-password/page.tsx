'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, ArrowRight, Loader2, Home, CheckCircle } from '@/components/MaterialIcons';
import { auth } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err: any) {
      console.error("Reset error:", err);
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else {
        setError('Failed to send reset email. Please try again later.');
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
            Reset Password
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Don't worry if you forgot your password. We'll send you a link to reset it securely.
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
              Forgot Password
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Enter your email address to receive a password reset link.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl">
              {error}
            </div>
          )}

          {success ? (
            <div className="p-6 bg-success/10 border border-success/20 rounded-2xl text-center space-y-4">
              <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center mx-auto text-success">
                <CheckCircle size={24} />
              </div>
              <h3 className="font-semibold text-foreground text-lg">Check your inbox</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We've sent a password reset link to <strong className="text-foreground">{email}</strong>. 
                Please check your spam folder if you don't see it.
              </p>
              <Link 
                href="/login" 
                className="inline-block mt-4 text-primary font-medium hover:underline"
              >
                Return to sign in
              </Link>
            </div>
          ) : (
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-base hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none mt-4"
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Send Reset Link'}
                {!isLoading && <ArrowRight size={18} />}
              </button>
            </form>
          )}

          {!success && (
            <div className="text-center text-sm font-medium text-muted-foreground pt-4">
              Remember your password?{' '}
              <Link href="/login" className="text-primary hover:text-primary/80 transition-colors">
                Sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

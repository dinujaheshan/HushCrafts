import Link from 'next/link';
import { Home, Search } from '@/components/MaterialIcons';

export default function NotFound() {
  return (
    <main className="min-h-[80vh] flex items-center justify-center py-20">
      <div className="container mx-auto px-4 text-center max-w-md">
        {/* Error code */}
        <h1 className="font-serif text-8xl font-bold text-primary opacity-20 mb-4"
          style={{ fontFamily: 'var(--font-serif)' }}>
          404
        </h1>
        
        {/* Main message */}
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Oops! Page not found
        </h2>
        <p className="text-muted-foreground mb-8">
          The page you're looking for seems to have wandered off. It might have been moved, deleted, or perhaps it never existed.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            <Home size={18} />
            Back to Home
          </Link>
          <Link
            href="/shop"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 border border-border text-foreground rounded-xl font-medium hover:bg-secondary transition-colors"
          >
            <Search size={18} />
            Browse Shop
          </Link>
        </div>
      </div>
    </main>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Star, Loader2 } from './MaterialIcons';
import { useAuthStore } from '@/store/authStore';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  text: string;
  createdAt: { toMillis: () => number } | null;
}

export default function Reviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const user = useAuthStore(s => s.user);

  useEffect(() => {
    async function loadReviews() {
      try {
        const q = query(collection(db, 'reviews'), where('productId', '==', productId));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
        // Filter out pending reviews (isApproved === false).
        // If isApproved is undefined/true, we display it for backward compatibility.
        const approvedOnly = data.filter(r => (r as any).isApproved !== false);
        // Sort in client if index is missing
        approvedOnly.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
          return timeB - timeA;
        });
        setReviews(approvedOnly);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadReviews();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return setError('You must be logged in to review.');
    if (!text.trim()) return setError('Please write a review text.');
    
    setSubmitting(true);
    setError('');

    try {
      const newReview = {
        productId,
        userId: user.uid,
        userName: user.name || user.firstName || 'Anonymous',
        rating,
        text,
        createdAt: serverTimestamp(),
        isApproved: false // Newly submitted reviews require admin approval
      };
      
      const docRef = await addDoc(collection(db, 'reviews'), newReview);
      
      // Notify client that review is submitted and pending moderation
      alert('Thank you! Your review has been submitted and is pending moderation.');
      
      setText('');
      setRating(5);
    } catch (err) {
      console.error(err);
      setError('Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0 
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="mt-16 pt-12 border-t border-border">
      <h2 className="font-serif text-2xl font-semibold text-foreground mb-8">Customer Reviews</h2>
      
      <div className="grid md:grid-cols-3 gap-10">
        <div className="md:col-span-1">
          <div className="bg-muted/20 p-6 rounded-2xl text-center border border-border/50">
            <h3 className="text-4xl font-bold text-foreground mb-2">{avgRating.toFixed(1)}</h3>
            <div className="flex justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map(star => (
                <Star key={star} size={16} className={star <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'} />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">Based on {reviews.length} reviews</p>
          </div>

          <div className="mt-8">
            <h4 className="font-semibold text-foreground mb-4">Write a Review</h4>
            {user ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-2">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button type="button" key={star} onClick={() => setRating(star)} className="focus:outline-none">
                        <Star size={24} className={star <= rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <textarea 
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Tell us what you think..."
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary min-h-[100px] resize-none"
                  ></textarea>
                </div>
                <button type="submit" disabled={submitting} className="w-full flex justify-center items-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Submit Review'}
                </button>
              </form>
            ) : (
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 text-sm text-center">
                Please <a href="/login" className="text-primary font-semibold hover:underline">log in</a> to write a review.
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" size={32} /></div>
          ) : reviews.length > 0 ? (
            reviews.map(review => (
              <div key={review.id} className="pb-6 border-b border-border/50 last:border-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-foreground font-bold">
                      {review.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h5 className="font-semibold text-sm text-foreground">{review.userName}</h5>
                      <div className="flex gap-0.5 mt-0.5">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} size={12} className={star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {review.createdAt?.toMillis ? new Date(review.createdAt.toMillis()).toLocaleDateString() : 'Just now'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mt-3">{review.text}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              No reviews yet. Be the first to review!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import { 
  Star, Trash2, Check, Loader2, Search, 
  MessageCircle, Filter, ChevronDown 
} from '@/components/MaterialIcons';

export default function AdminFeedbacksPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');

  // Permission Guard
  const admin = useAdminAuthStore(s => s.admin);
  const canApprove = admin?.role === 'super_admin' || (admin?.permissions?.feedbackApprove ?? admin?.permissions?.manageFeedbacks);
  const canDelete = admin?.role === 'super_admin' || (admin?.permissions?.feedbackDelete ?? admin?.permissions?.manageFeedbacks);

  const loadFeedbacksData = async () => {
    setLoading(true);
    try {
      const reviewsSnap = await getDocs(collection(db, 'reviews'));
      const productsSnap = await getDocs(collection(db, 'products'));

      const productsList = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      setProducts(productsList);

      const reviewsList = reviewsSnap.docs.map((doc): any => {
        const data = doc.data();
        const matchedProduct = productsList.find(p => p.id === data.productId);
        
        let reviewDate = 'Recent';
        if (data.createdAt) {
          const d = data.createdAt.seconds 
            ? new Date(data.createdAt.seconds * 1000) 
            : new Date(data.createdAt);
          reviewDate = d.toLocaleDateString('en-LK', { day: '2-digit', month: 'short', year: 'numeric' });
        }

        return {
          id: doc.id,
          ...data,
          productName: matchedProduct?.name || `Product ID: ${data.productId || 'Unknown'}`,
          productImage: matchedProduct?.images?.[0] || null,
          formattedDate: reviewDate,
          isApproved: data.isApproved !== false // Default to true if missing (backward compatibility)
        };
      });

      // Sort reviews newest first
      reviewsList.sort((a, b) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      setReviews(reviewsList);
    } catch (err) {
      console.error('Failed to load feedbacks data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedbacksData();
  }, []);

  const handleApprove = async (reviewId: string) => {
    if (!canApprove) return;
    try {
      await updateDoc(doc(db, 'reviews', reviewId), {
        isApproved: true
      });
      
      // Update local state
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, isApproved: true } : r));
      alert('Review approved successfully!');
    } catch (err) {
      console.error('Failed to approve review:', err);
      alert('Error approving review.');
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!canDelete) return;
    if (!confirm('Are you sure you want to permanently delete this customer review?')) return;

    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
      
      // Update local state
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      alert('Review deleted.');
    } catch (err) {
      console.error('Failed to delete review:', err);
      alert('Error deleting review.');
    }
  };

  // Filter reviews
  const filtered = reviews.filter(r => {
    const matchesSearch = 
      r.userName.toLowerCase().includes(search.toLowerCase()) ||
      r.text.toLowerCase().includes(search.toLowerCase()) ||
      r.productName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'pending' && r.isApproved === false) ||
      (statusFilter === 'approved' && r.isApproved === true);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-serif">Customer Feedbacks</h1>
          <p className="text-sm text-muted-foreground mt-1">Moderate and approve product reviews before they show up on the shop page.</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'Total Reviews', value: reviews.length, icon: <MessageCircle size={18} /> },
          { label: 'Pending Approval', value: reviews.filter(r => r.isApproved === false).length, icon: <Filter size={18} /> },
          { label: 'Approved Reviews', value: reviews.filter(r => r.isApproved === true).length, icon: <Star size={18} /> }
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-card border border-border rounded-3xl p-5 flex items-center gap-4 hover:shadow-md transition-all shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-white border border-rose-300 flex items-center justify-center shrink-0 shadow-sm text-primary">
              {icon}
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground tracking-tight">{value}</p>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by customer name, comments, or slipper model..."
            className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="appearance-none pl-4 pr-9 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors cursor-pointer capitalize"
          >
            <option value="all">All Reviews</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
          <Loader2 size={36} className="text-primary animate-spin" />
          <p className="text-sm font-medium">Loading customer feedbacks...</p>
        </div>
      ) : (
        <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-secondary/35 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Slipper Model</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4">Feedback / Comment</th>
                  <th className="px-6 py-4">Submitted Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(review => (
                  <tr 
                    key={review.id} 
                    className={`border-b border-border/40 last:border-0 hover:bg-secondary/20 transition-colors ${
                      review.isApproved === false ? 'bg-amber-500/5 dark:bg-amber-950/5' : ''
                    }`}
                  >
                    {/* User Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0 uppercase shadow-inner">
                          {review.userName ? review.userName.charAt(0) : 'U'}
                        </div>
                        <span className="font-semibold text-sm text-foreground">{review.userName || 'Guest'}</span>
                      </div>
                    </td>

                    {/* Product Name */}
                    <td className="px-6 py-4 text-sm font-bold text-foreground">
                      {review.productName}
                    </td>

                    {/* Star Rating */}
                    <td className="px-6 py-4">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                            key={star} 
                            size={14} 
                            className={star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/20'} 
                          />
                        ))}
                      </div>
                    </td>

                    {/* Comment Text */}
                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
                      {review.text}
                    </td>

                    {/* Created Date */}
                    <td className="px-6 py-4 text-xs text-muted-foreground font-semibold">
                      {review.formattedDate}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                        review.isApproved === false 
                          ? 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                          : 'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-300'
                      }`}>
                        {review.isApproved === false ? 'Pending' : 'Approved'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {canApprove && review.isApproved === false && (
                          <button
                            onClick={() => handleApprove(review.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl border border-green-200 dark:border-green-900 bg-card hover:bg-green-500/10 transition-colors text-muted-foreground hover:text-green-600 cursor-pointer"
                            title="Approve Feedback"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(review.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl border border-border bg-card hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-500 cursor-pointer"
                            title="Delete Feedback"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        {!canApprove && !canDelete && (
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Read Only</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-muted-foreground text-sm font-medium">
                      No customer feedbacks found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

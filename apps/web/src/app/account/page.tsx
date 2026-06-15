'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { User, Package, Camera, Loader2, Heart, ShoppingBag, Clock } from '@/components/MaterialIcons';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile, updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useUiStore } from '@/store/uiStore';
import Link from 'next/link';
import { getUserOrders } from '@/lib/firestoreSync';
import { SRI_LANKAN_DISTRICTS } from '@hush-craft/shared-utils';

export default function AccountPage() {
  const { user, updateUser } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const setCartOpen = useUiStore(s => s.setCartOpen);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  
  const [shippingLine1, setShippingLine1] = useState('');
  const [shippingLine2, setShippingLine2] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingDistrict, setShippingDistrict] = useState('Colombo');
  const [shippingPostal, setShippingPostal] = useState('');

  const [billingLine1, setBillingLine1] = useState('');
  const [billingLine2, setBillingLine2] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingDistrict, setBillingDistrict] = useState('Colombo');
  const [billingPostal, setBillingPostal] = useState('');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orders, setOrders] = useState<Array<{
    orderId: string;
    status: string;
    total: number;
    subtotal?: number;
    shippingFee?: number;
    itemCount: number;
    items?: any[];
    paymentMethod?: string;
    trackingNumber?: string | null;
    carrier?: string | null;
    timeline?: Array<{ status: string; timestamp: any; note: string; updatedBy: string }>;
    shippingAddress?: { addressLine1: string; addressLine2?: string | null; city: string; district: string; postalCode?: string | null };
    createdAt: { toMillis?: () => number } | null;
  }>>([]);

  useEffect(() => {
    setMounted(true);
    if (!useAuthStore.getState().user) {
      router.push('/login');
    } else if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setMobile(user.mobile || '');
      setEmail(user.email || '');

      setShippingLine1(user.shippingAddress?.addressLine1 || '');
      setShippingLine2(user.shippingAddress?.addressLine2 || '');
      setShippingCity(user.shippingAddress?.city || '');
      setShippingDistrict(user.shippingAddress?.district || 'Colombo');
      setShippingPostal(user.shippingAddress?.postalCode || '');

      setBillingLine1(user.billingAddress?.addressLine1 || '');
      setBillingLine2(user.billingAddress?.addressLine2 || '');
      setBillingCity(user.billingAddress?.city || '');
      setBillingDistrict(user.billingAddress?.district || 'Colombo');
      setBillingPostal(user.billingAddress?.postalCode || '');

      // Load orders — always fetch full global order for tracking/timeline data
      getUserOrders(user.uid).then(async (userOrders) => {
        const enrichedOrders = await Promise.all(
          userOrders.map(async (o) => {
            try {
              const { doc: firestoreDoc, getDoc } = await import('firebase/firestore');
              const globalOrderRef = firestoreDoc(db, 'orders', o.orderId);
              const globalSnap = await getDoc(globalOrderRef);
              if (globalSnap.exists()) {
                const g = globalSnap.data();
                return {
                  ...o,
                  items: g.items || o.items || [],
                  paymentMethod: g.paymentMethod || o.paymentMethod || 'online',
                  status: g.orderStatus || o.status,
                  subtotal: g.subtotal || 0,
                  shippingFee: g.shippingFee || 0,
                  trackingNumber: g.trackingNumber || null,
                  carrier: g.carrier || null,
                  timeline: g.timeline || [],
                  shippingAddress: g.shippingAddress || null,
                };
              }
            } catch (err) {
              console.error(`Failed to fetch global details for order ${o.orderId}:`, err);
            }
            return o;
          })
        );
        // Sort newest first
        enrichedOrders.sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() ?? 0;
          const tb = b.createdAt?.toMillis?.() ?? 0;
          return tb - ta;
        });
        setOrders(enrichedOrders);
      }).catch(console.error);
    }
  }, [router, user]);

  if (!mounted || !user) return null;

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const emailChanged = email !== user.email;
      const passwordChanged = newPassword.length > 0;
      
      if ((emailChanged || passwordChanged) && !currentPassword) {
        setError('Current Password is required to change Email or Password.');
        setIsSaving(false);
        return;
      }

      if (auth.currentUser && (emailChanged || passwordChanged)) {
        try {
          const credential = EmailAuthProvider.credential(user.email, currentPassword);
          await reauthenticateWithCredential(auth.currentUser, credential);
        } catch (authError: any) {
          setError('Invalid Current Password. Please try again.');
          setIsSaving(false);
          return;
        }

        if (emailChanged) {
          await updateEmail(auth.currentUser, email);
        }
        if (passwordChanged) {
          await updatePassword(auth.currentUser, newPassword);
        }
      }

      const userRef = doc(db, 'users', user.uid);
      const sAddr = {
        addressLine1: shippingLine1,
        addressLine2: shippingLine2 || null,
        city: shippingCity,
        district: shippingDistrict,
        postalCode: shippingPostal || null
      };
      const bAddr = {
        addressLine1: billingLine1,
        addressLine2: billingLine2 || null,
        city: billingCity,
        district: billingDistrict,
        postalCode: billingPostal || null
      };

      await updateDoc(userRef, {
        firstName,
        lastName,
        mobile,
        email,
        shippingAddress: sAddr,
        billingAddress: bAddr
      });
      
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: `${firstName} ${lastName}`.trim()
        });
      }
      
      updateUser({
        firstName,
        lastName,
        mobile,
        email,
        name: `${firstName} ${lastName}`.trim(),
        shippingAddress: sAddr,
        billingAddress: bAddr
      });
      setSuccessMessage('Profile updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('That email address is already in use by another account.');
      } else if (err.code === 'auth/weak-password') {
        setError('New password should be at least 6 characters.');
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size should be less than 2MB');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccessMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.error || 'Upload failed');
      }
      
      const { url: downloadURL } = await uploadRes.json();

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { photoURL: downloadURL });
      
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: downloadURL });
      }

      updateUser({ photoURL: downloadURL });
      setSuccessMessage('Profile picture updated!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to upload image. Please check Cloudinary is configured in .env.local');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Status colour mapping used for order badges and timeline
  const statusColors: Record<string, string> = {
    delivered: 'bg-green-100 text-green-700',
    completed: 'bg-green-100 text-green-700',
    dispatched: 'bg-blue-100 text-blue-700',
    shipped: 'bg-blue-100 text-blue-700',
    processing: 'bg-violet-100 text-violet-700',
    packed: 'bg-violet-100 text-violet-700',
    confirmed: 'bg-indigo-100 text-indigo-700',
    cancelled: 'bg-red-100 text-red-700',
    returned: 'bg-red-100 text-red-700',
    refunded: 'bg-orange-100 text-orange-700',
    pending: 'bg-amber-100 text-amber-700',
  };

  return (
    <main className="min-h-screen py-12 bg-muted/20">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="font-serif text-3xl font-semibold text-foreground mb-8">My Account</h1>
        
        <div className="grid md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1 space-y-2">
            <div className="bg-card border border-border rounded-2xl p-6 mb-4 shadow-sm text-center relative group">
              <div className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-primary/10 border-4 border-background shadow-md group-hover:border-primary/20 transition-colors">
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary text-3xl font-bold">
                    {user.firstName ? user.firstName.charAt(0).toUpperCase() : user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div 
                  className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? <Loader2 size={24} className="text-white animate-spin" /> : <Camera size={24} className="text-white" />}
                  <span className="text-white text-[10px] font-medium mt-1">Upload</span>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/jpeg, image/png, image/webp" 
                  onChange={handleImageUpload} 
                />
              </div>
              <h2 className="font-semibold text-foreground text-lg">{user.firstName ? `${user.firstName} ${user.lastName}` : user.name}</h2>
              <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
            </div>
            
            <nav className="flex md:flex-col gap-1.5 overflow-x-auto pb-3 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 whitespace-nowrap scrollbar-none shrink-0">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-xl font-medium text-xs md:text-sm transition-colors text-left shrink-0 ${
                  activeTab === 'profile' ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:bg-muted'
                }`}
              >
                <User size={18} /> Profile Details
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-xl font-medium text-xs md:text-sm transition-colors text-left shrink-0 ${
                  activeTab === 'orders' ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:bg-muted'
                }`}
              >
                <Package size={18} /> My Orders {orders.length > 0 && <span className="ml-2 bg-primary text-primary-foreground text-[10px] md:text-xs rounded-full px-1.5 py-0.5">{orders.length}</span>}
              </button>
              <Link href="/wishlist" className="flex items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 text-foreground/70 hover:bg-muted rounded-xl font-medium text-xs md:text-sm transition-colors text-left shrink-0">
                <Heart size={18} /> My Wishlist
              </Link>
              <button onClick={() => setCartOpen(true)} className="flex items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 text-foreground/70 hover:bg-muted rounded-xl font-medium text-xs md:text-sm transition-colors text-left shrink-0">
                <ShoppingBag size={18} /> My Cart
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">

            {/* ═══ ORDERS TAB ═══ */}
            {activeTab === 'orders' ? (
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                <h2 className="text-xl font-semibold mb-6 text-foreground flex items-center gap-2">
                  <Package size={22} className="text-primary" /> My Orders
                </h2>
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag size={48} className="text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No orders yet. Start shopping!</p>
                    <Link href="/shop" className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all text-sm">
                      Browse Shop
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map(order => {
                      const isExpanded = expandedOrder === order.orderId;
                      const statusSteps = ['pending', 'confirmed', 'processing', 'packed', 'dispatched', 'delivered'];
                      const currentStepIdx = statusSteps.indexOf(order.status);
                      const isCancelled = ['cancelled', 'returned', 'refunded'].includes(order.status);

                      return (
                        <div key={order.orderId} className="border border-border rounded-xl overflow-hidden bg-card hover:border-primary/30 transition-all">

                          {/* Order Card Header — always visible, click to expand */}
                          <button
                            onClick={() => setExpandedOrder(isExpanded ? null : order.orderId)}
                            className="w-full p-5 text-left"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-bold text-foreground text-sm">#{order.orderId}</p>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${statusColors[order.status] || statusColors['pending']}`}>
                                    {order.status}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                                  <p className="text-xs text-muted-foreground">{order.itemCount} item{order.itemCount !== 1 ? 's' : ''}</p>
                                  <span className="text-muted-foreground/40 text-xs">•</span>
                                  <p className="text-xs font-semibold text-foreground">Rs. {order.total.toLocaleString()}</p>
                                  {order.createdAt?.toMillis && (
                                    <>
                                      <span className="text-muted-foreground/40 text-xs">•</span>
                                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock size={10} />
                                        {new Date(order.createdAt.toMillis()).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' })}
                                      </p>
                                    </>
                                  )}
                                </div>
                                {/* Product image thumbnail row */}
                                {order.items && order.items.length > 0 && (
                                  <div className="flex items-center gap-1.5 mt-2.5">
                                    {order.items.slice(0, 4).map((item: any, idx: number) => (
                                      <div key={idx} className="w-10 h-10 rounded-lg bg-secondary border border-border overflow-hidden shrink-0">
                                        {item.image
                                          // eslint-disable-next-line @next/next/no-img-element
                                          ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                          : <div className="w-full h-full flex items-center justify-center text-base">🥿</div>
                                        }
                                      </div>
                                    ))}
                                    {order.items.length > 4 && (
                                      <div className="w-10 h-10 rounded-lg bg-muted border border-border shrink-0 flex items-center justify-center text-xs font-semibold text-muted-foreground">
                                        +{order.items.length - 4}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              {/* Chevron */}
                              <div className="shrink-0 text-muted-foreground mt-0.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s'}}>
                                  <polyline points="6 9 12 15 18 9"/>
                                </svg>
                              </div>
                            </div>
                          </button>

                          {/* ── Expanded Detail Panel ── */}
                          {isExpanded && (
                            <div className="border-t border-border px-5 pb-6 pt-5 space-y-6">

                              {/* Order Progress Stepper */}
                              {!isCancelled && (
                                <div>
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Order Progress</p>
                                  <div className="flex items-start">
                                    {statusSteps.map((step, idx) => {
                                      const isDone = currentStepIdx >= idx;
                                      const isCurrent = currentStepIdx === idx;
                                      return (
                                        <div key={step} className="flex-1 flex items-start">
                                          <div className="flex flex-col items-center w-full">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-colors ${isDone ? 'bg-primary border-primary text-white' : 'bg-background border-border text-muted-foreground'} ${isCurrent ? 'ring-2 ring-primary/20 ring-offset-1' : ''}`}>
                                              {isDone ? '✓' : idx + 1}
                                            </div>
                                            <p className="text-[9px] text-center mt-1 leading-tight text-muted-foreground capitalize font-medium hidden sm:block" style={{maxWidth: '3.5rem'}}>{step}</p>
                                          </div>
                                          {idx < statusSteps.length - 1 && (
                                            <div className={`h-0.5 flex-1 mt-3.5 transition-colors ${currentStepIdx > idx ? 'bg-primary' : 'bg-border'}`} />
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Tracking Information */}
                              {order.trackingNumber && (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                  <p className="text-xs font-bold text-blue-700 mb-2">📦 Tracking Information</p>
                                  <div className="space-y-1">
                                    <p className="text-xs text-blue-600">
                                      <span className="font-semibold">Carrier:</span> {order.carrier || 'Courier Service'}
                                    </p>
                                    <p className="text-xs text-blue-600">
                                      <span className="font-semibold">Tracking No:</span>{' '}
                                      <a
                                        href={order.carrier?.toLowerCase().includes('pronto')
                                          ? `https://pronto.lk/tracking?no=${order.trackingNumber}`
                                          : `https://koombiyocourier.lk/tracking?id=${order.trackingNumber}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline font-bold hover:text-blue-900"
                                      >
                                        {order.trackingNumber}
                                      </a>
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Items Ordered */}
                              {order.items && order.items.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Items Ordered</p>
                                  <div className="space-y-3">
                                    {order.items.map((item: any, idx: number) => (
                                      <div key={idx} className="flex items-center gap-3">
                                        <div className="w-16 h-16 rounded-xl bg-secondary overflow-hidden shrink-0 border border-border/50">
                                          {item.image
                                            // eslint-disable-next-line @next/next/no-img-element
                                            ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            : <div className="w-full h-full flex items-center justify-center text-2xl">🥿</div>
                                          }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-semibold text-foreground line-clamp-1">{item.name}</p>
                                          <p className="text-xs text-muted-foreground mt-0.5">{item.variantName || 'Standard'} · Qty: {item.quantity}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <p className="text-sm font-bold text-foreground">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                                          <p className="text-xs text-muted-foreground">@ Rs. {item.price.toLocaleString()}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Price Breakdown */}
                                  <div className="mt-4 pt-3 border-t border-border space-y-1.5">
                                    {(order.subtotal ?? 0) > 0 && (
                                      <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Subtotal</span>
                                        <span>Rs. {(order.subtotal ?? 0).toLocaleString()}</span>
                                      </div>
                                    )}
                                    {(order.shippingFee ?? 0) > 0 && (
                                      <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Delivery Fee</span>
                                        <span>Rs. {(order.shippingFee ?? 0).toLocaleString()}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between text-sm font-bold text-foreground pt-2 border-t border-border">
                                      <span>Total Paid</span>
                                      <span className="text-primary">Rs. {order.total.toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Delivery Address + Payment */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {order.shippingAddress && (
                                  <div className="p-4 bg-muted/40 rounded-xl">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Delivery Address</p>
                                    <p className="text-xs text-foreground leading-relaxed">
                                      {order.shippingAddress.addressLine1}
                                      {order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}
                                      <br />{order.shippingAddress.city}, {order.shippingAddress.district}
                                      {order.shippingAddress.postalCode && ` ${order.shippingAddress.postalCode}`}
                                    </p>
                                  </div>
                                )}
                                <div className="p-4 bg-muted/40 rounded-xl">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Payment Method</p>
                                  <p className="text-xs text-foreground">
                                    💳 {order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'PayHere Online'}
                                  </p>
                                </div>
                              </div>

                              {/* Order History Timeline */}
                              {order.timeline && order.timeline.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Order History</p>
                                  <div className="relative pl-6 space-y-4">
                                    {[...order.timeline].reverse().map((entry, idx) => {
                                      let entryDate: Date;
                                      try {
                                        if (entry.timestamp?.toDate) {
                                          entryDate = entry.timestamp.toDate();
                                        } else if (entry.timestamp?.seconds) {
                                          entryDate = new Date(entry.timestamp.seconds * 1000);
                                        } else {
                                          entryDate = new Date(entry.timestamp);
                                        }
                                      } catch {
                                        entryDate = new Date();
                                      }
                                      return (
                                        <div key={idx} className="relative">
                                          <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-primary border-2 border-background shadow-sm" />
                                          {idx < order.timeline!.length - 1 && (
                                            <div className="absolute -left-[19px] top-4 w-0.5 h-full bg-border" />
                                          )}
                                          <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${statusColors[entry.status] || statusColors['pending']}`}>
                                                {entry.status}
                                              </span>
                                              <span className="text-[10px] text-muted-foreground">
                                                {entryDate.toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' })} · {entryDate.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })}
                                              </span>
                                            </div>
                                            {entry.note && (
                                              <p className="text-xs text-muted-foreground italic">{entry.note}</p>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            ) : (
              /* ═══ PROFILE TAB ═══ */
              <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                <h2 className="text-xl font-semibold mb-6 text-foreground">Profile Details</h2>
                
                {error && (
                  <div className="p-4 mb-6 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl">
                    {error}
                  </div>
                )}
                {successMessage && (
                  <div className="p-4 mb-6 bg-success/10 border border-success/20 text-success text-sm rounded-xl">
                    {successMessage}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">First Name</label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Last Name</label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Mobile Number</label>
                    <input
                      type="tel"
                      required
                      pattern="[0-9]{10}"
                      title="Please enter a 10-digit mobile number"
                      value={mobile}
                      onChange={e => setMobile(e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    />
                  </div>
                </div>
                
                {/* Addresses */}
                <div className="border-t border-border pt-8 mb-8">
                  <h3 className="text-lg font-semibold mb-6 text-foreground">Addresses</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Shipping Address */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm text-primary uppercase tracking-wider">Default Shipping Address</h4>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Address Line 1</label>
                        <input type="text" value={shippingLine1} onChange={e => setShippingLine1(e.target.value)} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Address Line 2</label>
                        <input type="text" value={shippingLine2} onChange={e => setShippingLine2(e.target.value)} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">City</label>
                          <input type="text" value={shippingCity} onChange={e => setShippingCity(e.target.value)} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">District</label>
                          <select value={shippingDistrict} onChange={e => setShippingDistrict(e.target.value)} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors">
                            {SRI_LANKAN_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Postal Code</label>
                        <input type="text" value={shippingPostal} onChange={e => setShippingPostal(e.target.value)} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors" />
                      </div>
                    </div>

                    {/* Billing Address */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm text-primary uppercase tracking-wider">Default Billing Address</h4>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Address Line 1</label>
                        <input type="text" value={billingLine1} onChange={e => setBillingLine1(e.target.value)} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Address Line 2</label>
                        <input type="text" value={billingLine2} onChange={e => setBillingLine2(e.target.value)} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">City</label>
                          <input type="text" value={billingCity} onChange={e => setBillingCity(e.target.value)} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">District</label>
                          <select value={billingDistrict} onChange={e => setBillingDistrict(e.target.value)} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors">
                            {SRI_LANKAN_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Postal Code</label>
                        <input type="text" value={billingPostal} onChange={e => setBillingPostal(e.target.value)} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security */}
                <div className="border-t border-border pt-8 mb-6">
                  <h3 className="text-lg font-semibold mb-4 text-foreground">Security Updates</h3>
                  <p className="text-sm text-muted-foreground mb-6">If you are changing your Email or Password, you must provide your Current Password.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Current Password</label>
                      <input
                        type="password"
                        minLength={6}
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        placeholder="Required for security changes"
                        className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">New Password (Optional)</label>
                      <input
                        type="password"
                        minLength={6}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Leave blank to keep current"
                        className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                  <button 
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all text-sm disabled:opacity-70"
                  >
                    {isSaving && <Loader2 size={16} className="animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </main>
  );
}

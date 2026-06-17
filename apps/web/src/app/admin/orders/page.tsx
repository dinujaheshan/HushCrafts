'use client';

import { useState, useEffect } from 'react';
import { Search, Eye, ChevronDown, Loader2 } from '@/components/MaterialIcons';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { useAdminAuthStore } from '@/store/adminAuthStore';

const STATUS_COLORS: Record<string, string> = {
  pending: 'px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300',
  confirmed: 'px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300',
  processing: 'px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300',
  packed: 'px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border border-indigo-300 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300',
  dispatched: 'px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border border-cyan-300 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300',
  delivered: 'px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border border-teal-300 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300',
  completed: 'px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-300',
  cancelled: 'px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300',
  returned: 'px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300'
};

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'processing', 'packed', 'dispatched', 'delivered', 'completed', 'cancelled'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const admin = useAdminAuthStore(s => s.admin);
  const canWrite = admin?.role === 'super_admin' || (admin?.permissions?.orderUpdate ?? admin?.permissions?.manageOrders);
  
  // Custom tracking inputs
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'orders'));
        const list = querySnapshot.docs.map((doc): any => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            customer: data.customerDetails?.fullName || 'Customer',
            mobile: data.customerDetails?.mobileNumber || '',
            date: data.createdAt?.seconds ? new Date(data.createdAt.seconds * 1000).toISOString() : new Date().toISOString(),
            status: data.orderStatus || data.status || 'pending',
            itemsCount: data.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0,
          };
        });
        // Sort by date desc
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setOrders(list);
      } catch (err) {
        console.error('Failed to load orders from Firestore:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      if (!orderSnap.exists()) return;
      const orderData = orderSnap.data();
      
      const timelineEntry = {
        status: newStatus,
        timestamp: new Date(),
        note: adminNote || `Order status updated to ${newStatus} by admin`,
        updatedBy: 'admin'
      };

      const updateData: Record<string, any> = {
        orderStatus: newStatus,
        status: newStatus, // backup field
        updatedAt: new Date(),
        timeline: arrayUnion(timelineEntry)
      };

      if (newStatus === 'dispatched') {
        if (carrier) updateData.carrier = carrier;
        if (trackingNumber) updateData.trackingNumber = trackingNumber;
      }

      // 1. Update global order document
      await updateDoc(orderRef, updateData);

      // 2. Update order document in customer's subcollection if customerId exists
      const customerId = orderData.customerId || orderData.uid;
      if (customerId) {
        try {
          const userOrderRef = doc(db, 'users', customerId, 'orders', orderId);
          await updateDoc(userOrderRef, {
            status: newStatus,
            updatedAt: new Date()
          });
        } catch (subErr) {
          console.error(`Failed to update customer subcollection order ${orderId}:`, subErr);
        }
      }

      // 3. Send email update locally via Next.js API
      const recipientEmail = orderData.customerDetails?.email;
      if (recipientEmail) {
        import('@/lib/emailTemplates').then(({ getStatusUpdateTemplate, getOrderInvoiceTemplate }) => {
          let html = '';
          let subject = '';
          
          if (newStatus === 'completed') {
            html = getOrderInvoiceTemplate(orderId, orderData.customerDetails.fullName, {
              ...orderData,
              orderStatus: newStatus,
              status: newStatus,
              subtotal: orderData.subtotal || 0,
              shippingFee: orderData.shippingFee || 0,
              discountAmount: orderData.discountAmount || 0,
              total: orderData.total || 0,
              items: orderData.items || []
            });
            subject = `Invoice Receipt - Order Completed ${orderId}`;
          } else {
            html = getStatusUpdateTemplate(orderId, orderData.customerDetails.fullName, newStatus, adminNote || 'Status updated by administrator');
            subject = `Order Update - Order ${orderId} is now ${newStatus}`;
          }

          fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: recipientEmail,
              subject,
              html
            })
          }).catch(e => console.error('Failed to trigger email api:', e));
        });
      }

      // Update local state
      setOrders(prev => prev.map(o => o.id === orderId ? {
        ...o,
        status: newStatus,
        orderStatus: newStatus,
        carrier: newStatus === 'dispatched' && carrier ? carrier : o.carrier,
        trackingNumber: newStatus === 'dispatched' && trackingNumber ? trackingNumber : o.trackingNumber,
        timeline: [...(o.timeline || []), timelineEntry]
      } : o));

      setSelectedOrder(null);
      setCarrier('');
      setTrackingNumber('');
      setAdminNote('');
      alert(`Order ${orderId} successfully marked as ${newStatus}!`);
    } catch (err) {
      console.error('Failed to update order status:', err);
      alert('Error updating order status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const filtered = orders.filter(o => {
    const matchesSearch = o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and track all customer orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by order ID or customer name..."
            className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors capitalize cursor-pointer"
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s} className="capitalize">{s === 'all' ? 'All Statuses' : s}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Summary tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {STATUS_OPTIONS.map(s => {
          const count = s === 'all' ? orders.length : orders.filter(o => o.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-all ${
                statusFilter === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {s === 'all' ? 'All' : s} ({count})
            </button>
          );
        })}
      </div>

      {/* Loading view */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={36} className="text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">Loading orders from Firestore...</p>
        </div>
      ) : (
        /* Table */
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  {['Order ID', 'Customer', 'Items', 'Total', 'District', 'Status', 'Date', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr
                    key={order.id}
                    className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-semibold text-foreground">{order.id}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium text-foreground">{order.customer}</p>
                      <p className="text-xs text-muted-foreground">{order.mobile}</p>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-muted-foreground">{order.itemsCount} item{order.itemsCount !== 1 ? 's' : ''}</td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-primary">LKR {order.total.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-sm text-muted-foreground">{order.shippingAddress?.district || order.district || 'N/A'}</td>
                    <td className="px-4 py-3.5">
                      <span className={`rounded-full ${STATUS_COLORS[order.status] || 'px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border border-border bg-secondary text-muted-foreground'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">
                      {new Date(order.date).toLocaleDateString('en-LK', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                          title="View order"
                        >
                          <Eye size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-muted-foreground text-sm">
                      No orders found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-background rounded-2xl border border-border w-full max-w-md shadow-2xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-semibold text-foreground">Order Details</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Order ID</p>
                  <p className="font-mono font-semibold text-foreground text-xs">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <span className={`rounded-full ${STATUS_COLORS[selectedOrder.status] || 'px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border border-border bg-secondary text-muted-foreground'}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-medium text-foreground">{selectedOrder.customer}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mobile</p>
                  <p className="font-medium text-foreground">{selectedOrder.mobile}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">District</p>
                  <p className="text-foreground">{selectedOrder.shippingAddress?.district || selectedOrder.district || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-bold text-primary">LKR {selectedOrder.total.toLocaleString()}</p>
                </div>
              </div>

              {/* Items view */}
              <div className="border-t border-border pt-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Items Summary</p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto text-xs">
                  {selectedOrder.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-muted-foreground">
                      <span>{item.name} ({item.variantName}) x{item.quantity}</span>
                      <span className="font-semibold text-foreground">LKR {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Update Status & Notify</p>
                
                {canWrite ? (
                  <>
                    {/* Inputs for tracking */}
                    <div className="space-y-2">
                      <input
                        placeholder="Courier Carrier (e.g. Domex, Pronto) [Only for Dispatch]"
                        value={carrier}
                        onChange={e => setCarrier(e.target.value)}
                        className="w-full px-3 py-1.5 border border-border rounded-lg text-xs bg-background focus:outline-none focus:border-primary"
                      />
                      <input
                        placeholder="Tracking Number [Only for Dispatch]"
                        value={trackingNumber}
                        onChange={e => setTrackingNumber(e.target.value)}
                        className="w-full px-3 py-1.5 border border-border rounded-lg text-xs bg-background focus:outline-none focus:border-primary"
                      />
                      <textarea
                        placeholder="Custom update note to email customer..."
                        value={adminNote}
                        onChange={e => setAdminNote(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-1.5 border border-border rounded-lg text-xs bg-background focus:outline-none focus:border-primary resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {['confirmed', 'processing', 'packed', 'dispatched', 'delivered', 'completed', 'cancelled'].map(s => (
                        <button
                          key={s}
                          disabled={isUpdatingStatus}
                          className="px-3 py-2 text-[10px] rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors capitalize font-medium disabled:opacity-50 cursor-pointer"
                          onClick={() => handleUpdateStatus(selectedOrder.id, s)}
                        >
                          Mark as {s}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-red-500 font-bold bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                    You do not have permission to modify order status.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

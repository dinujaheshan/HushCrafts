'use client';

import { useState, useEffect } from 'react';
import { Search, User, Phone, MapPin, ShoppingBag, Loader2, Plus, Edit, Trash2 } from '@/components/MaterialIcons';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useAdminAuthStore } from '@/store/adminAuthStore';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Permission Guard
  const admin = useAdminAuthStore(s => s.admin);
  const canWrite = admin?.role === 'super_admin' || admin?.permissions.manageCustomers;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields State
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formDistrict, setFormDistrict] = useState('Colombo');

  const loadCustomersData = async () => {
    setLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const ordersSnap = await getDocs(collection(db, 'orders'));

      const usersList = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      const ordersList = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

      const customerMetrics = usersList.map(u => {
        const userOrders = ordersList.filter(o => 
          o.customerId === u.id || 
          o.uid === u.id || 
          (o.customerDetails?.email && o.customerDetails?.email.toLowerCase() === u.email?.toLowerCase()) ||
          (o.customerDetails?.mobileNumber && o.customerDetails?.mobileNumber === u.mobile)
        );

        const sortedOrders = [...userOrders].sort((a, b) => {
          const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
          const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
          return dateB - dateA;
        });

        const totalSpent = userOrders
          .filter(o => o.orderStatus !== 'cancelled' && o.status !== 'cancelled')
          .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

        const lastOrder = sortedOrders[0];
        let lastOrderText = 'No orders';
        if (lastOrder) {
          const lastDate = lastOrder.createdAt?.seconds 
            ? new Date(lastOrder.createdAt.seconds * 1000) 
            : new Date(lastOrder.createdAt);
          lastOrderText = lastDate.toLocaleDateString('en-LK', { day: '2-digit', month: 'short', year: 'numeric' });
        }

        const joinedDate = u.createdAt 
          ? new Date(u.createdAt).toLocaleDateString('en-LK', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'Unknown';

        return {
          id: u.id,
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'No Name',
          mobileNumber: u.mobile || 'N/A',
          email: u.email || 'N/A',
          district: u.district || userOrders[0]?.shippingAddress?.district || 'Colombo',
          totalOrders: userOrders.length,
          totalSpent,
          joinedDate,
          lastOrderDate: lastOrderText
        };
      });

      customerMetrics.sort((a, b) => b.totalSpent - a.totalSpent);
      setCustomers(customerMetrics);
    } catch (err) {
      console.error('Error compiling customer details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomersData();
  }, []);

  const openAddModal = () => {
    if (!canWrite) return;
    setEditingCustomer(null);
    setFormFirstName('');
    setFormLastName('');
    setFormEmail('');
    setFormMobile('');
    setFormDistrict('Colombo');
    setIsModalOpen(true);
  };

  const openEditModal = (c: any) => {
    if (!canWrite) return;
    setEditingCustomer(c);
    setFormFirstName(c.firstName);
    setFormLastName(c.lastName);
    setFormEmail(c.email === 'N/A' ? '' : c.email);
    setFormMobile(c.mobileNumber === 'N/A' ? '' : c.mobileNumber);
    setFormDistrict(c.district || 'Colombo');
    setIsModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;

    if (formMobile.length !== 10 || isNaN(Number(formMobile))) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }

    setSaving(true);
    try {
      const customerId = editingCustomer?.id || doc(collection(db, 'users')).id;

      const customerPayload: Record<string, any> = {
        firstName: formFirstName.trim(),
        lastName: formLastName.trim(),
        email: formEmail.trim().toLowerCase(),
        mobile: formMobile.trim(),
        district: formDistrict,
        updatedAt: new Date().toISOString()
      };

      if (!editingCustomer) {
        customerPayload.createdAt = new Date().toISOString();
      }

      await setDoc(doc(db, 'users', customerId), customerPayload, { merge: true });
      setIsModalOpen(false);
      await loadCustomersData();
      alert(`Customer record saved successfully!`);
    } catch (err) {
      console.error('Error saving customer:', err);
      alert('Failed to save customer record.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomer = async (c: any) => {
    if (!canWrite) return;
    if (!confirm(`Are you sure you want to permanently delete customer "${c.fullName}"? This will delete their database profile.`)) return;

    try {
      await deleteDoc(doc(db, 'users', c.id));
      await loadCustomersData();
      alert('Customer deleted successfully.');
    } catch (err) {
      console.error('Failed to delete customer:', err);
      alert('Error deleting customer account.');
    }
  };

  const filtered = customers.filter(c =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.mobileNumber.includes(search) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalSpentAll = customers.reduce((s, c) => s + c.totalSpent, 0);
  const totalOrdersAll = customers.reduce((s, c) => s + c.totalOrders, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-serif">Customer Database</h1>
          <p className="text-sm text-muted-foreground mt-1">Review users, orders, and manage client profiles.</p>
        </div>
        {canWrite && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-primary/95 transition-all shadow-md shadow-primary/10 active:scale-95 cursor-pointer self-start sm:self-auto"
          >
            <Plus size={16} /> Add Customer
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
          <Loader2 size={36} className="text-primary animate-spin" />
          <p className="text-sm font-medium">Analyzing customer profiles and receipts...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { label: 'Registered Customers', value: customers.length, icon: <User size={18} className="text-primary" /> },
              { label: 'Total Customer LTV', value: `LKR ${totalSpentAll.toLocaleString()}`, icon: <ShoppingBag size={18} className="text-primary" /> },
              { label: 'Average Orders / User', value: customers.length > 0 ? (totalOrdersAll / customers.length).toFixed(1) : '0.0', icon: <ShoppingBag size={18} className="text-primary" /> },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-card border border-border rounded-3xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-white border border-rose-300 flex items-center justify-center shrink-0 shadow-inner text-primary">
                  {icon}
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-foreground tracking-tight">{value}</p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search customers by name, mobile, or email address..."
              className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Table */}
          <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/35 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                    {['Customer Name', 'Contact Information', 'Delivery District', 'Orders Count', 'Lifetime Value', 'Date Joined', 'Last Order', 'Actions'].map(h => (
                      <th key={h} className="text-left px-6 py-4">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(customer => (
                    <tr key={customer.id} className="border-b border-border/40 last:border-0 hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0 uppercase shadow-inner">
                            {customer.fullName.charAt(0)}
                          </div>
                          <p className="font-semibold text-sm text-foreground">{customer.fullName}</p>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                          <Phone size={11} /> {customer.mobileNumber}
                        </div>
                        {customer.email && (
                          <p className="text-xs text-muted-foreground mt-0.5 font-medium">{customer.email}</p>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground font-semibold">
                          <MapPin size={12} className="text-primary" /> {customer.district}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-sm font-bold text-foreground">{customer.totalOrders}</td>
                      <td className="px-6 py-3.5 text-sm font-bold text-primary">
                        LKR {customer.totalSpent.toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-muted-foreground font-semibold">{customer.joinedDate}</td>
                      <td className="px-6 py-3.5 text-xs text-muted-foreground font-semibold">{customer.lastOrderDate}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {canWrite ? (
                            <>
                              <button
                                onClick={() => openEditModal(customer)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl border border-border bg-card hover:bg-secondary transition-colors text-muted-foreground hover:text-primary cursor-pointer"
                                title="Edit Customer"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteCustomer(customer)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl border border-border bg-card hover:bg-secondary transition-colors text-muted-foreground hover:text-red-500 cursor-pointer"
                                title="Delete Customer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Read Only</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-16 text-muted-foreground text-sm font-medium">
                        No customers found matching search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Customer CRUD Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-card/40">
              <h3 className="font-serif font-bold text-lg text-foreground">
                {editingCustomer ? `Edit Customer: ${editingCustomer.fullName}` : 'Add New Customer'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">First Name</label>
                  <input
                    required
                    value={formFirstName}
                    onChange={e => setFormFirstName(e.target.value)}
                    placeholder="Amaya"
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Last Name</label>
                  <input
                    required
                    value={formLastName}
                    onChange={e => setFormLastName(e.target.value)}
                    placeholder="Perera"
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Email Address</label>
                <input
                  required
                  type="email"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  placeholder="amaya@example.com"
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Mobile Number (10 digits)</label>
                <input
                  required
                  type="tel"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  value={formMobile}
                  onChange={e => setFormMobile(e.target.value)}
                  placeholder="0771234567"
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">District</label>
                <input
                  required
                  value={formDistrict}
                  onChange={e => setFormDistrict(e.target.value)}
                  placeholder="e.g. Colombo, Kandy"
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="flex-1 py-2.5 border border-border rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-secondary transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary/95 transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 size={12} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save Customer'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

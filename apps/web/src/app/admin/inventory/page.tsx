'use client';

import { useState, useEffect } from 'react';
import { Search, AlertTriangle, TrendingDown, Edit2, ChevronDown, Loader2 } from '@/components/MaterialIcons';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { useAdminAuthStore } from '@/store/adminAuthStore';

const STATUS_STYLES: Record<string, { badge: string; label: string }> = {
  in_stock: { badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20 border border-emerald-500/20', label: 'In Stock' },
  low_stock: { badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 dark:bg-amber-500/20 border border-amber-500/20', label: 'Low Stock' },
  out_of_stock: { badge: 'bg-red-500/10 text-red-600 dark:text-red-400 dark:bg-red-500/20 border border-red-500/20', label: 'Out of Stock' }
};

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [editItem, setEditItem] = useState<any | null>(null);
  const [editQty, setEditQty] = useState('');
  const [editThreshold, setEditThreshold] = useState('');
  const [saving, setSaving] = useState(false);

  // Permission Guard
  const admin = useAdminAuthStore(s => s.admin);
  const canWrite = admin?.role === 'super_admin' || admin?.permissions.manageInventory;

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const prods = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      setProducts(prods);

      const flattenedInventory: any[] = [];
      prods.forEach(product => {
        const variants = product.variants || [];
        variants.forEach((v: any) => {
          const qty = v.quantity !== undefined ? Number(v.quantity) : (v.status === 'in_stock' ? 15 : v.status === 'low_stock' ? 3 : 0);
          const threshold = v.threshold !== undefined ? Number(v.threshold) : 5;
          let computedStatus = 'in_stock';
          if (qty === 0) {
            computedStatus = 'out_of_stock';
          } else if (qty <= threshold) {
            computedStatus = 'low_stock';
          }

          flattenedInventory.push({
            sku: v.sku || `${product.id}-${v.attributes.size}`,
            productId: product.id,
            productName: product.name,
            color: v.attributes.color || 'Standard',
            size: v.attributes.size,
            quantity: qty,
            threshold: threshold,
            status: computedStatus,
            variantId: v.id
          });
        });
      });
      setInventoryList(flattenedInventory);
    } catch (err) {
      console.error('Error loading inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleOpenEdit = (item: any) => {
    if (!canWrite) return;
    setEditItem(item);
    setEditQty(item.quantity.toString());
    setEditThreshold(item.threshold.toString());
  };

  const handleSaveChanges = async () => {
    if (!canWrite || !editItem) return;

    const qty = Number(editQty);
    const threshold = Number(editThreshold);

    if (isNaN(qty) || qty < 0 || isNaN(threshold) || threshold < 0) {
      alert('Please enter valid positive numbers.');
      return;
    }

    setSaving(true);
    try {
      // Find parent product document
      const parentProduct = products.find(p => p.id === editItem.productId);
      if (!parentProduct) throw new Error('Parent product not found.');

      let newStatus = 'in_stock';
      if (qty === 0) {
        newStatus = 'out_of_stock';
      } else if (qty <= threshold) {
        newStatus = 'low_stock';
      }

      // Update the variants array
      const updatedVariants = (parentProduct.variants || []).map((v: any) => {
        if (v.id === editItem.variantId) {
          return {
            ...v,
            quantity: qty,
            threshold: threshold,
            status: newStatus
          };
        }
        return v;
      });

      // Update in Firestore
      await updateDoc(doc(db, 'products', editItem.productId), {
        variants: updatedVariants,
        updatedAt: new Date().toISOString()
      });

      // Refresh list
      await fetchInventory();
      setEditItem(null);
      alert('Stock successfully updated!');
    } catch (err) {
      console.error('Error updating stock level:', err);
      alert('Failed to update stock in Firestore.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = inventoryList.filter(item => {
    const matchesSearch = item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.productName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const lowStockCount = inventoryList.filter(i => i.status === 'low_stock').length;
  const outOfStockCount = inventoryList.filter(i => i.status === 'out_of_stock').length;
  const inStockCount = inventoryList.filter(i => i.status === 'in_stock').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-serif">Inventory Control</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitor slipper sizes, stock counts, and threshold values.</p>
      </div>

      {/* Alert cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-card border border-border rounded-3xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-white border border-rose-300 flex items-center justify-center shrink-0 shadow-sm text-primary">
            <TrendingDown size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-3xl font-extrabold text-foreground tracking-tight">{lowStockCount}</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">Low Stock SKUs</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-3xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-white border border-rose-300 flex items-center justify-center shrink-0 shadow-sm text-primary">
            <AlertTriangle size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-3xl font-extrabold text-foreground tracking-tight">{outOfStockCount}</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">Out of Stock</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-3xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-white border border-rose-300 flex items-center justify-center shrink-0 shadow-sm text-primary font-bold">
            ✓
          </div>
          <div>
            <p className="text-3xl font-extrabold text-foreground tracking-tight">{inStockCount}</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">Well Stocked SKUs</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by SKU or slipper name..."
            className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
          <Loader2 size={36} className="text-primary animate-spin" />
          <p className="text-sm font-medium">Fetching active stock levels...</p>
        </div>
      ) : (
        <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/35 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                  {['SKU', 'Slipper Model', 'Size Variant', 'Stock Level', 'Min Threshold', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-6 py-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr
                    key={item.sku}
                    className={`border-b border-border/40 last:border-0 transition-colors ${
                      item.status === 'out_of_stock' ? 'bg-red-500/5 dark:bg-red-950/5' :
                      item.status === 'low_stock' ? 'bg-amber-500/5 dark:bg-amber-950/5' : ''
                    } hover:bg-secondary/20`}
                  >
                    <td className="px-6 py-3.5 font-mono text-xs text-muted-foreground">{item.sku}</td>
                    <td className="px-6 py-3.5 text-sm font-bold text-foreground max-w-[200px] truncate">{item.productName}</td>
                    <td className="px-6 py-3.5 text-sm text-muted-foreground font-semibold">{item.color} / EU {item.size}</td>
                    <td className="px-6 py-3.5">
                      <span className={`text-sm font-extrabold ${
                        item.quantity === 0 ? 'text-red-500' :
                        item.quantity <= item.threshold ? 'text-amber-500' :
                        'text-foreground/80'
                      }`}>
                        {item.quantity}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-1 uppercase font-bold">units</span>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-muted-foreground font-semibold">{item.threshold} units</td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${STATUS_STYLES[item.status]?.badge}`}>
                        {STATUS_STYLES[item.status]?.label}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex justify-end">
                        {canWrite ? (
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider border border-border rounded-xl bg-card hover:bg-secondary text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                          >
                            <Edit2 size={11} /> Update
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Read Only</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-muted-foreground text-sm font-medium">
                      No matching inventory lines found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit stock modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-card/40">
              <h3 className="font-serif font-bold text-lg text-foreground">Update Stock Qty</h3>
              <button onClick={() => setEditItem(null)} className="text-muted-foreground hover:text-foreground cursor-pointer">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="font-mono text-xs text-muted-foreground">{editItem.sku}</p>
                <p className="font-bold text-foreground text-sm mt-0.5">{editItem.productName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{editItem.color} / EU {editItem.size}</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  New Quantity
                </label>
                <input
                  type="number"
                  value={editQty}
                  onChange={e => setEditQty(e.target.value)}
                  min="0"
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Low Stock Alert Threshold
                </label>
                <input
                  type="number"
                  value={editThreshold}
                  onChange={e => setEditThreshold(e.target.value)}
                  min="0"
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-border mt-6">
                <button
                  onClick={() => setEditItem(null)}
                  disabled={saving}
                  className="flex-1 py-2.5 border border-border rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-secondary transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary/95 transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 size={12} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save Stock'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

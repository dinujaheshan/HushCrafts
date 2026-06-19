'use client';

import { useState, useEffect } from 'react';
import {
  Plus, Search, Edit, Trash2, Archive, Loader2,
  Package, ChevronDown, Check, Camera, X
} from '@/components/MaterialIcons';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc, addDoc } from 'firebase/firestore';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import Image from 'next/image';

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20 border border-emerald-500/20',
  draft: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 dark:bg-amber-500/20 border border-amber-500/20',
  archived: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 dark:bg-slate-500/20 border border-slate-500/20'
};

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Permission Guard
  const admin = useAdminAuthStore(s => s.admin);
  const canManage = admin?.role === 'super_admin' || admin?.permissions?.manageProducts;
  const canCreate = admin?.role === 'super_admin' || (admin?.permissions?.productCreate ?? admin?.permissions?.manageProducts);
  const canUpdate = admin?.role === 'super_admin' || (admin?.permissions?.productUpdate ?? admin?.permissions?.manageProducts);
  const canDelete = admin?.role === 'super_admin' || (admin?.permissions?.productDelete ?? admin?.permissions?.manageProducts);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySlug, setNewCategorySlug] = useState('');

  // Form Fields State
  const [formName, setFormName] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formStatus, setFormStatus] = useState<'published' | 'draft' | 'archived'>('published');
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formIsBestSeller, setFormIsBestSeller] = useState(false);
  const [formIsNewArrival, setFormIsNewArrival] = useState(false);
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formSizes, setFormSizes] = useState<string[]>(['36', '37', '38']);
  const [variantSettings, setVariantSettings] = useState<Record<string, { quantity: number; threshold: number }>>({});

  // Load Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const prodSnapshot = await getDocs(collection(db, 'products'));
      const catSnapshot = await getDocs(collection(db, 'categories'));

      const catList = catSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      setCategories(catList);

      const prodList = prodSnapshot.docs.map((doc): any => {
        const data = doc.data();
        // Calculate total stock from variants
        const variants = data.variants || [];
        const stockSum = variants.reduce((sum: number, v: any) => sum + (Number(v.quantity) || (v.status === 'in_stock' ? 15 : v.status === 'low_stock' ? 3 : 0)), 0);

        return {
          id: doc.id,
          ...data,
          stock: stockSum,
          categoryName: catList.find(c => c.id === data.categoryIds?.[0])?.name || 'Uncategorized'
        };
      });
      setProducts(prodList);
    } catch (err) {
      console.error('Error loading products/categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    if (!canCreate) return;
    setEditingProduct(null);
    setFormName('');
    setFormSummary('');
    setFormDescription('');
    setFormPrice('');
    setFormCategory(categories[0]?.id || '');
    setFormStatus('published');
    setFormIsFeatured(false);
    setFormIsBestSeller(false);
    setFormIsNewArrival(false);
    setFormImages([]);
    setFormSizes(['36', '37', '38']);
    setVariantSettings({
      '36': { quantity: 15, threshold: 5 },
      '37': { quantity: 15, threshold: 5 },
      '38': { quantity: 15, threshold: 5 },
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: any) => {
    if (!canUpdate) return;
    setEditingProduct(p);
    setFormName(p.name);
    setFormSummary(p.summary || '');
    setFormDescription(p.description || '');
    setFormPrice(p.basePrice?.toString() || '');
    setFormCategory(p.categoryIds?.[0] || categories[0]?.id || '');
    setFormStatus(p.status || 'published');
    setFormIsFeatured(p.isFeatured || false);
    setFormIsBestSeller(p.isBestSeller || false);
    setFormIsNewArrival(p.isNewArrival || false);
    setFormImages(p.images || []);
    const sizes = p.variants?.map((v: any) => v.attributes.size) || ['36', '37', '38'];
    setFormSizes(sizes);
    
    const settings: Record<string, { quantity: number; threshold: number }> = {};
    p.variants?.forEach((v: any) => {
      settings[v.attributes.size] = {
        quantity: v.quantity !== undefined ? Number(v.quantity) : 15,
        threshold: v.threshold !== undefined ? Number(v.threshold) : 5,
      };
    });
    // Backfill any sizes that don't have variants
    sizes.forEach((s: string) => {
      if (!settings[s]) {
        settings[s] = { quantity: 15, threshold: 5 };
      }
    });
    setVariantSettings(settings);
    setIsModalOpen(true);
  };

  // Cloudinary image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.url) {
        setFormImages(prev => [...prev, data.url]);
      } else {
        alert(data.error || 'Image upload failed');
      }
    } catch (err) {
      console.error('Image upload error:', err);
      alert('Failed to upload image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    setFormImages(prev => prev.filter((_, i) => i !== index));
  };

  const toggleSize = (size: string) => {
    setFormSizes(prev => {
      const next = prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size];
      if (!prev.includes(size)) {
        setVariantSettings(curr => ({
          ...curr,
          [size]: { quantity: 15, threshold: 5 }
        }));
      }
      return next;
    });
  };

  const handleCreateCategory = async () => {
    const trimmedName = newCategoryName.trim();
    const slug = slugify(newCategorySlug || newCategoryName);

    if (!trimmedName) {
      alert('Please enter a category name.');
      return;
    }

    if (!slug) {
      alert('Please enter a valid category name.');
      return;
    }

    setIsCreatingCategory(true);
    try {
      const docRef = await addDoc(collection(db, 'categories'), {
        name: trimmedName,
        slug,
        description: '',
        image: '',
        productCount: 0,
        createdAt: new Date().toISOString(),
      });

      const createdCategory = {
        id: docRef.id,
        name: trimmedName,
        slug,
        description: '',
        image: '',
        productCount: 0,
      };

      setCategories(prev =>
        [...prev, createdCategory].sort((a, b) => a.name.localeCompare(b.name))
      );
      setFormCategory(docRef.id);
      setIsCategoryModalOpen(false);
      setNewCategoryName('');
      setNewCategorySlug('');
      alert(`Category "${trimmedName}" created successfully.`);
    } catch (err) {
      console.error('Failed to create category:', err);
      alert('Failed to create category.');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct ? !canUpdate : !canCreate) return;

    const price = Number(formPrice);
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid base price.');
      return;
    }

    const productId = editingProduct?.id || formName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Generate variants dynamically based on selected sizes
    const generatedVariants = formSizes.map((size, index) => {
      // Re-use existing variant properties if editing
      const existing = editingProduct?.variants?.find((v: any) => v.attributes.size === size);
      const settings = variantSettings[size] || { quantity: 15, threshold: 5 };
      
      let computedStatus = 'in_stock';
      if (settings.quantity === 0) {
        computedStatus = 'out_of_stock';
      } else if (settings.quantity <= settings.threshold) {
        computedStatus = 'low_stock';
      }

      return {
        id: existing?.id || `v${index + 1}`,
        sku: `${productId}-${size}`,
        price: price,
        status: computedStatus,
        quantity: Number(settings.quantity),
        threshold: Number(settings.threshold),
        attributes: {
          ...existing?.attributes,
          size: size,
          color: existing?.attributes?.color || 'Standard'
        }
      };
    });

    const productPayload = {
      name: formName,
      summary: formSummary,
      description: formDescription,
      basePrice: price,
      categoryIds: [formCategory],
      images: formImages.length > 0 ? formImages : ['/images/red-sandals.png'], // fallback
      status: formStatus,
      isFeatured: formIsFeatured,
      isBestSeller: formIsBestSeller,
      isNewArrival: formIsNewArrival,
      seo: editingProduct?.seo || { title: formName, description: formSummary, keywords: [] },
      variants: generatedVariants,
      averageRating: editingProduct?.averageRating || 5.0,
      reviewCount: editingProduct?.reviewCount || 0,
      totalSold: editingProduct?.totalSold || 0,
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'products', productId), productPayload, { merge: true });
      setIsModalOpen(false);
      await fetchData();
      alert(`Product "${formName}" saved successfully!`);
    } catch (err) {
      console.error('Failed to save product in Firestore:', err);
      alert('Failed to save product. Please check console for errors.');
    }
  };

  const handleArchive = async (p: any) => {
    if (!canUpdate) return;
    const confirmMsg = p.status === 'archived' ? 'Restore product from archive?' : 'Archive this product?';
    if (!confirm(confirmMsg)) return;

    try {
      await updateDoc(doc(db, 'products', p.id), {
        status: p.status === 'archived' ? 'published' : 'archived',
        updatedAt: new Date().toISOString()
      });
      await fetchData();
    } catch (err) {
      console.error('Archive failed:', err);
    }
  };

  const handleDelete = async (p: any) => {
    if (!canDelete) return;
    if (!confirm(`Are you absolutely sure you want to delete "${p.name}" permanently from the database? This cannot be undone.`)) return;

    try {
      await deleteDoc(doc(db, 'products', p.id));
      await fetchData();
      alert('Product deleted successfully.');
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-serif">Product Catalog</h1>
          <p className="text-sm text-muted-foreground mt-1">Add, edit, archive, and manage Hush Craft slippers.</p>
        </div>
        {canCreate && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-primary/95 transition-all shadow-md shadow-primary/10 active:scale-95 cursor-pointer self-start sm:self-auto"
          >
            <Plus size={16} /> Add Slippers
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products by name or SKU..."
            className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors cursor-pointer"
          >
            <option value="all">All Catalog Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
            <option value="archived">Archived</option>
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="font-semibold text-foreground">Add New Category</h3>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="rounded-xl p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category Name</label>
                <input
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Bridal Slippers"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Slug (optional)</label>
                <input
                  value={newCategorySlug}
                  onChange={e => setNewCategorySlug(e.target.value)}
                  placeholder="bridal-slippers"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 border-t border-border px-5 py-4">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="flex-1 rounded-xl border border-border px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={isCreatingCategory}
                className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {isCreatingCategory ? 'Saving...' : 'Save Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
          <Loader2 size={36} className="text-primary animate-spin" />
          <p className="text-sm font-medium">Fetching product data from Firestore...</p>
        </div>
      ) : (
        <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/35 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                  {['Product', 'SKU / ID', 'Category', 'Base Price', 'Stock Level', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-6 py-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(product => (
                  <tr
                    key={product.id}
                    className="border-b border-border/40 last:border-0 hover:bg-secondary/20 transition-colors"
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-secondary overflow-hidden relative shrink-0 border border-border">
                          {product.images?.[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="44px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={20} className="text-muted-foreground/50" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-foreground">{product.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {product.isBestSeller && (
                              <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase">
                                Best Seller
                              </span>
                            )}
                            {product.isFeatured && (
                              <span className="text-[9px] bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded font-bold uppercase">
                                Featured
                              </span>
                            )}
                            {product.isNewArrival && (
                              <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase">
                                New Arrival
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs text-muted-foreground">{product.id}</td>
                    <td className="px-6 py-3.5 text-sm text-muted-foreground font-medium">{product.categoryName}</td>
                    <td className="px-6 py-3.5 text-sm font-bold text-primary">LKR {product.basePrice.toLocaleString()}</td>
                    <td className="px-6 py-3.5">
                      <span className={`text-xs font-bold ${product.stock === 0 ? 'text-red-500' : product.stock <= 8 ? 'text-amber-500' : 'text-foreground/85'}`}>
                        {product.stock === 0 ? 'Out of stock' : `${product.stock} units`}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${STATUS_STYLES[product.status] || 'bg-secondary text-muted-foreground'}`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {canUpdate && (
                          <>
                            <button
                              onClick={() => openEditModal(product)}
                              className="w-8 h-8 flex items-center justify-center rounded-xl border border-border bg-card hover:bg-secondary transition-colors text-muted-foreground hover:text-primary cursor-pointer"
                              title="Edit product"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleArchive(product)}
                              className="w-8 h-8 flex items-center justify-center rounded-xl border border-border bg-card hover:bg-secondary transition-colors text-muted-foreground hover:text-amber-600 cursor-pointer"
                              title={product.status === 'archived' ? 'Restore product' : 'Archive product'}
                            >
                              <Archive size={14} />
                            </button>
                          </>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(product)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl border border-border bg-card hover:bg-secondary transition-colors text-muted-foreground hover:text-red-500 cursor-pointer"
                            title="Delete product"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        {!canUpdate && !canDelete && (
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Read Only</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-muted-foreground text-sm font-medium">
                      No slippers found matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CRUD Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-background border border-border rounded-3xl w-full max-w-2xl shadow-2xl my-8 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-card/40">
              <h3 className="font-serif font-bold text-lg text-foreground">
                {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add New Slippers'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Product Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Product Name</label>
                  <input
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g. Velvet Rose Slippers"
                    className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Base Price (LKR)</label>
                  <input
                    required
                    type="number"
                    value={formPrice}
                    onChange={e => setFormPrice(e.target.value)}
                    placeholder="e.g. 2850"
                    className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {/* Summary */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Short Summary</label>
                <input
                  required
                  value={formSummary}
                  onChange={e => setFormSummary(e.target.value)}
                  placeholder="A one-line description of features for previewing..."
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Detailed Description</label>
                <textarea
                  required
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  rows={4}
                  placeholder="Write full product description..."
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category Selection */}
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Category</label>
                  <div className="relative">
                    <select
                      value={formCategory}
                      onChange={e => setFormCategory(e.target.value)}
                      className="w-full appearance-none px-4 py-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors cursor-pointer"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="mt-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    + Add New Category
                  </button>
                </div>

                {/* Status Selection */}
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Catalog Status</label>
                  <div className="relative">
                    <select
                      value={formStatus}
                      onChange={e => setFormStatus(e.target.value as any)}
                      className="w-full appearance-none px-4 py-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors cursor-pointer"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {/* Flags toggling */}
                <div className="flex flex-col justify-center gap-3 pt-4 pl-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={formIsFeatured}
                      onChange={e => setFormIsFeatured(e.target.checked)}
                      className="w-4 h-4 border-2 border-muted-foreground rounded text-primary focus:ring-primary focus:ring-offset-background transition-colors cursor-pointer"
                    />
                    Featured Product
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={formIsBestSeller}
                      onChange={e => setFormIsBestSeller(e.target.checked)}
                      className="w-4 h-4 border-2 border-muted-foreground rounded text-primary focus:ring-primary focus:ring-offset-background transition-colors cursor-pointer"
                    />
                    Best Seller Slipper
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={formIsNewArrival}
                      onChange={e => setFormIsNewArrival(e.target.checked)}
                      className="w-4 h-4 border-2 border-muted-foreground rounded text-primary focus:ring-primary focus:ring-offset-background transition-colors cursor-pointer"
                    />
                    New Arrival Slipper
                  </label>
                </div>
              </div>

              {/* Sizes Variants Toggle Checklist */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Active Size Variants</label>
                <div className="flex flex-wrap gap-2">
                  {['36', '37', '38', '39', '40', '41', '42'].map(size => {
                    const isSelected = formSizes.includes(size);
                    return (
                      <button
                        type="button"
                        key={size}
                        onClick={() => toggleSize(size)}
                        className={`w-11 h-11 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                            : 'border-border text-foreground hover:border-primary/50'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sizes Stock Configurations Panel */}
              {formSizes.length > 0 && (
                <div className="space-y-3 p-4 bg-secondary/15 rounded-2xl border border-border/50">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Configure Stock Qty & Thresholds</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {formSizes.map(size => {
                      const settings = variantSettings[size] || { quantity: 15, threshold: 5 };
                      return (
                        <div key={size} className="flex items-center gap-3 bg-background p-3 rounded-xl border border-border">
                          <span className="w-14 font-bold text-xs uppercase text-primary shrink-0">EU {size}</span>
                          <div className="flex-1 flex gap-2">
                            <div className="flex-1">
                              <label className="block text-[8px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Qty</label>
                              <input
                                type="number"
                                min={0}
                                value={settings.quantity}
                                onChange={e => {
                                  const val = Number(e.target.value);
                                  setVariantSettings(prev => ({
                                    ...prev,
                                    [size]: { ...prev[size], quantity: val }
                                  }));
                                }}
                                className="w-full px-2 py-1 border border-border rounded-lg text-xs bg-background focus:outline-none focus:border-primary"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="block text-[8px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Threshold</label>
                              <input
                                type="number"
                                min={0}
                                value={settings.threshold}
                                onChange={e => {
                                  const val = Number(e.target.value);
                                  setVariantSettings(prev => ({
                                    ...prev,
                                    [size]: { ...prev[size], threshold: val }
                                  }));
                                }}
                                className="w-full px-2 py-1 border border-border rounded-lg text-xs bg-background focus:outline-none focus:border-primary"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Cloudinary Images Upload */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Product Images</label>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {formImages.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl border border-border overflow-hidden bg-secondary">
                      <Image
                        src={url}
                        alt="Product upload"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-[10px] cursor-pointer shadow-md border border-white/10"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {/* Add Image File Input Box */}
                  <label className="aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-primary transition-colors cursor-pointer bg-card/30">
                    {uploadingImage ? (
                      <Loader2 size={24} className="text-primary animate-spin" />
                    ) : (
                      <>
                        <Camera size={24} className="text-muted-foreground" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Upload</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingImage}
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border mt-6 bg-card/20 -mx-6 -mb-6 p-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-border rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-secondary transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary/95 transition-all shadow-md shadow-primary/10 cursor-pointer"
                >
                  Save Product Slippers
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

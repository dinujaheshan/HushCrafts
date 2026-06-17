'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection, doc, getDocs, addDoc, updateDoc,
  deleteDoc, serverTimestamp
} from 'firebase/firestore';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import {
  ShieldAlert, Plus, Loader2, CheckCircle2,
  Pencil, Trash2, X, Tag, Image as ImageIcon
} from '@/components/MaterialIcons';
import Image from 'next/image';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
  createdAt?: any;
}

interface CategoryForm {
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
}

const emptyForm: CategoryForm = {
  name: '',
  slug: '',
  description: '',
  image: '',
  productCount: 0,
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AdminCategoriesPage() {
  const admin = useAdminAuthStore(s => s.admin);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Permission check
  const canManage =
    admin?.role === 'super_admin' || admin?.permissions?.manageProducts;

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'categories'));
      const list: Category[] = snap.docs.map(d => ({
        id: d.id,
        name: d.data().name || '',
        slug: d.data().slug || '',
        description: d.data().description || '',
        image: d.data().image || '',
        productCount: d.data().productCount || 0,
        createdAt: d.data().createdAt,
      }));
      // Sort by name alphabetically
      list.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(list);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setError('Failed to load categories. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  function handleNameChange(name: string) {
    setForm(prev => ({
      ...prev,
      name,
      // Auto-generate slug only if not editing existing (or slug is empty/auto-generated)
      slug: editingId ? prev.slug : slugify(name),
    }));
  }

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
    setSuccess(null);
    setShowForm(true);
  }

  function openEdit(cat: Category) {
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      productCount: cat.productCount,
    });
    setEditingId(cat.id);
    setError(null);
    setSuccess(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.name.trim()) {
      setError('Category name is required.');
      return;
    }
    if (!form.slug.trim()) {
      setError('Slug is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        image: form.image.trim(),
        productCount: Number(form.productCount) || 0,
      };

      if (editingId) {
        await updateDoc(doc(db, 'categories', editingId), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
        setSuccess(`Category "${form.name}" updated successfully!`);
      } else {
        await addDoc(collection(db, 'categories'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        setSuccess(`Category "${form.name}" created successfully!`);
      }

      await fetchCategories();
      closeForm();
    } catch (err: any) {
      console.error('Save category failed:', err);
      setError(err.message || 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (
      !confirm(
        `Delete category "${cat.name}"? This will NOT delete any products — they will just be uncategorized.`
      )
    )
      return;

    setDeleting(cat.id);
    try {
      await deleteDoc(doc(db, 'categories', cat.id));
      setSuccess(`Category "${cat.name}" deleted.`);
      setCategories(prev => prev.filter(c => c.id !== cat.id));
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Failed to delete category.');
    } finally {
      setDeleting(null);
    }
  };

  // ── Access Guard ─────────────────────────────────────────────────────────────
  if (!canManage) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 bg-card border border-border rounded-3xl shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
          <ShieldAlert size={36} />
        </div>
        <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
        <p className="text-muted-foreground text-sm max-w-md mt-2 leading-relaxed">
          You need the <strong>Manage Products</strong> permission to access category management.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-serif">
            Categories
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage product categories displayed on the shop and home page.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all shadow-md shadow-primary/10 cursor-pointer"
        >
          <Plus size={14} />
          New Category
        </button>
      </div>

      {/* Global feedback */}
      {success && !showForm && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs rounded-xl">
          <CheckCircle2 size={14} className="shrink-0" />
          <span className="font-semibold">{success}</span>
        </div>
      )}
      {error && !showForm && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl font-semibold">
          {error}
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-primary" />
                <h3 className="font-serif font-bold text-base text-foreground">
                  {editingId ? 'Edit Category' : 'New Category'}
                </h3>
              </div>
              <button
                onClick={closeForm}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label="Close form"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl">
                  {error}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Category Name <span className="text-destructive">*</span>
                </label>
                <input
                  required
                  value={form.name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="e.g. Bridal Slippers"
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  URL Slug <span className="text-destructive">*</span>
                </label>
                <input
                  required
                  value={form.slug}
                  onChange={e => setForm(prev => ({ ...prev, slug: slugify(e.target.value) }))}
                  placeholder="e.g. bridal-slippers"
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors font-mono"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Auto-generated from name. Used in URLs like /shop?categoryId=...
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Short description of this category..."
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Image URL
                </label>
                <input
                  type="url"
                  value={form.image}
                  onChange={e => setForm(prev => ({ ...prev, image: e.target.value }))}
                  placeholder="https://firebasestorage.googleapis.com/..."
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors"
                />
                {form.image && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="relative w-14 h-14 rounded-full overflow-hidden border border-border">
                      <Image
                        src={form.image}
                        alt="Category image preview"
                        fill
                        className="object-cover"
                        sizes="56px"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">Image preview</span>
                  </div>
                )}
              </div>

              {/* Product Count */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Product Count (Display)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.productCount}
                  onChange={e => setForm(prev => ({ ...prev, productCount: Number(e.target.value) }))}
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Displayed on the shop page. Update manually when adding/removing products.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 py-2.5 border border-border rounded-xl text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-secondary transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Saving...
                    </>
                  ) : editingId ? (
                    'Update Category'
                  ) : (
                    'Create Category'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories Table */}
      <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-border bg-secondary/15 flex items-center gap-2">
          <Tag size={16} className="text-primary" />
          <h3 className="font-serif font-bold text-base text-foreground">
            All Categories
          </h3>
          <span className="ml-auto text-xs font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
            {categories.length}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 size={32} className="text-primary animate-spin" />
            <p className="text-xs font-semibold">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
            <div className="w-14 h-14 rounded-2xl bg-secondary/50 flex items-center justify-center">
              <ImageIcon size={24} className="text-muted-foreground/50" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm text-foreground">No categories yet</p>
              <p className="text-xs mt-1">Create your first category to organize products.</p>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all cursor-pointer"
            >
              <Plus size={12} /> Create Category
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/35 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-4">Category</th>
                  <th className="px-4 py-4">Slug</th>
                  <th className="px-4 py-4 text-center">Products</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr
                    key={cat.id}
                    className="border-b border-border/40 last:border-0 hover:bg-secondary/10 transition-colors"
                  >
                    {/* Category name + image */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted border border-border shrink-0">
                          {cat.image ? (
                            <Image
                              src={cat.image}
                              alt={`${cat.name} category`}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-bold text-primary">
                                {cat.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-foreground text-sm">{cat.name}</p>
                          {cat.description && (
                            <p className="text-[10px] text-muted-foreground line-clamp-1 max-w-[200px]">
                              {cat.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="px-4 py-4">
                      <code className="text-xs font-mono bg-secondary/50 px-2 py-0.5 rounded text-muted-foreground">
                        {cat.slug}
                      </code>
                    </td>

                    {/* Product count */}
                    <td className="px-4 py-4 text-center">
                      <span className="text-xs font-bold text-foreground">
                        {cat.productCount}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => openEdit(cat)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-border text-muted-foreground hover:text-primary hover:border-primary rounded-xl transition-all cursor-pointer"
                          aria-label={`Edit ${cat.name}`}
                        >
                          <Pencil size={12} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          disabled={deleting === cat.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                          aria-label={`Delete ${cat.name}`}
                        >
                          {deleting === cat.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Trash2 size={12} />
                          )}
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

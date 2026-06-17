'use client';

import { useState, useEffect } from 'react';
import { db, firebaseConfig } from '@/lib/firebase';
import { collection, deleteDoc, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import {
  Users, Settings, ShieldAlert, Plus, Loader2,
  CheckCircle2, Trash2, Shield
} from '@/components/MaterialIcons';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

export default function AdminSettingsPage() {
  const currentAdmin = useAdminAuthStore(s => s.admin);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Admin Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'super_admin'>('admin');
  
  // Selected permissions for new admin
  const [permissions, setPermissions] = useState({
    manageProducts: true,
    productCreate: true,
    productUpdate: true,
    productDelete: true,
    manageCategories: true,
    categoryCreate: true,
    categoryUpdate: true,
    categoryDelete: true,
    manageInventory: true,
    inventoryUpdate: true,
    manageOrders: true,
    orderUpdate: true,
    orderDelete: true,
    manageCustomers: false,
    customerUpdate: false,
    customerDelete: false,
    manageAnalytics: false,
    manageFeedbacks: false,
    feedbackApprove: false,
    feedbackDelete: false,
    manageMessages: false,
    messageReply: false,
    messageDelete: false,
    manageAdmins: false
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'admins'));
      const list = snapshot.docs.map(doc => doc.data());
      setAdmins(list);
    } catch (err) {
      console.error('Failed to load administrator accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleToggleActive = async (adminId: string, currentActiveStatus: boolean) => {
    if (adminId === currentAdmin?.uid) {
      alert('You cannot deactivate your own account!');
      return;
    }
    if (!confirm('Are you sure you want to change this administrator\'s active status? Inactive admins will be instantly blocked from logging in.')) {
      return;
    }

    try {
      await updateDoc(doc(db, 'admins', adminId), {
        isActive: !currentActiveStatus
      });
      await fetchAdmins();
    } catch (err) {
      console.error('Failed to toggle status:', err);
      alert('Failed to update active status.');
    }
  };

  const handlePermissionToggle = async (adminId: string, permissionKey: string, currentValue: boolean) => {
    const adminToUpdate = admins.find(a => a.uid === adminId);
    if (!adminToUpdate) return;
    if (adminToUpdate.role === 'super_admin') return; // Cannot restrict super admin

    const updatedPermissions = {
      ...adminToUpdate.permissions,
      [permissionKey]: !currentValue
    };

    try {
      await updateDoc(doc(db, 'admins', adminId), {
        permissions: updatedPermissions
      });
      
      setAdmins(prev => prev.map(a => a.uid === adminId ? { ...a, permissions: updatedPermissions } : a));
    } catch (err) {
      console.error('Permission toggle failed:', err);
      alert('Failed to update permissions.');
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (adminId === currentAdmin?.uid) {
      alert('You cannot remove your own account.');
      return;
    }

    const adminToDelete = admins.find(a => a.uid === adminId);
    if (!adminToDelete) return;
    if (!confirm(`Remove access for ${adminToDelete.name || adminToDelete.email}?`)) return;

    try {
      await deleteDoc(doc(db, 'admins', adminId));
      setAdmins(prev => prev.filter(a => a.uid !== adminId));
      setSuccess('Administrator access removed successfully.');
    } catch (err) {
      console.error('Delete admin failed:', err);
      setError('Failed to remove administrator access.');
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSaving(true);
    try {
      // Initialize secondary auth app to register user without disrupting active Super Admin login state
      const secondaryApp = getApps().find(app => app.name === 'secondary') || initializeApp(firebaseConfig, 'secondary');
      const secondaryAuth = getAuth(secondaryApp);

      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const newUid = userCredential.user.uid;

      // Immediately sign out secondary app
      await signOut(secondaryAuth);

      // Write administrative record to Firestore
      const newAdminData = {
        uid: newUid,
        name,
        email,
        role,
        isActive: true,
        permissions: role === 'super_admin' 
          ? Object.keys(permissions).reduce((acc, key) => ({ ...acc, [key]: true }), {})
          : permissions,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'admins', newUid), newAdminData);

      setSuccess(`Administrator account for "${name}" successfully created!`);
      setName('');
      setEmail('');
      setPassword('');
      setRole('admin');
      setPermissions({
        manageProducts: true,
        productCreate: true,
        productUpdate: true,
        productDelete: true,
        manageCategories: true,
        categoryCreate: true,
        categoryUpdate: true,
        categoryDelete: true,
        manageInventory: true,
        inventoryUpdate: true,
        manageOrders: true,
        orderUpdate: true,
        orderDelete: true,
        manageCustomers: false,
        customerUpdate: false,
        customerDelete: false,
        manageAnalytics: false,
        manageFeedbacks: false,
        feedbackApprove: false,
        feedbackDelete: false,
        manageMessages: false,
        messageReply: false,
        messageDelete: false,
        manageAdmins: false
      });

      await fetchAdmins();
    } catch (err: any) {
      console.error('Create admin failed:', err);
      setError(err.message || 'Failed to create administrator account. Make sure email is not already in use.');
    } finally {
      setSaving(false);
    }
  };

  // Double check layout safety override
  if (currentAdmin?.role !== 'super_admin') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 bg-card border border-border rounded-3xl shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
          <ShieldAlert size={36} />
        </div>
        <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
        <p className="text-muted-foreground text-sm max-w-md mt-2 leading-relaxed">
          Admin list and restriction panel is exclusively available to Super Administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-serif">Administrators & Permissions</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage admin credentials and restrict access to specific features.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Admin Accounts List (takes 2 cols) */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-border bg-secondary/15 flex items-center gap-2">
              <Users size={18} className="text-primary" />
              <h3 className="font-serif font-bold text-base text-foreground">Authorized System Users</h3>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                <Loader2 size={30} className="text-primary animate-spin" />
                <p className="text-xs font-semibold">Loading administrators list...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/35 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="px-6 py-4">Name / Email</th>
                      <th className="px-4 py-4">Role</th>
                      <th className="px-4 py-4">Module Permissions (Checked = Restrict Off)</th>
                      <th className="px-6 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map(a => {
                      const isSuper = a.role === 'super_admin';
                      const isSelf = a.uid === currentAdmin?.uid;
                      const adminPermissions = a.permissions || {
                        manageProducts: false,
                        productCreate: false,
                        productUpdate: false,
                        productDelete: false,
                        manageCategories: false,
                        categoryCreate: false,
                        categoryUpdate: false,
                        categoryDelete: false,
                        manageInventory: false,
                        inventoryUpdate: false,
                        manageOrders: false,
                        orderUpdate: false,
                        orderDelete: false,
                        manageCustomers: false,
                        customerUpdate: false,
                        customerDelete: false,
                        manageAnalytics: false,
                        manageFeedbacks: false,
                        feedbackApprove: false,
                        feedbackDelete: false,
                        manageMessages: false,
                        messageReply: false,
                        messageDelete: false,
                        manageAdmins: false
                      };

                      return (
                        <tr key={a.uid} className="border-b border-border/40 last:border-0 hover:bg-secondary/10 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-foreground text-sm">{a.name} {isSelf && <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-extrabold uppercase ml-1">You</span>}</p>
                            <p className="text-xs text-muted-foreground font-medium mt-0.5">{a.email}</p>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${
                              isSuper 
                                ? 'bg-primary/10 text-primary border-primary/20' 
                                : 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border-purple-500/20'
                            }`}>
                              {isSuper ? 'Super Admin' : 'Admin'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {isSuper ? (
                              <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase flex items-center gap-1">
                                <CheckCircle2 size={12} /> Unrestricted System Override
                              </span>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {[
                                  { label: 'Products', key: 'manageProducts', sub: [
                                    { label: 'Create', key: 'productCreate' }, { label: 'Update', key: 'productUpdate' }, { label: 'Delete', key: 'productDelete' }
                                  ]},
                                  { label: 'Categories', key: 'manageCategories', sub: [
                                    { label: 'Create', key: 'categoryCreate' }, { label: 'Update', key: 'categoryUpdate' }, { label: 'Delete', key: 'categoryDelete' }
                                  ]},
                                  { label: 'Inventory', key: 'manageInventory', sub: [{ label: 'Update', key: 'inventoryUpdate' }]},
                                  { label: 'Orders', key: 'manageOrders', sub: [{ label: 'Update', key: 'orderUpdate' }, { label: 'Delete', key: 'orderDelete' }]},
                                  { label: 'Customers', key: 'manageCustomers', sub: [{ label: 'Update', key: 'customerUpdate' }, { label: 'Delete', key: 'customerDelete' }]},
                                  { label: 'Feedbacks', key: 'manageFeedbacks', sub: [{ label: 'Approve', key: 'feedbackApprove' }, { label: 'Delete', key: 'feedbackDelete' }]},
                                  { label: 'Messages', key: 'manageMessages', sub: [{ label: 'Reply', key: 'messageReply' }, { label: 'Delete', key: 'messageDelete' }]},
                                  { label: 'Analytics', key: 'manageAnalytics' },
                                  { label: 'Admin Access', key: 'manageAdmins' },
                                ].map(p => (
                                  <div key={p.key} className="flex flex-col gap-1.5 border border-border/50 p-2 rounded-xl bg-background/30 w-[180px]">
                                    <label className="flex items-center gap-1.5 text-xs text-foreground font-bold cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={adminPermissions[p.key] || false}
                                        onChange={() => handlePermissionToggle(a.uid, p.key, adminPermissions[p.key])}
                                        className="w-3.5 h-3.5 border border-border rounded text-primary focus:ring-primary focus:ring-offset-background cursor-pointer"
                                      />
                                      {p.label}
                                    </label>
                                    {p.sub && (
                                      <div className="flex flex-col gap-1 ml-5 mt-0.5">
                                        {p.sub.map(s => {
                                          const isChecked = adminPermissions[s.key] ?? adminPermissions[p.key] ?? false;
                                          return (
                                            <label key={s.key} className={`flex items-center gap-1 text-[10px] font-medium ${adminPermissions[p.key] ? 'text-muted-foreground cursor-pointer' : 'text-muted-foreground/40 cursor-not-allowed'}`}>
                                              <input
                                                type="checkbox"
                                                checked={isChecked}
                                                disabled={!adminPermissions[p.key]}
                                                onChange={() => handlePermissionToggle(a.uid, s.key, isChecked)}
                                                className="w-3 h-3 border border-border rounded text-primary focus:ring-primary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                              />
                                              {s.label}
                                            </label>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              <button
                                onClick={() => handleToggleActive(a.uid, a.isActive)}
                                disabled={isSelf}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                  a.isActive
                                    ? 'bg-green-500/10 text-green-600 border border-green-500/20 hover:bg-green-500/20'
                                    : 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                {a.isActive ? 'Active' : 'Inactive'}
                              </button>
                              <button
                                onClick={() => handleDeleteAdmin(a.uid)}
                                disabled={isSelf || isSuper}
                                className="px-2.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Create Administrator account Form (1 col) */}
        <div>
          <div className="bg-card rounded-3xl border border-border p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <Plus size={18} className="text-primary" />
              <h3 className="font-serif font-bold text-base text-foreground">Create Admin Account</h3>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-500 text-xs rounded-xl flex items-start gap-2">
                <CheckCircle2 size={14} className="text-green-500 mt-0.5 shrink-0" />
                <span className="font-semibold">{success}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Amaya Perera"
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="amaya@hushcraft.lk"
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Password</label>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">System Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`py-2 px-3 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all cursor-pointer ${
                      role === 'admin'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('super_admin')}
                    className={`py-2 px-3 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all cursor-pointer ${
                      role === 'super_admin'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    Super Admin
                  </button>
                </div>
              </div>

              {/* Dynamic Permissions toggle during creation */}
              {role === 'admin' && (
                <div className="space-y-2.5 pt-2 border-t border-border">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Initial Permissions</label>
                  <div className="space-y-3">
                    {[
                      { label: 'Manage Products', key: 'manageProducts', sub: [
                        { label: 'Create', key: 'productCreate' }, { label: 'Update', key: 'productUpdate' }, { label: 'Delete', key: 'productDelete' }
                      ]},
                      { label: 'Manage Categories', key: 'manageCategories', sub: [
                        { label: 'Create', key: 'categoryCreate' }, { label: 'Update', key: 'categoryUpdate' }, { label: 'Delete', key: 'categoryDelete' }
                      ]},
                      { label: 'Update Stock Levels', key: 'manageInventory', sub: [{ label: 'Update', key: 'inventoryUpdate' }]},
                      { label: 'Process Store Orders', key: 'manageOrders', sub: [{ label: 'Update', key: 'orderUpdate' }, { label: 'Delete', key: 'orderDelete' }]},
                      { label: 'View Customer Data', key: 'manageCustomers', sub: [{ label: 'Update', key: 'customerUpdate' }, { label: 'Delete', key: 'customerDelete' }]},
                      { label: 'Moderate Feedbacks', key: 'manageFeedbacks', sub: [{ label: 'Approve', key: 'feedbackApprove' }, { label: 'Delete', key: 'feedbackDelete' }]},
                      { label: 'Reply Support Messages', key: 'manageMessages', sub: [{ label: 'Reply', key: 'messageReply' }, { label: 'Delete', key: 'messageDelete' }]},
                      { label: 'View Performance Analytics', key: 'manageAnalytics' },
                      { label: 'Manage Admin Access', key: 'manageAdmins' }
                    ].map(p => (
                      <div key={p.key} className="space-y-1.5">
                        <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 font-bold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(permissions as any)[p.key]}
                            onChange={() => setPermissions(prev => ({ ...prev, [p.key]: !(prev as any)[p.key] }))}
                            className="w-4 h-4 border border-border rounded text-primary focus:ring-primary focus:ring-offset-background cursor-pointer"
                          />
                          {p.label}
                        </label>
                        {p.sub && (
                          <div className="flex flex-wrap gap-3 ml-6">
                            {p.sub.map(s => (
                              <label key={s.key} className={`flex items-center gap-1.5 text-[10px] font-medium ${(permissions as any)[p.key] ? 'text-muted-foreground cursor-pointer' : 'text-muted-foreground/40 cursor-not-allowed'}`}>
                                <input
                                  type="checkbox"
                                  checked={(permissions as any)[s.key]}
                                  disabled={!(permissions as any)[p.key]}
                                  onChange={() => setPermissions(prev => ({ ...prev, [s.key]: !(prev as any)[s.key] }))}
                                  className="w-3.5 h-3.5 border border-border rounded text-primary focus:ring-primary focus:ring-offset-background disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                />
                                {s.label}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary/95 transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                {saving ? (
                  <>
                    <Loader2 size={12} className="animate-spin" /> Creating Account...
                  </>
                ) : (
                  'Create Slipper Admin'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

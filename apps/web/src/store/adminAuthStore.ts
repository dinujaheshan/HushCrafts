import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AdminPermissions {
  // Products
  manageProducts: boolean;
  productCreate?: boolean;
  productUpdate?: boolean;
  productDelete?: boolean;

  // Categories
  manageCategories?: boolean;
  categoryCreate?: boolean;
  categoryUpdate?: boolean;
  categoryDelete?: boolean;

  // Inventory
  manageInventory: boolean;
  inventoryUpdate?: boolean;

  // Orders
  manageOrders: boolean;
  orderUpdate?: boolean;
  orderDelete?: boolean;

  // Customers
  manageCustomers: boolean;
  customerUpdate?: boolean;
  customerDelete?: boolean;

  // Others
  manageAnalytics: boolean;
  manageFeedbacks: boolean;
  feedbackApprove?: boolean;
  feedbackDelete?: boolean;
  manageMessages: boolean;
  messageReply?: boolean;
  messageDelete?: boolean;
  manageAdmins: boolean;
}

export interface AdminUser {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'super_admin';
  permissions: AdminPermissions;
  isActive: boolean;
  createdAt?: string;
}

interface AdminAuthState {
  admin: AdminUser | null;
  login: (admin: AdminUser) => void;
  logout: () => void;
  updatePermissions: (permissions: Partial<AdminPermissions>) => void;
  isHydrated: boolean;
  setHydrated: (state: boolean) => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      admin: null,
      isHydrated: false,
      login: (admin) => set({ admin }),
      logout: () => set({ admin: null }),
      updatePermissions: (permissions) =>
        set((state) => ({
          admin: state.admin
            ? { ...state.admin, permissions: { ...state.admin.permissions, ...permissions } }
            : null,
        })),
      setHydrated: (state) => set({ isHydrated: state }),
    }),
    {
      name: 'admin-auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

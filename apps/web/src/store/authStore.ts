import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Address {
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  district: string;
  postalCode: string | null;
}

export interface User {
  uid: string;
  name: string; // Keep for backward compatibility/display name
  firstName?: string;
  lastName?: string;
  email: string;
  mobile?: string;
  photoURL?: string;
  shippingAddress?: Address | null;
  billingAddress?: Address | null;
}

interface AuthState {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  isHydrated: boolean;
  setHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isHydrated: false,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
      updateUser: (data) => set((state) => ({ user: state.user ? { ...state.user, ...data } : null })),
      setHydrated: (state) => set({ isHydrated: state }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

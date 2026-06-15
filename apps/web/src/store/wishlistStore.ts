import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistItem {
  productId: string;
  name: string;
  price: number;
  image: string;
}

interface WishlistState {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (productId: string) => void;
  clearWishlist: () => void;
  isInWishlist: (productId: string) => boolean;
}

// Helper to sync wishlist to Firestore in the background
async function syncToFirestore(items: WishlistItem[]) {
  try {
    const { saveWishlistToFirestore } = await import('@/lib/firestoreSync');
    const { useAuthStore } = await import('./authStore');
    const uid = useAuthStore.getState().user?.uid;
    if (uid) {
      await saveWishlistToFirestore(uid, items);
    }
  } catch (e) {
    console.error('Wishlist Firestore sync error:', e);
  }
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((state) => {
        if (!state.items.find(i => i.productId === item.productId)) {
          const newItems = [...state.items, item];
          syncToFirestore(newItems);
          return { items: newItems };
        }
        return state;
      }),
      removeItem: (productId) => set((state) => {
        const newItems = state.items.filter(i => i.productId !== productId);
        syncToFirestore(newItems);
        return { items: newItems };
      }),
      clearWishlist: () => {
        set({ items: [] });
      },
      isInWishlist: (productId) => get().items.some(i => i.productId === productId)
    }),
    {
      name: 'hush-craft-wishlist',
      skipHydration: true
    }
  )
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  variantId: string;
  sku: string;
  name: string;
  variantName: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  discountAmount: number;
  shippingFee: number;
  
  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  setShippingFee: (fee: number) => void;
  
  // Computations
  getSubtotal: () => number;
  getTotal: () => number;
}

// Helper to sync cart to Firestore in the background
async function syncCartToFirestore(items: CartItem[]) {
  try {
    const { saveCartToFirestore } = await import('@/lib/firestoreSync');
    const { useAuthStore } = await import('./authStore');
    const uid = useAuthStore.getState().user?.uid;
    if (uid) {
      await saveCartToFirestore(uid, items);
    }
  } catch (e) {
    console.error('Cart Firestore sync error:', e);
  }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      discountAmount: 0,
      shippingFee: 350,

      addItem: (item) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((i) => i.variantId === item.variantId);

        if (existingItem) {
          const updated = currentItems.map((i) =>
            i.variantId === item.variantId
              ? { ...i, quantity: Math.min(i.quantity + item.quantity, 20) }
              : i
          );
          set({ items: updated });
          syncCartToFirestore(updated);
        } else {
          const newItems = [...currentItems, item];
          set({ items: newItems });
          syncCartToFirestore(newItems);
        }
      },

      removeItem: (variantId) => {
        const newItems = get().items.filter((item) => item.variantId !== variantId);
        set({ items: newItems });
        syncCartToFirestore(newItems);
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        const updated = get().items.map((item) =>
          item.variantId === variantId ? { ...item, quantity: Math.min(quantity, 20) } : item
        );
        set({ items: updated });
        syncCartToFirestore(updated);
      },

      clearCart: () => {
        set({ items: [], couponCode: null, discountAmount: 0 });
        // Clear Firestore cart too
        import('@/lib/firestoreSync').then(({ clearCartInFirestore }) => {
          import('./authStore').then(({ useAuthStore }) => {
            const uid = useAuthStore.getState().user?.uid;
            if (uid) clearCartInFirestore(uid);
          });
        });
      },

      applyCoupon: (code, discount) => {
        set({ couponCode: code, discountAmount: discount });
      },

      removeCoupon: () => {
        set({ couponCode: null, discountAmount: 0 });
      },

      setShippingFee: (fee) => {
        set({ shippingFee: fee });
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const total = subtotal + get().shippingFee - get().discountAmount;
        return Math.max(total, 0);
      }
    }),
    {
      name: 'hush-craft-cart',
      skipHydration: true
    }
  )
);

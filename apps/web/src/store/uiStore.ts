import { create } from 'zustand';

interface UiState {
  isCartOpen: boolean;
  isMenuOpen: boolean;
  isFilterOpen: boolean;
  
  // Actions
  setCartOpen: (open: boolean) => void;
  setMenuOpen: (open: boolean) => void;
  setFilterOpen: (open: boolean) => void;
  toggleCart: () => void;
  toggleMenu: () => void;
  toggleFilter: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isCartOpen: false,
  isMenuOpen: false,
  isFilterOpen: false,

  setCartOpen: (open) => set({ isCartOpen: open }),
  setMenuOpen: (open) => set({ isMenuOpen: open }),
  setFilterOpen: (open) => set({ isFilterOpen: open }),
  
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
  toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
  toggleFilter: () => set((state) => ({ isFilterOpen: !state.isFilterOpen }))
}));

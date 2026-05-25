import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variantSku?: string;
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

const recalculate = (items: CartItem[]) => ({
  totalItems: items.reduce((total, item) => total + item.quantity, 0),
  totalPrice: items.reduce((total, item) => total + (item.price * item.quantity), 0),
});

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      totalItems: 0,
      totalPrice: 0,
      addItem: (item) => set((state) => {
        const existingItem = state.items.find((i) => i.id === item.id);
        let items = state.items;

        if (existingItem) {
          items = state.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
          );
        } else {
          items = [...state.items, item];
        }

        return { items, ...recalculate(items) };
      }),
      removeItem: (id) => set((state) => {
        const items = state.items.filter((i) => i.id !== id);
        return { items, ...recalculate(items) };
      }),
      updateQuantity: (id, quantity) => set((state) => {
        const items = state.items.map((i) => (i.id === id ? { ...i, quantity } : i));
        return { items, ...recalculate(items) };
      }),
      clearCart: () => set({ items: [], totalItems: 0, totalPrice: 0 }),
    }),
    {
      name: 'aurenza-cart',
    }
  )
);

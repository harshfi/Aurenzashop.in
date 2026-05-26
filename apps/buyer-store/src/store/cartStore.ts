import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  lineId?: string;
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variantSku?: string;
  category?: string;
  brand?: string;
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (item: CartItem) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
}

const recalculate = (items: CartItem[]) => ({
  totalItems: items.reduce((total, item) => total + item.quantity, 0),
  totalPrice: items.reduce((total, item) => total + (item.price * item.quantity), 0),
});

const resolveLineId = (item: CartItem) => `${item.id}::${item.variantSku || "default"}`;

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      totalItems: 0,
      totalPrice: 0,
      addItem: (item) => set((state) => {
        const lineId = item.lineId || resolveLineId(item);
        const existingItem = state.items.find((i) => (i.lineId || resolveLineId(i)) === lineId);
        let items = state.items;

        if (existingItem) {
          items = state.items.map((i) =>
            (i.lineId || resolveLineId(i)) === lineId ? { ...i, quantity: i.quantity + item.quantity } : i
          );
        } else {
          items = [...state.items, { ...item, lineId }];
        }

        return { items, ...recalculate(items) };
      }),
      removeItem: (lineId) => set((state) => {
        const items = state.items.filter((i) => (i.lineId || resolveLineId(i)) !== lineId);
        return { items, ...recalculate(items) };
      }),
      updateQuantity: (lineId, quantity) => set((state) => {
        const items = state.items.map((i) => ((i.lineId || resolveLineId(i)) === lineId ? { ...i, quantity } : i));
        return { items, ...recalculate(items) };
      }),
      clearCart: () => set({ items: [], totalItems: 0, totalPrice: 0 }),
    }),
    {
      name: 'aurenza-cart',
    }
  )
);

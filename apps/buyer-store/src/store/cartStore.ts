import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  productId: string;
  variantSku: string;
  variantLabel: string;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

function sanitizeCartItems(items: unknown): CartItem[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const record = item as Partial<CartItem>;
    if (!record.id || !record.name) {
      return [];
    }

    const price = Number(record.price);
    const quantity = Number(record.quantity);
    const productId = record.productId || record.id;
    const variantSku = record.variantSku || "default";
    const variantLabel = record.variantLabel || "Default option";

    return [
      {
        id: record.id,
        productId,
        variantSku,
        variantLabel,
        name: record.name,
        price: Number.isFinite(price) ? price : 0,
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
        image: record.image ?? null,
      },
    ];
  });
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const sanitizedItems = sanitizeCartItems(state.items);
          const normalizedItem = sanitizeCartItems([item])[0];

          if (!normalizedItem) {
            return { items: sanitizedItems };
          }

          const existingItem = sanitizedItems.find((currentItem) => currentItem.id === normalizedItem.id);
          if (existingItem) {
            return {
              items: sanitizedItems.map((currentItem) =>
                currentItem.id === normalizedItem.id
                  ? { ...currentItem, quantity: currentItem.quantity + normalizedItem.quantity }
                  : currentItem
              ),
            };
          }

          return { items: [...sanitizedItems, normalizedItem] };
        }),
      removeItem: (id) => set((state) => ({
        items: sanitizeCartItems(state.items).filter((item) => item.id !== id),
      })),
      updateQuantity: (id, quantity) =>
        set((state) => {
          const safeQuantity = Math.max(1, quantity);

          return {
            items: sanitizeCartItems(state.items).map((item) =>
              item.id === id ? { ...item, quantity: safeQuantity } : item
            ),
          };
        }),
      clearCart: () => set({ items: [] }),
      totalItems: () => sanitizeCartItems(get().items).reduce((total, item) => total + item.quantity, 0),
      totalPrice: () =>
        sanitizeCartItems(get().items).reduce((total, item) => total + item.price * item.quantity, 0),
    }),
    {
      name: "aurenza-cart",
      merge: (persistedState, currentState) => {
        const persistedRecord =
          persistedState && typeof persistedState === "object"
            ? (persistedState as Partial<CartState>)
            : {};

        return {
          ...currentState,
          ...persistedRecord,
          items: sanitizeCartItems(persistedRecord.items),
        };
      },
    }
  )
);

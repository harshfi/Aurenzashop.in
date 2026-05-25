"use client";

import { useCartStore } from "@/store/cartStore";
import { X, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

function useHasMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore();
  const mounted = useHasMounted();

  if (!isOpen || !mounted) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl transition-transform duration-300 transform flex flex-col">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" /> Your Cart
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="rounded-full bg-indigo-50 p-6 mb-4">
                <ShoppingBag className="h-12 w-12 text-indigo-200" />
              </div>
              <p className="text-lg font-medium text-gray-900">Your cart is empty</p>
              <p className="mt-1 text-sm text-gray-500 mb-6">Looks like you haven&apos;t added anything yet.</p>
              <button onClick={onClose} className="px-6 py-2 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors">
                Start Shopping
              </button>
            </div>
          ) : (
            <ul className="space-y-6">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4">
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border bg-gray-50">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      fill
                      sizes="96px"
                      className="object-cover object-center"
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between text-base font-medium text-gray-900">
                      <h3 className="line-clamp-2">{item.name}</h3>
                      <p className="ml-4 font-semibold">₹{item.price}</p>
                    </div>
                    <div className="flex flex-1 items-end justify-between text-sm">
                      <div className="flex items-center border rounded-lg bg-white">
                        <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} className="p-2 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-3 font-medium text-gray-900">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-2 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button type="button" onClick={() => removeItem(item.id)} className="font-medium text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors">
                        <Trash2 className="h-4 w-4" /> <span className="sr-only">Remove</span>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50 px-6 py-6">
            <div className="flex justify-between text-base font-medium text-gray-900 mb-4">
              <p>Subtotal</p>
              <p className="text-xl">₹{totalPrice.toLocaleString("en-IN")}</p>
            </div>
            <p className="mt-0.5 text-sm text-gray-500 mb-6">Shipping and taxes calculated at checkout.</p>
            <Link href="/checkout" onClick={onClose} className="flex w-full items-center justify-center rounded-full bg-indigo-600 px-6 py-4 text-base font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors group">
              Proceed to Checkout
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

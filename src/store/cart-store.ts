"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product } from "@/lib/types";

type CartState = {
  items: CartItem[];
  addItem: (product: Product) => void;
  increaseItem: (id: string) => void;
  decreaseItem: (id: string) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
};

function mapSubtotal(item: Omit<CartItem, "subtotal">) {
  return {
    ...item,
    subtotal: item.price * item.quantity,
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product) =>
        set((state) => {
          const existing = state.items.find((item) => item.id === product.id);

          if (existing) {
            return {
              items: state.items.map((item) =>
                item.id === product.id
                  ? mapSubtotal({ ...item, quantity: item.quantity + 1 })
                  : item,
              ),
            };
          }

          return {
            items: [...state.items, mapSubtotal({ ...product, quantity: 1 })],
          };
        }),
      increaseItem: (id) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? mapSubtotal({ ...item, quantity: item.quantity + 1 })
              : item,
          ),
        })),
      decreaseItem: (id) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.id === id
                ? mapSubtotal({ ...item, quantity: item.quantity - 1 })
                : item,
            )
            .filter((item) => item.quantity > 0),
        })),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "fastfood-cart",
    },
  ),
);

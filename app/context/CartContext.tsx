"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { cartItemKey, getVariantStock, type CartItem, type Product } from "../components/product";

const STORAGE_KEY = "glam4less-cart";

interface CartContextValue {
  cart: CartItem[];
  totalItems: number;
  totalPrice: number;
  addToCart: (product: Product, qty?: number, variantName?: string) => void;
  removeFromCart: (productId: string, variantName?: string) => void;
  updateQuantity: (productId: string, delta: number, variantName?: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setCart(JSON.parse(stored));
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const addToCart = (product: Product, qty: number = 1, variantName?: string) => {
    const stock = getVariantStock(product, variantName);
    if (stock <= 0) return;
    const key = cartItemKey(product.id, variantName);

    setCart((prev) => {
      const existing = prev.find(
        (item) => cartItemKey(item.product.id, item.variantName) === key
      );
      if (existing) {
        return prev.map((item) =>
          cartItemKey(item.product.id, item.variantName) === key
            ? { ...item, quantity: Math.min(item.quantity + qty, stock) }
            : item
        );
      }
      return [...prev, { product, quantity: Math.min(qty, stock), variantName }];
    });
  };

  const removeFromCart = (productId: string, variantName?: string) => {
    const key = cartItemKey(productId, variantName);
    setCart((prev) =>
      prev.filter((item) => cartItemKey(item.product.id, item.variantName) !== key)
    );
  };

  const updateQuantity = (productId: string, delta: number, variantName?: string) => {
    const key = cartItemKey(productId, variantName);
    setCart((prev) =>
      prev
        .map((item) => {
          if (cartItemKey(item.product.id, item.variantName) !== key) return item;
          const stock = getVariantStock(item.product, item.variantName);
          return { ...item, quantity: Math.max(0, Math.min(item.quantity + delta, stock)) };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider
      value={{ cart, totalItems, totalPrice, addToCart, removeFromCart, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

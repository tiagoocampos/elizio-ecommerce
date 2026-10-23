import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { storageGet, storageSet } from "@/lib/storage";
import { sumMoney } from "@/lib/format";

const CART_KEY = "elizio:cart";

export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 20;

// Os preços do carrinho são só de exibição: o backend recalcula tudo ao criar o pedido.
export interface CartItem {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  variantLabel: string;
  unitPrice: number;
  image: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const clampQuantity = (quantity: number) =>
  Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, Math.trunc(quantity) || MIN_QUANTITY));

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.variantId === "string" &&
    typeof item.productId === "string" &&
    typeof item.slug === "string" &&
    typeof item.name === "string" &&
    typeof item.variantLabel === "string" &&
    typeof item.unitPrice === "number" &&
    typeof item.image === "string" &&
    typeof item.quantity === "number"
  );
}

function readCart(): CartItem[] {
  const raw = storageGet(CART_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // sem variantId repetido, quantidade sempre entre 1 e 20
    const byVariant = new Map<string, CartItem>();
    for (const entry of parsed) {
      if (isCartItem(entry)) {
        byVariant.set(entry.variantId, { ...entry, quantity: clampQuantity(entry.quantity) });
      }
    }
    return [...byVariant.values()];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readCart);

  useEffect(() => {
    storageSet(CART_KEY, JSON.stringify(items));
  }, [items]);

  // Mantém várias abas sincronizadas.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === CART_KEY) setItems(readCart());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((entry) => entry.variantId === item.variantId);
      if (existing) {
        return current.map((entry) =>
          entry.variantId === item.variantId
            ? { ...entry, ...item, quantity: clampQuantity(entry.quantity + quantity) }
            : entry
        );
      }
      return [...current, { ...item, quantity: clampQuantity(quantity) }];
    });
  }, []);

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    setItems((current) =>
      current.map((entry) => (entry.variantId === variantId ? { ...entry, quantity: clampQuantity(quantity) } : entry))
    );
  }, []);

  const removeItem = useCallback((variantId: string) => {
    setItems((current) => current.filter((entry) => entry.variantId !== variantId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      subtotal: sumMoney(items.map((item) => item.unitPrice * item.quantity)),
      addItem,
      updateQuantity,
      removeItem,
      clear,
    }),
    [items, addItem, updateQuantity, removeItem, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart deve ser usado dentro de CartProvider");
  return context;
}

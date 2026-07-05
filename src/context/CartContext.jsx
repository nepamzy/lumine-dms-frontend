import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "lumine_cart";

export function resolveTierPrice(priceTiers, quantity) {
  if (!priceTiers || priceTiers.length === 0) return 0;
  const tier = priceTiers.find(
    (t) => quantity >= t.min_qty && (t.max_qty === null || quantity <= t.max_qty)
  );
  return tier ? Number(tier.price) : Number(priceTiers[0].price);
}

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((variant, productName, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === variant.id);
      if (existing) {
        return prev.map((i) =>
          i.variantId === variant.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          variantId: variant.id,
          productName,
          size: variant.size,
          priceTiers: variant.priceTiers,
          quantity,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((variantId) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  }, []);

  const updateQuantity = useCallback((variantId, quantity) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.variantId !== variantId));
      return;
    }
    setItems((prev) => prev.map((i) => (i.variantId === variantId ? { ...i, quantity } : i)));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const total = useMemo(
    () =>
      items.reduce(
        (sum, i) => sum + resolveTierPrice(i.priceTiers, i.quantity) * i.quantity,
        0
      ),
    [items]
  );

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, total }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
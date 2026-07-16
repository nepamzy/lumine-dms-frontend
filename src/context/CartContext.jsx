import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export function resolveTierPrice(priceTiers, quantity) {
  if (!priceTiers || priceTiers.length === 0) return 0;
  const tier = priceTiers.find(
    (t) => quantity >= t.min_qty && (t.max_qty === null || quantity <= t.max_qty)
  );
  return tier ? Number(tier.price) : Number(priceTiers[0].price);
}

function storageKey(userId) {
  return userId ? `lumine_cart_${userId}` : "lumine_cart_guest";
}

function loadCart(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [forCustomer, setForCustomerState] = useState(null); // { id, name } when a sales rep is ordering on someone's behalf

  // Whenever the logged-in user changes (login/logout/switch account),
  // load that user's own cart instead of whatever was there before.
  useEffect(() => {
    setItems(loadCart(user?.id));
    try {
      const raw = localStorage.getItem(`lumine_cart_for_${user?.id}`);
      setForCustomerState(raw ? JSON.parse(raw) : null);
    } catch {
      setForCustomerState(null);
    }
  }, [user?.id]);

  useEffect(() => {
    localStorage.setItem(storageKey(user?.id), JSON.stringify(items));
  }, [items, user?.id]);

  const setForCustomer = useCallback(
    (customer) => {
      setForCustomerState(customer);
      localStorage.setItem(`lumine_cart_for_${user?.id}`, JSON.stringify(customer));
    },
    [user?.id]
  );

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

  const clearCart = useCallback(() => {
    setItems([]);
    setForCustomerState(null);
    localStorage.removeItem(`lumine_cart_for_${user?.id}`);
  }, [user?.id]);

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
      value={{ items, addItem, removeItem, updateQuantity, clearCart, total, forCustomer, setForCustomer }}
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
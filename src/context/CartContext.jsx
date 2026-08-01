import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { halfPackUnits } from "../utils/packSizes";

const CartContext = createContext(null);

// Pricing is per PACK. Customers and sales reps always pay the flat
// packPrice ("Normal Price") — no discount, ever, regardless of quantity.
// Only a true distributor buying for themselves gets the bulk pack-count
// discount tier — and that tier is chosen using the COMBINED pack count
// across every item in the cart (all products/sizes together), not this
// item's own pack count alone. Returns the PER-BOTTLE unit price either
// way, matching exactly how the backend computes the real order total.
export function packsFor(item) {
  const packSize = halfPackUnits(item.size) * 2;
  return item.quantity / packSize;
}

export function resolveUnitPrice(item, isDistributor, totalPacksInCart = packsFor(item)) {
  const packSize = halfPackUnits(item.size) * 2;
  let pricePerPack = Number(item.packPrice);

  if (isDistributor && item.priceTiers?.length) {
    const tier = item.priceTiers.find(
      (t) => totalPacksInCart >= t.min_qty && (t.max_qty === null || totalPacksInCart <= t.max_qty)
    );
    if (tier) pricePerPack = Number(tier.price);
  }

  return pricePerPack / packSize;
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
          packPrice: variant.packPrice,
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

  const isDistributor = user?.role === "distributor" && user?.distributor_type === "distributor";

  const totalPacksInCart = useMemo(() => items.reduce((sum, i) => sum + packsFor(i), 0), [items]);

  const total = useMemo(
    () => items.reduce((sum, i) => sum + resolveUnitPrice(i, isDistributor, totalPacksInCart) * i.quantity, 0),
    [items, isDistributor, totalPacksInCart]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        forCustomer,
        setForCustomer,
        isDistributor,
        totalPacksInCart,
      }}
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
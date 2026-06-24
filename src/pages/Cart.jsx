import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function Cart() {
  const { items, updateQuantity, removeItem, total } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center">
        <h1 className="font-display font-bold text-xl text-navy-900 mb-2">Your cart is empty</h1>
        <p className="text-navy-900/60 text-sm mb-6">Add a few flavours from the catalog to get started.</p>
        <Link to="/catalog" className="bg-navy-800 text-cream-50 font-bold text-sm px-6 py-3 rounded-md">
          Browse Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="font-display font-bold text-2xl text-navy-900 mb-6">Your Order</h1>

      <div className="flex flex-col gap-3 mb-6">
        {items.map((item) => (
          <div key={item.productId} className="bg-white rounded-card shadow-card p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-navy-900">{item.name}</p>
              <p className="text-sm text-navy-900/60">₦{item.unitPrice.toLocaleString()} each</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value, 10) || 0)}
                className="w-16 border border-navy-900/15 rounded-md px-2 py-1.5 text-sm text-center"
              />
              <button
                onClick={() => removeItem(item.productId)}
                className="text-status-danger text-xs font-semibold"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-navy-800 text-cream-50 rounded-card p-5 flex items-center justify-between mb-6">
        <span className="font-semibold">Total</span>
        <span className="font-display font-bold text-xl text-gold-500">
          ₦{total.toLocaleString()}
        </span>
      </div>

      <button
        onClick={() => navigate("/checkout")}
        className="w-full bg-gold-500 text-navy-900 font-bold py-3.5 rounded-md hover:bg-gold-700 transition-colors"
      >
        Proceed to Checkout
      </button>
    </div>
  );
}

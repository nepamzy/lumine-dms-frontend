import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import { listProducts } from "../api/products";
import { useCart } from "../context/CartContext";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addItem, forCustomer, setForCustomer } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const customerId = searchParams.get("forCustomer");
    const customerName = searchParams.get("forCustomerName");
    if (customerId && customerName) {
      setForCustomer({ id: customerId, name: customerName });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    listProducts()
      .then(setProducts)
      .catch(() => setError("Couldn't load the catalog right now. Please try again shortly."))
      .finally(() => setLoading(false));
  }, []);

  const isSalesRep = user?.role === "distributor" && user?.distributor_type === "sales_rep";

  const handleAdd = (variant, productName, quantity) => {
    if (!user) {
      navigate("/login");
      return;
    }
    addItem(variant, productName, quantity);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="font-display font-bold text-2xl text-navy-900 mb-1">Product Catalog</h1>
     <p className="text-navy-900/60 text-sm mb-8">
        3 flavours, all batch and expiry tracked for freshness.
      </p>

      {forCustomer && (
        <div className="bg-gold-500/15 text-gold-700 rounded-md px-4 py-3 mb-6 text-sm font-semibold flex items-center justify-between">
          <span>Ordering on behalf of {forCustomer.name}</span>
          <Link to="/cart" className="underline">View cart</Link>
        </div>
      )}

      {isSalesRep && !forCustomer && (
        <div className="bg-navy-900/5 text-navy-900/70 rounded-md px-4 py-3 mb-6 text-sm">
          Browsing for your own order. To order on behalf of a customer instead, pick one from your{" "}
          <Link to="/distributor" className="underline font-semibold">
            dashboard's Place Order tab
          </Link>.
        </div>
      )}

      {loading && <p className="text-navy-900/60">Loading products…</p>}
      {error && <p className="text-status-danger">{error}</p>}

      {!loading && !error && products.length === 0 && (
        <p className="text-navy-900/60">No products are available right now.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onAdd={handleAdd} />
        ))}
      </div>
    </div>
  );
}

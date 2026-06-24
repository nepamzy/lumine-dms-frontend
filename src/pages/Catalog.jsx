import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import { listProducts } from "../api/products";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    listProducts()
      .then(setProducts)
      .catch(() => setError("Couldn't load the catalog right now. Please try again shortly."))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = (product) => {
    if (!user) {
      navigate("/login");
      return;
    }
    addItem(product, 1);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="font-display font-bold text-2xl text-navy-900 mb-1">Product Catalog</h1>
      <p className="text-navy-900/60 text-sm mb-8">
        7 flavours, all batch and expiry tracked for freshness.
      </p>

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

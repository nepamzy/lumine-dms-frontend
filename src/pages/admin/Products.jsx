import { useEffect, useState } from "react";
import { listProducts } from "../../api/products";
import { createProduct, addBatch } from "../../api/admin";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [batchTarget, setBatchTarget] = useState(null);

  const refresh = () => listProducts().then(setProducts);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-bold text-xl text-navy-900">Products</h2>
        <button
          onClick={() => setShowAddProduct(true)}
          className="bg-gold-500 text-navy-900 font-bold text-xs px-4 py-2 rounded-md"
        >
          + Add Product
        </button>
      </div>

      {loading ? (
        <p className="text-navy-900/60">Loading…</p>
      ) : (
        <div className="bg-white rounded-card shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-navy-900/5 text-navy-900/60 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3">SKU</th>
                <th className="text-right px-4 py-3">Price</th>
                <th className="text-right px-4 py-3">Stock</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-navy-900/5">
                  <td className="px-4 py-3 font-medium text-navy-900">{p.name}</td>
                  <td className="px-4 py-3 text-navy-900/60">{p.sku}</td>
                  <td className="px-4 py-3 text-right">₦{Number(p.unit_price).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{p.total_stock}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setBatchTarget(p)}
                      className="text-navy-800 font-semibold text-xs underline"
                    >
                      + Add Batch
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddProduct && (
        <AddProductModal onClose={() => setShowAddProduct(false)} onSaved={refresh} />
      )}
      {batchTarget && (
        <AddBatchModal product={batchTarget} onClose={() => setBatchTarget(null)} onSaved={refresh} />
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-navy-900/40 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-card p-6 w-full max-w-sm">
        <h3 className="font-display font-bold text-lg text-navy-900 mb-4">{title}</h3>
        {children}
        <button onClick={onClose} className="text-xs text-navy-900/50 mt-3 underline">
          Cancel
        </button>
      </div>
    </div>
  );
}

function AddProductModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", sku: "", category: "Yoghurt", unitPrice: "" });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createProduct({ ...form, unitPrice: Number(form.unitPrice) });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't create product.");
      setSaving(false);
    }
  };

  return (
    <Modal title="Add Product" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input required placeholder="Name (e.g. Strawberry Yoghurt)" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input required placeholder="SKU" className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
        <input placeholder="Category" className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <input required type="number" min="0" step="0.01" placeholder="Unit price (₦)" className="input" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
        {error && <p className="text-status-danger text-xs">{error}</p>}
        <button disabled={saving} className="bg-navy-800 text-cream-50 font-bold text-sm py-2.5 rounded-md">
          {saving ? "Saving…" : "Save Product"}
        </button>
      </form>
    </Modal>
  );
}

function AddBatchModal({ product, onClose, onSaved }) {
  const [form, setForm] = useState({ batchNumber: "", quantity: "", expiryDate: "" });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await addBatch(product.id, { ...form, quantity: Number(form.quantity) });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't add batch.");
      setSaving(false);
    }
  };

  return (
    <Modal title={`Add Batch — ${product.name}`} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input required placeholder="Batch number" className="input" value={form.batchNumber} onChange={(e) => setForm({ ...form, batchNumber: e.target.value })} />
        <input required type="number" min="1" placeholder="Quantity" className="input" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
        <label className="text-xs font-semibold text-navy-900/70 -mb-2">Expiry date</label>
        <input required type="date" className="input" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
        {error && <p className="text-status-danger text-xs">{error}</p>}
        <button disabled={saving} className="bg-navy-800 text-cream-50 font-bold text-sm py-2.5 rounded-md">
          {saving ? "Saving…" : "Add Batch"}
        </button>
      </form>
    </Modal>
  );
}

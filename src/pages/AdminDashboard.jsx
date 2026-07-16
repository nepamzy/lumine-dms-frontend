import { useState, lazy, Suspense } from "react";
import Overview from "./admin/Overview";
import Products from "./admin/Products";
import Orders from "./admin/Orders";
import DistributorTypeList from "./admin/DistributorTypeList";
import Customers from "./admin/Customers";
import ExpiringBatchesList from "../components/ExpiringBatchesList";

const AdminMap = lazy(() => import("./admin/AdminMap"));

const TABS = [
  { key: "overview", label: "Overview", Component: Overview },
  { key: "products", label: "Products", Component: Products },
  { key: "orders", label: "Orders", Component: Orders },
  {
    key: "distributors",
    label: "Distributors",
    Component: () => <DistributorTypeList distributorType="distributor" label="Distributors" />,
  },
  {
    key: "salesreps",
    label: "Sales Reps",
    Component: () => <DistributorTypeList distributorType="sales_rep" label="Sales Reps" />,
  },
  { key: "customers", label: "Customers", Component: Customers },
  { key: "expiring", label: "Expiring Batches", Component: ExpiringBatchesList },
  {
    key: "map",
    label: "Map",
    Component: () => (
      <Suspense fallback={<p className="text-navy-900/60">Loading map…</p>}>
        <AdminMap />
      </Suspense>
    ),
  },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const ActiveComponent = TABS.find((t) => t.key === activeTab).Component;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="font-display font-bold text-2xl text-navy-900 mb-1">Admin Dashboard</h1>
      <p className="text-navy-900/60 text-sm mb-6">Lumine DMS control center — Bonchris Industry Nig. Ltd</p>

      <div className="flex gap-1 border-b border-navy-900/10 mb-8">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-gold-500 text-navy-900"
                : "border-transparent text-navy-900/50 hover:text-navy-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <ActiveComponent />
    </div>
  );
}

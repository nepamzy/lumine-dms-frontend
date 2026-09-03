import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import SiteVisitRemindersPopup from "./components/SiteVisitRemindersPopup";
import LocationConsentGate from "./components/LocationConsentGate";
import AddressPromptPopup from "./components/AddressPromptPopup";
import CookieConsentPopup from "./components/CookieConsentPopup";
import InstallPromptPopup from "./components/InstallPromptPopup";

// Lazy-loaded per route so heavy page-specific dependencies (three.js on
// Home, jspdf on the dashboards, leaflet on AdminMap) only ship to visitors
// who actually land on those routes, instead of bloating every page's load.
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Catalog = lazy(() => import("./pages/Catalog"));
const Contact = lazy(() => import("./pages/Contact"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const CustomerDashboard = lazy(() => import("./pages/CustomerDashboard"));
const DistributorDashboard = lazy(() => import("./pages/DistributorDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Profile = lazy(() => import("./pages/Profile"));

// min-h-screen matters here, not just cosmetics — without it, the swap from
// this fallback to a route's real (much taller) content yanks the Footer
// down by thousands of pixels the instant the lazy chunk resolves, which is
// exactly the kind of large, sudden shift CLS penalizes hardest. A full
// per-route skeleton would fix this more precisely, but a tall neutral
// fallback removes the worst of the jump for a fraction of the effort.
function RouteFallback() {
  return <div className="min-h-screen text-center py-24 text-navy-900/60">Loading…</div>;
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <SiteVisitRemindersPopup />
      <LocationConsentGate />
      <AddressPromptPopup />
      <CookieConsentPopup />
      <InstallPromptPopup />
      <main className="flex-1">
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/become-a-distributor" element={<Navigate to="/register?role=distributor" replace />} />

          <Route
            path="/cart"
            element={
              <ProtectedRoute allowedRoles={["customer", "distributor"]}>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute allowedRoles={["customer", "distributor"]}>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute allowedRoles={["customer", "distributor", "admin"]}>
                <OrderDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["customer", "distributor", "admin"]}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/distributor"
            element={
              <ProtectedRoute allowedRoles={["distributor"]}>
                <DistributorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

function NotFound() {
  return (
    <div className="text-center py-24">
      <h1 className="font-display font-bold text-2xl text-navy-900">Page not found</h1>
    </div>
  );
}

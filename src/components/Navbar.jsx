import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const dashboardPath =
    user?.role === "admin" ? "/admin" : user?.role === "distributor" ? "/distributor" : "/account";

  return (
    <nav className="bg-navy-800 text-cream-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-y-2">
        <Link to="/" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full border-2 border-gold-500 flex items-center justify-center font-display font-extrabold text-gold-500 text-sm">
            L
          </span>
          <span className="font-display font-bold tracking-wide text-sm">LUMINE</span>
        </Link>

        <div className="flex items-center gap-3">
          {(user?.role === "customer" || user?.role === "distributor") && (
            <Link to="/cart" className="relative text-sm">
              Cart
              {items.length > 0 && (
                <span className="absolute -top-2 -right-3 bg-gold-500 text-navy-900 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </Link>
          )}
          {user ? (
            <button
              onClick={handleLogout}
              className="bg-gold-500 text-navy-900 text-xs font-bold px-3 py-2 rounded-md hover:bg-gold-700 transition-colors whitespace-nowrap"
            >
              Sign Out
            </button>
          ) : (
            <Link
              to="/login"
              className="bg-gold-500 text-navy-900 text-xs font-bold px-3 py-2 rounded-md hover:bg-gold-700 transition-colors whitespace-nowrap"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Links — always visible on every screen size, no hamburger/hidden menu */}
        <div className="w-full flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-cream-50/80 pt-1 border-t border-cream-50/10 mt-1">
          <Link to="/about" className="hover:text-gold-500 transition-colors py-1">
            About
          </Link>
          <Link to="/catalog" className="hover:text-gold-500 transition-colors py-1">
            Catalog
          </Link>
          <Link to="/contact" className="hover:text-gold-500 transition-colors py-1">
            Contact
          </Link>
          {user && (
            <Link to={dashboardPath} className="hover:text-gold-500 transition-colors py-1">
              {user.role === "customer" ? "My Orders" : "Dashboard"}
            </Link>
          )}
          {user && (user.role === "customer" || user.role === "distributor") && (
            <Link to="/profile" className="hover:text-gold-500 transition-colors py-1">
              Profile
            </Link>
          )}
          {!user && (
            <Link to="/register" className="hover:text-gold-500 transition-colors py-1">
              Join Lumine
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

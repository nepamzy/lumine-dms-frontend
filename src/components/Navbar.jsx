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
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full border-2 border-gold-500 flex items-center justify-center font-display font-extrabold text-gold-500 text-sm">
            L
          </span>
          <span className="font-display font-bold tracking-wide text-sm">LUMINE</span>
        </Link>

        <div className="hidden md:flex items-center gap-7 text-sm text-cream-50/80">
          <Link to="/catalog" className="hover:text-gold-500 transition-colors">
            Catalog
          </Link>
          {user && (
            <Link to={dashboardPath} className="hover:text-gold-500 transition-colors">
              {user.role === "customer" ? "My Orders" : "Dashboard"}
            </Link>
          )}
          {!user && (
            <Link to="/become-a-distributor" className="hover:text-gold-500 transition-colors">
              Become a Distributor
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user?.role === "customer" && (
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
              className="bg-gold-500 text-navy-900 text-xs font-bold px-4 py-2 rounded-md hover:bg-gold-700 transition-colors"
            >
              Sign Out
            </button>
          ) : (
            <Link
              to="/login"
              className="bg-gold-500 text-navy-900 text-xs font-bold px-4 py-2 rounded-md hover:bg-gold-700 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

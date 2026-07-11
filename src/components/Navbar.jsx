import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    navigate("/");
  };

  const dashboardPath =
    user?.role === "admin" ? "/admin" : user?.role === "distributor" ? "/distributor" : "/account";

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="bg-navy-800 text-cream-50 relative">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" onClick={closeMenu}>
          <span className="w-8 h-8 rounded-full border-2 border-gold-500 flex items-center justify-center font-display font-extrabold text-gold-500 text-sm">
            L
          </span>
          <span className="font-display font-bold tracking-wide text-sm">LUMINE</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-7 text-sm text-cream-50/80">
          <Link to="/catalog" className="hover:text-gold-500 transition-colors">
            Catalog
          </Link>
          <Link to="/contact" className="hover:text-gold-500 transition-colors">
            Contact
          </Link>
          {user && (
            <Link to={dashboardPath} className="hover:text-gold-500 transition-colors">
              {user.role === "customer" ? "My Orders" : "Dashboard"}
            </Link>
          )}
          {user && (user.role === "customer" || user.role === "distributor") && (
            <Link to="/profile" className="hover:text-gold-500 transition-colors">
              Profile
            </Link>
          )}
          {!user && (
            <Link to="/register" className="hover:text-gold-500 transition-colors">
              Become a Distributor/Customer
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

          {/* Desktop auth button */}
          <div className="hidden md:block">
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

          {/* Hamburger (mobile only) */}
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="md:hidden flex flex-col justify-center items-center gap-[5px] w-8 h-8"
          >
            <span className="block w-6 h-0.5 bg-cream-50 rounded-full" />
            <span className="block w-6 h-0.5 bg-cream-50 rounded-full" />
            <span className="block w-6 h-0.5 bg-cream-50 rounded-full" />
          </button>
        </div>
      </div>

      {/* Mobile full-screen menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-white text-navy-900 md:hidden overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-5 border-b border-navy-900/10">
            <span className="font-display font-bold text-xl text-navy-900">Lumine</span>
            <button onClick={closeMenu} aria-label="Close menu" className="text-2xl leading-none">
              ×
            </button>
          </div>

          <div className="flex flex-col px-6 py-2 text-lg divide-y divide-navy-900/10">
            <Link to="/" onClick={closeMenu} className="py-4">
              Home
            </Link>
            <Link to="/#about" onClick={closeMenu} className="py-4">
              About
            </Link>
            <Link to="/catalog" onClick={closeMenu} className="py-4">
              Products
            </Link>
            <Link to="/register?role=distributor" onClick={closeMenu} className="py-4">
              Distributors
            </Link>
            <Link to="/#faqs" onClick={closeMenu} className="py-4">
              FAQs
            </Link>
            <Link to="/contact" onClick={closeMenu} className="py-4">
              Contact
            </Link>
            {user && (
              <Link to={dashboardPath} onClick={closeMenu} className="py-4">
                {user.role === "customer" ? "My Orders" : "Dashboard"}
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3 px-6 py-6">
            {user ? (
              <button
                onClick={handleLogout}
                className="flex-1 bg-gold-500 text-navy-900 font-bold text-sm px-4 py-3 rounded-md"
              >
                Sign Out
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="flex-1 text-center border border-navy-900/20 text-navy-900 font-semibold text-sm px-4 py-3 rounded-md"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="flex-1 text-center bg-navy-800 text-cream-50 font-bold text-sm px-4 py-3 rounded-md"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

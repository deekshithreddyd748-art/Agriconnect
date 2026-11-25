import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Sprout,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PROVIDER_ROLES, ROLE_LABELS } from '../utils/constants';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const dashboardPath = !user
    ? '/login'
    : user.role === 'admin'
      ? '/admin'
      : PROVIDER_ROLES.includes(user.role)
        ? '/provider/dashboard'
        : '/farmer/dashboard';

  function handleLogout() {
    logout();
    setMobileOpen(false);
    navigate('/');
  }

  const navLinkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-forest-50 text-forest-700'
        : 'text-slate-600 hover:text-forest-700 hover:bg-earth-100'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-earth-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-forest-700 text-white flex items-center justify-center shadow-sm">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-forest-800 tracking-tight block leading-none">
                AgriConnect
              </span>
              <span className="text-[11px] text-fresh-600 font-medium hidden sm:block">
                Connecting Farmers. Empowering Agriculture.
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            <NavLink to="/machinery" className={navLinkClass}>
              Machinery
            </NavLink>
            <NavLink to="/labour" className={navLinkClass}>
              Labour
            </NavLink>
            <NavLink to="/facilities" className={navLinkClass}>
              Facilities
            </NavLink>
            <NavLink to="/nearby-map" className={navLinkClass}>
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                Nearby Map
              </span>
            </NavLink>
            <NavLink to="/how-it-works" className={navLinkClass}>
              How It Works
            </NavLink>
            <NavLink to="/about" className={navLinkClass}>
              About
            </NavLink>
          </nav>

          <div className="hidden lg:flex items-center gap-2.5">
            {user ? (
              <>
                <Link
                  to={dashboardPath}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-forest-50 text-forest-700 hover:bg-forest-100 text-sm font-semibold transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                {user.role === 'farmer' && (
                  <Link
                    to="/farmer/bookings"
                    className="px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-earth-100"
                  >
                    My Bookings
                  </Link>
                )}
                {PROVIDER_ROLES.includes(user.role) && (
                  <Link
                    to="/provider/requests"
                    className="px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-earth-100"
                  >
                    Requests
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-earth-200 hover:bg-earth-50 text-sm"
                >
                  <UserIcon className="w-4 h-4 text-forest-700" />
                  <div className="text-left leading-tight">
                    <div className="font-semibold text-slate-800 text-xs">
                      {user.name.split(' ')[0]}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {ROLE_LABELS[user.role]}
                    </div>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-forest-700 hover:bg-forest-50 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-forest-700 text-white hover:bg-forest-800 shadow-sm transition-colors"
                >
                  Join AgriConnect
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-earth-100"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-earth-200 bg-white px-4 py-4 space-y-1.5">
          <NavLink
            to="/machinery"
            onClick={() => setMobileOpen(false)}
            className={navLinkClass}
          >
            <div className="py-1">Machinery Marketplace</div>
          </NavLink>
          <NavLink
            to="/labour"
            onClick={() => setMobileOpen(false)}
            className={navLinkClass}
          >
            <div className="py-1">Agricultural Labour</div>
          </NavLink>
          <NavLink
            to="/facilities"
            onClick={() => setMobileOpen(false)}
            className={navLinkClass}
          >
            <div className="py-1">Post-Harvest Facilities</div>
          </NavLink>
          <NavLink
            to="/nearby-map"
            onClick={() => setMobileOpen(false)}
            className={navLinkClass}
          >
            <div className="py-1">Nearby Services Map</div>
          </NavLink>
          <NavLink
            to="/services"
            onClick={() => setMobileOpen(false)}
            className={navLinkClass}
          >
            <div className="py-1">All Services</div>
          </NavLink>
          <NavLink
            to="/how-it-works"
            onClick={() => setMobileOpen(false)}
            className={navLinkClass}
          >
            <div className="py-1">How It Works</div>
          </NavLink>
          <NavLink
            to="/about"
            onClick={() => setMobileOpen(false)}
            className={navLinkClass}
          >
            <div className="py-1">About AgriConnect</div>
          </NavLink>

          <div className="pt-3 border-t border-earth-200 flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  to={dashboardPath}
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-forest-700 text-white font-semibold text-sm"
                >
                  Open {ROLE_LABELS[user.role]} Dashboard
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="text-center py-2 rounded-xl border border-earth-200 text-sm font-medium"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="py-2 rounded-xl bg-rose-50 text-rose-700 text-sm font-medium"
                  >
                    Log Out
                  </button>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="text-center py-2.5 rounded-xl border border-forest-700 text-forest-700 font-semibold text-sm"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="text-center py-2.5 rounded-xl bg-forest-700 text-white font-semibold text-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

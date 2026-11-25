import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sprout,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  MapPin,
  PlayCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PROVIDER_ROLES, ROLE_LABELS } from '../utils/constants';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
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
        <div className="flex h-16 items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-forest-700 text-white flex items-center justify-center shadow-sm">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-forest-800 tracking-tight block leading-none">
                AgriConnect
              </span>
              <span className="text-[11px] text-fresh-600 font-medium hidden sm:block">
                {t('tagline')}
              </span>
            </div>
          </Link>

          <nav className="hidden xl:flex items-center gap-1" aria-label="Main navigation">
            <NavLink to="/machinery" className={navLinkClass}>
              {t('nav.machinery')}
            </NavLink>
            <NavLink to="/labour" className={navLinkClass}>
              {t('nav.labour')}
            </NavLink>
            <NavLink to="/facilities" className={navLinkClass}>
              {t('nav.facilities')}
            </NavLink>
            <NavLink to="/nearby-map" className={navLinkClass}>
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {t('nav.nearbyMap')}
              </span>
            </NavLink>
            <NavLink to="/labour-demo" className={navLinkClass}>
              <span className="inline-flex items-center gap-1 text-forest-700 font-semibold">
                <PlayCircle className="w-3.5 h-3.5" />
                {t('nav.labourDemo')}
              </span>
            </NavLink>
            <NavLink to="/how-it-works" className={navLinkClass}>
              {t('nav.howItWorks')}
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />

            <div className="hidden lg:flex items-center gap-2">
              {user ? (
                <>
                  <Link
                    to={dashboardPath}
                    className="inline-flex items-center gap-1.5 px-3.5 min-h-[44px] rounded-xl bg-forest-50 text-forest-700 hover:bg-forest-100 text-sm font-semibold transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    {t('nav.dashboard')}
                  </Link>
                  {user.role === 'farmer' && (
                    <Link
                      to="/farmer/request-labour"
                      className="px-3.5 min-h-[44px] inline-flex items-center rounded-xl bg-forest-700 text-white hover:bg-forest-800 text-sm font-semibold"
                    >
                      {t('nav.requestLabour')}
                    </Link>
                  )}
                  {user.role === 'labour_provider' && (
                    <Link
                      to="/provider/open-requests"
                      className="px-3.5 min-h-[44px] inline-flex items-center rounded-xl bg-forest-700 text-white hover:bg-forest-800 text-sm font-semibold"
                    >
                      {t('nav.openRequests')}
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    className="inline-flex items-center gap-2 px-3 min-h-[44px] rounded-xl border border-earth-200 hover:bg-earth-50 text-sm"
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
                    title={t('nav.logout')}
                    aria-label={t('nav.logout')}
                    className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 min-h-[44px] inline-flex items-center rounded-xl text-sm font-semibold text-forest-700 hover:bg-forest-50 transition-colors"
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 min-h-[44px] inline-flex items-center rounded-xl text-sm font-semibold bg-forest-700 text-white hover:bg-forest-800 shadow-sm transition-colors"
                  >
                    {t('nav.register')}
                  </Link>
                </>
              )}
            </div>

            <button
              onClick={() => setMobileOpen((prev) => !prev)}
              className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-700 hover:bg-earth-100"
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-earth-200 bg-white px-4 py-4 space-y-1.5">
          <NavLink
            to="/machinery"
            onClick={() => setMobileOpen(false)}
            className={navLinkClass}
          >
            <div className="py-1.5">{t('nav.machinery')}</div>
          </NavLink>
          <NavLink
            to="/labour"
            onClick={() => setMobileOpen(false)}
            className={navLinkClass}
          >
            <div className="py-1.5">{t('nav.labour')}</div>
          </NavLink>
          <NavLink
            to="/facilities"
            onClick={() => setMobileOpen(false)}
            className={navLinkClass}
          >
            <div className="py-1.5">{t('nav.facilities')}</div>
          </NavLink>
          <NavLink
            to="/nearby-map"
            onClick={() => setMobileOpen(false)}
            className={navLinkClass}
          >
            <div className="py-1.5">{t('nav.nearbyMap')}</div>
          </NavLink>
          <NavLink
            to="/labour-demo"
            onClick={() => setMobileOpen(false)}
            className={navLinkClass}
          >
            <div className="py-1.5 font-semibold text-forest-700">{t('nav.labourDemo')}</div>
          </NavLink>
          <NavLink
            to="/how-it-works"
            onClick={() => setMobileOpen(false)}
            className={navLinkClass}
          >
            <div className="py-1.5">{t('nav.howItWorks')}</div>
          </NavLink>

          <div className="pt-3 border-t border-earth-200 flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  to={dashboardPath}
                  onClick={() => setMobileOpen(false)}
                  className="w-full min-h-[48px] flex items-center justify-center rounded-xl bg-forest-700 text-white font-semibold text-sm"
                >
                  {t('nav.dashboard')}
                </Link>
                {user.role === 'farmer' && (
                  <Link
                    to="/farmer/request-labour"
                    onClick={() => setMobileOpen(false)}
                    className="w-full min-h-[48px] flex items-center justify-center rounded-xl bg-forest-50 text-forest-800 font-semibold text-sm"
                  >
                    {t('nav.requestLabour')}
                  </Link>
                )}
                {user.role === 'labour_provider' && (
                  <Link
                    to="/provider/open-requests"
                    onClick={() => setMobileOpen(false)}
                    className="w-full min-h-[48px] flex items-center justify-center rounded-xl bg-forest-50 text-forest-800 font-semibold text-sm"
                  >
                    {t('nav.openRequests')}
                  </Link>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="min-h-[44px] flex items-center justify-center rounded-xl border border-earth-200 text-sm font-medium"
                  >
                    {t('nav.profile')}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="min-h-[44px] rounded-xl bg-rose-50 text-rose-700 text-sm font-medium"
                  >
                    {t('nav.logout')}
                  </button>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="min-h-[48px] flex items-center justify-center rounded-xl border border-forest-700 text-forest-700 font-semibold text-sm"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="min-h-[48px] flex items-center justify-center rounded-xl bg-forest-700 text-white font-semibold text-sm"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

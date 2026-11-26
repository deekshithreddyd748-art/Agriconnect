import { useNavigate } from 'react-router-dom';
import { Eye, LogOut, Sprout, Tractor, Users, Warehouse } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PROVIDER_ROLES } from '../utils/constants';

const ROLE_SWITCH_BUTTONS = [
  { id: 'farmer', label: 'Farmer', path: '/farmer/dashboard', icon: Sprout },
  { id: 'equipment_owner', label: 'Equipment Owner', path: '/provider/dashboard', icon: Tractor },
  { id: 'labour_provider', label: 'Labour Provider', path: '/provider/dashboard', icon: Users },
  { id: 'facility_operator', label: 'Facility Owner', path: '/provider/dashboard', icon: Warehouse },
];

export default function DemoModeBanner() {
  const { user, switchDemoRole, logout } = useAuth();
  const navigate = useNavigate();

  if (!user?.isGuest) return null;

  function handleRoleSwitch(roleItem) {
    switchDemoRole(roleItem.id);
    navigate(roleItem.path);
  }

  function handleExitDemo() {
    logout();
    navigate('/login');
  }

  return (
    <div
      role="region"
      aria-label="Demo Mode Bar"
      className="bg-amber-50 border-b border-amber-200 text-amber-950 px-4 py-2 text-xs"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-600 text-white font-extrabold uppercase tracking-wider text-[11px]">
            <Eye className="w-3 h-3" /> DEMO MODE
          </span>
          <span className="font-medium text-amber-900">
            {user.isDemoAccount
              ? 'Signed in with preconfigured demo account (demo@agriconnect.in). Changes are stored locally.'
              : 'Exploring as Guest. Sample data loaded locally — no backend or database required.'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-amber-800 mr-1 hidden sm:inline">
            Switch View:
          </span>
          {ROLE_SWITCH_BUTTONS.map((item) => {
            const Icon = item.icon;
            const active = user.role === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleRoleSwitch(item)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  active
                    ? 'bg-forest-700 text-white shadow-sm'
                    : 'bg-white border border-amber-300 text-amber-950 hover:bg-amber-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}

          <button
            type="button"
            onClick={handleExitDemo}
            className="ml-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold"
          >
            <LogOut className="w-3.5 h-3.5" />
            Exit Demo
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Sprout,
  Tractor,
  Users,
  Warehouse,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../services/api';
import { PROVIDER_ROLES } from '../../utils/constants';
import { useVoiceAssist } from '../../hooks/useVoiceAssist';
import LanguageSwitcher from '../../components/LanguageSwitcher';

const ROLE_OPTIONS = [
  {
    id: 'farmer',
    emoji: '🌾',
    icon: Sprout,
    titleKey: 'auth.roles.farmerTitle',
    descKey: 'auth.roles.farmerDesc',
    accent: 'bg-forest-50 text-forest-700',
  },
  {
    id: 'equipment_owner',
    emoji: '🚜',
    icon: Tractor,
    titleKey: 'auth.roles.equipmentTitle',
    descKey: 'auth.roles.equipmentDesc',
    accent: 'bg-emerald-50 text-emerald-700',
  },
  {
    id: 'labour_provider',
    emoji: '👨‍🌾',
    icon: Users,
    titleKey: 'auth.roles.labourTitle',
    descKey: 'auth.roles.labourDesc',
    accent: 'bg-harvest-100 text-harvest-700',
  },
  {
    id: 'facility_operator',
    emoji: '🏢',
    icon: Warehouse,
    titleKey: 'auth.roles.facilityTitle',
    descKey: 'auth.roles.facilityDesc',
    accent: 'bg-sky-50 text-sky-700',
  },
];

export default function RoleSelectionPage() {
  const { user, loading, selectProfileRole, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { supported: voiceSupported, voiceEnabled, setVoiceEnabled, speak, stop } =
    useVoiceAssist();

  const [selectedRole, setSelectedRole] = useState('farmer');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (user.role) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (PROVIDER_ROLES.includes(user.role)) {
        navigate('/provider/dashboard', { replace: true });
      } else {
        navigate('/farmer/dashboard', { replace: true });
      }
    }
  }, [loading, user, navigate]);

  async function handleConfirmRole() {
    if (!user?.profileId || !selectedRole) return;
    setSubmitting(true);
    try {
      const resData = await selectProfileRole(user.profileId, selectedRole);
      const savedRole = resData?.user?.role || selectedRole;
      toast.success(t('auth.roleSavedSuccess', { role: t(`roles.${savedRole}`, savedRole) }));
      if (PROVIDER_ROLES.includes(savedRole)) {
        navigate('/provider/dashboard', { replace: true });
      } else {
        navigate('/farmer/dashboard', { replace: true });
      }
    } catch (err) {
      toast.error(getErrorMessage(err, t('auth.roleSaveFailed')));
    } finally {
      setSubmitting(false);
    }
  }

  function toggleVoice() {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    if (next) {
      speak(`${t('auth.chooseRoleTitle')}. ${t('auth.chooseRoleSubtitle')}`);
    } else {
      stop();
    }
  }

  if (loading || !user || user.role) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-9 h-9 border-4 border-forest-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10 bg-gradient-to-br from-earth-50 via-white to-forest-50">
      <div className="w-full max-w-3xl bg-white rounded-3xl border border-earth-200 shadow-lg p-6 sm:p-9 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl border border-earth-200 text-sm font-semibold text-slate-700 hover:bg-earth-50"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('common.home')}
            </Link>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
              className="px-3 min-h-[44px] rounded-xl border border-earth-200 text-sm font-medium text-slate-600 hover:bg-earth-50"
            >
              {t('auth.switchMobile')}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleVoice}
                aria-pressed={voiceEnabled}
                className={`inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl border text-xs font-semibold ${
                  voiceEnabled
                    ? 'border-forest-600 bg-forest-50 text-forest-800'
                    : 'border-earth-200 bg-white text-slate-700 hover:bg-earth-50'
                }`}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                {voiceEnabled ? t('voice.on') : t('voice.off')}
              </button>
            )}
            <LanguageSwitcher />
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm font-semibold text-forest-700">
            {t('auth.greetingUser', { name: user.name })} · +91 {user.mobileNumber}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-forest-900">
            {t('auth.chooseRoleTitle')}
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            {t('auth.chooseRoleSubtitle')}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {ROLE_OPTIONS.map((item) => {
            const Icon = item.icon;
            const active = selectedRole === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setSelectedRole(item.id);
                  if (voiceEnabled) {
                    speak(`${t(item.titleKey)}. ${t(item.descKey)}`);
                  }
                }}
                className={`text-left p-5 min-h-[120px] rounded-2xl border-2 transition-all flex items-start gap-4 ${
                  active
                    ? 'border-forest-700 bg-forest-50/70 ring-2 ring-forest-600/20 shadow-sm'
                    : 'border-earth-200 hover:border-forest-300 bg-white'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-xl ${item.accent}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-base sm:text-lg text-forest-900">
                      {item.emoji} {t(item.titleKey)}
                    </span>
                    {active && <CheckCircle2 className="w-5 h-5 text-forest-700 shrink-0" />}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{t(item.descKey)}</p>
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={submitting}
          onClick={handleConfirmRole}
          className="w-full min-h-[54px] rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-base shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('common.pleaseWait')}
            </>
          ) : (
            <>
              {t('auth.continueToDashboard')}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

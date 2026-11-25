import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, setAppLanguage } from '../i18n';

export default function LanguageSwitcher({ compact = false, className = '' }) {
  const { i18n, t } = useTranslation();

  return (
    <label
      className={`inline-flex items-center gap-1.5 rounded-xl border border-earth-200 bg-white px-2.5 min-h-[44px] shadow-sm cursor-pointer ${className}`}
    >
      <Globe className="w-4 h-4 text-forest-700 shrink-0" aria-hidden="true" />
      {!compact && (
        <span className="sr-only sm:not-sr-only text-xs font-semibold text-slate-600">
          {t('nav.language')}:
        </span>
      )}
      <select
        aria-label={t('nav.language')}
        value={i18n.language}
        onChange={(e) => setAppLanguage(e.target.value)}
        className="bg-transparent text-xs sm:text-sm font-bold text-forest-800 focus:outline-none cursor-pointer pr-1"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName}
          </option>
        ))}
      </select>
    </label>
  );
}

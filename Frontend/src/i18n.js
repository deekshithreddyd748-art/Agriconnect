import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import kn from './locales/kn.json';
import hi from './locales/hi.json';
import te from './locales/te.json';
import ta from './locales/ta.json';
import mr from './locales/mr.json';

export const LANG_STORAGE_KEY = 'agriconnect_lang';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', nativeName: 'English' },
  { code: 'kn', nativeName: 'ಕನ್ನಡ' },
  { code: 'hi', nativeName: 'हिन्दी' },
  { code: 'te', nativeName: 'తెలుగు' },
  { code: 'ta', nativeName: 'தமிழ்' },
  { code: 'mr', nativeName: 'मराठी' },
];

const savedLang =
  typeof window !== 'undefined' ? localStorage.getItem(LANG_STORAGE_KEY) || 'en' : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    kn: { translation: kn },
    hi: { translation: hi },
    te: { translation: te },
    ta: { translation: ta },
    mr: { translation: mr },
  },
  lng: SUPPORTED_LANGUAGES.some((l) => l.code === savedLang) ? savedLang : 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export function setAppLanguage(code) {
  i18n.changeLanguage(code);
  if (typeof window !== 'undefined') {
    localStorage.setItem(LANG_STORAGE_KEY, code);
    document.documentElement.lang = code;
  }
}

export default i18n;

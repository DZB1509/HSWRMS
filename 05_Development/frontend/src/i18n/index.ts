import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import Vietnamese
import viCommon from './locales/vi/common.json';
import viNav from './locales/vi/navigation.json';
import viLanding from './locales/vi/landing.json';
import viRetreat from './locales/vi/retreat.json';
import viAuth from './locales/vi/auth.json';
import viCustomer from './locales/vi/customer.json';
import viOperations from './locales/vi/operations.json';

// Import English
import enCommon from './locales/en/common.json';
import enNav from './locales/en/navigation.json';
import enLanding from './locales/en/landing.json';
import enRetreat from './locales/en/retreat.json';
import enAuth from './locales/en/auth.json';
import enCustomer from './locales/en/customer.json';
import enOperations from './locales/en/operations.json';

// Import Simplified Chinese
import zhCommon from './locales/zh-CN/common.json';
import zhNav from './locales/zh-CN/navigation.json';
import zhLanding from './locales/zh-CN/landing.json';
import zhRetreat from './locales/zh-CN/retreat.json';
import zhAuth from './locales/zh-CN/auth.json';
import zhCustomer from './locales/zh-CN/customer.json';
import zhOperations from './locales/zh-CN/operations.json';

// Import Japanese
import jaCommon from './locales/ja/common.json';
import jaNav from './locales/ja/navigation.json';
import jaLanding from './locales/ja/landing.json';
import jaRetreat from './locales/ja/retreat.json';
import jaAuth from './locales/ja/auth.json';
import jaCustomer from './locales/ja/customer.json';
import jaOperations from './locales/ja/operations.json';

// Import French
import frCommon from './locales/fr/common.json';
import frNav from './locales/fr/navigation.json';
import frLanding from './locales/fr/landing.json';
import frRetreat from './locales/fr/retreat.json';
import frAuth from './locales/fr/auth.json';
import frCustomer from './locales/fr/customer.json';
import frOperations from './locales/fr/operations.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'vi', locale: 'vi-VN', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', locale: 'en-US', label: 'English', flag: '🇬🇧' },
  { code: 'zh-CN', locale: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
  { code: 'ja', locale: 'ja-JP', label: '日本語', flag: '🇯🇵' },
  { code: 'fr', locale: 'fr-FR', label: 'Français', flag: '🇫🇷' },
] as const;

export type SupportedLanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

export const STORAGE_LANG_KEY = 'hswrms_language';

const getInitialLanguage = (): SupportedLanguageCode => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_LANG_KEY);
    if (saved && SUPPORTED_LANGUAGES.some((lang) => lang.code === saved)) {
      return saved as SupportedLanguageCode;
    }
  }
  return 'vi';
};

const deepMerge = (...objects: any[]): any => {
  const result: any = {};
  for (const obj of objects) {
    if (!obj || typeof obj !== 'object') continue;
    for (const [key, val] of Object.entries(obj)) {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        result[key] = deepMerge(result[key] || {}, val);
      } else {
        result[key] = val;
      }
    }
  }
  return result;
};

const buildLocaleResources = (
  common: any,
  nav: any,
  landing: any,
  retreat: any,
  auth: any,
  customer: any,
  operations: any
) => {
  const mergedCommon = deepMerge(
    common,
    nav,
    { landing, retreat, auth, customer, operations },
    customer,
    operations
  );
  mergedCommon.common = common;

  return {
    common: mergedCommon,
    navigation: nav,
    landing,
    retreat,
    auth: {
      ...auth,
      auth,
    },
    customer: {
      ...customer,
      customer,
    },
    operations: {
      ...operations,
      operations,
    },
  };
};

const resources = {
  vi: buildLocaleResources(viCommon, viNav, viLanding, viRetreat, viAuth, viCustomer, viOperations),
  en: buildLocaleResources(enCommon, enNav, enLanding, enRetreat, enAuth, enCustomer, enOperations),
  'zh-CN': buildLocaleResources(zhCommon, zhNav, zhLanding, zhRetreat, zhAuth, zhCustomer, zhOperations),
  ja: buildLocaleResources(jaCommon, jaNav, jaLanding, jaRetreat, jaAuth, jaCustomer, jaOperations),
  fr: buildLocaleResources(frCommon, frNav, frLanding, frRetreat, frAuth, frCustomer, frOperations),
};



i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export const changeLanguage = (langCode: SupportedLanguageCode) => {
  i18n.changeLanguage(langCode);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_LANG_KEY, langCode);
    window.dispatchEvent(new CustomEvent('hswrms_language_changed', { detail: { lang: langCode } }));
  }
};

if (typeof window !== 'undefined') {
  (window as any).hswrmsChangeLanguage = changeLanguage;
  (window as any).hswrmsI18n = i18n;
}

/**
 * Currency Formatting: VND remains the project pricing currency.
 * Changing language does NOT automatically change currency.
 */
export const formatVND = (amount: number, locale = 'vi-VN'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default i18n;

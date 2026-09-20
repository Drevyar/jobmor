import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';
import { createContext, type PropsWithChildren, useContext, useMemo, useState } from 'react';

import { translations, type AppLanguage } from '@/localization/translations';

type LocalizationValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
};

const LocalizationContext = createContext<LocalizationValue | null>(null);

export function LocalizationProvider({ children }: PropsWithChildren) {
  const deviceLanguage = getLocales()[0]?.languageCode === 'th' ? 'th' : 'en';
  const [language, setLanguage] = useState<AppLanguage>(deviceLanguage);
  const value = useMemo(() => {
    const i18n = new I18n(translations);
    i18n.locale = language;
    i18n.enableFallback = true;
    i18n.defaultLocale = 'en';
    return {
      language,
      setLanguage,
      toggleLanguage: () => setLanguage((current) => (current === 'th' ? 'en' : 'th')),
      t: (key: string) => i18n.t(key),
    };
  }, [language]);

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}

export function useTranslation() {
  const context = useContext(LocalizationContext);
  if (!context) throw new Error('useTranslation must be used inside LocalizationProvider');
  return context;
}

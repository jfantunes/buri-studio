import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { detectLanguage, LANGUAGE_STORAGE_KEY, normalizeLanguage, translateUi } from '../utils/language.js';

const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key
});

export function LanguageProvider({ initialLanguage, children }) {
  const [language, setLanguageState] = useState(() => normalizeLanguage(initialLanguage || detectLanguage()));

  function setLanguage(nextLanguage) {
    const normalized = normalizeLanguage(nextLanguage);
    setLanguageState(normalized);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
    } catch {
      // The selection still works for the current page if storage is blocked.
    }
  }

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key) => translateUi(language, key)
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export default LanguageContext;

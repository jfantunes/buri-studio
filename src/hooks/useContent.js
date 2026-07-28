import { useContext, useMemo } from 'react';
import ContentContext from '../context/ContentContext.jsx';
import LanguageContext from '../context/LanguageContext.jsx';
import { localizeValue } from '../utils/language.js';

/** Access the site content loaded from the JSON files in `data/`. */
export function useContent() {
  const content = useContext(ContentContext);
  const { language } = useContext(LanguageContext);
  return useMemo(() => localizeValue(content, language), [content, language]);
}

/** Access the original untranslated content for stable media references. */
export function useRawContent() {
  return useContext(ContentContext);
}

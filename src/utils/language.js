export const LANGUAGES = ['en', 'pt'];

export const LANGUAGE_STORAGE_KEY = 'buri-language';

const PORTUGUESE_REGIONS = new Set(['AO', 'BR', 'CV', 'GQ', 'GW', 'MO', 'PT', 'ST', 'TL']);

export const UI_TRANSLATIONS = {
  en: {
    nav: {
      home: 'Home',
      work: 'Work',
      about: 'About',
      contact: 'Contact'
    },
    work: {
      all: 'All',
      filtersLabel: 'Filter projects'
    },
    about: {
      services: 'Services'
    },
    project: {
      notFoundTitle: 'Project not found',
      notFoundText: 'Project not found.',
      backToWork: 'Back to work',
      workBack: 'Work',
      previous: 'Previous',
      next: 'Next',
      pagerLabel: 'More projects'
    },
    slider: {
      previousImage: 'Previous image',
      nextImage: 'Next image',
      goToImage: 'Go to image %s'
    },
    contact: {
      name: 'Name',
      email: 'Email',
      projectDetails: 'Project details',
      send: 'Send',
      defaultSubject: 'New project inquiry from Buri Studio',
      defaultFromName: 'Buri Studio website',
      defaultThanks: 'Thanks for contacting Buri Studio. We will get back to you soon.'
    },
    notFound: {
      title: 'Page not found',
      text: "You've wandered off the path.",
      back: 'Back to home'
    },
    language: {
      label: 'Select language'
    }
  },
  pt: {
    nav: {
      home: 'Início',
      work: 'Projetos',
      about: 'Sobre',
      contact: 'Contacto'
    },
    work: {
      all: 'Todos',
      filtersLabel: 'Filtrar projetos'
    },
    about: {
      services: 'Serviços'
    },
    project: {
      notFoundTitle: 'Projeto não encontrado',
      notFoundText: 'Projeto não encontrado.',
      backToWork: 'Voltar aos projetos',
      workBack: 'Projetos',
      previous: 'Anterior',
      next: 'Seguinte',
      pagerLabel: 'Mais projetos'
    },
    slider: {
      previousImage: 'Imagem anterior',
      nextImage: 'Imagem seguinte',
      goToImage: 'Ir para a imagem %s'
    },
    contact: {
      name: 'Nome',
      email: 'Email',
      projectDetails: 'Detalhes do projeto',
      send: 'Enviar',
      defaultSubject: 'Novo pedido de projeto a partir do site da Buri Studio',
      defaultFromName: 'Site da Buri Studio',
      defaultThanks: 'Obrigado por contactar a Buri Studio. Responderemos em breve.'
    },
    notFound: {
      title: 'Página não encontrada',
      text: 'Saiu do caminho previsto.',
      back: 'Voltar ao início'
    },
    language: {
      label: 'Selecionar idioma'
    }
  }
};

export function normalizeLanguage(value) {
  return LANGUAGES.includes(value) ? value : 'en';
}

function languageFromLocale(locale) {
  if (!locale) return null;
  const parts = String(locale).replace('_', '-').split('-');
  const language = parts[0]?.toLowerCase();
  const region = parts.at(-1)?.toUpperCase();
  if (language === 'pt' || PORTUGUESE_REGIONS.has(region)) return 'pt';
  return null;
}

export function detectLanguage() {
  if (typeof window === 'undefined') return 'en';

  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored) return normalizeLanguage(stored);
  } catch {
    // Ignore storage access errors and fall back to the browser locale.
  }

  const locales = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const locale of locales) {
    const detected = languageFromLocale(locale);
    if (detected) return detected;
  }
  return 'en';
}

export function isLocalizedValue(value) {
  if (!value || Array.isArray(value) || typeof value !== 'object') return false;
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((key) => LANGUAGES.includes(key));
}

export function localizeValue(value, language = 'en') {
  if (isLocalizedValue(value)) return value[language] ?? value.en ?? value.pt ?? '';
  if (Array.isArray(value)) return value.map((item) => localizeValue(item, language));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, localizeValue(item, language)]));
}

export function translateUi(language, key) {
  const dictionary = UI_TRANSLATIONS[normalizeLanguage(language)] || UI_TRANSLATIONS.en;
  const fallback = UI_TRANSLATIONS.en;
  const value = key.split('.').reduce((current, part) => current?.[part], dictionary);
  if (value != null) return value;
  return key.split('.').reduce((current, part) => current?.[part], fallback) ?? key;
}

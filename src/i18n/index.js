import { createI18n } from 'vue-i18n';
import en from './en.js';
import vi from './vi.js';

// Get saved language from localStorage, default to Vietnamese
const savedLocale = typeof localStorage !== 'undefined'
  ? localStorage.getItem('app-locale') || 'vi'
  : 'vi';

const i18n = createI18n({
  legacy: false, // Composition API mode
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: {
    en,
    vi,
  },
});

export default i18n;

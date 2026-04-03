import { createApp } from 'vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import './styles.css';
import App from './App.vue';
import i18n from './i18n';

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
  },
  theme: {
    defaultTheme: 'trendPulse',
    themes: {
      trendPulse: {
        dark: true,
        colors: {
          background: '#0a1220',
          surface: '#131d2d',
          primary: '#42d7af',
          secondary: '#6793ff',
          error: '#ff5f7b',
          warning: '#f6bc59',
          info: '#6fb9ff',
          success: '#42d7af',
        },
      },
    },
  },
});

createApp(App).use(vuetify).use(i18n).mount('#app');


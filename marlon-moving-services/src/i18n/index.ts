import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import customersEn from './en/customers.json';
import onboardingEn from './en/onboarding.json';
import scheduleEn from './en/schedule.json';
import customersEs from './es/customers.json';
import scheduleEs from './es/schedule.json';

void i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  fallbackLng: 'en',
  lng: 'es',
  resources: {
    en: {
      translation: {
        ...customersEn,
        ...onboardingEn,
        ...scheduleEn,
      },
    },
    es: {
      translation: {
        ...customersEs,
        ...scheduleEs,
      },
    },
  },
  interpolation: {
    escapeValue: false,
  },
});

export { i18n };

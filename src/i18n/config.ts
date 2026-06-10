import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import translationPT from "./locales/pt-BR.json";
import translationES from "./locales/es.json";

const resources = {
  "pt-BR": {
    translation: translationPT,
  },
  "es": {
    translation: translationES,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "pt-BR",
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "jornadas-lt-lang",
    },
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;

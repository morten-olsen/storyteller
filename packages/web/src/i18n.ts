import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import type { Locale } from "@storyteller/core";

import en from "./locales/en.json";
import da from "./locales/da.json";
import { loadLocale } from "./storage.ts";

const detectLocale = (): Locale => {
  const browserLang = navigator.language.split("-")[0];
  if (browserLang === "da") {
    return "da";
  }
  return "en";
};

const initI18n = async (): Promise<void> => {
  const saved = await loadLocale();
  const lng = saved ?? detectLocale();

  await i18next.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      da: { translation: da },
    },
    lng,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });
};

export { initI18n };

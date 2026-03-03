import type { Locale } from "../types.js";

const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  da: "Danish (dansk)",
};

const localeInstruction = (locale: Locale): string => {
  if (locale === "en") {
    return "";
  }
  return `\n\nLANGUAGE: Write all narrative content in ${LOCALE_NAMES[locale]}. Respond in ${LOCALE_NAMES[locale]}.`;
};

export { localeInstruction };

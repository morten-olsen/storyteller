import { useTranslation } from "react-i18next";
import type { Locale } from "@storyteller/core";

import { saveLocale } from "../storage.ts";

type Props = {
  onNext: () => void;
};

const LANGUAGES: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "da", label: "Dansk" },
];

const OnboardingLang = ({ onNext }: Props): React.ReactNode => {
  const { t, i18n } = useTranslation();

  const pick = async (locale: Locale): Promise<void> => {
    await i18n.changeLanguage(locale);
    await saveLocale(locale);
    onNext();
  };

  return (
    <div className='onboarding-step'>
      <h2 className='onboarding-heading'>{t("onboarding.langHeading")}</h2>
      <p className='onboarding-subtitle'>{t("onboarding.langSubtitle")}</p>
      <div className='onboarding-lang-buttons'>
        {LANGUAGES.map((lang) => (
          <button
            key={lang.value}
            className={`btn btn-large ${i18n.language === lang.value ? "btn-primary" : "btn-secondary"}`}
            onClick={() => pick(lang.value)}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export { OnboardingLang };

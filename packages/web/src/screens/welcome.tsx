import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Locale } from "@storyteller/core";

import { saveLocale } from "../storage.ts";

type Props = {
  isConfigured: boolean;
  activeGameId: string | null;
  activeGameTitle: string | null;
  onResume: (id: string) => void;
};

const Welcome = ({ isConfigured, activeGameId, activeGameTitle, onResume }: Props): React.ReactNode => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleLanguageToggle = async (): Promise<void> => {
    const next: Locale = i18n.language === "da" ? "en" : "da";
    await i18n.changeLanguage(next);
    await saveLocale(next);
  };

  return (
    <div className='screen welcome'>
      <div className='welcome-lang'>
        <button className='btn btn-ghost btn-small' onClick={handleLanguageToggle}>
          {i18n.language === "da" ? "EN" : "DA"}
        </button>
      </div>
      <h1 className='welcome-title'>
        {t("welcome.title")}
        <span className='welcome-cursor' />
      </h1>
      <div className='welcome-rule' />
      <p className='welcome-subtitle'>{t("welcome.subtitle")}</p>
      <p className='welcome-desc'>{t("welcome.description")}</p>

      <div className='welcome-actions'>
        {activeGameId && (
          <button className='btn btn-primary' onClick={() => onResume(activeGameId)}>
            {activeGameTitle ? t("welcome.continueGame", { title: activeGameTitle }) : t("welcome.continueDefault")}
          </button>
        )}
        {isConfigured ? (
          <button
            className={`btn ${activeGameId ? "btn-secondary" : "btn-primary"}`}
            onClick={() => navigate("/setup")}
          >
            {t("welcome.newGame")}
          </button>
        ) : (
          <button className='btn btn-primary' onClick={() => navigate("/settings")}>
            {t("welcome.configureApi")}
          </button>
        )}
        <button className='btn btn-secondary' onClick={() => navigate("/history")}>
          {t("welcome.pastGames")}
        </button>
        <button className='btn btn-ghost' onClick={() => navigate("/settings")}>
          {t("welcome.settings")}
        </button>
      </div>
    </div>
  );
};

export { Welcome };

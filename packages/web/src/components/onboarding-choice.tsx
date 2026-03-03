import { useTranslation } from "react-i18next";

type Props = {
  onRemote: () => void;
  onLocal: () => void;
};

const OnboardingChoice = ({ onRemote, onLocal }: Props): React.ReactNode => {
  const { t } = useTranslation();

  return (
    <div className='onboarding-step'>
      <h2 className='onboarding-heading'>{t("onboarding.choiceHeading")}</h2>
      <p className='onboarding-subtitle'>{t("onboarding.choiceSubtitle")}</p>
      <div className='onboarding-choices'>
        <button className='onboarding-choice-card' onClick={onRemote}>
          <span className='onboarding-choice-title'>{t("onboarding.remoteTitle")}</span>
          <span className='onboarding-choice-desc'>{t("onboarding.remoteDesc")}</span>
        </button>
        <button className='onboarding-choice-card' onClick={onLocal}>
          <span className='onboarding-choice-title'>{t("onboarding.localTitle")}</span>
          <span className='onboarding-choice-desc'>{t("onboarding.localDesc")}</span>
        </button>
      </div>
    </div>
  );
};

export { OnboardingChoice };

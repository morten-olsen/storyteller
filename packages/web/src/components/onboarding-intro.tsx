import { useTranslation } from "react-i18next";

type Props = {
  onNext: () => void;
};

const OnboardingIntro = ({ onNext }: Props): React.ReactNode => {
  const { t } = useTranslation();

  return (
    <div className='onboarding-step'>
      <h1 className='onboarding-title'>{t("welcome.title")}</h1>
      <div className='welcome-rule' />
      <p className='onboarding-intro-tagline'>{t("welcome.subtitle")}</p>
      <p className='onboarding-intro-body'>{t("onboarding.introBody")}</p>
      <p className='onboarding-intro-setup'>{t("onboarding.introSetup")}</p>
      <button className='btn btn-primary btn-large' onClick={onNext}>
        {t("onboarding.getStarted")}
      </button>
    </div>
  );
};

export { OnboardingIntro };

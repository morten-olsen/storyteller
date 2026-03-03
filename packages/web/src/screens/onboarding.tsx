import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { LLMSettings } from "@storyteller/core";

import { loadLocale } from "../storage.ts";
import { OnboardingLang } from "../components/onboarding-lang.tsx";
import { OnboardingIntro } from "../components/onboarding-intro.tsx";
import { OnboardingChoice } from "../components/onboarding-choice.tsx";
import { OnboardingRemote } from "../components/onboarding-remote.tsx";
import { OnboardingLocal } from "../components/onboarding-local.tsx";

type Step = "lang" | "intro" | "choice" | "remote" | "local";

const STEPS_WITH_LANG: Step[] = ["lang", "intro", "choice", "remote"];
const STEPS_WITHOUT_LANG: Step[] = ["intro", "choice", "remote"];

type Props = {
  onSave: (settings: LLMSettings) => void;
};

const Onboarding = ({ onSave }: Props): React.ReactNode => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step | null>(null);
  const [hadLangStep, setHadLangStep] = useState(false);

  useEffect(() => {
    loadLocale().then((locale) => {
      if (locale === null) {
        setHadLangStep(true);
        setStep("lang");
      } else {
        setStep("intro");
      }
    });
  }, []);

  const handleComplete = (settings: LLMSettings): void => {
    onSave(settings);
    navigate("/", { replace: true });
  };

  if (step === null) {
    return null;
  }

  const steps = hadLangStep ? STEPS_WITH_LANG : STEPS_WITHOUT_LANG;
  // "local" shares a dot with "remote" (both are the final step)
  const dotStep = step === "local" ? "remote" : step;
  const currentIndex = steps.indexOf(dotStep);

  return (
    <div className='screen onboarding'>
      {step === "lang" && <OnboardingLang onNext={() => setStep("intro")} />}
      {step === "intro" && <OnboardingIntro onNext={() => setStep("choice")} />}
      {step === "choice" && <OnboardingChoice onRemote={() => setStep("remote")} onLocal={() => setStep("local")} />}
      {step === "remote" && <OnboardingRemote onComplete={handleComplete} onBack={() => setStep("choice")} />}
      {step === "local" && <OnboardingLocal onComplete={handleComplete} onBack={() => setStep("choice")} />}

      <div className='onboarding-steps'>
        {steps.map((_, i) => (
          <span key={i} className={`onboarding-step-dot ${i === currentIndex ? "active" : ""}`} />
        ))}
      </div>
    </div>
  );
};

export { Onboarding };

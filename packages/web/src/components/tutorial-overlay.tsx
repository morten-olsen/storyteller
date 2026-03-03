import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { GameMode } from "@storyteller/core";

type TutorialStep = {
  targetSelector: string | null;
  objectiveKey: string;
  survivalKey: string;
};

const STEPS: TutorialStep[] = [
  {
    targetSelector: ".mission-world",
    objectiveKey: "tutorial.step1Objective",
    survivalKey: "tutorial.step1Survival",
  },
  {
    targetSelector: ".turn-input",
    objectiveKey: "tutorial.step2",
    survivalKey: "tutorial.step2",
  },
  {
    targetSelector: null,
    objectiveKey: "tutorial.step3Objective",
    survivalKey: "tutorial.step3Survival",
  },
  {
    targetSelector: null,
    objectiveKey: "tutorial.step4",
    survivalKey: "tutorial.step4",
  },
];

type Props = {
  mode: GameMode;
  onComplete: () => void;
};

type SpotlightRect = { top: number; left: number; width: number; height: number };

const TutorialOverlay = ({ mode, onComplete }: Props): React.ReactNode => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  const measure = useCallback(() => {
    const selector = STEPS[currentStep].targetSelector;
    if (!selector) {
      setSpotlightRect(null);
      return;
    }
    const el = document.querySelector(selector);
    if (!el) {
      setSpotlightRect(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    setSpotlightRect({
      top: rect.top - 4,
      left: rect.left - 4,
      width: rect.width + 8,
      height: rect.height + 8,
    });
  }, [currentStep]);

  useEffect(() => {
    measure();
    const handleResize = (): void => {
      measure();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [measure]);

  useEffect(() => {
    const selector = STEPS[currentStep].targetSelector;
    if (!selector) {
      return;
    }
    const el = document.querySelector(selector);
    if (!el) {
      return;
    }
    const observer = new ResizeObserver(() => measure());
    observer.observe(el);
    return () => observer.disconnect();
  }, [currentStep, measure]);

  const handleNext = (): void => {
    if (isLast) {
      onComplete();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const textKey = mode === "survival" ? step.survivalKey : step.objectiveKey;

  return (
    <div className='tutorial-overlay' ref={overlayRef}>
      {spotlightRect && (
        <div
          className='tutorial-spotlight'
          style={{
            top: spotlightRect.top,
            left: spotlightRect.left,
            width: spotlightRect.width,
            height: spotlightRect.height,
          }}
        />
      )}
      <div
        className={`tutorial-tooltip${spotlightRect ? " tutorial-tooltip-anchored" : ""}`}
        style={
          spotlightRect
            ? spotlightRect.top + spotlightRect.height + 180 > window.innerHeight
              ? { bottom: window.innerHeight - spotlightRect.top + 12 }
              : { top: spotlightRect.top + spotlightRect.height + 12 }
            : undefined
        }
      >
        <p>{t(textKey)}</p>
        <div className='tutorial-nav'>
          <div className='tutorial-dots'>
            {STEPS.map((_, i) => (
              <span key={i} className={`tutorial-dot${i === currentStep ? " active" : ""}`} />
            ))}
          </div>
          <div className='tutorial-nav-buttons'>
            <button className='btn btn-ghost btn-small' onClick={onComplete}>
              {t("common.skip")}
            </button>
            <button className='btn btn-primary btn-small' onClick={handleNext}>
              {isLast ? t("tutorial.letsGo") : t("common.next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { TutorialOverlay };

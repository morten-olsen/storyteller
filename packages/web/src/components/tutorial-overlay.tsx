import { useState, useEffect, useCallback, useRef } from "react";
import type { GameMode } from "@storyteller/core";

type TutorialStep = {
  targetSelector: string | null;
  objective: string;
  survival: string;
};

const STEPS: TutorialStep[] = [
  {
    targetSelector: ".mission-world",
    objective: "This is your world. Below are your secret objectives — fulfill them before the AI fulfills theirs.",
    survival: "This is your situation. You face an immediate danger you must write your way out of.",
  },
  {
    targetSelector: ".turn-input",
    objective:
      "Write a story paragraph here. Stay under the character limit. Submit with the button or Cmd/Ctrl+Enter.",
    survival: "Write a story paragraph here. Stay under the character limit. Submit with the button or Cmd/Ctrl+Enter.",
  },
  {
    targetSelector: null,
    objective: "A judge scores each turn on coherence, prose quality, and adaptation.",
    survival: "A judge scores creativity, writing quality, and effectiveness — and decides if you survive.",
  },
  {
    targetSelector: null,
    objective: "Ready! We'll suggest a first turn to get you started.",
    survival: "Ready! We'll suggest a first turn to get you started.",
  },
];

type Props = {
  mode: GameMode;
  onComplete: () => void;
};

type SpotlightRect = { top: number; left: number; width: number; height: number };

const TutorialOverlay = ({ mode, onComplete }: Props): React.ReactNode => {
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

  const text = mode === "survival" ? step.survival : step.objective;

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
        <p>{text}</p>
        <div className='tutorial-nav'>
          <div className='tutorial-dots'>
            {STEPS.map((_, i) => (
              <span key={i} className={`tutorial-dot${i === currentStep ? " active" : ""}`} />
            ))}
          </div>
          <div className='tutorial-nav-buttons'>
            <button className='btn btn-ghost btn-small' onClick={onComplete}>
              Skip
            </button>
            <button className='btn btn-primary btn-small' onClick={handleNext}>
              {isLast ? "Let's Go" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { TutorialOverlay };

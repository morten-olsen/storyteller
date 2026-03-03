import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  charLimit: number;
  onSubmit: (text: string) => void;
  draftText?: string | null;
  draftLoading?: boolean;
};

const TurnInput = ({ charLimit, onSubmit, draftText, draftLoading }: Props): React.ReactNode => {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const prevDraftRef = useRef<string | null | undefined>(null);
  const remaining = charLimit - text.length;
  const isOverLimit = remaining < 0;
  const isEmpty = text.trim().length === 0;

  // When draftText arrives, fill it into the textarea
  useEffect(() => {
    if (draftText && draftText !== prevDraftRef.current) {
      setText(draftText);
    }
    prevDraftRef.current = draftText;
  }, [draftText]);

  const handleSubmit = (): void => {
    if (isEmpty || isOverLimit) {
      return;
    }
    onSubmit(text.trim());
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <div className='turn-input'>
      <div className='turn-input-area'>
        <span className='turn-prompt'>&gt;</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={draftLoading ? t("turnInput.generating") : t("turnInput.placeholder")}
          rows={3}
        />
      </div>
      <div className='turn-input-footer'>
        <span className={`char-count ${isOverLimit ? "over" : remaining < 50 ? "warn" : ""}`}>
          {t("turnInput.remaining", { count: remaining })}
        </span>
        <button className='btn btn-primary btn-small' disabled={isEmpty || isOverLimit} onClick={handleSubmit}>
          {t("common.submit")}
        </button>
      </div>
    </div>
  );
};

export { TurnInput };

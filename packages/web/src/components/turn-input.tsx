import { useState } from "react";

type Props = {
  charLimit: number;
  onSubmit: (text: string) => void;
};

const TurnInput = ({ charLimit, onSubmit }: Props): React.ReactNode => {
  const [text, setText] = useState("");
  const remaining = charLimit - text.length;
  const isOverLimit = remaining < 0;
  const isEmpty = text.trim().length === 0;

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
          placeholder='Write your next paragraph...'
          rows={3}
        />
      </div>
      <div className='turn-input-footer'>
        <span className={`char-count ${isOverLimit ? "over" : remaining < 50 ? "warn" : ""}`}>
          {remaining} remaining
        </span>
        <button className='btn btn-primary btn-small' disabled={isEmpty || isOverLimit} onClick={handleSubmit}>
          Submit
        </button>
      </div>
    </div>
  );
};

export { TurnInput };

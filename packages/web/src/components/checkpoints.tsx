import type { Checkpoint } from "@storyteller/core";

type Props = {
  playerCheckpoints: Checkpoint[];
  aiCheckpoints: Checkpoint[];
  aiVisibility: "full" | "hints" | "hidden";
};

const Checkpoints = ({ playerCheckpoints, aiCheckpoints, aiVisibility }: Props): React.ReactNode => {
  return (
    <div className='checkpoints'>
      <div className='checkpoint-section'>
        <h4>Your Objectives</h4>
        {playerCheckpoints.length === 0 ? (
          <p className='empty-hint'>Generating...</p>
        ) : (
          playerCheckpoints.map((c) => (
            <div key={c.id} className={`checkpoint-item ${c.fulfilled ? "fulfilled" : ""}`}>
              <span className='checkpoint-icon'>{c.fulfilled ? "\u2713" : "\u25CB"}</span>
              <span>{c.description}</span>
            </div>
          ))
        )}
      </div>

      <div className='checkpoint-section'>
        <h4>AI Objectives</h4>
        {aiCheckpoints.length === 0 ? (
          <p className='empty-hint'>Generating...</p>
        ) : aiVisibility === "hidden" ? (
          <p className='hidden-hint'>{aiCheckpoints.length} hidden objectives</p>
        ) : (
          aiCheckpoints.map((c) => (
            <div key={c.id} className={`checkpoint-item ${c.fulfilled ? "fulfilled" : ""}`}>
              <span className='checkpoint-icon'>{c.fulfilled ? "\u2713" : "\u25CB"}</span>
              <span>
                {aiVisibility === "hints"
                  ? c.description.slice(0, Math.ceil(c.description.length * 0.4)) + "..."
                  : c.description}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export { Checkpoints };

import { useNavigate } from "react-router-dom";

type Props = {
  isConfigured: boolean;
  activeGameId: string | null;
  activeGameTitle: string | null;
  onResume: (id: string) => void;
};

const Welcome = ({ isConfigured, activeGameId, activeGameTitle, onResume }: Props): React.ReactNode => {
  const navigate = useNavigate();

  return (
    <div className='screen welcome'>
      <h1 className='welcome-title'>
        Storyteller
        <span className='welcome-cursor' />
      </h1>
      <div className='welcome-rule' />
      <p className='welcome-subtitle'>An adversarial narrative game</p>
      <p className='welcome-desc'>
        You and an AI each have secret story objectives. Take turns writing a shared narrative, steering it toward your
        goals while crafting compelling prose.
      </p>

      <div className='welcome-actions'>
        {activeGameId && (
          <button className='btn btn-primary' onClick={() => onResume(activeGameId)}>
            Continue{activeGameTitle ? `: ${activeGameTitle}` : " Game"}
          </button>
        )}
        {isConfigured ? (
          <button
            className={`btn ${activeGameId ? "btn-secondary" : "btn-primary"}`}
            onClick={() => navigate("/setup")}
          >
            New Game
          </button>
        ) : (
          <button className='btn btn-primary' onClick={() => navigate("/settings")}>
            Configure API
          </button>
        )}
        <button className='btn btn-secondary' onClick={() => navigate("/history")}>
          Past Games
        </button>
        <button className='btn btn-ghost' onClick={() => navigate("/settings")}>
          Settings
        </button>
      </div>
    </div>
  );
};

export { Welcome };

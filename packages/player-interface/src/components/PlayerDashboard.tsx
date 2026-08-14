import type { PlayerSummaryView } from "../model";

interface PlayerDashboardProps {
  player: PlayerSummaryView;
  isActive: boolean;
}

function Progress({ label, value, total }: { label: string; value: number | undefined; total: number | undefined }) {
  if (value === undefined || total === undefined || total <= 0) return null;
  const pct = Math.min(100, Math.max(0, (value / total) * 100));
  return (
    <div className="progress-row">
      <div><span>{label}</span><strong>{value}/{total}</strong></div>
      <div className="progress-track" aria-label={`${label}: ${value} of ${total}`}>
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function PlayerDashboard({ player, isActive }: PlayerDashboardProps) {
  const tokenCount = player.tokens.reduce((total, token) => total + token.count, 0);
  return (
    <aside className={`player-dashboard ${isActive ? "is-active" : ""}`} aria-label={`${player.displayName} dashboard`}>
      <div className="player-heading">
        <div className="dog-avatar" style={{ borderColor: player.color }} aria-hidden="true">
          {player.dog.portraitUrl ? <img src={player.dog.portraitUrl} alt="" /> : "🐶"}
        </div>
        <div>
          <p className="eyebrow">{isActive ? "Current trainer" : "Trainer"}</p>
          <h2>{player.dog.name}</h2>
          <p>{player.dog.breed || player.displayName}</p>
        </div>
      </div>

      <div className="stat-grid">
        <div><span>Trainer</span><strong>{player.displayName}</strong></div>
        <div><span>Position</span><strong>{player.positionLabel}</strong></div>
        <div><span>Tokens</span><strong>{tokenCount}</strong></div>
        <div><span>Trainer cards</span><strong>{player.trainerCardCount}</strong></div>
      </div>

      <Progress label="Training" value={player.dog.trainingCompleted} total={player.dog.trainingTotal} />
      <Progress label="Competition" value={player.dog.competitionProgress} total={player.dog.competitionTotal} />

      {player.tokens.length > 0 && (
        <div className="token-strip" aria-label="Token inventory">
          {player.tokens.map((token) => (
            <span key={token.id} title={`${token.label}: ${token.count}`}>
              <b aria-hidden="true">●</b>{token.label} × {token.count}
            </span>
          ))}
        </div>
      )}
    </aside>
  );
}

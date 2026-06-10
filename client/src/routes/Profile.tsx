import { useMemo } from "react";
import { useAuth } from "../lib/auth";
import { useMatches, useMyPredictions } from "../lib/queries";

export default function Profile() {
  const { user } = useAuth();
  const predictionsQuery = useMyPredictions();
  const matchesQuery = useMatches();

  const stats = useMemo(() => {
    const preds = predictionsQuery.data ?? [];
    const scored = preds.filter((p) => p.scored);
    const exact = scored.filter((p) => p.points === 3).length;
    const outcome = scored.filter((p) => p.points === 1).length;
    const total = matchesQuery.data?.length ?? 0;
    return {
      submitted: preds.length,
      totalMatches: total,
      exact,
      outcome,
      scored: scored.length,
    };
  }, [predictionsQuery.data, matchesQuery.data]);

  if (!user) return null;

  return (
    <div>
      <div className="page-head">
        <h1>Profile</h1>
        <p>Your account and prediction stats.</p>
      </div>

      <div className="stack">
        <div className="card card-pad">
          <div className="section-title">Account</div>
          <div className="grid">
            <Detail label="Nickname" value={user.nickname} />
            <Detail label="Name" value={`${user.first_name} ${user.last_name}`} />
            <Detail label="Email" value={user.email} />
            <Detail label="Total points" value={String(user.total_points)} />
          </div>
        </div>

        <div className="card card-pad">
          <div className="section-title">Prediction stats</div>
          <div className="grid">
            <Detail
              label="Predictions made"
              value={`${stats.submitted} / ${stats.totalMatches}`}
            />
            <Detail label="Exact results (3 pts)" value={String(stats.exact)} />
            <Detail label="Correct outcomes (1 pt)" value={String(stats.outcome)} />
            <Detail label="Matches scored" value={String(stats.scored)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="muted" style={{ fontSize: 13 }}>
        {label}
      </div>
      <div style={{ fontWeight: 650, fontSize: 16 }}>{value}</div>
    </div>
  );
}

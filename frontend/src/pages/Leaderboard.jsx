import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { Trophy, Crown } from "lucide-react";
import { GAMES } from "./Arcade";

export default function Leaderboard() {
  const [game, setGame] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/leaderboard${game ? `?game_id=${game}` : ""}`).then(r => setRows(r.data)).finally(() => setLoading(false));
  }, [game]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mono-label">// HALL_OF_FAME</div>
      <h1 className="h-display text-4xl sm:text-5xl text-white mt-2">Leaderboard</h1>

      <div className="flex flex-wrap gap-2 mt-8" data-testid="leaderboard-filters">
        <button onClick={() => setGame("")} data-testid="filter-all" className={`px-4 py-2 mono-label border ${game === "" ? "bg-neon-blue text-black border-neon-blue" : "border-white/10 text-white/70"}`}>ALL</button>
        {GAMES.map(g => (
          <button key={g.id} onClick={() => setGame(g.id)} data-testid={`filter-${g.id}`} className={`px-4 py-2 mono-label border ${game === g.id ? "bg-neon-blue text-black border-neon-blue" : "border-white/10 text-white/70"}`}>{g.name}</button>
        ))}
      </div>

      <div className="glass mt-8">
        {loading ? <div className="p-8 mono-label text-center text-neon-blue">LOADING...</div> :
          rows.length === 0 ? <div className="p-12 text-center text-white/50">No scores yet. Be the first.</div> :
          <div className="divide-y divide-white/5">
            {rows.map((r, i) => (
              <div key={r.id || i} className="p-4 flex items-center gap-4" data-testid={`row-${i}`}>
                <div className={`w-10 text-center font-heading text-2xl ${i === 0 ? "text-neon-yellow neon-text" : i < 3 ? "text-neon-blue" : "text-white/50"}`}>#{i+1}</div>
                {r.picture && <img src={r.picture} className="w-8 h-8 border border-white/10" alt={r.name} />}
                <div className="flex-1">
                  <div className="text-white font-heading">{r.name} {i === 0 && <Crown className="inline w-4 h-4 text-neon-yellow ml-1" />}</div>
                  <div className="text-white/40 text-xs mono-label">{r.game_id}</div>
                </div>
                <div className="font-heading text-xl text-neon-blue">{r.score}</div>
              </div>
            ))}
          </div>
        }
      </div>
    </div>
  );
}

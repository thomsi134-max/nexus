import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const GAMES = [
  { id: "snake", name: "Snake PRO", desc: "Neon snake with power-ups.", color: "#39ff14", premium: false },
  { id: "memory", name: "Memory Game", desc: "Match the cyberpunk symbols.", color: "#00f0ff", premium: false },
  { id: "dodge", name: "Dodge Game", desc: "Survive falling pixel storms.", color: "#fcee0a", premium: false },
  { id: "reaction", name: "Reaction Test", desc: "Sharpen your reflexes.", color: "#ff003c", premium: false },
  { id: "racing", name: "Car Racing", desc: "Endless neon highway.", color: "#00f0ff", premium: true },
  { id: "click", name: "Click Speed", desc: "Clicks per second test.", color: "#39ff14", premium: false },
  { id: "aim", name: "Aim Trainer", desc: "Pop the targets fast.", color: "#ff003c", premium: true },
];

export default function Arcade() {
  const { user } = useAuth();
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mono-label">// ARCADE_v1</div>
      <h1 className="h-display text-4xl sm:text-5xl text-white mt-2">Pick your <span className="text-neon-blue neon-text">poison</span></h1>
      <p className="text-white/60 mt-3 max-w-xl">Instant browser play. Earn coins and XP. Top the leaderboards. Some games are VIP-locked.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
        {GAMES.map((g, i) => {
          const locked = g.premium && !user?.premium;
          return (
            <motion.div key={g.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link
                to={locked ? "/premium" : `/arcade/${g.id}`}
                data-testid={`game-card-${g.id}`}
                className="block glass p-6 relative overflow-hidden hover:translate-y-[-2px] transition-transform"
              >
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: g.color, boxShadow: `0 0 14px ${g.color}` }} />
                <div className="flex items-start justify-between">
                  <div>
                    <div className="mono-label" style={{ color: g.color }}>{g.id.toUpperCase()}</div>
                    <div className="font-heading font-bold text-2xl text-white mt-1">{g.name}</div>
                  </div>
                  {locked && <Lock className="w-5 h-5 text-neon-pink" />}
                </div>
                <p className="text-white/60 mt-3 text-sm">{g.desc}</p>
                <div className="mt-6 mono-label" style={{ color: g.color }}>{locked ? "VIP UNLOCK →" : "PLAY →"}</div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

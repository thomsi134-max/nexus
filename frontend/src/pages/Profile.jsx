import React, { useState } from "react";
import { motion } from "framer-motion";
import { Crown, Gift, Coins, Trophy, Palette, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useSound } from "../context/SoundContext";

const THEMES = [
  { id: "neon", name: "Neon Cyber", color: "#00f0ff", premium: false },
  { id: "matrix", name: "Matrix Green", color: "#39ff14", premium: false },
  { id: "sunset", name: "Sunset Burn", color: "#ff003c", premium: true },
  { id: "ice", name: "Ice Storm", color: "#a8e6ff", premium: true },
];

const ACHIEVEMENT_INFO = {
  century: { name: "Century", desc: "Score 100+ in any game" },
  level_5: { name: "Level 5", desc: "Reach level 5" },
};

export default function Profile() {
  const { user, refresh, login } = useAuth();
  const { playCoin, playWin } = useSound();
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState(null);
  const [claiming, setClaiming] = useState(false);

  if (!user) return (
    <div className="grid place-items-center min-h-[60vh] text-center px-4">
      <button onClick={login} className="btn-neon">Login to view profile</button>
    </div>
  );

  const claimDaily = async () => {
    setClaiming(true);
    try {
      const { data } = await api.post("/rewards/daily");
      toast.success(`+${data.reward} coins!`);
      playCoin();
      await refresh();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Already claimed today");
    } finally { setClaiming(false); }
  };

  const spin = async () => {
    if (spinning) return;
    setSpinning(true); setSpinResult(null);
    try {
      const { data } = await api.post("/rewards/spin");
      setTimeout(async () => {
        setSpinResult(data.reward);
        setSpinning(false);
        playWin();
        await refresh();
      }, 2200);
    } catch (e) {
      setSpinning(false);
      toast.error(e.response?.data?.detail || "Try again later");
    }
  };

  const pickTheme = async (t) => {
    try {
      await api.post("/profile/theme", { theme: t.id });
      toast.success(`Theme: ${t.name}`);
      await refresh();
    } catch (e) {
      toast.error(t.premium ? "VIP required" : "Failed");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-4">
        <img src={user.picture} alt={user.name} className="w-20 h-20 border-2 border-neon-blue" />
        <div>
          <div className="mono-label">// PROFILE</div>
          <h1 className="h-display text-3xl sm:text-4xl text-white flex items-center gap-3">{user.name} {user.premium && <Crown className="text-neon-pink" />}</h1>
          <div className="text-white/50 mono-label text-xs mt-1">{user.email}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
        <div className="glass p-6">
          <div className="mono-label flex items-center gap-2"><Gift className="w-4 h-4" /> DAILY REWARD</div>
          <p className="text-white/60 text-sm mt-2">Claim coins every 20 hours.</p>
          <button data-testid="claim-daily" onClick={claimDaily} disabled={claiming} className="btn-neon mt-4 w-full">
            {claiming ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Coins className="w-4 h-4" /> Claim</>}
          </button>
        </div>

        <div className="glass p-6">
          <div className="mono-label flex items-center gap-2"><Trophy className="w-4 h-4" /> SPIN WHEEL</div>
          <div className="mt-4 grid place-items-center">
            <motion.div animate={{ rotate: spinning ? 720 * 3 : 0 }} transition={{ duration: 2.2 }} className="w-24 h-24 rounded-full border-4 border-neon-pink"
              style={{ background: "conic-gradient(#00f0ff 0 45deg, #ff003c 45deg 90deg, #39ff14 90deg 135deg, #fcee0a 135deg 180deg, #00f0ff 180deg 225deg, #ff003c 225deg 270deg, #39ff14 270deg 315deg, #fcee0a 315deg 360deg)", boxShadow: "0 0 24px #ff003c" }} />
          </div>
          {spinResult !== null && <div className="text-center mono-label text-neon-yellow mt-3">+{spinResult} COINS</div>}
          <button data-testid="spin-wheel" onClick={spin} disabled={spinning} className="btn-pink w-full mt-4">{spinning ? "Spinning..." : "Spin (8h cooldown)"}</button>
        </div>

        <div className="glass p-6">
          <div className="mono-label flex items-center gap-2"><Palette className="w-4 h-4" /> COSMETIC THEMES</div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {THEMES.map(t => (
              <button key={t.id} data-testid={`theme-${t.id}`} onClick={() => pickTheme(t)}
                className={`p-3 border text-left ${user.theme === t.id ? "border-neon-blue" : "border-white/10"}`}>
                <div className="w-full h-2" style={{ background: t.color, boxShadow: `0 0 8px ${t.color}` }} />
                <div className="text-white text-xs mt-2 font-mono">{t.name}</div>
                {t.premium && <div className="mono-label text-neon-pink text-[9px] mt-1">VIP</div>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass p-6 mt-6">
        <div className="mono-label">ACHIEVEMENTS</div>
        {user.achievements?.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            {user.achievements.map(a => (
              <div key={a} className="p-4 border border-neon-green/30 bg-neon-green/5">
                <div className="font-heading text-white">{ACHIEVEMENT_INFO[a]?.name || a}</div>
                <div className="text-white/50 text-xs mt-1">{ACHIEVEMENT_INFO[a]?.desc}</div>
              </div>
            ))}
          </div>
        ) : <div className="text-white/50 mt-4">Play games to unlock achievements.</div>}
      </div>

      <div className="glass p-6 mt-6">
        <div className="mono-label">HIGH SCORES</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          {Object.entries(user.high_scores || {}).map(([g, s]) => (
            <div key={g} className="p-3 border border-white/10">
              <div className="mono-label text-neon-blue text-xs">{g}</div>
              <div className="font-heading text-2xl text-white">{s}</div>
            </div>
          ))}
          {!Object.keys(user.high_scores || {}).length && <div className="text-white/50 col-span-4">No scores yet.</div>}
        </div>
      </div>
    </div>
  );
}

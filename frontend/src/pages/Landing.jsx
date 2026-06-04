import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Trophy, Cpu, Crown, Gamepad2, ArrowRight } from "lucide-react";
import { useSound } from "../context/SoundContext";
import { useAuth } from "../context/AuthContext";

const STATS = [
  { k: "GAMES", v: "7+" },
  { k: "AI TOOLS", v: "5" },
  { k: "PLAYERS", v: "12K" },
  { k: "REWARDS", v: "DAILY" },
];

export default function Landing() {
  const { playClick, playHover } = useSound();
  const { login, user } = useAuth();
  return (
    <div className="relative">
      {/* HERO */}
      <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mono-label mb-6">
            // 2026 GAMING PLATFORM · ONLINE
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.7 }} className="h-display text-5xl sm:text-7xl lg:text-8xl">
            <span className="text-white">PLAY THE</span><br />
            <span className="neon-text text-neon-blue">FUTURE</span>{" "}
            <span className="neon-text-pink text-neon-pink">.GG</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.7 }} className="text-white/70 max-w-2xl mt-8 text-base sm:text-lg leading-relaxed">
            A cyberpunk arcade meets pixel-built worlds. 7 instant-play mini games, GPT-5.2 powered creator tools, leaderboards, daily spins, and a VIP-class premium tier. No download required on mobile.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex flex-wrap gap-4 mt-10">
            <Link to="/arcade" onClick={playClick} onMouseEnter={playHover} data-testid="hero-play-btn" className="btn-neon">
              <Gamepad2 className="w-4 h-4" /> Enter Arcade
            </Link>
            {!user && (
              <button data-testid="hero-login-btn" onClick={() => { playClick(); login(); }} className="btn-ghost">
                <Zap className="w-4 h-4" /> Sign in with Google
              </button>
            )}
            <Link to="/premium" onClick={playClick} className="btn-pink"><Crown className="w-4 h-4" /> Go Premium</Link>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20">
            {STATS.map((s, i) => (
              <motion.div key={s.k} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 + i * 0.1 }} className="glass p-5">
                <div className="mono-label">{s.k}</div>
                <div className="font-heading text-3xl font-black mt-1 text-white">{s.v}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES BENTO */}
      <section className="px-4 sm:px-6 lg:px-8 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="mono-label mb-3">// FEATURE_MATRIX</div>
          <h2 className="h-display text-3xl sm:text-4xl lg:text-5xl mb-12 text-white">Built for the new <span className="text-neon-blue neon-text">creator-player</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard color="#00f0ff" icon={<Gamepad2/>} title="7 Mini Games" body="Snake PRO, Memory, Dodge, Reaction Test, Car Racing, Click Speed, Aim Trainer. Instant browser play." />
            <FeatureCard color="#ff003c" icon={<Cpu/>} title="AI Creator Tools" body="GPT-5.2 powered username, story, thumbnail, Minecraft build & video title generators." />
            <FeatureCard color="#39ff14" icon={<Trophy/>} title="Global Leaderboards" body="Climb the ranks. Earn coins, XP, achievements, and the VIP badge." />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ color, icon, title, body }) {
  return (
    <motion.div whileHover={{ y: -4 }} className="glass p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: color, boxShadow: `0 0 18px ${color}` }} />
      <div className="grid place-items-center w-12 h-12 mb-4 pixel-border" style={{ borderColor: color, boxShadow: `4px 4px 0 0 ${color}55` }}>
        {React.cloneElement(icon, { className: "w-5 h-5", style: { color } })}
      </div>
      <h3 className="font-heading font-bold text-xl text-white">{title}</h3>
      <p className="text-white/60 text-sm mt-2 leading-relaxed">{body}</p>
    </motion.div>
  );
}

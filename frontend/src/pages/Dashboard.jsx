import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Gamepad2, Cpu, Crown, Trophy, Award } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <NeedLogin />;
  const xpFor = (lv) => 100 * lv * lv;
  const progress = Math.min(100, (user.xp / xpFor(user.level)) * 100);
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mono-label">// AGENT_DASHBOARD</div>
      <h1 className="h-display text-4xl sm:text-5xl mt-2 text-white">Welcome back, <span className="text-neon-blue neon-text">{user.name.split(" ")[0]}</span></h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
        <div className="glass p-6">
          <div className="mono-label">LEVEL</div>
          <div className="h-display text-5xl mt-2 text-white">{user.level}</div>
          <div className="mt-4 h-2 bg-white/10 overflow-hidden">
            <div className="h-full bg-neon-blue" style={{ width: `${progress}%`, boxShadow: "0 0 12px #00f0ff" }} />
          </div>
          <div className="text-white/50 text-xs mono-label mt-2">{user.xp} / {xpFor(user.level)} XP</div>
        </div>
        <div className="glass p-6">
          <div className="mono-label">COINS</div>
          <div className="h-display text-5xl mt-2 text-neon-yellow neon-text">{user.coins}</div>
          <Link to="/premium" className="btn-ghost mt-4 inline-flex">Earn more</Link>
        </div>
        <div className="glass p-6">
          <div className="mono-label">STATUS</div>
          <div className="h-display text-3xl mt-2">{user.premium ? <span className="text-neon-pink neon-text-pink">VIP</span> : <span className="text-white">FREE</span>}</div>
          {!user.premium && <Link to="/premium" className="btn-pink mt-4"><Crown className="w-4 h-4" /> Go Premium</Link>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Link to="/arcade" data-testid="dash-arcade" className="glass p-6 group hover:bg-black/70 transition-all">
          <Gamepad2 className="w-8 h-8 text-neon-blue" />
          <div className="font-heading font-bold text-2xl mt-3 text-white">Arcade</div>
          <div className="text-white/60 text-sm mt-1">7 mini games, all browser-instant.</div>
        </Link>
        <Link to="/ai-tools" data-testid="dash-ai" className="glass p-6 group">
          <Cpu className="w-8 h-8 text-neon-pink" />
          <div className="font-heading font-bold text-2xl mt-3 text-white">AI Tools</div>
          <div className="text-white/60 text-sm mt-1">Username, story, thumbnail, build & title gens.</div>
        </Link>
        <Link to="/leaderboard" data-testid="dash-leaderboard" className="glass p-6">
          <Trophy className="w-8 h-8 text-neon-yellow" />
          <div className="font-heading font-bold text-2xl mt-3 text-white">Leaderboard</div>
          <div className="text-white/60 text-sm mt-1">Climb the global ranks.</div>
        </Link>
        <Link to="/profile" data-testid="dash-profile" className="glass p-6">
          <Award className="w-8 h-8 text-neon-green" />
          <div className="font-heading font-bold text-2xl mt-3 text-white">Profile · Rewards</div>
          <div className="text-white/60 text-sm mt-1">Daily spin · achievements · cosmetics</div>
        </Link>
      </div>
    </div>
  );
}

function Loader() { return <div className="grid place-items-center min-h-[60vh] mono-label text-neon-blue">LOADING...</div>; }
function NeedLogin() {
  const { login } = useAuth();
  return (
    <div className="grid place-items-center min-h-[60vh] text-center px-4">
      <div className="glass p-10 max-w-md">
        <div className="mono-label mb-2">ACCESS REQUIRED</div>
        <h2 className="h-display text-3xl text-white">Sign in to enter</h2>
        <p className="text-white/60 mt-3">Authenticate with Google to access your dashboard, save scores, and unlock rewards.</p>
        <button onClick={login} className="btn-neon mt-6" data-testid="need-login-btn">Login with Google</button>
      </div>
    </div>
  );
}

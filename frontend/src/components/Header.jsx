import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Volume2, VolumeX, Coins, Crown, Menu, X, LogOut, Gamepad2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSound } from "../context/SoundContext";

const NAV = [
  { to: "/arcade", label: "Arcade" },
  { to: "/ai-tools", label: "AI Tools" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/premium", label: "Premium" },
  { to: "/download", label: "Download" },
];

export default function Header() {
  const { user, login, logout } = useAuth();
  const { muted, toggleMute, playClick, playHover } = useSound();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass-strong border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link to="/" data-testid="logo-link" onClick={playClick} className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-neon-blue grid place-items-center pixel-border" style={{ boxShadow: "0 0 16px #00f0ff" }}>
            <Gamepad2 className="w-4 h-4 text-black" />
          </div>
          <span className="font-heading font-black text-xl tracking-tight neon-text">NEXUS<span className="text-neon-pink">.</span>GG</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              data-testid={`nav-${n.label.toLowerCase().replace(/\s/g,'-')}`}
              onMouseEnter={playHover}
              onClick={playClick}
              className={({ isActive }) =>
                `px-4 py-2 mono-label transition-all hover:text-neon-blue ${isActive ? "text-neon-blue" : "text-white/70"}`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button data-testid="sound-toggle" onClick={() => { toggleMute(); }} className="p-2 text-white/70 hover:text-neon-blue transition-colors" aria-label="Toggle sound">
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {user ? (
            <div className="hidden md:flex items-center gap-3" data-testid="user-bar">
              <div className="flex items-center gap-1 mono-label text-neon-yellow"><Coins className="w-4 h-4" />{user.coins}</div>
              {user.premium && <Crown className="w-4 h-4 text-neon-pink" data-testid="vip-badge" />}
              <button data-testid="profile-btn" onClick={() => { playClick(); navigate("/profile"); }} className="flex items-center gap-2">
                <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-none border border-neon-blue" />
              </button>
              <button data-testid="logout-btn" onClick={logout} className="p-2 text-white/70 hover:text-neon-pink"><LogOut className="w-4 h-4" /></button>
            </div>
          ) : (
            <button data-testid="login-btn" onClick={() => { playClick(); login(); }} className="btn-neon hidden md:inline-flex">Login</button>
          )}

          <button data-testid="mobile-menu-btn" onClick={() => setOpen(!open)} className="md:hidden p-2 text-white">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/10 glass">
          <div className="flex flex-col p-4 gap-2">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} onClick={() => setOpen(false)} className="py-2 mono-label text-white/80">{n.label}</NavLink>
            ))}
            {user ? (
              <>
                <div className="flex items-center gap-2 text-neon-yellow mono-label"><Coins className="w-4 h-4" />{user.coins} {user.premium && <Crown className="w-4 h-4 text-neon-pink" />}</div>
                <button onClick={() => navigate("/profile")} className="btn-ghost">Profile</button>
                <button onClick={logout} className="btn-ghost">Logout</button>
              </>
            ) : (
              <button data-testid="mobile-login-btn" onClick={login} className="btn-neon">Login with Google</button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

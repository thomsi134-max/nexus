import React from "react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 mt-24 glass">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="font-heading text-xl font-black neon-text">NEXUS<span className="text-neon-pink">.</span>GG</div>
          <p className="text-white/50 text-sm mt-3">The 2026 cyberpunk arcade. Play, create, climb.</p>
        </div>
        <div>
          <div className="mono-label mb-3">Platform</div>
          <ul className="text-white/60 text-sm space-y-2">
            <li>Arcade</li><li>AI Tools</li><li>Leaderboards</li>
          </ul>
        </div>
        <div>
          <div className="mono-label mb-3">Account</div>
          <ul className="text-white/60 text-sm space-y-2">
            <li>Premium</li><li>Profile</li><li>Achievements</li>
          </ul>
        </div>
        <div>
          <div className="mono-label mb-3">Build</div>
          <ul className="text-white/60 text-sm space-y-2">
            <li>v1.0 · 2026</li><li>Powered by AI</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-white/40 text-xs mono-label">© 2026 NEXUS.GG · ALL SYSTEMS NOMINAL</div>
    </footer>
  );
}

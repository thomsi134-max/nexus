import React from "react";
import { Download as Dl, Monitor, Smartphone, Apple } from "lucide-react";

export default function Download() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mono-label">// CLIENTS</div>
      <h1 className="h-display text-4xl sm:text-5xl text-white mt-2">Download <span className="text-neon-blue neon-text">NEXUS</span></h1>
      <p className="text-white/60 mt-3 max-w-2xl">PC users get the full immersive desktop client. Mobile users play instantly in the browser - no install required.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
        <Card icon={<Monitor className="w-8 h-8 text-neon-blue" />} title="Windows" sub="64-bit · v1.0.0 · 84 MB" cta="Download .exe" />
        <Card icon={<Apple className="w-8 h-8 text-white" />} title="macOS" sub="Apple Silicon + Intel · v1.0.0" cta="Download .dmg" />
        <Card icon={<Smartphone className="w-8 h-8 text-neon-pink" />} title="Mobile" sub="Browser play - no install" cta="Play in browser" />
      </div>

      <div className="glass p-6 mt-10">
        <div className="mono-label">// SYSTEM_REQUIREMENTS</div>
        <ul className="text-white/70 text-sm mt-3 font-mono space-y-1">
          <li>OS: Win 10+, macOS 12+</li>
          <li>RAM: 4 GB minimum, 8 GB recommended</li>
          <li>GPU: WebGL 2.0 compatible</li>
          <li>Connection: Broadband for online features</li>
        </ul>
      </div>
    </div>
  );
}

function Card({ icon, title, sub, cta }) {
  return (
    <div className="glass p-6 hover:translate-y-[-2px] transition-transform" data-testid={`dl-${title.toLowerCase()}`}>
      {icon}
      <div className="font-heading text-2xl text-white mt-4">{title}</div>
      <div className="mono-label text-white/50 mt-1 text-xs">{sub}</div>
      <button className="btn-ghost mt-5"><Dl className="w-4 h-4" /> {cta}</button>
    </div>
  );
}

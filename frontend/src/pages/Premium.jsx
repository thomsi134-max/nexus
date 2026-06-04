import React, { useState } from "react";
import { Crown, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

const PLANS = [
  { id: "monthly", price: "$4.99", period: "/mo", title: "Monthly", perks: ["All games unlocked", "VIP badge", "Cosmetic themes", "Ad-free"] },
  { id: "yearly", price: "$39.99", period: "/yr", title: "Yearly", best: true, perks: ["All Monthly perks", "33% off", "2x daily spins", "Priority leaderboard"] },
  { id: "lifetime", price: "$99.99", period: "once", title: "Lifetime", perks: ["All perks forever", "Founders badge", "Future drops included"] },
];

export default function Premium() {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(null);

  const buy = async (pkg) => {
    if (!user) { login(); return; }
    setLoading(pkg);
    try {
      const { data } = await api.post("/payments/checkout", { package_id: pkg, origin_url: window.location.origin });
      window.location.href = data.url;
    } catch (e) {
      toast.error("Checkout failed");
      setLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mono-label">// PREMIUM_TIER</div>
      <h1 className="h-display text-4xl sm:text-5xl text-white mt-2">Unlock <span className="text-neon-pink neon-text-pink">VIP</span></h1>
      <p className="text-white/60 mt-3 max-w-2xl">All games unlocked, VIP badge, exclusive cosmetic themes, 2x daily rewards, and an ad-free experience.</p>

      {user?.premium && (
        <div className="glass p-4 mt-6 border border-neon-pink/50 inline-flex items-center gap-3">
          <Crown className="w-5 h-5 text-neon-pink" />
          <span className="text-white">You are already <b>VIP</b> · expires {user.premium_until ? new Date(user.premium_until).toLocaleDateString() : "—"}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
        {PLANS.map(p => (
          <div key={p.id} className={`glass p-8 relative ${p.best ? "ring-1 ring-neon-pink" : ""}`}
            style={p.best ? { boxShadow: "0 0 28px rgba(255,0,60,0.3)" } : {}}>
            {p.best && <div className="absolute top-0 right-0 bg-neon-pink text-white mono-label px-3 py-1 text-[10px]">BEST VALUE</div>}
            <div className="mono-label text-neon-blue">{p.id.toUpperCase()}</div>
            <div className="h-display text-5xl mt-2 text-white">{p.price}<span className="text-white/40 text-base mono-label ml-1">{p.period}</span></div>
            <ul className="mt-6 space-y-2">
              {p.perks.map(perk => (
                <li key={perk} className="flex items-center gap-2 text-white/80 text-sm">
                  <Check className="w-4 h-4 text-neon-green" /> {perk}
                </li>
              ))}
            </ul>
            <button data-testid={`buy-${p.id}`} onClick={() => buy(p.id)} disabled={loading === p.id} className="btn-pink w-full mt-6">
              {loading === p.id ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing</> : <><Crown className="w-4 h-4" /> Get {p.title}</>}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, Wand2, BookOpen, Image, Box, Youtube } from "lucide-react";
import api from "../lib/api";
import { useSound } from "../context/SoundContext";

const TOOLS = [
  { id: "username", name: "AI Username Generator", desc: "Iconic gamer names. Cyberpunk + pixel vibes.", icon: Wand2, color: "#00f0ff", placeholder: "e.g. shadow ninja with neon vibes" },
  { id: "story", name: "AI Story Generator", desc: "Cinematic mini-fiction in your world.", icon: BookOpen, color: "#ff003c", placeholder: "e.g. a hacker enters a forbidden Minecraft realm" },
  { id: "thumbnail", name: "AI Thumbnail Ideas", desc: "High-CTR thumbnails for YouTube/Twitch.", icon: Image, color: "#39ff14", placeholder: "e.g. epic Minecraft survival series" },
  { id: "minecraft", name: "AI Minecraft Build Ideas", desc: "Genius blocks you have not built.", icon: Box, color: "#fcee0a", placeholder: "e.g. floating sky castle, redstone city" },
  { id: "video_title", name: "AI Video Title Generator", desc: "Titles people actually click.", icon: Youtube, color: "#ff003c", placeholder: "e.g. speedrun world record attempt" },
];

export default function AITools() {
  const [active, setActive] = useState(TOOLS[0]);
  const [prompt, setPrompt] = useState("");
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);
  const { playClick } = useSound();

  const generate = async () => {
    setLoading(true); setOut("");
    try {
      const { data } = await api.post("/ai/generate", { tool: active.id, prompt });
      setOut(data.text);
    } catch (e) {
      toast.error("Generation failed. Try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mono-label">// AI_TOOLS · GPT-5.2</div>
      <h1 className="h-display text-4xl sm:text-5xl text-white mt-2">Creator <span className="text-neon-pink neon-text-pink">AI</span> arsenal</h1>
      <p className="text-white/60 mt-3 max-w-xl">Five GPT-5.2 powered generators for content, builds, and identities. Login gets +5 XP per call.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
        <div className="md:col-span-1 flex flex-col gap-3">
          {TOOLS.map(t => {
            const Icon = t.icon;
            const isA = active.id === t.id;
            return (
              <button key={t.id} data-testid={`ai-tool-${t.id}`} onClick={() => { playClick(); setActive(t); setOut(""); }}
                className={`glass p-4 text-left transition-all ${isA ? "ring-1" : "hover:bg-black/70"}`}
                style={isA ? { boxShadow: `0 0 0 1px ${t.color}, 0 0 18px ${t.color}55` } : {}}>
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" style={{ color: t.color }} />
                  <div>
                    <div className="font-heading font-bold text-white text-sm">{t.name}</div>
                    <div className="text-white/50 text-xs">{t.desc}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="md:col-span-2 glass p-6">
          <div className="mono-label" style={{ color: active.color }}>// {active.id.toUpperCase()}</div>
          <h2 className="font-heading text-2xl text-white mt-2">{active.name}</h2>
          <textarea
            data-testid="ai-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={active.placeholder}
            className="w-full mt-4 bg-black/40 border border-white/10 p-3 text-white font-mono text-sm min-h-[100px] focus:border-neon-blue outline-none"
          />
          <button data-testid="ai-generate-btn" onClick={generate} disabled={loading} className="btn-neon mt-4">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Wand2 className="w-4 h-4" /> Generate</>}
          </button>
          {out && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 bg-black/60 border border-neon-blue/30">
              <div className="mono-label mb-2 text-neon-blue">// OUTPUT</div>
              <pre data-testid="ai-output" className="text-white/90 text-sm whitespace-pre-wrap font-mono leading-relaxed">{out}</pre>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

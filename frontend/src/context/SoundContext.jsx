import React, { createContext, useContext, useRef, useState, useCallback } from "react";

const SoundContext = createContext(null);

// Lightweight Web Audio synth — avoids loading external audio files.
export const SoundProvider = ({ children }) => {
  const [muted, setMuted] = useState(() => localStorage.getItem("muted") === "1");
  const ctxRef = useRef(null);

  const getCtx = () => {
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) ctxRef.current = new Ctx();
    }
    return ctxRef.current;
  };

  const beep = useCallback((freq = 880, dur = 0.06, type = "square", vol = 0.05) => {
    if (muted) return;
    const ctx = getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }, [muted]);

  const playClick = useCallback(() => beep(1200, 0.04, "square", 0.03), [beep]);
  const playHover = useCallback(() => beep(2000, 0.02, "sine", 0.015), [beep]);
  const playWin = useCallback(() => {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.1, "triangle", 0.05), i * 80));
  }, [beep]);
  const playLose = useCallback(() => beep(120, 0.25, "sawtooth", 0.06), [beep]);
  const playCoin = useCallback(() => {
    beep(1568, 0.05, "square", 0.04);
    setTimeout(() => beep(2093, 0.08, "square", 0.04), 50);
  }, [beep]);

  const toggleMute = () => {
    setMuted((m) => {
      const nv = !m;
      localStorage.setItem("muted", nv ? "1" : "0");
      return nv;
    });
  };

  return (
    <SoundContext.Provider value={{ muted, toggleMute, playClick, playHover, playWin, playLose, playCoin }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => useContext(SoundContext);

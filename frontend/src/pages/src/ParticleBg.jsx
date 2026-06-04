import React from "react";
import { Particles, ParticlesProvider, useParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

const initFn = async (engine) => { await loadSlim(engine); };

function ParticleInner() {
  const { loaded } = useParticlesProvider();
  if (!loaded) return null;
  return (
    <Particles
      id="tsparticles"
      className="fixed inset-0 -z-10"
      options={{
        background: { color: "#050505" },
        fpsLimit: 60,
        particles: {
          number: { value: 50, density: { enable: true, area: 900 } },
          color: { value: ["#00f0ff", "#ff003c", "#39ff14"] },
          shape: { type: "square" },
          opacity: { value: 0.4 },
          size: { value: { min: 1, max: 3 } },
          move: { enable: true, speed: 0.6, direction: "top", outModes: { default: "out" } },
          links: { enable: true, color: "#00f0ff", opacity: 0.12, distance: 130 },
        },
        detectRetina: true,
      }}
    />
  );
}

export default function ParticleBg() {
  return (
    <ParticlesProvider init={initFn}>
      <ParticleInner />
    </ParticlesProvider>
  );
}

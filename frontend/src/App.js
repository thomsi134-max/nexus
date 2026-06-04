import React, { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { SoundProvider } from "@/context/SoundContext";
import CustomCursor from "@/components/CustomCursor";
import ParticleBg from "@/components/ParticleBg";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Arcade from "@/pages/Arcade";
import AITools from "@/pages/AITools";
import Leaderboard from "@/pages/Leaderboard";
import Premium from "@/pages/Premium";
import Profile from "@/pages/Profile";
import Download from "@/pages/Download";
import AuthCallback from "@/pages/AuthCallback";
import PaymentSuccess from "@/pages/PaymentSuccess";
import GamePlay from "@/pages/GamePlay";

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -8 },
};

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} initial="initial" animate="in" exit="out" variants={pageVariants} transition={{ duration: 0.3 }}>
        <Routes location={location}>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/arcade" element={<Arcade />} />
          <Route path="/arcade/:gameId" element={<GamePlay />} />
          <Route path="/ai-tools" element={<AITools />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/download" element={<Download />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function AppShell() {
  const location = useLocation();
  // Synchronous check: handle auth callback hash before any other rendering.
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <>
      <ParticleBg />
      <div className="grid-bg fixed inset-0 -z-10 opacity-40" />
      <CustomCursor />
      <Header />
      <main className="relative min-h-[calc(100vh-4rem)]">
        <AnimatedRoutes />
      </main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <SoundProvider>
            <AppShell />
            <Toaster theme="dark" position="top-right" toastOptions={{ style: { background: "#0a0a0a", border: "1px solid #00f0ff33", color: "#fff" } }} />
          </SoundProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;

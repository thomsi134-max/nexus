import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash;
    const match = hash.match(/session_id=([^&]+)/);
    if (!match) {
      navigate("/", { replace: true });
      return;
    }
    const sessionId = match[1];
    (async () => {
      try {
        const { data } = await api.post("/auth/session", null, {
          headers: { "X-Session-ID": sessionId },
        });
        setUser(data);
        navigate("/dashboard", { replace: true, state: { user: data } });
      } catch (e) {
        navigate("/", { replace: true });
      }
    })();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center">
        <div className="mono-label mb-2">SYNCING NEURAL LINK</div>
        <div className="font-heading text-3xl neon-text">Authenticating...</div>
      </div>
    </div>
  );
}

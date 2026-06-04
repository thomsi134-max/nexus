import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Loader2, CheckCircle, XCircle, Crown } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState("checking");
  const [info, setInfo] = useState(null);
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!sessionId) { setStatus("error"); return; }
    let cancelled = false;
    const poll = async () => {
      if (cancelled) return;
      attemptsRef.current += 1;
      try {
        const { data } = await api.get(`/payments/status/${sessionId}`);
        setInfo(data);
        if (data.payment_status === "paid") {
          setStatus("paid");
          await refresh();
          return;
        }
        if (data.status === "expired") { setStatus("expired"); return; }
        if (attemptsRef.current >= 8) { setStatus("timeout"); return; }
        setTimeout(poll, 2000);
      } catch (e) {
        if (attemptsRef.current >= 8) setStatus("error");
        else setTimeout(poll, 2000);
      }
    };
    poll();
    return () => { cancelled = true; };
  }, [sessionId, refresh]);

  return (
    <div className="grid place-items-center min-h-[70vh] px-4">
      <div className="glass p-10 max-w-md text-center">
        {status === "checking" && <><Loader2 className="w-12 h-12 text-neon-blue animate-spin mx-auto" /><div className="font-heading text-2xl text-white mt-4">Verifying...</div></>}
        {status === "paid" && <>
          <CheckCircle className="w-16 h-16 text-neon-green mx-auto" />
          <div className="font-heading text-3xl text-white mt-4 flex items-center gap-2 justify-center">VIP <Crown className="text-neon-pink" /></div>
          <div className="text-white/60 mt-2">${info?.amount} {info?.currency?.toUpperCase()} charged. Premium activated.</div>
          <Link to="/dashboard" className="btn-neon mt-6">Enter Dashboard</Link>
        </>}
        {(status === "expired" || status === "error" || status === "timeout") && <>
          <XCircle className="w-12 h-12 text-neon-pink mx-auto" />
          <div className="font-heading text-2xl text-white mt-4">Something went wrong</div>
          <Link to="/premium" className="btn-ghost mt-6">Try again</Link>
        </>}
      </div>
    </div>
  );
}

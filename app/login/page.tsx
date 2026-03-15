"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  async function handleLogin() {
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

        /* ── ANIMATED MOVING GRADIENT ── */
        @keyframes gradientMove {
          0% { background-position: 0% 0%; }
          25% { background-position: 100% 0%; }
          50% { background-position: 100% 100%; }
          75% { background-position: 0% 100%; }
          100% { background-position: 0% 0%; }
        }
        .animated-bg {
          background:
            radial-gradient(ellipse at 20% 50%, rgba(34,197,94,0.12) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(16,185,129,0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 60% 80%, rgba(5,150,105,0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 40% 30%, rgba(34,197,94,0.06) 0%, transparent 50%),
            linear-gradient(135deg, #030712 0%, #0a0f1a 25%, #071210 50%, #0a0f1a 75%, #030712 100%);
          background-size: 400% 400%;
          animation: gradientMove 15s ease infinite;
        }

        /* ── PULSING GLOW BUTTON ── */
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(34,197,94,0.3), 0 0 40px rgba(34,197,94,0.15), 0 0 60px rgba(34,197,94,0.05); }
          50% { box-shadow: 0 0 30px rgba(34,197,94,0.5), 0 0 60px rgba(34,197,94,0.25), 0 0 90px rgba(34,197,94,0.1); }
        }
        @keyframes borderGlow {
          0%, 100% { border-color: rgba(34,197,94,0.4); }
          50% { border-color: rgba(34,197,94,0.8); }
        }
        @keyframes shimmerSweep {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }
        .glow-btn {
          animation: pulseGlow 2.5s ease-in-out infinite, borderGlow 2.5s ease-in-out infinite;
          border: 1.5px solid rgba(34,197,94,0.4) !important;
          position: relative;
          overflow: hidden;
        }
        .glow-btn::before {
          content: '';
          position: absolute;
          top: -50%; left: -50%;
          width: 200%; height: 200%;
          background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 55%, transparent 60%);
          animation: shimmerSweep 3s ease-in-out infinite;
        }
        .glow-btn:hover:not(:disabled) {
          transform: translateY(-3px) !important;
          animation: pulseGlowHover 1.5s ease-in-out infinite, borderGlow 1.5s ease-in-out infinite;
        }
        @keyframes pulseGlowHover {
          0%, 100% { box-shadow: 0 0 30px rgba(34,197,94,0.5), 0 0 60px rgba(34,197,94,0.3), 0 0 100px rgba(34,197,94,0.15); }
          50% { box-shadow: 0 0 40px rgba(34,197,94,0.6), 0 0 80px rgba(34,197,94,0.35), 0 0 120px rgba(34,197,94,0.2); }
        }
        .glow-btn:disabled { animation: none !important; box-shadow: none !important; border-color: transparent !important; }
        .glow-btn:disabled::before { display: none; }

        @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-40px) scale(1.05)} 66%{transform:translate(-20px,20px) scale(0.95)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-40px,30px) scale(1.1)} 66%{transform:translate(25px,-25px) scale(0.9)} }
        @keyframes float3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-30px)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }

        .login-page * { font-family: 'Outfit', sans-serif; }
        .login-input { transition: all 0.3s cubic-bezier(0.4,0,0.2,1); }
        .login-input:focus-within { border-color: #22c55e !important; box-shadow: 0 0 0 3px rgba(34,197,94,0.1), 0 1px 2px rgba(0,0,0,0.2); transform: translateY(-1px); }
      `}</style>

      <main className="login-page animated-bg min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-10">

        {/* Animated background orbs */}
        <div style={{ position: "absolute", top: "15%", right: "20%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)", animation: "float1 20s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "10%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)", animation: "float2 25s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "60%", right: "50%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.04) 0%, transparent 70%)", animation: "float3 15s ease-in-out infinite", pointerEvents: "none" }} />

        {/* Grid pattern */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(34,197,94,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.03) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        {/* Card */}
        <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 440, animation: mounted ? "slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards" : "none", opacity: mounted ? 1 : 0 }}>

          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 32, animation: mounted ? "fadeIn 0.5s ease 0.2s both" : "none" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg, #22c55e, #10b981)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(34,197,94,0.3)", fontSize: 20 }}>📚</div>
              <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", background: "linear-gradient(135deg, #22c55e, #10b981, #059669)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ICONNECT</span>
            </div>
          </div>

          {/* Glass card */}
          <div style={{ background: "linear-gradient(145deg, rgba(15,23,42,0.8), rgba(15,23,42,0.6))", backdropFilter: "blur(20px) saturate(1.5)", border: "1px solid rgba(34,197,94,0.1)", borderRadius: 24, padding: "40px 32px", boxShadow: "0 25px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset" }}>

            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "#f0fdf4", letterSpacing: "-0.02em", marginBottom: 8 }}>Welcome Back</h1>
              <p style={{ color: "#6b7280", fontSize: 14, fontWeight: 400, lineHeight: 1.5 }}>Sign in to continue studying smarter</p>
            </div>

            {/* Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

              {/* Email */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>Email Address</label>
                <div className="login-input" style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(0,0,0,0.3)", border: "1.5px solid rgba(75,85,99,0.4)", borderRadius: 14, padding: "0 16px", height: 52 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 4l-10 8L2 4" /></svg>
                  <input type="email" placeholder="you@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#e5e7eb", fontSize: 15, fontFamily: "'Outfit', sans-serif" }} />
                </div>
              </div>

              {/* Password */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.05em", textTransform: "uppercase" }}>Password</label>
                  <Link href="/forgot-password" style={{ fontSize: 12, color: "#22c55e", textDecoration: "none", fontWeight: 500, transition: "opacity 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>Forgot password?</Link>
                </div>
                <div className="login-input" style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(0,0,0,0.3)", border: "1.5px solid rgba(75,85,99,0.4)", borderRadius: 14, padding: "0 16px", height: 52 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                  <input type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#e5e7eb", fontSize: 15, fontFamily: "'Outfit', sans-serif" }} />
                  <button onClick={() => setShowPassword(!showPassword)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: 4, display: "flex" }}>
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {errorMessage && (
                <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>⚠️</span>
                  <p style={{ color: "#fca5a5", fontSize: 13, fontWeight: 500 }}>{errorMessage}</p>
                </div>
              )}

              {/* ── GLOWING SIGN IN BUTTON ── */}
              <button
                onClick={handleLogin}
                disabled={loading}
                className={loading ? "" : "glow-btn"}
                style={{
                  width: "100%", height: 52, borderRadius: 14,
                  background: loading ? "rgba(75,85,99,0.4)" : "linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)",
                  color: "#fff", fontSize: 15, fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  letterSpacing: "0.01em", marginTop: 4,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  fontFamily: "'Outfit', sans-serif",
                  transition: "transform 0.3s",
                }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" /><path d="M12 2a10 10 0 019.95 9" stroke="#fff" strokeWidth="3" strokeLinecap="round" /></svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </>
                )}
              </button>
            </div>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "28px 0" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(75,85,99,0.3)" }} />
              <span style={{ color: "#6b7280", fontSize: 12, fontWeight: 500 }}>or</span>
              <div style={{ flex: 1, height: 1, background: "rgba(75,85,99,0.3)" }} />
            </div>

            {/* Signup link */}
            <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
              Don&apos;t have an account?{" "}
              <Link href="/signup" style={{ color: "#22c55e", fontWeight: 600, textDecoration: "none", borderBottom: "1px solid transparent", transition: "border-color 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderBottomColor = "#22c55e")}
                onMouseLeave={(e) => (e.currentTarget.style.borderBottomColor = "transparent")}>
                Create account
              </Link>
            </p>
          </div>

          <p style={{ textAlign: "center", color: "#4b5563", fontSize: 11, marginTop: 20, lineHeight: 1.6 }}>Secure login powered by Supabase Auth</p>
        </div>
      </main>
    </>
  );
}
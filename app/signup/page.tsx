"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const strength =
    password.length === 0 ? 0 :
    password.length < 6 ? 1 :
    password.length < 8 ? 2 :
    /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3;

  const strengthMeta = [
    { label: "", color: "transparent", bg: "transparent" },
    { label: "Weak", color: "#f87171", bg: "rgba(248,113,113,0.15)" },
    { label: "Fair", color: "#fbbf24", bg: "rgba(251,191,36,0.15)" },
    { label: "Good", color: "#34d399", bg: "rgba(52,211,153,0.15)" },
    { label: "Strong", color: "#10b981", bg: "rgba(16,185,129,0.2)" },
  ][strength];

  async function handleSignup() {
    setErrorMessage("");
    if (!email || !password || !confirmPassword) { setErrorMessage("Please fill in all fields."); return; }
    if (password.length < 8) { setErrorMessage("Password must be at least 8 characters."); return; }
    if (password !== confirmPassword) { setErrorMessage("Passwords do not match."); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) { setErrorMessage(error.message); }
    else { alert("Account created successfully!"); router.push("/onboarding"); }
  }

  const features = [
    { icon: "✦", text: "AI-powered study recommendations" },
    { icon: "✦", text: "Personalized learning paths" },
    { icon: "✦", text: "Scholarly article search" },
    { icon: "✦", text: "Connect with study partners" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        @keyframes meshMove {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes orb1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%     { transform: translate(60px,-80px) scale(1.15); }
          66%     { transform: translate(-40px,50px) scale(0.9); }
        }
        @keyframes orb2 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%     { transform: translate(-70px,60px) scale(1.2); }
          80%     { transform: translate(50px,-40px) scale(0.85); }
        }
        @keyframes orb3 {
          0%,100% { transform: translate(0,0); }
          50%     { transform: translate(40px,-60px); }
        }
        @keyframes reveal {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideRight {
          from { opacity: 0; transform: translateX(-16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes tickIn {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        @keyframes barGrow {
          from { width: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0%   { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }

        .sg-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          display: flex;
          background: #06090f;
          position: relative;
          overflow: hidden;
        }

        /* ── Moving gradient mesh ── */
        .sg-mesh {
          position: fixed;
          inset: -50%;
          width: 200%;
          height: 200%;
          background: 
            radial-gradient(ellipse 80% 60% at 20% 30%, rgba(52,211,153,0.22) 0%, transparent 55%),
            radial-gradient(ellipse 70% 50% at 80% 70%, rgba(16,185,129,0.18) 0%, transparent 50%),
            radial-gradient(ellipse 60% 80% at 60% 10%, rgba(6,182,212,0.10) 0%, transparent 50%),
            radial-gradient(ellipse 90% 40% at 10% 80%, rgba(52,211,153,0.12) 0%, transparent 55%);
          background-size: 400% 400%;
          animation: meshMove 10s ease infinite;
          pointer-events: none;
          z-index: 0;
        }

        /* Noise overlay for texture */
        .sg-noise {
          position: fixed; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none; z-index: 1; opacity: 0.5;
        }

        /* Grid lines */
        .sg-grid {
          position: fixed; inset: 0;
          background-image:
            linear-gradient(rgba(52,211,153,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(52,211,153,0.04) 1px, transparent 1px);
          background-size: 52px 52px;
          pointer-events: none; z-index: 1;
        }

        /* ── Left panel ── */
        .sg-left {
          display: none;
          width: 44%;
          min-height: 100vh;
          padding: 48px 52px;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          z-index: 10;
          border-right: 1px solid rgba(52,211,153,0.1);
        }
        @media (min-width: 900px) {
          .sg-left { display: flex; }
        }

        /* ── Right panel ── */
        .sg-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          position: relative;
          z-index: 10;
        }

        .sg-card {
          width: 100%;
          max-width: 420px;
          opacity: 0;
        }
        .sg-card.mounted {
          animation: reveal 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s forwards;
        }

        .sg-glass {
          background: linear-gradient(160deg, rgba(12,18,30,0.96), rgba(8,13,22,0.98));
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 36px 32px;
          box-shadow:
            0 32px 80px rgba(0,0,0,0.7),
            0 0 0 1px rgba(52,211,153,0.05) inset,
            0 1px 0 rgba(255,255,255,0.06) inset;
          backdrop-filter: blur(32px);
        }

        .sg-heading { font-family: 'Syne', sans-serif; }
        .sg-label {
          font-family: 'Syne', sans-serif;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: rgba(148,163,184,0.65);
          display: block; margin-bottom: 7px;
        }

        .sg-field {
          display: flex; align-items: center; gap: 12;
          background: rgba(255,255,255,0.03);
          border: 1.5px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 0 16px; height: 54px;
          transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
          position: relative;
        }
        .sg-field.focused {
          border-color: rgba(52,211,153,0.55);
          background: rgba(52,211,153,0.04);
          box-shadow: 0 0 0 3px rgba(52,211,153,0.09), 0 2px 12px rgba(0,0,0,0.35);
          transform: translateY(-1px);
        }
        .sg-field.match {
          border-color: rgba(52,211,153,0.45);
          background: rgba(52,211,153,0.03);
        }
        .sg-field.mismatch {
          border-color: rgba(248,113,113,0.4);
          background: rgba(248,113,113,0.03);
        }
        .sg-input {
          flex: 1; background: transparent; border: none; outline: none;
          color: #f1f5f9; font-size: 15px;
          font-family: 'DM Sans', sans-serif; font-weight: 400;
        }
        .sg-input::placeholder { color: rgba(100,116,139,0.5); }

        .sg-eye {
          background: none; border: none; cursor: pointer; padding: 4px;
          color: rgba(100,116,139,0.5); display: flex; align-items: center;
          transition: color 0.2s;
        }
        .sg-eye:hover { color: #94a3b8; }

        .sg-btn {
          width: 100%; height: 54px; border-radius: 14px; border: none;
          font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700;
          letter-spacing: 0.03em; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
          position: relative; overflow: hidden;
        }
        .sg-btn .shimmer {
          position: absolute; top: 0; left: 0; bottom: 0; width: 40%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          animation: shimmer 2.5s ease infinite;
        }
        .sg-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 16px 48px rgba(52,211,153,0.3), 0 4px 16px rgba(0,0,0,0.4);
        }
        .sg-btn:active:not(:disabled) { transform: translateY(0); }

        .feat-row {
          display: flex; align-items: center; gap: 12px;
          opacity: 0;
          animation: slideRight 0.5s cubic-bezier(0.16,1,0.3,1) forwards;
        }

        .seg { flex: 1; height: 3px; border-radius: 2px; background: rgba(255,255,255,0.06); overflow: hidden; }
        .seg-fill { height: 100%; border-radius: 2px; animation: barGrow 0.4s cubic-bezier(0.4,0,0.2,1); }

        .badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 2px 9px; border-radius: 20px; font-size: 11px; font-weight: 700;
          font-family: 'Syne', sans-serif;
          animation: tickIn 0.3s cubic-bezier(0.16,1,0.3,1);
        }
      `}</style>

      <div className="sg-root">
        {/* Animated gradient mesh */}
        <div className="sg-mesh" />
        <div className="sg-noise" />
        <div className="sg-grid" />

        {/* ── LEFT PANEL ── */}
        <div className="sg-left">
          {/* Decorative rings */}
          <div style={{ position:"absolute", top:-100, right:-100, width:360, height:360, borderRadius:"50%", border:"1px solid rgba(52,211,153,0.08)", animation:"orb1 28s ease-in-out infinite", pointerEvents:"none" }} />
          <div style={{ position:"absolute", top:-30, right:-30, width:200, height:200, borderRadius:"50%", border:"1px solid rgba(52,211,153,0.12)", animation:"orb1 18s ease-in-out infinite reverse", pointerEvents:"none" }} />
          <div style={{ position:"absolute", bottom:40, left:-80, width:280, height:280, borderRadius:"50%", background:"radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)", animation:"orb2 24s ease-in-out infinite", pointerEvents:"none" }} />

          {/* Top: logo + copy */}
          <div style={{ position:"relative", zIndex:2 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:64 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:"linear-gradient(135deg,#34d399,#10b981)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, boxShadow:"0 4px 20px rgba(52,211,153,0.35)" }}>📚</div>
              <span className="sg-heading" style={{ fontSize:20, fontWeight:800, letterSpacing:"-0.01em", background:"linear-gradient(135deg,#34d399,#6ee7b7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>ICONNECT</span>
            </div>

            <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.14em", color:"#34d399", marginBottom:16, textTransform:"uppercase", fontFamily:"'Syne',sans-serif" }}>Study smarter. Not harder.</p>
            <h2 className="sg-heading" style={{ fontSize:40, fontWeight:800, lineHeight:1.1, letterSpacing:"-0.03em", color:"#f0fdf4", marginBottom:20 }}>
              Your AI-powered<br />
              <span style={{ background:"linear-gradient(135deg,#34d399,#6ee7b7,#a7f3d0)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>study companion.</span>
            </h2>
            <p style={{ fontSize:14, color:"rgba(148,163,184,0.75)", lineHeight:1.75, fontWeight:300, marginBottom:36 }}>
              Join students studying smarter with personalized AI recommendations and real scholarly resources.
            </p>

            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {features.map((f, i) => (
                <div key={i} className="feat-row" style={{ animationDelay:`${0.5 + i * 0.1}s` }}>
                  <div style={{ width:32, height:32, borderRadius:8, flexShrink:0, background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.2)", display:"flex", alignItems:"center", justifyContent:"center", color:"#34d399", fontSize:12, fontWeight:700 }}>{f.icon}</div>
                  <span style={{ fontSize:14, color:"rgba(203,213,225,0.85)" }}>{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom: quote */}
          <div style={{ position:"relative", zIndex:2, borderTop:"1px solid rgba(52,211,153,0.08)", paddingTop:24 }}>
            <p style={{ fontSize:13, color:"rgba(100,116,139,0.7)", fontStyle:"italic", lineHeight:1.65 }}>"The beautiful thing about learning is nobody can take it away from you."</p>
            <p className="sg-heading" style={{ fontSize:10, color:"rgba(100,116,139,0.45)", marginTop:6, letterSpacing:"0.06em", textTransform:"uppercase" }}>— B.B. King</p>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="sg-right">
          <div className={`sg-card ${mounted ? "mounted" : ""}`}>

            {/* Logo (always visible on mobile) */}
            <div style={{ textAlign:"center", marginBottom:28 }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:9, background:"linear-gradient(135deg,#34d399,#10b981)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, boxShadow:"0 4px 16px rgba(52,211,153,0.3)" }}>📚</div>
                <span className="sg-heading" style={{ fontSize:19, fontWeight:800, letterSpacing:"-0.01em", background:"linear-gradient(135deg,#34d399,#6ee7b7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>ICONNECT</span>
              </div>
            </div>

            {/* Glass card */}
            <div className="sg-glass">
              <div style={{ marginBottom:24 }}>
                <h1 className="sg-heading" style={{ fontSize:25, fontWeight:800, color:"#f8fafc", letterSpacing:"-0.02em", marginBottom:6 }}>Create your account</h1>
                <p style={{ fontSize:14, color:"rgba(148,163,184,0.65)", fontWeight:300, lineHeight:1.5 }}>Start your personalized learning journey</p>
              </div>

              {/* Accent line */}
              <div style={{ height:2, borderRadius:1, marginBottom:26, background:"linear-gradient(90deg,#34d399,#10b981,transparent)", opacity:0.5 }} />

              <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

                {/* Email */}
                <div>
                  <label className="sg-label">Email Address</label>
                  <div className={`sg-field ${focusedField === "email" ? "focused" : ""}`} style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(148,163,184,0.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 4l-10 8L2 4"/></svg>
                    <input className="sg-input" type="email" placeholder="you@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField(null)} />
                    {email.includes("@") && <span style={{ color:"#34d399", fontSize:14, animation:"tickIn 0.3s ease", flexShrink:0 }}>✓</span>}
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="sg-label">Password</label>
                  <div className={`sg-field ${focusedField === "password" ? "focused" : ""}`} style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(148,163,184,0.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    <input className="sg-input" type={showPassword ? "text" : "password"} placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setFocusedField("password")} onBlur={() => setFocusedField(null)} />
                    <button className="sg-eye" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword
                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div style={{ marginTop:10 }}>
                      <div style={{ display:"flex", gap:4, marginBottom:7 }}>
                        {[1,2,3,4].map((i) => (
                          <div key={i} className="seg">
                            {strength >= i && <div className="seg-fill" style={{ background:strengthMeta.color, width:"100%" }} />}
                          </div>
                        ))}
                      </div>
                      <span className="badge" style={{ background:strengthMeta.bg, color:strengthMeta.color, border:`1px solid ${strengthMeta.color}28` }}>{strengthMeta.label}</span>
                      {strength < 3 && <span style={{ fontSize:11, color:"rgba(100,116,139,0.55)", marginLeft:8 }}>Add uppercase & numbers</span>}
                    </div>
                  )}
                </div>

                {/* Confirm */}
                <div>
                  <label className="sg-label">Confirm Password</label>
                  <div className={`sg-field ${focusedField === "confirm" ? "focused" : ""} ${confirmPassword && confirmPassword === password ? "match" : ""} ${confirmPassword && confirmPassword !== password ? "mismatch" : ""}`} style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(148,163,184,0.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    <input className="sg-input" type={showConfirm ? "text" : "password"} placeholder="Re-enter your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onFocus={() => setFocusedField("confirm")} onBlur={() => setFocusedField(null)} onKeyDown={(e) => e.key === "Enter" && handleSignup()} />
                    <button className="sg-eye" onClick={() => setShowConfirm(!showConfirm)}>
                      {showConfirm
                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                    </button>
                    {confirmPassword && (
                      <span className="badge" style={{
                        background: confirmPassword === password ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)",
                        color: confirmPassword === password ? "#34d399" : "#f87171",
                        border: `1px solid ${confirmPassword === password ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)"}`,
                      }}>{confirmPassword === password ? "✓" : "✗"}</span>
                    )}
                  </div>
                </div>

                {/* Error */}
                {errorMessage && (
                  <div style={{ background:"rgba(248,113,113,0.06)", border:"1px solid rgba(248,113,113,0.18)", borderRadius:12, padding:"11px 14px", display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:20, height:20, borderRadius:"50%", background:"rgba(248,113,113,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, flexShrink:0 }}>⚠</div>
                    <p style={{ color:"#fca5a5", fontSize:13, fontWeight:500 }}>{errorMessage}</p>
                  </div>
                )}

                {/* Button */}
                <button onClick={handleSignup} disabled={loading} className="sg-btn" style={{
                  marginTop:4,
                  background: loading ? "rgba(30,41,59,0.8)" : "linear-gradient(135deg,#34d399 0%,#10b981 50%,#059669 100%)",
                  color: loading ? "rgba(148,163,184,0.4)" : "#fff",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : "0 4px 24px rgba(52,211,153,0.25)",
                }}>
                  {!loading && <span className="shimmer" />}
                  {loading ? (
                    <>
                      <svg style={{ animation:"spin 1s linear infinite" }} width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="rgba(148,163,184,0.25)" strokeWidth="3"/>
                        <path d="M12 2a10 10 0 019.95 9" stroke="rgba(148,163,184,0.7)" strokeWidth="3" strokeLinecap="round"/>
                      </svg>
                      Creating account…
                    </>
                  ) : (
                    <>Get Started <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
                  )}
                </button>
              </div>

              {/* Divider */}
              <div style={{ display:"flex", alignItems:"center", gap:14, margin:"22px 0" }}>
                <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.06)" }} />
                <span className="sg-heading" style={{ fontSize:11, color:"rgba(100,116,139,0.55)", fontWeight:600, letterSpacing:"0.06em" }}>OR</span>
                <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.06)" }} />
              </div>

              <p style={{ textAlign:"center", fontSize:14, color:"rgba(100,116,139,0.75)" }}>
                Already have an account?{" "}
                <Link href="/login" style={{ color:"#34d399", fontWeight:600, textDecoration:"none", fontFamily:"'Syne',sans-serif", borderBottom:"1px solid rgba(52,211,153,0.3)", paddingBottom:1, transition:"all 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color="#6ee7b7"; e.currentTarget.style.borderBottomColor="rgba(110,231,183,0.5)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color="#34d399"; e.currentTarget.style.borderBottomColor="rgba(52,211,153,0.3)"; }}>
                  Sign in →
                </Link>
              </p>
            </div>

            <p style={{ textAlign:"center", fontSize:11, color:"rgba(71,85,105,0.6)", marginTop:18, lineHeight:1.6 }}>
              By creating an account you agree to our <span style={{ color:"rgba(100,116,139,0.75)", cursor:"pointer" }}>Terms of Service</span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
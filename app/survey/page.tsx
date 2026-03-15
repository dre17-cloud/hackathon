"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"

const LEARNING_STYLES = ["Visual", "Reading", "Practice", "Auditory", "Mixed"]

const SUBJECT_OPTIONS = [
  "Mathematics", "English", "Biology", "Chemistry", "Physics",
  "Information Technology", "Computer Science", "Data Structures",
  "Operating Systems", "Database Systems", "Accounting", "Economics",
]

export default function Survey() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [school, setSchool] = useState("")
  const [year, setYear] = useState("")
  const [learningStyle, setLearningStyle] = useState("")
  const [subjects, setSubjects] = useState<string[]>([])
  const [customSubject, setCustomSubject] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => { setMounted(true) }, [])

  function toggleSubject(s: string) {
    setSubjects((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }

  async function saveSurvey() {
    setError("")
    if (!school || !year || !learningStyle || subjects.length === 0) {
      setError("Please fill in all fields and select at least one subject.")
      return
    }

    setSaving(true)
    const { data: user } = await supabase.auth.getUser()

    if (!user.user?.id) {
      setError("You must be logged in.")
      setSaving(false)
      return
    }

    let finalSubjects = [...subjects]
    if (customSubject.trim()) {
      customSubject.split(",").forEach((s) => {
        if (s.trim()) finalSubjects.push(s.trim())
      })
    }

    const { error: dbError } = await supabase.from("user_preferences").upsert({
      user_id: user.user.id,
      school: school,
      year: year,
      learning_style: learningStyle,
      subjects: finalSubjects,
    }, { onConflict: "user_id" })

    setSaving(false)

    if (dbError) {
      setError(dbError.message)
      return
    }

    alert("Survey saved!")
    router.push("/dashboard")
  }

  const progress = [school, year, learningStyle, subjects.length > 0].filter(Boolean).length
  const progressPct = (progress / 4) * 100

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -40px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-40px, 30px) scale(1.1); }
          66% { transform: translate(25px, -25px) scale(0.9); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .survey-page * { font-family: 'Outfit', sans-serif; }
        .survey-input {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .survey-input:focus-within {
          border-color: #22c55e !important;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
          transform: translateY(-1px);
        }
        .pill-btn {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .pill-btn:hover {
          transform: translateY(-1px);
        }
        .pill-btn:active {
          transform: translateY(0);
        }
      `}</style>

      <main className="survey-page min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-10"
        style={{ background: "linear-gradient(135deg, #030712 0%, #0a0f1a 40%, #071115 70%, #030712 100%)" }}>

        {/* Background orbs */}
        <div style={{ position: "absolute", top: "5%", right: "20%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)", animation: "float1 20s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "15%", left: "10%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)", animation: "float2 25s ease-in-out infinite", pointerEvents: "none" }} />

        {/* Grid overlay */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(34,197,94,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.03) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <div style={{
          position: "relative", zIndex: 10, width: "100%", maxWidth: 520,
          animation: mounted ? "slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards" : "none",
          opacity: mounted ? 1 : 0,
        }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg, #22c55e, #10b981)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(34,197,94,0.3)", fontSize: 20 }}>📋</div>
              <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", background: "linear-gradient(135deg, #22c55e, #10b981)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ICONNECT</span>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Progress</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#22c55e" }}>{progress}/4 complete</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: "rgba(75,85,99,0.3)", overflow: "hidden" }}>
              <div style={{ width: `${progressPct}%`, height: "100%", borderRadius: 2, background: "linear-gradient(90deg, #22c55e, #10b981)", transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
            </div>
          </div>

          {/* Card */}
          <div style={{
            background: "linear-gradient(145deg, rgba(15,23,42,0.8), rgba(15,23,42,0.6))",
            backdropFilter: "blur(20px) saturate(1.5)",
            border: "1px solid rgba(34,197,94,0.1)",
            borderRadius: 24, padding: "36px 32px",
            boxShadow: "0 25px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset",
          }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "#f0fdf4", letterSpacing: "-0.02em", marginBottom: 8 }}>Learning Survey</h1>
              <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.5 }}>Tell us about yourself so we can personalize your experience</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* School */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>School / University</label>
                <div className="survey-input" style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(0,0,0,0.3)", border: "1.5px solid rgba(75,85,99,0.4)", borderRadius: 14, padding: "0 16px", height: 52 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>
                  <input placeholder="e.g. University of Technology" value={school} onChange={(e) => setSchool(e.target.value)}
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#e5e7eb", fontSize: 15, fontFamily: "'Outfit', sans-serif" }} />
                  {school && <span style={{ color: "#22c55e", fontSize: 16 }}>✓</span>}
                </div>
              </div>

              {/* Year */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>Year / Grade Level</label>
                <div className="survey-input" style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(0,0,0,0.3)", border: "1.5px solid rgba(75,85,99,0.4)", borderRadius: 14, padding: "0 16px", height: 52 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                  <input placeholder="e.g. 2nd Year, Grade 11" value={year} onChange={(e) => setYear(e.target.value)}
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#e5e7eb", fontSize: 15, fontFamily: "'Outfit', sans-serif" }} />
                  {year && <span style={{ color: "#22c55e", fontSize: 16 }}>✓</span>}
                </div>
              </div>

              {/* Learning Style */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 8, letterSpacing: "0.05em", textTransform: "uppercase" }}>Learning Style</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {LEARNING_STYLES.map((s) => (
                    <button key={s} className="pill-btn" onClick={() => setLearningStyle(s)}
                      style={{
                        padding: "10px 18px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer",
                        fontFamily: "'Outfit', sans-serif", border: "1.5px solid",
                        background: learningStyle === s ? "linear-gradient(135deg, #22c55e, #16a34a)" : "rgba(0,0,0,0.3)",
                        borderColor: learningStyle === s ? "#22c55e" : "rgba(75,85,99,0.4)",
                        color: learningStyle === s ? "#fff" : "#9ca3af",
                        boxShadow: learningStyle === s ? "0 4px 15px rgba(34,197,94,0.25)" : "none",
                      }}>
                      {learningStyle === s && "✓ "}{s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subjects */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Subjects
                  {subjects.length > 0 && <span style={{ color: "#22c55e", marginLeft: 8, fontWeight: 700 }}>{subjects.length} selected</span>}
                </label>
                <p style={{ fontSize: 11, color: "#4b5563", marginBottom: 10 }}>Select all that apply — these are used for partner matching</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {SUBJECT_OPTIONS.map((s) => (
                    <button key={s} className="pill-btn" onClick={() => toggleSubject(s)}
                      style={{
                        padding: "8px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                        fontFamily: "'Outfit', sans-serif", border: "1.5px solid",
                        background: subjects.includes(s) ? "rgba(34,197,94,0.15)" : "rgba(0,0,0,0.3)",
                        borderColor: subjects.includes(s) ? "rgba(34,197,94,0.5)" : "rgba(75,85,99,0.3)",
                        color: subjects.includes(s) ? "#4ade80" : "#6b7280",
                      }}>
                      {subjects.includes(s) ? "✓ " : ""}{s}
                    </button>
                  ))}
                </div>
                {/* Custom subjects */}
                <div className="survey-input" style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(0,0,0,0.2)", border: "1.5px solid rgba(75,85,99,0.3)", borderRadius: 14, padding: "0 16px", height: 48, marginTop: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                  <input placeholder="Add custom subjects (comma separated)" value={customSubject} onChange={(e) => setCustomSubject(e.target.value)}
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#e5e7eb", fontSize: 13, fontFamily: "'Outfit', sans-serif" }} />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>⚠️</span>
                  <p style={{ color: "#fca5a5", fontSize: 13, fontWeight: 500 }}>{error}</p>
                </div>
              )}

              {/* Submit */}
              <button onClick={saveSurvey} disabled={saving}
                style={{
                  width: "100%", height: 52, borderRadius: 14, border: "none",
                  background: saving ? "rgba(75,85,99,0.4)" : "linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)",
                  color: "#fff", fontSize: 15, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
                  fontFamily: "'Outfit', sans-serif", marginTop: 4,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "all 0.3s", boxShadow: saving ? "none" : "0 4px 20px rgba(34,197,94,0.2)",
                }}
                onMouseEnter={(e) => { if (!saving) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 40px rgba(34,197,94,0.3)" } }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(34,197,94,0.2)" }}>
                {saving ? (
                  <>
                    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/><path d="M12 2a10 10 0 019.95 9" stroke="#fff" strokeWidth="3" strokeLinecap="round"/></svg>
                    Saving...
                  </>
                ) : (
                  <>
                    Save & Continue
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function Dashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [userId, setUserId] = useState("")
  const [userName, setUserName] = useState("")
  const [notifications, setNotifications] = useState<any[]>([])
  const [aiInsights, setAiInsights] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => { setMounted(true); loadProfile() }, [])

  async function loadProfile() {
    const { data: userData } = await supabase.auth.getUser()
    const uid = userData.user?.id || ""
    const email = userData.user?.email || ""
    setUserId(uid)
    setUserName(email.split("@")[0])

    await supabase.from("profiles").upsert(
      { id: uid, email, display_name: email.split("@")[0], last_seen: new Date().toISOString() },
      { onConflict: "id" }
    ).match(() => {})

    const { data } = await supabase
      .from("user_preferences").select("*").eq("user_id", uid)
      .order("created_at", { ascending: false }).limit(1).maybeSingle()

    setProfile(data)
    if (data) { generateAI(data) }
    else { setAiInsights("Please complete your survey to get AI insights.") }

    loadFriendRequests(uid)
  }

  async function loadFriendRequests(uid: string) {
    const { data } = await supabase.from("friends").select("id, from_user_id, status").eq("friend_id", uid).eq("status", "pending")
    if (!data || data.length === 0) { setNotifications([]); setPendingCount(0); return }

    const fromIds = data.map((r: any) => r.from_user_id)
    const { data: profiles } = await supabase.from("profiles").select("id, email, display_name").in("id", fromIds)
    const { data: prefs } = await supabase.from("user_preferences").select("user_id, subjects").in("user_id", fromIds)

    const nameMap: Record<string, string> = {}
    profiles?.forEach((p: any) => { nameMap[p.id] = p.display_name || p.email?.split("@")[0] || p.id })
    const subMap: Record<string, string[]> = {}
    prefs?.forEach((p: any) => { subMap[p.user_id] = p.subjects || [] })

    setNotifications(data.map((r: any) => ({ id: r.id, from_user_id: r.from_user_id, name: nameMap[r.from_user_id] || r.from_user_id, subjects: subMap[r.from_user_id] || [] })))
    setPendingCount(data.length)
  }

  async function generateAI(profileData: any) {
    setAiLoading(true)
    try {
      const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profileData) })
      if (!res.ok) { setAiInsights(res.status === 429 ? "AI is busy. Refresh in a moment." : "Could not load AI insights."); return }
      const data = await res.json()
      setAiInsights(data.response)
    } catch { setAiInsights("Connection error.") }
    finally { setAiLoading(false) }
  }

  async function acceptPartner(requestId: string, fromUserId: string) {
    await supabase.from("friends").update({ status: "accepted" }).eq("id", requestId)
    await supabase.from("friends").insert({ user_id: userId, from_user_id: userId, friend_id: fromUserId, status: "accepted" })
    setNotifications((prev) => prev.filter((n) => n.id !== requestId))
    setPendingCount((prev) => prev - 1)
  }

  async function declinePartner(requestId: string) {
    await supabase.from("friends").update({ status: "declined" }).eq("id", requestId)
    setNotifications((prev) => prev.filter((n) => n.id !== requestId))
    setPendingCount((prev) => prev - 1)
  }

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  function renderAI(text: string) {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("**") && line.endsWith("**"))
        return <p key={i} style={{ color: "#4ade80", fontWeight: 700, fontSize: 14, marginTop: 16, marginBottom: 4 }}>{line.replace(/\*\*/g, "")}</p>
      if (line.trim() === "") return <div key={i} style={{ height: 6 }} />
      return <p key={i} style={{ color: "#d1d5db", fontSize: 13, lineHeight: 1.7 }}>{line}</p>
    })
  }

  if (!profile) {
    return (
      <main style={{ minHeight: "100vh", background: "linear-gradient(135deg, #030712, #0a0f1a, #071115)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 32, height: 32, border: "3px solid #22c55e", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#6b7280", fontSize: 14, fontFamily: "'Outfit', sans-serif" }}>Loading your dashboard...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </main>
    )
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-40px) scale(1.05)} 66%{transform:translate(-20px,20px) scale(0.95)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-30px,20px)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .dash * { font-family: 'Outfit', sans-serif; }
        .glass {
          background: linear-gradient(145deg, rgba(15,23,42,0.8), rgba(15,23,42,0.5));
          backdrop-filter: blur(16px);
          border: 1px solid rgba(34,197,94,0.08);
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.3);
          transition: all 0.3s ease;
        }
        .glass:hover { border-color: rgba(34,197,94,0.15); transform: translateY(-2px); box-shadow: 0 12px 50px rgba(0,0,0,0.4); }
        .qbtn { transition: all 0.3s; cursor: pointer; text-align: left; }
        .qbtn:hover { transform: translateY(-2px); }
      `}</style>

      <main className="dash" style={{ minHeight: "100vh", position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #030712 0%, #0a0f1a 40%, #071115 70%, #030712 100%)" }}>
        <div style={{ position: "absolute", top: "5%", right: "15%", width: 450, height: 450, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)", animation: "float1 20s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "5%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)", animation: "float2 25s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(34,197,94,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.015) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 20px 60px", position: "relative", zIndex: 10, animation: mounted ? "slideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards" : "none", opacity: mounted ? 1 : 0 }}>

          {/* ═══ Welcome ═══ */}
          <div className="glass" style={{ marginBottom: 20, background: "linear-gradient(145deg, rgba(15,23,42,0.9), rgba(34,197,94,0.05))", borderColor: "rgba(34,197,94,0.12)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
              <div>
                <p style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>{today}</p>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: "#f0fdf4", letterSpacing: "-0.02em", marginTop: 4 }}>{greeting}, {userName} 👋</h1>
                <p style={{ marginTop: 12, fontSize: 13, color: "#4ade80", fontStyle: "italic", borderLeft: "2px solid rgba(34,197,94,0.3)", paddingLeft: 12, lineHeight: 1.6 }}>
                  &quot;Success is the sum of small efforts repeated day in and day out.&quot;
                </p>
              </div>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg, #22c55e, #10b981)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 800, boxShadow: "0 4px 20px rgba(34,197,94,0.25)" }}>
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

          {/* ═══ Quick Actions ═══ */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <button onClick={() => router.push("/social")} className="qbtn" style={{ background: "linear-gradient(145deg, rgba(34,197,94,0.12), rgba(34,197,94,0.04))", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 16, padding: "20px 24px", position: "relative" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>👥</div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#f0fdf4" }}>Social Hub</p>
              <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Discover partners & chat</p>
              {pendingCount > 0 && <span style={{ position: "absolute", top: 12, right: 12, background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{pendingCount}</span>}
            </button>
            <button onClick={() => router.push("/search")} className="qbtn" style={{ background: "linear-gradient(145deg, rgba(59,130,246,0.1), rgba(59,130,246,0.03))", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 16, padding: "20px 24px" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🔍</div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#f0fdf4" }}>Study Search</p>
              <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>AI-powered recommendations</p>
            </button>
          </div>

          {/* ═══ Continue ═══ */}
          {profile.struggling_topics && (
            <div className="glass" style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(250,204,21,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📖</div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "#f0fdf4" }}>Continue Where You Left Off</h2>
              </div>
              <p style={{ color: "#9ca3af", fontSize: 14 }}>Resume studying: <span style={{ color: "#4ade80", fontWeight: 600 }}>{profile.struggling_topics}</span></p>
            </div>
          )}

          {/* ═══ Focus Topics ═══ */}
          {profile.struggling_subjects?.length > 0 && (
            <div className="glass" style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎯</div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "#f0fdf4" }}>Focus Topics</h2>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {profile.struggling_subjects.map((t: string, i: number) => (
                  <span key={i} style={{ padding: "8px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600, background: "rgba(239,68,68,0.08)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.15)" }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* ═══ AI Insights ═══ */}
          <div className="glass" style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(34,197,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "#f0fdf4" }}>AI Study Insights</h2>
              </div>
              {!aiLoading && (
                <button onClick={() => generateAI(profile)} className="qbtn" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: "6px 14px", color: "#4ade80", fontSize: 12, fontWeight: 600 }}>↻ Refresh</button>
              )}
            </div>
            {aiLoading ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 0" }}>
                <div style={{ width: 16, height: 16, border: "2px solid #22c55e", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <p style={{ color: "#6b7280", fontSize: 13 }}>Generating personalized recommendations...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              </div>
            ) : aiInsights ? <div>{renderAI(aiInsights)}</div> : <p style={{ color: "#6b7280", fontSize: 13 }}>No insights available.</p>}
          </div>

          {/* ═══ Notifications ═══ */}
          {notifications.length > 0 && (
            <div className="glass" style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(250,204,21,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🔔</div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "#f0fdf4" }}>Notifications <span style={{ marginLeft: 6, fontSize: 12, background: "#ef4444", color: "#fff", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>{notifications.length}</span></h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {notifications.map((n) => (
                  <div key={n.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(250,204,21,0.04)", border: "1px solid rgba(250,204,21,0.1)", borderRadius: 14, padding: "14px 16px" }}>
                    <div>
                      <p style={{ fontSize: 13, color: "#e5e7eb" }}>Study partner request from <span style={{ color: "#4ade80", fontWeight: 700 }}>{n.name}</span></p>
                      {n.subjects?.length > 0 && (
                        <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                          {n.subjects.slice(0, 3).map((s: string) => <span key={s} style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600, background: "rgba(34,197,94,0.1)", color: "#4ade80" }}>{s}</span>)}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => acceptPartner(n.id, n.from_user_id)} className="qbtn" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", border: "none", borderRadius: 10, padding: "8px 16px", color: "#fff", fontSize: 12, fontWeight: 700 }}>Accept</button>
                      <button onClick={() => declinePartner(n.id)} className="qbtn" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "8px 16px", color: "#fca5a5", fontSize: 12, fontWeight: 700 }}>Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ Your Subjects ═══ */}
          {profile.subjects?.length > 0 && (
            <div className="glass">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📚</div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "#f0fdf4" }}>Your Subjects</h2>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {profile.subjects.map((s: string, i: number) => (
                  <span key={i} style={{ padding: "8px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600, background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.15)" }}>{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
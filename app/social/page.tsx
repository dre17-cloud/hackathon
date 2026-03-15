"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"

// ─── Types ────────────────────────────────────────────────────
interface DbUser {
  user_id: string; display_name: string; email: string; school_name: string
  year_level: string; programme: string; education_level: string; role: string
  subjects: string[]; struggling_subjects: string[]; struggling_topics: string
  learning_styles: string[]; preferred_resources: string[]
  study_time: string; study_goal: string; wants_study_partner: string
  common_subjects: string[]; common_struggling: string[]
  same_school: boolean; same_programme: boolean; match_score: number
  is_online: boolean; last_seen: string
}
interface Message { id: string; sender_id: string; receiver_id: string; content: string; created_at: string }
interface FriendRecord { id: string; from_user_id: string; from_display_name: string; status: string }
type SubTab = "discover" | "partners" | "messages"

export default function SocialPage() {
  const [profile, setProfile] = useState<any>(null)
  const [userId, setUserId] = useState("")
  const [userName, setUserName] = useState("")
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [mounted, setMounted] = useState(false)
  const [subTab, setSubTab] = useState<SubTab>("discover")
  const [allUsers, setAllUsers] = useState<DbUser[]>([])
  const [recommendations, setRecommendations] = useState<DbUser[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<DbUser | null>(null)
  const [friends, setFriends] = useState<string[]>([])
  const [friendProfiles, setFriendProfiles] = useState<Record<string, { display_name: string }>>({})
  const [friendRequests, setFriendRequests] = useState<FriendRecord[]>([])
  const [sentRequests, setSentRequests] = useState<string[]>([])
  const [conversations, setConversations] = useState<Record<string, Message[]>>({})
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [activeChatName, setActiveChatName] = useState("")
  const [msgInput, setMsgInput] = useState("")
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [notification, setNotification] = useState("")
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadFrom, setUnreadFrom] = useState<Set<string>>(new Set())
  const activeChatRef = useRef<string | null>(null)
  const userIdRef = useRef("")

  useEffect(() => { userIdRef.current = userId }, [userId])
  useEffect(() => { activeChatRef.current = activeChat }, [activeChat])
  useEffect(() => { setMounted(true); loadAll() }, [])
  useEffect(() => { if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" }) }, [conversations, activeChat])

  // Heartbeat
  useEffect(() => {
    if (!userId) return
    const update = () => { supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", userId).then(() => {}) }
    update(); const i = setInterval(update, 30000); return () => clearInterval(i)
  }, [userId])

  // Realtime messages — with notifications
  useEffect(() => {
    if (!userId) return
    const ch = supabase.channel(`social-msgs-${userId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload: any) => {
      const msg = payload.new as Message; const myId = userIdRef.current
      if (msg.sender_id !== myId && msg.receiver_id !== myId) return
      const partnerId = msg.sender_id === myId ? msg.receiver_id : msg.sender_id
      setConversations((prev) => { const ex = prev[partnerId] || []; if (ex.some((m) => m.id === msg.id)) return prev; return { ...prev, [partnerId]: [...ex, msg] } })

      // If someone ELSE sent us a message and we're NOT viewing that chat
      if (msg.sender_id !== myId && activeChatRef.current !== partnerId) {
        // Show toast notification
        const senderName = friendProfiles[partnerId]?.display_name || allUsers.find((u) => u.user_id === partnerId)?.display_name || "Someone"
        showNotif(`💬 New message from ${senderName}`)
        // Track unread
        setUnreadCount((c) => c + 1)
        setUnreadFrom((prev) => new Set(prev).add(partnerId))
      }
    }).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [userId, friendProfiles, allUsers])

  // ─── Load All ───────────────────────────────────────────────
  async function loadAll() {
    setLoadError("")
    const { data: ud, error: ae } = await supabase.auth.getUser()
    if (ae || !ud.user) { setLoadError("You must be logged in."); setLoaded(true); return }
    const uid = ud.user.id, email = ud.user.email || ""
    setUserId(uid); userIdRef.current = uid; setUserName(email.split("@")[0])
    await supabase.from("profiles").upsert({ id: uid, email, display_name: email.split("@")[0] }, { onConflict: "id" }).match(() => {})
    const { data, error: pe } = await supabase.from("user_preferences").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(1).maybeSingle()
    if (pe) { setLoadError(`Error: ${pe.message}`); setLoaded(true); return }
    if (!data) { setProfile(null); setLoaded(true); return }
    setProfile(data)
    await Promise.all([loadAllUsers(uid, data), loadFriends(uid), loadFriendRequests(uid), loadSentRequests(uid)]).catch(() => {})
    // Preload conversations for friend list previews
    const { data: friendData } = await supabase.from("friends").select("friend_id").eq("user_id", uid).eq("status", "accepted")
    if (friendData) { await preloadConversations(uid, friendData.map((f: any) => f.friend_id)) }
    setLoaded(true)
  }

  async function loadAllUsers(uid: string, myProfile: any) {
    const { data: usersData } = await supabase.from("user_preferences").select("*").neq("user_id", uid)
    if (!usersData) return
    const ids = usersData.map((u: any) => u.user_id)
    const { data: profiles } = await supabase.from("profiles").select("id, email, display_name, last_seen").in("id", ids)
    const pm: Record<string, any> = {}
    profiles?.forEach((p: any) => { pm[p.id] = { name: p.display_name || p.email?.split("@")[0] || p.id, email: p.email || "", last_seen: p.last_seen || "" } })
    const mySub = (myProfile.subjects || []).map((s: string) => s.trim().toLowerCase())
    const myStr = (myProfile.struggling_subjects || []).map((s: string) => s.trim().toLowerCase())
    const now = Date.now()
    const enriched: DbUser[] = usersData.map((u: any) => {
      const ts = (u.subjects || []).map((s: string) => s.trim().toLowerCase())
      const tst = (u.struggling_subjects || []).map((s: string) => s.trim().toLowerCase())
      const cs = mySub.filter((s: string) => ts.includes(s)), cst = myStr.filter((s: string) => tst.includes(s))
      const ss = (u.school_name || "").trim().toLowerCase() === (myProfile.school_name || "").trim().toLowerCase()
      const sp = (u.programme || "").trim().toLowerCase() === (myProfile.programme || "").trim().toLowerCase()
      let score = cs.length * 3 + cst.length * 2; if (ss) score += 2; if (sp) score += 2
      const csd = (myProfile.subjects || []).filter((s: string) => (u.subjects || []).some((t: string) => t.trim().toLowerCase() === s.trim().toLowerCase()))
      const cstd = (myProfile.struggling_subjects || []).filter((s: string) => (u.struggling_subjects || []).some((t: string) => t.trim().toLowerCase() === s.trim().toLowerCase()))
      const pi = pm[u.user_id]; const ls = pi?.last_seen ? new Date(pi.last_seen).getTime() : 0
      return { user_id: u.user_id, display_name: pi?.name || u.user_id, email: pi?.email || "", school_name: u.school_name || "", year_level: u.year_level || "", programme: u.programme || "", education_level: u.education_level || "", role: u.role || "", subjects: u.subjects || [], struggling_subjects: u.struggling_subjects || [], struggling_topics: u.struggling_topics || "", learning_styles: u.learning_styles || [], preferred_resources: u.preferred_resources || [], study_time: u.study_time || "", study_goal: u.study_goal || "", wants_study_partner: u.wants_study_partner || "", common_subjects: csd, common_struggling: cstd, same_school: ss, same_programme: sp, match_score: score, is_online: now - ls < 120000, last_seen: pi?.last_seen || "" }
    })
    setAllUsers(enriched)
    setRecommendations(enriched.filter((u) => u.match_score > 0 && u.wants_study_partner === "Yes").sort((a, b) => b.match_score - a.match_score))
  }

  // Friends — query BOTH directions (user could be user_id or friend_id)
  async function loadFriends(uid: string) {
    // Get all accepted friendships where this user is involved
    const { data: asUser } = await supabase.from("friends").select("friend_id, from_user_id, user_id").eq("user_id", uid).eq("status", "accepted")
    const { data: asFriend } = await supabase.from("friends").select("friend_id, from_user_id, user_id").eq("friend_id", uid).eq("status", "accepted")

    const allRows = [...(asUser || []), ...(asFriend || [])]
    // Extract the OTHER person's ID from each row
    const ids = [...new Set(allRows.map((r: any) => {
      if (r.user_id === uid) return r.friend_id
      return r.from_user_id || r.user_id
    }).filter((id: string) => id && id !== uid))]

    setFriends(ids)
    if (ids.length) {
      const { data: p } = await supabase.from("profiles").select("id, email, display_name").in("id", ids)
      const m: Record<string, any> = {}
      p?.forEach((x: any) => { m[x.id] = { display_name: x.display_name || x.email?.split("@")[0] || x.id } })
      setFriendProfiles(m)
    }
  }

  async function loadFriendRequests(uid: string) { const { data } = await supabase.from("friends").select("id, from_user_id, status").eq("friend_id", uid).eq("status", "pending"); if (data?.length) { const ids = data.map((r: any) => r.from_user_id); const { data: p } = await supabase.from("profiles").select("id, email, display_name").in("id", ids); const nm: Record<string, string> = {}; p?.forEach((x: any) => { nm[x.id] = x.display_name || x.email?.split("@")[0] || x.id }); setFriendRequests(data.map((r: any) => ({ id: r.id, from_user_id: r.from_user_id, from_display_name: nm[r.from_user_id] || r.from_user_id, status: r.status }))) } }
  async function loadSentRequests(uid: string) { const { data } = await supabase.from("friends").select("friend_id").eq("from_user_id", uid).in("status", ["pending", "accepted"]); if (data) setSentRequests(data.map((r: any) => r.friend_id)) }

  // Send request: user_id = sender, friend_id = target
  async function sendFriendRequest(tid: string) {
    const { error } = await supabase.from("friends").insert({
      user_id: userId,
      from_user_id: userId,
      friend_id: tid,
      status: "pending"
    })
    if (!error) { setSentRequests((p) => [...p, tid]); showNotif("Partner request sent!") }
  }

  // Accept: update the original row to accepted, create a reverse row
  async function acceptRequest(rid: string, fuid: string) {
    // Update the incoming request to accepted
    await supabase.from("friends").update({ status: "accepted" }).eq("id", rid)
    // Create reverse friendship row so both users see each other
    await supabase.from("friends").upsert({
      user_id: userId,
      from_user_id: userId,
      friend_id: fuid,
      status: "accepted"
    }, { onConflict: "user_id,friend_id" }).match(() => {
      // If upsert fails (no unique constraint), try insert
      supabase.from("friends").insert({ user_id: userId, from_user_id: userId, friend_id: fuid, status: "accepted" }).match(() => {})
    })
    setFriendRequests((p) => p.filter((r) => r.id !== rid))
    setFriends((p) => [...new Set([...p, fuid])])
    const { data: pr } = await supabase.from("profiles").select("id, email, display_name").eq("id", fuid).single()
    if (pr) setFriendProfiles((p) => ({ ...p, [fuid]: { display_name: pr.display_name || pr.email?.split("@")[0] || fuid } }))
    showNotif("Partner added!")
  }
  async function declineRequest(rid: string) { await supabase.from("friends").update({ status: "declined" }).eq("id", rid); setFriendRequests((p) => p.filter((r) => r.id !== rid)) }
  async function removeFriend(fid: string) { await supabase.from("friends").delete().or(`and(user_id.eq.${userId},friend_id.eq.${fid}),and(user_id.eq.${fid},friend_id.eq.${userId})`); setFriends((p) => p.filter((id) => id !== fid)); setSentRequests((p) => p.filter((id) => id !== fid)); const u = { ...friendProfiles }; delete u[fid]; setFriendProfiles(u); showNotif("Removed") }

  // Messages
  async function loadMessages(pid: string) { const { data } = await supabase.from("messages").select("*").or(`and(sender_id.eq.${userId},receiver_id.eq.${pid}),and(sender_id.eq.${pid},receiver_id.eq.${userId})`).order("created_at", { ascending: true }); if (data) setConversations((p) => ({ ...p, [pid]: data })) }

  // Preload messages for all friends + detect unread on page load
  async function preloadConversations(uid: string, friendIds: string[]) {
    if (friendIds.length === 0) return
    const newUnread = new Set<string>()
    for (const fId of friendIds) {
      const { data } = await supabase.from("messages").select("*").or(`and(sender_id.eq.${uid},receiver_id.eq.${fId}),and(sender_id.eq.${fId},receiver_id.eq.${uid})`).order("created_at", { ascending: true })
      if (data && data.length > 0) {
        setConversations((p) => ({ ...p, [fId]: data }))
        // Check if the LAST message was from them (not from us) — that means unread
        const lastMsg = data[data.length - 1]
        if (lastMsg.sender_id !== uid) {
          // Check if this message is recent (within last 24 hours) to avoid marking old convos
          const msgAge = Date.now() - new Date(lastMsg.created_at).getTime()
          if (msgAge < 86400000) { // 24 hours
            newUnread.add(fId)
          }
        }
      }
    }
    if (newUnread.size > 0) {
      setUnreadFrom(newUnread)
      setUnreadCount(newUnread.size)
    }
  }
  async function sendMessage() { if (!msgInput.trim() || !activeChat) return; const c = msgInput.trim(); setMsgInput(""); const { data, error } = await supabase.from("messages").insert({ sender_id: userId, receiver_id: activeChat, content: c }).select().single(); if (!error && data) { setConversations((p) => { const ex = p[activeChat!] || []; if (ex.some((m) => m.id === data.id)) return p; return { ...p, [activeChat!]: [...ex, data] } }) } else if (error) { setMsgInput(c); showNotif("Failed to send") } }
  function openChat(pid: string, name: string) {
    setActiveChat(pid); setActiveChatName(name); setSubTab("messages"); loadMessages(pid)
    // Clear unread for this partner
    setUnreadFrom((prev) => { const next = new Set(prev); next.delete(pid); return next })
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  // Helpers
  function showNotif(msg: string) { setNotification(msg); setTimeout(() => setNotification(""), 3500) }
  function getInitials(n: string) { return n.split(/[\s@]+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("") }
  const COLORS = ["#E85D75", "#5B8DEF", "#43B581", "#FAA61A", "#9B59B6", "#1ABC9C", "#E67E22", "#3498DB"]
  function colorFor(id: string) { let h = 0; for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h); return COLORS[Math.abs(h) % COLORS.length] }
  function friendName(id: string) { return friendProfiles[id]?.display_name || allUsers.find((r) => r.user_id === id)?.display_name || id }
  function timeAgo(d: string) { if (!d) return "Never"; const diff = Date.now() - new Date(d).getTime(); if (diff < 60000) return "Just now"; if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`; if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`; return `${Math.floor(diff / 86400000)}d ago` }
  const displayUsers = searchTerm ? allUsers.filter((u) => u.display_name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()) || u.subjects.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase())) || u.school_name.toLowerCase().includes(searchTerm.toLowerCase()) || u.programme.toLowerCase().includes(searchTerm.toLowerCase())) : recommendations

  // ─── Status Dot ─────────────────────────────────────────────
  const Dot = ({ on, sz = 10 }: { on: boolean; sz?: number }) => (
    <span style={{ display: "inline-block", width: sz, height: sz, borderRadius: "50%", background: on ? "#22c55e" : "#6b7280", border: "2px solid rgba(3,7,18,0.9)", position: "absolute", bottom: 0, right: 0, boxShadow: on ? "0 0 8px rgba(34,197,94,0.5)" : "none" }} />
  )

  // ─── Profile Modal ──────────────────────────────────────────
  function ProfileModal({ user: u, onClose }: { user: DbUser; onClose: () => void }) {
    const isFriend = friends.includes(u.user_id), isPending = sentRequests.includes(u.user_id)
    return (
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16, animation: "fadeIn 0.2s ease" }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto", background: "linear-gradient(145deg, rgba(15,23,42,0.95), rgba(15,23,42,0.85))", backdropFilter: "blur(20px)", border: "1px solid rgba(34,197,94,0.1)", borderRadius: 24, boxShadow: "0 25px 80px rgba(0,0,0,0.6)", animation: "slideUp 0.3s cubic-bezier(0.16,1,0.3,1)" }}>
          {/* Banner */}
          <div style={{ height: 80, borderRadius: "24px 24px 0 0", background: `linear-gradient(135deg, ${colorFor(u.user_id)}33, ${colorFor(u.user_id)}11)` }} />
          <div style={{ padding: "0 28px 28px", marginTop: -32 }}>
            {/* Avatar */}
            <div style={{ position: "relative", display: "inline-block" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 22, fontWeight: 800, border: "4px solid rgba(3,7,18,0.9)", background: colorFor(u.user_id), boxShadow: `0 4px 20px ${colorFor(u.user_id)}40` }}>{getInitials(u.display_name)}</div>
              <Dot on={u.is_online} sz={14} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f0fdf4", marginTop: 12 }}>{u.display_name}</h2>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{u.is_online ? <span style={{ color: "#22c55e" }}>● Online</span> : `○ ${timeAgo(u.last_seen)}`}</p>
            {/* Info grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16 }}>
              {[u.school_name && `🏫 ${u.school_name}`, u.programme && `📚 ${u.programme}`, u.year_level && `📅 ${u.year_level}`, u.education_level && `🎓 ${u.education_level}`, u.study_time && `⏰ ${u.study_time}`, u.study_goal && `🎯 ${u.study_goal}`].filter(Boolean).map((t, i) => (
                <div key={i} style={{ padding: "8px 12px", borderRadius: 10, background: "rgba(0,0,0,0.2)", fontSize: 12, color: "#9ca3af" }}>{t}</div>
              ))}
            </div>
            {/* Match */}
            {u.match_score > 0 && (
              <div style={{ marginTop: 16, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)", borderRadius: 14, padding: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Match: {u.match_score} pts</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {u.common_subjects.map((s) => <span key={s} style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: "rgba(34,197,94,0.12)", color: "#4ade80" }}>✦ {s}</span>)}
                  {u.common_struggling.map((s) => <span key={s} style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500, background: "rgba(250,204,21,0.1)", color: "#fbbf24" }}>{s}</span>)}
                  {u.same_school && <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, background: "rgba(59,130,246,0.1)", color: "#60a5fa" }}>🏫 Same School</span>}
                  {u.same_programme && <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, background: "rgba(168,85,247,0.1)", color: "#c084fc" }}>📚 Same Programme</span>}
                </div>
              </div>
            )}
            {/* Subjects */}
            {u.subjects.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Subjects</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{u.subjects.map((s) => <span key={s} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: u.common_subjects.some((c) => c.toLowerCase() === s.toLowerCase()) ? "rgba(34,197,94,0.1)" : "rgba(0,0,0,0.2)", color: u.common_subjects.some((c) => c.toLowerCase() === s.toLowerCase()) ? "#4ade80" : "#6b7280" }}>{s}</span>)}</div>
              </div>
            )}
            {u.learning_styles.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Learning Styles</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{u.learning_styles.map((s) => <span key={s} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 500, background: "rgba(59,130,246,0.08)", color: "#60a5fa" }}>{s}</span>)}</div>
              </div>
            )}
            {/* Actions */}
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              {isFriend ? (
                <><button onClick={() => { openChat(u.user_id, u.display_name); onClose() }} style={{ flex: 1, height: 44, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>💬 Message</button>
                <button onClick={() => { removeFriend(u.user_id); onClose() }} style={{ height: 44, borderRadius: 12, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.08)", color: "#ef4444", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "0 16px", fontFamily: "'Outfit',sans-serif" }}>Remove</button></>
              ) : isPending ? (
                <div style={{ flex: 1, height: 44, borderRadius: 12, background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", fontSize: 13, fontWeight: 600 }}>⏳ Request Sent</div>
              ) : (
                <button onClick={() => { sendFriendRequest(u.user_id); onClose() }} style={{ flex: 1, height: 44, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", boxShadow: "0 4px 15px rgba(34,197,94,0.25)" }}>➕ Add Study Partner</button>
              )}
              <button onClick={onClose} style={{ height: 44, borderRadius: 12, border: "1px solid rgba(75,85,99,0.3)", background: "rgba(0,0,0,0.2)", color: "#9ca3af", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "0 16px", fontFamily: "'Outfit',sans-serif" }}>Close</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Loading / Error / No Profile ──────────────────────────
  const Shell = ({ children }: { children: React.ReactNode }) => (
    <><style jsx global>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap'); .sp * { font-family: 'Outfit', sans-serif; }`}</style>
    <main className="sp" style={{ minHeight: "100vh", background: "linear-gradient(135deg, #030712, #0a0f1a, #071115)", padding: "32px 20px" }}><div style={{ maxWidth: 800, margin: "0 auto" }}>{children}</div></main></>
  )

  if (!loaded) return <Shell><div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}><div style={{ textAlign: "center" }}><div style={{ width: 32, height: 32, border: "3px solid #22c55e", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} /><p style={{ color: "#6b7280", fontSize: 14 }}>Loading social hub...</p></div></div><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></Shell>

  if (loadError) return <Shell><a href="/dashboard" style={{ color: "#6b7280", fontSize: 13, textDecoration: "none" }}>← Dashboard</a><h1 style={{ fontSize: 24, fontWeight: 800, color: "#f0fdf4", marginTop: 12 }}>Social Hub</h1><div style={{ marginTop: 16, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 16, padding: 20 }}><p style={{ color: "#fca5a5", fontSize: 13, whiteSpace: "pre-line" }}>{loadError}</p></div></Shell>

  if (!profile) return <Shell><a href="/dashboard" style={{ color: "#6b7280", fontSize: 13, textDecoration: "none" }}>← Dashboard</a><h1 style={{ fontSize: 24, fontWeight: 800, color: "#f0fdf4", marginTop: 12, marginBottom: 16 }}>Social Hub</h1><div style={{ background: "linear-gradient(145deg, rgba(15,23,42,0.8), rgba(15,23,42,0.5))", borderRadius: 20, padding: 28, border: "1px solid rgba(34,197,94,0.08)" }}><p style={{ color: "#6b7280", fontSize: 14, marginBottom: 16 }}>Complete the onboarding survey to get matched.</p><div style={{ display: "flex", gap: 10 }}><a href="/onboarding" style={{ padding: "10px 20px", borderRadius: 12, background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Go to Survey</a></div></div></Shell>

  const subTabs: { id: SubTab; label: string; icon: string; badge?: number }[] = [
    { id: "discover", label: "Discover", icon: "🔍" },
    { id: "partners", label: "Partners", icon: "👥", badge: friendRequests.length },
    { id: "messages", label: "Messages", icon: "💬", badge: unreadCount },
  ]

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        @keyframes float1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-40px) scale(1.05)}66%{transform:translate(-20px,20px) scale(0.95)}}
        @keyframes float2{0%,100%{transform:translate(0,0)}50%{transform:translate(-30px,20px)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .sp *{font-family:'Outfit',sans-serif}
        .glass{background:linear-gradient(145deg,rgba(15,23,42,0.8),rgba(15,23,42,0.5));backdrop-filter:blur(16px);border:1px solid rgba(34,197,94,0.08);border-radius:20px;padding:24px;box-shadow:0 8px 40px rgba(0,0,0,0.3);transition:all 0.3s}
        .glass:hover{border-color:rgba(34,197,94,0.15);transform:translateY(-1px)}
        .user-card{transition:all 0.2s;cursor:pointer}
        .user-card:hover{background:rgba(34,197,94,0.04) !important;border-color:rgba(34,197,94,0.12) !important}
      `}</style>

      <main className="sp" style={{ minHeight: "100vh", position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #030712 0%, #0a0f1a 40%, #071115 70%, #030712 100%)" }}>
        <div style={{ position: "absolute", top: "5%", right: "15%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)", animation: "float1 20s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "5%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)", animation: "float2 25s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(34,197,94,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.015) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        {notification && <div style={{ position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)", zIndex: 70, background: "linear-gradient(145deg, rgba(15,23,42,0.95), rgba(15,23,42,0.9))", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 14, padding: "10px 20px", fontSize: 13, color: "#4ade80", fontWeight: 600, boxShadow: "0 8px 30px rgba(0,0,0,0.4)", animation: "slideUp 0.3s ease" }}>{notification}</div>}
        {selectedUser && <ProfileModal user={selectedUser} onClose={() => setSelectedUser(null)} />}

        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 20px 60px", position: "relative", zIndex: 10, animation: mounted ? "slideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards" : "none", opacity: mounted ? 1 : 0 }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <a href="/dashboard" style={{ color: "#6b7280", fontSize: 13, textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#f0fdf4"} onMouseLeave={(e) => e.currentTarget.style.color = "#6b7280"}>← Dashboard</a>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#f0fdf4" }}>Social Hub</h1>
          </div>

          {/* Sub-tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 24, background: "rgba(0,0,0,0.2)", borderRadius: 14, padding: 4 }}>
            {subTabs.map((t) => (
              <button key={t.id} onClick={() => { setSubTab(t.id); if (t.id !== "messages") setActiveChat(null) }}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer",
                  fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600,
                  background: subTab === t.id ? "linear-gradient(135deg, #22c55e, #16a34a)" : "transparent",
                  color: subTab === t.id ? "#fff" : "#6b7280",
                  boxShadow: subTab === t.id ? "0 2px 10px rgba(34,197,94,0.3)" : "none",
                  transition: "all 0.25s", position: "relative",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}>
                <span>{t.icon}</span> {t.label}
                {t.badge ? <span style={{ background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10, marginLeft: 2 }}>{t.badge}</span> : null}
              </button>
            ))}
          </div>

          {/* ════════════ DISCOVER ════════════ */}
          {subTab === "discover" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Search */}
              <div className="glass" style={{ padding: "6px 6px 6px 18px", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "#6b7280", fontSize: 16 }}>🔍</span>
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search users by name, subject, school..."
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#e5e7eb", fontSize: 14, fontFamily: "'Outfit',sans-serif", padding: "10px 0" }} />
                {searchTerm && <button onClick={() => setSearchTerm("")} style={{ background: "rgba(239,68,68,0.1)", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#ef4444", fontSize: 11, fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>✕ Clear</button>}
              </div>

              {/* Your subjects */}
              {profile.subjects?.length > 0 && !searchTerm && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "0 4px" }}>
                  <span style={{ fontSize: 11, color: "#4b5563", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", alignSelf: "center", marginRight: 4 }}>Your subjects:</span>
                  {profile.subjects.map((s: string) => <span key={s} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.12)" }}>{s}</span>)}
                </div>
              )}

              {/* Title */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f0fdf4" }}>{searchTerm ? `Results (${displayUsers.length})` : "Recommended Partners"}</h2>
                {!searchTerm && allUsers.length > 0 && <span style={{ fontSize: 11, color: "#4b5563" }}>Search to see all {allUsers.length}</span>}
              </div>

              {displayUsers.length === 0 ? (
                <div className="glass" style={{ textAlign: "center", padding: 40 }}>
                  <p style={{ fontSize: 32, marginBottom: 12 }}>🔭</p>
                  <p style={{ color: "#6b7280", fontSize: 14 }}>{searchTerm ? "No users found." : "No recommendations yet."}</p>
                </div>
              ) : displayUsers.map((u) => {
                const isFriend = friends.includes(u.user_id), isPending = sentRequests.includes(u.user_id)
                return (
                  <div key={u.user_id} className="user-card" onClick={() => setSelectedUser(u)}
                    style={{ background: "linear-gradient(145deg, rgba(15,23,42,0.7), rgba(15,23,42,0.4))", border: "1px solid rgba(34,197,94,0.06)", borderRadius: 18, padding: 20 }}>
                    <div style={{ display: "flex", gap: 14 }}>
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <div style={{ width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 15, fontWeight: 800, background: colorFor(u.user_id), boxShadow: `0 2px 12px ${colorFor(u.user_id)}30` }}>{getInitials(u.display_name)}</div>
                        <Dot on={u.is_online} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                            <span style={{ fontWeight: 700, fontSize: 15, color: "#f0fdf4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.display_name}</span>
                            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 600, background: u.is_online ? "rgba(34,197,94,0.12)" : "rgba(0,0,0,0.2)", color: u.is_online ? "#4ade80" : "#4b5563", flexShrink: 0 }}>{u.is_online ? "Online" : timeAgo(u.last_seen)}</span>
                          </div>
                          {u.match_score > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: "#22c55e", background: "rgba(34,197,94,0.1)", padding: "3px 10px", borderRadius: 20, flexShrink: 0 }}>{u.match_score} pts</span>}
                        </div>
                        <p style={{ fontSize: 12, color: "#4b5563", marginTop: 2 }}>{u.school_name}{u.programme && ` · ${u.programme}`}{u.year_level && ` · ${u.year_level}`}</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                          {u.common_subjects.map((s) => <span key={s} style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600, background: "rgba(34,197,94,0.1)", color: "#4ade80" }}>✦ {s}</span>)}
                          {u.common_struggling.map((s) => <span key={s} style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 500, background: "rgba(250,204,21,0.08)", color: "#fbbf24" }}>{s}</span>)}
                          {u.match_score === 0 && u.subjects.slice(0, 3).map((s) => <span key={s} style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, background: "rgba(0,0,0,0.2)", color: "#4b5563" }}>{s}</span>)}
                        </div>
                        <div style={{ marginTop: 10 }} onClick={(e) => e.stopPropagation()}>
                          {isFriend ? <button onClick={() => openChat(u.user_id, u.display_name)} style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", border: "none", borderRadius: 10, padding: "7px 16px", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>💬 Message</button>
                          : isPending ? <span style={{ padding: "7px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600, background: "rgba(0,0,0,0.2)", color: "#4b5563" }}>⏳ Sent</span>
                          : <button onClick={() => sendFriendRequest(u.user_id)} style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", border: "none", borderRadius: 10, padding: "7px 16px", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", boxShadow: "0 2px 10px rgba(34,197,94,0.2)" }}>➕ Add Partner</button>}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ════════════ PARTNERS ════════════ */}
          {subTab === "partners" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {friendRequests.length > 0 && (
                <div className="glass">
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f0fdf4", marginBottom: 12 }}>🔔 Pending Requests <span style={{ fontSize: 11, background: "#ef4444", color: "#fff", padding: "2px 8px", borderRadius: 20, fontWeight: 700, marginLeft: 6 }}>{friendRequests.length}</span></h3>
                  {friendRequests.map((r) => (
                    <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(250,204,21,0.04)", border: "1px solid rgba(250,204,21,0.08)", borderRadius: 14, padding: "12px 16px", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 800, background: colorFor(r.from_user_id) }}>{getInitials(r.from_display_name)}</div>
                        <div><p style={{ fontSize: 13, fontWeight: 600, color: "#e5e7eb" }}>{r.from_display_name}</p><p style={{ fontSize: 11, color: "#4b5563" }}>Wants to study together</p></div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => acceptRequest(r.id, r.from_user_id)} style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", border: "none", borderRadius: 8, padding: "6px 14px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Accept</button>
                        <button onClick={() => declineRequest(r.id)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, padding: "6px 14px", color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Decline</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f0fdf4" }}>Study Partners ({friends.length})</h2>
              {friends.length === 0 ? (
                <div className="glass" style={{ textAlign: "center", padding: 40 }}>
                  <p style={{ fontSize: 32, marginBottom: 12 }}>👥</p>
                  <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 16 }}>No partners yet.</p>
                  <button onClick={() => setSubTab("discover")} style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", border: "none", borderRadius: 12, padding: "10px 24px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Discover Partners</button>
                </div>
              ) : friends.map((fId) => {
                const name = friendName(fId), uo = allUsers.find((u) => u.user_id === fId)
                return (
                  <div key={fId} className="glass" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => uo && setSelectedUser(uo)}>
                      <div style={{ position: "relative" }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 800, background: colorFor(fId) }}>{getInitials(name)}</div>
                        {uo && <Dot on={uo.is_online} sz={10} />}
                      </div>
                      <div><p style={{ fontSize: 14, fontWeight: 600, color: "#f0fdf4" }}>{name}</p>{uo && <p style={{ fontSize: 11, color: uo.is_online ? "#22c55e" : "#4b5563" }}>{uo.is_online ? "Online" : timeAgo(uo.last_seen)}</p>}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => openChat(fId, name)} style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", border: "none", borderRadius: 8, padding: "6px 14px", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>💬</button>
                      <button onClick={() => removeFriend(fId)} style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.12)", borderRadius: 8, padding: "6px 14px", color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>✕</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ════════════ MESSAGES ════════════ */}
          {subTab === "messages" && (
            activeChat ? (
              <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 200px)" }}>
                {/* Chat header */}
                <div className="glass" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", marginBottom: 12, borderRadius: 16 }}>
                  <button onClick={() => setActiveChat(null)} style={{ background: "rgba(0,0,0,0.2)", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#9ca3af", fontSize: 12, fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>←</button>
                  <div style={{ position: "relative" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 800, background: colorFor(activeChat) }}>{getInitials(activeChatName)}</div>
                    {(() => { const u = allUsers.find((x) => x.user_id === activeChat); return u ? <Dot on={u.is_online} sz={10} /> : null })()}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#f0fdf4" }}>{activeChatName}</p>
                    {(() => { const u = allUsers.find((x) => x.user_id === activeChat); return u ? <p style={{ fontSize: 11, color: u.is_online ? "#22c55e" : "#4b5563" }}>{u.is_online ? "Online" : timeAgo(u.last_seen)}</p> : null })()}
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, padding: "0 4px" }}>
                  {(conversations[activeChat] || []).length === 0 && <p style={{ textAlign: "center", padding: "60px 0", color: "#4b5563", fontSize: 14 }}>Say hello! 👋</p>}
                  {(conversations[activeChat] || []).map((msg, i) => (
                    <div key={msg.id || i} style={{ display: "flex", justifyContent: msg.sender_id === userId ? "flex-end" : "flex-start" }}>
                      <div style={{
                        maxWidth: "75%", padding: "10px 16px", fontSize: 13, lineHeight: 1.5,
                        borderRadius: 18,
                        borderBottomRightRadius: msg.sender_id === userId ? 4 : 18,
                        borderBottomLeftRadius: msg.sender_id !== userId ? 4 : 18,
                        background: msg.sender_id === userId ? "linear-gradient(135deg, #22c55e, #16a34a)" : "rgba(15,23,42,0.8)",
                        color: msg.sender_id === userId ? "#fff" : "#d1d5db",
                        border: msg.sender_id === userId ? "none" : "1px solid rgba(34,197,94,0.06)",
                        boxShadow: msg.sender_id === userId ? "0 2px 8px rgba(34,197,94,0.2)" : "none",
                      }}>
                        {msg.content}
                        <div style={{ fontSize: 9, marginTop: 4, opacity: 0.6, textAlign: "right" }}>{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <div className="glass" style={{ flex: 1, padding: "4px 4px 4px 18px", display: "flex", alignItems: "center", borderRadius: 14 }}>
                    <input value={msgInput} onChange={(e) => setMsgInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                      placeholder="Type a message..."
                      style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#e5e7eb", fontSize: 14, fontFamily: "'Outfit',sans-serif", padding: "10px 0" }} />
                  </div>
                  <button onClick={sendMessage} disabled={!msgInput.trim()}
                    style={{
                      width: 48, height: 48, borderRadius: 14, border: "none", cursor: msgInput.trim() ? "pointer" : "default",
                      background: msgInput.trim() ? "linear-gradient(135deg, #22c55e, #16a34a)" : "rgba(0,0,0,0.2)",
                      color: msgInput.trim() ? "#fff" : "#4b5563",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                      boxShadow: msgInput.trim() ? "0 4px 15px rgba(34,197,94,0.3)" : "none",
                      transition: "all 0.25s",
                    }}>
                    ➤
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f0fdf4" }}>Conversations</h2>
                {friends.length === 0 ? (
                  <div className="glass" style={{ textAlign: "center", padding: 40 }}>
                    <p style={{ fontSize: 32, marginBottom: 12 }}>💬</p>
                    <p style={{ color: "#6b7280", fontSize: 14 }}>Add partners to start chatting</p>
                  </div>
                ) : friends.map((fId) => {
                  const name = friendName(fId), msgs = conversations[fId] || [], last = msgs[msgs.length - 1], uo = allUsers.find((u) => u.user_id === fId)
                  const hasUnread = unreadFrom.has(fId)
                  return (
                    <button key={fId} onClick={() => openChat(fId, name)} className="user-card"
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, background: hasUnread ? "linear-gradient(145deg, rgba(34,197,94,0.06), rgba(15,23,42,0.5))" : "linear-gradient(145deg, rgba(15,23,42,0.7), rgba(15,23,42,0.4))", border: `1px solid ${hasUnread ? "rgba(34,197,94,0.15)" : "rgba(34,197,94,0.06)"}`, borderRadius: 16, padding: "16px 20px", textAlign: "left", cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <div style={{ width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 800, background: colorFor(fId) }}>{getInitials(name)}</div>
                        {uo && <Dot on={uo.is_online} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <p style={{ fontSize: 14, fontWeight: hasUnread ? 800 : 600, color: "#f0fdf4" }}>{name}</p>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {hasUnread && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px rgba(34,197,94,0.5)", flexShrink: 0 }} />}
                            {last && <span style={{ fontSize: 10, color: "#4b5563" }}>{new Date(last.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                          </div>
                        </div>
                        <p style={{ fontSize: 12, color: hasUnread ? "#d1d5db" : "#4b5563", fontWeight: hasUnread ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>{last ? `${last.sender_id === userId ? "You: " : ""}${last.content}` : "Start a conversation"}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )
          )}
        </div>
      </main>
    </>
  )
}
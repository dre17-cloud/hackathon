"use client"

import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "" },
  { href: "/upload", label: "Upload", icon: "" },
  { href: "/social", label: "Social", icon: "" },
  { href: "/search", label: "Search", icon: "" },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [userName, setUserName] = useState("")
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Hide navbar on auth pages
  const hideOn = ["/login", "/signup", "/onboarding"]
  const shouldHide = hideOn.some((p) => pathname?.startsWith(p))

  useEffect(() => {
    setMounted(true)
    loadUser()
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  async function loadUser() {
    const { data } = await supabase.auth.getUser()
    if (data.user?.email) {
      setUserName(data.user.email.split("@")[0])
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (shouldHide || !mounted) return null

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        .nav-root * { font-family: 'Outfit', sans-serif; }
        .nav-link {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 50%;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #22c55e, #10b981);
          border-radius: 1px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translateX(-50%);
        }
        .nav-link:hover::after,
        .nav-link.active::after {
          width: 100%;
        }
        .nav-link:hover {
          color: #f0fdf4 !important;
        }
        .logout-btn {
          transition: all 0.25s;
        }
        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.15) !important;
          border-color: rgba(239, 68, 68, 0.4) !important;
          color: #fca5a5 !important;
          transform: translateY(-1px);
        }
        .mobile-backdrop {
          animation: fadeIn 0.2s ease;
        }
        .mobile-panel {
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>

      <nav className="nav-root" style={{
        position: "sticky", top: 0, zIndex: 50, width: "100%",
        background: "linear-gradient(180deg, rgba(3,7,18,0.95) 0%, rgba(10,15,26,0.9) 100%)",
        backdropFilter: "blur(20px) saturate(1.5)",
        borderBottom: "1px solid rgba(34,197,94,0.08)",
        boxShadow: "0 4px 30px rgba(0,0,0,0.3)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>

          {/* Logo */}
          <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "linear-gradient(135deg, #22c55e, #10b981)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 12px rgba(34,197,94,0.3)", fontSize: 16,
            }}>
              📚
            </div>
            <span style={{
              fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em",
              background: "linear-gradient(135deg, #22c55e, #10b981, #059669)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              ICONNECT
            </span>
          </a>

          {/* Desktop nav links */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }} className="desktop-nav">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
              return (
                <a key={item.href} href={item.href}
                  className={`nav-link ${isActive ? "active" : ""}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 14px", borderRadius: 10,
                    fontSize: 13, fontWeight: isActive ? 700 : 500,
                    color: isActive ? "#4ade80" : "#9ca3af",
                    textDecoration: "none",
                    background: isActive ? "rgba(34,197,94,0.08)" : "transparent",
                  }}>
                  <span style={{ fontSize: 14 }}>{item.icon}</span>
                  {item.label}
                </a>
              )
            })}
          </div>

          {/* Right side — avatar + logout */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* User avatar */}
            {userName && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "4px 12px 4px 4px", borderRadius: 12,
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: "linear-gradient(135deg, #22c55e, #10b981)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 12, fontWeight: 800,
                }}>
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="desktop-nav" style={{ fontSize: 13, fontWeight: 600, color: "#d1d5db" }}>{userName}</span>
              </div>
            )}

            {/* Logout — desktop */}
            <button onClick={handleLogout} className="logout-btn desktop-nav"
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "7px 14px", borderRadius: 10,
                background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
                color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer",
                fontFamily: "'Outfit', sans-serif",
              }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>

            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="mobile-only"
              style={{
                display: "none", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, width: 38, height: 38, cursor: "pointer",
                alignItems: "center", justifyContent: "center", color: "#9ca3af",
              }}>
              {mobileOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <>
            <div className="mobile-backdrop" onClick={() => setMobileOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 40 }} />
            <div className="mobile-panel"
              style={{
                position: "fixed", top: 0, right: 0, bottom: 0, width: 280, zIndex: 50,
                background: "linear-gradient(180deg, #0a0f1a, #030712)",
                borderLeft: "1px solid rgba(34,197,94,0.1)",
                padding: "20px",
                display: "flex", flexDirection: "column",
              }}>
              {/* Close */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                <span style={{ fontSize: 16, fontWeight: 800, background: "linear-gradient(135deg, #22c55e, #10b981)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Menu</span>
                <button onClick={() => setMobileOpen(false)} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, width: 34, height: 34, cursor: "pointer", color: "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>

              {/* User */}
              {userName && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, padding: "12px 14px", background: "rgba(34,197,94,0.06)", borderRadius: 14, border: "1px solid rgba(34,197,94,0.1)" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #22c55e, #10b981)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 800 }}>
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#f0fdf4" }}>{userName}</p>
                    <p style={{ fontSize: 11, color: "#6b7280" }}>Online</p>
                  </div>
                </div>
              )}

              {/* Links */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <a key={item.href} href={item.href} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 14,
                      textDecoration: "none", fontSize: 15, fontWeight: isActive ? 700 : 500,
                      color: isActive ? "#4ade80" : "#d1d5db",
                      background: isActive ? "rgba(34,197,94,0.1)" : "transparent",
                      border: isActive ? "1px solid rgba(34,197,94,0.15)" : "1px solid transparent",
                      transition: "all 0.2s",
                    }}>
                      <span style={{ fontSize: 18 }}>{item.icon}</span>
                      {item.label}
                    </a>
                  )
                })}
              </div>

              {/* Logout */}
              <button onClick={handleLogout} style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "14px", borderRadius: 14, marginTop: 16,
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                color: "#ef4444", fontSize: 14, fontWeight: 700, cursor: "pointer",
                fontFamily: "'Outfit', sans-serif",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                Sign Out
              </button>
            </div>
          </>
        )}
      </nav>

      {/* Responsive CSS */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-only { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-only { display: none !important; }
        }
      `}</style>
    </>
  )
}
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface UploadedFile {
  name: string;
  url: string;
  subject: string;
  learning_style: string;
  created_at?: string;
}

interface UserPreferences {
  subjects: string[];
  learning_styles: string[];
}

const SUBJECT_OPTIONS = [
  "Mathematics", "English", "Biology", "Chemistry", "Physics",
  "Information Technology", "Computer Science", "Theory of Computation",
  "Data Structures", "Operating Systems", "Database Systems",
  "Accounting", "Economics",
];

const LEARNING_STYLE_OPTIONS = [
  "Reading notes", "Watching videos", "Practice questions",
  "Step-by-step explanations", "Group study", "Visual diagrams", "Audio explanations",
];

export default function SearchPage() {
  const [topic, setTopic] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<UploadedFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [userPrefs, setUserPrefs] = useState<UserPreferences | null>(null);
  const [activeTab, setActiveTab] = useState<"ai" | "files">("ai");
  const [showFilters, setShowFilters] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); loadUserPreferences(); loadFiles(); }, []);
  useEffect(() => { applyFilters(); }, [selectedSubjects, selectedStyles, files]);

  async function loadUserPreferences() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { data } = await supabase
      .from("user_preferences")
      .select("subjects, learning_styles")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      setUserPrefs(data);
      setSelectedSubjects(data.subjects ?? []);
      setSelectedStyles(data.learning_styles ?? []);
    }
  }

  // BUG FIX: removed duplicate interface UploadedFile that was declared inside this function
  async function loadFiles() {
    setFilesLoading(true);
    try {
      const { data: storageFiles, error } = await supabase.storage
        .from("storage-resources")
        .list("uploads", { limit: 100, sortBy: { column: "created_at", order: "desc" } });
      if (error) throw error;

      const mapped: UploadedFile[] = (storageFiles ?? []).map((f: any) => {
        const parts = f.name.split("-");
        const subject = parts[1] ?? "General";
        const learning_style = parts[2] ?? "General";
        const { data: urlData } = supabase.storage
          .from("storage-resources")
          .getPublicUrl(`uploads/${f.name}`);
        return { name: f.name, url: urlData.publicUrl, subject, learning_style, created_at: f.created_at ?? "" };
      });
      setFiles(mapped);
    } catch (err) {
      console.error("Failed to load files:", err);
    } finally {
      setFilesLoading(false);
    }
  }

  function applyFilters() {
    let result = [...files];
    if (selectedSubjects.length > 0) {
      result = result.filter((f) => selectedSubjects.some((s) => f.subject.toLowerCase().includes(s.toLowerCase())));
    }
    if (selectedStyles.length > 0) {
      result = result.filter((f) => selectedStyles.some((s) => f.learning_style.toLowerCase().includes(s.toLowerCase())));
    }
    setFilteredFiles(result);
  }

  function toggleItem(list: string[], item: string, setter: (v: string[]) => void) {
    setter(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  }

  // Toggle a subject filter AND auto-search for it
  function toggleSubjectAndSearch(item: string) {
    const isRemoving = selectedSubjects.includes(item)
    const updated = isRemoving ? selectedSubjects.filter((x) => x !== item) : [...selectedSubjects, item]
    setSelectedSubjects(updated)
    // If adding a subject, auto-search for it
    if (!isRemoving) {
      setTopic(item)
      setActiveTab("ai")
      // Small delay to let state update, then search
      setTimeout(() => searchFor(item, updated, selectedStyles), 100)
    }
  }

  // Toggle a learning style filter AND auto-search
  function toggleStyleAndSearch(item: string) {
    const isRemoving = selectedStyles.includes(item)
    const updated = isRemoving ? selectedStyles.filter((x) => x !== item) : [...selectedStyles, item]
    setSelectedStyles(updated)
    // If adding a style and we have a topic or subjects, re-search
    if (!isRemoving && (topic.trim() || selectedSubjects.length > 0)) {
      const searchTopic = topic.trim() || selectedSubjects[selectedSubjects.length - 1] || item
      setTimeout(() => searchFor(searchTopic, selectedSubjects, updated), 100)
    }
  }

  // Core search function that accepts explicit params
  async function searchFor(searchTopic: string, subjects: string[], styles: string[]) {
    if (!searchTopic.trim()) return
    setAiLoading(true); setAiResult(""); setAiError(""); setActiveTab("ai")
    try {
      const payload = {
        topic: searchTopic,
        learningStyles: styles,
        subjects: subjects,
        userPreferences: userPrefs,
        availableFiles: filteredFiles.map((f) => ({ name: f.name, subject: f.subject, learning_style: f.learning_style })),
      }
      const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (data.error) { setAiError(data.error) } else { setAiResult(data.response) }
    } catch (err) {
      console.error("[SearchPage] Fetch error:", err)
      setAiError("Network error — please try again.")
    } finally { setAiLoading(false) }
  }

  async function getAIRecommendation() {
    if (!topic.trim()) return
    searchFor(topic, selectedSubjects, selectedStyles)
  }

  function renderResult(text: string) {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("**") && line.endsWith("**")) {
        return <p key={i} style={{ color: "#4ade80", fontWeight: 700, fontSize: 15, marginTop: 20, marginBottom: 6 }}>{line.replace(/\*\*/g, "")}</p>;
      }
      if (line.trim() === "") return <div key={i} style={{ height: 8 }} />;
      // Render links as clickable
      if (/https?:\/\/[^\s]+/.test(line)) {
        const parts = line.split(/(https?:\/\/[^\s]+)/g);
        return (
          <p key={i} style={{ color: "#d1d5db", fontSize: 13, lineHeight: 1.8 }}>
            {parts.map((part, j) =>
              /^https?:\/\//.test(part) ? (
                <a key={j} href={part} target="_blank" rel="noopener noreferrer" style={{ color: "#22c55e", textDecoration: "underline", textUnderlineOffset: 2, wordBreak: "break-all" as const }}>{part}</a>
              ) : <span key={j}>{part}</span>
            )}
          </p>
        );
      }
      return <p key={i} style={{ color: "#d1d5db", fontSize: 13, lineHeight: 1.8 }}>{line}</p>;
    });
  }

  function getFileIcon(name: string) {
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "📕";
    if (["doc", "docx"].includes(ext ?? "")) return "📘";
    if (["ppt", "pptx"].includes(ext ?? "")) return "📊";
    if (["mp4", "mov", "avi"].includes(ext ?? "")) return "🎬";
    if (["mp3", "wav"].includes(ext ?? "")) return "🎵";
    if (["png", "jpg", "jpeg", "gif"].includes(ext ?? "")) return "🖼️";
    return "📄";
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        @keyframes gradientMove { 0%{background-position:0% 0%} 25%{background-position:100% 0%} 50%{background-position:100% 100%} 75%{background-position:0% 100%} 100%{background-position:0% 0%} }
        .animated-bg {
          background: radial-gradient(ellipse at 20% 50%,rgba(34,197,94,0.1) 0%,transparent 50%),radial-gradient(ellipse at 80% 20%,rgba(16,185,129,0.07) 0%,transparent 50%),radial-gradient(ellipse at 60% 80%,rgba(5,150,105,0.08) 0%,transparent 50%),linear-gradient(135deg,#030712,#0a0f1a,#071210,#0a0f1a,#030712);
          background-size: 400% 400%; animation: gradientMove 15s ease infinite;
        }
        @keyframes pulseGlow { 0%,100%{box-shadow:0 0 20px rgba(34,197,94,0.3),0 0 40px rgba(34,197,94,0.15)} 50%{box-shadow:0 0 30px rgba(34,197,94,0.5),0 0 60px rgba(34,197,94,0.25)} }
        @keyframes borderGlow { 0%,100%{border-color:rgba(34,197,94,0.4)} 50%{border-color:rgba(34,197,94,0.8)} }
        @keyframes shimmerSweep { 0%{transform:translateX(-100%) translateY(-100%) rotate(45deg)} 100%{transform:translateX(100%) translateY(100%) rotate(45deg)} }
        .glow-btn { animation: pulseGlow 2.5s ease-in-out infinite, borderGlow 2.5s ease-in-out infinite; border: 1.5px solid rgba(34,197,94,0.4) !important; position: relative; overflow: hidden; }
        .glow-btn::before { content:''; position:absolute; top:-50%; left:-50%; width:200%; height:200%; background:linear-gradient(45deg,transparent 40%,rgba(255,255,255,0.08) 45%,rgba(255,255,255,0.12) 50%,rgba(255,255,255,0.08) 55%,transparent 60%); animation: shimmerSweep 3s ease-in-out infinite; }
        .glow-btn:hover:not(:disabled) { transform: translateY(-2px) !important; }
        .glow-btn:disabled { animation: none !important; box-shadow: none !important; border-color: transparent !important; }
        .glow-btn:disabled::before { display: none; }
        @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-40px) scale(1.05)} 66%{transform:translate(-20px,20px) scale(0.95)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-25px,20px)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .search-page * { font-family: 'Outfit', sans-serif; }
        .glass { background: linear-gradient(145deg,rgba(15,23,42,0.8),rgba(15,23,42,0.5)); backdrop-filter: blur(16px); border: 1px solid rgba(34,197,94,0.08); border-radius: 20px; box-shadow: 0 8px 40px rgba(0,0,0,0.3); transition: all 0.3s; }
        .glass:hover { border-color: rgba(34,197,94,0.15); }
        .search-field { transition: all 0.3s cubic-bezier(0.4,0,0.2,1); }
        .search-field:focus-within { border-color: #22c55e !important; box-shadow: 0 0 0 3px rgba(34,197,94,0.1); transform: translateY(-1px); }
      `}</style>

      <main className="search-page animated-bg" style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
        {/* Background orbs */}
        <div style={{ position: "absolute", top: "5%", right: "15%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)", animation: "float1 20s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "5%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)", animation: "float2 25s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(34,197,94,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.015) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px 60px", position: "relative", zIndex: 10, animation: mounted ? "slideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards" : "none", opacity: mounted ? 1 : 0 }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#f0fdf4", letterSpacing: "-0.02em" }}>🔍 Study Search</h1>
              <p style={{ color: "#4b5563", fontSize: 13, marginTop: 4 }}>AI-powered recommendations + your uploaded resources</p>
            </div>
            <button onClick={() => setShowFilters((v) => !v)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 18px", borderRadius: 12, cursor: "pointer",
                background: showFilters ? "rgba(34,197,94,0.1)" : "rgba(0,0,0,0.2)",
                border: `1.5px solid ${showFilters ? "rgba(34,197,94,0.3)" : "rgba(75,85,99,0.3)"}`,
                color: showFilters ? "#4ade80" : "#9ca3af", fontSize: 13, fontWeight: 600,
                fontFamily: "'Outfit',sans-serif", transition: "all 0.2s",
              }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 4h18M7 8h10M11 12h2M9 16h6" /></svg>
              Filters
              {(selectedSubjects.length > 0 || selectedStyles.length > 0) && (
                <span style={{ background: "#22c55e", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20 }}>
                  {selectedSubjects.length + selectedStyles.length}
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="glass" style={{ padding: 24, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "#f0fdf4" }}>Filter Resources</h2>
                <button onClick={() => { setSelectedSubjects([]); setSelectedStyles([]) }}
                  style={{ background: "none", border: "none", color: "#6b7280", fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Clear all</button>
              </div>
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Subject</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {SUBJECT_OPTIONS.map((s) => (
                    <button key={s} onClick={() => toggleSubjectAndSearch(s)}
                      style={{
                        padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer",
                        fontFamily: "'Outfit',sans-serif", border: "1.5px solid", transition: "all 0.2s",
                        background: selectedSubjects.includes(s) ? "rgba(34,197,94,0.15)" : "rgba(0,0,0,0.3)",
                        borderColor: selectedSubjects.includes(s) ? "rgba(34,197,94,0.5)" : "rgba(75,85,99,0.3)",
                        color: selectedSubjects.includes(s) ? "#4ade80" : "#6b7280",
                      }}>
                      {selectedSubjects.includes(s) ? "✓ " : ""}{s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Learning Style</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {LEARNING_STYLE_OPTIONS.map((s) => (
                    <button key={s} onClick={() => toggleStyleAndSearch(s)}
                      style={{
                        padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer",
                        fontFamily: "'Outfit',sans-serif", border: "1.5px solid", transition: "all 0.2s",
                        background: selectedStyles.includes(s) ? "rgba(59,130,246,0.15)" : "rgba(0,0,0,0.3)",
                        borderColor: selectedStyles.includes(s) ? "rgba(59,130,246,0.5)" : "rgba(75,85,99,0.3)",
                        color: selectedStyles.includes(s) ? "#60a5fa" : "#6b7280",
                      }}>
                      {selectedStyles.includes(s) ? "✓ " : ""}{s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <div className="search-field" style={{
              flex: 1, display: "flex", alignItems: "center", gap: 12,
              background: "rgba(0,0,0,0.25)", border: "1.5px solid rgba(75,85,99,0.4)",
              borderRadius: 14, padding: "0 18px", height: 54,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2"><path d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" /></svg>
              <input type="text" placeholder="Enter a topic to search or get recommendations..." value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && getAIRecommendation()}
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#e5e7eb", fontSize: 15, fontFamily: "'Outfit',sans-serif" }} />
            </div>
            <button onClick={getAIRecommendation} disabled={aiLoading || !topic.trim()}
              className={aiLoading || !topic.trim() ? "" : "glow-btn"}
              style={{
                padding: "0 24px", height: 54, borderRadius: 14,
                background: aiLoading || !topic.trim() ? "rgba(75,85,99,0.3)" : "linear-gradient(135deg, #22c55e, #16a34a, #15803d)",
                color: "#fff", fontSize: 14, fontWeight: 700, cursor: aiLoading || !topic.trim() ? "not-allowed" : "pointer",
                fontFamily: "'Outfit',sans-serif", transition: "transform 0.3s",
                display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap",
              }}>
              {aiLoading ? (
                <><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="3"/><path d="M12 2a10 10 0 019.95 9" stroke="#fff" strokeWidth="3" strokeLinecap="round"/></svg> Searching...</>
              ) : (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" /></svg> Get AI Recommendation</>
              )}
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: 4, width: "fit-content", marginBottom: 20 }}>
            {(["ai", "files"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{
                  padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  fontFamily: "'Outfit',sans-serif", border: "none", transition: "all 0.25s",
                  background: activeTab === tab ? "linear-gradient(135deg, #22c55e, #16a34a)" : "transparent",
                  color: activeTab === tab ? "#fff" : "#6b7280",
                  boxShadow: activeTab === tab ? "0 2px 10px rgba(34,197,94,0.3)" : "none",
                }}>
                {tab === "ai" ? "🤖 AI Recommendation" : `📁 Study Files (${filteredFiles.length})`}
              </button>
            ))}
          </div>

          {/* ═══ AI Tab ═══ */}
          {activeTab === "ai" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {!aiResult && !aiLoading && !aiError && (
                <div className="glass" style={{ padding: "48px 24px", textAlign: "center" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                  <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.7 }}>
                    Enter a topic above and click <span style={{ color: "#4ade80", fontWeight: 700 }}>Get AI Recommendation</span>.<br />
                    The AI will provide detailed information and recommend relevant study resources.
                  </p>
                </div>
              )}

              {aiLoading && (
                <div className="glass" style={{ padding: "48px 24px", textAlign: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                    <div style={{ width: 20, height: 20, border: "3px solid #22c55e", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    <span style={{ color: "#6b7280", fontSize: 14 }}>Searching and analyzing...</span>
                  </div>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </div>
              )}

              {aiError && !aiLoading && (
                <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 16, padding: 20 }}>
                  <p style={{ color: "#fca5a5", fontSize: 13 }}>⚠️ {aiError}</p>
                </div>
              )}

              {aiResult && !aiLoading && (
                <div className="glass" style={{ padding: 28 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <span style={{ color: "#4ade80", fontWeight: 700, fontSize: 15 }}>AI Recommendation</span>
                    <span style={{ fontSize: 10, fontWeight: 600, background: "rgba(34,197,94,0.1)", color: "#22c55e", padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(34,197,94,0.15)" }}>Web + Files</span>
                  </div>
                  <div>{renderResult(aiResult)}</div>
                </div>
              )}
            </div>
          )}

          {/* ═══ Files Tab ═══ */}
          {activeTab === "files" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filesLoading && (
                <div className="glass" style={{ padding: "48px 24px", textAlign: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                    <div style={{ width: 16, height: 16, border: "2px solid #22c55e", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    <span style={{ color: "#6b7280", fontSize: 14 }}>Loading files...</span>
                  </div>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </div>
              )}

              {!filesLoading && filteredFiles.length === 0 && (
                <div className="glass" style={{ padding: "48px 24px", textAlign: "center" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📂</div>
                  <p style={{ color: "#6b7280", fontSize: 14 }}>No files match your filters. Try adjusting the subject or learning style filters.</p>
                </div>
              )}

              {!filesLoading && filteredFiles.map((file, i) => (
                <div key={i} className="glass" style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, borderRadius: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(34,197,94,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                      {getFileIcon(file.name)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#e5e7eb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</p>
                      <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                        {file.subject && file.subject !== "General" && (
                          <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "rgba(34,197,94,0.1)", color: "#4ade80" }}>{file.subject}</span>
                        )}
                        {file.learning_style && file.learning_style !== "General" && (
                          <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "rgba(59,130,246,0.1)", color: "#60a5fa" }}>{file.learning_style}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <a href={file.url} target="_blank" rel="noopener noreferrer"
                    style={{
                      padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                      background: "rgba(0,0,0,0.2)", border: "1px solid rgba(75,85,99,0.3)",
                      color: "#9ca3af", textDecoration: "none", flexShrink: 0, transition: "all 0.2s",
                      fontFamily: "'Outfit',sans-serif",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)"; e.currentTarget.style.color = "#4ade80" }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(75,85,99,0.3)"; e.currentTarget.style.color = "#9ca3af" }}>
                    Open ↗
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
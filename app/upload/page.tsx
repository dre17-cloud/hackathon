"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

const SUBJECT_OPTIONS = [
  "Mathematics", "English", "Biology", "Chemistry", "Physics",
  "Information Technology", "Computer Science", "Theory of Computation",
  "Data Structures", "Operating Systems", "Database Systems",
  "Accounting", "Economics",
];

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const finalSubject = subject === "Other" ? customSubject : subject;

  function getFileIcon(name: string): string {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    if (ext === "pdf") return "📕";
    if (["doc", "docx"].includes(ext)) return "📘";
    if (["ppt", "pptx"].includes(ext)) return "📊";
    if (["xls", "xlsx", "csv"].includes(ext)) return "📗";
    if (["png", "jpg", "jpeg", "gif", "svg"].includes(ext)) return "🖼️";
    if (["mp4", "mov", "avi"].includes(ext)) return "🎬";
    if (["mp3", "wav"].includes(ext)) return "🎵";
    if (["zip", "rar"].includes(ext)) return "📦";
    return "📄";
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setIsError(false);
    setSuccess(false);

    if (!title || !finalSubject || !description || !file) {
      setMessage("Please fill in all fields and choose a file.");
      setIsError(true);
      return;
    }

    try {
      setLoading(true);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error("You must be logged in to upload.");

      const userId = userData.user.id;
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("storage-resources")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("storage-resources")
        .getPublicUrl(filePath);

      const fileUrl = urlData.publicUrl;

      // Insert into database — matches your original resources table schema
      const { error: dbError } = await supabase
        .from("resources")
        .insert([
          {
            title: title,
            subject: finalSubject,
            description: description,
            file_url: fileUrl,
            file_name: file.name,
            file_type: file.type,
            user_id: userId,
          }
        ]);

      if (dbError) throw dbError;

      setMessage("File uploaded successfully!");
      setIsError(false);
      setSuccess(true);
      setTitle("");
      setSubject("");
      setCustomSubject("");
      setDescription("");
      setFile(null);

      setTimeout(() => setSuccess(false), 4000);

    } catch (error: any) {
      console.error(error);
      setMessage(error.message || "Upload failed.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  const progress = [title, finalSubject, description, file].filter(Boolean).length;
  const progressPct = (progress / 4) * 100;

  // Inline select style to avoid TS appearance error
  const selectStyle: React.CSSProperties = {
    flex: 1, background: "transparent", border: "none", outline: "none",
    color: subject ? "#e5e7eb" : "#6b7280", fontSize: 15,
    fontFamily: "'Outfit', sans-serif", appearance: "none",
    WebkitAppearance: "none", MozAppearance: "none",
  };

  const textareaStyle: React.CSSProperties = {
    width: "100%", background: "rgba(0,0,0,0.3)",
    border: "1.5px solid rgba(75,85,99,0.4)", borderRadius: 14,
    padding: "14px 16px", color: "#e5e7eb", fontSize: 14,
    fontFamily: "'Outfit', sans-serif", outline: "none", resize: "vertical",
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        @keyframes gradientMove { 0%{background-position:0% 0%} 25%{background-position:100% 0%} 50%{background-position:100% 100%} 75%{background-position:0% 100%} 100%{background-position:0% 0%} }
        .animated-bg {
          background: radial-gradient(ellipse at 20% 50%,rgba(34,197,94,0.12) 0%,transparent 50%),radial-gradient(ellipse at 80% 20%,rgba(16,185,129,0.08) 0%,transparent 50%),radial-gradient(ellipse at 60% 80%,rgba(5,150,105,0.1) 0%,transparent 50%),linear-gradient(135deg,#030712,#0a0f1a,#071210,#0a0f1a,#030712);
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
        @keyframes float2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-30px,20px)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes checkPop { 0%{transform:scale(0)} 50%{transform:scale(1.2)} 100%{transform:scale(1)} }
        .upload-page * { font-family: 'Outfit', sans-serif; }
        .up-field { transition: all 0.3s cubic-bezier(0.4,0,0.2,1); }
        .up-field:focus-within { border-color: #22c55e !important; box-shadow: 0 0 0 3px rgba(34,197,94,0.1); transform: translateY(-1px); }
      `}</style>

      <main className="upload-page animated-bg min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-10">

        {/* Floating orbs */}
        <div style={{ position: "absolute", top: "10%", left: "20%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 70%)", animation: "float1 20s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "15%", right: "15%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)", animation: "float2 25s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(34,197,94,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.02) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <div style={{
          position: "relative", zIndex: 10, width: "100%", maxWidth: 520,
          animation: mounted ? "slideUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards" : "none",
          opacity: mounted ? 1 : 0,
        }}>

          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 28, animation: mounted ? "fadeIn 0.5s ease 0.2s both" : "none" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg, #22c55e, #10b981)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(34,197,94,0.3)", fontSize: 20 }}>📤</div>
              <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", background: "linear-gradient(135deg, #22c55e, #10b981)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ICONNECT</span>
            </div>
          </div>

          {/* Progress */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Upload Progress</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#22c55e" }}>{progress}/4 fields</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: "rgba(75,85,99,0.3)", overflow: "hidden" }}>
              <div style={{ width: `${progressPct}%`, height: "100%", borderRadius: 2, background: "linear-gradient(90deg, #22c55e, #10b981)", transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)" }} />
            </div>
          </div>

          {/* Glass card */}
          <div style={{
            background: "linear-gradient(145deg, rgba(15,23,42,0.8), rgba(15,23,42,0.6))",
            backdropFilter: "blur(20px) saturate(1.5)",
            border: "1px solid rgba(34,197,94,0.1)",
            borderRadius: 24, padding: "36px 32px",
            boxShadow: "0 25px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset",
          }}>

            {/* Success */}
            {success && (
              <div style={{ textAlign: "center", padding: "40px 0", animation: "fadeIn 0.3s ease" }}>
                <div style={{ fontSize: 56, marginBottom: 16, animation: "checkPop 0.5s ease" }}>✅</div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f0fdf4", marginBottom: 8 }}>Upload Complete!</h2>
                <p style={{ color: "#6b7280", fontSize: 14 }}>Your resource has been shared with the community.</p>
                <button onClick={() => setSuccess(false)} style={{
                  marginTop: 20, padding: "10px 24px", borderRadius: 12, border: "none",
                  background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff",
                  fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                }}>Upload Another</button>
              </div>
            )}

            {!success && (
              <>
                <div style={{ textAlign: "center", marginBottom: 28 }}>
                  <h1 style={{ fontSize: 26, fontWeight: 800, color: "#f0fdf4", letterSpacing: "-0.02em", marginBottom: 8 }}>Upload Resource</h1>
                  <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.5 }}>Share study materials with the community</p>
                </div>

                <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                  {/* Title */}
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>Title *</label>
                    <div className="up-field" style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(0,0,0,0.3)", border: "1.5px solid rgba(75,85,99,0.4)", borderRadius: 14, padding: "0 16px", height: 52 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. NFA Construction Notes"
                        style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#e5e7eb", fontSize: 15, fontFamily: "'Outfit', sans-serif" }} />
                      {title && <span style={{ color: "#22c55e", fontSize: 16 }}>✓</span>}
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>Subject *</label>
                    <div className="up-field" style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(0,0,0,0.3)", border: "1.5px solid rgba(75,85,99,0.4)", borderRadius: 14, padding: "0 16px", height: 52 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>
                      <select value={subject} onChange={(e) => setSubject(e.target.value)} style={selectStyle}>
                        <option value="" style={{ background: "#111827" }}>Select a subject</option>
                        {SUBJECT_OPTIONS.map((s) => <option key={s} value={s} style={{ background: "#111827" }}>{s}</option>)}
                        <option value="Other" style={{ background: "#111827" }}>Other</option>
                      </select>
                    </div>
                    {subject === "Other" && (
                      <div className="up-field" style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(0,0,0,0.2)", border: "1.5px solid rgba(75,85,99,0.3)", borderRadius: 14, padding: "0 16px", height: 48, marginTop: 8 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                        <input type="text" value={customSubject} onChange={(e) => setCustomSubject(e.target.value)} placeholder="Type your subject..."
                          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#e5e7eb", fontSize: 13, fontFamily: "'Outfit', sans-serif" }} />
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>Description *</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                      placeholder="What's in this resource? Who is it helpful for?"
                      className="up-field" style={textareaStyle} />
                  </div>

                  {/* File Drop Zone */}
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>File *</label>
                    <div
                      onClick={() => fileRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      style={{
                        border: `2px dashed ${dragOver ? "#22c55e" : file ? "rgba(34,197,94,0.3)" : "rgba(75,85,99,0.4)"}`,
                        borderRadius: 16, padding: file ? "16px 20px" : "32px 20px",
                        textAlign: "center", cursor: "pointer",
                        background: dragOver ? "rgba(34,197,94,0.05)" : file ? "rgba(34,197,94,0.03)" : "rgba(0,0,0,0.2)",
                        transition: "all 0.3s",
                      }}>
                      <input ref={fileRef} type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ display: "none" }} />

                      {file ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(34,197,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                            {getFileIcon(file.name)}
                          </div>
                          <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: "#e5e7eb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</p>
                            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{formatSize(file.size)} · {file.type.split("/").pop()?.toUpperCase()}</p>
                          </div>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }}
                            style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "none", cursor: "pointer", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                          </button>
                        </div>
                      ) : (
                        <>
                          <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.6 }}>📁</div>
                          <p style={{ color: "#9ca3af", fontSize: 14, fontWeight: 500 }}>
                            <span style={{ color: "#4ade80", fontWeight: 700 }}>Click to browse</span> or drag & drop
                          </p>
                          <p style={{ color: "#4b5563", fontSize: 12, marginTop: 4 }}>PDF, DOCX, PPTX, Images, Videos — up to 50MB</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  {message && !success && (
                    <div style={{
                      background: isError ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)",
                      border: `1px solid ${isError ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`,
                      borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <span style={{ fontSize: 14 }}>{isError ? "⚠️" : "✅"}</span>
                      <p style={{ color: isError ? "#fca5a5" : "#4ade80", fontSize: 13, fontWeight: 500 }}>{message}</p>
                    </div>
                  )}

                  {/* Submit — glowing */}
                  <button type="submit" disabled={loading}
                    className={loading ? "" : "glow-btn"}
                    style={{
                      width: "100%", height: 52, borderRadius: 14,
                      background: loading ? "rgba(75,85,99,0.4)" : "linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)",
                      color: "#fff", fontSize: 15, fontWeight: 700,
                      cursor: loading ? "not-allowed" : "pointer",
                      fontFamily: "'Outfit', sans-serif", marginTop: 4,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      transition: "transform 0.3s",
                    }}>
                    {loading ? (
                      <>
                        <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" /><path d="M12 2a10 10 0 019.95 9" stroke="#fff" strokeWidth="3" strokeLinecap="round" /></svg>
                        Uploading...
                      </>
                    ) : (
                      <>
                        Upload Resource
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
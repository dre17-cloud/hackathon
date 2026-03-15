"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const subjectOptions = [
  "Mathematics", "English", "Biology", "Chemistry", "Physics",
  "Information Technology", "Computer Science", "Theory of Computation",
  "Data Structures", "Operating Systems", "Database Systems",
  "Accounting", "Economics", "Other",
];

const learningStyleOptions = [
  "Reading notes", "Watching videos", "Practice questions",
  "Step-by-step explanations", "Group study", "Visual diagrams", "Audio explanations",
];

const resourceOptions = [
  "Notes", "Videos", "Flashcards", "Quizzes",
  "Past papers", "Worked examples", "Mind maps",
];

const STEPS = [
  { icon: "🎓", name: "Academic Profile", desc: "Tell us about your academic background" },
  { icon: "📚", name: "Subjects", desc: "Select your subjects and areas you need help with" },
  { icon: "🧠", name: "Learning Preferences", desc: "How do you learn best?" },
  { icon: "🤝", name: "Study Matching", desc: "Set your goals and matching preferences" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);

  const [formData, setFormData] = useState({
    role: "",
    educationLevel: "",
    schoolName: "",
    yearLevel: "",
    programme: "",
    subjects: [] as string[],
    strugglingSubjects: [] as string[],
    strugglingTopics: "",
    learningStyles: [] as string[],
    preferredResources: [] as string[],
    studyTime: "",
    studyGoal: "",
    wantsStudyPartner: "",
  });

  const [otherSubject, setOtherSubject] = useState("");
  const [otherStrugglingSubject, setOtherStrugglingSubject] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleCheckboxChange(field: "subjects" | "strugglingSubjects" | "learningStyles" | "preferredResources", value: string) {
    setFormData((prev) => {
      const curr = prev[field];
      return { ...prev, [field]: curr.includes(value) ? curr.filter((i) => i !== value) : [...curr, value] };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!formData.role || !formData.educationLevel || !formData.schoolName || !formData.yearLevel || !formData.programme) {
      setError("Please fill in all required fields.");
      setStep(0);
      return;
    }
    if (formData.subjects.length === 0) {
      setError("Please choose at least one subject.");
      setStep(1);
      return;
    }
    if (formData.learningStyles.length === 0) {
      setError("Please choose at least one learning style.");
      setStep(2);
      return;
    }

    let finalSubjects = [...formData.subjects];
    if (finalSubjects.includes("Other") && otherSubject.trim() !== "") {
      finalSubjects = finalSubjects.filter((s) => s !== "Other");
      finalSubjects.push(otherSubject);
    }

    let finalStrugglingSubjects = [...formData.strugglingSubjects];
    if (finalStrugglingSubjects.includes("Other") && otherStrugglingSubject.trim() !== "") {
      finalStrugglingSubjects = finalStrugglingSubjects.filter((s) => s !== "Other");
      finalStrugglingSubjects.push(otherStrugglingSubject);
    }

    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    const { error: dbError } = await supabase.from("user_preferences").insert({
      user_id: userId,
      role: formData.role,
      education_level: formData.educationLevel,
      school_name: formData.schoolName,
      year_level: formData.yearLevel,
      programme: formData.programme,
      subjects: finalSubjects,
      struggling_subjects: finalStrugglingSubjects,
      struggling_topics: formData.strugglingTopics,
      learning_styles: formData.learningStyles,
      preferred_resources: formData.preferredResources,
      study_time: formData.studyTime,
      study_goal: formData.studyGoal,
      wants_study_partner: formData.wantsStudyPartner,
    });


    if (dbError) {
      console.error("Supabase error:", dbError);
      setError(dbError.message);
      setSaving(false);
      return;
    }

    const email = userData.user?.email || "";
    await supabase.from("profiles").upsert(
      { id: userId, email, display_name: email.split("@")[0] },
      { onConflict: "id" }
    );

    setSaving(false);
    alert("Survey submitted successfully!");
    router.push("/dashboard");
  }

  const progressPct = ((step + 1) / STEPS.length) * 100;
  const iconColor = "#6b7280";

  function Label({ children }: { children: React.ReactNode }) {
    return (
      <label style={{
        display: "block", fontSize: 12, fontWeight: 600, color: "#9ca3af",
        marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase",
      }}>{children}</label>
    );
  }

  function InputField({ icon, name, value, placeholder }: { icon: React.ReactNode; name: string; value: string; placeholder: string }) {
    return (
      <div className="ob-field" style={{
        display: "flex", alignItems: "center", gap: 12,
        background: "rgba(0,0,0,0.3)", border: "1.5px solid rgba(75,85,99,0.4)",
        borderRadius: 14, padding: "0 16px", height: 52,
      }}>
        {icon}
        <input type="text" name={name} value={value} onChange={handleChange} placeholder={placeholder}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#e5e7eb", fontSize: 15, fontFamily: "'Outfit', sans-serif" }} />
        {value && <span style={{ color: "#22c55e", fontSize: 16 }}>✓</span>}
      </div>
    );
  }

  function SelectField({ icon, name, value, placeholder, options }: { icon: React.ReactNode; name: string; value: string; placeholder: string; options: { v: string; l: string }[] }) {
    return (
      <div className="ob-field" style={{
        display: "flex", alignItems: "center", gap: 12,
        background: "rgba(0,0,0,0.3)", border: "1.5px solid rgba(75,85,99,0.4)",
        borderRadius: 14, padding: "0 16px", height: 52,
      }}>
        {icon}
        <select name={name} value={value} onChange={handleChange}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: value ? "#e5e7eb" : "#6b7280", fontSize: 15, fontFamily: "'Outfit', sans-serif", appearance: "none" }}>
          <option value="" style={{ background: "#111827" }}>{placeholder}</option>
          {options.map((o) => <option key={o.v} value={o.v} style={{ background: "#111827" }}>{o.l}</option>)}
        </select>
      </div>
    );
  }

  function Pill({ label, selected, color, onClick }: { label: string; selected: boolean; color: "green" | "blue" | "purple"; onClick: () => void }) {
    const colors = {
      green: { bg: "rgba(34,197,94,0.15)", border: "rgba(34,197,94,0.5)", text: "#4ade80" },
      blue: { bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.5)", text: "#60a5fa" },
      purple: { bg: "rgba(168,85,247,0.15)", border: "rgba(168,85,247,0.5)", text: "#c084fc" },
    };
    const c = colors[color];
    return (
      <button type="button" onClick={onClick} style={{
        padding: "9px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer",
        fontFamily: "'Outfit', sans-serif", border: "1.5px solid", transition: "all 0.2s",
        background: selected ? c.bg : "rgba(0,0,0,0.3)",
        borderColor: selected ? c.border : "rgba(75,85,99,0.3)",
        color: selected ? c.text : "#6b7280",
      }}>
        {selected ? "✓ " : ""}{label}
      </button>
    );
  }

  const Svg = ({ d }: { d: string }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
  );

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
        @keyframes float2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-30px,20px)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeStep { from{opacity:0;transform:translateX(10px)} to{opacity:1;transform:translateX(0)} }
        .ob-page * { font-family: 'Outfit', sans-serif; }
        .ob-field { transition: all 0.3s cubic-bezier(0.4,0,0.2,1); }
        .ob-field:focus-within { border-color: #22c55e !important; box-shadow: 0 0 0 3px rgba(34,197,94,0.1); transform: translateY(-1px); }
        .step-content { animation: fadeStep 0.3s ease forwards; }
      `}</style>

      <main className="ob-page animated-bg min-h-screen relative overflow-hidden px-4 py-10">

        {/* Background */}
        <div style={{ position: "absolute", top: "5%", left: "15%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 70%)", animation: "float1 20s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "10%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)", animation: "float2 25s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(34,197,94,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.02) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <form onSubmit={handleSubmit} style={{ maxWidth: 680, margin: "0 auto", position: "relative", zIndex: 10, animation: mounted ? "slideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards" : "none", opacity: mounted ? 1 : 0 }}>

          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg, #22c55e, #10b981)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(34,197,94,0.3)", fontSize: 20 }}>📚</div>
              <span style={{ fontSize: 24, fontWeight: 800, background: "linear-gradient(135deg, #22c55e, #10b981)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ICONNECT</span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#f0fdf4", marginTop: 16, letterSpacing: "-0.02em" }}>Onboarding Survey</h1>
            <p style={{ color: "#6b7280", fontSize: 14 }}>Help us personalize your study experience</p>
          </div>

          {/* Step indicators */}
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {STEPS.map((s, i) => (
              <button type="button" key={i} onClick={() => setStep(i)} style={{
                flex: 1, padding: "10px 0", borderRadius: 12, border: "1.5px solid",
                background: step === i ? "rgba(34,197,94,0.1)" : "rgba(0,0,0,0.2)",
                borderColor: step === i ? "rgba(34,197,94,0.4)" : i < step ? "rgba(34,197,94,0.2)" : "rgba(75,85,99,0.15)",
                cursor: "pointer", textAlign: "center", transition: "all 0.3s",
              }}>
                <div style={{ fontSize: 16 }}>{s.icon}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: step === i ? "#4ade80" : i < step ? "#22c55e" : "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>{s.name}</div>
              </button>
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ height: 3, borderRadius: 2, background: "rgba(75,85,99,0.2)", marginBottom: 20, overflow: "hidden" }}>
            <div style={{ width: `${progressPct}%`, height: "100%", background: "linear-gradient(90deg, #22c55e, #10b981)", transition: "width 0.5s ease", borderRadius: 2 }} />
          </div>

          {/* Glass card */}
          <div style={{
            background: "linear-gradient(145deg, rgba(15,23,42,0.8), rgba(15,23,42,0.6))",
            backdropFilter: "blur(20px)", border: "1px solid rgba(34,197,94,0.1)",
            borderRadius: 24, padding: "32px 28px",
            boxShadow: "0 25px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset",
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#f0fdf4", marginBottom: 4 }}>{STEPS[step].icon} {STEPS[step].name}</h2>
            <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 24 }}>{STEPS[step].desc}</p>

            {/* ═══ STEP 0 ═══ */}
            {step === 0 && (
              <div className="step-content" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <Label>Role *</Label>
                    <SelectField icon={<Svg d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z" />} name="role" value={formData.role} placeholder="Select role" options={[{ v: "Student", l: "Student" }, { v: "Teacher", l: "Teacher" }]} />
                  </div>
                  <div>
                    <Label>Education Level *</Label>
                    <SelectField icon={<Svg d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />} name="educationLevel" value={formData.educationLevel} placeholder="Select level" options={[{ v: "Secondary", l: "Secondary / High School" }, { v: "College", l: "College" }, { v: "University", l: "University" }]} />
                  </div>
                </div>
                <div>
                  <Label>School Name *</Label>
                  <InputField icon={<Svg d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10" />} name="schoolName" value={formData.schoolName} placeholder="Enter your school" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <Label>Year / Grade *</Label>
                    <InputField icon={<Svg d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />} name="yearLevel" value={formData.yearLevel} placeholder="e.g. Grade 11, 2nd Year" />
                  </div>
                  <div>
                    <Label>Programme / Degree *</Label>
                    <InputField icon={<Svg d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />} name="programme" value={formData.programme} placeholder="e.g. Computer Science" />
                  </div>
                </div>
              </div>
            )}

            {/* ═══ STEP 1 ═══ */}
            {step === 1 && (
              <div className="step-content" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <Label>What subjects are you currently doing? {formData.subjects.length > 0 && <span style={{ color: "#22c55e" }}>({formData.subjects.length} selected)</span>}</Label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {subjectOptions.map((s) => <Pill key={s} label={s} selected={formData.subjects.includes(s)} color="green" onClick={() => handleCheckboxChange("subjects", s)} />)}
                  </div>
                  {formData.subjects.includes("Other") && (
                    <div className="ob-field" style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(0,0,0,0.2)", border: "1.5px solid rgba(75,85,99,0.3)", borderRadius: 14, padding: "0 16px", height: 48, marginTop: 10 }}>
                      <input type="text" placeholder="Type your subject..." value={otherSubject} onChange={(e) => setOtherSubject(e.target.value)}
                        style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#e5e7eb", fontSize: 13, fontFamily: "'Outfit', sans-serif" }} />
                    </div>
                  )}
                </div>
                <div>
                  <Label>Which subjects are you struggling with?</Label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {subjectOptions.map((s) => <Pill key={s} label={s} selected={formData.strugglingSubjects.includes(s)} color="blue" onClick={() => handleCheckboxChange("strugglingSubjects", s)} />)}
                  </div>
                  {formData.strugglingSubjects.includes("Other") && (
                    <div className="ob-field" style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(0,0,0,0.2)", border: "1.5px solid rgba(75,85,99,0.3)", borderRadius: 14, padding: "0 16px", height: 48, marginTop: 10 }}>
                      <input type="text" placeholder="Type struggling subject..." value={otherStrugglingSubject} onChange={(e) => setOtherStrugglingSubject(e.target.value)}
                        style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#e5e7eb", fontSize: 13, fontFamily: "'Outfit', sans-serif" }} />
                    </div>
                  )}
                </div>
                <div>
                  <Label>Specific topics you need help with</Label>
                  <textarea name="strugglingTopics" value={formData.strugglingTopics} onChange={handleChange} rows={3} placeholder="e.g. Regular expressions, algebra, photosynthesis" className="ob-field"
                    style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1.5px solid rgba(75,85,99,0.4)", borderRadius: 14, padding: "14px 16px", color: "#e5e7eb", fontSize: 14, fontFamily: "'Outfit', sans-serif", outline: "none", resize: "vertical" }} />
                </div>
              </div>
            )}

            {/* ═══ STEP 2 ═══ */}
            {step === 2 && (
              <div className="step-content" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <Label>How do you learn best? {formData.learningStyles.length > 0 && <span style={{ color: "#22c55e" }}>({formData.learningStyles.length})</span>}</Label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {learningStyleOptions.map((s) => <Pill key={s} label={s} selected={formData.learningStyles.includes(s)} color="green" onClick={() => handleCheckboxChange("learningStyles", s)} />)}
                  </div>
                </div>
                <div>
                  <Label>Preferred study resources</Label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {resourceOptions.map((s) => <Pill key={s} label={s} selected={formData.preferredResources.includes(s)} color="purple" onClick={() => handleCheckboxChange("preferredResources", s)} />)}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <Label>When do you usually study?</Label>
                    <SelectField icon={<Svg d="M12 2a10 10 0 100 20 10 10 0 000-20zM12 6v6l4 2" />} name="studyTime" value={formData.studyTime} placeholder="Select time" options={[{ v: "Morning", l: "Morning" }, { v: "Afternoon", l: "Afternoon" }, { v: "Evening", l: "Evening" }, { v: "Late Night", l: "Late Night" }]} />
                  </div>
                  <div>
                    <Label>Main academic goal</Label>
                    <SelectField icon={<Svg d="M12 2a10 10 0 100 20 10 10 0 000-20zM12 12a2 2 0 100-4 2 2 0 000 4zM12 12a6 6 0 100-12" />} name="studyGoal" value={formData.studyGoal} placeholder="Select goal" options={[
                      { v: "Understand difficult topics", l: "Understand difficult topics" },
                      { v: "Improve grades", l: "Improve grades" },
                      { v: "Prepare for exams", l: "Prepare for exams" },
                      { v: "Find better study resources", l: "Find better resources" },
                      { v: "Find study partners", l: "Find study partners" },
                    ]} />
                  </div>
                </div>
              </div>
            )}

            {/* ═══ STEP 3 ═══ */}
            {step === 3 && (
              <div className="step-content" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <Label>Would you like to be matched with study partners?</Label>
                  <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                    {["Yes", "No"].map((opt) => (
                      <button type="button" key={opt} onClick={() => setFormData((p) => ({ ...p, wantsStudyPartner: opt }))}
                        style={{
                          flex: 1, padding: "16px 0", borderRadius: 14, border: "1.5px solid",
                          fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                          background: formData.wantsStudyPartner === opt ? (opt === "Yes" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.1)") : "rgba(0,0,0,0.3)",
                          borderColor: formData.wantsStudyPartner === opt ? (opt === "Yes" ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.3)") : "rgba(75,85,99,0.3)",
                          color: formData.wantsStudyPartner === opt ? (opt === "Yes" ? "#4ade80" : "#fca5a5") : "#6b7280",
                        }}>
                        {formData.wantsStudyPartner === opt ? "✓ " : ""}{opt === "Yes" ? "👥 Yes, match me!" : "🚫 No thanks"}
                      </button>
                    ))}
                  </div>
                </div>
                {formData.wantsStudyPartner === "Yes" && (
                  <div style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 14, padding: 16 }}>
                    <p style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.7 }}>
                      🎯 You&apos;ll be matched with students who share your <span style={{ color: "#4ade80", fontWeight: 600 }}>subjects</span>, <span style={{ color: "#60a5fa", fontWeight: 600 }}>struggling areas</span>, and attend the same <span style={{ color: "#c084fc", fontWeight: 600 }}>school/programme</span>. You can message them, share resources, and study together!
                    </p>
                  </div>
                )}
                {/* Summary */}
                <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 14, padding: 16, border: "1px solid rgba(75,85,99,0.2)" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>📋 Your Summary</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13, color: "#9ca3af" }}>
                    <div>🎭 <span style={{ color: "#e5e7eb" }}>{formData.role || "—"}</span></div>
                    <div>🎓 <span style={{ color: "#e5e7eb" }}>{formData.educationLevel || "—"}</span></div>
                    <div>🏫 <span style={{ color: "#e5e7eb" }}>{formData.schoolName || "—"}</span></div>
                    <div>📅 <span style={{ color: "#e5e7eb" }}>{formData.yearLevel || "—"}</span></div>
                    <div style={{ gridColumn: "1 / -1" }}>📚 <span style={{ color: "#e5e7eb" }}>{formData.programme || "—"}</span></div>
                  </div>
                  {formData.subjects.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <p style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", marginBottom: 6 }}>Subjects</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{formData.subjects.map((s) => <span key={s} style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: "rgba(34,197,94,0.1)", color: "#4ade80" }}>{s}</span>)}</div>
                    </div>
                  )}
                  {formData.learningStyles.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <p style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", marginBottom: 6 }}>Learning Styles</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{formData.learningStyles.map((s) => <span key={s} style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: "rgba(59,130,246,0.1)", color: "#60a5fa" }}>{s}</span>)}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
                <span>⚠️</span>
                <p style={{ color: "#fca5a5", fontSize: 13, fontWeight: 500 }}>{error}</p>
              </div>
            )}

            {/* Navigation */}
            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              {step > 0 && (
                <button type="button" onClick={() => setStep(step - 1)}
                  style={{
                    flex: 1, height: 52, borderRadius: 14, border: "1.5px solid rgba(75,85,99,0.4)",
                    background: "rgba(0,0,0,0.3)", color: "#9ca3af", fontSize: 15, fontWeight: 600,
                    cursor: "pointer", fontFamily: "'Outfit', sans-serif", transition: "all 0.3s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(107,114,128,0.6)"; e.currentTarget.style.color = "#e5e7eb" }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(75,85,99,0.4)"; e.currentTarget.style.color = "#9ca3af" }}>
                  ← Back
                </button>
              )}

              {step < 3 ? (
                <button type="button" onClick={() => setStep(step + 1)}
                  style={{
                    flex: step === 0 ? 1 : 2, height: 52, borderRadius: 14, border: "none",
                    background: "linear-gradient(135deg, #22c55e, #16a34a, #15803d)",
                    color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
                    fontFamily: "'Outfit', sans-serif", transition: "all 0.3s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: "0 4px 20px rgba(34,197,94,0.2)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 40px rgba(34,197,94,0.3)" }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(34,197,94,0.2)" }}>
                  Continue →
                </button>
              ) : (
                /* ── GLOWING SUBMIT BUTTON ── */
                <button type="submit" disabled={saving}
                  className={saving ? "" : "glow-btn"}
                  style={{
                    flex: 2, height: 52, borderRadius: 14,
                    background: saving ? "rgba(75,85,99,0.4)" : "linear-gradient(135deg, #22c55e, #16a34a, #15803d)",
                    color: "#fff", fontSize: 15, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
                    fontFamily: "'Outfit', sans-serif", transition: "transform 0.3s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                  {saving ? (
                    <><svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/><path d="M12 2a10 10 0 019.95 9" stroke="#fff" strokeWidth="3" strokeLinecap="round"/></svg> Submitting...</>
                  ) : (
                    <>Submit Survey ✓</>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </main>
    </>
  );
}
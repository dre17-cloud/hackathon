// app/api/ai/route.ts
const GROQ_API_KEY = process.env.GROQ_API_KEY || ""
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || ""

function buildDashboardPrompt(profile: any): string {
  return `You are an AI study assistant. A student completed this survey:
Role: ${profile.role || "Student"}
Education Level: ${profile.education_level || "N/A"}
School: ${profile.school_name || "N/A"}
Programme: ${profile.programme || "N/A"}
Subjects: ${Array.isArray(profile.subjects) ? profile.subjects.join(", ") : profile.subjects || "N/A"}
Struggling Subjects: ${Array.isArray(profile.struggling_subjects) ? profile.struggling_subjects.join(", ") : profile.struggling_subjects || "N/A"}
Topics they struggle with: ${profile.struggling_topics || "N/A"}
Learning Styles: ${Array.isArray(profile.learning_styles) ? profile.learning_styles.join(", ") : profile.learning_styles || "N/A"}
Preferred Resources: ${Array.isArray(profile.preferred_resources) ? profile.preferred_resources.join(", ") : profile.preferred_resources || "N/A"}
Study Time: ${profile.study_time || "N/A"}
Study Goal: ${profile.study_goal || "N/A"}

Generate a personalized study dashboard including:
1. Study recommendations tailored to their learning styles
2. Topics they should focus on
3. Suggested study methods
4. Suggested resources
5. A motivational message
Keep it concise and actionable.`
}

function detectIntent(topic: string): { type: "youtube" | "google" | "academic"; query: string } {
  const t = topic.toLowerCase().trim()
  const youtubePatterns = ["youtube", "yt video", "video on", "video about", "video for", "watch a video", "show me a video", "find a video", "give me a video"]
  const googlePatterns = ["google", "search for", "look up", "find me", "search up"]
  if (youtubePatterns.some((p) => t.includes(p))) {
    const cleaned = t.replace(/give me a?n?/gi, "").replace(/show me a?n?/gi, "").replace(/find me a?n?/gi, "").replace(/find a?n?/gi, "").replace(/watch a?n?/gi, "").replace(/youtube video (on|about|for|of)?/gi, "").replace(/yt video (on|about|for|of)?/gi, "").replace(/video (on|about|for|of)?/gi, "").replace(/youtube/gi, "").trim()
    return { type: "youtube", query: cleaned || topic }
  }
  if (googlePatterns.some((p) => t.includes(p))) {
    const cleaned = t.replace(/google/gi, "").replace(/search for/gi, "").replace(/look up/gi, "").replace(/find me/gi, "").replace(/search up/gi, "").trim()
    return { type: "google", query: cleaned || topic }
  }
  return { type: "academic", query: topic }
}

function buildSearchPrompt(
  topic: string,
  learningStyles: string[],
  availableFiles: { name: string; subject: string; learning_style: string }[]
): string {
  const fileList = availableFiles.length > 0
    ? availableFiles.map((f) => `- "${f.name}" (Subject: ${f.subject})`).join("\n")
    : "No files uploaded yet."

  // ── If NO learning styles selected → show full overview ──────────────────
  if (learningStyles.length === 0) {
    return `You are a knowledgeable educator. Provide a thorough educational response about: "${topic}"

Student's uploaded files:
${fileList}

Respond with EXACTLY this structure:

**📚 What is ${topic}?**
Write 3-4 detailed paragraphs explaining "${topic}". Include definition, key concepts, how it works, and why it matters.

**🔑 Key Facts**
List 8-10 specific facts about "${topic}".

**🌐 Recommended Resources**
- Google Scholar: https://scholar.google.com/scholar?q=${encodeURIComponent(topic)}
- Wikipedia: https://en.wikipedia.org/wiki/${encodeURIComponent(topic.replace(/ /g, "_"))}
- Khan Academy: https://www.khanacademy.org/search?search_again=1&page_search_query=${encodeURIComponent(topic)}
- YouTube: https://www.youtube.com/results?search_query=${encodeURIComponent(topic + " explained")}

**📁 Relevant Uploaded Files**
From the files listed above, identify any related to "${topic}". If none, say "No matching files found."

**💡 Study Tips**
Give 4 practical study tips for "${topic}".

**🔗 Related Topics**
List 5 related topics.`
  }

  // ── If learning styles ARE selected → ONLY show those sections ───────────
  const sections: string[] = []

  if (learningStyles.includes("Practice questions")) {
    sections.push(`**📝 Practice Questions for ${topic}**
Generate exactly 10 practice questions about "${topic}". Use a mix of:
- Multiple choice (with 4 options A/B/C/D and the correct answer marked)
- Short answer questions
- True/False questions
After all questions, provide an **Answers** section with full explanations for each.`)
  }

  if (learningStyles.includes("Reading notes")) {
    sections.push(`**📖 Study Notes: ${topic}**
Write comprehensive, well-structured study notes about "${topic}" that a student can use for revision. Include:
- Key definitions
- Main concepts broken into clear sections with subheadings
- Important formulas or rules (if applicable)
- Summary at the end`)
  }

  if (learningStyles.includes("Watching videos")) {
    sections.push(`**🎥 Video Resources for ${topic}**
List 6 specific, real YouTube videos or online courses about "${topic}". For each provide:
- Video title
- Channel name
- Direct YouTube search link: https://www.youtube.com/results?search_query=${encodeURIComponent(topic + " ")}[video title]
- One sentence on what it covers
Also mention: https://www.youtube.com/results?search_query=${encodeURIComponent(topic + " explained")}`)
  }

  if (learningStyles.includes("Visual diagrams")) {
    sections.push(`**📊 Visual Summary: ${topic}**
Describe in detail 2-3 diagrams or visual aids that would help understand "${topic}":
1. For each diagram, describe exactly what it shows, what labels it would have, and how the elements connect
2. Then provide a text-based ASCII or structured visual representation where possible
3. Explain how to draw or recreate each diagram`)
  }

  if (learningStyles.includes("Step-by-step explanations")) {
    sections.push(`**🔢 Step-by-Step: ${topic}**
Break down "${topic}" into a clear, numbered step-by-step explanation:
- Start with the most basic concept
- Build up to more complex ideas
- Use simple language
- Include an example at each step where relevant
- End with a worked example that applies all the steps`)
  }

  if (learningStyles.includes("Audio explanations")) {
    sections.push(`**🎧 Audio & Podcast Resources for ${topic}**
List 5-6 podcasts, audiobooks, or audio lectures about "${topic}":
- Podcast name and episode title
- Where to find it (Spotify, Apple Podcasts, etc.) with search link
- What it covers in one sentence
Also suggest: https://www.youtube.com/results?search_query=${encodeURIComponent(topic + " lecture audio")}`)
  }

  if (learningStyles.includes("Group study")) {
    sections.push(`**👥 Group Study Plan: ${topic}**
Provide a complete group study session plan for "${topic}":
1. Ice-breaker activity to start (5 min)
2. 4-5 discussion questions the group should debate
3. A group quiz with 5 questions (include answers)
4. A collaborative activity or project idea
5. How to divide the topic among group members
6. Tips for keeping the session productive`)
  }

  // Always append file recommendations
  sections.push(`**📁 Relevant Uploaded Files**
From these uploaded files: ${fileList}
Identify any files related to "${topic}" and explain why they are relevant. If none match, say "No matching files found."`)

  return `You are a knowledgeable educator. A student is studying: "${topic}"
They have specifically requested content in these formats ONLY: ${learningStyles.join(", ")}

Student's uploaded files:
${fileList}

IMPORTANT: ONLY provide the sections below. Do NOT add any other sections, introductions, or summaries outside of what is asked.

${sections.join("\n\n")}

Write detailed, accurate, educational content. Be thorough within each section.`
}

async function callGroq(prompt: string): Promise<string | null> {
  if (!GROQ_API_KEY) return null
  const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"]
  for (const model of models) {
    try {
      console.log(`[AI] Trying Groq ${model}...`)
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "You are a knowledgeable educational assistant. Follow the exact structure requested. Only output the sections asked for — nothing else." },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 4096,
        }),
      })
      if (!res.ok) { const e = await res.text(); console.error(`[AI] ❌ Groq ${model}: ${res.status} — ${e.slice(0, 200)}`); continue }
      const data = await res.json()
      const text = data.choices?.[0]?.message?.content
      if (text && text.trim().length > 50) { console.log(`[AI] ✅ Groq ${model} (${text.length} chars)`); return text }
    } catch (err: any) { console.error(`[AI] ❌ Groq ${model}: ${err?.message}`) }
  }
  return null
}

async function callGemini(prompt: string): Promise<string | null> {
  if (!GOOGLE_API_KEY) return null
  const models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-pro"]
  for (const model of models) {
    try {
      console.log(`[AI] Trying Gemini ${model}...`)
      const { GoogleGenerativeAI } = await import("@google/generative-ai")
      const client = new GoogleGenerativeAI(GOOGLE_API_KEY)
      const gemModel = client.getGenerativeModel({ model })
      const result = await gemModel.generateContent(prompt)
      const text = result.response.text()
      if (text && text.trim().length > 50) { console.log(`[AI] ✅ Gemini ${model} (${text.length} chars)`); return text }
    } catch (err: any) { console.error(`[AI] ❌ Gemini ${model}: ${err?.message}`) }
  }
  return null
}

async function getAIResponse(prompt: string): Promise<string | null> {
  return (await callGroq(prompt)) ?? (await callGemini(prompt)) ?? (await callGroq(prompt.split("\n").slice(0, 5).join("\n"))) ?? null
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("[AI] ─── Request ───")
    console.log("[AI] Groq key:", GROQ_API_KEY ? `${GROQ_API_KEY.slice(0, 12)}...` : "❌ NOT SET")

    if (!GROQ_API_KEY && !GOOGLE_API_KEY) {
      return Response.json({ response: `**⚠️ No API Key**\n\nAdd GROQ_API_KEY to .env.local (free at https://console.groq.com/keys) then restart.` })
    }

    if (body.topic) {
      const { topic, learningStyles = [], availableFiles = [] } = body
      console.log(`[AI] Search: "${topic}" | Styles: ${learningStyles.join(", ") || "none"}`)
      if (!topic.trim()) return Response.json({ response: "Please provide a topic." }, { status: 400 })

      const intent = detectIntent(topic)
      console.log(`[AI] Intent: ${intent.type}`)

      if (intent.type === "youtube") {
        const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(intent.query || topic)}`
        return Response.json({ response: `🎬 **YouTube Search**\n\nHere's a YouTube search for **"${intent.query || topic}"**:\n\n👉 [Open YouTube Search](${url})\n\n\`${url}\`` })
      }

      if (intent.type === "google") {
        const url = `https://www.google.com/search?q=${encodeURIComponent(intent.query || topic)}`
        return Response.json({ response: `🔍 **Google Search**\n\nHere's a Google search for **"${intent.query || topic}"**:\n\n👉 [Open Google Search](${url})\n\n\`${url}\`` })
      }

      const prompt = buildSearchPrompt(topic, learningStyles, availableFiles)
      const response = await getAIResponse(prompt)
      if (response) return Response.json({ response })

      return Response.json({
        response:
          `**📚 "${topic}"**\n\nCould not reach AI. Search manually:\n\n` +
          `- [Google Scholar](https://scholar.google.com/scholar?q=${encodeURIComponent(topic)})\n` +
          `- [Wikipedia](https://en.wikipedia.org/wiki/${encodeURIComponent(topic.replace(/ /g, "_"))})\n` +
          `- [Khan Academy](https://www.khanacademy.org/search?search_again=1&page_search_query=${encodeURIComponent(topic)})\n` +
          `- [YouTube](https://www.youtube.com/results?search_query=${encodeURIComponent(topic + " explained")})`,
      })
    }

    if (body.subjects) {
      const prompt = buildDashboardPrompt(body)
      const response = await getAIResponse(prompt)
      if (response) return Response.json({ response })
      return Response.json({ response: "AI insights temporarily unavailable.\n\n1. Focus on struggling topics\n2. Use active recall\n3. Study in 25-min blocks\n4. Review within 24 hours" })
    }

    return Response.json({ response: "Provide a topic or complete your survey." })
  } catch (error: any) {
    console.error("[AI] Error:", error?.message)
    return Response.json({ error: "Server error: " + (error?.message || "Unknown") }, { status: 500 })
  }
}

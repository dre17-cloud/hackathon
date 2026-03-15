// app/api/ai/route.ts
// Uses Groq (FREE, fast) as primary, Gemini as fallback

const GROQ_API_KEY = process.env.GROQ_API_KEY || ""
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || ""

// ─── Dashboard prompt ────────────────────────────────────────
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

// ─── Intent detection — runs BEFORE AI call ──────────────────
function detectIntent(topic: string): {
  type: "youtube" | "google" | "academic"
  query: string
} {
  const t = topic.toLowerCase().trim()

  const youtubePatterns = [
    "youtube", "yt video", "video on", "video about", "video for",
    "watch a video", "show me a video", "find a video", "give me a video",
  ]

  const googlePatterns = [
    "google", "search for", "look up", "find me", "search up",
  ]

  if (youtubePatterns.some((p) => t.includes(p))) {
    // Strip filler words to get the actual search query
    const cleaned = t
      .replace(/give me a?n?/gi, "")
      .replace(/show me a?n?/gi, "")
      .replace(/find me a?n?/gi, "")
      .replace(/find a?n?/gi, "")
      .replace(/watch a?n?/gi, "")
      .replace(/youtube video (on|about|for|of)?/gi, "")
      .replace(/yt video (on|about|for|of)?/gi, "")
      .replace(/video (on|about|for|of)?/gi, "")
      .replace(/youtube/gi, "")
      .trim()
    return { type: "youtube", query: cleaned || topic }
  }

  if (googlePatterns.some((p) => t.includes(p))) {
    const cleaned = t
      .replace(/google/gi, "")
      .replace(/search for/gi, "")
      .replace(/look up/gi, "")
      .replace(/find me/gi, "")
      .replace(/search up/gi, "")
      .trim()
    return { type: "google", query: cleaned || topic }
  }

  return { type: "academic", query: topic }
}

// ─── Search prompt (academic only) ───────────────────────────
function buildSearchPrompt(
  topic: string,
  learningStyles: string[],
  availableFiles: { name: string; subject: string; learning_style: string }[]
): string {
  const fileList = availableFiles.length > 0
    ? availableFiles.map((f) => `- "${f.name}" (Subject: ${f.subject})`).join("\n")
    : "No files uploaded yet."
  const stylesText = learningStyles.length > 0 ? learningStyles.join(", ") : "General"

  return `You are a knowledgeable educator. Provide a thorough educational response about: "${topic}"

Student's learning styles: ${stylesText}
Student's uploaded files:
${fileList}

Respond with this EXACT structure (use ** for headers):

**📚 What is ${topic}? — Full Explanation**
Write 3-4 detailed paragraphs explaining "${topic}". Include definition, key concepts, how it works, history, real-world applications, and why it matters.

**🔑 Key Facts & Details**
List 8-10 specific, informative facts about "${topic}".

**🌐 Recommended Resources**
- Google Scholar: https://scholar.google.com/scholar?q=${encodeURIComponent(topic)}
- Wikipedia: https://en.wikipedia.org/wiki/${encodeURIComponent(topic.replace(/ /g, "_"))}
- Khan Academy: https://www.khanacademy.org/search?search_again=1&page_search_query=${encodeURIComponent(topic)}
- YouTube: https://www.youtube.com/results?search_query=${encodeURIComponent(topic + " explained")}

**📁 Relevant Uploaded Files**
Check files above. Identify any related to "${topic}". If none, say "No matching files found."

**💡 Study Tips**
Give 4 practical tips for "${topic}" based on learning styles: ${stylesText}.

**🔗 Related Topics to Explore**
List 5 related topics.

Write REAL educational content with actual facts. Be thorough.`
}

// ─── Groq API call ───────────────────────────────────────────
async function callGroq(prompt: string): Promise<string | null> {
  if (!GROQ_API_KEY) return null

  const models = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
  ]

  for (const model of models) {
    try {
      console.log(`[AI] Trying Groq ${model}...`)

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "You are a knowledgeable educational assistant. Always provide thorough, factual, detailed responses." },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 4096,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        console.error(`[AI] ❌ Groq ${model}: HTTP ${res.status} — ${errText.slice(0, 200)}`)
        continue
      }

      const data = await res.json()
      const text = data.choices?.[0]?.message?.content

      if (text && text.trim().length > 50) {
        console.log(`[AI] ✅ Groq ${model} succeeded (${text.length} chars)`)
        return text
      }

      console.log(`[AI] ⚠️ Groq ${model} empty response`)
    } catch (err: any) {
      console.error(`[AI] ❌ Groq ${model}: ${err?.message || err}`)
    }
  }

  return null
}

// ─── Gemini API call (fallback) ──────────────────────────────
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

      if (text && text.trim().length > 50) {
        console.log(`[AI] ✅ Gemini ${model} succeeded (${text.length} chars)`)
        return text
      }
    } catch (err: any) {
      console.error(`[AI] ❌ Gemini ${model}: ${err?.message || err}`)
    }
  }

  return null
}

// ─── Try all providers ───────────────────────────────────────
async function getAIResponse(prompt: string): Promise<string | null> {
  let response = await callGroq(prompt)
  if (response) return response

  response = await callGemini(prompt)
  if (response) return response

  const simplePrompt = prompt.split("\n").slice(0, 3).join("\n") + "\n\nBe detailed and educational."
  response = await callGroq(simplePrompt)
  if (response) return response

  return null
}

// ─── POST handler ────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json()

    console.log("[AI] ─── Request ───")
    console.log("[AI] Groq key:", GROQ_API_KEY ? `${GROQ_API_KEY.slice(0, 12)}...` : "❌ NOT SET")
    console.log("[AI] Gemini key:", GOOGLE_API_KEY ? `${GOOGLE_API_KEY.slice(0, 12)}...` : "not set")

    if (!GROQ_API_KEY && !GOOGLE_API_KEY) {
      return Response.json({
        response:
          `**⚠️ No API Key Configured**\n\n` +
          `You need a GROQ_API_KEY in your .env.local file.\n\n` +
          `**How to get one (FREE — takes 30 seconds):**\n` +
          `1. Go to https://console.groq.com/keys\n` +
          `2. Sign up / log in with Google\n` +
          `3. Click "Create API Key"\n` +
          `4. Add to .env.local: GROQ_API_KEY=gsk_your_key_here\n` +
          `5. Restart: npm run dev`,
      })
    }

    // ══════════ SEARCH ══════════
    if (body.topic) {
      const { topic, learningStyles = [], availableFiles = [] } = body
      console.log(`[AI] Search: "${topic}"`)

      if (!topic.trim()) {
        return Response.json({ response: "Please provide a topic." }, { status: 400 })
      }

      // ── Check intent FIRST before calling AI ──
      const intent = detectIntent(topic)
      console.log(`[AI] Intent: ${intent.type}, query: "${intent.query}"`)

      if (intent.type === "youtube") {
        const searchQuery = intent.query || topic
        const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`
        return Response.json({
          response:
            `🎬 **YouTube Search**\n\n` +
            `Here's a YouTube search for **"${searchQuery}"**:\n\n` +
            `👉 [Open YouTube Search](${url})\n\n` +
            `\`${url}\``,
        })
      }

      if (intent.type === "google") {
        const searchQuery = intent.query || topic
        const url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`
        return Response.json({
          response:
            `🔍 **Google Search**\n\n` +
            `Here's a Google search for **"${searchQuery}"**:\n\n` +
            `👉 [Open Google Search](${url})\n\n` +
            `\`${url}\``,
        })
      }

      // ── Academic — call AI ──
      const prompt = buildSearchPrompt(topic, learningStyles, availableFiles)
      const response = await getAIResponse(prompt)

      if (response) return Response.json({ response })

      return Response.json({
        response:
          `**📚 About "${topic}"**\n\n` +
          `Could not reach AI services. Search manually:\n\n` +
          `- [Google Scholar](https://scholar.google.com/scholar?q=${encodeURIComponent(topic)})\n` +
          `- [Wikipedia](https://en.wikipedia.org/wiki/${encodeURIComponent(topic.replace(/ /g, "_"))})\n` +
          `- [Khan Academy](https://www.khanacademy.org/search?search_again=1&page_search_query=${encodeURIComponent(topic)})\n` +
          `- [YouTube](https://www.youtube.com/results?search_query=${encodeURIComponent(topic + " explained")})`,
      })
    }

    // ══════════ DASHBOARD ══════════
    if (body.subjects) {
      console.log("[AI] Dashboard request")
      const prompt = buildDashboardPrompt(body)
      const response = await getAIResponse(prompt)

      if (response) return Response.json({ response })

      return Response.json({
        response:
          "AI insights temporarily unavailable.\n\n" +
          "**Study tips:**\n" +
          "1. Focus on struggling topics first\n" +
          "2. Use active recall and spaced repetition\n" +
          "3. Study in 25-minute Pomodoro blocks\n" +
          "4. Review within 24 hours\n" +
          "5. Take breaks between sessions",
      })
    }

    return Response.json({ response: "Provide a topic or complete your survey." })
  } catch (error: any) {
    console.error("[AI] Error:", error?.message || error)
    return Response.json({ error: "Server error: " + (error?.message || "Unknown") }, { status: 500 })
  }
}
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(req: Request) {

  const body = await req.json()
  const { topic, learningStyle } = body

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

  const model = genAI.getGenerativeModel({ model: "gemini-pro" })

  const prompt = `
  A student is studying ${topic}.
  Their learning style is ${learningStyle}.

  Recommend:
  1. Best way to study this topic
  2. Key concepts to focus on
  3. Good types of resources (videos, notes, exercises)
  `

  const result = await model.generateContent(prompt)

  const response = result.response.text()

  return Response.json({ response })
}

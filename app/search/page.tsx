"use client"

import { useState } from "react"

export default function SearchPage(){

  const [topic,setTopic] = useState("")
  const [result,setResult] = useState("")

  async function getAIRecommendation(topic:string){

    const res = await fetch("/api/ai",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body: JSON.stringify({
        topic: topic,
        learningStyle: "visual"
      })
    })

    const data = await res.json()

    setResult(data.response)

  }

  return(

    <main className="min-h-screen bg-gray-950 text-white p-10">

      <h1 className="text-3xl font-bold mb-6">
        Search Study Topic
      </h1>

      <input
        type="text"
        placeholder="Enter topic..."
        value={topic}
        onChange={(e)=>setTopic(e.target.value)}
        className="p-3 bg-gray-800 rounded w-full max-w-md"
      />

      <button
        onClick={()=>getAIRecommendation(topic)}
        className="bg-green-600 px-6 py-3 rounded mt-4"
      >
        Get AI Recommendation
      </button>

      {result && (
        <div className="mt-8 bg-gray-900 p-6 rounded">
          <h2 className="text-xl mb-2">AI Recommendation</h2>
          <p>{result}</p>
        </div>
      )}

    </main>

  )
}
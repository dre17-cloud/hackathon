"use client"

import { useRouter } from "next/navigation";
import { useState } from "react"
import { supabase } from "../../lib/supabase"

export default function Survey(){

  const [school,setSchool] = useState("")
  const [year,setYear] = useState("")
  const [learningStyle,setLearningStyle] = useState("")
  const [subjects,setSubjects] = useState<string[]>([])

  async function saveSurvey(){

    const { data: user } = await supabase.auth.getUser()

    await supabase.from("user_preferences").insert({
      user_id: user.user?.id,
      school: school,
      year: year,
      learning_style: learningStyle,
      subjects: subjects
    })

    alert("Survey saved!")
  }

  return(
    <main className="min-h-screen bg-gray-950 text-white p-10">

      <h1 className="text-3xl font-bold mb-6">
        Learning Survey
      </h1>

      <input
        placeholder="School"
        value={school}
        onChange={(e)=>setSchool(e.target.value)}
        className="p-3 bg-gray-800 rounded block mb-4"
      />

      <input
        placeholder="Year"
        value={year}
        onChange={(e)=>setYear(e.target.value)}
        className="p-3 bg-gray-800 rounded block mb-4"
      />

      <input
        placeholder="Learning Style (visual / reading / practice)"
        value={learningStyle}
        onChange={(e)=>setLearningStyle(e.target.value)}
        className="p-3 bg-gray-800 rounded block mb-4"
      />

      <input
        placeholder="Subjects (comma separated)"
        onChange={(e)=>setSubjects(e.target.value.split(","))}
        className="p-3 bg-gray-800 rounded block mb-6"
      />

      <button
        onClick={saveSurvey}
        className="bg-green-600 px-6 py-3 rounded"
      >
        Save Survey
      </button>

    </main>
  )
}
"use client"

import { useEffect, useState } from "react"

export default function Dashboard(){

  const [quote,setQuote] = useState("")
  const [date,setDate] = useState("")

  useEffect(()=>{

    const today = new Date().toLocaleDateString()

    setDate(today)

    const quotes = [
      "Success is the sum of small efforts repeated every day.",
      "Study hard now so life becomes easier later.",
      "Consistency beats motivation.",
      "Every expert was once a beginner.",
      "Learning never exhausts the mind."
    ]

    const randomQuote = quotes[Math.floor(Math.random()*quotes.length)]

    setQuote(randomQuote)

  },[])

  return(

    <main className="min-h-screen bg-gray-950 text-white p-10">

      {/* Header */}

      <div className="flex justify-between items-center mb-8">

        <h1 className="text-3xl font-bold">
          Dashboard
        </h1>

        <p className="text-gray-400">
          {date}
        </p>

      </div>


      {/* Inspirational Quote */}

      <div className="bg-gray-900 p-6 rounded mb-8">

        <h2 className="text-xl font-semibold mb-2">
          Daily Inspiration
        </h2>

        <p className="text-gray-300">
          "{quote}"
        </p>

      </div>


      {/* Continue Study */}

      <div className="bg-gray-900 p-6 rounded mb-8">

        <h2 className="text-xl font-semibold mb-4">
          Continue Where You Left Off
        </h2>

        <div className="bg-gray-800 p-4 rounded">
          Pumping Lemma – Theory of Computation
        </div>

      </div>


      {/* Progress Tracker */}

      <div className="bg-gray-900 p-6 rounded mb-8">

        <h2 className="text-xl font-semibold mb-4">
          Study Progress
        </h2>

        <div className="w-full bg-gray-800 rounded h-4">

          <div className="bg-green-500 h-4 rounded w-2/3"></div>

        </div>

        <p className="text-gray-400 mt-2">
          67% of weekly study goals completed
        </p>

      </div>


      {/* Study Groups */}

      <div className="bg-gray-900 p-6 rounded mb-8">

        <h2 className="text-xl font-semibold mb-4">
          Recommended Study Groups
        </h2>

        <div className="space-y-3">

          <div className="bg-gray-800 p-4 rounded">
            TOC Visual Learners – 6 members
          </div>

          <div className="bg-gray-800 p-4 rounded">
            Algorithms Problem Solvers – 4 members
          </div>

        </div>

      </div>


      {/* Reminders */}

      <div className="bg-gray-900 p-6 rounded mb-8">

        <h2 className="text-xl font-semibold mb-4">
          Reminders
        </h2>

        <ul className="text-gray-300 space-y-2">

          <li>Finish DFA practice questions</li>
          <li>Review Automata lecture notes</li>
          <li>Join TOC study group session tonight</li>

        </ul>

      </div>


      {/* AI Recommendations */}

      <div className="bg-gray-900 p-6 rounded">

        <h2 className="text-xl font-semibold mb-4">
          AI Recommended Topics
        </h2>

        <div className="space-y-3">

          <div className="bg-gray-800 p-4 rounded">
            Understanding DFA vs NFA
          </div>

          <div className="bg-gray-800 p-4 rounded">
            Pumping Lemma Proof Strategy
          </div>

          <div className="bg-gray-800 p-4 rounded">
            Regular Expressions Explained
          </div>

        </div>

      </div>

    </main>
  )

}
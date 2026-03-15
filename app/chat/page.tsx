"use client"

import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"

export default function Chat(){

  const [messages,setMessages] = useState<any[]>([])
  const [newMessage,setNewMessage] = useState("")

  async function sendMessage(){

    const { data: user } = await supabase.auth.getUser()

    await supabase.from("messages").insert({
      sender_id: user.user?.id,
      receiver_id: "PARTNER_ID_HERE",
      content: newMessage
    })

    setNewMessage("")
  }

  async function loadMessages(){

    const { data } = await supabase
      .from("messages")
      .select("*")
      .order("created_at",{ascending:true})

    setMessages(data || [])
  }

  useEffect(() => {
  loadMessages()

  const channel = supabase
    .channel("chat-room")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
      },
      (payload: any) => {
        setMessages((prev) => [...prev, payload.new])
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }

}, [])


  return(

    <main className="min-h-screen bg-gray-950 text-white p-10">

      <h1 className="text-2xl mb-6">Study Partner Chat</h1>

      <div className="bg-gray-900 p-6 rounded h-96 overflow-y-scroll">

        {messages.map((msg)=>(
          <div key={msg.id} className="mb-3">
            <p>{msg.content}</p>
          </div>
        ))}

      </div>

      <div className="flex gap-2 mt-4">

        <input
          value={newMessage}
          onChange={(e)=>setNewMessage(e.target.value)}
          className="flex-1 p-3 bg-gray-800 rounded"
          placeholder="Type message..."
        />

        <button
          onClick={sendMessage}
          className="bg-green-600 px-6 rounded"
        >
          Send
        </button>

      </div>

    </main>

  )
}

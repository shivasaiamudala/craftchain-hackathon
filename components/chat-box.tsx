"use client"

import { useState, useEffect, useRef } from "react"
import { Send } from "lucide-react"

export function ChatBox({ currentUser, externalMessages }: any) {
  const [messages, setMessages] = useState<any[]>([{ id: "1", username: "SYS", avatar: "https://api.mineatar.io/face/Herobrine", text: "Link established.", time: "NOW" }])
  const [inputText, setInputText] = useState(""); const scrollRef = useRef<any>(null)

  useEffect(() => { if (externalMessages.length > 0) setMessages(prev => [...prev, externalMessages[externalMessages.length - 1]]) }, [externalMessages])
  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  const send = () => {
    if (!inputText.trim() || !currentUser) return
    setMessages(prev => [...prev, { id: Date.now(), username: currentUser.username, avatar: currentUser.avatar, text: inputText, time: "NOW" }])
    setInputText("")
  }

  return (
    <div className="flex flex-col h-[450px] border-2 border-mc-border bg-mc-obsidian-bg rounded-md overflow-hidden shadow-xl">
      <div className="bg-mc-obsidian border-b-2 border-mc-border px-4 py-2 uppercase text-mc-gold font-bold text-[10px] tracking-widest">Team Terminal</div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className="flex gap-2 animate-in slide-in-from-bottom-1">
            <img src={m.avatar} className="w-6 h-6 pixelated border border-mc-border shrink-0" />
            <div className="flex-1 min-w-0">
              <span className={`text-[9px] font-bold ${m.username === 'SYS' ? 'text-mc-gold' : 'text-mc-grass'}`}>{m.username}</span>
              <p className="text-xs text-white/90 bg-mc-slot p-2 border border-mc-slot-border mt-0.5 break-words">{m.text}</p>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>
      <div className="p-2 bg-mc-obsidian border-t-2 border-mc-border">
        <div className="flex gap-2">
          <input value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} className="flex-1 bg-mc-input p-2 text-xs outline-none border border-mc-border focus:border-mc-grass" placeholder="Type..." />
          <button onClick={send} className="bg-mc-grass p-2 px-4 text-mc-obsidian font-black text-[10px]">SEND</button>
        </div>
      </div>
    </div>
  )
}
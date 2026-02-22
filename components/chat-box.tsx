"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { Send, Smile } from "lucide-react"

export function ChatBox({ currentUser, serverID }: any) {
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState("")
  const [showEmojis, setShowEmojis] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  // Custom Minecraft Emojis
  const EMOJIS = ["⛏️", "⚔️", "💎", "🔱", "🔥", "🍞", "🍎", " creeper ", "😊", "💀"]

  useEffect(() => {
    if (!serverID) return
    const load = async () => {
      const { data } = await supabase.from('messages').select('*').eq('server_id', serverID).order('created_at', { ascending: true })
      if (data) setMessages(data)
    }
    load()

    const channel = supabase.channel(`chat-${serverID}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `server_id=eq.${serverID}` }, (payload) => {
        setMessages(prev => [...prev, payload.new])
      }).subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [serverID])

  // Scroll to bottom automatically
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const send = async (e: any) => {
    e.preventDefault()
    if (!text.trim() || !currentUser) return
    const msg = { id: Date.now().toString(), server_id: serverID, username: currentUser.username, avatar: currentUser.avatar, text }
    setText("")
    setMessages(prev => [...prev, msg])
    await supabase.from('messages').insert([msg])
  }

  return (
    <div className="flex flex-col h-full bg-mc-obsidian-bg border-2 border-mc-border relative">
      <div className="bg-mc-obsidian border-b-2 border-mc-border p-3 text-mc-gold font-black uppercase tracking-widest text-[10px] flex items-center justify-between">
        <span>Team Terminal</span>
      </div>
      
      {/* SCROLL FIX: flex-1, min-h-0, overflow-y-auto */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.map((m, i) => (
          <div key={i} className="flex gap-3">
            <img src={m.avatar} className="w-8 h-8 pixelated border border-mc-border" />
            <div className="flex flex-col">
              <span className="text-[10px] text-mc-gold font-bold">{m.username}</span>
              <span className="text-xs text-white break-words">{m.text}</span>
            </div>
          </div>
        ))}
        {/* Invisible div to scroll to */}
        <div ref={endRef} /> 
      </div>

      {/* Emoji Picker Popup */}
      {showEmojis && (
        <div className="absolute bottom-16 left-4 bg-mc-obsidian border-2 border-mc-border p-2 grid grid-cols-5 gap-2 shadow-2xl z-50">
          {EMOJIS.map(em => (
            <button key={em} type="button" onClick={() => { setText(text + em); setShowEmojis(false); }} className="hover:bg-mc-slot p-1 text-xl transition-colors">
              {em}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={send} className="p-3 border-t-2 border-mc-border bg-mc-slot flex gap-2 items-center">
        <button type="button" onClick={() => setShowEmojis(!showEmojis)} className="text-white/60 hover:text-mc-gold transition-colors">
          <Smile className="w-5 h-5" />
        </button>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Type a message..." className="flex-1 bg-mc-input border-2 border-mc-border p-2 text-white outline-none focus:border-mc-grass text-xs" />
        <button type="submit" className="bg-mc-grass hover:bg-[#5dbb30] p-2 text-black transition-transform active:scale-90"><Send className="w-4 h-4" /></button>
      </form>
    </div>
  )
}
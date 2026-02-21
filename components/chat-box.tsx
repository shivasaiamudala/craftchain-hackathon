"use client"

import { useState, useEffect, useRef } from "react"
import { Send } from "lucide-react"
import { supabase } from "@/lib/supabase"

export function ChatBox({ currentUser, serverID }: { currentUser: any, serverID: string }) {
  const [messages, setMessages] = useState<any[]>([])
  const [inputText, setInputText] = useState("")
  const scrollRef = useRef<any>(null)

  useEffect(() => {
    if (!serverID) return
    
    // 1. Fetch Past Chat History from the Cloud
    const fetchHistory = async () => {
      const { data } = await supabase.from('messages').select('*').eq('server_id', serverID).order('created_at', { ascending: true })
      if (data && data.length > 0) setMessages(data)
      else setMessages([{ id: "sys-1", username: "SYS", avatar: "https://api.mineatar.io/face/Herobrine", text: "Link established. Secure channel open.", time: "NOW" }])
    }
    fetchHistory()

    // 2. Real-Time Multiplayer Listener
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `server_id=eq.${serverID}` }, (payload) => {
        // When a new message hits the database, instantly add it to the screen!
        setMessages(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev; // Prevent duplicates
          return [...prev, payload.new];
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [serverID])

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  const send = async () => {
    if (!inputText.trim() || !currentUser) return
    
    const newMsg = { id: Date.now().toString(), server_id: serverID, username: currentUser.username, avatar: currentUser.avatar, text: inputText }
    
    // Instantly show on our screen (Optimistic Update)
    setMessages(prev => [...prev, newMsg])
    setInputText("")
    
    // Shoot it up to the Supabase Cloud
    await supabase.from('messages').insert([newMsg])
  }

  return (
    <div className="flex flex-col h-[450px] border-2 border-mc-border bg-mc-obsidian-bg rounded-md overflow-hidden shadow-xl">
      <div className="bg-mc-obsidian border-b-2 border-mc-border px-4 py-2 uppercase text-mc-gold font-bold text-[10px] tracking-widest flex justify-between">
        <span>Team Terminal</span>
        <span className="text-mc-grass animate-pulse">● LIVE SYNC</span>
      </div>
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
          <input value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} className="flex-1 bg-mc-input p-2 text-xs outline-none border border-mc-border focus:border-mc-grass" placeholder="Transmit..." />
          <button onClick={send} className="bg-mc-grass hover:bg-mc-grass/80 p-2 px-4 text-mc-obsidian font-black text-[10px] transition-colors">SEND</button>
        </div>
      </div>
    </div>
  )
}
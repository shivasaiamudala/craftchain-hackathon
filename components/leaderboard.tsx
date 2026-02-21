"use client"

import { Trophy, Star } from "lucide-react"

export function Leaderboard({ data }: any) {
  const sorted = [...data].sort((a, b) => b.points - a.points)
  return (
    <div className="flex flex-col border-2 border-mc-border bg-mc-obsidian-bg rounded-md overflow-hidden shadow-xl">
      <div className="bg-mc-obsidian border-b-2 border-mc-border px-4 py-2 flex items-center gap-2 uppercase text-mc-gold font-bold text-[10px] tracking-widest">
        <Trophy className="w-3 h-3" /> Contributors
      </div>
      <div className="p-3 space-y-2">
        {sorted.map((p, i) => (
          <div key={p.username} className="flex items-center gap-2 bg-mc-slot p-2 border border-mc-slot-border">
            <span className="text-[10px] w-3 font-bold text-mc-grass">{i + 1}</span>
            <img src={p.avatar} className="w-6 h-6 pixelated border border-mc-border" />
            <span className="flex-1 text-xs font-bold truncate">{p.username}</span>
            <div className="flex items-center gap-1 text-mc-gold font-bold text-xs"><Star className="w-3 h-3 fill-mc-gold"/> {p.points}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
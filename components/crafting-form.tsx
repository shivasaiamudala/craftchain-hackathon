"use client"

import { useState } from "react"
import { Search, Hammer } from "lucide-react"

export const MOCK_RECIPES: Record<string, any> = {
  "Netherite Sword": { requires: [{ name: "Diamond Sword", qty: 1 }, { name: "Netherite Ingot", qty: 1 }] },
  "Diamond Sword": { requires: [{ name: "Diamond", qty: 2 }, { name: "Stick", qty: 1 }] },
  "Netherite Ingot": { requires: [{ name: "Netherite Scrap", qty: 4 }, { name: "Gold Ingot", qty: 4 }] },
  "Cake": { requires: [{ name: "Milk Bucket", qty: 3 }, { name: "Sugar", qty: 2 }, { name: "Egg", qty: 1 }, { name: "Wheat", qty: 3 }] },
  "Beacon": { requires: [{ name: "Glass", qty: 5 }, { name: "Nether Star", qty: 1 }, { name: "Obsidian", qty: 3 }] },
  "Observer": { requires: [{ name: "Cobblestone", qty: 6 }, { name: "Redstone Dust", qty: 2 }, { name: "Nether Quartz", qty: 1 }] },
  "Piston": { requires: [{ name: "Wood Planks", qty: 3 }, { name: "Cobblestone", qty: 4 }, { name: "Iron Ingot", qty: 1 }, { name: "Redstone Dust", qty: 1 }] },
  "Enchanting Table": { requires: [{ name: "Book", qty: 1 }, { name: "Diamond", qty: 2 }, { name: "Obsidian", qty: 4 }] }
}

export function CraftingForm({ onCreateProject }: { onCreateProject: (name: string) => void }) {
  const [searchTerm, setSearchTerm] = useState("")
  const availableItems = Object.keys(MOCK_RECIPES).filter(item => 
    item.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6 bg-mc-obsidian-bg border-2 border-mc-border shadow-lg">
      <h2 className="text-xl text-mc-gold mb-4 uppercase font-black tracking-widest">Create Auto-Project</h2>
      <div className="flex flex-col gap-2">
        <label className="text-[10px] text-mc-grass font-bold uppercase tracking-widest opacity-70">Search Item Database</label>
        <div className="flex w-full h-12 bg-mc-input border-2 border-mc-border focus-within:border-mc-grass transition-all overflow-hidden">
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-3 h-5 w-5 text-mc-grass/50 z-10" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-full bg-transparent p-2 pl-10 text-white outline-none placeholder:text-white/20"
              placeholder="e.g. Observer, Piston..."
            />
            {searchTerm && availableItems.length > 0 && !MOCK_RECIPES[searchTerm] && (
              <ul className="absolute z-50 w-[calc(100%+4px)] top-[calc(100%+2px)] left-[-2px] bg-mc-input border-2 border-mc-border max-h-40 overflow-y-auto shadow-2xl">
                {availableItems.map((item) => (
                  <li key={item} onClick={() => setSearchTerm(item)} className="p-3 hover:bg-mc-slot-highlight cursor-pointer text-white border-b border-mc-border last:border-0 text-sm">{item}</li>
                ))}
              </ul>
            )}
          </div>
          <button
            onClick={() => { if(MOCK_RECIPES[searchTerm]) { onCreateProject(searchTerm); setSearchTerm(""); } else { alert("Select an item first!"); } }}
            className="bg-mc-grass hover:bg-mc-grass/90 text-mc-obsidian font-black px-6 flex items-center justify-center gap-2 border-l-2 border-mc-border"
          >
            <Hammer className="w-4 h-4" /> <span className="uppercase tracking-tighter">Generate</span>
          </button>
        </div>
      </div>
    </div>
  )
}
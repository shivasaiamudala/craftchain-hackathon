"use client"

import { useState } from "react"
import { Search, Hammer, Sparkles } from "lucide-react"

export const MOCK_RECIPES: Record<string, { requires: { name: string; qty: number }[] }> = {
  // Tools & Weapons
  "Netherite Sword": { requires: [{ name: "Diamond Sword", qty: 1 }, { name: "Netherite Ingot", qty: 1 }] },
  "Netherite Pickaxe": { requires: [{ name: "Diamond Pickaxe", qty: 1 }, { name: "Netherite Ingot", qty: 1 }] },
  "Diamond Sword": { requires: [{ name: "Diamonds", qty: 2 }, { name: "Stick", qty: 1 }] },
  "Diamond Pickaxe": { requires: [{ name: "Diamonds", qty: 3 }, { name: "Stick", qty: 2 }] },
  "Diamond Armor Set": { requires: [{ name: "Diamonds", qty: 24 }] },
  "Bow": { requires: [{ name: "String", qty: 3 }, { name: "Stick", qty: 3 }] },
  "Arrow": { requires: [{ name: "Flint", qty: 1 }, { name: "Stick", qty: 1 }, { name: "Feather", qty: 1 }] },

  // Resources & Ores
  "Netherite Ingot": { requires: [{ name: "Netherite Scrap", qty: 4 }, { name: "Gold Ingot", qty: 4 }] },
  "Netherite Scrap": { requires: [{ name: "Ancient Debris", qty: 4 }] },
  "Iron Block": { requires: [{ name: "Iron Ingot", qty: 9 }] },
  "Gold Block": { requires: [{ name: "Gold Ingot", qty: 9 }] },

  // Redstone & Mechanics
  "Observer": { requires: [{ name: "Cobblestone", qty: 6 }, { name: "Redstone", qty: 2 }, { name: "Quartz", qty: 1 }] },
  "Piston": { requires: [{ name: "Planks", qty: 3 }, { name: "Cobblestone", qty: 4 }, { name: "Iron Ingot", qty: 1 }, { name: "Redstone", qty: 1 }] },
  "Sticky Piston": { requires: [{ name: "Piston", qty: 1 }, { name: "Slimeball", qty: 1 }] },
  "Dispenser": { requires: [{ name: "Cobblestone", qty: 7 }, { name: "Bow", qty: 1 }, { name: "Redstone", qty: 1 }] },
  "Dropper": { requires: [{ name: "Cobblestone", qty: 7 }, { name: "Redstone", qty: 1 }] },
  "Hopper": { requires: [{ name: "Iron Ingot", qty: 5 }, { name: "Chest", qty: 1 }] },
  "Daylight Detector": { requires: [{ name: "Glass", qty: 3 }, { name: "Quartz", qty: 3 }, { name: "Wooden Slab", qty: 3 }] },
  "TNT": { requires: [{ name: "Gunpowder", qty: 5 }, { name: "Sand", qty: 4 }] },

  // Magic & End Game
  "Enchanting Table": { requires: [{ name: "Book", qty: 1 }, { name: "Diamonds", qty: 2 }, { name: "Obsidian", qty: 4 }] },
  "Beacon": { requires: [{ name: "Glass", qty: 5 }, { name: "Nether Star", qty: 1 }, { name: "Obsidian", qty: 3 }] },
  "Anvil": { requires: [{ name: "Iron Block", qty: 3 }, { name: "Iron Ingot", qty: 4 }] },
  "Brewing Stand": { requires: [{ name: "Blaze Rod", qty: 1 }, { name: "Cobblestone", qty: 3 }] },
  "Ender Eye": { requires: [{ name: "Ender Pearl", qty: 1 }, { name: "Blaze Powder", qty: 1 }] },

  // Food
  "Cake": { requires: [{ name: "Milk Bucket", qty: 3 }, { name: "Sugar", qty: 2 }, { name: "Egg", qty: 1 }, { name: "Wheat", qty: 3 }] },
  "Golden Apple": { requires: [{ name: "Gold Ingot", qty: 8 }, { name: "Apple", qty: 1 }] },
  "Golden Carrot": { requires: [{ name: "Gold Nugget", qty: 8 }, { name: "Carrot", qty: 1 }] },
  "Bread": { requires: [{ name: "Wheat", qty: 3 }] },

  // Sub-components (Crucial for the tree to go deep!)
  "Chest": { requires: [{ name: "Planks", qty: 8 }] },
  "Book": { requires: [{ name: "Paper", qty: 3 }, { name: "Leather", qty: 1 }] },
  "Paper": { requires: [{ name: "Sugar Cane", qty: 3 }] },
  "Blaze Powder": { requires: [{ name: "Blaze Rod", qty: 1 }] },
  "Stick": { requires: [{ name: "Planks", qty: 2 }] },
  "Planks": { requires: [{ name: "Log", qty: 1 }] }
}

export function CraftingForm({ onCreateProject }: { onCreateProject: (name: string) => void }) {
  const [query, setQuery] = useState("")
  const items = Object.keys(MOCK_RECIPES)
  const suggestions = query ? items.filter(i => i.toLowerCase().includes(query.toLowerCase())) : []

  const handleGenerate = () => {
    const exactMatch = items.find(i => i.toLowerCase() === query.toLowerCase())
    const finalItem = exactMatch || suggestions[0]

    if (!finalItem) {
      alert("Item not found! Try 'Cake', 'Observer', or 'Enchanting Table'.")
      return
    }

    onCreateProject(finalItem)
    setQuery("")
  }

  return (
    <div className="relative group w-full">
      {/* Glow Effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-mc-grass to-mc-diamond opacity-10 blur group-hover:opacity-25 transition duration-1000"></div>
      
      <div className="relative flex flex-row border-2 border-mc-border bg-mc-obsidian rounded-sm overflow-hidden shadow-lg">
        {/* Input Area */}
        <div className="flex-1 flex items-center px-4 py-3 bg-mc-input border-r-2 border-mc-border">
          <Search className="w-4 h-4 text-mc-grass mr-3 shrink-0" />
          <input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            className="bg-transparent w-full outline-none text-white font-bold placeholder:text-white/20 placeholder:font-normal uppercase tracking-wider text-xs md:text-sm" 
            placeholder="Search Recipe..." 
          />
        </div>

        {/* The Side Button */}
        <button 
          onClick={handleGenerate}
          className="bg-mc-grass hover:bg-[#5dbb30] text-mc-obsidian px-4 md:px-8 py-3 flex items-center justify-center gap-2 transition-all active:scale-95 group/btn shrink-0 border-l border-mc-border/20"
        >
          <Hammer className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
          <span className="font-black uppercase italic tracking-tighter text-[10px] md:text-xs">Generate</span>
          <Sparkles className="hidden md:block w-3 h-3 animate-pulse text-white" />
        </button>

        {/* Floating Suggestions */}
        {query && suggestions.length > 0 && !items.includes(query) && (
          <div className="absolute top-full left-0 w-full bg-mc-obsidian border-2 border-t-0 border-mc-border z-50 shadow-2xl max-h-48 overflow-y-auto">
            {suggestions.map(s => (
              <div 
                key={s} 
                onClick={() => { setQuery(s); handleGenerate(); }}
                className="px-4 py-3 hover:bg-mc-grass hover:text-mc-obsidian cursor-pointer font-bold uppercase text-[10px] border-b border-mc-border/30 last:border-0 flex items-center justify-between"
              >
                {s}
                <span className="opacity-40 text-[8px]">SELECT</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, Clock, Lock, ChevronRight, ChevronDown, Sword } from "lucide-react"

export type ItemStatus = "completed" | "pending" | "blocked"
export interface TreeNode { id: string; name: string; quantity: number; status: ItemStatus; children?: TreeNode[]; contributor?: string; contributorAvatar?: string; contributedAt?: string; }

const statusConfig: Record<ItemStatus, { icon: any; colorClass: string; label: string; bgClass: string }> = {
  completed: { icon: CheckCircle2, colorClass: "text-mc-grass", label: "Completed", bgClass: "bg-mc-grass/10" },
  pending: { icon: Clock, colorClass: "text-mc-gold", label: "Pending", bgClass: "bg-mc-gold/10" },
  blocked: { icon: Lock, colorClass: "text-mc-nether", label: "Blocked", bgClass: "bg-mc-nether/10" },
}

function TreeItem({ node, depth = 0, onToggleStatus, currentUser }: any) {
  const [expanded, setExpanded] = useState(true); const hasChildren = node.children && node.children.length > 0;
  const config = statusConfig[node.status]; const Icon = config.icon;

  return (
    <div className="flex flex-col">
      <div onClick={() => hasChildren && setExpanded(!expanded)} className={`group flex items-center gap-3 px-3 py-2 hover:bg-mc-slot-highlight/40 cursor-pointer ${depth > 0 ? "ml-6" : ""}`} style={{ paddingLeft: `${depth * 24 + 12}px` }}>
        <span className="w-4 h-4 flex items-center justify-center shrink-0">
          {hasChildren ? (expanded ? <ChevronDown className="w-4 h-4 text-white/40" /> : <ChevronRight className="w-4 h-4 text-white/40" />) : <span className="w-1 h-1 bg-white/20" />}
        </span>
        <button onClick={(e) => { e.stopPropagation(); if(!currentUser) return alert("Sign in to contribute!"); onToggleStatus(node.id); }} className={`w-7 h-7 flex items-center justify-center border border-current/20 ${config.bgClass} ${config.colorClass} hover:scale-110 transition-transform`}>
          <Icon className="w-4 h-4" />
        </button>
        <span className="text-sm flex-1">{node.name} <span className="opacity-40 ml-1">x{node.quantity}</span></span>
        {node.status === "completed" && node.contributor && <img src={node.contributorAvatar} className="w-5 h-5 pixelated rounded-full border border-mc-border" />}
      </div>
      {hasChildren && expanded && <div className="border-l border-mc-border ml-6" style={{ marginLeft: `${depth * 24 + 24}px` }}>
        {node.children.map((child: any) => <TreeItem key={child.id} node={child} depth={depth+1} onToggleStatus={onToggleStatus} currentUser={currentUser} />)}
      </div>}
    </div>
  )
}

export const netheriteSwordTree: TreeNode = {
  id: "netherite-sword",
  name: "Netherite Sword",
  quantity: 1,
  status: "pending",
  children: [
    {
      id: "diamond-sword",
      name: "Diamond Sword",
      quantity: 1,
      status: "pending",
      children: [
        { id: "diamonds", name: "Diamonds", quantity: 2, status: "pending" },
        { id: "stick-1", name: "Stick", quantity: 1, status: "pending" },
      ],
    },
    {
      id: "netherite-ingot",
      name: "Netherite Ingot",
      quantity: 1,
      status: "pending",
      children: [
        {
          id: "netherite-scrap",
          name: "Netherite Scrap",
          quantity: 4,
          status: "pending",
          children: [
            { id: "ancient-debris", name: "Ancient Debris", quantity: 4, status: "blocked" },
          ],
        },
        { id: "gold-ingots", name: "Gold Ingot", quantity: 4, status: "pending" },
      ],
    },
  ],
}

export function DependencyTree({ tree, currentUser, onPointAdded, onTreeUpdate }: any) {
  const [localTree, setLocalTree] = useState<TreeNode>(tree); 
  
  useEffect(() => { setLocalTree(tree) }, [tree])

  const toggleNode = (node: TreeNode, id: string): TreeNode => {
    if (node.id === id) { 
      const comp = node.status !== "completed"; 
      onPointAdded(comp ? 1 : -1);
      return { ...node, status: comp ? "completed" : "pending", contributor: comp ? currentUser.username : undefined, contributorAvatar: comp ? currentUser.avatar : undefined }
    }
    return { ...node, children: node.children?.map(c => toggleNode(c, id)) }
  }

  const handleToggle = (id: string) => {
    const newTree = toggleNode(localTree, id);
    setLocalTree(newTree);
    if (onTreeUpdate) onTreeUpdate(newTree);
  }

  const calc = (node: TreeNode): any => {
    let t = 1, c = node.status === "completed" ? 1 : 0;
    node.children?.forEach(child => { const r = calc(child); t += r.t; c += r.c; })
    return { t, c }
  }

  const { t, c } = calc(localTree); const pct = Math.round((c/t)*100);

  return (
    <div className="border-2 border-mc-border bg-mc-obsidian-bg rounded-md overflow-hidden">
      <div className="p-4 border-b-2 border-mc-border bg-mc-obsidian flex flex-col gap-2">
        <h2 className="text-mc-diamond uppercase font-bold tracking-widest flex items-center gap-2"><Sword className="w-5 h-5"/> Project Progress</h2>
        <div className="h-4 bg-mc-slot border border-mc-border relative overflow-hidden">
          <div className="h-full bg-mc-grass transition-all duration-700" style={{ width: `${pct}%` }} />
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black">{pct}% COMPLETE</span>
        </div>
      </div>
      <div className="py-2 min-h-[300px] overflow-y-auto">
        <TreeItem node={localTree} onToggleStatus={handleToggle} currentUser={currentUser} />
      </div>
    </div>
  )
}
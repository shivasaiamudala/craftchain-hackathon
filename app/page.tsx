"use client"

import { useState, useEffect, useMemo } from "react"
import { CraftingForm, MOCK_RECIPES } from "@/components/crafting-form"
import { DependencyTree, netheriteSwordTree } from "@/components/dependency-tree"
import { ChatBox } from "@/components/chat-box"
import { Leaderboard } from "@/components/leaderboard"
import { supabase } from "@/lib/supabase"
import { Hammer, Server, ShoppingCart, Trash2, FolderOpen } from "lucide-react"

export default function Home() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [serverID, setServerID] = useState("")
  const [projects, setProjects] = useState<any[]>([])
  const [activeID, setActiveID] = useState("")
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [authName, setAuthName] = useState(""); const [authEmail, setAuthEmail] = useState("");
  
  const activeProject = projects.find(p => p.id === activeID) || projects[0]

  // 1. PULL DATA AND LISTEN FOR REAL-TIME CHANGES
  useEffect(() => {
    if (!currentUser || !serverID) return

    const loadProjects = async () => {
      const { data } = await supabase.from('projects').select('*').eq('server_id', serverID).order('created_at', { ascending: true })
      if (data && data.length > 0) { 
        setProjects(data); 
        setActiveID(data[0].id) 
      } else { 
        setProjects([{ id: "def", name: "Netherite Sword", creator: "SYSTEM", tree: netheriteSwordTree }]) 
      }
    }
    loadProjects()

    const channel = supabase
      .channel(`room-${serverID}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `server_id=eq.${serverID}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setProjects(prev => prev.find(p => p.id === payload.new.id) ? prev : [...prev, payload.new])
        } else if (payload.eventType === 'UPDATE') {
          setProjects(prev => prev.map(p => p.id === payload.new.id ? payload.new : p))
        } else if (payload.eventType === 'DELETE') {
          setProjects(prev => prev.filter(p => p.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
    // CRITICAL: We only listen to currentUser and serverID to stop the crashing!
  }, [currentUser, serverID])

  const build = (name: string, q = 1, id = "root"): any => {
    const r = MOCK_RECIPES[name]; if (!r) return { id: `${id}-${name}`, name, quantity: q, status: "pending" }
    return { id: `${id}-${name}`, name, quantity: q, status: "pending", children: r.requires.map((x: any, i: number) => build(x.name, x.qty, `${id}-${i}`)) }
  }

  const shopList = useMemo(() => {
    const res: any = {}; const trav = (n: any) => { if(!n.children) res[n.name] = (res[n.name] || 0) + n.quantity; else n.children.forEach(trav); }
    trav(activeProject?.tree || netheriteSwordTree); return Object.entries(res)
  }, [activeProject])

  const handleCreateProject = async (name: string) => {
    const id = `p-${Date.now()}`
    const newProj = { id, server_id: serverID, name, creator: currentUser.username, tree: build(name, 1, id) }
    setProjects(prev => [...prev, newProj]); setActiveID(id)
    await supabase.from('projects').insert([newProj])
    
    const sysMsg = { id: Date.now().toString(), server_id: serverID, username: "SYS", avatar: "https://api.mineatar.io/face/Herobrine", text: `${currentUser.username} created project: ${name}` }
    await supabase.from('messages').insert([sysMsg])
  }

  const handleDeleteProject = async (id: string) => {
    const projectToDelete = projects.find(p => p.id === id)
    if (projectToDelete?.creator !== currentUser.username && projectToDelete?.creator !== "SYSTEM") {
      return alert("Access Denied: Only the creator can delete this!")
    }
    setProjects(projects.filter(x => x.id !== id))
    setActiveID(projects.find(x => x.id !== id)?.id || projects[0]?.id || "")
    await supabase.from('projects').delete().eq('id', id)
  }

  const handleTreeUpdate = async (updatedTree: any) => {
    if (!activeProject || activeProject.id === "def") return;
    setProjects(prev => prev.map(p => p.id === activeID ? { ...p, tree: updatedTree } : p))
    await supabase.from('projects').update({ tree: updatedTree }).eq('id', activeID)
  }

  if (!currentUser) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f0a] p-4 text-white">
      <div className="w-full max-w-sm bg-mc-obsidian border-4 border-mc-slot-border p-8 shadow-2xl">
        <h1 className="text-4xl font-black text-mc-grass uppercase italic text-center mb-8">Craft Chain</h1>
        <form onSubmit={(e) => { e.preventDefault(); if(authName) setCurrentUser({ username: authName, email: authEmail, avatar: `https://api.mineatar.io/face/${authName}` }) }} className="space-y-4">
          <div><label className="text-[10px] text-mc-grass font-bold uppercase">Server ID</label><input required value={serverID} onChange={e => setServerID(e.target.value)} className="w-full bg-mc-input border-2 border-mc-border p-2 outline-none focus:border-mc-grass" placeholder="Survival-1" /></div>
          <div><label className="text-[10px] text-mc-grass font-bold uppercase">Player Name</label><input required value={authName} onChange={e => setAuthName(e.target.value)} className="w-full bg-mc-input border-2 border-mc-border p-2 outline-none focus:border-mc-grass" placeholder="Steve" /></div>
          <button type="submit" className="w-full bg-mc-grass hover:bg-mc-grass/80 text-mc-obsidian font-black py-4 border-b-4 border-mc-stone transition-all uppercase text-sm">Connect Network</button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0f0a] text-white">
      <header className="flex items-center gap-3 px-6 py-4 bg-mc-obsidian border-b-4 border-mc-slot-border justify-between">
        <div className="flex flex-col"><h1 className="text-2xl text-mc-grass uppercase font-black italic leading-none">Craft Chain</h1><span className="text-[9px] text-mc-gold uppercase font-bold mt-1 tracking-widest"><Server className="inline w-3 h-3 mr-1"/> {serverID}</span></div>
        <div className="flex items-center gap-2 bg-mc-slot border-2 border-mc-border px-3 py-1"><img src={currentUser.avatar} className="w-6 h-6 pixelated"/><span className="text-mc-gold text-xs font-bold">{currentUser.username}</span></div>
      </header>
      <main className="grid grid-cols-1 lg:grid-cols-[2.5fr_1fr] gap-6 p-6 max-w-[1800px] mx-auto w-full">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-2 p-2 bg-mc-obsidian/40 border-2 border-mc-border">
            <span className="text-[10px] font-bold text-mc-grass uppercase px-2 border-r border-mc-border"><FolderOpen className="inline w-3 h-3 mr-1"/> Cloud Projects</span>
            {projects.map(p => (
              <div key={p.id} className={`flex items-center gap-2 px-3 py-1 border-2 text-[10px] font-bold uppercase transition-all cursor-pointer ${activeID === p.id ? 'border-mc-grass bg-mc-grass/10' : 'border-mc-border'}`}>
                <span onClick={() => setActiveID(p.id)}>{p.name}</span>
                {p.creator === currentUser.username && <Trash2 onClick={() => handleDeleteProject(p.id)} className="w-3 h-3 hover:text-mc-nether ml-1"/>}
              </div>
            ))}
          </div>
          <CraftingForm onCreateProject={handleCreateProject} />
          <DependencyTree 
            tree={activeProject?.tree || netheriteSwordTree} 
            currentUser={currentUser} 
            onPointAdded={(pts: number) => { 
              setLeaderboard(prev => { 
                const e = prev.find(x => x.username === currentUser.username); 
                if(e) return prev.map(x => x.username === currentUser.username ? { ...x, points: Math.max(0, x.points + pts) } : x); 
                return [...prev, { username: currentUser.username, avatar: currentUser.avatar, points: 1 }] 
              }) 
            }} 
            onTreeUpdate={handleTreeUpdate} 
          />
          <section className="bg-mc-obsidian-bg border-2 border-mc-border p-4">
            <h3 className="text-mc-gold uppercase text-xs font-black mb-4 flex items-center gap-2"><ShoppingCart className="w-4 h-4"/> Resources: {activeProject?.name}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {shopList.map(([n, q]: any) => <div key={n} className="bg-mc-slot p-2 border border-mc-slot-border flex justify-between text-[10px]"><span>{n}</span><span className="text-mc-grass">x{q}</span></div>)}
            </div>
          </section>
        </div>
        <div className="flex flex-col gap-6"><ChatBox currentUser={currentUser} serverID={serverID} /><Leaderboard data={leaderboard} /></div>
      </main>
    </div>
  )
}
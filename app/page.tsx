"use client"

import { useState, useEffect, useMemo } from "react"
import { CraftingForm, MOCK_RECIPES } from "@/components/crafting-form"
import { DependencyTree } from "@/components/dependency-tree"
import { ChatBox } from "@/components/chat-box"
import { Leaderboard } from "@/components/leaderboard"
import { supabase } from "@/lib/supabase"
import { Hammer, Server, Trash2, FolderOpen, Pin, ChevronDown, ChevronRight, Activity, Zap, AlertTriangle } from "lucide-react"

export default function Home() {
  const [currentView, setCurrentView] = useState<'login' | 'signup' | 'app'>('signup')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [serverID, setServerID] = useState("")
  const [authError, setAuthError] = useState("")

  const [loginForm, setLoginForm] = useState({ email: "", pass: "", sName: "", sCode: "" })
  const [signupForm, setSignupForm] = useState({ email: "", user: "", pass: "", sName: "", sCode: "" })

  const [projects, setProjects] = useState<any[]>([])
  const [activeID, setActiveID] = useState("")
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [pinnedProjects, setPinnedProjects] = useState<string[]>([])
  const [hoveredPin, setHoveredPin] = useState<string | null>(null)
  const [activityFeed, setActivityFeed] = useState<any[]>([])
  
  const [myProjectsOpen, setMyProjectsOpen] = useState(false)
  const [treeOpen, setTreeOpen] = useState(true)

  const toggleMyProjects = () => { setMyProjectsOpen(!myProjectsOpen); if (!myProjectsOpen) setTreeOpen(false); }
  const toggleTree = () => { setTreeOpen(!treeOpen); if (!treeOpen) setMyProjectsOpen(false); }

  const activeProject = projects.find(p => p.id === activeID) || (projects.length > 0 ? projects[0] : null)
  const myProjects = projects.filter(p => p.creator === currentUser?.username)
  const otherProjects = projects.filter(p => p.creator !== currentUser?.username && p.creator !== "SYSTEM")

  // --- INTELLIGENCE: BOTTLENECK DETECTOR ---
  // Scans the active tree and finds the PENDING item required in the highest quantity
  const bottleneck = useMemo(() => {
    if (!activeProject) return null;
    const counts: Record<string, number> = {};
    const traverse = (node: any) => {
      if (node.status === "pending") {
        counts[node.name] = (counts[node.name] || 0) + node.quantity;
      }
      node.children?.forEach(traverse);
    };
    traverse(activeProject.tree);
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? { name: sorted[0][0], qty: sorted[0][1] } : null;
  }, [activeProject]);

  useEffect(() => {
    if (currentView !== 'app' || !currentUser || !serverID) return
    const loadProjects = async () => {
      const { data } = await supabase.from('projects').select('*').eq('server_id', serverID).order('created_at', { ascending: true })
      if (data && data.length > 0) { setProjects(data); setActiveID(data[0].id) } else { setProjects([]); setActiveID("") }
    }
    loadProjects()

    const channel = supabase.channel(`room-${serverID}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `server_id=eq.${serverID}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setProjects(prev => {
            const exists = prev.find(p => p.id === payload.new.id);
            if (exists) return prev;
            if (prev.length === 0) setActiveID(payload.new.id);
            return [...prev, payload.new];
          });
          setActivityFeed(prev => [{ type: 'create', user: payload.new.creator, item: payload.new.name, time: new Date() }, ...prev].slice(0, 5));
        }
        else if (payload.eventType === 'UPDATE') {
          setProjects(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
          // Intelligence: Determine if something was completed
          setActivityFeed(prev => [{ type: 'update', user: 'Team', item: payload.new.name, time: new Date() }, ...prev].slice(0, 5));
        }
        else if (payload.eventType === 'DELETE') {
          setProjects(prev => prev.filter(p => p.id !== payload.old.id))
          setPinnedProjects(prev => prev.filter(id => id !== payload.old.id))
          if (activeID === payload.old.id) setActiveID("")
        }
      }).subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentView, currentUser, serverID, activeID])

  const build = (name: string, q = 1, id = "root"): any => {
    const r = MOCK_RECIPES[name]; if (!r) return { id: `${id}-${name}`, name, quantity: q, status: "pending" }
    return { id: `${id}-${name}`, name, quantity: q, status: "pending", children: r.requires.map((x: any, i: number) => build(x.name, x.qty, `${id}-${i}`)) }
  }

  const handleCreateProject = async (name: string) => {
    const id = `p-${Date.now()}`
    const newProj = { id, server_id: serverID, name, creator: currentUser.username, tree: build(name, 1, id) }
    setProjects(prev => [...prev, newProj]); setActiveID(id); setMyProjectsOpen(false); setTreeOpen(true);
    await supabase.from('projects').insert([newProj])
  }

  const handleDeleteProject = async (id: string) => {
    setProjects(prev => prev.filter(x => x.id !== id))
    setPinnedProjects(prev => prev.filter(pId => pId !== id))
    if (activeID === id) setActiveID(projects[0]?.id || "")
    await supabase.from('projects').delete().eq('id', id)
  }

  const togglePin = (id: string) => setPinnedProjects(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])

  const handleSignupSubmit = async (e: any) => {
    e.preventDefault();
    setAuthError("");
    const { data, error } = await supabase.auth.signUp({
      email: signupForm.email,
      password: signupForm.pass,
      options: { data: { username: signupForm.user } }
    });
    if (error) { setAuthError(error.message); return; }
    setServerID(signupForm.sCode);
    setCurrentUser({ username: signupForm.user, avatar: `https://api.mineatar.io/face/${signupForm.user}` }); 
    setCurrentView('app'); 
  }

  const handleLoginSubmit = async (e: any) => {
    e.preventDefault();
    setAuthError("");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.pass,
    });
    if (error) { setAuthError("Invalid Email or Password!"); return; }
    const username = data.user.user_metadata.username || "Player";
    setServerID(loginForm.sCode); 
    setCurrentUser({ username: username, avatar: `https://api.mineatar.io/face/${username}` }); 
    setCurrentView('app'); 
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setCurrentView('login');
  }

  if (currentView === 'signup') return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center px-4" style={{ backgroundImage: "url('/bg1.jpg')" }}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 w-full max-w-md bg-mc-obsidian border-4 border-mc-slot-border p-8 shadow-2xl">
        <h1 className="text-3xl font-black text-mc-gold uppercase italic text-center mb-8">Join Network</h1>
        {authError && <div className="bg-red-900/50 border-2 border-mc-nether text-white text-xs font-bold p-2 mb-4 text-center uppercase">{authError}</div>}
        <form onSubmit={handleSignupSubmit} className="space-y-4">
          <input required type="email" placeholder="Email address" value={signupForm.email} onChange={e => setSignupForm({...signupForm, email: e.target.value})} className="w-full bg-mc-input border-2 border-mc-border p-3 text-white outline-none focus:border-mc-gold" />
          <input required placeholder="Username" value={signupForm.user} onChange={e => setSignupForm({...signupForm, user: e.target.value})} className="w-full bg-mc-input border-2 border-mc-border p-3 text-white outline-none focus:border-mc-gold" />
          <input required type="password" placeholder="Password (min 6 chars)" minLength={6} value={signupForm.pass} onChange={e => setSignupForm({...signupForm, pass: e.target.value})} className="w-full bg-mc-input border-2 border-mc-border p-3 text-white outline-none focus:border-mc-gold" />
          <input required placeholder="Server Name" value={signupForm.sName} onChange={e => setSignupForm({...signupForm, sName: e.target.value})} className="w-full bg-mc-input border-2 border-mc-border p-3 text-white outline-none focus:border-mc-gold" />
          <input required placeholder="Server Code" value={signupForm.sCode} onChange={e => setSignupForm({...signupForm, sCode: e.target.value})} className="w-full bg-mc-input border-2 border-mc-border p-3 text-white outline-none focus:border-mc-gold" />
          <button type="submit" className="w-full bg-mc-gold hover:bg-yellow-400 text-mc-obsidian font-black py-4 border-b-4 border-yellow-600 transition-all uppercase mt-4">Create account</button>
        </form>
        <button onClick={() => { setAuthError(""); setCurrentView('login'); }} className="mt-6 text-xs text-white/50 hover:text-white uppercase font-bold block text-center w-full">Already have an account? Log in</button>
      </div>
    </div>
  )

  if (currentView === 'login') return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center px-4" style={{ backgroundImage: "url('/bg1.jpg')" }}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 w-full max-w-md bg-mc-obsidian border-4 border-mc-slot-border p-8 shadow-2xl">
        <h1 className="text-4xl font-black text-mc-grass uppercase italic text-center mb-8">Craft Chain</h1>
        {authError && <div className="bg-red-900/50 border-2 border-mc-nether text-white text-xs font-bold p-2 mb-4 text-center uppercase">{authError}</div>}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <input required type="email" placeholder="Email address" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className="w-full bg-mc-input border-2 border-mc-border p-3 text-white outline-none focus:border-mc-grass" />
          <input required type="password" placeholder="Password" value={loginForm.pass} onChange={e => setLoginForm({...loginForm, pass: e.target.value})} className="w-full bg-mc-input border-2 border-mc-border p-3 text-white outline-none focus:border-mc-grass" />
          <input required placeholder="Server Name" value={loginForm.sName} onChange={e => setLoginForm({...loginForm, sName: e.target.value})} className="w-full bg-mc-input border-2 border-mc-border p-3 text-white outline-none focus:border-mc-grass" />
          <input required placeholder="Server Code" value={loginForm.sCode} onChange={e => setLoginForm({...loginForm, sCode: e.target.value})} className="w-full bg-mc-input border-2 border-mc-border p-3 text-white outline-none focus:border-mc-grass" />
          <button type="submit" className="w-full bg-mc-grass hover:bg-mc-grass/80 text-mc-obsidian font-black py-4 border-b-4 border-mc-stone transition-all uppercase mt-4">Log in</button>
        </form>
        <div className="mt-6 flex justify-between text-xs font-bold text-mc-gold uppercase">
          <button onClick={() => { setAuthError(""); setCurrentView('signup'); }} className="hover:text-white hover:underline">Create new account</button>
          <button className="hover:text-white hover:underline opacity-50">Forget password</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col text-white relative z-0">
      <div className="fixed inset-0 bg-cover bg-center z-[-2]" style={{ backgroundImage: "url('/bg2.jpg')" }} />
      <div className="fixed inset-0 bg-[#0a0f0a]/80 z-[-1]" />

      <header className="flex flex-col md:flex-row md:items-center gap-3 px-4 md:px-6 py-4 bg-mc-obsidian border-b-4 border-mc-slot-border justify-between sticky top-0 z-40">
        <div className="flex flex-col"><h1 className="text-2xl text-mc-grass uppercase font-black italic leading-none">Craft Chain</h1><span className="text-[9px] text-mc-gold uppercase font-bold mt-1 tracking-widest"><Server className="inline w-3 h-3 mr-1"/> {serverID}</span></div>
        <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto mt-2 md:mt-0">
          <div className="flex items-center gap-2 bg-mc-slot border-2 border-mc-border px-3 py-1"><img src={currentUser.avatar} className="w-6 h-6 pixelated"/><span className="text-mc-gold text-xs font-bold">{currentUser.username}</span></div>
          <button onClick={handleLogout} className="text-[10px] text-mc-nether uppercase font-bold hover:underline shadow-sm bg-black/40 px-2 py-1 rounded">Logout</button>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 p-4 md:p-6 max-w-[1800px] mx-auto w-full md:h-[calc(100vh-80px)] md:overflow-hidden">
        
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-4 md:gap-6 md:overflow-y-auto pr-0 md:pr-2 pb-10 md:pb-20 custom-scrollbar">
          
          <div className="flex flex-wrap gap-2 p-3 bg-mc-obsidian/90 border-2 border-mc-border min-h-[50px] items-center relative shadow-lg">
            <span className="text-[10px] font-bold text-mc-gold uppercase px-2 border-r border-mc-border w-full md:w-auto mb-2 md:mb-0"><Pin className="inline w-3 h-3 mr-1"/> Pinned</span>
            {pinnedProjects.length === 0 && <span className="text-[10px] text-white/30 italic px-2">No projects pinned.</span>}
            
            {pinnedProjects.map(pinId => {
              const p = projects.find(x => x.id === pinId)
              if (!p) return null
              return (
                <div key={pinId} className="relative group" onMouseEnter={() => setHoveredPin(p.id)} onMouseLeave={() => setHoveredPin(null)}>
                  <div className={`flex items-center gap-2 px-3 py-1 border-2 text-[10px] font-bold uppercase transition-all cursor-pointer ${activeID === p.id ? 'border-mc-grass bg-mc-grass/20 text-mc-grass' : 'border-mc-border bg-black/40 text-white hover:border-mc-gold'}`}>
                    <span onClick={() => { setActiveID(p.id); setMyProjectsOpen(false); setTreeOpen(true); }}>{p.name}</span>
                    <button onClick={() => togglePin(p.id)} className="opacity-50 hover:opacity-100 hover:text-mc-nether"><Pin className="w-3 h-3"/></button>
                  </div>
                  {hoveredPin === p.id && (
                    <div className="absolute top-full left-0 pt-2 w-72 z-50 hidden md:block">
                      <div className="bg-mc-obsidian border-4 border-mc-slot-border p-3 shadow-2xl max-h-[350px] overflow-y-auto custom-scrollbar ring-2 ring-black">
                        <span className="text-[8px] text-mc-gold block mb-2 border-b border-mc-border pb-1">Recipe Preview: {p.name}</span>
                        <div className="scale-75 origin-top-left w-[133%] pb-6"><DependencyTree tree={p.tree} currentUser={null} /></div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="border-2 border-mc-border bg-mc-obsidian-bg/95 p-4 shadow-xl">
            <h3 className="text-mc-diamond uppercase text-[12px] font-black tracking-widest mb-3 flex items-center gap-2">
              <Hammer className="w-4 h-4"/> Create New Project
            </h3>
            <CraftingForm onCreateProject={handleCreateProject} />
          </div>

          <div className="border-2 border-mc-border bg-mc-obsidian-bg/95 flex flex-col transition-all shadow-xl">
            <div onClick={toggleMyProjects} className="p-3 border-b-2 border-mc-border bg-mc-obsidian flex items-center gap-2 cursor-pointer hover:bg-mc-slot-highlight">
              {myProjectsOpen ? <ChevronDown className="w-4 h-4 text-mc-grass"/> : <ChevronRight className="w-4 h-4 text-mc-grass"/>}
              <h3 className="text-mc-grass uppercase text-[10px] font-black tracking-widest">Your Projects</h3>
            </div>
            {myProjectsOpen && (
              <div className="p-2 overflow-y-auto flex flex-col gap-2 max-h-[300px] custom-scrollbar">
                {myProjects.length === 0 ? <span className="text-[10px] text-white/30 p-2 text-center block">No projects created yet.</span> : 
                  myProjects.map(p => (
                    <div key={p.id} onClick={() => { setActiveID(p.id); setMyProjectsOpen(false); setTreeOpen(true); }} className={`flex items-center justify-between p-2 border border-mc-slot-border bg-mc-slot cursor-pointer ${activeID === p.id ? 'ring-1 ring-mc-grass' : 'hover:bg-mc-slot-highlight'}`}>
                      <span className="text-xs font-bold truncate">{p.name}</span>
                      <Trash2 onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id) }} className="w-3 h-3 hover:text-mc-nether text-white/40"/>
                    </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-2 border-mc-border bg-mc-obsidian-bg/95 flex flex-col transition-all shadow-xl">
            <div onClick={toggleTree} className="p-3 border-b-2 border-mc-border bg-mc-obsidian flex items-center gap-2 cursor-pointer hover:bg-mc-slot-highlight">
              {treeOpen ? <ChevronDown className="w-4 h-4 text-mc-diamond"/> : <ChevronRight className="w-4 h-4 text-mc-diamond"/>}
              <h3 className="text-mc-diamond uppercase text-[10px] font-black tracking-widest">Project Progress Tree</h3>
            </div>
            {treeOpen && (
              <div className="p-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                {activeProject ? (
                  <DependencyTree key={activeID} tree={activeProject.tree} currentUser={currentUser} 
                    onPointAdded={(pts: number) => { 
                      setLeaderboard(prev => { 
                        const e = prev.find(x => x.username === currentUser.username); 
                        if(e) return prev.map(x => x.username === currentUser.username ? { ...x, points: Math.max(0, x.points + pts) } : x); 
                        return [...prev, { username: currentUser.username, avatar: currentUser.avatar, points: 1 }] 
                      }) 
                    }} 
                    onTreeUpdate={async (t: any) => { if (activeID) { setProjects(prev => prev.map(p => p.id === activeID ? { ...p, tree: t } : p)); await supabase.from('projects').update({ tree: t }).eq('id', activeID) } }} 
                  />
                ) : (
                  <div className="text-center p-8 text-white/40 text-[10px] uppercase font-bold">Select or create a project first!</div>
                )}
              </div>
            )}
          </div>

          <div className="border-2 border-mc-border bg-mc-obsidian-bg/95 flex flex-col h-[250px] md:h-[400px] shadow-xl">
            <div className="p-3 border-b-2 border-mc-border bg-mc-obsidian flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-mc-gold"/>
              <h3 className="text-mc-gold uppercase text-[10px] font-black tracking-widest">Available Projects</h3>
            </div>
            <div className="p-2 overflow-y-auto flex flex-col gap-2 custom-scrollbar">
              {otherProjects.length === 0 ? <span className="text-[10px] text-white/30 p-2 text-center block mt-10">No active projects from others.</span> : 
                otherProjects.map(p => (
                  <div key={p.id} onClick={() => { setActiveID(p.id); setMyProjectsOpen(false); setTreeOpen(true); }} className={`flex items-center justify-between p-2 border border-mc-slot-border bg-mc-slot cursor-pointer ${activeID === p.id ? 'ring-1 ring-mc-gold' : 'hover:bg-mc-slot-highlight'}`}>
                    <div className="flex flex-col"><span className="text-xs font-bold truncate">{p.name}</span><span className="text-[8px] text-white/40 uppercase block truncate">By: {p.creator}</span></div>
                    <button onClick={(e) => { e.stopPropagation(); togglePin(p.id) }} className={`w-5 h-5 flex items-center justify-center border border-mc-border hover:bg-white/10 ${pinnedProjects.includes(p.id) ? 'bg-mc-gold text-black' : 'text-white/40'}`}>
                      <Pin className="w-3 h-3"/>
                    </button>
                  </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-4 md:gap-6 h-[900px] md:h-full pb-6">
          <div className="flex-1 min-h-0 relative shadow-2xl">
            <ChatBox currentUser={currentUser} serverID={serverID} />
          </div>

          {/* COLLABORATION & INTELLIGENCE HUB */}
          <div className="shrink-0 h-[300px] flex flex-col gap-3">
             
             {/* 1. ACTIVITY FEED */}
             <div className="flex-1 bg-mc-obsidian border-2 border-mc-border p-3 shadow-xl overflow-hidden flex flex-col">
                <h4 className="text-mc-diamond text-[9px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Activity className="w-3 h-3" /> Live Network Feed
                </h4>
                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                  {activityFeed.length === 0 && <span className="text-[8px] text-white/20 uppercase italic">Waiting for team activity...</span>}
                  {activityFeed.map((act, i) => (
                    <div key={i} className="flex items-center justify-between text-[8px] border-b border-mc-border/30 pb-1 animate-in fade-in slide-in-from-left duration-500">
                      <div className="flex items-center gap-2">
                         <span className="text-mc-gold font-bold">{act.user}</span>
                         <span className="text-white/60">{act.type === 'create' ? 'initiated' : 'updated'}</span>
                         <span className="text-white font-bold">{act.item}</span>
                      </div>
                      <span className="text-[6px] text-white/20">{act.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))}
                </div>
             </div>

             {/* 2. BOTTLENECK DETECTOR */}
             <div className="h-[100px] bg-mc-obsidian border-2 border-mc-nether p-3 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
                   <AlertTriangle className="w-8 h-8 text-mc-nether animate-pulse" />
                </div>
                <h4 className="text-mc-nether text-[9px] font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                   <Zap className="w-3 h-3" /> Bottleneck Alert
                </h4>
                {bottleneck ? (
                  <div className="flex items-end gap-3">
                    <span className="text-xl font-black text-white leading-none truncate">{bottleneck.name}</span>
                    <span className="text-[9px] text-mc-nether uppercase font-black bg-mc-nether/20 px-1 border border-mc-nether">Needs x{bottleneck.qty}</span>
                  </div>
                ) : (
                  <span className="text-[8px] text-white/40 italic">Chain is clear. All resources secured.</span>
                )}
                <p className="text-[7px] text-white/30 uppercase mt-1 tracking-tighter">Blocking the most progress in active tree</p>
             </div>
          </div>

          <div className="shrink-0 h-[150px] overflow-hidden shadow-2xl">
             <Leaderboard data={leaderboard} />
          </div>
        </div>
      </main>
    </div>
  )
}
import { useState, useEffect, useRef, useCallback } from "react";

// â”€â”€â”€ STORAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const STORAGE_KEY = "lul_v2";
const save = (data) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch(e){} };
const load = () => { try { const d = localStorage.getItem(STORAGE_KEY); return d ? JSON.parse(d) : null; } catch(e){ return null; } };

// â”€â”€â”€ CONSTANTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const DEFAULT_SKILLS = [
  { id: "focus",       name: "Focus",       icon: "ðŸ§ ", color: "#7DF9FF", xp: 0 },
  { id: "discipline",  name: "Discipline",  icon: "ðŸ’ª", color: "#FF6B6B", xp: 0 },
  { id: "learning",    name: "Learning",    icon: "ðŸ“š", color: "#FFD93D", xp: 0 },
  { id: "mindfulness", name: "Mindfulness", icon: "ðŸ§˜", color: "#6BCB77", xp: 0 },
  { id: "social",      name: "Social",      icon: "ðŸ—£", color: "#FF922B", xp: 0 },
];

const ICON_OPTIONS = ["ðŸ§ ","ðŸ’ª","ðŸ“š","ðŸ§˜","ðŸ—£","âš¡","ðŸŽ¯","ðŸƒ","ðŸŽ¨","ðŸ”¬","ðŸ’¡","ðŸŽµ","ðŸŒ±","ðŸ”¥","ðŸ§ª","ðŸ‹","ðŸŽ­","ðŸŒ","ðŸ’»","ðŸ¤"];
const COLOR_OPTIONS = ["#7DF9FF","#FF6B6B","#FFD93D","#6BCB77","#FF922B","#C77DFF","#FF61D2","#00F5A0","#F7971E","#56CCF2"];

const TITLES = [
  { xp: 0,    label: "Unranked",         color: "#555" },
  { xp: 50,   label: "Rising Soul",      color: "#6BCB77" },
  { xp: 200,  label: "Seeker",           color: "#7DF9FF" },
  { xp: 500,  label: "Forge Apprentice", color: "#FFD93D" },
  { xp: 1000, label: "Growth Warrior",   color: "#FF922B" },
  { xp: 2000, label: "Ascendant",        color: "#FF6B6B" },
  { xp: 4000, label: "Legendary Mind",   color: "#C77DFF" },
];

const QUOTES = [
  "Every rep counts. Every page counts. Every day counts.",
  "The version of you 1 year from now is watching.",
  "Small disciplines, compounded daily, change everything.",
  "You are not behind. You are exactly where you need to be.",
  "Level up in life, not just in games.",
  "Discipline is freedom in disguise.",
  "Winners are just losers who tried one more time.",
];

const DIFF_XP = { Easy: 25, Medium: 75, Hard: 200 };
const DIFF_COLORS = { Easy: "#6BCB77", Medium: "#FFD93D", Hard: "#FF6B6B" };
const XP_FOR_LEVEL = (l) => Math.max(1, l) * 100;

const getLevelInfo = (totalXP) => {
  if (totalXP <= 0) return { level: 0, currentXP: 0, neededXP: 100, pct: 0 };
  let level = 0, used = 0;
  while (used + XP_FOR_LEVEL(level + 1) <= totalXP) {
    used += XP_FOR_LEVEL(level + 1);
    level++;
  }
  const currentXP = totalXP - used;
  const neededXP = XP_FOR_LEVEL(level + 1);
  return { level, currentXP, neededXP, pct: Math.min((currentXP / neededXP) * 100, 100) };
};

const getTitle = (xp) => TITLES.reduce((a, t) => xp >= t.xp ? t : a, TITLES[0]);

const DEFAULT_STATE = () => ({
  playerName: "Player",
  totalXP: 0,
  coins: 0,
  skills: DEFAULT_SKILLS,
  tasks: [],
  lastReset: new Date().toDateString(),
  seenTrailer: false,
  dailyLog: {}, // { "Mon May 26": { xp: 120, tasks: 3 } }
});

// â”€â”€â”€ TRAILER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TRAILER_SLIDES = [
  {
    icon: "âš”ï¸",
    title: "YOUR LIFE IS THE GAME",
    sub: "Most people play video games to level up fictional characters.",
    accent: "#7DF9FF",
    particles: ["XP", "+50", "LVL UP", "â˜…"],
  },
  {
    icon: "ðŸŽ¯",
    title: "WHAT IF YOU LEVELED UP YOURSELF?",
    sub: "Every habit, every study session, every workout â€” earns you real XP.",
    accent: "#FFD93D",
    particles: ["ðŸ“š", "ðŸ’ª", "ðŸ§˜", "âš¡"],
  },
  {
    icon: "ðŸ“ˆ",
    title: "BUILD YOUR SKILL TREE",
    sub: "Customize your skills. Track what matters to YOU. No two players are the same.",
    accent: "#C77DFF",
    particles: ["Focus", "Discipline", "Learning", "Growth"],
  },
  {
    icon: "ðŸ”¥",
    title: "STREAK. REWARD. REPEAT.",
    sub: "Chains of consistency create unstoppable momentum. Break the chain â€” lose the streak.",
    accent: "#FF6B6B",
    particles: ["ðŸ”¥x7", "ðŸ†", "+BONUS", "ðŸª™"],
  },
  {
    icon: "ðŸš€",
    title: "YOUR JOURNEY STARTS NOW",
    sub: "Level 0. No gear. No titles. Just potential waiting to be unlocked.",
    accent: "#6BCB77",
    particles: ["LV 0â†’âˆž", "START", "BEGIN", "GO"],
  },
];

function Trailer({ onFinish }) {
  const [slide, setSlide] = useState(0);
  const [phase, setPhase] = useState("in"); // in | hold | out
  const [particles, setParticles] = useState([]);
  const timerRef = useRef();

  const current = TRAILER_SLIDES[slide];

  useEffect(() => {
    setPhase("in");
    const pts = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      text: current.particles[i % current.particles.length],
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
      delay: Math.random() * 2,
      dur: 3 + Math.random() * 2,
    }));
    setParticles(pts);

    timerRef.current = setTimeout(() => setPhase("out"), 3200);
    return () => clearTimeout(timerRef.current);
  }, [slide]);

  useEffect(() => {
    if (phase === "out") {
      timerRef.current = setTimeout(() => {
        if (slide < TRAILER_SLIDES.length - 1) setSlide(s => s + 1);
        else onFinish();
      }, 600);
    }
    return () => clearTimeout(timerRef.current);
  }, [phase]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#050510",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        @keyframes trailerIn { from { opacity:0; transform:translateY(40px) scale(0.92); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes trailerOut { from { opacity:1; transform:translateY(0) scale(1); } to { opacity:0; transform:translateY(-30px) scale(1.04); } }
        @keyframes floatPt { 0%{opacity:0;transform:translateY(0)} 20%{opacity:0.7} 80%{opacity:0.4} 100%{opacity:0;transform:translateY(-120px)} }
        @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @keyframes bgPulse { 0%,100%{opacity:0.4} 50%{opacity:0.9} }
        @keyframes iconBounce { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
      `}</style>

      {/* Scanline effect */}
      <div style={{
        position:"absolute", inset:0, pointerEvents:"none",
        background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.15) 2px,rgba(0,0,0,0.15) 4px)",
        zIndex:2,
      }}/>
      <div style={{
        position:"absolute", left:0, right:0, height:60,
        background:"rgba(255,255,255,0.03)",
        animation:"scanline 3s linear infinite", zIndex:3, pointerEvents:"none",
      }}/>

      {/* Glow bg */}
      <div style={{
        position:"absolute", inset:0,
        background:`radial-gradient(ellipse 60% 50% at 50% 50%, ${current.accent}18, transparent 70%)`,
        animation:"bgPulse 3s ease infinite", transition:"background 0.6s",
      }}/>

      {/* Grid */}
      <div style={{
        position:"absolute", inset:0, opacity:0.06,
        backgroundImage:`linear-gradient(${current.accent} 1px,transparent 1px),linear-gradient(90deg,${current.accent} 1px,transparent 1px)`,
        backgroundSize:"40px 40px",
      }}/>

      {/* Floating particles */}
      {particles.map(p => (
        <div key={p.id} style={{
          position:"absolute", left:`${p.x}%`, top:`${p.y}%`,
          color: current.accent, fontFamily:"'Space Mono',monospace",
          fontSize:11, opacity:0, letterSpacing:1,
          animation:`floatPt ${p.dur}s ${p.delay}s ease-in-out infinite`,
          textShadow:`0 0 10px ${current.accent}`,
          zIndex:1, pointerEvents:"none",
        }}>{p.text}</div>
      ))}

      {/* Main content */}
      <div style={{
        position:"relative", zIndex:4, textAlign:"center", padding:"0 32px", maxWidth:440,
        animation: phase==="in" ? "trailerIn 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards"
                 : phase==="out" ? "trailerOut 0.5s ease-in forwards" : "none",
      }}>
        <div style={{
          fontSize:72, marginBottom:24, lineHeight:1,
          animation:"iconBounce 2s ease-in-out infinite",
          filter:`drop-shadow(0 0 30px ${current.accent})`,
        }}>{current.icon}</div>

        <div style={{
          color: current.accent, fontFamily:"'Space Mono',monospace",
          fontSize:9, letterSpacing:5, marginBottom:16,
          textShadow:`0 0 20px ${current.accent}`,
        }}>LEVEL UP LIFE</div>

        <h1 style={{
          color:"#fff", fontFamily:"'Space Mono',monospace",
          fontSize: window.innerWidth < 400 ? 22 : 26,
          fontWeight:700, lineHeight:1.2, marginBottom:20,
          textShadow:"0 0 40px rgba(255,255,255,0.3)",
        }}>{current.title}</h1>

        <p style={{
          color:"#aaa", fontFamily:"'Space Mono',monospace",
          fontSize:12, lineHeight:1.8, marginBottom:32,
        }}>{current.sub}</p>

        {/* Slide dots */}
        <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:28 }}>
          {TRAILER_SLIDES.map((_,i) => (
            <div key={i} style={{
              width: i===slide ? 24 : 8, height:8, borderRadius:4,
              background: i===slide ? current.accent : "rgba(255,255,255,0.15)",
              transition:"all 0.4s ease",
              boxShadow: i===slide ? `0 0 10px ${current.accent}` : "none",
            }}/>
          ))}
        </div>

        {slide === TRAILER_SLIDES.length - 1 && (
          <button onClick={onFinish} style={{
            background:`linear-gradient(135deg,${current.accent},#C77DFF)`,
            border:"none", borderRadius:10, padding:"14px 40px",
            color:"#050510", fontFamily:"'Space Mono',monospace",
            fontSize:13, fontWeight:700, cursor:"pointer",
            boxShadow:`0 0 40px ${current.accent}55`,
            letterSpacing:2,
          }}>BEGIN YOUR JOURNEY â†’</button>
        )}
        {slide < TRAILER_SLIDES.length - 1 && (
          <button onClick={() => setPhase("out")} style={{
            background:"rgba(255,255,255,0.06)", border:`1px solid ${current.accent}44`,
            borderRadius:8, padding:"10px 24px",
            color:"#888", fontFamily:"'Space Mono',monospace",
            fontSize:11, cursor:"pointer",
          }}>SKIP â†’</button>
        )}
      </div>
    </div>
  );
}

// â”€â”€â”€ SMALL COMPONENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const XPBar = ({ pct, color="#7DF9FF" }) => (
  <div style={{ height:10, background:"rgba(255,255,255,0.07)", borderRadius:5, overflow:"hidden" }}>
    <div style={{
      height:"100%", width:`${pct}%`,
      background:`linear-gradient(90deg,${color},#C77DFF)`,
      borderRadius:5, transition:"width 0.9s cubic-bezier(0.34,1.56,0.64,1)",
      boxShadow:`0 0 10px ${color}88`,
    }}/>
  </div>
);

function SkillCustomizer({ skills, onChange }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [adding, setAdding] = useState(false);
  const [newSkill, setNewSkill] = useState({ name:"", icon:"ðŸŽ¯", color:COLOR_OPTIONS[0] });

  const startEdit = (sk) => { setEditing(sk.id); setForm({ name:sk.name, icon:sk.icon, color:sk.color }); };

  const saveEdit = () => {
    onChange(skills.map(s => s.id===editing ? { ...s, ...form } : s));
    setEditing(null);
  };

  const deleteSkill = (id) => {
    if (skills.length <= 1) return;
    onChange(skills.filter(s => s.id !== id));
  };

  const addSkill = () => {
    if (!newSkill.name.trim()) return;
    onChange([...skills, { id: Date.now().toString(), xp:0, ...newSkill }]);
    setNewSkill({ name:"", icon:"ðŸŽ¯", color:COLOR_OPTIONS[0] });
    setAdding(false);
  };

  const inputStyle = {
    width:"100%", background:"rgba(255,255,255,0.05)",
    border:"1px solid rgba(255,255,255,0.1)", borderRadius:7,
    padding:"9px 11px", color:"#fff",
    fontFamily:"'Space Mono',monospace", fontSize:12,
    outline:"none", boxSizing:"border-box",
  };

  return (
    <div>
      <div style={{ color:"#555", fontSize:10, letterSpacing:2, marginBottom:14 }}>CUSTOMIZE SKILL TREE</div>
      {skills.map(sk => (
        <div key={sk.id} style={{
          background:"rgba(255,255,255,0.03)", border:`1px solid ${sk.color}22`,
          borderLeft:`3px solid ${sk.color}`, borderRadius:10,
          padding:"12px 14px", marginBottom:8,
        }}>
          {editing === sk.id ? (
            <div>
              <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}
                  style={{...inputStyle,flex:1}} placeholder="Skill name"/>
              </div>
              <div style={{ marginBottom:8 }}>
                <div style={{ color:"#555", fontSize:9, letterSpacing:2, marginBottom:5 }}>ICON</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                  {ICON_OPTIONS.map(ic => (
                    <button key={ic} onClick={()=>setForm(p=>({...p,icon:ic}))} style={{
                      width:30, height:30, fontSize:16, borderRadius:6, cursor:"pointer",
                      background: form.icon===ic ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.04)",
                      border: form.icon===ic ? "1px solid rgba(255,255,255,0.3)" : "1px solid transparent",
                    }}>{ic}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom:10 }}>
                <div style={{ color:"#555", fontSize:9, letterSpacing:2, marginBottom:5 }}>COLOR</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                  {COLOR_OPTIONS.map(c => (
                    <button key={c} onClick={()=>setForm(p=>({...p,color:c}))} style={{
                      width:24, height:24, borderRadius:"50%", cursor:"pointer",
                      background:c, border: form.color===c ? "2px solid #fff" : "2px solid transparent",
                    }}/>
                  ))}
                </div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>setEditing(null)} style={{
                  flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)",
                  borderRadius:7, padding:"8px", color:"#666", fontFamily:"'Space Mono',monospace",
                  fontSize:10, cursor:"pointer",
                }}>CANCEL</button>
                <button onClick={saveEdit} style={{
                  flex:2, background:`${form.color}22`, border:`1px solid ${form.color}55`,
                  borderRadius:7, padding:"8px", color:form.color, fontFamily:"'Space Mono',monospace",
                  fontSize:10, cursor:"pointer",
                }}>SAVE âœ“</button>
              </div>
            </div>
          ) : (
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:20 }}>{sk.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ color:"#ddd", fontFamily:"'Space Mono',monospace", fontSize:13 }}>{sk.name}</div>
                <div style={{ color:"#555", fontFamily:"'Space Mono',monospace", fontSize:10 }}>{sk.xp} XP</div>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={()=>startEdit(sk)} style={{
                  background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)",
                  borderRadius:6, padding:"5px 9px", color:"#888", cursor:"pointer", fontSize:11,
                }}>âœŽ</button>
                <button onClick={()=>deleteSkill(sk.id)} style={{
                  background:"rgba(255,80,80,0.06)", border:"1px solid rgba(255,80,80,0.15)",
                  borderRadius:6, padding:"5px 9px", color:"#FF6B6B", cursor:"pointer", fontSize:11,
                }}>Ã—</button>
              </div>
            </div>
          )}
        </div>
      ))}

      {adding ? (
        <div style={{
          background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.1)",
          borderRadius:10, padding:"14px",
        }}>
          <input value={newSkill.name} onChange={e=>setNewSkill(p=>({...p,name:e.target.value}))}
            style={inputStyle} placeholder="New skill name..." />
          <div style={{ display:"flex", flexWrap:"wrap", gap:5, margin:"10px 0 6px" }}>
            {ICON_OPTIONS.map(ic => (
              <button key={ic} onClick={()=>setNewSkill(p=>({...p,icon:ic}))} style={{
                width:28,height:28,fontSize:15,borderRadius:5,cursor:"pointer",
                background:newSkill.icon===ic?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.04)",
                border:newSkill.icon===ic?"1px solid rgba(255,255,255,0.3)":"1px solid transparent",
              }}>{ic}</button>
            ))}
          </div>
          <div style={{ display:"flex", gap:5, marginBottom:10 }}>
            {COLOR_OPTIONS.map(c=>(
              <button key={c} onClick={()=>setNewSkill(p=>({...p,color:c}))} style={{
                width:22,height:22,borderRadius:"50%",cursor:"pointer",
                background:c,border:newSkill.color===c?"2px solid #fff":"2px solid transparent",
              }}/>
            ))}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>setAdding(false)} style={{
              flex:1,background:"rgba(255,255,255,0.04)",border:"none",borderRadius:7,
              padding:"8px",color:"#666",fontFamily:"'Space Mono',monospace",fontSize:10,cursor:"pointer",
            }}>CANCEL</button>
            <button onClick={addSkill} style={{
              flex:2,background:`${newSkill.color}22`,border:`1px solid ${newSkill.color}55`,
              borderRadius:7,padding:"8px",color:newSkill.color,
              fontFamily:"'Space Mono',monospace",fontSize:10,cursor:"pointer",
            }}>ADD SKILL âœ“</button>
          </div>
        </div>
      ) : (
        <button onClick={()=>setAdding(true)} style={{
          width:"100%", background:"rgba(255,255,255,0.03)",
          border:"1px dashed rgba(255,255,255,0.12)", borderRadius:10,
          padding:"12px", color:"#555", fontFamily:"'Space Mono',monospace",
          fontSize:11, cursor:"pointer",
        }}>+ ADD NEW SKILL</button>
      )}
    </div>
  );
}

// â”€â”€â”€ BUILT-IN AI COACH â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const COACH_BRAIN = (input, playerData) => {
  const { level, totalXP, coins, skills, tasks } = playerData;
  const { level: lvl } = getLevelInfo(totalXP);
  const doneTasks = tasks.filter(t=>t.done).length;
  const pendingTasks = tasks.filter(t=>!t.done);
  const topSkill = [...skills].sort((a,b)=>b.xp-a.xp)[0];
  const lowSkill = [...skills].sort((a,b)=>a.xp-b.xp)[0];
  const q = input.toLowerCase();

  // Motivation
  if (q.match(/motivat|inspire|give up|tired|can't|cant|hard|struggle/)) {
    const lines = [
      `You're Level ${lvl} â€” that's ${doneTasks} completed quests. Quitters don't have stats like that.`,
      `Every legendary player had a day exactly like today. They showed up anyway. Your turn.`,
      `The grind feels 

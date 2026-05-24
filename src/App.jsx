import { useState, useEffect, useRef } from "react";

const C = {
  bg:"#06060f", surface:"#0a0a18", card:"#0f0f1e", hover:"#141428",
  border:"#1c1c30", borderLight:"#262640",
  ink:"#f2f2fa", muted:"#6060a0", subtle:"#28283c",
  accent:"#9d8fff", accentDim:"#9d8fff12", accentBorder:"#9d8fff35",
  accentGlow:"#9d8fff25",
  red:"#ff6b7a", redDim:"#ff6b7a10", redBorder:"#ff6b7a38",
  amber:"#ffb347", amberDim:"#ffb34710", amberBorder:"#ffb34738",
  green:"#3de8a0", greenDim:"#3de8a010", greenBorder:"#3de8a038",
  blue:"#5ab4ff", blueDim:"#5ab4ff10",
};

const PRIORITY = {
  high:   { color:C.red,   dim:C.redDim,   border:C.redBorder,   icon:"●", label:"Urgent" },
  normal: { color:C.amber, dim:C.amberDim, border:C.amberBorder, icon:"●", label:"Normal" },
  low:    { color:C.green, dim:C.greenDim, border:C.greenBorder, icon:"●", label:"Optionnel" },
};

const RECURRENCE = [
  { id:"none",    label:"Aucune" },
  { id:"daily",   label:"Quotidienne" },
  { id:"weekly",  label:"Hebdomadaire" },
  { id:"monthly", label:"Mensuelle" },
];

const CALENDAR_EVENTS = [
  { id:"e1",  date:"2026-05-22", title:"LA GRANDE LIBRAIRIE", time:"10:00" },
  { id:"e2",  date:"2026-05-22", title:"FURET ARRAS",         time:"11:00" },
  { id:"e3",  date:"2026-05-26", title:"CULTURA AMIENS",      time:"14:00" },
  { id:"e4",  date:"2026-05-28", title:"EYROLLES",            time:"11:00" },
  { id:"e5",  date:"2026-05-28", title:"Déjeuner Pascal",     time:"12:30" },
  { id:"e6",  date:"2026-05-28", title:"COMME UN ROMAN",      time:"15:30" },
  { id:"e7",  date:"2026-05-29", title:"COMME UN ROMAN",      time:"11:00" },
  { id:"e8",  date:"2026-05-29", title:"EYROLLES",            time:"12:30" },
  { id:"e9",  date:"2026-05-29", title:"LIBRAIRIE ICI",       time:"15:00" },
  { id:"e10", date:"2026-06-01", title:"CULTURA L'ISLE ADAM", time:"11:00" },
  { id:"e11", date:"2026-06-01", title:"LECLERC CHAMBLY",     time:"14:00" },
  { id:"e12", date:"2026-06-02", title:"LECLERC FOSSES",      time:"10:30" },
  { id:"e13", date:"2026-06-02", title:"LE GRAND CERCLE",     time:"14:00" },
  { id:"e14", date:"2026-06-03", title:"E.C. OUTREAU",        time:"10:00" },
  { id:"e15", date:"2026-06-04", title:"STUDIO LIVRE",        time:"10:00" },
  { id:"e16", date:"2026-06-05", title:"DELAMAIN",            time:"10:00" },
  { id:"e17", date:"2026-06-05", title:"FNAC FORUM",          time:"15:00" },
  { id:"e18", date:"2026-06-08", title:"LECLERC TRIE",        time:"14:00" },
  { id:"e19", date:"2026-06-09", title:"CROCOLIVRE",          time:"10:30" },
  { id:"e20", date:"2026-06-10", title:"LECLERC OSNY",        time:"10:00" },
  { id:"e21", date:"2026-06-11", title:"BHV",                 time:"11:00" },
  { id:"e22", date:"2026-06-12", title:"LES TRAVERSÉES",      time:"15:00" },
];

const today = () => new Date().toISOString().slice(0,10);
const fmt = d => new Date(d+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"2-digit",month:"long"});
const fmtShort = d => new Date(d+"T12:00:00").toLocaleDateString("fr-FR",{day:"2-digit",month:"short"});
const daysLate = d => Math.floor((new Date(today()) - new Date(d)) / 86400000);
const load = (k,def) => { try{ const v=localStorage.getItem(k); return v?JSON.parse(v):def; }catch{ return def; } };
const save = (k,v) => { try{ localStorage.setItem(k,JSON.stringify(v)); }catch{} };

function getWeekDays() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day===0?6:day-1));
  return Array.from({length:7},(_,i)=>{
    const d = new Date(monday);
    d.setDate(monday.getDate()+i);
    return d.toISOString().slice(0,10);
  });
}

function nextOccurrence(task) {
  const base = new Date(task.completedAt||today());
  switch(task.recurrence){
    case "daily":   base.setDate(base.getDate()+1); break;
    case "weekly":  base.setDate(base.getDate()+7); break;
    case "monthly": base.setMonth(base.getMonth()+1); break;
    default: return null;
  }
  return base.toISOString().slice(0,10);
}

function PriorityDot({p, size=7}){
  const pr = PRIORITY[p]||PRIORITY.normal;
  return <span style={{display:"inline-block",width:size,height:size,borderRadius:"50%",
    background:pr.color,flexShrink:0,boxShadow:`0 0 8px ${pr.color}99`}}/>;
}

function Badge({children, color, dim, border}){
  return(
    <span style={{fontSize:10,fontWeight:700,letterSpacing:.3,
      background:dim, color, border:`1px solid ${border}`,
      padding:"2px 8px",borderRadius:20,whiteSpace:"nowrap"}}>
      {children}
    </span>
  );
}

function SectionLabel({color, children}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
      <span style={{width:3,height:14,borderRadius:2,background:color,flexShrink:0,
        boxShadow:`0 0 8px ${color}88`}}/>
      <span style={{fontSize:11,fontWeight:700,color,letterSpacing:.8,textTransform:"uppercase"}}>
        {children}
      </span>
    </div>
  );
}

function Btn({onClick,children,variant="ghost",style={},disabled=false}){
  const base={border:"none",cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",
    borderRadius:10,fontSize:13,fontWeight:600,padding:"9px 16px",
    transition:"all .18s ease",opacity:disabled?.35:1};
  const v={
    ghost:{background:"transparent",color:C.muted},
    primary:{
      background:`linear-gradient(135deg, ${C.accent}, #6e5ff0)`,
      color:"#fff",
      boxShadow:`0 4px 20px ${C.accentGlow}, 0 1px 0 rgba(255,255,255,.1) inset`,
    },
    outline:{background:"transparent",color:C.accent,border:`1px solid ${C.accentBorder}`},
    soft:{background:C.accentDim,color:C.accent,border:`1px solid ${C.accentBorder}`},
    danger:{background:C.redDim,color:C.red,border:`1px solid ${C.redBorder}`},
  };
  return <button onClick={disabled?undefined:onClick} style={{...base,...v[variant],...style}}>{children}</button>;
}

function Modal({open,onClose,title,children}){
  if(!open) return null;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",backdropFilter:"blur(12px)",
      zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}}
      onClick={onClose}>
      <div style={{
        background:`linear-gradient(180deg, ${C.hover} 0%, ${C.card} 100%)`,
        border:`1px solid ${C.borderLight}`,
        borderRadius:"24px 24px 0 0",padding:"24px 24px 44px",
        width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto",
        boxShadow:`0 -20px 60px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.03) inset`,
      }}
        onClick={e=>e.stopPropagation()}>
        <div style={{width:40,height:4,background:C.borderLight,borderRadius:2,margin:"0 auto 24px",opacity:.6}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <span style={{fontWeight:700,fontSize:17,color:C.ink,letterSpacing:-.3}}>{title}</span>
          <button onClick={onClose} style={{background:C.subtle,border:"none",color:C.muted,
            cursor:"pointer",fontSize:14,lineHeight:1,padding:"6px 8px",borderRadius:8,
            width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const iStyle = {
  background:C.surface,
  border:`1px solid ${C.border}`,
  color:C.ink,
  padding:"11px 14px",
  borderRadius:12,
  fontSize:14,
  outline:"none",
  fontFamily:"inherit",
  width:"100%",
  boxSizing:"border-box",
  transition:"border-color .15s, box-shadow .15s",
};

function TaskCard({task, onDone, onDelete, onEdit}){
  const pr = PRIORITY[task.priority]||PRIORITY.normal;
  const late = task.dueDate ? daysLate(task.dueDate) : 0;
  const isLate = late > 0 && !task.done;
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);

  return(
    <div
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>setHovered(false)}
      style={{
        background: hovered ? C.hover : C.card,
        borderRadius:14,
        border:`1px solid ${isLate ? C.redBorder : hovered ? C.borderLight : C.border}`,
        overflow:"hidden",
        transition:"all .18s ease",
        boxShadow: hovered ? `0 4px 24px rgba(0,0,0,.35)` : `0 1px 4px rgba(0,0,0,.2)`,
        display:"flex",
      }}>
      <div style={{width:3,background:pr.color,flexShrink:0,opacity:.9,
        boxShadow:`2px 0 12px ${pr.color}44`}}/>
      <div style={{padding:"13px 14px",flex:1,minWidth:0}}>
        <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
          <button onClick={()=>onDone(task)} style={{
            width:20,height:20,borderRadius:6,
            border:`1.5px solid ${task.done ? C.green : C.borderLight}`,
            background:task.done ? C.green : "transparent",
            flexShrink:0,marginTop:2,
            display:"flex",alignItems:"center",justifyContent:"center",
            cursor:"pointer",color:"#06060f",fontSize:11,fontWeight:900,
            transition:"all .15s",
            boxShadow: task.done ? `0 0 10px ${C.green}55` : "none",
          }}>
            {task.done ? "✓" : ""}
          </button>
          <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>setExpanded(e=>!e)}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
              <span style={{
                fontSize:14,fontWeight:600,letterSpacing:-.2,
                color:task.done ? C.muted : C.ink,
                textDecoration:task.done ? "line-through" : "none",
              }}>
                {task.title}
              </span>
              {task.recurrence!=="none" && (
                <span style={{fontSize:9,color:C.accent,background:C.accentDim,
                  border:`1px solid ${C.accentBorder}`,padding:"1px 6px",borderRadius:20,
                  fontWeight:700,letterSpacing:.3}}>RÉCURRENT</span>
              )}
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{fontSize:10,fontWeight:700,color:pr.color,
                background:pr.dim,border:`1px solid ${pr.border}`,
                padding:"1px 7px",borderRadius:20}}>
                {pr.label}
              </span>
              {task.dueDate && (
                <span style={{fontSize:10,color:isLate ? C.red : C.muted,fontWeight:isLate?700:400,
                  background:isLate?C.redDim:"transparent",
                  border:isLate?`1px solid ${C.redBorder}`:"none",
                  padding:isLate?"1px 7px":"0",borderRadius:20}}>
                  {isLate ? `⚠ ${late}j de retard` : fmtShort(task.dueDate)}
                </span>
              )}
            </div>
          </div>
          <div style={{display:"flex",gap:2,opacity:hovered?1:0,transition:"opacity .15s"}}>
            <button onClick={()=>onEdit(task)} style={{
              background:C.subtle,border:"none",color:C.muted,cursor:"pointer",
              fontSize:12,padding:"4px 7px",borderRadius:7,transition:"all .15s",
            }}>✎</button>
            <button onClick={()=>onDelete(task.id)} style={{
              background:C.redDim,border:"none",color:C.red,cursor:"pointer",
              fontSize:12,padding:"4px 7px",borderRadius:7,transition:"all .15s",
            }}>✕</button>
          </div>
        </div>
        {expanded && task.content && (
          <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${C.border}`,
            fontSize:13,color:C.muted,lineHeight:1.7,paddingLeft:30}}>
            {task.content}
          </div>
        )}
        {expanded && (
          <div style={{display:"flex",gap:8,marginTop:10,paddingLeft:30}}>
            <Btn onClick={()=>{
              const txt=`${task.title}\n\n${task.content||""}`;
              window.location.href=`mailto:?subject=${encodeURIComponent(task.title)}&body=${encodeURIComponent(txt)}`;
            }} variant="outline" style={{fontSize:11,padding:"5px 10px"}}>📧 Envoyer</Btn>
            <Btn onClick={()=>navigator.clipboard.writeText(`${task.title}\n${task.content||""}`)}
              variant="soft" style={{fontSize:11,padding:"5px 10px"}}>📋 Copier</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskForm({initial, onSave, onCancel}){
  const [title,setTitle]=useState(initial?.title||"");
  const [content,setContent]=useState(initial?.content||"");
  const [priority,setPriority]=useState(initial?.priority||"normal");
  const [dueDate,setDueDate]=useState(initial?.dueDate||"");
  const [recurrence,setRecurrence]=useState(initial?.recurrence||"none");

  function save(){
    if(!title.trim()) return;
    onSave({title:title.trim(),content:content.trim(),priority,dueDate:dueDate||null,recurrence});
  }

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <input value={title} onChange={e=>setTitle(e.target.value)}
        placeholder="Titre de la tâche…" autoFocus
        onKeyDown={e=>{if(e.key==="Enter"&&e.metaKey)save();}}
        style={{...iStyle,fontSize:15,fontWeight:600,letterSpacing:-.2}}/>
      <textarea value={content} onChange={e=>setContent(e.target.value)}
        placeholder="Détails… (optionnel)" rows={3}
        style={{...iStyle,resize:"none",lineHeight:1.65}}/>
      <div>
        <label style={{fontSize:10,color:C.muted,display:"block",marginBottom:10,
          fontWeight:700,letterSpacing:.8,textTransform:"uppercase"}}>Priorité</label>
        <div style={{display:"flex",gap:8}}>
          {Object.entries(PRIORITY).map(([key,pr])=>(
            <button key={key} onClick={()=>setPriority(key)} style={{
              flex:1,padding:"10px 6px",borderRadius:12,
              border:`1px solid ${priority===key ? pr.color : C.border}`,
              background:priority===key ? pr.dim : C.surface,
              color:priority===key ? pr.color : C.muted,
              cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,
              transition:"all .15s",
            }}>
              <PriorityDot p={key}/>
              <br/>
              <span style={{fontSize:10,marginTop:4,display:"block"}}>{pr.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label style={{fontSize:10,color:C.muted,display:"block",marginBottom:8,
          fontWeight:700,letterSpacing:.8,textTransform:"uppercase"}}>Échéance (optionnel)</label>
        <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}
          style={{...iStyle,colorScheme:"dark"}}/>
      </div>
      <div>
        <label style={{fontSize:10,color:C.muted,display:"block",marginBottom:10,
          fontWeight:700,letterSpacing:.8,textTransform:"uppercase"}}>Récurrence</label>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {RECURRENCE.map(r=>(
            <button key={r.id} onClick={()=>setRecurrence(r.id)} style={{
              padding:"7px 14px",borderRadius:20,
              border:`1px solid ${recurrence===r.id ? C.accent : C.border}`,
              background:recurrence===r.id ? C.accentDim : C.surface,
              color:recurrence===r.id ? C.accent : C.muted,
              cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600,
              transition:"all .15s",
            }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:4}}>
        <Btn onClick={onCancel}>Annuler</Btn>
        <Btn onClick={save} variant="primary" disabled={!title.trim()}>
          {initial ? "Modifier" : "Créer"} ⌘↵
        </Btn>
      </div>
    </div>
  );
}

export default function TaskFlow(){
  const [tasks,setTasks]=useState(()=>load("tf_tasks",[]));
  const [formOpen,setFormOpen]=useState(false);
  const [editTask,setEditTask]=useState(null);
  const [confirmId,setConfirmId]=useState(null);
  const [showDone,setShowDone]=useState(false);
  const weekDays=getWeekDays();

  useEffect(()=>save("tf_tasks",tasks),[tasks]);

  useEffect(()=>{
    const slide=()=>{
      const t=today();
      setTasks(prev=>prev.map(task=>{
        if(task.done) return task;
        const eff=task.effectiveDate||task.createdAt;
        if(eff<t) return {...task,effectiveDate:t};
        return task;
      }));
    };
    slide();
    const now=new Date();
    const ms=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1)-now;
    const t=setTimeout(slide,ms);
    return()=>clearTimeout(t);
  },[]);

  function createTask(data){
    setTasks(prev=>[{id:Date.now(),...data,createdAt:today(),effectiveDate:today(),done:false,completedAt:null},...prev]);
    setFormOpen(false);
  }

  function updateTask(data){
    setTasks(prev=>prev.map(t=>t.id===editTask.id?{...t,...data}:t));
    setEditTask(null);
  }

  function doneTask(task){
    if(task.done){
      setTasks(prev=>prev.map(t=>t.id===task.id?{...t,done:false,completedAt:null,effectiveDate:today()}:t));
      return;
    }
    if(task.recurrence!=="none"){
      const next=nextOccurrence({...task,completedAt:today()});
      setTasks(prev=>prev.map(t=>t.id===task.id?{...t,done:false,effectiveDate:next,createdAt:next,completedAt:null}:t));
    } else {
      setTasks(prev=>prev.map(t=>t.id===task.id?{...t,done:true,completedAt:today()}:t));
    }
  }

  function deleteTask(id){ setTasks(prev=>prev.filter(t=>t.id!==id)); setConfirmId(null); }

  const activeTasks=tasks.filter(t=>!t.done);
  const doneTasks=tasks.filter(t=>t.done);
  const todayTasks=activeTasks.filter(t=>(t.effectiveDate||t.createdAt)===today());
  const lateTasks=activeTasks.filter(t=>(t.effectiveDate||t.createdAt)<today());
  const upcomingTasks=activeTasks.filter(t=>(t.effectiveDate||t.createdAt)>today());
  const urgentCount=activeTasks.filter(t=>t.priority==="high").length;

  return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.ink,
      fontFamily:"-apple-system, 'Helvetica Neue', sans-serif"}}>

      {/* Header */}
      <div style={{
        background:`rgba(10,10,24,0.85)`,
        backdropFilter:"blur(20px)",
        borderBottom:`1px solid ${C.border}`,
        padding:"14px 20px",
        position:"sticky",top:0,zIndex:100,
      }}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",maxWidth:920,margin:"0 auto"}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{
                fontSize:19,fontWeight:900,letterSpacing:-1,
                background:`linear-gradient(135deg, ${C.accent}, #c0b0ff)`,
                WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
              }}>TaskFlow</span>
              {urgentCount > 0 && (
                <span style={{fontSize:10,fontWeight:700,color:C.red,background:C.redDim,
                  border:`1px solid ${C.redBorder}`,padding:"2px 8px",borderRadius:20}}>
                  {urgentCount} urgente{urgentCount>1?"s":""}
                </span>
              )}
              <span style={{fontSize:10,color:C.subtle,fontWeight:500}}>
                {activeTasks.length} tâche{activeTasks.length!==1?"s":""}
              </span>
            </div>
            <div style={{fontSize:11,color:C.muted,marginTop:3,textTransform:"capitalize",letterSpacing:.1}}>
              {fmt(today())}
            </div>
          </div>
          <button onClick={()=>setFormOpen(true)} style={{
            height:36,padding:"0 16px",borderRadius:10,
            background:`linear-gradient(135deg, ${C.accent}, #6e5ff0)`,
            border:"none",color:"#fff",fontSize:13,fontWeight:700,
            cursor:"pointer",fontFamily:"inherit",letterSpacing:.1,
            boxShadow:`0 4px 20px ${C.accentGlow}`,
            transition:"all .18s ease",
          }}>
            + Tâche
          </button>
        </div>
      </div>

      {/* Main grid */}
      <div style={{maxWidth:920,margin:"0 auto",padding:"20px",
        display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>

        {/* Left column */}
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {lateTasks.length > 0 && (
            <div>
              <SectionLabel color={C.red}>En retard · {lateTasks.length}</SectionLabel>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {lateTasks.map(t=><TaskCard key={t.id} task={t} onDone={doneTask}
                  onDelete={id=>setConfirmId(id)} onEdit={setEditTask}/>)}
              </div>
            </div>
          )}

          <div>
            <SectionLabel color={C.accent}>Aujourd'hui · {todayTasks.length}</SectionLabel>
            {todayTasks.length === 0
              ? <div style={{
                  background:C.card,borderRadius:14,
                  border:`1px dashed ${C.border}`,
                  padding:"28px 20px",textAlign:"center",
                }}>
                  <div style={{fontSize:24,marginBottom:8}}>🎉</div>
                  <div style={{fontSize:13,color:C.subtle,fontWeight:500}}>Rien pour aujourd'hui</div>
                </div>
              : <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {todayTasks.map(t=><TaskCard key={t.id} task={t} onDone={doneTask}
                    onDelete={id=>setConfirmId(id)} onEdit={setEditTask}/>)}
                </div>
            }
          </div>

          {upcomingTasks.length > 0 && (
            <div>
              <SectionLabel color={C.muted}>À venir · {upcomingTasks.length}</SectionLabel>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {upcomingTasks.map(t=><TaskCard key={t.id} task={t} onDone={doneTask}
                  onDelete={id=>setConfirmId(id)} onEdit={setEditTask}/>)}
              </div>
            </div>
          )}

          {doneTasks.length > 0 && (
            <div>
              <button onClick={()=>setShowDone(s=>!s)} style={{
                display:"flex",alignItems:"center",gap:8,marginBottom:showDone?10:0,
                fontSize:11,fontWeight:700,color:C.subtle,letterSpacing:.8,
                textTransform:"uppercase",background:"none",border:"none",
                cursor:"pointer",fontFamily:"inherit",padding:0,transition:"color .15s",
              }}>
                <span style={{width:3,height:14,borderRadius:2,background:C.subtle,flexShrink:0}}/>
                Terminées · {doneTasks.length}
                <span style={{fontSize:9,marginLeft:2}}>{showDone?"▲":"▼"}</span>
              </button>
              {showDone && (
                <div style={{display:"flex",flexDirection:"column",gap:8,opacity:.5}}>
                  {doneTasks.map(t=><TaskCard key={t.id} task={t} onDone={doneTask}
                    onDelete={id=>setConfirmId(id)} onEdit={setEditTask}/>)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column — weekly calendar */}
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          <div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:.8,
            textTransform:"uppercase",marginBottom:8}}>
            Semaine en cours
          </div>
          {weekDays.map(day=>{
            const isToday=day===today();
            const dayTasks=activeTasks.filter(t=>(t.effectiveDate||t.createdAt)===day);
            const dayEvents=CALENDAR_EVENTS.filter(e=>e.date===day);
            const d=new Date(day+"T12:00:00");
            const isPast=day<today();
            return(
              <div key={day} style={{
                background: isToday
                  ? `linear-gradient(135deg, ${C.hover} 0%, rgba(157,143,255,.06) 100%)`
                  : C.card,
                borderRadius:12,
                border:`1px solid ${isToday ? C.accentBorder : C.border}`,
                padding:"10px 12px",
                opacity:isPast&&!isToday ? .5 : 1,
                minHeight:48,
                boxShadow: isToday ? `0 0 0 1px ${C.accentBorder}, 0 4px 20px ${C.accentGlow}` : "none",
                transition:"all .15s",
              }}>
                <div style={{display:"flex",alignItems:"center",
                  justifyContent:"space-between",
                  marginBottom:(dayTasks.length||dayEvents.length)?8:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{
                      width:30,height:30,borderRadius:9,
                      background: isToday
                        ? `linear-gradient(135deg, ${C.accent}, #6e5ff0)`
                        : C.surface,
                      display:"flex",flexDirection:"column",
                      alignItems:"center",justifyContent:"center",
                      border:`1px solid ${isToday ? "transparent" : C.border}`,
                      boxShadow: isToday ? `0 2px 12px ${C.accentGlow}` : "none",
                    }}>
                      <span style={{fontSize:7,color:isToday?"rgba(255,255,255,.75)":C.muted,
                        textTransform:"uppercase",lineHeight:1,fontWeight:700}}>
                        {d.toLocaleDateString("fr-FR",{weekday:"short"}).slice(0,3)}
                      </span>
                      <span style={{fontSize:13,fontWeight:800,
                        color:isToday?"#fff":C.ink,lineHeight:1.1}}>
                        {d.getDate()}
                      </span>
                    </div>
                    {isToday && (
                      <span style={{fontSize:10,color:C.accent,fontWeight:700,letterSpacing:.2}}>
                        Aujourd'hui
                      </span>
                    )}
                  </div>
                  <div style={{display:"flex",gap:4}}>
                    {dayTasks.length > 0 && (
                      <Badge color={C.accent} dim={C.accentDim} border={C.accentBorder}>
                        {dayTasks.length} tâche{dayTasks.length>1?"s":""}
                      </Badge>
                    )}
                    {dayEvents.length > 0 && (
                      <Badge color={C.blue} dim={C.blueDim} border={`${C.blue}44`}>
                        {dayEvents.length} RDV
                      </Badge>
                    )}
                  </div>
                </div>
                {dayTasks.map(t=>(
                  <div key={t.id} style={{display:"flex",alignItems:"center",gap:6,
                    padding:"4px 0",borderBottom:`1px solid ${C.border}`}}>
                    <PriorityDot p={t.priority} size={5}/>
                    <span style={{fontSize:11,color:C.ink,flex:1,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:500}}>
                      {t.title}
                    </span>
                    <button onClick={()=>doneTask(t)} style={{background:"none",border:"none",
                      color:C.green,cursor:"pointer",fontSize:12,padding:2,
                      opacity:.7,transition:"opacity .15s"}}>✓</button>
                  </div>
                ))}
                {dayEvents.map(ev=>(
                  <div key={ev.id} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0"}}>
                    <span style={{fontSize:9,color:C.blue,fontFamily:"monospace",
                      minWidth:32,fontWeight:700}}>{ev.time}</span>
                    <span style={{fontSize:11,color:C.muted,flex:1,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {ev.title}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <Modal open={formOpen} onClose={()=>setFormOpen(false)} title="Nouvelle tâche">
        <TaskForm onSave={createTask} onCancel={()=>setFormOpen(false)}/>
      </Modal>
      <Modal open={!!editTask} onClose={()=>setEditTask(null)} title="Modifier la tâche">
        {editTask&&<TaskForm initial={editTask} onSave={updateTask} onCancel={()=>setEditTask(null)}/>}
      </Modal>
      <Modal open={!!confirmId} onClose={()=>setConfirmId(null)} title="Supprimer la tâche">
        <p style={{fontSize:14,color:C.muted,lineHeight:1.7,marginBottom:24}}>
          Cette tâche sera supprimée définitivement.
          <br/><span style={{fontSize:12,color:C.subtle}}>Cette action est irréversible.</span>
        </p>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <Btn onClick={()=>setConfirmId(null)}>Annuler</Btn>
          <Btn variant="danger" onClick={()=>deleteTask(confirmId)}>Supprimer</Btn>
        </div>
      </Modal>

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:4px}
        input:focus, textarea:focus {
          border-color: ${C.accent} !important;
          box-shadow: 0 0 0 3px ${C.accentGlow} !important;
        }
        button:active { transform: scale(.96); }
      `}</style>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";

const C = {
  bg:"#0a0a0f", surface:"#111118", card:"#18181f", hover:"#1e1e28",
  border:"#252530", borderLight:"#32323f",
  ink:"#eeeef5", muted:"#7777a0", subtle:"#3a3a50",
  accent:"#7c6af7", accentDim:"#7c6af720", accentBorder:"#7c6af755",
  red:"#f7706a", redDim:"#f7706a18", redBorder:"#f7706a44",
  amber:"#f5a623", amberDim:"#f5a62318", amberBorder:"#f5a62344",
  green:"#5de0a0", greenDim:"#5de0a018", greenBorder:"#5de0a044",
  blue:"#60b4fa", blueDim:"#60b4fa15",
};

const PRIORITY = {
  high:   { color:C.red,   dim:C.redDim,   border:C.redBorder,   icon:"🔴", label:"Urgent" },
  normal: { color:C.amber, dim:C.amberDim, border:C.amberBorder, icon:"🟡", label:"Normal" },
  low:    { color:C.green, dim:C.greenDim, border:C.greenBorder, icon:"🟢", label:"Quand possible" },
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
const fmt = d => new Date(d+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"short",day:"2-digit",month:"short"});
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

function PriorityDot({p, size=8}){
  const pr = PRIORITY[p]||PRIORITY.normal;
  return <span style={{display:"inline-block",width:size,height:size,borderRadius:"50%",
    background:pr.color,flexShrink:0,boxShadow:`0 0 6px ${pr.color}88`}}/>;
}

function Btn({onClick,children,variant="ghost",style={},disabled=false}){
  const base={border:"none",cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",
    borderRadius:8,fontSize:13,fontWeight:600,padding:"8px 14px",transition:"all .15s",opacity:disabled?.4:1};
  const v={
    ghost:{background:"transparent",color:C.muted},
    primary:{background:C.accent,color:"#fff",boxShadow:`0 2px 12px ${C.accent}55`},
    outline:{background:"transparent",color:C.accent,border:`1.5px solid ${C.accentBorder}`},
    soft:{background:C.accentDim,color:C.accent,border:`1px solid ${C.accentBorder}`},
    danger:{background:C.redDim,color:C.red,border:`1px solid ${C.redBorder}`},
  };
  return <button onClick={disabled?undefined:onClick} style={{...base,...v[variant],...style}}>{children}</button>;
}

function Modal({open,onClose,title,children}){
  if(!open) return null;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",backdropFilter:"blur(6px)",
      zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}}
      onClick={onClose}>
      <div style={{background:C.card,borderRadius:"20px 20px 0 0",padding:"24px 20px 40px",
        width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto"}}
        onClick={e=>e.stopPropagation()}>
        <div style={{width:36,height:4,background:C.border,borderRadius:2,margin:"0 auto 20px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <span style={{fontWeight:700,fontSize:16,color:C.ink}}>{title}</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,
            cursor:"pointer",fontSize:20,lineHeight:1,padding:4}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const iStyle = {
  background:C.surface, border:`1.5px solid ${C.border}`, color:C.ink,
  padding:"10px 14px", borderRadius:10, fontSize:14, outline:"none",
  fontFamily:"inherit", width:"100%", boxSizing:"border-box",
};

function TaskCard({task, onDone, onDelete, onEdit}){
  const pr = PRIORITY[task.priority]||PRIORITY.normal;
  const late = task.dueDate ? daysLate(task.dueDate) : 0;
  const isLate = late > 0 && !task.done;
  const [expanded, setExpanded] = useState(false);

  return(
    <div style={{background:C.card,borderRadius:12,border:`1px solid ${isLate?C.redBorder:C.border}`,overflow:"hidden"}}>
      <div style={{height:3,background:pr.color,opacity:.8}}/>
      <div style={{padding:"12px 14px"}}>
        <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
          <button onClick={()=>onDone(task)} style={{
            width:22,height:22,borderRadius:6,border:`2px solid ${task.done?C.green:C.border}`,
            background:task.done?C.green:"transparent",flexShrink:0,marginTop:1,
            display:"flex",alignItems:"center",justifyContent:"center",
            cursor:"pointer",color:"#000",fontSize:13,fontWeight:800}}>
            {task.done?"✓":""}
          </button>
          <div style={{flex:1,minWidth:0}} onClick={()=>setExpanded(e=>!e)}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <span style={{fontSize:14,fontWeight:700,color:task.done?C.muted:C.ink,
                textDecoration:task.done?"line-through":"none"}}>
                {task.title}
              </span>
              {task.recurrence!=="none"&&<span style={{fontSize:10,color:C.accent,
                background:C.accentDim,padding:"1px 6px",borderRadius:10}}>🔁</span>}
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
              <PriorityDot p={task.priority}/>
              <span style={{fontSize:11,color:pr.color,fontWeight:600}}>{pr.label}</span>
              {task.dueDate&&<><span style={{fontSize:11,color:C.subtle}}>·</span>
                <span style={{fontSize:11,color:isLate?C.red:C.muted,fontWeight:isLate?700:400}}>
                  {isLate?`⚠ ${late}j de retard`:fmtShort(task.dueDate)}
                </span></>}
            </div>
          </div>
          <div style={{display:"flex",gap:4}}>
            <button onClick={()=>onEdit(task)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:14,padding:4}}>✎</button>
            <button onClick={()=>onDelete(task.id)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:14,padding:4}}>✕</button>
          </div>
        </div>
        {expanded&&task.content&&(
          <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${C.border}`,
            fontSize:13,color:C.muted,lineHeight:1.65,paddingLeft:32}}>
            {task.content}
          </div>
        )}
        {expanded&&(
          <div style={{display:"flex",gap:8,marginTop:10,paddingLeft:32}}>
            <Btn onClick={()=>{
              const txt=`${task.title}\n\n${task.content||""}`;
              window.location.href=`mailto:?subject=${encodeURIComponent(task.title)}&body=${encodeURIComponent(txt)}`;
            }} variant="outline" style={{fontSize:11,padding:"4px 10px"}}>📧 Envoyer</Btn>
            <Btn onClick={()=>navigator.clipboard.writeText(`${task.title}\n${task.content||""}`)}
              variant="soft" style={{fontSize:11,padding:"4px 10px"}}>📋 Copier</Btn>
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
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Titre de la tâche…" autoFocus
        onKeyDown={e=>{if(e.key==="Enter"&&e.metaKey)save();}} style={{...iStyle,fontSize:15,fontWeight:600}}/>
      <textarea value={content} onChange={e=>setContent(e.target.value)}
        placeholder="Détails… (optionnel)" rows={3} style={{...iStyle,resize:"none",lineHeight:1.6}}/>
      <div>
        <label style={{fontSize:11,color:C.muted,display:"block",marginBottom:8,fontWeight:600,letterSpacing:.5,textTransform:"uppercase"}}>Priorité</label>
        <div style={{display:"flex",gap:8}}>
          {Object.entries(PRIORITY).map(([key,pr])=>(
            <button key={key} onClick={()=>setPriority(key)} style={{
              flex:1,padding:"8px 4px",borderRadius:10,
              border:`1.5px solid ${priority===key?pr.color:C.border}`,
              background:priority===key?pr.dim:"transparent",
              color:priority===key?pr.color:C.muted,
              cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600}}>
              {pr.icon}<br/><span style={{fontSize:10}}>{pr.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label style={{fontSize:11,color:C.muted,display:"block",marginBottom:6,fontWeight:600,letterSpacing:.5,textTransform:"uppercase"}}>Échéance (optionnel)</label>
        <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} style={{...iStyle,colorScheme:"dark"}}/>
      </div>
      <div>
        <label style={{fontSize:11,color:C.muted,display:"block",marginBottom:8,fontWeight:600,letterSpacing:.5,textTransform:"uppercase"}}>Récurrence</label>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {RECURRENCE.map(r=>(
            <button key={r.id} onClick={()=>setRecurrence(r.id)} style={{
              padding:"6px 12px",borderRadius:20,
              border:`1.5px solid ${recurrence===r.id?C.accent:C.border}`,
              background:recurrence===r.id?C.accentDim:"transparent",
              color:recurrence===r.id?C.accent:C.muted,
              cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600}}>
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:4}}>
        <Btn onClick={onCancel}>Annuler</Btn>
        <Btn onClick={save} variant="primary" disabled={!title.trim()}>{initial?"Modifier":"Créer"} ⌘↵</Btn>
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
    <div style={{minHeight:"100vh",background:C.bg,color:C.ink,fontFamily:"'Helvetica Neue',sans-serif"}}>
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"16px",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",maxWidth:900,margin:"0 auto"}}>
          <div>
            <div style={{display:"flex",alignItems:"baseline",gap:10}}>
              <span style={{fontSize:20,fontWeight:900,color:C.accent,letterSpacing:-1}}>TaskFlow</span>
              <span style={{fontSize:11,color:C.subtle,fontFamily:"monospace"}}>
                {activeTasks.length} actives{urgentCount>0?` · ${urgentCount} urgentes`:""}
              </span>
            </div>
            <div style={{fontSize:11,color:C.muted,marginTop:2}}>{fmt(today())}</div>
          </div>
          <button onClick={()=>setFormOpen(true)} style={{height:38,padding:"0 18px",borderRadius:10,
            background:C.accent,border:"none",color:"#fff",fontSize:13,fontWeight:700,
            cursor:"pointer",fontFamily:"inherit",boxShadow:`0 2px 14px ${C.accent}55`}}>
            + Tâche
          </button>
        </div>
      </div>

      <div style={{maxWidth:900,margin:"0 auto",padding:"16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {lateTasks.length>0&&(
            <div>
              <div style={{fontSize:11,fontWeight:700,color:C.red,letterSpacing:.8,textTransform:"uppercase",marginBottom:8}}>
                ● En retard ({lateTasks.length})
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {lateTasks.map(t=><TaskCard key={t.id} task={t} onDone={doneTask} onDelete={id=>setConfirmId(id)} onEdit={setEditTask}/>)}
              </div>
            </div>
          )}
          <div>
            <div style={{fontSize:11,fontWeight:700,color:C.accent,letterSpacing:.8,textTransform:"uppercase",marginBottom:8}}>
              ● Aujourd'hui ({todayTasks.length})
            </div>
            {todayTasks.length===0
              ? <div style={{background:C.card,borderRadius:12,border:`1px dashed ${C.border}`,padding:"24px",textAlign:"center",color:C.subtle,fontSize:13}}>
                  Aucune tâche pour aujourd'hui 🎉
                </div>
              : <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {todayTasks.map(t=><TaskCard key={t.id} task={t} onDone={doneTask} onDelete={id=>setConfirmId(id)} onEdit={setEditTask}/>)}
                </div>
            }
          </div>
          {upcomingTasks.length>0&&(
            <div>
              <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:.8,textTransform:"uppercase",marginBottom:8}}>
                ● À venir ({upcomingTasks.length})
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {upcomingTasks.map(t=><TaskCard key={t.id} task={t} onDone={doneTask} onDelete={id=>setConfirmId(id)} onEdit={setEditTask}/>)}
              </div>
            </div>
          )}
          {doneTasks.length>0&&(
            <div>
              <button onClick={()=>setShowDone(s=>!s)} style={{fontSize:11,fontWeight:700,color:C.subtle,
                letterSpacing:.8,textTransform:"uppercase",background:"none",border:"none",
                cursor:"pointer",fontFamily:"inherit",padding:0,marginBottom:showDone?8:0}}>
                ● Terminées ({doneTasks.length}) {showDone?"▲":"▼"}
              </button>
              {showDone&&<div style={{display:"flex",flexDirection:"column",gap:8,opacity:.6}}>
                {doneTasks.map(t=><TaskCard key={t.id} task={t} onDone={doneTask} onDelete={id=>setConfirmId(id)} onEdit={setEditTask}/>)}
              </div>}
            </div>
          )}
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:.8,textTransform:"uppercase",marginBottom:6}}>
            Semaine en cours
          </div>
          {weekDays.map(day=>{
            const isToday=day===today();
            const dayTasks=activeTasks.filter(t=>(t.effectiveDate||t.createdAt)===day);
            const dayEvents=CALENDAR_EVENTS.filter(e=>e.date===day);
            const d=new Date(day+"T12:00:00");
            const isPast=day<today();
            return(
              <div key={day} style={{background:isToday?C.hover:C.card,borderRadius:10,
                border:`1.5px solid ${isToday?C.accent:C.border}`,
                padding:"10px 12px",opacity:isPast&&!isToday?.65:1,minHeight:50}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:(dayTasks.length||dayEvents.length)?8:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:28,height:28,borderRadius:8,background:isToday?C.accent:C.surface,
                      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                      border:`1px solid ${isToday?C.accent:C.border}`}}>
                      <span style={{fontSize:7,color:isToday?"#fff":C.muted,textTransform:"uppercase",lineHeight:1}}>
                        {d.toLocaleDateString("fr-FR",{weekday:"short"}).slice(0,3)}
                      </span>
                      <span style={{fontSize:13,fontWeight:800,color:isToday?"#fff":C.ink,lineHeight:1}}>{d.getDate()}</span>
                    </div>
                    {isToday&&<span style={{fontSize:10,color:C.accent,fontWeight:700}}>Aujourd'hui</span>}
                  </div>
                  <div style={{display:"flex",gap:4}}>
                    {dayTasks.length>0&&<span style={{fontSize:10,background:C.accentDim,color:C.accent,
                      border:`1px solid ${C.accentBorder}`,padding:"1px 6px",borderRadius:10,fontWeight:700}}>
                      {dayTasks.length} tâche{dayTasks.length>1?"s":""}
                    </span>}
                    {dayEvents.length>0&&<span style={{fontSize:10,background:C.blueDim,color:C.blue,
                      border:`1px solid ${C.blue}44`,padding:"1px 6px",borderRadius:10,fontWeight:700}}>
                      {dayEvents.length} RDV
                    </span>}
                  </div>
                </div>
                {dayTasks.map(t=>(
                  <div key={t.id} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 0",borderBottom:`1px solid ${C.border}`}}>
                    <PriorityDot p={t.priority} size={6}/>
                    <span style={{fontSize:12,color:C.ink,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</span>
                    <button onClick={()=>doneTask(t)} style={{background:"none",border:"none",color:C.green,cursor:"pointer",fontSize:12,padding:2}}>✓</button>
                  </div>
                ))}
                {dayEvents.map(ev=>(
                  <div key={ev.id} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 0"}}>
                    <span style={{fontSize:9,color:C.blue,fontFamily:"monospace",minWidth:32}}>{ev.time}</span>
                    <span style={{fontSize:11,color:C.muted,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.title}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <Modal open={formOpen} onClose={()=>setFormOpen(false)} title="✚ Nouvelle tâche">
        <TaskForm onSave={createTask} onCancel={()=>setFormOpen(false)}/>
      </Modal>
      <Modal open={!!editTask} onClose={()=>setEditTask(null)} title="✎ Modifier la tâche">
        {editTask&&<TaskForm initial={editTask} onSave={updateTask} onCancel={()=>setEditTask(null)}/>}
      </Modal>
      <Modal open={!!confirmId} onClose={()=>setConfirmId(null)} title="🗑 Confirmer la suppression">
        <p style={{fontSize:14,color:C.muted,lineHeight:1.6,marginBottom:20}}>
          Supprimer cette tâche définitivement ?<br/>
          <span style={{fontSize:12,color:C.subtle}}>Cette action est irréversible.</span>
        </p>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <Btn onClick={()=>setConfirmId(null)}>Annuler</Btn>
          <Btn variant="danger" onClick={()=>deleteTask(confirmId)}>Supprimer</Btn>
        </div>
      </Modal>

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#333;border-radius:4px}
        input:focus,textarea:focus{border-color:${C.accent} !important}
        button:active{transform:scale(.97)}
      `}</style>
    </div>
  );
}

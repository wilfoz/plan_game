import { useState } from "react";

// ─── PALETA ──────────────────────────────────────────────────────────────────
const C={bg:"#060B12",surface:"#0B1220",surf2:"#101C2E",surf3:"#162236",
  border:"#1A2E48",border2:"#1F3A5A",gold:"#C8941A",goldL:"#EDB84A",
  goldDim:"#7A5510",greenL:"#16C76E",redL:"#E03C2E",yellow:"#D4890A",
  blueL:"#3A8FCC",txt:"#C8DDEF",txt2:"#6A90B4",txt3:"#304A64"};
const fmt=n=>(n||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtI=n=>Math.round(n||0).toLocaleString("pt-BR");
const sc=v=>v>=80?C.greenL:v>=60?C.yellow:C.redL;
let _uid=0; const uid=()=>++_uid;

// ─── CATÁLOGOS ────────────────────────────────────────────────────────────────
const MO_CAT=[
  {id:"mo1",cargo:"AJUDANTE GERAL",sal:2564.10},
  {id:"mo2",cargo:"MONTADOR I",sal:2811.44},
  {id:"mo3",cargo:"MONTADOR II",sal:3092.58},
  {id:"mo4",cargo:"MONTADOR III",sal:3401.83},
  {id:"mo5",cargo:"ENCARREGADO DE TURMA",sal:8614.07},
  {id:"mo6",cargo:"OPERADOR DE GUINDASTE",sal:8614.07},
  {id:"mo7",cargo:"OPERADOR DE PULLER/FREIO",sal:8614.07},
  {id:"mo8",cargo:"MOTORISTA DE CAMINHÃO",sal:3095.40},
  {id:"mo9",cargo:"MOTORISTA OPERADOR MUNCK I",sal:2965.78},
  {id:"mo10",cargo:"MOTORISTA OPERADOR MUNCK II",sal:3742.55},
  {id:"mo11",cargo:"TECNICO DE SEGURANCA DO TRABALHO",sal:5557.47},
  {id:"mo12",cargo:"SUPERVISOR TECNICO LT",sal:13351.83},
  {id:"mo13",cargo:"ENGENHEIRO DE SEGURANCA",sal:14345.10},
  {id:"mo14",cargo:"ELETRICISTA I",sal:2395.60},
  {id:"mo15",cargo:"ELETRICISTA II",sal:2486.00},
  {id:"mo16",cargo:"ESPOREIRO I",sal:2652.30},
  {id:"mo17",cargo:"ESPOREIRO II",sal:2895.25},
  {id:"mo18",cargo:"ESPOREIRO III",sal:3155.85},
  {id:"mo19",cargo:"OPERADOR DE MAQUINAS PESADAS I",sal:3467.69},
  {id:"mo20",cargo:"OPERADOR DE MAQUINAS PESADAS II",sal:3779.80},
  {id:"mo21",cargo:"TOPOGRAFO DE OBRAS",sal:8614.07},
  {id:"mo22",cargo:"AUXILIAR DE TOPOGRAFIA",sal:2096.63},
  {id:"mo23",cargo:"PEDREIRO",sal:2617.78},
  {id:"mo24",cargo:"SOLDADOR",sal:3172.44},
  {id:"mo25",cargo:"SUPERVISOR DE OBRAS",sal:13351.83},
];
const EQ_CAT=[
  {id:"eq1",nome:"GUINDASTE",loc:150000},
  {id:"eq2",nome:"CONJUNTO LANÇAMENTO - CONDUTOR",loc:287500},
  {id:"eq3",nome:"CONJUNTO LANÇAMENTO - OPGW",loc:195500},
  {id:"eq4",nome:"PULLER P/ CABO CONDUTOR",loc:28750},
  {id:"eq5",nome:"PULLER P/ CABO OPGW",loc:23000},
  {id:"eq6",nome:"FREIO P/ CABO CONDUTOR",loc:34500},
  {id:"eq7",nome:"FREIO P/ CABO OPGW",loc:23000},
  {id:"eq8",nome:"CAMINHÃO TRUCK COM MUNCK",loc:31000},
  {id:"eq9",nome:"CAMINHÃO TRUCK COM CARROCERIA",loc:6012.50},
  {id:"eq10",nome:"CAMINHÃO TRUCK COM PRANCHA",loc:18000},
  {id:"eq11",nome:"CAMINHONETE 4X4",loc:8500},
  {id:"eq12",nome:"TRATOR PNEU 4X4 C/ GUINCHO CAÇADOR",loc:17000},
  {id:"eq13",nome:"RETROESCAVADEIRA 4X4",loc:15000},
  {id:"eq14",nome:"ESCAVADEIRA HIDRÁULICA",loc:25000},
  {id:"eq15",nome:"GUINCHO P/ MONTAGEM",loc:6900},
  {id:"eq16",nome:"PRENSA HIDRAULICA P/ EMENDAS",loc:5290},
  {id:"eq17",nome:"MOTOSSERRA",loc:3397.10},
  {id:"eq18",nome:"ÔNIBUS 40 PASSAGEIROS",loc:19000},
  {id:"eq19",nome:"MICRO ÔNIBUS",loc:8500},
  {id:"eq20",nome:"VAN ADMINISTRAÇÃO",loc:2500},
  {id:"eq21",nome:"GRUPO GERADOR 100 KVA",loc:11500},
  {id:"eq22",nome:"RÁDIO COMUNICAÇÃO PORTÁTIL",loc:203.33},
  {id:"eq23",nome:"GPS RTK",loc:10580},
  {id:"eq24",nome:"TRATOR DE ESTEIRA",loc:40000},
  {id:"eq25",nome:"PÁ CARREGADEIRA",loc:25000},
];
const EPI_CAT=[
  {id:"epi1",desc:"Calças operacionais",custo:50},
  {id:"epi2",desc:"Camisas operacionais",custo:50},
  {id:"epi3",desc:"Touca árabe",custo:50},
  {id:"epi4",desc:"Botina biq de PVC",custo:50},
  {id:"epi5",desc:"Luva de vaqueta",custo:50},
  {id:"epi6",desc:"Óculos escuro antirrisco",custo:50},
  {id:"epi7",desc:"Perneira bindim c/ velcro 3T",custo:50},
  {id:"epi8",desc:"Capacete MSA aba frontal c/ carneira",custo:50},
  {id:"epi9",desc:"Protetor solar FPS60",custo:50},
  {id:"epi10",desc:"Colete refletivo laranja",custo:50},
  {id:"epi11",desc:"Protetor auricular tipo plug",custo:50},
  {id:"epi12",desc:"Cinto de Segurança",custo:50},
  {id:"epi13",desc:"Talabarte em Y",custo:50},
  {id:"epi14",desc:"Trava Quedas",custo:50},
  {id:"epi15",desc:"Talabarte Abdominal",custo:50},
  {id:"epi16",desc:"Bolsa p/ Cinto",custo:50},
  {id:"epi17",desc:"Botina para operador de motosserra",custo:50},
  {id:"epi18",desc:"Calça para operador de motosserra",custo:50},
  {id:"epi19",desc:"Camisa para operador de motosserra",custo:50},
  {id:"epi20",desc:"Luva vaqueta motosserrista",custo:50},
];
const EPC_CAT=[
  {id:"epc1",desc:"Sinalização viária",custo:2000},
  {id:"epc2",desc:"Corda linha de vida",custo:1500},
  {id:"epc3",desc:"Barreira de proteção",custo:800},
  {id:"epc4",desc:"Cone de sinalização (cx)",custo:200},
];
const ATIVS=[
  {id:"a1",grp:"M",desc:"Montagem e Revisão Torre Estaiada no Solo",und:"TON",eKey:"tonEstaiada"},
  {id:"a2",grp:"M",desc:"Içamento Torre Estaiada",und:"TON",eKey:"tonEstaiada"},
  {id:"a3",grp:"M",desc:"Giro e Prumo Torre Estaiada",und:"TORRE",eKey:"qtdEstaiada"},
  {id:"a4",grp:"M",desc:"Montagem e Revisão Torre Crossrope no Solo",und:"TON",eKey:"tonCrossrope"},
  {id:"a5",grp:"M",desc:"Içamento Torre Crossrope",und:"TON",eKey:"tonCrossrope"},
  {id:"a6",grp:"M",desc:"Giro e Prumo Torre Crossrope",und:"TORRE",eKey:"qtdCrossrope"},
  {id:"a7",grp:"M",desc:"Pré Montagem Torre Autoportante",und:"TON",eKey:"tonAuto"},
  {id:"a8",grp:"M",desc:"Montagem Mecanizada Torre Autoportante",und:"TON",eKey:"tonAuto"},
  {id:"a9",grp:"M",desc:"Montagem Manual Torre Autoportante",und:"TON",eKey:"tonAuto"},
  {id:"a10",grp:"M",desc:"Revisão Torre Autoportante",und:"TON",eKey:"tonAuto"},
  {id:"a11",grp:"L",desc:"Instalação de Cavaletes de Proteção",und:"KM",eKey:"ext"},
  {id:"a12",grp:"L",desc:"Lançamento de Cabo Para-Raios",und:"KM",eKey:"ext"},
  {id:"a13",grp:"L",desc:"Lançamento de Cabo OPGW",und:"KM",eKey:"ext"},
  {id:"a14",grp:"L",desc:"Lançamento de Cabo Condutor",und:"KM",eKey:"extCondutor"},
  {id:"a15",grp:"L",desc:"Grampeação de Cabo Condutor",und:"TORRE",eKey:"totalTorres"},
  {id:"a16",grp:"L",desc:"Ancoragem de Cabo Condutor",und:"TORRE",eKey:"totalTorres"},
];

// composição vazia por atividade — linhas dinâmicas
const mkComp=()=>({moRows:[],eqRows:[],verbas:{ferramentas:0,materiais:0},kpi:0,equipes:1});
const mkGrupoComps=()=>Object.fromEntries(ATIVS.map(a=>[a.id,mkComp()]));

// ─── UI ATOMS ─────────────────────────────────────────────────────────────────
const TH=({ch,right,accent,w})=>(
  <th style={{padding:"5px 9px",fontSize:10,fontWeight:700,letterSpacing:1,whiteSpace:"nowrap",
    color:accent?C.goldL:C.txt2,textAlign:right?"right":"left",width:w,
    background:C.surf3,borderBottom:`1px solid ${C.border2}`}}>{ch}</th>
);
const TD=({ch,right,bold,accent,muted,cs,col})=>(
  <td colSpan={cs} style={{padding:"4px 9px",fontSize:11,textAlign:right?"right":"left",
    whiteSpace:"nowrap",fontWeight:bold?700:400,
    color:col||(accent?C.goldL:muted?C.txt3:C.txt)}}>{ch}</td>
);
const NumInp=({v,onChange,w=50})=>(
  <input type="number" value={v} onChange={onChange}
    style={{width:w,background:C.surf3,border:`1px solid ${C.border2}`,borderRadius:3,
      color:C.goldL,padding:"3px 6px",fontSize:11,fontFamily:"inherit",
      textAlign:"right",boxSizing:"border-box"}}/>
);
const TextInp=({v,onChange,placeholder=""})=>(
  <input value={v} onChange={onChange} placeholder={placeholder}
    style={{width:"100%",background:C.surf3,border:`1px solid ${C.border2}`,
      borderRadius:3,color:C.txt,padding:"5px 9px",fontSize:11,
      fontFamily:"inherit",boxSizing:"border-box"}}/>
);
const Sel=({v,onChange,opts,placeholder="— selecione —",w="100%"})=>(
  <select value={v||""} onChange={onChange}
    style={{width,background:C.surf3,border:`1px solid ${C.border2}`,borderRadius:3,
      color:v?C.txt:C.txt3,padding:"4px 8px",fontSize:11,fontFamily:"inherit",
      boxSizing:"border-box",cursor:"pointer",colorScheme:"dark"}}>
    <option value="">{placeholder}</option>
    {opts.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}
  </select>
);
const Pill=({on,onClick,ch,col})=>{
  const c=col||(on?C.gold:C.border);
  return <button onClick={onClick} style={{padding:"4px 11px",borderRadius:3,fontSize:10,
    fontWeight:700,letterSpacing:1,border:`1px solid ${c}`,
    background:on?c+"33":"transparent",color:on?C.goldL:C.txt3,cursor:"pointer"}}>{ch}</button>;
};
const Tag=({text,col=C.gold})=>(
  <span style={{background:col+"22",color:col,border:`1px solid ${col}44`,
    borderRadius:3,padding:"1px 6px",fontSize:9,fontWeight:700,letterSpacing:1}}>{text}</span>
);
const Hdr2=({col=C.gold,ch,right})=>(
  <div style={{background:col+"18",borderBottom:`1px solid ${col}33`,padding:"7px 13px",
    fontSize:10,fontWeight:700,letterSpacing:3,color:col,
    display:"flex",justifyContent:"space-between",alignItems:"center"}}>
    <span>{ch}</span>{right}
  </div>
);
const ScoreRing=({v,label})=>(
  <div style={{textAlign:"center",minWidth:48}}>
    <div style={{width:42,height:42,borderRadius:"50%",margin:"0 auto 3px",
      background:`conic-gradient(${sc(v)} ${(v||0)*3.6}deg,${C.surf3} 0deg)`,
      display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:28,height:28,borderRadius:"50%",background:C.surf2,
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:10,fontWeight:700,color:sc(v)}}>{v||"—"}</div>
    </div>
    <div style={{fontSize:8,color:C.txt3,letterSpacing:1}}>{label}</div>
  </div>
);
const Card=({children,b})=>(
  <div style={{background:C.surface,border:`1px solid ${b||C.border}`,
    borderRadius:6,marginBottom:12,overflow:"hidden"}}>{children}</div>
);
const BtnAdd=({onClick,ch="+ ADICIONAR LINHA"})=>(
  <button onClick={onClick} style={{background:"transparent",border:`1px dashed ${C.border2}`,
    borderRadius:3,color:C.txt3,padding:"5px 12px",fontSize:10,fontWeight:700,
    cursor:"pointer",letterSpacing:1,width:"100%",marginTop:4,
    transition:"all 0.15s"}}
    onMouseOver={e=>{e.target.style.borderColor=C.gold;e.target.style.color=C.goldL;}}
    onMouseOut={e=>{e.target.style.borderColor=C.border2;e.target.style.color=C.txt3;}}
  >{ch}</button>
);
const BtnDel=({onClick})=>(
  <button onClick={onClick} style={{background:"transparent",border:`1px solid ${C.border}`,
    borderRadius:3,color:C.txt3,padding:"3px 7px",fontSize:12,cursor:"pointer",lineHeight:1}}
    onMouseOver={e=>{e.target.style.borderColor=C.redL;e.target.style.color=C.redL;}}
    onMouseOut={e=>{e.target.style.borderColor=C.border;e.target.style.color=C.txt3;}}
    title="Remover linha">✕</button>
);

// ─── TOTROW ───────────────────────────────────────────────────────────────────
const TotRow=({label,value,cols=2})=>(
  <tr style={{borderTop:`2px solid ${C.border2}`,background:C.surf3}}>
    <td colSpan={cols} style={{padding:"5px 9px",fontSize:11,fontWeight:700,color:C.goldL}}>{label}</td>
    <td style={{padding:"5px 9px",textAlign:"right",fontSize:12,fontWeight:700,color:C.goldL}}>{fmt(value)}</td>
  </tr>
);

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App(){
  const [screen,setScreen]=useState("intro");
  const [role,setRole]=useState(null);
  const [gIdx,setGIdx]=useState(0);
  const [aTab,setATab]=useState("a1");
  const [epiCargoAtivo,setEpiCargoAtivo]=useState("mo1");

  // LT
  const [lt,setLt]=useState({nome:"LT 500 kV Norte — Trecho 01",tensao:"500kV",
    ext:120,circ:"simples",cabFase:4,pararaios:2,opgw:1});
  const [torres,setTorres]=useState({
    crossrope:{qtd:10,ton:280},suspensao:{qtd:20,ton:180},
    ancoragem:{qtd:10,ton:320},estaiada:{qtd:10,ton:420},
  });
  const uLt=(k,v)=>setLt(p=>({...p,[k]:v}));
  const uTorre=(t,k,v)=>setTorres(p=>({...p,[t]:{...p[t],[k]:+v||0}}));

  // Grupos
  const [grupos,setGrupos]=useState([{id:"g1",nome:"Grupo A",resp:""},{id:"g2",nome:"Grupo B",resp:""}]);
  const addGrupo=()=>setGrupos(p=>[...p,{id:"g"+(p.length+1),nome:`Grupo ${String.fromCharCode(65+p.length)}`,resp:""}]);
  const uGrupo=(id,k,v)=>setGrupos(p=>p.map(g=>g.id===id?{...g,[k]:v}:g));

  // KPIs base
  const [kpisBase,setKpisBase]=useState(Object.fromEntries(ATIVS.map(a=>[a.id,0])));

  // EPI por cargo / EPC por atividade
  const [epiCargo,setEpiCargo]=useState({});
  const togEpi=(moId,epiId)=>setEpiCargo(p=>({...p,[moId]:{...(p[moId]||{}),[epiId]:!(p[moId]||{})[epiId]}}));
  const [epcAtiv,setEpcAtiv]=useState({});
  const togEpc=(aId,epcId)=>setEpcAtiv(p=>({...p,[aId]:{...(p[aId]||{}),[epcId]:!(p[aId]||{})[epcId]}}));

  // COMPOSIÇÕES [grupoIdx][ativId] — linhas dinâmicas
  const [comps,setComps]=useState([mkGrupoComps(),mkGrupoComps()]);

  const gc=(gi,aId)=>comps[gi]?.[aId]||mkComp();
  const sc2=(gi,aId,fn)=>setComps(p=>{
    const n=[...p];
    n[gi]={...n[gi],[aId]:fn(n[gi]?.[aId]||mkComp())};
    return n;
  });

  // MO dinâmico
  const moAdd=(gi,aId,catId)=>{
    const cat=MO_CAT.find(r=>r.id===catId); if(!cat) return;
    sc2(gi,aId,c=>({...c,moRows:[...c.moRows,{_id:uid(),catId,cargo:cat.cargo,sal:cat.sal,qtd:1,alim:63.53,aloj:19.09,saude:0.77,folgas:12.20}]}));
  };
  const moDel=(gi,aId,_id)=>sc2(gi,aId,c=>({...c,moRows:c.moRows.filter(r=>r._id!==_id)}));
  const moUpd=(gi,aId,_id,k,v)=>sc2(gi,aId,c=>({...c,moRows:c.moRows.map(r=>r._id===_id?{...r,[k]:+v||0}:r)}));

  // EQ dinâmico
  const eqAdd=(gi,aId,catId)=>{
    const cat=EQ_CAT.find(r=>r.id===catId); if(!cat) return;
    sc2(gi,aId,c=>({...c,eqRows:[...c.eqRows,{_id:uid(),catId,nome:cat.nome,loc:cat.loc,qtd:1}]}));
  };
  const eqDel=(gi,aId,_id)=>sc2(gi,aId,c=>({...c,eqRows:c.eqRows.filter(r=>r._id!==_id)}));
  const eqUpd=(gi,aId,_id,k,v)=>sc2(gi,aId,c=>({...c,eqRows:c.eqRows.map(r=>r._id===_id?{...r,[k]:+v||0}:r)}));

  // Verbas/KPI/Equipes
  const uVb=(gi,aId,k,v)=>sc2(gi,aId,c=>({...c,verbas:{...c.verbas,[k]:+v||0}}));
  const uKpi=(gi,aId,v)=>sc2(gi,aId,c=>({...c,kpi:+v||0}));
  const uEq=(gi,aId,v)=>sc2(gi,aId,c=>({...c,equipes:Math.max(1,+v||1)}));

  // Escopos
  const fator=lt.circ==="duplo"?2:1;
  const totalCabos=(lt.cabFase*3+lt.pararaios+lt.opgw)*fator;
  const extCondutor=lt.ext*lt.cabFase*3*fator;
  const totalTorres=Object.values(torres).reduce((s,t)=>s+t.qtd,0);
  const tonTotal=Object.values(torres).reduce((s,t)=>s+t.ton,0);
  const ESC={
    ext:lt.ext,extCondutor,totalTorres,
    tonEstaiada:torres.estaiada.ton,qtdEstaiada:torres.estaiada.qtd,
    tonCrossrope:torres.crossrope.ton,qtdCrossrope:torres.crossrope.qtd,
    tonAuto:torres.suspensao.ton+torres.ancoragem.ton,
  };

  // Cálculo
  const calcA=(comp,esc)=>{
    const moT=r=>(r.sal+r.alim+r.aloj+r.saude+r.folgas)*r.qtd;
    const custoMo=comp.moRows.reduce((s,r)=>s+moT(r),0);
    const custoEq=comp.eqRows.reduce((s,r)=>s+(r.loc*r.qtd),0);
    const custoVb=comp.verbas.ferramentas+comp.verbas.materiais;
    const total=custoMo+custoEq+custoVb;
    const dur=comp.kpi&&esc&&comp.equipes?Math.ceil(esc/(comp.equipes*comp.kpi)):0;
    const moQtd=comp.moRows.reduce((s,r)=>s+r.qtd,0);
    return {custoMo,custoEq,custoVb,total,dur,moQtd,eqQtd:comp.eqRows.length};
  };
  const calcSeg=(gi)=>{
    let req=0,ok=0;
    ATIVS.forEach(a=>{
      const comp=gc(gi,a.id);
      comp.moRows.forEach(mo=>{
        const epis=Object.keys(epiCargo[mo.catId]||{}).filter(k=>(epiCargo[mo.catId]||{})[k]);
        req+=epis.length; ok+=epis.length; // placeholder
      });
      const epcsR=Object.keys(epcAtiv[a.id]||{}).filter(k=>(epcAtiv[a.id]||{})[k]);
      req+=epcsR.length; ok+=epcsR.length;
    });
    return req>0?Math.round((ok/req)*100):85;
  };
  const buildRank=()=>{
    const res=grupos.map((g,i)=>{
      const ct=ATIVS.reduce((s,a)=>s+calcA(gc(i,a.id),ESC[a.eKey]||0).total,0);
      const dm=Math.max(0,...ATIVS.map(a=>calcA(gc(i,a.id),ESC[a.eKey]||0).dur));
      return {...g,gi:i,ct,dm,seg:calcSeg(i)};
    });
    const mc=Math.min(...res.map(r=>r.ct).filter(v=>v>0),Infinity);
    const md=Math.min(...res.map(r=>r.dm).filter(v=>v>0),Infinity);
    return res.map(r=>{
      const sC=r.ct>0?Math.round(Math.min(100,(mc/r.ct)*100)):0;
      const sD=r.dm>0?Math.round(Math.min(100,(md/r.dm)*100)):0;
      const sS=r.seg;
      return {...r,sC,sD,sS,total:Math.round(sC*.3+sD*.3+sS*.4),desq:sS<70};
    }).sort((a,b)=>b.total-a.total);
  };

  // Estilos
  const S={
    app:{minHeight:"100vh",background:C.bg,color:C.txt,fontFamily:"'IBM Plex Mono','Courier New',monospace"},
    hdr:{background:C.surface,borderBottom:`2px solid ${C.goldDim||"#7A5510"}`,
      padding:"10px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",
      position:"sticky",top:0,zIndex:100},
    pg:{padding:"14px 18px",maxWidth:1400,margin:"0 auto"},
    g2:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12},
    tbl:{width:"100%",borderCollapse:"collapse",fontSize:11},
    trOn:(col)=>({borderBottom:`1px solid ${C.border}`,background:col+"0D"}),
    trOff:(i)=>({borderBottom:`1px solid ${C.border}`,background:i%2===0?C.surf2+"44":"transparent"}),
    totRow:{borderTop:`2px solid ${C.border2}`,background:C.surf3},
    btnP:{background:`linear-gradient(135deg,${C.gold},#7A5510)`,color:"#000",border:"none",
      borderRadius:4,padding:"8px 18px",fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:2},
    btnS:{background:"transparent",color:C.gold,border:`1px solid #7A5510`,borderRadius:4,
      padding:"6px 13px",fontSize:10,fontWeight:700,cursor:"pointer"},
    nb:(a)=>({padding:"5px 11px",borderRadius:3,fontSize:10,fontWeight:700,letterSpacing:1,
      border:`1px solid ${a?C.gold:C.border}`,background:a?C.gold+"44":"transparent",
      color:a?C.goldL:C.txt3,cursor:"pointer"}),
    stat:{background:C.surf2,border:`1px solid ${C.border}`,borderRadius:5,padding:"10px 12px",textAlign:"center"},
  };

  const navF=[["config","⚙ LT"],["grupos","👥 GRUPOS"],["atividades","📋 ATIVIDADES"],["epi_epc","🦺 EPI/EPC"],["ranking","🏆 RANKING"]];
  const navG=[["composicao","🔧 COMPOSIÇÃO"],["cronograma","📅 CRONOGRAMA"],["ranking","🏆 RANKING"]];

  const Nav=()=>(
    <header style={S.hdr}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:30,height:30,background:`linear-gradient(135deg,${C.gold},#7A5510)`,
          borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>⚡</div>
        <div>
          <div style={{fontSize:12,fontWeight:700,letterSpacing:3}}>JORNADAS LT</div>
          <div style={{fontSize:8,color:C.txt3,letterSpacing:2}}>{role==="F"?"FACILITADOR":"GRUPO — "+(grupos[gIdx]?.nome||"")}</div>
        </div>
      </div>
      <nav style={{display:"flex",gap:4,alignItems:"center"}}>
        {(role==="F"?navF:navG).map(([s,l])=>(
          <button key={s} style={S.nb(screen===s)} onClick={()=>setScreen(s)}>{l}</button>
        ))}
        <button style={{...S.nb(false),marginLeft:8}} onClick={()=>{setScreen("intro");setRole(null)}}>↩</button>
      </nav>
    </header>
  );

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if(screen==="intro") return(
    <div style={S.app}>
      <div style={{...S.pg,textAlign:"center",paddingTop:60}}>
        <div style={{fontSize:50,marginBottom:12}}>⚡</div>
        <h1 style={{fontSize:28,fontWeight:700,letterSpacing:6,margin:0}}>JORNADAS LT</h1>
        <p style={{fontSize:11,color:C.gold,letterSpacing:4,margin:"8px 0 20px"}}>SIMULADOR DE EQUIPES DE ALTA PERFORMANCE</p>
        <p style={{maxWidth:520,margin:"0 auto 32px",color:C.txt2,fontSize:13,lineHeight:1.9}}>
          "O sucesso desta obra não depende de sorte, mas da capacidade de vocês, líderes, dimensionarem a força de trabalho correta."
        </p>
        <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:36}}>
          {[["💰","CUSTO","30%",C.yellow],["⏱️","DURAÇÃO","30%",C.blueL],["🦺","SEGURANÇA","40%",C.greenL]].map(([ic,l,p,col])=>(
            <div key={l} style={{...S.stat,minWidth:110,borderColor:col+"44"}}>
              <div style={{fontSize:20}}>{ic}</div>
              <div style={{fontSize:20,fontWeight:700,color:col}}>{p}</div>
              <div style={{fontSize:8,color:C.txt3,letterSpacing:2}}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:12,justifyContent:"center"}}>
          <button style={{...S.btnP,fontSize:12}} onClick={()=>{setRole("F");setScreen("config")}}>⚙️ FACILITADOR</button>
          <button style={{...S.btnS,fontSize:12}} onClick={()=>{setRole("G");setScreen("composicao")}}>👥 GRUPO</button>
        </div>
      </div>
    </div>
  );

  // ── CONFIG LT ──────────────────────────────────────────────────────────────
  const PgConfig=()=>(
    <div style={S.pg}>
      <Card>
        <Hdr2 ch="⚡ LINHA DE TRANSMISSÃO"/>
        <div style={{padding:14}}>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:10,marginBottom:12}}>
            <div>
              <div style={{fontSize:9,color:C.txt3,letterSpacing:2,marginBottom:4}}>NOME</div>
              <TextInp v={lt.nome} onChange={e=>uLt("nome",e.target.value)}/>
            </div>
            <div>
              <div style={{fontSize:9,color:C.txt3,letterSpacing:2,marginBottom:4}}>TENSÃO</div>
              <TextInp v={lt.tensao} onChange={e=>uLt("tensao",e.target.value)}/>
            </div>
            <div>
              <div style={{fontSize:9,color:C.txt3,letterSpacing:2,marginBottom:4}}>EXTENSÃO (km)</div>
              <NumInp v={lt.ext} onChange={e=>uLt("ext",+e.target.value)} w="100%"/>
            </div>
            <div>
              <div style={{fontSize:9,color:C.txt3,letterSpacing:2,marginBottom:4}}>CIRCUITO</div>
              <div style={{display:"flex",gap:6}}>
                {["simples","duplo"].map(c=><Pill key={c} on={lt.circ===c} onClick={()=>uLt("circ",c)} ch={c.toUpperCase()}/>)}
              </div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            {[["CABOS/FASE","cabFase"],["PARA-RAIOS","pararaios"],["OPGW","opgw"]].map(([l,k])=>(
              <div key={k}>
                <div style={{fontSize:9,color:C.txt3,letterSpacing:2,marginBottom:4}}>{l}</div>
                <NumInp v={lt[k]} onChange={e=>uLt(k,+e.target.value)} w="100%"/>
              </div>
            ))}
          </div>
        </div>
      </Card>
      <Card>
        <Hdr2 col={C.blueL} ch="🏗️ TIPOS DE TORRES"/>
        <table style={S.tbl}>
          <thead><tr>
            <TH ch="TIPO"/><TH ch="QTD" right w={100}/><TH ch="TONELADAS" right w={110}/>
            <TH ch="TOTAL TORRES" right/><TH ch="TOTAL TON" right accent/>
          </tr></thead>
          <tbody>
            {[["crossrope","🔁 CROSSROPE"],["suspensao","⬆️ SUSPENSÃO"],["ancoragem","⚓ ANCORAGEM"],["estaiada","🔩 ESTAIADA"]].map(([t,l])=>(
              <tr key={t} style={S.trOff(0)}>
                <td style={{padding:"6px 9px",fontSize:11,fontWeight:700}}>{l}</td>
                <td style={{padding:"4px 8px",textAlign:"right"}}><NumInp v={torres[t].qtd} onChange={e=>uTorre(t,"qtd",e.target.value)} w={70}/></td>
                <td style={{padding:"4px 8px",textAlign:"right"}}><NumInp v={torres[t].ton} onChange={e=>uTorre(t,"ton",e.target.value)} w={80}/></td>
                <TD ch={`${torres[t].qtd} torres`} right bold/>
                <TD ch={`${fmt(torres[t].ton)} ton`} right bold accent/>
              </tr>
            ))}
            <tr style={S.totRow}>
              <td style={{padding:"6px 9px",fontSize:11,fontWeight:700,color:C.goldL}}>TOTAL</td>
              <td/><td/>
              <TD ch={`${totalTorres} torres`} right bold accent/>
              <TD ch={`${fmt(tonTotal)} ton`} right bold accent/>
            </tr>
          </tbody>
        </table>
        <div style={{padding:12,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
          {[["CONDUTORES",`${lt.cabFase*3*fator}`,"cabos"],["PARA-RAIOS",`${lt.pararaios*fator}`,"cabos"],
            ["TOTAL CABOS",`${totalCabos}`,"cabos"],["KM CONDUTOR",fmtI(extCondutor),"km"]].map(([l,v,u])=>(
            <div key={l} style={S.stat}>
              <div style={{fontSize:18,fontWeight:700,color:C.goldL}}>{v}</div>
              <div style={{fontSize:9,color:C.txt3}}>{u}</div>
              <div style={{fontSize:8,letterSpacing:2,color:C.txt2,marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  // ── GRUPOS ─────────────────────────────────────────────────────────────────
  const PgGrupos=()=>(
    <div style={S.pg}>
      <Card>
        <Hdr2 ch="👥 GRUPOS PARTICIPANTES" right={<button style={S.btnS} onClick={addGrupo}>+ ADICIONAR</button>}/>
        <table style={S.tbl}>
          <thead><tr><TH ch="#" w={30}/><TH ch="NOME DO GRUPO"/><TH ch="RESPONSÁVEL"/></tr></thead>
          <tbody>
            {grupos.map((g,i)=>(
              <tr key={g.id} style={S.trOff(i)}>
                <TD ch={i+1} bold accent/>
                <td style={{padding:"4px 8px"}}><TextInp v={g.nome} onChange={e=>uGrupo(g.id,"nome",e.target.value)}/></td>
                <td style={{padding:"4px 8px"}}><TextInp v={g.resp} placeholder="Nome do responsável..." onChange={e=>uGrupo(g.id,"resp",e.target.value)}/></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{padding:"8px 13px",fontSize:11,color:C.txt2}}>
          ℹ️ Cada grupo monta composições para <strong style={{color:C.goldL}}>todas as 16 atividades</strong> — Montagem E Lançamento.
        </div>
      </Card>
    </div>
  );

  // ── ATIVIDADES ─────────────────────────────────────────────────────────────
  const PgAtividades=()=>(
    <div style={S.pg}>
      {[["M",C.blueL,"🏗️ MONTAGEM"],["L",C.greenL,"🔌 LANÇAMENTO"]].map(([grp,col,label])=>(
        <Card key={grp}>
          <Hdr2 col={col} ch={label}/>
          <table style={S.tbl}>
            <thead><tr>
              <TH ch="ATIVIDADE" w={360}/><TH ch="UND" right w={60}/>
              <TH ch="ESCOPO" right w={120}/><TH ch="KPI BASE (un/mês/equipe)" right w={160} accent/>
            </tr></thead>
            <tbody>
              {ATIVS.filter(a=>a.grp===grp).map((a,i)=>(
                <tr key={a.id} style={S.trOff(i)}>
                  <TD ch={a.desc}/>
                  <td style={{padding:"5px 8px",textAlign:"right"}}><Tag text={a.und} col={col}/></td>
                  <TD ch={`${fmtI(ESC[a.eKey]||0)} ${a.und.toLowerCase()}`} right muted/>
                  <td style={{padding:"4px 8px",textAlign:"right"}}>
                    <NumInp v={kpisBase[a.id]||""} onChange={e=>setKpisBase(p=>({...p,[a.id]:+e.target.value||0}))} w={90}/>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ))}
    </div>
  );

  // ── EPI / EPC ──────────────────────────────────────────────────────────────
  const PgEpiEpc=()=>(
    <div style={S.pg}>
      <div style={S.g2}>
        <div>
          <Card>
            <Hdr2 col={C.greenL} ch="🦺 EPI OBRIGATÓRIO POR CARGO"/>
            <div style={{padding:"10px 12px",borderBottom:`1px solid ${C.border}`}}>
              <div style={{fontSize:9,color:C.txt3,letterSpacing:2,marginBottom:8}}>SELECIONE O CARGO:</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5,maxHeight:190,overflowY:"auto"}}>
                {MO_CAT.map(mo=>{
                  const cnt=Object.values(epiCargo[mo.id]||{}).filter(Boolean).length;
                  const atv=epiCargoAtivo===mo.id;
                  return(
                    <button key={mo.id} onClick={()=>setEpiCargoAtivo(mo.id)} style={{
                      padding:"3px 9px",borderRadius:3,fontSize:9,fontWeight:700,letterSpacing:1,
                      border:`1px solid ${atv?C.greenL:cnt>0?C.green:C.border}`,
                      background:atv?C.greenL+"22":cnt>0?C.green+"11":"transparent",
                      color:atv?C.greenL:cnt>0?C.greenL:C.txt3,cursor:"pointer"}}>
                      {mo.cargo.slice(0,22)}{cnt>0?` (${cnt})`:""}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{padding:"12px 12px"}}>
              <div style={{fontSize:10,color:C.gold,fontWeight:700,letterSpacing:2,marginBottom:8}}>
                → {MO_CAT.find(m=>m.id===epiCargoAtivo)?.cargo}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                {EPI_CAT.map(epi=>{
                  const on=(epiCargo[epiCargoAtivo]||{})[epi.id];
                  return(
                    <div key={epi.id} onClick={()=>togEpi(epiCargoAtivo,epi.id)} style={{
                      display:"flex",alignItems:"center",gap:7,padding:"6px 9px",
                      borderRadius:4,cursor:"pointer",fontSize:10,
                      background:on?C.greenL+"14":C.surf2,
                      border:`1px solid ${on?C.greenL+"55":C.border}`}}>
                      <span style={{fontSize:13,flexShrink:0}}>{on?"✅":"⬜"}</span>
                      <span style={{color:on?C.txt:C.txt2}}>{epi.desc}</span>
                      <span style={{marginLeft:"auto",color:C.txt3,fontSize:9}}>R${epi.custo}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
        <div>
          <Card>
            <Hdr2 col={C.yellow} ch="🔒 EPC NECESSÁRIO POR ATIVIDADE"/>
            <div style={{padding:"10px 12px",overflowX:"auto"}}>
              <table style={S.tbl}>
                <thead><tr>
                  <TH ch="ATIVIDADE" w={220}/>
                  {EPC_CAT.map(e=><TH key={e.id} ch={e.desc} right/>)}
                </tr></thead>
                <tbody>
                  {[["M",C.blueL,"🏗️ MONTAGEM"],["L",C.greenL,"🔌 LANÇAMENTO"]].map(([grp,col,gl])=>[
                    <tr key={grp+"h"}>
                      <td colSpan={99} style={{padding:"4px 9px",fontSize:9,fontWeight:700,letterSpacing:3,
                        background:col+"18",color:col,borderTop:`1px solid ${col}33`}}>{gl}</td>
                    </tr>,
                    ...ATIVS.filter(a=>a.grp===grp).map(a=>(
                      <tr key={a.id} style={S.trOff(0)}>
                        <td style={{padding:"5px 9px",fontSize:10,color:C.txt2}}>
                          {a.desc.length>28?a.desc.slice(0,28)+"…":a.desc}
                        </td>
                        {EPC_CAT.map(epc=>{
                          const on=(epcAtiv[a.id]||{})[epc.id];
                          return(
                            <td key={epc.id} style={{padding:"5px 9px",textAlign:"center",cursor:"pointer"}}
                              onClick={()=>togEpc(a.id,epc.id)}>
                              <span style={{fontSize:14}}>{on?"✅":"⬜"}</span>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  ])}
                </tbody>
              </table>
            </div>
          </Card>
          <Card>
            <Hdr2 ch="📋 RESUMO DA CONFIGURAÇÃO"/>
            <div style={{padding:"10px 12px"}}>
              <div style={{fontSize:9,color:C.txt3,letterSpacing:2,marginBottom:6}}>EPIS POR CARGO</div>
              {MO_CAT.filter(m=>Object.values(epiCargo[m.id]||{}).some(Boolean)).map(m=>{
                const cnt=Object.values(epiCargo[m.id]||{}).filter(Boolean).length;
                return(
                  <div key={m.id} style={{display:"flex",justifyContent:"space-between",
                    padding:"3px 0",borderBottom:`1px solid ${C.border}`,fontSize:11}}>
                    <span style={{color:C.txt2}}>{m.cargo}</span>
                    <Tag text={`${cnt} EPIs`} col={C.greenL}/>
                  </div>
                );
              })}
              {!Object.values(epiCargo).some(v=>Object.values(v).some(Boolean))&&(
                <div style={{color:C.txt3,fontSize:11}}>Nenhum EPI configurado.</div>
              )}
              <div style={{fontSize:9,color:C.txt3,letterSpacing:2,margin:"10px 0 6px"}}>EPCS POR ATIVIDADE</div>
              {ATIVS.filter(a=>Object.values(epcAtiv[a.id]||{}).some(Boolean)).map(a=>{
                const cnt=Object.values(epcAtiv[a.id]||{}).filter(Boolean).length;
                return(
                  <div key={a.id} style={{display:"flex",justifyContent:"space-between",
                    padding:"3px 0",borderBottom:`1px solid ${C.border}`,fontSize:10}}>
                    <span style={{color:C.txt2}}>{a.desc.slice(0,32)}…</span>
                    <Tag text={`${cnt} EPCs`} col={C.yellow}/>
                  </div>
                );
              })}
              {!Object.values(epcAtiv).some(v=>Object.values(v).some(Boolean))&&(
                <div style={{color:C.txt3,fontSize:11}}>Nenhum EPC configurado.</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  // ── COMPOSIÇÃO ─────────────────────────────────────────────────────────────
  const PgComposicao=()=>{
    const aObj=ATIVS.find(a=>a.id===aTab)||ATIVS[0];
    const comp=gc(gIdx,aObj.id);
    const esc=ESC[aObj.eKey]||0;
    const calc=calcA(comp,esc);
    const colGrp=aObj.grp==="M"?C.blueL:C.greenL;
    const totalGeral=ATIVS.reduce((s,a)=>s+calcA(gc(gIdx,a.id),ESC[a.eKey]||0).total,0);

    // MOs já usados nesta atividade
    const moUsados=new Set(comp.moRows.map(r=>r.catId));
    const moOpts=MO_CAT.filter(r=>!moUsados.has(r.id)).map(r=>({id:r.id,label:r.cargo}));
    // EQs — podem repetir (ex: 2 guindastes = 2 linhas separadas ou qtd > 1)
    const eqOpts=EQ_CAT.map(r=>({id:r.id,label:r.nome}));

    return(
      <div style={S.pg}>
        {/* seletor grupo */}
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10,flexWrap:"wrap"}}>
          <span style={{fontSize:9,color:C.txt3,letterSpacing:2}}>GRUPO:</span>
          {grupos.map((g,i)=>(
            <Pill key={g.id} on={gIdx===i} onClick={()=>setGIdx(i)} ch={g.nome}/>
          ))}
          <button style={{...S.btnP,marginLeft:"auto",fontSize:10}} onClick={()=>setScreen("cronograma")}>
            CRONOGRAMA →
          </button>
        </div>

        {/* barra resumo */}
        <div style={{background:C.surf2,border:`1px solid ${C.border2}`,borderRadius:6,
          padding:"9px 14px",marginBottom:10,display:"flex",gap:20,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{fontSize:9,color:C.txt3,letterSpacing:2}}>CUSTO TOTAL (TODAS ATIVIDADES):</div>
          <div style={{fontSize:16,fontWeight:700,color:C.goldL}}>{fmt(totalGeral)}</div>
          <div style={{marginLeft:"auto",fontSize:10,color:C.txt2}}>
            {ATIVS.filter(a=>gc(gIdx,a.id).kpi>0).length}/{ATIVS.length} atividades com KPI definido
          </div>
        </div>

        {/* tabs atividades */}
        <div style={{marginBottom:10}}>
          {[["M",C.blueL,"🏗️ MONTAGEM"],["L",C.greenL,"🔌 LANÇAMENTO"]].map(([grp,col,label])=>(
            <div key={grp} style={{marginBottom:6}}>
              <div style={{fontSize:9,color:col,letterSpacing:3,marginBottom:4}}>{label}</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {ATIVS.filter(a=>a.grp===grp).map(a=>{
                  const c=gc(gIdx,a.id);
                  const has=c.moRows.length>0||c.eqRows.length>0||c.kpi>0;
                  const atv=aTab===a.id;
                  return(
                    <button key={a.id} onClick={()=>setATab(a.id)} style={{
                      padding:"4px 10px",borderRadius:3,fontSize:9,fontWeight:700,letterSpacing:1,cursor:"pointer",
                      border:`1px solid ${atv?col:has?col+"88":C.border}`,
                      background:atv?col+"33":has?col+"11":"transparent",
                      color:atv?col:has?col:C.txt3}}>
                      {a.desc.split(" ").slice(0,3).join(" ")}{has?" ✓":""}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* conteúdo */}
        <div style={S.g2}>
          {/* ESQUERDA */}
          <div>
            {/* cabeçalho atividade */}
            <div style={{background:colGrp+"18",border:`1px solid ${colGrp}33`,borderRadius:6,
              padding:"10px 14px",marginBottom:10,
              display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:colGrp}}>{aObj.desc}</div>
                <div style={{fontSize:10,color:C.txt2,marginTop:2}}>
                  Escopo: <strong style={{color:C.goldL}}>{fmtI(esc)} {aObj.und.toLowerCase()}</strong>
                  &nbsp;·&nbsp;<Tag text={aObj.und} col={colGrp}/>
                </div>
              </div>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <div>
                  <div style={{fontSize:8,color:C.txt3,letterSpacing:2,marginBottom:3}}>KPI (un/mês/eq)</div>
                  <NumInp v={comp.kpi||""} onChange={e=>uKpi(gIdx,aObj.id,e.target.value)} w={80}/>
                </div>
                <div>
                  <div style={{fontSize:8,color:C.txt3,letterSpacing:2,marginBottom:3}}>EQUIPES</div>
                  <NumInp v={comp.equipes} onChange={e=>uEq(gIdx,aObj.id,e.target.value)} w={60}/>
                </div>
                <div style={{textAlign:"center",minWidth:60}}>
                  <div style={{fontSize:8,color:C.txt3,letterSpacing:1,marginBottom:2}}>DURAÇÃO</div>
                  <div style={{fontSize:20,fontWeight:700,color:calc.dur>0?C.goldL:C.txt3}}>
                    {calc.dur>0?calc.dur+"m":"—"}
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ MÃO DE OBRA DINÂMICA ═══ */}
            <Card>
              <Hdr2 col={C.blueL} ch={`👷 MÃO DE OBRA — ${aObj.desc.slice(0,28)}`}/>
              <table style={S.tbl}>
                <thead>
                  <tr>
                    <TH ch="CARGO" w={180}/>
                    <TH ch="QTD" right w={50}/>
                    <TH ch="SALÁRIO/MÊS" right/>
                    <TH ch="ALIMENT./MÊS" right/>
                    <TH ch="ALOJAM./MÊS" right/>
                    <TH ch="SAÚDE/MÊS" right/>
                    <TH ch="FOLGAS/MÊS" right/>
                    <TH ch="TOTAL/MÊS" right accent/>
                    <TH ch="" w={30}/>
                  </tr>
                </thead>
                <tbody>
                  {comp.moRows.length===0&&(
                    <tr><td colSpan={9} style={{padding:"12px 9px",color:C.txt3,fontSize:11,fontStyle:"italic",textAlign:"center"}}>
                      Nenhum cargo adicionado. Use o seletor abaixo para adicionar.
                    </td></tr>
                  )}
                  {comp.moRows.map((r,i)=>{
                    const tot=(r.sal+r.alim+r.aloj+r.saude+r.folgas)*r.qtd;
                    return(
                      <tr key={r._id} style={S.trOn(C.blueL)}>
                        <td style={{padding:"4px 9px",fontSize:11,fontWeight:600,color:C.txt}}>{r.cargo}</td>
                        <td style={{padding:"3px 7px",textAlign:"right"}}>
                          <NumInp v={r.qtd} onChange={e=>moUpd(gIdx,aObj.id,r._id,"qtd",e.target.value)} w={46}/>
                        </td>
                        <TD ch={fmt(r.sal)} right/>
                        <td style={{padding:"3px 7px",textAlign:"right"}}>
                          <NumInp v={r.alim} onChange={e=>moUpd(gIdx,aObj.id,r._id,"alim",e.target.value)} w={68}/>
                        </td>
                        <td style={{padding:"3px 7px",textAlign:"right"}}>
                          <NumInp v={r.aloj} onChange={e=>moUpd(gIdx,aObj.id,r._id,"aloj",e.target.value)} w={68}/>
                        </td>
                        <td style={{padding:"3px 7px",textAlign:"right"}}>
                          <NumInp v={r.saude} onChange={e=>moUpd(gIdx,aObj.id,r._id,"saude",e.target.value)} w={68}/>
                        </td>
                        <td style={{padding:"3px 7px",textAlign:"right"}}>
                          <NumInp v={r.folgas} onChange={e=>moUpd(gIdx,aObj.id,r._id,"folgas",e.target.value)} w={68}/>
                        </td>
                        <td style={{padding:"4px 9px",textAlign:"right",fontWeight:700,color:C.goldL,fontSize:11}}>
                          {fmt(tot)}
                        </td>
                        <td style={{padding:"3px 6px",textAlign:"center"}}>
                          <BtnDel onClick={()=>moDel(gIdx,aObj.id,r._id)}/>
                        </td>
                      </tr>
                    );
                  })}
                  {comp.moRows.length>0&&(
                    <tr style={S.totRow}>
                      <td style={{padding:"5px 9px",fontSize:11,fontWeight:700,color:C.goldL}}>
                        TOTAL MO — {calc.moQtd} profissionais
                      </td>
                      <td colSpan={5}/>
                      <td style={{padding:"5px 9px",textAlign:"right",fontSize:10,color:C.txt2}}>/mês</td>
                      <td style={{padding:"5px 9px",textAlign:"right",fontSize:12,fontWeight:700,color:C.goldL}}>
                        {fmt(calc.custoMo)}
                      </td>
                      <td/>
                    </tr>
                  )}
                </tbody>
              </table>
              {/* seletor para adicionar MO */}
              <div style={{padding:"8px 12px",borderTop:`1px solid ${C.border}`,
                display:"flex",gap:8,alignItems:"center"}}>
                <div style={{flex:1}}>
                  <Sel
                    v=""
                    onChange={e=>{ if(e.target.value) moAdd(gIdx,aObj.id,e.target.value); }}
                    opts={moOpts}
                    placeholder={moOpts.length===0?"✅ Todos os cargos adicionados":"+ Selecione um cargo para adicionar..."}
                  />
                </div>
                {moOpts.length>0&&<span style={{fontSize:10,color:C.txt3,whiteSpace:"nowrap"}}>
                  {MO_CAT.length-moOpts.length}/{MO_CAT.length} cargos
                </span>}
              </div>
            </Card>

            {/* ═══ EQUIPAMENTOS DINÂMICOS ═══ */}
            <Card>
              <Hdr2 col={C.yellow} ch={`🏗️ EQUIPAMENTOS — ${aObj.desc.slice(0,28)}`}/>
              <table style={S.tbl}>
                <thead>
                  <tr>
                    <TH ch="EQUIPAMENTO / FERRAMENTA" w={240}/>
                    <TH ch="QTD" right w={50}/>
                    <TH ch="LOCAÇÃO/MÊS" right/>
                    <TH ch="TOTAL/MÊS" right accent/>
                    <TH ch="" w={30}/>
                  </tr>
                </thead>
                <tbody>
                  {comp.eqRows.length===0&&(
                    <tr><td colSpan={5} style={{padding:"12px 9px",color:C.txt3,fontSize:11,fontStyle:"italic",textAlign:"center"}}>
                      Nenhum equipamento adicionado.
                    </td></tr>
                  )}
                  {comp.eqRows.map((r,i)=>(
                    <tr key={r._id} style={S.trOn(C.yellow)}>
                      <td style={{padding:"4px 9px",fontSize:11,fontWeight:600,color:C.txt}}>{r.nome}</td>
                      <td style={{padding:"3px 7px",textAlign:"right"}}>
                        <NumInp v={r.qtd} onChange={e=>eqUpd(gIdx,aObj.id,r._id,"qtd",e.target.value)} w={46}/>
                      </td>
                      <TD ch={fmt(r.loc)} right/>
                      <td style={{padding:"4px 9px",textAlign:"right",fontWeight:700,color:C.goldL,fontSize:11}}>
                        {fmt(r.loc*r.qtd)}
                      </td>
                      <td style={{padding:"3px 6px",textAlign:"center"}}>
                        <BtnDel onClick={()=>eqDel(gIdx,aObj.id,r._id)}/>
                      </td>
                    </tr>
                  ))}
                  {comp.eqRows.length>0&&(
                    <tr style={S.totRow}>
                      <td colSpan={2} style={{padding:"5px 9px",fontSize:11,fontWeight:700,color:C.goldL}}>
                        TOTAL EQUIPAMENTOS — {comp.eqRows.length} itens
                      </td>
                      <td style={{padding:"5px 9px",textAlign:"right",fontSize:10,color:C.txt2}}>/mês</td>
                      <td style={{padding:"5px 9px",textAlign:"right",fontSize:12,fontWeight:700,color:C.goldL}}>
                        {fmt(calc.custoEq)}
                      </td>
                      <td/>
                    </tr>
                  )}
                </tbody>
              </table>
              {/* seletor para adicionar equipamento */}
              <div style={{padding:"8px 12px",borderTop:`1px solid ${C.border}`,
                display:"flex",gap:8,alignItems:"center"}}>
                <div style={{flex:1}}>
                  <Sel
                    v=""
                    onChange={e=>{ if(e.target.value) eqAdd(gIdx,aObj.id,e.target.value); }}
                    opts={eqOpts}
                    placeholder="+ Selecione um equipamento para adicionar..."
                  />
                </div>
              </div>
            </Card>

            {/* ═══ VERBAS ═══ */}
            <Card>
              <Hdr2 col={C.txt2} ch="💼 VERBAS DIVERSAS"/>
              <table style={S.tbl}>
                <thead><tr><TH ch="DESCRIÇÃO"/><TH ch="VALOR (R$)" right accent/></tr></thead>
                <tbody>
                  {[["Ferramentas","ferramentas"],["Materiais","materiais"]].map(([l,k])=>(
                    <tr key={k} style={{borderBottom:`1px solid ${C.border}`,background:comp.verbas[k]>0?C.gold+"0D":"transparent"}}>
                      <TD ch={l}/>
                      <td style={{padding:"3px 9px",textAlign:"right"}}>
                        <NumInp v={comp.verbas[k]} onChange={e=>uVb(gIdx,aObj.id,k,e.target.value)} w={110}/>
                      </td>
                    </tr>
                  ))}
                  <TotRow label="TOTAL VERBAS" value={calc.custoVb} cols={1}/>
                </tbody>
              </table>
            </Card>
          </div>

          {/* DIREITA — RESUMO */}
          <div style={{position:"sticky",top:60,alignSelf:"flex-start"}}>
            <Card>
              <Hdr2 ch={`📊 RESUMO — ${aObj.desc.slice(0,26)}`}/>
              <div style={{padding:14}}>
                <table style={{...S.tbl,marginBottom:14}}>
                  <tbody>
                    <tr style={{borderBottom:`2px solid ${C.border2}`,background:C.surf2}}>
                      <td style={{padding:"8px 9px",fontSize:12,fontWeight:700,color:C.goldL}}>💰 Custo desta Atividade</td>
                      <td style={{padding:"8px 9px",textAlign:"right",fontSize:14,fontWeight:700,color:C.goldL}}>{fmt(calc.total)}</td>
                    </tr>
                    {[["└ 👷 MO /mês",calc.custoMo,C.blueL],["└ 🏗️ Equip. /mês",calc.custoEq,C.yellow],["└ 💼 Verbas",calc.custoVb,C.txt2]].map(([l,v,col])=>(
                      <tr key={l} style={{borderBottom:`1px solid ${C.border}`}}>
                        <td style={{padding:"5px 9px 5px 18px",fontSize:11,color:C.txt2}}>{l}</td>
                        <td style={{padding:"5px 9px",textAlign:"right",fontSize:12,fontWeight:700,color:col}}>{fmt(v)}</td>
                      </tr>
                    ))}
                    <tr style={{borderBottom:`1px solid ${C.border}`}}>
                      <td style={{padding:"6px 9px",fontSize:11,color:C.txt2}}>⏱️ Duração estimada</td>
                      <td style={{padding:"6px 9px",textAlign:"right",fontSize:12,fontWeight:700,
                        color:calc.dur>0?C.greenL:C.txt3}}>
                        {calc.dur>0?`${calc.dur} meses`:"KPI não definido"}
                      </td>
                    </tr>
                    <tr style={{borderBottom:`1px solid ${C.border}`}}>
                      <td style={{padding:"6px 9px",fontSize:11,color:C.txt2}}>👷 Profissionais / Equip.</td>
                      <td style={{padding:"6px 9px",textAlign:"right",fontSize:11,color:C.txt}}>
                        {calc.moQtd} / {comp.eqRows.length}
                      </td>
                    </tr>
                    <tr>
                      <td style={{padding:"6px 9px",fontSize:11,color:C.txt2}}>📋 Composições preenchidas</td>
                      <td style={{padding:"6px 9px",textAlign:"right",fontSize:11,color:C.goldL}}>
                        {ATIVS.filter(a=>gc(gIdx,a.id).moRows.length>0||gc(gIdx,a.id).kpi>0).length}/{ATIVS.length}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* EPIs requeridos */}
                {comp.moRows.length>0&&(
                  <div style={{borderTop:`1px solid ${C.border}`,paddingTop:10,marginBottom:10}}>
                    <div style={{fontSize:9,color:C.txt3,letterSpacing:3,marginBottom:6}}>EPIS REQUERIDOS</div>
                    {comp.moRows.map(mo=>{
                      const epis=Object.keys(epiCargo[mo.catId]||{}).filter(k=>(epiCargo[mo.catId]||{})[k]);
                      if(!epis.length) return(
                        <div key={mo._id} style={{fontSize:10,color:C.txt3,padding:"2px 0"}}>
                          {mo.cargo} — <span style={{color:C.yellow}}>sem EPIs configurados</span>
                        </div>
                      );
                      return(
                        <div key={mo._id} style={{marginBottom:6}}>
                          <div style={{fontSize:10,color:C.blueL,fontWeight:700}}>{mo.cargo} ×{mo.qtd}</div>
                          {epis.map(epiId=>{
                            const epi=EPI_CAT.find(e=>e.id===epiId);
                            return epi?(
                              <div key={epiId} style={{fontSize:9,color:C.txt2,padding:"1px 0 1px 10px",
                                borderLeft:`2px solid ${C.greenL}44`}}>🦺 {epi.desc}</div>
                            ):null;
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* EPCs */}
                {Object.values(epcAtiv[aObj.id]||{}).some(Boolean)&&(
                  <div style={{borderTop:`1px solid ${C.border}`,paddingTop:10,marginBottom:10}}>
                    <div style={{fontSize:9,color:C.txt3,letterSpacing:3,marginBottom:6}}>EPCS NECESSÁRIOS</div>
                    {EPC_CAT.filter(e=>(epcAtiv[aObj.id]||{})[e.id]).map(e=>(
                      <div key={e.id} style={{fontSize:9,color:C.txt2,padding:"1px 0 1px 10px",
                        borderLeft:`2px solid ${C.yellow}44`}}>🔒 {e.desc}</div>
                    ))}
                  </div>
                )}

                {/* total geral */}
                <div style={{padding:"10px 12px",borderRadius:5,background:C.surf3,border:`1px solid ${C.border2}`}}>
                  <div style={{fontSize:9,color:C.txt3,letterSpacing:2,marginBottom:3}}>CUSTO TOTAL — TODAS ATIVIDADES</div>
                  <div style={{fontSize:17,fontWeight:700,color:C.goldL}}>{fmt(totalGeral)}</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  // ── CRONOGRAMA ─────────────────────────────────────────────────────────────
  const PgCronograma=()=>{
    const MESES=["Mai/26","Jun/26","Jul/26","Ago/26","Set/26","Out/26","Nov/26","Dez/26","Jan/27","Fev/27"];
    const g=grupos[gIdx]||{nome:"Grupo"};
    let cM=0,cL=0;
    const tl=ATIVS.map(a=>{
      const comp=gc(gIdx,a.id);
      const {total:ct,dur}=calcA(comp,ESC[a.eKey]||0);
      const isM=a.grp==="M";
      const st=isM?cM:cL;
      if(dur>0){if(isM)cM+=dur;else cL+=dur;}
      return{...a,dur,start:st,end:st+(dur||0),ct};
    });
    const custoM=tl.filter(a=>a.grp==="M").reduce((s,a)=>s+a.ct,0);
    const custoL=tl.filter(a=>a.grp==="L").reduce((s,a)=>s+a.ct,0);
    return(
      <div style={S.pg}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div>
            <h2 style={{margin:0,fontSize:16,fontWeight:700,letterSpacing:3}}>CRONOGRAMA — {g.nome.toUpperCase()}</h2>
            <p style={{margin:"3px 0 0",color:C.txt2,fontSize:11}}>{lt.nome} · {lt.ext} km · {totalTorres} torres</p>
          </div>
          <div style={{display:"flex",gap:6}}>
            {grupos.map((g,i)=><Pill key={g.id} on={gIdx===i} onClick={()=>setGIdx(i)} ch={g.nome}/>)}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:12}}>
          {[["🏗️ MONTAGEM",`${cM} meses`,fmt(custoM),C.blueL],
            ["🔌 LANÇAMENTO",`${cL} meses`,fmt(custoL),C.greenL],
            ["⏱️ DURAÇÃO TOTAL",`${Math.max(cM,cL)} meses`,"",C.gold],
            ["💰 CUSTO TOTAL","",fmt(custoM+custoL),C.goldL]].map(([l,dur,custo,col])=>(
            <div key={l} style={{...S.stat,borderColor:col+"33"}}>
              <div style={{fontSize:9,color:col,letterSpacing:1,marginBottom:3}}>{l}</div>
              {dur&&<div style={{fontSize:16,fontWeight:700,color:col}}>{dur}</div>}
              {custo&&<div style={{fontSize:dur?10:14,fontWeight:700,color:C.goldL}}>R$ {custo}</div>}
            </div>
          ))}
        </div>
        <Card>
          <Hdr2 ch="📋 DURAÇÃO POR ATIVIDADE"/>
          <table style={S.tbl}>
            <thead><tr>
              <TH ch="GRP" w={30}/><TH ch="ATIVIDADE"/><TH ch="UND" right w={55}/>
              <TH ch="ESCOPO" right w={90}/><TH ch="KPI" right w={70}/>
              <TH ch="EQ." right w={50}/><TH ch="DURAÇÃO" right accent w={80}/>
              <TH ch="CUSTO" right w={110}/>
            </tr></thead>
            <tbody>
              {[["M",C.blueL,"🏗️ MONTAGEM"],["L",C.greenL,"🔌 LANÇAMENTO"]].map(([grp,col,gl])=>[
                <tr key={grp+"h"}><td colSpan={99} style={{padding:"4px 9px",fontSize:9,fontWeight:700,letterSpacing:3,background:col+"18",color:col}}>{gl}</td></tr>,
                ...tl.filter(a=>a.grp===grp).map((a,i)=>(
                  <tr key={a.id} style={S.trOff(i)}>
                    <td style={{padding:"5px 9px",textAlign:"center"}}><Tag text={a.und} col={col}/></td>
                    <TD ch={a.desc}/>
                    <TD ch={a.und} right muted/>
                    <TD ch={fmtI(ESC[a.eKey]||0)} right muted/>
                    <TD ch={gc(gIdx,a.id).kpi||"—"} right muted/>
                    <TD ch={gc(gIdx,a.id).equipes} right muted/>
                    <td style={{padding:"5px 9px",textAlign:"right",fontWeight:a.dur>0?700:400,
                      color:a.dur>0?C.goldL:C.txt3}}>{a.dur>0?`${a.dur}m`:"—"}</td>
                    <TD ch={fmt(a.ct)} right/>
                  </tr>
                ))
              ])}
            </tbody>
          </table>
        </Card>
        <Card>
          <Hdr2 ch="📊 GANTT MENSAL"/>
          <div style={{padding:12,overflowX:"auto"}}>
            <table style={{...S.tbl,tableLayout:"fixed",minWidth:900}}>
              <colgroup>
                <col style={{width:30}}/><col style={{width:220}}/>
                {MESES.map(m=><col key={m} style={{width:60}}/>)}
                <col style={{width:60}}/>
              </colgroup>
              <thead><tr>
                <TH ch=""/><TH ch="ATIVIDADE"/>
                {MESES.map(m=><TH key={m} ch={m} right/>)}
                <TH ch="DUR." right accent/>
              </tr></thead>
              <tbody>
                {[["M",C.blueL,"🏗️ MONTAGEM"],["L",C.greenL,"🔌 LANÇAMENTO"]].map(([grp,col,gl])=>[
                  <tr key={grp+"h"}><td colSpan={99} style={{padding:"3px 9px",fontSize:9,fontWeight:700,letterSpacing:3,background:col+"18",color:col}}>{gl}</td></tr>,
                  ...tl.filter(a=>a.grp===grp).map((a,idx)=>{
                    const cols2=[col,"#A855F7","#EC4899",C.yellow,C.redL,C.gold];
                    const c2=cols2[idx%cols2.length];
                    return(
                      <tr key={a.id} style={{borderBottom:`1px solid ${C.border}`}}>
                        <td style={{padding:"3px 5px",textAlign:"center"}}><Tag text={a.und} col={c2}/></td>
                        <td style={{padding:"3px 9px",fontSize:10}}>{a.desc.length>28?a.desc.slice(0,28)+"…":a.desc}</td>
                        {MESES.map((_,mi)=>{
                          const on=mi>=a.start&&mi<a.end;
                          return(
                            <td key={mi} style={{padding:"2px"}}>
                              <div style={{height:22,borderRadius:2,
                                background:on?c2+"33":C.surf2,border:on?`1px solid ${c2}55`:"none",
                                display:"flex",alignItems:"center",justifyContent:"center",
                                fontSize:8,color:on?c2:C.txt3,fontWeight:700}}>
                                {on?"▓":"·"}
                              </div>
                            </td>
                          );
                        })}
                        <td style={{padding:"3px 9px",textAlign:"right",fontWeight:700,
                          color:a.dur>0?C.goldL:C.txt3,fontSize:11}}>
                          {a.dur>0?`${a.dur}m`:"—"}
                        </td>
                      </tr>
                    );
                  })
                ])}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  // ── RANKING ────────────────────────────────────────────────────────────────
  const PgRanking=()=>{
    const rank=buildRank();
    const medals=["🥇","🥈","🥉"];
    return(
      <div style={S.pg}>
        <div style={{textAlign:"center",marginBottom:16}}>
          <h2 style={{fontSize:20,fontWeight:700,letterSpacing:5,margin:0}}>🏆 RANKING FINAL</h2>
          <p style={{color:C.txt2,fontSize:10,letterSpacing:3,margin:"5px 0 0"}}>{lt.nome}</p>
          <div style={{display:"flex",gap:16,justifyContent:"center",marginTop:8}}>
            {[["💰","CUSTO","30%",C.yellow],["⏱️","DURAÇÃO","30%",C.blueL],["🦺","SEGURANÇA","40%",C.greenL]].map(([ic,l,p,col])=>(
              <span key={l} style={{fontSize:11,color:col}}>{ic} {l} <strong>{p}</strong></span>
            ))}
          </div>
        </div>
        <Card>
          <Hdr2 ch="📊 COMPARATIVO DE GRUPOS"/>
          <table style={S.tbl}>
            <thead><tr>
              <TH ch="#" w={30}/><TH ch="GRUPO"/><TH ch="RESPONSÁVEL"/>
              <TH ch="💰 CUSTO TOTAL" right/><TH ch="⏱️ DUR. MÁX." right/>
              <TH ch="S.CUSTO" right/><TH ch="S.DUR." right/><TH ch="🦺 SEG." right/>
              <TH ch="SCORE" right accent/><TH ch="STATUS"/>
            </tr></thead>
            <tbody>
              {rank.map((g,i)=>(
                <tr key={g.id} style={{borderBottom:`1px solid ${C.border}`,
                  background:g.desq?C.redL+"08":i===0?C.gold+"08":"transparent"}}>
                  <td style={{padding:"10px 9px",fontSize:18,textAlign:"center"}}>{g.desq?"❌":medals[i]??""}</td>
                  <td style={{padding:"10px 9px",fontSize:12,fontWeight:700}}>{g.nome}</td>
                  <TD ch={g.resp||"—"} muted/>
                  <td style={{padding:"9px",textAlign:"right",fontSize:11,color:C.yellow}}>{fmt(g.ct)}</td>
                  <td style={{padding:"9px",textAlign:"right",fontSize:11,color:C.blueL}}>{g.dm}m</td>
                  <td style={{padding:"8px 9px",textAlign:"center"}}><ScoreRing v={g.sC} label="CUSTO"/></td>
                  <td style={{padding:"8px 9px",textAlign:"center"}}><ScoreRing v={g.sD} label="DUR."/></td>
                  <td style={{padding:"8px 9px",textAlign:"center"}}><ScoreRing v={g.sS} label="SEG."/></td>
                  <td style={{padding:"10px 9px",textAlign:"right",fontSize:22,fontWeight:700,color:g.desq?C.redL:sc(g.total||0)}}>{g.desq?"—":g.total}</td>
                  <td style={{padding:"9px"}}>
                    {!g.desq&&i===0&&<Tag text="⚡ ALTA PERFORMANCE" col={C.gold}/>}
                    {!g.desq&&i>0&&<Tag text="✅ APROVADO" col={C.greenL}/>}
                    {g.desq&&<Tag text="❌ DESCLASSIFICADO" col={C.redL}/>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        {rank.some(g=>g.desq)&&(
          <Card b={C.redL+"44"}>
            <Hdr2 col={C.redL} ch="💬 DEBRIEFING"/>
            <div style={{padding:14,fontSize:12,color:C.txt2,lineHeight:1.9}}>
              {rank.filter(g=>g.desq).map(g=>(
                <div key={g.id} style={{marginBottom:6}}>
                  <strong style={{color:C.txt}}>{g.nome}</strong> — Segurança <strong style={{color:C.redL}}>{g.sS}%</strong> (mínimo 70%).
                </div>
              ))}
              <div style={{marginTop:10,padding:"10px 14px",borderRadius:5,background:C.gold+"10",border:`1px solid ${C.gold}33`,color:C.txt}}>
                💡 <strong>"A Liderança que Protege sabe dimensionar o recurso certo para o risco da atividade. Segurança não é custo — é parte da composição de alta performance."</strong>
              </div>
            </div>
          </Card>
        )}
        <Card b={C.gold+"44"}>
          <Hdr2 ch="🔑 GABARITO (FACILITADOR)"/>
          <div style={{padding:14,display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            {[{col:C.blueL,label:"🏗️ MONTAGEM",itens:["Montador III ×4 — sênior obrigatório","Operador Guindaste ×1 — içamento","Esporeiro III ×4 — altura e estai","Técnico Segurança ×1 — inegociável","Guindaste + Caminhão Munck","EPI completo NR-35 para todos","EPC: Linha de vida + Sinalização"]},
              {col:C.greenL,label:"🔌 LANÇAMENTO",itens:["Montador III ×4 — conjunto lançamento","Operador Puller/Freio ×2 — obrigatório","Eletricista II ×2 — grampeação","Técnico Segurança ×1 — inegociável","Conjunto Lançamento Condutor + OPGW","EPI NR-10 para eletricistas","EPC: Sinalização + Linha de vida"]}
            ].map(({col,label,itens})=>(
              <div key={label}>
                <div style={{fontSize:11,fontWeight:700,color:col,marginBottom:8}}>{label}</div>
                {itens.map((it,i)=>(
                  <div key={i} style={{padding:"3px 0",borderBottom:`1px solid ${C.border}`,fontSize:11,color:C.txt2}}>→ {it}</div>
                ))}
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return(
    <div style={S.app}>
      <Nav/>
      {screen==="config"     && <PgConfig/>}
      {screen==="grupos"     && <PgGrupos/>}
      {screen==="atividades" && <PgAtividades/>}
      {screen==="epi_epc"    && <PgEpiEpc/>}
      {screen==="composicao" && <PgComposicao/>}
      {screen==="cronograma" && <PgCronograma/>}
      {screen==="ranking"    && <PgRanking/>}
    </div>
  );
}

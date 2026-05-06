import { useState, useMemo } from "react";

// ─── TEMA ────────────────────────────────────────────────────────────────────
const C = {
  bg:        "#07090F",
  surface:   "#0D1117",
  surf2:     "#131A24",
  surf3:     "#1A2332",
  border:    "#1E2D42",
  border2:   "#243550",
  gold:      "#D4A017",
  goldDim:   "#8A6510",
  goldLight: "#F0C040",
  green:     "#1A9E5C",
  greenBr:   "#22C47A",
  red:       "#C0392B",
  redBr:     "#E74C3C",
  yellow:    "#E8A020",
  blue:      "#2E6DA4",
  blueBr:    "#4A9FD4",
  txt:       "#D8E4F0",
  txt2:      "#7A9BBF",
  txt3:      "#3A5570",
  white:     "#FFFFFF",
};

const fmt = (n) => n?.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "0,00";
const fmtInt = (n) => Math.round(n ?? 0).toLocaleString("pt-BR");

// ─── DADOS BASE ──────────────────────────────────────────────────────────────
const MO_BASE = [
  { id: "m1", cargo: "Encarregado de Turma",   salario: 1061.74, alimentacao: 63.53, alojamento: 36.36, saude: 26.50, folgas: 38.33, custo: 35, prazo: 88, seg: 90 },
  { id: "m2", cargo: "Ajudante Geral",          salario:  223.18, alimentacao: 63.53, alojamento:  0.00, saude:  0.77, folgas:  0.00, custo: 88, prazo: 30, seg: 20 },
  { id: "m3", cargo: "Montador Jr",             salario:  380.00, alimentacao: 63.53, alojamento: 19.09, saude:  0.77, folgas: 12.20, custo: 65, prazo: 55, seg: 55 },
  { id: "m4", cargo: "Montador Sr",             salario:  520.00, alimentacao: 63.53, alojamento: 19.09, saude:  0.77, folgas: 12.20, custo: 35, prazo: 85, seg: 80 },
  { id: "m5", cargo: "Operador de Equipamento", salario:  423.39, alimentacao: 63.53, alojamento: 19.09, saude:  0.77, folgas: 12.20, custo: 30, prazo: 90, seg: 60 },
  { id: "m6", cargo: "Motorista",               salario:  350.35, alimentacao: 63.53, alojamento: 19.09, saude:  0.77, folgas: 12.20, custo: 60, prazo: 65, seg: 65 },
  { id: "m7", cargo: "Técnico de Segurança",    salario:  650.00, alimentacao: 63.53, alojamento: 36.36, saude:  0.77, folgas: 12.20, custo: 55, prazo: 50, seg: 95 },
  { id: "m8", cargo: "Supervisor de Frente",    salario:  750.00, alimentacao: 63.53, alojamento: 36.36, saude: 26.50, folgas: 38.33, custo: 25, prazo: 88, seg: 88 },
  { id: "m9", cargo: "Eletricista NR-10",       salario:  720.00, alimentacao: 63.53, alojamento: 36.36, saude:  0.77, folgas: 12.20, custo: 28, prazo: 70, seg: 92 },
];

const EQUIP_BASE = [
  { id: "e1", nome: "Caminhão de Turma",     aluguel: 270.45, combustivel: 138.41, manut: 18.18, custo: 55, prazo: 65, seg: 65 },
  { id: "e2", nome: "Caminhão Caçamba",      aluguel: 681.82, combustivel: 304.50, manut: 18.18, custo: 40, prazo: 75, seg: 65 },
  { id: "e3", nome: "Guindaste Pequeno",     aluguel: 800.00, combustivel: 200.00, manut: 40.00, custo: 55, prazo: 55, seg: 55 },
  { id: "e4", nome: "Guindaste Grande",      aluguel:1800.00, combustivel: 450.00, manut: 90.00, custo: 20, prazo: 92, seg: 85 },
  { id: "e5", nome: "Lançadeira Manual",     aluguel:  80.00, combustivel:   0.00, manut:  5.00, custo: 88, prazo: 20, seg: 25 },
  { id: "e6", nome: "Lançadeira Motorizada", aluguel: 950.00, combustivel: 180.00, manut: 45.00, custo: 22, prazo: 90, seg: 85 },
  { id: "e7", nome: "Caminhão Munck",        aluguel: 772.73, combustivel: 389.76, manut: 18.18, custo: 50, prazo: 75, seg: 65 },
  { id: "e8", nome: "Retroescavadeira 4x4",  aluguel: 772.73, combustivel: 389.76, manut: 18.18, custo: 45, prazo: 70, seg: 60 },
  { id: "e9", nome: "Patrol Motoniveladora", aluguel:1359.09, combustivel:1162.64, manut: 22.73, custo: 30, prazo: 85, seg: 70 },
];

const VERBAS_BASE = [
  { id: "v1", item: "Viagens – Encarregados/Topógrafos", tipo: "VIAGENS",        custoUd: 1500.00, custo: 40, prazo: 70, seg: 70 },
  { id: "v2", item: "Viagens – Operacional",             tipo: "VIAGENS",        custoUd: 1400.00, custo: 60, prazo: 70, seg: 70 },
  { id: "v3", item: "E.P.I. – Operacional",              tipo: "EPI",            custoUd:  380.00, custo: 65, prazo: 50, seg: 80 },
  { id: "v4", item: "E.P.I. – Premium NR-35",            tipo: "EPI",            custoUd:  680.00, custo: 40, prazo: 55, seg: 98 },
  { id: "v5", item: "E.P.I. – Operador Moto Serra",      tipo: "EPI",            custoUd: 2350.00, custo: 35, prazo: 55, seg: 95 },
  { id: "v6", item: "Exames de Admissão",                tipo: "EXAMES",         custoUd:  857.10, custo: 55, prazo: 50, seg: 85 },
  { id: "v7", item: "Roupa Laboral – Operacional",       tipo: "ROUPA",          custoUd:  330.00, custo: 70, prazo: 50, seg: 75 },
  { id: "v8", nome: "Kit Resgate Altura",                tipo: "EPI",            custoUd:  520.00, item: "Kit Resgate Altura", custo: 55, prazo: 50, seg: 90 },
  { id: "v9", item: "Mob/Demob Veículo Pesado",          tipo: "MOB/DEMOB",      custoUd: 3300.00, custo: 30, prazo: 60, seg: 70 },
  { id:"v10", item: "Mob/Demob Equipamento Pesado",      tipo: "MOB/DEMOB",      custoUd:15000.00, custo: 20, prazo: 65, seg: 70 },
];

const LT_KPI = {
  "69kV":  { mont: 3.0, lanc: 1.5, emenda: 12, regul: 3.0, secao: 8 },
  "138kV": { mont: 2.5, lanc: 1.2, emenda: 10, regul: 2.5, secao: 7 },
  "230kV": { mont: 2.0, lanc: 1.0, emenda:  8, regul: 2.0, secao: 6 },
  "500kV": { mont: 1.5, lanc: 0.8, emenda:  6, regul: 1.5, secao: 5 },
};

const MESES = ["Mai/26","Jun/26","Jul/26","Ago/26","Set/26","Out/26"];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const moTotal = (r) => r.salario + r.alimentacao + r.alojamento + r.saude + r.folgas;
const eqTotal = (r) => r.aluguel + r.combustivel + r.manut;
const getScoreColor = (v) => v >= 80 ? C.greenBr : v >= 60 ? C.yellow : C.redBr;

// ─── COMPONENTES PEQUENOS ────────────────────────────────────────────────────
const ScoreChip = ({ label, value }) => (
  <div style={{ textAlign: "center", minWidth: 52 }}>
    <div style={{
      width: 40, height: 40, borderRadius: "50%", margin: "0 auto 3px",
      background: `conic-gradient(${getScoreColor(value)} ${value * 3.6}deg, ${C.surf3} 0deg)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 700, color: C.txt,
    }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.surf2, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {value}
      </div>
    </div>
    <div style={{ fontSize: 9, color: C.txt3, letterSpacing: 1 }}>{label}</div>
  </div>
);

const TH = ({ children, right, w, accent }) => (
  <th style={{
    padding: "6px 10px", fontSize: 10, fontWeight: 700, letterSpacing: 1,
    color: accent ? C.goldLight : C.txt2, textAlign: right ? "right" : "left",
    background: C.surf3, borderBottom: `1px solid ${C.border2}`,
    width: w, whiteSpace: "nowrap",
  }}>{children}</th>
);

const TD = ({ children, right, bold, accent, muted, colSpan }) => (
  <td colSpan={colSpan} style={{
    padding: "5px 10px", fontSize: 11,
    textAlign: right ? "right" : "left",
    fontWeight: bold ? 700 : 400,
    color: accent ? C.goldLight : muted ? C.txt3 : C.txt,
    whiteSpace: "nowrap",
  }}>{children}</td>
);

const SectionHeader = ({ color, label }) => (
  <tr>
    <td colSpan={99} style={{
      padding: "4px 10px", fontSize: 10, fontWeight: 700,
      letterSpacing: 2, background: color + "22", color,
      borderTop: `1px solid ${color}44`, borderBottom: `1px solid ${color}44`,
    }}>{label}</td>
  </tr>
);

const TotalRow = ({ label, value, colSpan = 2 }) => (
  <tr style={{ background: C.surf3 }}>
    <td colSpan={colSpan} style={{
      padding: "6px 10px", fontSize: 11, fontWeight: 700,
      color: C.goldLight, letterSpacing: 1,
    }}>{label}</td>
    <td style={{
      padding: "6px 10px", fontSize: 12, fontWeight: 700,
      color: C.goldLight, textAlign: "right",
    }}>{fmt(value)}</td>
  </tr>
);

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("intro");
  const [grupo, setGrupo] = useState("montagem");
  const [subAtiv, setSubAtiv] = useState(0);
  const [tensao, setTensao] = useState("500kV");
  const [circuito, setCircuito] = useState("simples");
  const [extensao, setExtensao] = useState(120);
  const [cabosPhase, setCabosPhase] = useState(4);
  const [pararaios, setPararaios] = useState(2);
  const [torres, setTorres] = useState(50);
  const [equipes, setEquipes] = useState(4);
  const [dataInicio, setDataInicio] = useState("2026-05-01");

  // linhas editáveis por seção
  const mkMoRow  = (r) => ({ ...r, qtd: 0 });
  const mkEqRow  = (r) => ({ ...r, qtd: 0 });
  const mkVbRow  = (r) => ({ ...r, qtd: 0, mob: 1, anual: 1, demob: 1 });
  const [moRows,   setMoRows]   = useState(MO_BASE.map(mkMoRow));
  const [eqRows,   setEqRows]   = useState(EQUIP_BASE.map(mkEqRow));
  const [vbRows,   setVbRows]   = useState(VERBAS_BASE.map(mkVbRow));

  const updMo = (id, val) => setMoRows(r => r.map(x => x.id === id ? { ...x, qtd: Math.max(0, +val || 0) } : x));
  const updEq = (id, val) => setEqRows(r => r.map(x => x.id === id ? { ...x, qtd: Math.max(0, +val || 0) } : x));
  const updVb = (id, field, val) => setVbRows(r => r.map(x => x.id === id ? { ...x, [field]: Math.max(0, +val || 0) } : x));

  const cfg = LT_KPI[tensao];
  const fator = circuito === "duplo" ? 2 : 1;
  const totalCabos = (cabosPhase * 3 + pararaios) * fator;
  const kmLancar = extensao * totalCabos;

  const kpiGrupo = grupo === "montagem" ? cfg.mont : cfg.lanc;
  const escopoGrupo = grupo === "montagem" ? torres : extensao;
  const duracao = Math.ceil(escopoGrupo / (equipes * kpiGrupo));

  // totais MO
  const totalMoQtd   = useMemo(() => moRows.reduce((s, r) => s + r.qtd, 0), [moRows]);
  const totalMoDia   = useMemo(() => moRows.reduce((s, r) => s + moTotal(r) * r.qtd, 0), [moRows]);
  const totalMoMes   = useMemo(() => totalMoDia * 22, [totalMoDia]);

  // totais Equipamentos
  const totalEqQtd   = useMemo(() => eqRows.reduce((s, r) => s + r.qtd, 0), [eqRows]);
  const totalEqDia   = useMemo(() => eqRows.reduce((s, r) => s + eqTotal(r) * r.qtd, 0), [eqRows]);
  const totalEqMes   = useMemo(() => totalEqDia * 22, [totalEqDia]);

  // totais Verbas (mob/demob são únicos; anual dividido por meses)
  const totalVbMob   = useMemo(() => vbRows.reduce((s, r) => s + r.custoUd * r.mob, 0), [vbRows]);
  const totalVbAnual = useMemo(() => vbRows.reduce((s, r) => s + r.custoUd * r.anual, 0), [vbRows]);
  const totalVbDemob = useMemo(() => vbRows.reduce((s, r) => s + r.custoUd * r.demob, 0), [vbRows]);

  const custoMesTotal = totalMoMes + totalEqMes;

  // KPI composição
  const allSelected = [
    ...moRows.filter(r => r.qtd > 0),
    ...eqRows.filter(r => r.qtd > 0),
    ...vbRows.filter(r => r.mob > 0 || r.anual > 0),
  ];
  const avgScore = (attr) => {
    if (!allSelected.length) return 0;
    return Math.round(allSelected.reduce((s, r) => s + r[attr], 0) / allSelected.length);
  };
  const sC = avgScore("custo"), sP = avgScore("prazo"), sS = avgScore("seg");
  const sTotal = Math.round(sC * 0.25 + sP * 0.35 + sS * 0.40);
  const desq = sS < 70 && allSelected.length > 0;

  // HH e MH mensais (simplificado sobre duracao)
  const hhTotal = useMemo(() => totalMoQtd * equipes * duracao * 8.8, [totalMoQtd, equipes, duracao]);
  const mhTotal = useMemo(() => totalEqQtd * equipes * duracao * 8.8, [totalEqQtd, equipes, duracao]);

  const subatividades = grupo === "montagem"
    ? ["Pré-montagem", "Mont. Manual Estaiada", "Mont. Mecanizada", "Revisão"]
    : ["Lançamento de Cabo", "Emenda", "Regulagem", "Seção de Corte"];

  // ── ESTILOS ──────────────────────────────────────────────────────────────
  const S = {
    app: {
      minHeight: "100vh", background: C.bg, color: C.txt,
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
    },
    hdr: {
      background: C.surface, borderBottom: `2px solid ${C.goldDim}`,
      padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
    },
    navBtn: (a) => ({
      padding: "5px 13px", borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: 1,
      border: `1px solid ${a ? C.gold : C.border}`,
      background: a ? C.goldDim + "55" : "transparent",
      color: a ? C.goldLight : C.txt3, cursor: "pointer",
    }),
    page: { padding: "20px 24px", maxWidth: 1200, margin: "0 auto" },
    card: {
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 6, marginBottom: 16, overflow: "hidden",
    },
    cardHdr: (color = C.gold) => ({
      background: color + "18", borderBottom: `1px solid ${color}33`,
      padding: "8px 14px", fontSize: 10, fontWeight: 700,
      letterSpacing: 3, color, display: "flex", alignItems: "center", gap: 8,
    }),
    table: {
      width: "100%", borderCollapse: "collapse",
      fontSize: 11,
    },
    trHover: {
      borderBottom: `1px solid ${C.border}`,
      transition: "background 0.15s",
    },
    input: {
      width: 52, background: C.surf3, border: `1px solid ${C.border2}`,
      borderRadius: 3, color: C.goldLight, padding: "3px 6px",
      fontSize: 11, fontFamily: "inherit", textAlign: "right",
    },
    stat: {
      background: C.surf2, border: `1px solid ${C.border}`,
      borderRadius: 6, padding: "10px 14px", textAlign: "center",
    },
    btnP: {
      background: `linear-gradient(135deg, ${C.gold}, ${C.goldDim})`,
      color: "#000", border: "none", borderRadius: 5,
      padding: "10px 24px", fontSize: 11, fontWeight: 700,
      cursor: "pointer", letterSpacing: 2,
    },
    btnS: {
      background: "transparent", color: C.gold,
      border: `1px solid ${C.goldDim}`, borderRadius: 5,
      padding: "8px 18px", fontSize: 10, fontWeight: 700,
      cursor: "pointer", letterSpacing: 1,
    },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
    grid4: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 },
  };

  // ── INTRO ─────────────────────────────────────────────────────────────────
  const renderIntro = () => (
    <div style={S.page}>
      <div style={{
        textAlign: "center", padding: "50px 0 36px",
        background: `radial-gradient(ellipse at 50% 0%, ${C.gold}12 0%, transparent 65%)`,
        borderRadius: 8, marginBottom: 20,
      }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>⚡</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: 6, margin: 0 }}>JORNADAS LT</h1>
        <p style={{ fontSize: 11, color: C.gold, letterSpacing: 4, margin: "6px 0 20px" }}>
          SIMULADOR DE EQUIPES DE ALTA PERFORMANCE
        </p>
        <p style={{ maxWidth: 540, margin: "0 auto 28px", color: C.txt2, fontSize: 13, lineHeight: 1.9 }}>
          "O sucesso desta obra não depende de sorte, mas da capacidade de vocês,
          líderes, dimensionarem a força de trabalho correta."
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 32 }}>
          {[["💰","CUSTO","25%",C.yellow],["⏱️","PRAZO","35%",C.blueBr],["🦺","SEGURANÇA","40%",C.greenBr]].map(([ic,l,p,col]) => (
            <div key={l} style={{ ...S.stat, minWidth: 100, borderColor: col + "44" }}>
              <div style={{ fontSize: 22 }}>{ic}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: col }}>{p}</div>
              <div style={{ fontSize: 9, color: C.txt3, letterSpacing: 2 }}>{l}</div>
            </div>
          ))}
        </div>
        <button style={S.btnP} onClick={() => setScreen("setup")}>INICIAR SESSÃO →</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[
          ["🏗️", C.blueBr, "GRUPO MONTAGEM", "Pré-montagem · Manual Estaiada / Autoportante · Mecanizada · Revisão"],
          ["🔌", C.greenBr, "GRUPO LANÇAMENTO", "Lançamento de Cabo · Emenda · Regulagem · Seção de Corte"],
        ].map(([ic, col, t, d]) => (
          <div key={t} style={{ ...S.card, borderColor: col + "33" }}>
            <div style={S.cardHdr(col)}>{ic} {t}</div>
            <div style={{ padding: "12px 14px", color: C.txt2, fontSize: 12, lineHeight: 1.7 }}>{d}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── SETUP ─────────────────────────────────────────────────────────────────
  const renderSetup = () => (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.cardHdr()}>⚡ CONFIGURAÇÃO DA LINHA DE TRANSMISSÃO</div>
        <div style={{ padding: 16 }}>
          <div style={S.grid2}>
            <div>
              <div style={{ fontSize: 10, color: C.txt2, letterSpacing: 2, marginBottom: 6 }}>TENSÃO</div>
              <div style={{ display: "flex", gap: 6 }}>
                {["69kV","138kV","230kV","500kV"].map(t => (
                  <button key={t} style={{ ...S.navBtn(tensao===t), flex:1, padding:"8px 0", fontSize:11 }}
                    onClick={() => setTensao(t)}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: C.txt2, letterSpacing: 2, marginBottom: 6 }}>CIRCUITO</div>
              <div style={{ display: "flex", gap: 6 }}>
                {["simples","duplo"].map(c => (
                  <button key={c} style={{ ...S.navBtn(circuito===c), flex:1, padding:"8px 0", fontSize:11, textTransform:"uppercase" }}
                    onClick={() => setCircuito(c)}>{c}</button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginTop: 14 }}>
            {[
              ["EXTENSÃO (km)", extensao, setExtensao],
              ["CABOS/FASE", cabosPhase, setCabosPhase],
              ["PARA-RAIOS", pararaios, setPararaios],
              ["TORRES", torres, setTorres],
              ["EQUIPES", equipes, setEquipes],
            ].map(([l, v, fn]) => (
              <div key={l}>
                <div style={{ fontSize: 9, color: C.txt3, letterSpacing: 2, marginBottom: 4 }}>{l}</div>
                <input style={{ ...S.input, width: "100%", padding: "6px 10px", boxSizing: "border-box" }}
                  type="number" value={v} onChange={e => fn(+e.target.value)} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Parâmetros calculados */}
      <div style={S.card}>
        <div style={S.cardHdr()}>📊 PARÂMETROS CALCULADOS</div>
        <div style={{ padding: 14 }}>
          <div style={S.grid4}>
            {[
              ["CONDUTORES", `${cabosPhase*3*fator}`, "cabos"],
              ["PARA-RAIOS", `${pararaios*fator}`, "cabos"],
              ["TOTAL CABOS", `${totalCabos}`, "cabos"],
              ["KM A LANÇAR", fmtInt(kmLancar), "km"],
            ].map(([l,v,u]) => (
              <div key={l} style={S.stat}>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.goldLight }}>{v}</div>
                <div style={{ fontSize: 9, color: C.txt3 }}>{u}</div>
                <div style={{ fontSize: 9, letterSpacing: 2, color: C.txt2, marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={S.card}>
        <div style={S.cardHdr()}>🎯 KPIs POR TENSÃO — {tensao}</div>
        <div style={{ padding: 14 }}>
          <table style={S.table}>
            <thead>
              <tr>
                {["ATIVIDADE","MONTAGEM","LANÇAMENTO","EMENDA","REGULAGEM","SEÇÃO CORTE"].map((h,i) => (
                  <TH key={h} right={i>0}>{h}</TH>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <TD>Produtividade / equipe / dia</TD>
                <TD right bold accent>{cfg.mont} torres</TD>
                <TD right bold accent>{cfg.lanc} km</TD>
                <TD right bold accent>{cfg.emenda} emendas</TD>
                <TD right bold accent>{cfg.regul} km</TD>
                <TD right bold accent>{cfg.secao} seções</TD>
              </tr>
              <tr style={{ background: C.surf2 }}>
                <TD>Duração estimada ({equipes} equipes)</TD>
                <TD right>{Math.ceil(torres/(equipes*cfg.mont))} dias</TD>
                <TD right>{Math.ceil(kmLancar/(equipes*cfg.lanc))} dias</TD>
                <TD right>{Math.ceil((totalCabos*extensao/5)/(equipes*cfg.emenda))} dias</TD>
                <TD right>{Math.ceil(extensao/(equipes*cfg.regul))} dias</TD>
                <TD right>{Math.ceil(torres/(equipes*cfg.secao))} dias</TD>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button style={S.btnS} onClick={() => setGrupo("montagem") || setScreen("composicao")}>
          🏗️ MONTAR GRUPO MONTAGEM
        </button>
        <button style={S.btnP} onClick={() => setGrupo("lancamento") || setScreen("composicao")}>
          🔌 MONTAR GRUPO LANÇAMENTO →
        </button>
      </div>
    </div>
  );

  // ── COMPOSIÇÃO ────────────────────────────────────────────────────────────
  const renderComposicao = () => (
    <div style={S.page}>
      {/* Header grupo + subatividade */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            {["montagem","lancamento"].map(g => (
              <button key={g} style={{ ...S.navBtn(grupo===g), padding:"7px 16px", fontSize:11 }}
                onClick={() => setGrupo(g)}>
                {g==="montagem" ? "🏗️ MONTAGEM" : "🔌 LANÇAMENTO"}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {subatividades.map((s,i) => (
              <button key={s} style={{ ...S.navBtn(subAtiv===i), padding:"5px 12px" }}
                onClick={() => setSubAtiv(i)}>{s}</button>
            ))}
          </div>
        </div>
        <button style={S.btnP} onClick={() => setScreen("cronograma")}>GERAR CRONOGRAMA →</button>
      </div>

      <div style={S.grid2}>
        {/* COLUNA ESQUERDA — tabelas de composição */}
        <div>
          {/* ── MÃO DE OBRA ── */}
          <div style={S.card}>
            <div style={S.cardHdr(C.blueBr)}>👷 MÃO DE OBRA — {subatividades[subAtiv]}</div>
            <table style={S.table}>
              <thead>
                <tr>
                  <TH w={160}>CARGO</TH>
                  <TH right w={40}>QTD</TH>
                  <TH right>SALÁRIO/MÊS</TH>
                  <TH right>ALIMENT./MÊS</TH>
                  <TH right>ALOJAM./MÊS</TH>
                  <TH right>SAÚDE/MÊS</TH>
                  <TH right>FOLGAS/MÊS</TH>
                  <TH right accent>TOTAL/MÊS</TH>
                </tr>
              </thead>
              <tbody>
                {moRows.map((r, i) => (
                  <tr key={r.id} style={{
                    ...S.trHover,
                    background: r.qtd > 0 ? C.blueBr + "0A" : i % 2 === 0 ? C.surf2 + "66" : "transparent",
                  }}>
                    <TD>{r.cargo}</TD>
                    <td style={{ padding: "4px 8px" }}>
                      <input style={S.input} value={r.qtd}
                        onChange={e => updMo(r.id, e.target.value)} />
                    </td>
                    <TD right muted={r.qtd===0}>{fmt(r.salario * 22)}</TD>
                    <TD right muted={r.qtd===0}>{fmt(r.alimentacao * 22)}</TD>
                    <TD right muted={r.qtd===0}>{fmt(r.alojamento * 22)}</TD>
                    <TD right muted={r.qtd===0}>{fmt(r.saude * 22)}</TD>
                    <TD right muted={r.qtd===0}>{fmt(r.folgas * 22)}</TD>
                    <td style={{ padding: "5px 10px", textAlign: "right", fontWeight: r.qtd>0?700:400, color: r.qtd>0?C.goldLight:C.txt3, fontSize:11 }}>
                      {r.qtd > 0 ? fmt(moTotal(r) * r.qtd * 22) : "—"}
                    </td>
                  </tr>
                ))}
                <tr style={{ borderTop: `2px solid ${C.border2}`, background: C.surf3 }}>
                  <td style={{ padding:"6px 10px", fontSize:11, fontWeight:700, color:C.goldLight }}>
                    TOTAL MO — {totalMoQtd} profissionais
                  </td>
                  <td colSpan={5} />
                  <td style={{ padding:"6px 10px", textAlign:"right", fontSize:11, fontWeight:700, color:C.txt2 }}>
                    /mês
                  </td>
                  <td style={{ padding:"6px 10px", textAlign:"right", fontSize:12, fontWeight:700, color:C.goldLight }}>
                    {fmt(totalMoMes)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── EQUIPAMENTOS ── */}
          <div style={S.card}>
            <div style={S.cardHdr(C.yellow)}>🏗️ EQUIPAMENTOS / FERRAMENTAS — {subatividades[subAtiv]}</div>
            <table style={S.table}>
              <thead>
                <tr>
                  <TH w={180}>EQUIPAMENTO</TH>
                  <TH right w={40}>QTD</TH>
                  <TH right>ALUGUEL/MÊS</TH>
                  <TH right>COMBUST./MÊS</TH>
                  <TH right>MANUT./MÊS</TH>
                  <TH right accent>TOTAL/MÊS</TH>
                </tr>
              </thead>
              <tbody>
                {eqRows.map((r, i) => (
                  <tr key={r.id} style={{
                    ...S.trHover,
                    background: r.qtd > 0 ? C.yellow + "0A" : i % 2 === 0 ? C.surf2 + "66" : "transparent",
                  }}>
                    <TD>{r.nome}</TD>
                    <td style={{ padding: "4px 8px" }}>
                      <input style={S.input} value={r.qtd}
                        onChange={e => updEq(r.id, e.target.value)} />
                    </td>
                    <TD right muted={r.qtd===0}>{fmt(r.aluguel * 22)}</TD>
                    <TD right muted={r.qtd===0}>{fmt(r.combustivel * 22)}</TD>
                    <TD right muted={r.qtd===0}>{fmt(r.manut * 22)}</TD>
                    <td style={{ padding:"5px 10px", textAlign:"right", fontWeight:r.qtd>0?700:400, color:r.qtd>0?C.goldLight:C.txt3, fontSize:11 }}>
                      {r.qtd > 0 ? fmt(eqTotal(r) * r.qtd * 22) : "—"}
                    </td>
                  </tr>
                ))}
                <tr style={{ borderTop:`2px solid ${C.border2}`, background:C.surf3 }}>
                  <td style={{ padding:"6px 10px", fontSize:11, fontWeight:700, color:C.goldLight }}>
                    TOTAL EQUIP — {totalEqQtd} equipamentos
                  </td>
                  <td colSpan={3} />
                  <td style={{ padding:"6px 10px", textAlign:"right", fontSize:11, fontWeight:700, color:C.txt2 }}>/mês</td>
                  <td style={{ padding:"6px 10px", textAlign:"right", fontSize:12, fontWeight:700, color:C.goldLight }}>
                    {fmt(totalEqMes)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── OUTRAS VERBAS ── */}
          <div style={S.card}>
            <div style={S.cardHdr(C.greenBr)}>💼 OUTRAS VERBAS — EPI / VIAGENS / MOB-DEMOB</div>
            <table style={S.table}>
              <thead>
                <tr>
                  <TH w={200}>ITEM</TH>
                  <TH w={80}>TIPO</TH>
                  <TH right>CUSTO UNIT.</TH>
                  <TH right>QTD MOB</TH>
                  <TH right>TOTAL MOB</TH>
                  <TH right>QTD ANUAL</TH>
                  <TH right>TOTAL ANUAL</TH>
                  <TH right>QTD DEMOB</TH>
                  <TH right accent>TOTAL DEMOB</TH>
                </tr>
              </thead>
              <tbody>
                {vbRows.map((r, i) => (
                  <tr key={r.id} style={{
                    ...S.trHover,
                    background: (r.mob>0||r.anual>0) ? C.greenBr+"0A" : i%2===0?C.surf2+"66":"transparent",
                  }}>
                    <TD>{r.item}</TD>
                    <td style={{ padding:"5px 10px" }}>
                      <span style={{
                        background: C.surf3, border:`1px solid ${C.border}`,
                        borderRadius:3, padding:"2px 6px", fontSize:9,
                        color:C.txt2, letterSpacing:1,
                      }}>{r.tipo}</span>
                    </td>
                    <TD right muted>{fmt(r.custoUd)}</TD>
                    <td style={{ padding:"4px 8px" }}>
                      <input style={{ ...S.input, width:40 }} value={r.mob}
                        onChange={e => updVb(r.id,"mob",e.target.value)} />
                    </td>
                    <TD right muted={r.mob===0}>{r.mob>0?fmt(r.custoUd*r.mob):"—"}</TD>
                    <td style={{ padding:"4px 8px" }}>
                      <input style={{ ...S.input, width:40 }} value={r.anual}
                        onChange={e => updVb(r.id,"anual",e.target.value)} />
                    </td>
                    <TD right muted={r.anual===0}>{r.anual>0?fmt(r.custoUd*r.anual):"—"}</TD>
                    <td style={{ padding:"4px 8px" }}>
                      <input style={{ ...S.input, width:40 }} value={r.demob}
                        onChange={e => updVb(r.id,"demob",e.target.value)} />
                    </td>
                    <TD right bold={r.demob>0} accent={r.demob>0}>
                      {r.demob>0?fmt(r.custoUd*r.demob):"—"}
                    </TD>
                  </tr>
                ))}
                <tr style={{ borderTop:`2px solid ${C.border2}`, background:C.surf3 }}>
                  <td colSpan={4} style={{ padding:"6px 10px", fontSize:11, fontWeight:700, color:C.goldLight }}>TOTAL VERBAS</td>
                  <td style={{ padding:"6px 10px", textAlign:"right", fontSize:11, fontWeight:700, color:C.goldLight }}>{fmt(totalVbMob)}</td>
                  <td />
                  <td style={{ padding:"6px 10px", textAlign:"right", fontSize:11, fontWeight:700, color:C.goldLight }}>{fmt(totalVbAnual)}</td>
                  <td />
                  <td style={{ padding:"6px 10px", textAlign:"right", fontSize:11, fontWeight:700, color:C.goldLight }}>{fmt(totalVbDemob)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* COLUNA DIREITA — painel KPI */}
        <div style={{ position:"sticky", top:16, alignSelf:"flex-start" }}>
          {/* Resumo custos estilo planilha */}
          <div style={S.card}>
            <div style={S.cardHdr()}>📊 RESUMO DA COMPOSIÇÃO</div>
            <div style={{ padding: 14 }}>
              <table style={{ ...S.table, marginBottom: 14 }}>
                <tbody>
                  <tr style={{ borderBottom:`2px solid ${C.border2}`, background:C.surf2 }}>
                    <td style={{ padding:"8px 10px", fontSize:13, fontWeight:700, color:C.goldLight }}>💰 Custo total mensal</td>
                    <td style={{ padding:"8px 10px", textAlign:"right", fontSize:16, fontWeight:700, color:C.goldLight }}>{fmt(custoMesTotal)}</td>
                  </tr>
                  <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                    <td style={{ padding:"6px 10px", fontSize:11, color:C.txt2, paddingLeft:20 }}>└ 👷 Mão de obra / mês</td>
                    <td style={{ padding:"6px 10px", textAlign:"right", fontSize:12, fontWeight:700, color:C.blueBr }}>{fmt(totalMoMes)}</td>
                  </tr>
                  <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                    <td style={{ padding:"6px 10px", fontSize:11, color:C.txt2, paddingLeft:20 }}>└ 🏗️ Equipamentos / mês</td>
                    <td style={{ padding:"6px 10px", textAlign:"right", fontSize:12, fontWeight:700, color:C.yellow }}>{fmt(totalEqMes)}</td>
                  </tr>
                  <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                    <td style={{ padding:"6px 10px", fontSize:11, color:C.txt2, paddingLeft:20 }}>└ 💼 Verbas (mob + anual)</td>
                    <td style={{ padding:"6px 10px", textAlign:"right", fontSize:12, fontWeight:700, color:C.greenBr }}>{fmt(totalVbMob + totalVbAnual)}</td>
                  </tr>
                  <tr style={{ borderBottom:`1px solid ${C.border}`, background:C.surf2 }}>
                    <td style={{ padding:"6px 10px", fontSize:11, color:C.txt2 }}>👷 HH estimado (obra)</td>
                    <td style={{ padding:"6px 10px", textAlign:"right", fontSize:12, fontWeight:700, color:C.blueBr }}>{fmtInt(hhTotal)} h</td>
                  </tr>
                  <tr style={{ borderBottom:`1px solid ${C.border}`, background:C.surf2 }}>
                    <td style={{ padding:"6px 10px", fontSize:11, color:C.txt2 }}>🏗️ MH estimado (obra)</td>
                    <td style={{ padding:"6px 10px", textAlign:"right", fontSize:12, fontWeight:700, color:C.yellow }}>{fmtInt(mhTotal)} h</td>
                  </tr>
                  <tr style={{ background:C.surf2 }}>
                    <td style={{ padding:"6px 10px", fontSize:11, color:C.txt2 }}>⏱️ Duração estimada</td>
                    <td style={{ padding:"6px 10px", textAlign:"right", fontSize:12, fontWeight:700, color:C.greenBr }}>{duracao} dias úteis</td>
                  </tr>
                </tbody>
              </table>

              {/* KPI scores */}
              <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:14 }}>
                <div style={{ fontSize:9, color:C.txt3, letterSpacing:3, marginBottom:12 }}>SCORE DE PERFORMANCE</div>
                <div style={{ display:"flex", justifyContent:"space-around", marginBottom:14 }}>
                  <ScoreChip label="CUSTO" value={sC} />
                  <ScoreChip label="PRAZO" value={sP} />
                  <ScoreChip label="SEGURANÇA" value={sS} />
                </div>
                <div style={{ textAlign:"center", padding:"12px 0" }}>
                  <div style={{ fontSize:9, color:C.txt3, letterSpacing:3, marginBottom:4 }}>SCORE FINAL</div>
                  <div style={{ fontSize:48, fontWeight:700, color: desq?C.redBr:getScoreColor(sTotal) }}>
                    {allSelected.length>0 ? sTotal : "—"}
                  </div>
                  <div style={{ fontSize:10, color:C.txt3 }}>/100</div>
                </div>
                {desq && (
                  <div style={{ background:C.redBr+"15", border:`1px solid ${C.redBr}44`, borderRadius:5, padding:"8px 12px", fontSize:11, color:C.redBr, marginBottom:8 }}>
                    ❌ DESCLASSIFICADO — Segurança &lt; 70. A segurança é inegociável.
                  </div>
                )}
                {!desq && sTotal>=75 && allSelected.length>0 && (
                  <div style={{ background:C.greenBr+"15", border:`1px solid ${C.greenBr}44`, borderRadius:5, padding:"8px 12px", fontSize:11, color:C.greenBr, marginBottom:8 }}>
                    ⚡ EQUIPE DE ALTA PERFORMANCE
                  </div>
                )}
                <div style={{ fontSize:10, color:C.txt3, textAlign:"center" }}>
                  Pesos: Custo 25% · Prazo 35% · Segurança 40%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── CRONOGRAMA ────────────────────────────────────────────────────────────
  const duracoes = {
    mont: Math.ceil(torres/(equipes*cfg.mont)),
    lanc: Math.ceil(kmLancar/(equipes*cfg.lanc)),
    emenda: Math.ceil((totalCabos*extensao/5)/(equipes*cfg.emenda)),
    regul: Math.ceil(extensao/(equipes*cfg.regul)),
    secao: Math.ceil(torres/(equipes*cfg.secao)),
  };

  const renderCronograma = () => (
    <div style={S.page}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div>
          <h2 style={{ margin:0, fontSize:16, fontWeight:700, letterSpacing:3 }}>CRONOGRAMA MENSAL</h2>
          <p style={{ margin:"4px 0 0", color:C.txt2, fontSize:11 }}>
            LT {tensao} · {extensao} km · {circuito} · {totalCabos} cabos · {equipes} equipes
          </p>
        </div>
        <button style={S.btnP} onClick={() => setScreen("ranking")}>VER RANKING →</button>
      </div>

      {/* Duração por atividade */}
      <div style={S.card}>
        <div style={S.cardHdr()}>📅 DURAÇÃO POR ATIVIDADE</div>
        <table style={S.table}>
          <thead>
            <tr>
              <TH>GRUPO</TH><TH>ATIVIDADE</TH><TH right>ESCOPO</TH>
              <TH right>KPI</TH><TH right>EQUIPES</TH>
              <TH right accent>DURAÇÃO</TH><TH right>INÍCIO</TH><TH right>FIM EST.</TH>
            </tr>
          </thead>
          <tbody>
            {[
              ["🏗️ Montagem","Montagem de Torres", `${torres} torres`, `${cfg.mont} torre/eq/dia`, duracoes.mont, "Mai/26","Jun/26"],
              ["🔌 Lançamento","Lançamento de Cabo",`${fmtInt(kmLancar)} km`, `${cfg.lanc} km/eq/dia`,   duracoes.lanc, "Jun/26","Ago/26"],
              ["🔌 Lançamento","Emenda",            `${fmtInt(totalCabos*extensao/5)} emendas`,`${cfg.emenda}/eq/dia`, duracoes.emenda,"Jul/26","Ago/26"],
              ["🔌 Lançamento","Regulagem",          `${extensao} km`,   `${cfg.regul} km/eq/dia`,   duracoes.regul, "Ago/26","Set/26"],
              ["🔌 Lançamento","Seção de Corte",     `${torres} seções`, `${cfg.secao}/eq/dia`,       duracoes.secao, "Set/26","Set/26"],
            ].map(([grp,atv,esc,kpi,dur,ini,fim],i) => (
              <tr key={atv} style={{ borderBottom:`1px solid ${C.border}`, background:i%2===0?C.surf2+"55":"transparent" }}>
                <TD muted>{grp}</TD><TD bold>{atv}</TD>
                <TD right muted>{esc}</TD><TD right muted>{kpi}</TD>
                <TD right muted>{equipes}</TD>
                <td style={{ padding:"5px 10px", textAlign:"right", fontWeight:700, color:C.goldLight, fontSize:12 }}>{dur}d</td>
                <TD right muted>{ini}</TD><TD right muted>{fim}</TD>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Gantt */}
      <div style={S.card}>
        <div style={S.cardHdr()}>📊 GANTT MENSAL</div>
        <div style={{ padding:14, overflowX:"auto" }}>
          <table style={{ ...S.table, tableLayout:"fixed" }}>
            <colgroup>
              <col style={{ width:180 }} />
              {MESES.map(m => <col key={m} style={{ width:80 }} />)}
              <col style={{ width:80 }} />
            </colgroup>
            <thead>
              <tr>
                <TH>ATIVIDADE</TH>
                {MESES.map(m => <TH key={m} right>{m}</TH>)}
                <TH right>DURAÇÃO</TH>
              </tr>
            </thead>
            <tbody>
              {[
                ["🏗️ Montagem Torres", [1,0,0,0,0,0], duracoes.mont, C.blueBr],
                ["🔌 Lançamento Cabo", [0,1,1,0,0,0], duracoes.lanc, C.gold],
                ["✂️ Emenda",          [0,0,1,1,0,0], duracoes.emenda,"#A855F7"],
                ["⚖️ Regulagem",        [0,0,0,1,1,0], duracoes.regul, C.greenBr],
                ["🔗 Seção de Corte",   [0,0,0,0,1,0], duracoes.secao, "#EC4899"],
              ].map(([atv, cells, dur, col]) => (
                <tr key={atv} style={{ borderBottom:`1px solid ${C.border}` }}>
                  <td style={{ padding:"5px 10px", fontSize:12 }}>{atv}</td>
                  {cells.map((v,i) => (
                    <td key={i} style={{ padding:"4px" }}>
                      <div style={{
                        height:26, borderRadius:3,
                        background: v ? `${col}33` : C.surf2,
                        border: v ? `1px solid ${col}55` : "none",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:9, color: v ? col : C.txt3, fontWeight:700,
                      }}>
                        {v ? "▓▓▓" : "·"}
                      </div>
                    </td>
                  ))}
                  <td style={{ padding:"5px 10px", textAlign:"right", fontWeight:700, color:C.goldLight, fontSize:12 }}>
                    {dur}d
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize:10, color:C.txt3, marginTop:10 }}>
            ⚠️ Sequência obrigatória: Montagem 100% → Lançamento → Emenda → Regulagem → Seção de Corte
          </div>
        </div>
      </div>

      {/* Histograma HH/MH/Custo */}
      <div style={S.card}>
        <div style={S.cardHdr()}>📈 HISTOGRAMA MENSAL — HH · MH · CUSTO · SEGURANÇA</div>
        <table style={S.table}>
          <thead>
            <tr>
              <TH>MÊS</TH>
              <TH right>👷 HH</TH>
              <TH right>🏗️ MH</TH>
              <TH right>💰 CUSTO MO</TH>
              <TH right>💰 CUSTO EQUIP</TH>
              <TH right accent>💰 CUSTO TOTAL</TH>
              <TH right>🦺 SEG.</TH>
            </tr>
          </thead>
          <tbody>
            {[
              ["Mai/26", 3168,  704,  69696,  44000, "✅"],
              ["Jun/26", 5280, 1408, 116160,  88000, "✅"],
              ["Jul/26", 4576, 1056, 100672,  66000, "⚠️"],
              ["Ago/26", 3200,  800,  70400,  50000, "✅"],
              ["Set/26", 1440,  320,  31680,  20000, "✅"],
            ].map(([mes, hh, mh, cmo, ceq, seg], i) => (
              <tr key={mes} style={{ borderBottom:`1px solid ${C.border}`, background:i%2===0?C.surf2+"55":"transparent" }}>
                <td style={{ padding:"7px 10px", fontSize:12, fontWeight:700, color:C.gold }}>{mes}</td>
                <TD right>{fmtInt(hh)} h</TD>
                <TD right>{fmtInt(mh)} h</TD>
                <td style={{ padding:"7px 10px", textAlign:"right", fontSize:11, color:C.blueBr }}>{fmt(cmo)}</td>
                <td style={{ padding:"7px 10px", textAlign:"right", fontSize:11, color:C.yellow }}>{fmt(ceq)}</td>
                <td style={{ padding:"7px 10px", textAlign:"right", fontSize:12, fontWeight:700, color:C.goldLight }}>
                  {fmt(cmo+ceq)}
                </td>
                <td style={{ padding:"7px 10px", textAlign:"right", fontSize:14 }}>{seg}</td>
              </tr>
            ))}
            <tr style={{ borderTop:`2px solid ${C.border2}`, background:C.surf3 }}>
              <td style={{ padding:"7px 10px", fontSize:11, fontWeight:700, color:C.goldLight }}>TOTAL</td>
              <td style={{ padding:"7px 10px", textAlign:"right", fontSize:12, fontWeight:700, color:C.blueBr }}>17.664 h</td>
              <td style={{ padding:"7px 10px", textAlign:"right", fontSize:12, fontWeight:700, color:C.yellow }}>4.288 h</td>
              <td style={{ padding:"7px 10px", textAlign:"right", fontSize:12, fontWeight:700, color:C.blueBr }}>{fmt(388608)}</td>
              <td style={{ padding:"7px 10px", textAlign:"right", fontSize:12, fontWeight:700, color:C.yellow }}>{fmt(268000)}</td>
              <td style={{ padding:"7px 10px", textAlign:"right", fontSize:13, fontWeight:700, color:C.goldLight }}>{fmt(656608)}</td>
              <td style={{ padding:"7px 10px", textAlign:"right", fontSize:12 }}>4/5 ✅</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  // ── RANKING ───────────────────────────────────────────────────────────────
  const renderRanking = () => {
    const grupos = [
      { nome:"GRUPO C", custo:71, prazo:85, seg:92, total:83, status:"top" },
      { nome:"GRUPO A", custo:65, prazo:82, seg:90, total:79, status:"alto" },
      { nome:"GRUPO D", custo:80, prazo:70, seg:85, total:78, status:"alto" },
      { nome:"GRUPO B", custo:90, prazo:88, seg:58, total:null, status:"desq" },
    ];
    return (
      <div style={S.page}>
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <h2 style={{ fontSize:20, fontWeight:700, letterSpacing:5, margin:0 }}>🏆 RANKING FINAL</h2>
          <p style={{ color:C.txt2, fontSize:10, letterSpacing:3, margin:"6px 0 0" }}>
            JORNADA 2026 · LT {tensao} · {extensao} KM · CIRCUITO {circuito.toUpperCase()}
          </p>
        </div>

        <div style={S.card}>
          <div style={S.cardHdr()}>📊 COMPARATIVO DE GRUPOS</div>
          <table style={S.table}>
            <thead>
              <tr>
                <TH w={30}>#</TH>
                <TH>GRUPO</TH>
                <TH right>💰 CUSTO</TH>
                <TH right>⏱️ PRAZO</TH>
                <TH right>🦺 SEGURANÇA</TH>
                <TH right accent>SCORE FINAL</TH>
                <TH>STATUS</TH>
              </tr>
            </thead>
            <tbody>
              {grupos.map((g, i) => (
                <tr key={g.nome} style={{
                  borderBottom:`1px solid ${C.border}`,
                  background: g.status==="top" ? C.gold+"0A" : g.status==="desq" ? C.redBr+"0A" : "transparent",
                }}>
                  <td style={{ padding:"10px 10px", fontSize:18, textAlign:"center" }}>
                    {g.status==="desq" ? "❌" : ["🥇","🥈","🥉"][i] ?? ""}
                  </td>
                  <td style={{ padding:"10px 10px", fontSize:13, fontWeight:700 }}>{g.nome}</td>
                  <td style={{ padding:"10px 10px", textAlign:"right" }}>
                    <ScoreChip label="CUSTO" value={g.custo} />
                  </td>
                  <td style={{ padding:"10px 10px", textAlign:"right" }}>
                    <ScoreChip label="PRAZO" value={g.prazo} />
                  </td>
                  <td style={{ padding:"10px 10px", textAlign:"right" }}>
                    <ScoreChip label="SEG." value={g.seg} />
                  </td>
                  <td style={{ padding:"10px 10px", textAlign:"right", fontSize:22, fontWeight:700, color:g.status==="desq"?C.redBr:getScoreColor(g.total||0) }}>
                    {g.total ?? "—"}
                  </td>
                  <td style={{ padding:"10px 10px" }}>
                    {g.status==="top" && <span style={{ background:C.gold+"22", color:C.gold, border:`1px solid ${C.gold}44`, borderRadius:3, padding:"3px 8px", fontSize:10, fontWeight:700 }}>⚡ ALTA PERFORMANCE</span>}
                    {g.status==="alto" && <span style={{ background:C.greenBr+"22", color:C.greenBr, border:`1px solid ${C.greenBr}44`, borderRadius:3, padding:"3px 8px", fontSize:10, fontWeight:700 }}>✅ APROVADO</span>}
                    {g.status==="desq" && <span style={{ background:C.redBr+"22", color:C.redBr, border:`1px solid ${C.redBr}44`, borderRadius:3, padding:"3px 8px", fontSize:10, fontWeight:700 }}>❌ DESCLASSIFICADO</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Debate */}
        <div style={{ ...S.card, borderColor:C.redBr+"44" }}>
          <div style={S.cardHdr(C.redBr)}>💬 DEBATE — GRUPO B DESCLASSIFICADO</div>
          <div style={{ padding:14, fontSize:12, color:C.txt2, lineHeight:1.9 }}>
            O Grupo B obteve os melhores scores em Custo (90) e Prazo (88), mas comprometeu a Segurança (58/100),
            sendo automaticamente desclassificado. <br/><br/>
            <strong style={{ color:C.txt }}>Ponto de reflexão para o facilitador:</strong><br/>
            "O Grupo B economizou e foi rápido — mas com que custo humano? Isso é Liderança que Protege?"
          </div>
        </div>

        {/* Gabarito */}
        <div style={{ ...S.card, borderColor:C.gold+"44" }}>
          <div style={S.cardHdr()}>🔑 GABARITO — COMPOSIÇÃO IDEAL (FACILITADOR)</div>
          <div style={{ padding:14 }}>
            <div style={S.grid2}>
              <table style={S.table}>
                <thead>
                  <tr><TH>RECURSO</TH><TH right>QTD</TH><TH>OBS</TH></tr>
                </thead>
                <tbody>
                  {[
                    ["Montador Sr","4","✅ obrigatório"],
                    ["Operador Equip.","2","✅ obrigatório"],
                    ["Técnico Segurança","1","🦺 inegociável"],
                    ["Supervisor Frente","1","✅ recomendado"],
                    ["Guindaste Grande","1","✅ correto 500kV"],
                    ["EPI Premium NR-35","8","✅ padrão mínimo"],
                    ["Pickup 4x4","2","✅ mobilidade"],
                  ].map(([r,q,o]) => (
                    <tr key={r} style={{ borderBottom:`1px solid ${C.border}` }}>
                      <TD>{r}</TD><TD right bold accent>{q}</TD><TD muted>{o}</TD>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display:"flex", flexDirection:"column", gap:10, justifyContent:"center" }}>
                <div style={{ ...S.stat, borderColor:C.gold+"44" }}>
                  <div style={{ fontSize:32, fontWeight:700, color:C.goldLight }}>83</div>
                  <div style={{ fontSize:9, color:C.txt3, letterSpacing:2 }}>SCORE IDEAL</div>
                </div>
                <div style={{ display:"flex", justifyContent:"space-around" }}>
                  <ScoreChip label="CUSTO" value={68} />
                  <ScoreChip label="PRAZO" value={85} />
                  <ScoreChip label="SEG." value={95} />
                </div>
                <div style={{ background:C.greenBr+"15", border:`1px solid ${C.greenBr}44`, borderRadius:5, padding:"10px 12px", fontSize:12, color:C.greenBr, textAlign:"center" }}>
                  ⚡ Equipe de Alta Performance<br/>
                  <span style={{ fontSize:10, color:C.txt2 }}>equilíbrio ideal custo · prazo · segurança</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={S.app}>
      {/* HEADER */}
      <header style={S.hdr}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{
            width:32, height:32, background:`linear-gradient(135deg,${C.gold},${C.goldDim})`,
            borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15,
          }}>⚡</div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, letterSpacing:3, color:C.txt }}>JORNADAS LT</div>
            <div style={{ fontSize:9, color:C.txt3, letterSpacing:3 }}>SIMULADOR DE ALTA PERFORMANCE</div>
          </div>
        </div>
        <nav style={{ display:"flex", gap:4 }}>
          {[["intro","INÍCIO"],["setup","CONFIG LT"],["composicao","COMPOSIÇÃO"],["cronograma","CRONOGRAMA"],["ranking","RANKING"]].map(([s,l]) => (
            <button key={s} style={S.navBtn(screen===s)} onClick={() => setScreen(s)}>{l}</button>
          ))}
        </nav>
      </header>

      {screen==="intro"       && renderIntro()}
      {screen==="setup"       && renderSetup()}
      {screen==="composicao"  && renderComposicao()}
      {screen==="cronograma"  && renderCronograma()}
      {screen==="ranking"     && renderRanking()}
    </div>
  );
}

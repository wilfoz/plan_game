import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { C } from "../constants/colors";
import { S } from "../styles";
import { fmt, sc } from "../utils/formatters";
import { ATIVS, MO_CAT, EQ_CAT, REQ_CAT_COLORS, REQ_TRANSLATIONS, CAT_TRANSLATIONS } from "../constants/catalogs";
import { useApp } from "../context/AppContext";
import { Card } from "../components/ui/Card";
import { BtnDel } from "../components/ui/Card";
import { Hdr2, Tag } from "../components/ui/Typography";
import { TH, TD } from "../components/ui/Table";
import { ScoreRing } from "../components/ui/Typography";
import { analyzeEficienciaStream, analyzeFollowUp, analyzeSessionStream } from "../services/claudeAI";
import { calcCoerencia } from "../utils/calculations";
import { ChartBlock } from "../components/ui/ChartBlock";
import { useAiAnalises } from "../hooks/useAiAnalises";

const fmt2 = (n: number | null) => (n != null ? n.toFixed(2) : "—");

interface SemaforoProps {
  gi: number;
  gc: (gi: number, aId: string) => any;
  lang: "pt" | "es";
}

function Semaforo({ gi, gc, lang }: SemaforoProps) {
  return (
    <div style={{ display: "flex", gap: 3, marginTop: 5, flexWrap: "wrap" }}>
      {ATIVS.map(a => {
        const comp = gc(gi, a.id);
        const filled = (comp.moRows?.length > 0) || (comp.eqRows?.length > 0) || (comp.kpi > 0);
        const titleText = lang === "es"
          ? `${a.desc.es} (${a.und.es}): ${filled ? "✅ completada" : "🔴 sin recurso"}`
          : `${a.desc.pt} (${a.und.pt}): ${filled ? "✅ preenchida" : "🔴 sem recurso"}`;
        return (
          <div
            key={a.id}
            title={titleText}
            style={{
              width: 16, height: 16, borderRadius: "50%",
              background: filled ? C.greenL : C.redL,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 7.5, fontWeight: 800, color: "#000",
              boxShadow: `0 0 5px ${filled ? C.greenL : C.redL}66`,
              cursor: "default", flexShrink: 0,
            }}
          >
            {a.id[1]}
          </div>
        );
      })}
    </div>
  );
}

function varColor(pct: number | null) {
  if (pct == null) return C.txt3;
  if (pct <= 0) return C.greenL;
  if (pct <= 30) return C.yellow;
  return C.redL;
}

interface MdTextProps {
  text?: string;
  style?: React.CSSProperties;
}

function MdText({ text, style }: MdTextProps) {
  if (!text) return null;
  return (
    <div style={style}>
      {text.split("\n").map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
          p.startsWith("**") && p.endsWith("**")
            ? <strong key={j} style={{ color: "#F1F5F9", fontWeight: 700 }}>{p.slice(2, -2)}</strong>
            : <span key={j}>{p}</span>
        );
        return <div key={i} style={{ minHeight: line.trim() ? undefined : 8 }}>{parts}</div>;
      })}
    </div>
  );
}

export default function Ranking() {
  const { t } = useTranslation();
  const { lt, buildRank, gc, realtimeConnected, role, activeSessionId, calcA, volumesPrev, lang } = useApp();
  const rank = buildRank();
  const medals = ["🥇", "🥈", "🥉"];

  const currentLang = (lang === "es" ? "es" : "pt") as "pt" | "es";

  const translateCargo = (cargoName: string) => {
    return MO_CAT.find(m => m.cargo.pt === cargoName)?.cargo[currentLang] || cargoName;
  };

  const translateEquip = (eqName: string) => {
    return EQ_CAT.find(e => e.nome.pt === eqName)?.nome[currentLang] || eqName;
  };

  const translateCategoria = (catName: string) => {
    return CAT_TRANSLATIONS[catName] || catName;
  };

  const translateAtivName = (name: string) => {
    const found = ATIVS.find(a => a.desc.pt === name);
    return found ? found.desc[currentLang] : name;
  };

  const [aiState, setAiState] = useState<Record<string, any>>({});
  const [followUpInput, setFollowUpInput] = useState<Record<string, string>>({});
  const [sessionAi, setSessionAi] = useState({ status: "idle", text: "", error: "" });
  const aiHook = useAiAnalises(activeSessionId);

  useEffect(() => {
    const saved = aiHook.query.data;
    if (!saved) return;
    setAiState(prev => {
      const next = { ...prev };
      for (const [grupoId, entry] of Object.entries(saved)) {
        if (!prev[grupoId] || prev[grupoId].status === "done") {
          next[grupoId] = { status: "done", text: (entry as any).text, charts: (entry as any).charts, error: "", savedAt: (entry as any).updatedAt };
        }
      }
      return next;
    });
  }, [aiHook.query.data]);

  const handleAnalyze = async (g: any) => {
    setAiState(prev => ({ ...prev, [g.id]: { status: "loading", text: "", charts: [], error: "", followUps: [], conversationMessages: [] } }));

    const ativs = Object.entries(g.ef?.porAtiv ?? {})
      .map(([aId, efAtv]) => ({ atv: ATIVS.find(a => a.id === aId), efAtv }))
      .filter(({ atv, efAtv }) => atv && (efAtv as any).temBase && (efAtv as any).temGrupo);

    const calcAResults = ATIVS.map(a => {
      const comp = gc(g.gi, a.id);
      const hasRes = comp.moRows.length > 0 || comp.eqRows.length > 0 || comp.kpi > 0;
      return { aId: a.id, result: hasRes ? calcA(comp, volumesPrev[a.id] || 0) : null };
    });

    const rankContext = rank.filter(r => r.id !== g.id).map(r => ({
      nome: r.nome, sC: r.sC, sD: r.sD, total: r.total, desq: r.desq, desqIncompleto: r.desqIncompleto,
    }));

    try {
      const { conversationMessages } = await analyzeEficienciaStream({
        grupo: g, lt,
        ef: g.ef ?? {},
        scores: { sC: g.sC, sD: g.sD, sS: g.sS, total: g.total, desq: g.desq, desqIncompleto: g.desqIncompleto },
        penSeg: g.penSeg,
        ativs,
        compsRaw: ATIVS.map(a => ({ atv: a, ...gc(g.gi, a.id) })),
        calcAResults,
        rankContext,
        onTool: ({ id, input }) =>
          setAiState(prev => {
            const cur = prev[g.id] ?? { charts: [] };
            return {
              ...prev,
              [g.id]: { ...cur, status: "tools", charts: [...(cur.charts ?? []), { id, input }] }
            };
          }),
        onChunk: text =>
          setAiState(prev => ({
            ...prev,
            [g.id]: { ...prev[g.id], status: "streaming", text }
          })),
      });
      setAiState(prev => {
        const final = { ...prev[g.id], status: "done", conversationMessages };
        aiHook.save.mutate({ grupoId: g.id, text: final.text, charts: final.charts ?? [] });
        return { ...prev, [g.id]: final };
      });
    } catch (err: any) {
      setAiState(prev => ({ ...prev, [g.id]: { status: "error", text: "", charts: [], error: err.message, followUps: [] } }));
    }
  };

  const handleFollowUp = async (g: any) => {
    const question = (followUpInput[g.id] ?? "").trim();
    if (!question) return;
    const ai = aiState[g.id];
    if (!ai?.conversationMessages?.length) return;

    setFollowUpInput(prev => ({ ...prev, [g.id]: "" }));
    setAiState(prev => ({
      ...prev,
      [g.id]: {
        ...prev[g.id],
        followUps: [...(prev[g.id].followUps ?? []), { question, answer: "", status: "streaming" }],
      },
    }));

    try {
      const { conversationMessages: updatedMsgs } = await analyzeFollowUp({
        conversationMessages: ai.conversationMessages,
        userQuestion: question,
        onChunk: answer =>
          setAiState(prev => {
            const fups = [...(prev[g.id].followUps ?? [])];
            fups[fups.length - 1] = { ...fups[fups.length - 1], answer, status: "streaming" };
            return { ...prev, [g.id]: { ...prev[g.id], followUps: fups } };
          }),
      });
      setAiState(prev => {
        const fups = [...(prev[g.id].followUps ?? [])];
        fups[fups.length - 1] = { ...fups[fups.length - 1], status: "done" };
        return { ...prev, [g.id]: { ...prev[g.id], followUps: fups, conversationMessages: updatedMsgs } };
      });
    } catch (err: any) {
      setAiState(prev => {
        const fups = [...(prev[g.id].followUps ?? [])];
        fups[fups.length - 1] = { ...fups[fups.length - 1], status: "error", answer: `⚠️ ${err.message}` };
        return { ...prev, [g.id]: { ...prev[g.id], followUps: fups } };
      });
    }
  };

  const handleSessionAnalyze = async () => {
    setSessionAi({ status: "loading", text: "", error: "" });
    try {
      await analyzeSessionStream({
        lt,
        groups: rank,
        onChunk: text => setSessionAi(prev => ({ ...prev, status: "streaming", text })),
      });
      setSessionAi(prev => ({ ...prev, status: "done" }));
    } catch (err: any) {
      setSessionAi({ status: "error", text: "", error: err.message });
    }
  };

  const temEficiencia = rank.some(g => g.ef?.varMoMedia != null || g.ef?.varEqMedia != null ||
    Object.values(g.ef?.porAtiv ?? {}).some(e => (e as any).temBase && (e as any).temGrupo));

  return (
    <div style={S.pg}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: 5, margin: 0 }}>
            {t("ranking.titleMain")}
          </h2>
          {role === "F" && (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: 2, padding: "3px 8px",
              borderRadius: 4,
              background: realtimeConnected ? C.greenL + "20" : C.txt3 + "20",
              border: `1px solid ${realtimeConnected ? C.greenL : C.txt3}55`,
              color: realtimeConnected ? C.greenL : C.txt3,
            }}>
              {realtimeConnected ? t("ranking.statusLive") : t("ranking.statusConnecting")}
            </span>
          )}
        </div>
        <p style={{ color: C.txt2, fontSize: 10, letterSpacing: 3, margin: "5px 0 0" }}>{lt.nome}</p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
          {[
            ["💰", t("ranking.medalsLegend.cost"), C.yellow], 
            ["⏱️", t("ranking.medalsLegend.duration"), C.blueL]
          ].map(([ic, l, col]) => (
            <span key={l as string} style={{ fontSize: 11, color: col as string }}>{ic} {l} <strong>50%</strong></span>
          ))}
          <span style={{ fontSize: 11, color: C.greenL }}>{t("ranking.medalsLegend.safety")}</span>
        </div>
      </div>

      <Card>
        <Hdr2 ch={t("ranking.title").toUpperCase()} />
        <div className="table-responsive">
          <table style={S.tbl}>
            <thead><tr>
              <TH ch="#" w={30} />
              <TH ch={t("ranking.tableHeaders.group")} />
              <TH ch={t("ranking.tableHeaders.leader")} />
              <TH ch={t("ranking.tableHeaders.cost")} right />
              <TH ch={t("ranking.tableHeaders.duration")} right />
              <TH ch={t("ranking.tableHeaders.sCost")} right />
              <TH ch={t("ranking.tableHeaders.sDur")} right />
              <TH ch={t("ranking.tableHeaders.sSeg")} right />
              <TH ch={t("ranking.tableHeaders.score")} right accent />
              <TH ch={t("ranking.tableHeaders.status")} />
            </tr></thead>
            <tbody>
              {rank.map((g, i) => {
                const isOut = g.desq || g.desqIncompleto;
                return (
                  <tr key={g.id} style={{
                    borderBottom: `1px solid ${C.border}`,
                    background: isOut ? C.redL + "08" : i === 0 ? C.gold + "08" : "transparent"
                  }}>
                    <td style={{ padding: "10px 9px", fontSize: 18, textAlign: "center" }}>
                      {isOut ? "❌" : medals[i] ?? ""}
                    </td>
                    <td style={{ padding: "10px 9px" }}>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{g.nome}</div>
                      <Semaforo gi={g.gi} gc={gc} lang={currentLang} />
                    </td>
                    <TD ch={g.resp || "—"} muted />
                    <td style={{ padding: "9px", textAlign: "right", fontSize: 11, color: C.yellow }}>{fmt(g.ct, currentLang)}</td>
                    <td style={{ padding: "9px", textAlign: "right", fontSize: 11, color: C.blueL }}>{+g.dm.toFixed(2)}m</td>
                    <td style={{ padding: "8px 9px", textAlign: "center" }}><ScoreRing v={g.sC} label="CUSTO" /></td>
                    <td style={{ padding: "8px 9px", textAlign: "center" }}><ScoreRing v={g.sD} label="DUR." /></td>
                    <td style={{ padding: "8px 9px", textAlign: "center" }}><ScoreRing v={g.sS} label="SEG." col={isOut ? C.redL : C.greenL} /></td>
                    <td style={{ padding: "10px 9px", textAlign: "right", fontSize: 22, fontWeight: 700, color: isOut ? C.redL : sc(g.total || 0) }}>
                      {isOut ? "—" : g.total}
                    </td>
                    <td style={{ padding: "9px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        {!isOut && i === 0 && <Tag text={t("ranking.tags.performance")} col={C.gold} />}
                        {!isOut && i > 0 && <Tag text={t("ranking.tags.approved")} col={C.greenL} />}
                        {g.desq && <Tag text={t("ranking.tags.disqualified")} col={C.redL} />}
                        {g.desqIncompleto && <Tag text={t("ranking.tags.incomplete")} col={C.yellow} />}
                        {(g.penSeg?.count ?? 0) > 0 && (
                          <Tag text={t("ranking.tags.penSeg", { pct: g.penSeg.pct, count: g.penSeg.count })} col={C.yellow} />
                        )}
                        {(g.ef?.countPrazoRisco ?? 0) > 0 && (
                          <Tag text={t("ranking.tags.kpiRisco", { count: g.ef.countPrazoRisco })} col={C.yellow} />
                        )}
                        {(g.ef?.countPrazoPior ?? 0) > 0 && (
                          <Tag text={t("ranking.tags.kpiPior", { count: g.ef.countPrazoPior })} col={C.redL} />
                        )}
                        {(g.ef?.countSubAlocacao ?? 0) > 0 && (
                          <Tag text={t("ranking.tags.suballoc", { count: g.ef.countSubAlocacao })} col={C.redL} />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ANÁLISE CONSOLIDADA DA SESSÃO — apenas facilitador */}
      {role === "F" && (
        <Card>
          <Hdr2 ch={t("ranking.consolidatedAiTitle")} />
          <div style={{ padding: "8px 14px 14px" }}>
            <div style={{ fontSize: 10, color: C.txt3, marginBottom: 12, lineHeight: 1.6 }}>
              {t("ranking.consolidatedAiInfo")}
            </div>
            {(sessionAi.status === "idle" || sessionAi.status === "done" || sessionAi.status === "error") && (
              <button
                style={{ ...S.btnS, fontSize: 10, padding: "5px 14px", borderColor: "#A78BFA", color: "#A78BFA" }}
                onClick={handleSessionAnalyze}
              >
                🤖 {sessionAi.status === "done" ? t("ranking.consolidatedAiNewBtn") : t("ranking.consolidatedAiAnalyzeBtn")}
              </button>
            )}
            {sessionAi.status === "error" && (
              <div style={{ marginTop: 8, fontSize: 10, color: C.redL }}>⚠️ {sessionAi.error}</div>
            )}
            {(sessionAi.status === "loading" || sessionAi.status === "streaming" || sessionAi.status === "done") && (
              <div style={{
                marginTop: 10, borderRadius: 6,
                background: "#0F172A", border: "1px solid #2E1065",
                overflow: "hidden"
              }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "8px 12px", borderBottom: "1px solid #2E1065", background: "#0A0A1A"
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#A78BFA", letterSpacing: 2 }}>
                    {t("ranking.consolidatedAiTitlePanel")}
                  </span>
                  {sessionAi.status === "loading" && (
                    <span style={{ fontSize: 9, color: "#94A3B8", fontStyle: "italic" }}>{t("ranking.aiClaudeConnecting")}</span>
                  )}
                  {sessionAi.status === "streaming" && (
                    <span style={{ fontSize: 9, color: "#34D399", fontStyle: "italic" }}>{t("ranking.aiClaudeAnalyzing")}</span>
                  )}
                  {sessionAi.status === "done" && (
                    <span style={{ fontSize: 9, color: "#6B7280" }}>sonnet-4-6</span>
                  )}
                </div>
                <div style={{ padding: "12px 14px", minHeight: 40 }}>
                  {sessionAi.status === "loading" && (
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      {[0, 1, 2].map(j => (
                        <span key={j} style={{
                          width: 5, height: 5, borderRadius: "50%", background: "#A78BFA", opacity: 0.7,
                          animation: `pulse 1.2s ease-in-out ${j * 0.2}s infinite`
                        }} />
                      ))}
                    </div>
                  )}
                  {sessionAi.text && (
                    <MdText text={sessionAi.text} style={{ fontSize: 11, color: "#CBD5E1", lineHeight: 1.7, whiteSpace: "pre-wrap" }} />
                  )}
                  {sessionAi.status === "streaming" && (
                    <span style={{
                      display: "inline-block", width: 8, height: 14,
                      background: "#A78BFA", marginLeft: 2, verticalAlign: "text-bottom",
                      animation: "blink 0.8s step-end infinite"
                    }} />
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ANÁLISE DE EFICIÊNCIA */}
      {temEficiencia && (
        <Card>
          <Hdr2 ch={t("ranking.efficiencyTitle")} />
          <div style={{ padding: "4px 14px 14px" }}>
            <div style={{ fontSize: 10, color: C.txt3, marginBottom: 12, lineHeight: 1.6 }}>
              {t("ranking.efficiencyInfo")}
            </div>

            {rank.map(g => {
              if (!g.ef) return null;
              const { porAtiv, varMoMedia, varEqMedia } = g.ef;
              const ativsComComp = Object.entries(porAtiv).filter(([, e]) => (e as any).temBase && (e as any).temGrupo);
              if (ativsComComp.length === 0) return null;

              const mediaCol = varColor(varMoMedia);
              const ai = aiState[g.id];

              return (
                <div key={g.id} style={{
                  marginBottom: 16, padding: "12px 14px", borderRadius: 6,
                  border: `1px solid ${C.border2}`, background: C.surf2
                }}>
                  {/* Cabeçalho do grupo */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.txt }}>{g.nome}</span>
                    {g.resp && <span style={{ fontSize: 10, color: C.txt3 }}>{g.resp}</span>}
                    {varMoMedia != null && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: mediaCol,
                        background: mediaCol + "18", border: `1px solid ${mediaCol}44`,
                        borderRadius: 4, padding: "2px 8px"
                      }}>
                        {t("ranking.efficiencyMoBadge", { val: Math.abs(varMoMedia), sign: varMoMedia > 0 ? "+" : varMoMedia < 0 ? "-" : "" })}
                      </span>
                    )}
                    {varEqMedia != null && varEqMedia !== 0 && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: varColor(varEqMedia),
                        background: varColor(varEqMedia) + "18", border: `1px solid ${varColor(varEqMedia)}44`,
                        borderRadius: 4, padding: "2px 8px"
                      }}>
                        {t("ranking.efficiencyEqBadge", { val: Math.abs(varEqMedia), sign: varEqMedia > 0 ? "+" : varEqMedia < 0 ? "-" : "" })}
                      </span>
                    )}
                  </div>

                  {/* Tabela por atividade */}
                  {/* Tabela por atividade */}
                  <div className="table-responsive">
                    <table style={{ ...S.tbl, marginBottom: 8 }}>
                      <thead><tr>
                        <TH ch={t("ranking.efficiencyTableHeaders.activity")} w={180} />
                        <TH ch={t("ranking.efficiencyTableHeaders.coefMoGroup")} right w={115} />
                        <TH ch={t("ranking.efficiencyTableHeaders.coefMoBase")} right w={110} />
                        <TH ch={t("ranking.efficiencyTableHeaders.varMo")} right w={75} />
                        <TH ch={t("ranking.efficiencyTableHeaders.varKpi")} right w={75} />
                        <TH ch={t("ranking.efficiencyTableHeaders.coefEqGroup")} right w={115} />
                        <TH ch={t("ranking.efficiencyTableHeaders.coefEqBase")} right w={110} />
                        <TH ch={t("ranking.efficiencyTableHeaders.varEq")} right w={75} />
                        <TH ch={t("ranking.efficiencyTableHeaders.prazo")} right w={80} />
                      </tr></thead>
                      <tbody>
                        {ativsComComp.map(([aId, ef]: [string, any]) => {
                          const atv = ATIVS.find(a => a.id === aId);
                          if (!atv) return null;
                          const und = atv.und[currentLang].toLowerCase();
                          const colMo = varColor(ef.varMoPct);
                          const colEq = varColor(ef.varEqPct);
                          const colKpi = ef.varKpiPct == null ? C.txt3
                            : ef.varKpiPct >= 0 ? C.greenL : C.redL;
                          const prazoIcon = ef.impactoPrazo === "melhor" ? { icon: "↓", col: C.greenL, tip: "menor" }
                            : ef.impactoPrazo === "pior" ? { icon: "↑", col: C.redL, tip: "maior" }
                            : ef.impactoPrazo === "risco" ? { icon: "?", col: C.yellow, tip: "validar" }
                            : { icon: "=", col: C.txt3, tip: "neutro" };
                          return (
                            <tr key={aId} style={{ borderBottom: `1px solid ${C.border}` }}>
                              <td style={{ padding: "5px 8px", fontSize: 10, color: C.txt2 }}>{atv.desc[currentLang]}</td>
                              <td style={{ padding: "5px 8px", textAlign: "right", fontSize: 10, color: C.txt }}>
                                {ef.coefMoGrupo != null ? `${fmt2(ef.coefMoGrupo)} Hh/${und}` : "—"}
                              </td>
                              <td style={{ padding: "5px 8px", textAlign: "right", fontSize: 10, color: C.txt3 }}>
                                {ef.coefMoBase != null ? `${fmt2(ef.coefMoBase)} Hh/${und}` : "—"}
                              </td>
                              <td style={{ padding: "5px 8px", textAlign: "right" }}>
                                {ef.varMoPct != null ? (
                                  <span style={{ fontSize: 9, fontWeight: 700, color: colMo, background: colMo + "18", border: `1px solid ${colMo}44`, borderRadius: 3, padding: "1px 5px" }}>
                                    {ef.varMoPct > 0 ? "+" : ""}{ef.varMoPct}%
                                  </span>
                                ) : <span style={{ color: C.txt3, fontSize: 9 }}>—</span>}
                              </td>
                              <td style={{ padding: "5px 8px", textAlign: "right" }}>
                                {ef.varKpiPct != null ? (
                                  <span style={{ fontSize: 9, fontWeight: 700, color: colKpi, background: colKpi + "18", border: `1px solid ${colKpi}44`, borderRadius: 3, padding: "1px 5px" }}>
                                    {ef.varKpiPct > 0 ? "+" : ""}{ef.varKpiPct}%
                                  </span>
                                ) : <span style={{ color: C.txt3, fontSize: 9 }}>—</span>}
                              </td>
                              <td style={{ padding: "5px 8px", textAlign: "right", fontSize: 10, color: C.txt }}>
                                {ef.coefEqGrupo != null && ef.coefEqGrupo > 0 ? `${fmt2(ef.coefEqGrupo)} Ch/${und}` : "—"}
                              </td>
                              <td style={{ padding: "5px 8px", textAlign: "right", fontSize: 10, color: C.txt3 }}>
                                {ef.coefEqBase != null && ef.coefEqBase > 0 ? `${fmt2(ef.coefEqBase)} Ch/${und}` : "—"}
                              </td>
                              <td style={{ padding: "5px 8px", textAlign: "right" }}>
                                {ef.varEqPct != null && ef.varEqPct !== 0 ? (
                                  <span style={{ fontSize: 9, fontWeight: 700, color: colEq, background: colEq + "18", border: `1px solid ${colEq}44`, borderRadius: 3, padding: "1px 5px" }}>
                                    {ef.varEqPct > 0 ? "+" : ""}{ef.varEqPct}%
                                  </span>
                                ) : <span style={{ color: C.txt3, fontSize: 9 }}>—</span>}
                              </td>
                              <td style={{ padding: "5px 8px", textAlign: "right" }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: prazoIcon.col }} title={prazoIcon.tip}>
                                  {prazoIcon.icon}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* ── ALERTAS DE INCOMPATIBILIDADE ── */}
                  {(() => {
                    const alertasKpi = Object.entries(porAtiv)
                      .filter(([, e]) => (e as any).varKpiPct != null && (e as any).varKpiPct > 40)
                      .map(([aId, e]) => ({ aId, atv: ATIVS.find(a => a.id === aId), e: e as any }));
                    const alertasSub = Object.entries(porAtiv)
                      .flatMap(([aId, e]) => ((e as any).subAlocacao ?? []).map((s: any) => ({ ...s, aId, atv: ATIVS.find(a => a.id === aId) })));
                    const coerenciaRank = Object.keys(porAtiv).flatMap(aId => {
                      const comp = gc(g.gi, aId);
                      const atv = ATIVS.find(a => a.id === aId);
                      if (!atv) return [];
                      const { issues } = calcCoerencia(comp.moRows ?? [], comp.eqRows ?? []);
                      return issues.map(iss => ({ ...iss, aId, atv }));
                    });
                    if (alertasKpi.length === 0 && alertasSub.length === 0 && coerenciaRank.length === 0) return null;
                    return (
                      <div style={{ marginBottom: 10, padding: "10px 14px", borderRadius: 5, background: C.yellow + "0E", border: `1px solid ${C.yellow}55` }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: C.yellow, letterSpacing: 2, marginBottom: 8 }}>
                          {t("composition.warningKpiCoherenceTitle")}
                        </div>
                        {alertasKpi.map(({ aId, atv, e }) => (
                          <div key={aId + "_kpi"} style={{ fontSize: 9, color: C.yellow, padding: "3px 0 3px 8px", borderLeft: `2px solid ${C.yellow}`, marginBottom: 4, lineHeight: 1.5 }}>
                            🎯 <strong>{atv?.desc[currentLang]}</strong>: {t("composition.warningKpiBase", { kpiGrupo: e.kpiGrupo, kpiBase: e.kpiBase, sign: e.varKpiPct > 0 ? "+" : "", pct: e.varKpiPct })}
                          </div>
                        ))}
                        {alertasSub.map((s, si) => (
                          <div key={`${s.aId}_${s.cargo}_${si}`} style={{ fontSize: 9, color: C.redL, padding: "3px 0 3px 8px", borderLeft: `2px solid ${C.redL}`, marginBottom: 4, lineHeight: 1.5 }}>
                            📉 <strong>{s.atv?.desc[currentLang]}</strong> — {t("composition.warningSuballocDetail", { cargo: translateCargo(s.cargo), coefGrupo: s.coefGrupo, minCoef: s.minCoef, minVarPct: s.minVarPct })}
                          </div>
                        ))}
                        {coerenciaRank.map((iss, i) => {
                          let msg = "";
                          switch (iss.type) {
                            case "sem_equipamento": 
                              msg = currentLang === "es"
                                ? `${translateCargo(iss.cargo)} (${iss.qtd}) sin equipo correspondiente`
                                : `${iss.cargo} (${iss.qtd}) sem equipamento correspondente`;
                              break;
                            case "sem_operador": 
                              msg = currentLang === "es"
                                ? `${translateEquip(iss.equip || "")} (${iss.qtd}) sin operador/conductor correspondiente`
                                : `${iss.equip} (${iss.qtd}) sem operador/motorista correspondente`;
                              break;
                            case "eq_insuficiente": 
                              msg = currentLang === "es"
                                ? `${translateEquip(iss.equip || "")} — cantidad insuficiente para los operadores`
                                : `${iss.equip} — quantidade insuficiente para os operadores`;
                              break;
                            case "eq_ocioso": 
                              msg = currentLang === "es"
                                ? `${translateEquip(iss.equip || "")} (${iss.qtd}) en exceso — sin operadores suficientes`
                                : `${iss.equip} (${iss.qtd}) em excesso — sem operadores suficientes`;
                              break;
                            case "impar_puller_freio": 
                              msg = currentLang === "es"
                                ? `Puller y Freno deben ser en cantidad igual`
                                : `Puller e Freio devem ser em quantidade igual`;
                              break;
                            case "transporte_insuficiente": 
                              msg = currentLang === "es"
                                ? `Transporte insuficiente para el equipo`
                                : `Transporte insuficiente para a equipe`;
                              break;
                            default: 
                              msg = iss.type;
                          }
                          return (
                            <div key={`coer_${i}`} style={{ fontSize: 9, color: C.txt2, padding: "3px 0 3px 8px", borderLeft: `2px solid ${C.txt3}`, marginBottom: 4, lineHeight: 1.5 }}>
                              ⚙️ <strong>{iss.atv?.desc[currentLang]}</strong> — {msg}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* ── BLOCO DE ANÁLISE IA ── */}
                  <div style={{ marginTop: 12 }}>
                    {(!ai || ai.status === "done" || ai.status === "error") && ai?.status !== "loading" && ai?.status !== "tools" && ai?.status !== "streaming" ? (
                      <button
                        style={{
                          ...S.btnS,
                          fontSize: 10, padding: "5px 14px",
                          borderColor: "#3B82F6", color: "#3B82F6",
                        }}
                        onClick={() => handleAnalyze(g)}
                      >
                        🤖 {ai?.status === "done" ? t("ranking.consolidatedAiNewBtn") : t("ranking.aiAnalysis.button")}
                      </button>
                    ) : ai.status === "error" ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          padding: "6px 10px", borderRadius: 4, fontSize: 10,
                          color: C.redL, background: C.redL + "10", border: `1px solid ${C.redL}33`
                        }}>
                          ⚠️ {ai.error}
                        </span>
                        <button style={{ ...S.btnS, fontSize: 9 }} onClick={() => handleAnalyze(g)}>
                          Tentar novamente
                        </button>
                      </div>
                    ) : null}

                    {/* Painel de resposta */}
                    {ai && ai.status !== "idle" && (
                      <div style={{
                        marginTop: 8, borderRadius: 6,
                        background: "#0F172A", border: `1px solid #1E3A5F`,
                        overflow: "hidden"
                      }}>
                        {/* Cabeçalho */}
                        <div style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "8px 12px", borderBottom: "1px solid #1E3A5F",
                          background: "#0A1628"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#60A5FA", letterSpacing: 2 }}>
                              {t("ranking.aiClaudeTitle")}
                            </span>
                            {ai.status === "loading" && (
                              <span style={{ fontSize: 9, color: "#94A3B8", fontStyle: "italic" }}>{t("ranking.aiClaudeConnecting")}</span>
                            )}
                            {ai.status === "tools" && (
                              <span style={{ fontSize: 9, color: "#A78BFA", fontStyle: "italic" }}>{t("ranking.aiClaudeGenCharts")}</span>
                            )}
                            {ai.status === "streaming" && (
                              <span style={{ fontSize: 9, color: "#34D399", fontStyle: "italic" }}>{t("ranking.aiClaudeAnalyzing")}</span>
                            )}
                            {ai.status === "done" && (
                              <span style={{ fontSize: 9, color: "#6B7280" }}>
                                {t("ranking.aiClaudeModelInfo")}
                                {ai.savedAt && ` · ${new Date(ai.savedAt).toLocaleString(currentLang === "es" ? "es-ES" : "pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`}
                              </span>
                            )}
                          </div>
                          {ai.status === "done" && (
                            <button
                              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 9, color: "#4B5563", padding: "2px 6px" }}
                              onClick={() => setAiState(prev => ({ ...prev, [g.id]: undefined }))}
                            >
                              {t("ranking.aiClaudeClose")}
                            </button>
                          )}
                        </div>

                        {/* Conteúdo */}
                        <div style={{ padding: "12px 14px", minHeight: 40 }}>
                          {ai.status === "loading" && (
                            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                              {[0, 1, 2].map(j => (
                                <span key={j} style={{
                                  width: 5, height: 5, borderRadius: "50%", background: "#3B82F6", opacity: 0.7,
                                  animation: `pulse 1.2s ease-in-out ${j * 0.2}s infinite`
                                }} />
                              ))}
                            </div>
                          )}

                          {/* Gráficos */}
                          {(ai.charts?.length ?? 0) > 0 && (
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ fontSize: 9, color: "#475569", letterSpacing: 1, marginBottom: 8 }}>
                                {t("ranking.aiClaudeChartsTitle")}
                              </div>
                              <div style={{
                                display: "grid",
                                gridTemplateColumns: ai.charts.length >= 2 ? "1fr 1fr" : "1fr",
                                gap: 8
                              }}>
                                {ai.charts.map((chart: any) => (
                                  <ChartBlock key={chart.id} input={chart.input} />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Texto análise */}
                          {(ai.status === "streaming" || ai.status === "done") && ai.text && (
                            <>
                              <div style={{ fontSize: 9, color: "#475569", letterSpacing: 1, marginBottom: 8 }}>
                                {t("ranking.aiClaudeAnalysisTitle")}
                              </div>
                              <MdText
                                text={ai.text}
                                style={{ fontSize: 11, color: "#CBD5E1", lineHeight: 1.7, whiteSpace: "pre-wrap" }}
                              />
                            </>
                          )}
                          {ai.status === "streaming" && (
                            <span style={{
                              display: "inline-block", width: 8, height: 14,
                              background: "#60A5FA", marginLeft: 2, verticalAlign: "text-bottom",
                              animation: "blink 0.8s step-end infinite"
                            }} />
                          )}

                          {/* Follow-up */}
                          {(ai.followUps ?? []).map((fu: any, fi: number) => (
                            <div key={fi} style={{ marginTop: 12, borderTop: "1px solid #1E3A5F", paddingTop: 10 }}>
                              <div style={{ fontSize: 9, color: "#60A5FA", fontWeight: 700, marginBottom: 4 }}>
                                🧑 {fu.question}
                              </div>
                              {fu.answer && (
                                <MdText text={fu.answer}
                                  style={{ fontSize: 11, color: "#CBD5E1", lineHeight: 1.7, whiteSpace: "pre-wrap" }} />
                              )}
                              {fu.status === "streaming" && (
                                <span style={{
                                  display: "inline-block", width: 8, height: 14,
                                  background: "#60A5FA", marginLeft: 2, verticalAlign: "text-bottom",
                                  animation: "blink 0.8s step-end infinite"
                                }} />
                              )}
                              {fu.status === "error" && (
                                <span style={{ fontSize: 10, color: C.redL }}>{fu.answer}</span>
                              )}
                            </div>
                          ))}

                          {/* Follow-up input */}
                          {ai.status === "done" && ai.conversationMessages?.length > 0 && (() => {
                            const isFollowing = (ai.followUps ?? []).some(f => (f as any).status === "streaming");
                            return (
                              <div style={{ marginTop: 14, borderTop: "1px solid #1E3A5F", paddingTop: 10 }}>
                                <div style={{ fontSize: 9, color: "#475569", letterSpacing: 1, marginBottom: 6 }}>
                                  {t("ranking.aiClaudeAskAgent")}
                                </div>
                                <div style={{ display: "flex", gap: 6 }}>
                                  <input
                                    type="text"
                                    value={followUpInput[g.id] ?? ""}
                                    onChange={e => setFollowUpInput(prev => ({ ...prev, [g.id]: e.target.value }))}
                                    onKeyDown={e => { if (e.key === "Enter" && !isFollowing) handleFollowUp(g); }}
                                    placeholder={t("ranking.aiClaudePlaceholder")}
                                    disabled={isFollowing}
                                    style={{
                                      flex: 1, background: "#0A1628", border: "1px solid #1E3A5F",
                                      borderRadius: 4, padding: "5px 9px", color: "#CBD5E1", fontSize: 10,
                                      outline: "none",
                                    }}
                                  />
                                  <button
                                    onClick={() => handleFollowUp(g)}
                                    disabled={isFollowing || !(followUpInput[g.id] ?? "").trim()}
                                    style={{
                                      ...S.btnS, fontSize: 9, padding: "5px 12px",
                                      borderColor: isFollowing ? "#475569" : "#3B82F6",
                                      color: isFollowing ? "#475569" : "#3B82F6",
                                    }}
                                  >
                                    {isFollowing ? "..." : t("ranking.aiClaudeSend")}
                                  </button>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* DEBRIEFING DE SEGURANÇA */}
      {rank.some(g => g.desq) && (
        <Card b={C.redL + "44"}>
          <Hdr2 col={C.redL} ch={t("ranking.debriefingSafetyTitle")} />
          <div style={{ padding: 14 }}>
            {rank.filter(g => g.desq).map(g => (
              <div key={g.id} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.txt, marginBottom: 6 }}>
                  {t("ranking.debriefingSafetySubtitle", { nome: g.nome, count: g.missing.length })}
                </div>
                <table style={{ ...S.tbl, marginBottom: 4 }}>
                  <thead><tr>
                    <TH ch={t("gantt.cols.activity")} w={180} />
                    <TH ch={t("requirements.cols.category")} w={130} />
                    <TH ch={t("requirements.cols.desc")} />
                  </tr></thead>
                  <tbody>
                    {g.missing.map((m: any, mi: number) => {
                      const displayDesc = currentLang === "es" ? (REQ_TRANSLATIONS[m.desc] || m.desc) : m.desc;
                      const displayCategory = translateCategoria(m.categoria);
                      const displayAtivName = translateAtivName(m.atividade);
                      return (
                        <tr key={mi} style={{ borderBottom: `1px solid ${C.border}`, background: C.redL + "08" }}>
                          <td style={{ padding: "5px 9px", fontSize: 10, color: C.txt2 }}>{displayAtivName}</td>
                          <td style={{ padding: "5px 9px" }}><Tag text={displayCategory} col={C.redL} /></td>
                          <td style={{ padding: "5px 9px", fontSize: 10, color: C.txt }}>{displayDesc || "(sem descrição)"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
            <div style={{ marginTop: 6, padding: "10px 14px", borderRadius: 5, background: C.gold + "10", border: `1px solid ${C.gold}33`, color: C.txt, fontSize: 11 }}>
              {t("ranking.debriefingSafetyQuote")}
            </div>
          </div>
        </Card>
      )}

      {/* DEBRIEFING — ATIVIDADES SEM RECURSO */}
      {rank.some(g => g.desqIncompleto) && (
        <Card b={C.yellow + "44"}>
          <Hdr2 col={C.yellow} ch={t("ranking.debriefingIncompleteTitle")} />
          <div style={{ padding: 14 }}>
            <div style={{ fontSize: 10, color: C.txt2, marginBottom: 12, lineHeight: 1.6 }}>
              {t("ranking.debriefingIncompleteInfo")}
            </div>
            {rank.filter(g => g.desqIncompleto).map(g => (
              <div key={g.id} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.txt, marginBottom: 6 }}>
                  {t("ranking.debriefingIncompleteGroup", { nome: g.nome, count: g.atvsVazias?.length })}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {(g.atvsVazias ?? []).map((aId: string) => {
                    const atv = ATIVS.find(a => a.id === aId);
                    return (
                      <div key={aId} style={{
                        padding: "4px 10px", borderRadius: 4, fontSize: 10,
                        background: C.yellow + "15", border: `1px solid ${C.yellow}44`,
                        color: C.yellow, fontWeight: 600,
                      }}>
                        {aId} — {atv?.desc[currentLang] ?? aId}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:0.5} 50%{transform:scale(1.4);opacity:1} }
      `}</style>
    </div>
  );
}

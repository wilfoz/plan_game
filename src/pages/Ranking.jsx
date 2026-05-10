import { useState, useEffect } from "react";
import { C } from "../constants/colors";
import { S } from "../styles";
import { fmt, sc } from "../utils/formatters";
import { ATIVS } from "../constants/catalogs";
import { useApp } from "../context/AppContext";
import { Card } from "../components/ui/Card";
import { Hdr2, Tag } from "../components/ui/Typography";
import { TH, TD } from "../components/ui/Table";
import { ScoreRing } from "../components/ui/Typography";
import { analyzeEficienciaStream } from "../services/claudeAI";
import { ChartBlock } from "../components/ui/ChartBlock";
import { useAiAnalises } from "../hooks/useAiAnalises";

const fmt2 = n => (n != null ? n.toFixed(2) : "—");

function varColor(pct) {
  if (pct == null) return C.txt3;
  if (pct <= 0) return C.greenL;
  if (pct <= 30) return C.yellow;
  return C.redL;
}

// Renderiza markdown básico: **negrito** e quebras de linha
function MdText({ text, style }) {
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

// A chave Anthropic fica no servidor (ANTHROPIC_API_KEY sem prefixo VITE_).
// O botão de IA é sempre exibido; erros de chave ausente aparecem na chamada.
const HAS_KEY = true;

export default function Ranking() {
  const { lt, buildRank, gc, realtimeConnected, role, activeSessionId } = useApp();
  const rank = buildRank();
  const medals = ["🥇", "🥈", "🥉"];

  // { [grupoId]: { status: 'loading'|'tools'|'streaming'|'done'|'error', text, charts, error } }
  const [aiState, setAiState] = useState({});
  const aiHook = useAiAnalises(activeSessionId);

  // Inicializa aiState com análises salvas no Supabase (não sobrescreve análises em andamento)
  useEffect(() => {
    const saved = aiHook.query.data;
    if (!saved) return;
    setAiState(prev => {
      const next = { ...prev };
      for (const [grupoId, entry] of Object.entries(saved)) {
        if (!prev[grupoId] || prev[grupoId].status === "done") {
          next[grupoId] = { status: "done", text: entry.text, charts: entry.charts, error: "", savedAt: entry.updatedAt };
        }
      }
      return next;
    });
  }, [aiHook.query.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnalyze = async (g) => {
    setAiState(prev => ({ ...prev, [g.id]: { status: "loading", text: "", charts: [], error: "" } }));

    const ativs = Object.entries(g.ef?.porAtiv ?? {})
      .map(([aId, efAtv]) => ({ atv: ATIVS.find(a => a.id === aId), efAtv }))
      .filter(({ atv, efAtv }) => atv && efAtv.temBase && efAtv.temGrupo);

    try {
      await analyzeEficienciaStream({
        grupo: g, lt,
        ef: g.ef ?? {},
        scores: { sC: g.sC, sD: g.sD, sS: g.sS, total: g.total, desq: g.desq },
        penSeg: g.penSeg,
        ativs,
        compsRaw: ATIVS.map(a => ({ atv: a, ...gc(g.gi, a.id) })),
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
        const final = { ...prev[g.id], status: "done" };
        // Salva no Supabase após conclusão
        aiHook.save.mutate({ grupoId: g.id, text: final.text, charts: final.charts ?? [] });
        return { ...prev, [g.id]: final };
      });
    } catch (err) {
      setAiState(prev => ({ ...prev, [g.id]: { status: "error", text: "", charts: [], error: err.message } }));
    }
  };

  const temEficiencia = rank.some(g => g.ef?.varMoMedia != null || g.ef?.varEqMedia != null ||
    Object.values(g.ef?.porAtiv ?? {}).some(e => e.temBase && e.temGrupo));

  return (
    <div style={S.pg}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: 5, margin: 0 }}>🏆 RANKING FINAL</h2>
          {role === "F" && (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: 2, padding: "3px 8px",
              borderRadius: 4,
              background: realtimeConnected ? C.greenL + "20" : C.txt3 + "20",
              border: `1px solid ${realtimeConnected ? C.greenL : C.txt3}55`,
              color: realtimeConnected ? C.greenL : C.txt3,
            }}>
              {realtimeConnected ? "● AO VIVO" : "○ CONECTANDO..."}
            </span>
          )}
        </div>
        <p style={{ color: C.txt2, fontSize: 10, letterSpacing: 3, margin: "5px 0 0" }}>{lt.nome}</p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
          {[["💰", "CUSTO", "50%", C.yellow], ["⏱️", "DURAÇÃO", "50%", C.blueL]].map(([ic, l, p, col]) => (
            <span key={l} style={{ fontSize: 11, color: col }}>{ic} {l} <strong>{p}</strong></span>
          ))}
          <span style={{ fontSize: 11, color: C.greenL }}>🦺 SEGURANÇA <strong>classificatória</strong></span>
        </div>
      </div>

      <Card>
        <Hdr2 ch="📊 COMPARATIVO DE GRUPOS" />
        <table style={S.tbl}>
          <thead><tr>
            <TH ch="#" w={30} /><TH ch="GRUPO" /><TH ch="RESPONSÁVEL" />
            <TH ch="💰 CUSTO TOTAL" right /><TH ch="⏱️ DUR. TOTAL" right />
            <TH ch="S.CUSTO" right /><TH ch="S.DUR." right /><TH ch="🦺 SEG." right />
            <TH ch="SCORE" right accent /><TH ch="STATUS" />
          </tr></thead>
          <tbody>
            {rank.map((g, i) => (
              <tr key={g.id} style={{
                borderBottom: `1px solid ${C.border}`,
                background: g.desq ? C.redL + "08" : i === 0 ? C.gold + "08" : "transparent"
              }}>
                <td style={{ padding: "10px 9px", fontSize: 18, textAlign: "center" }}>
                  {g.desq ? "❌" : medals[i] ?? ""}
                </td>
                <td style={{ padding: "10px 9px", fontSize: 12, fontWeight: 700 }}>{g.nome}</td>
                <TD ch={g.resp || "—"} muted />
                <td style={{ padding: "9px", textAlign: "right", fontSize: 11, color: C.yellow }}>{fmt(g.ct)}</td>
                <td style={{ padding: "9px", textAlign: "right", fontSize: 11, color: C.blueL }}>{+g.dm.toFixed(2)}m</td>
                <td style={{ padding: "8px 9px", textAlign: "center" }}><ScoreRing v={g.sC} label="CUSTO" /></td>
                <td style={{ padding: "8px 9px", textAlign: "center" }}><ScoreRing v={g.sD} label="DUR." /></td>
                <td style={{ padding: "8px 9px", textAlign: "center" }}><ScoreRing v={g.sS} label="SEG." col={g.desq ? C.redL : C.greenL} /></td>
                <td style={{ padding: "10px 9px", textAlign: "right", fontSize: 22, fontWeight: 700, color: g.desq ? C.redL : sc(g.total || 0) }}>
                  {g.desq ? "—" : g.total}
                </td>
                <td style={{ padding: "9px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {!g.desq && i === 0 && <Tag text="⚡ ALTA PERFORMANCE" col={C.gold} />}
                    {!g.desq && i > 0 && <Tag text="✅ APROVADO" col={C.greenL} />}
                    {g.desq && <Tag text="❌ DESCLASSIFICADO" col={C.redL} />}
                    {(g.penSeg?.count ?? 0) > 0 && (
                      <Tag text={`+${g.penSeg.pct}% CUSTO (${g.penSeg.count} req. n/aplic.)`} col={C.yellow} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* ANÁLISE DE EFICIÊNCIA */}
      {temEficiencia && (
        <Card>
          <Hdr2 ch="📐 ANÁLISE DE EFICIÊNCIA — COEFICIENTES VS REFERÊNCIA" />
          <div style={{ padding: "4px 14px 14px" }}>
            <div style={{ fontSize: 10, color: C.txt3, marginBottom: 12, lineHeight: 1.6 }}>
              Comparação entre o coeficiente de cada grupo (Hh/unid e Ch/unid) e a equipe base definida pelo facilitador.
              Variação positiva (+) indica uso maior de recursos por unidade — impacto no score de Custo e/ou Prazo.
            </div>

            {rank.map(g => {
              if (!g.ef) return null;
              const { porAtiv, varMoMedia, varEqMedia } = g.ef;
              const ativsComComp = Object.entries(porAtiv).filter(([, e]) => e.temBase && e.temGrupo);
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
                        MO méd. {varMoMedia > 0 ? "+" : ""}{varMoMedia}% vs referência
                      </span>
                    )}
                    {varEqMedia != null && varEqMedia !== 0 && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: varColor(varEqMedia),
                        background: varColor(varEqMedia) + "18", border: `1px solid ${varColor(varEqMedia)}44`,
                        borderRadius: 4, padding: "2px 8px"
                      }}>
                        EQ méd. {varEqMedia > 0 ? "+" : ""}{varEqMedia}% vs referência
                      </span>
                    )}
                  </div>

                  {/* Tabela por atividade */}
                  <table style={{ ...S.tbl, marginBottom: 8 }}>
                    <thead><tr>
                      <TH ch="ATIVIDADE" w={180} />
                      <TH ch="COEF. MO GRUPO" right w={115} />
                      <TH ch="COEF. MO BASE" right w={110} />
                      <TH ch="VAR. MO" right w={75} />
                      <TH ch="VAR. KPI" right w={75} />
                      <TH ch="COEF. EQ GRUPO" right w={115} />
                      <TH ch="COEF. EQ BASE" right w={110} />
                      <TH ch="VAR. EQ" right w={75} />
                      <TH ch="PRAZO" right w={80} />
                    </tr></thead>
                    <tbody>
                      {ativsComComp.map(([aId, ef]) => {
                        const atv = ATIVS.find(a => a.id === aId);
                        if (!atv) return null;
                        const und = atv.und.toLowerCase();
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
                            <td style={{ padding: "5px 8px", fontSize: 10, color: C.txt2 }}>{atv.desc}</td>
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
                        🤖 {ai?.status === "done" ? "Nova análise IA" : "Analisar com IA"}
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

                    {/* Painel de resposta — visível durante tools, streaming e após conclusão */}
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
                              🤖 ANÁLISE CLAUDE AI
                            </span>
                            {ai.status === "loading" && (
                              <span style={{ fontSize: 9, color: "#94A3B8", fontStyle: "italic" }}>conectando...</span>
                            )}
                            {ai.status === "tools" && (
                              <span style={{ fontSize: 9, color: "#A78BFA", fontStyle: "italic" }}>● gerando gráficos</span>
                            )}
                            {ai.status === "streaming" && (
                              <span style={{ fontSize: 9, color: "#34D399", fontStyle: "italic" }}>● analisando</span>
                            )}
                            {ai.status === "done" && (
                              <span style={{ fontSize: 9, color: "#6B7280" }}>
                                claude-haiku-4-5
                                {ai.savedAt && ` · ${new Date(ai.savedAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`}
                              </span>
                            )}
                          </div>
                          {ai.status === "done" && (
                            <button
                              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 9, color: "#4B5563", padding: "2px 6px" }}
                              onClick={() => setAiState(prev => ({ ...prev, [g.id]: undefined }))}
                            >
                              ✕ fechar
                            </button>
                          )}
                        </div>

                        {/* Conteúdo */}
                        <div style={{ padding: "12px 14px", minHeight: 40 }}>
                          {/* Loading dots */}
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

                          {/* Gráficos gerados pelo agente */}
                          {(ai.charts?.length ?? 0) > 0 && (
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ fontSize: 9, color: "#475569", letterSpacing: 1, marginBottom: 8 }}>
                                📊 VISUALIZAÇÕES GERADAS PELO AGENTE
                              </div>
                              <div style={{
                                display: "grid",
                                gridTemplateColumns: ai.charts.length >= 2 ? "1fr 1fr" : "1fr",
                                gap: 8
                              }}>
                                {ai.charts.map(chart => (
                                  <ChartBlock key={chart.id} input={chart.input} />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Texto análise */}
                          {(ai.status === "streaming" || ai.status === "done") && ai.text && (
                            <>
                              <div style={{ fontSize: 9, color: "#475569", letterSpacing: 1, marginBottom: 8 }}>
                                📝 ANÁLISE ESTRATÉGICA
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
                        </div>
                      </div>
                    )}
                  </div>
                  {/* ── FIM BLOCO IA ── */}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* DEBRIEFING DE SEGURANÇA */}
      {rank.some(g => g.desq) && (
        <Card b={C.redL + "44"}>
          <Hdr2 col={C.redL} ch="💬 DEBRIEFING — REQUISITOS NÃO ATENDIDOS" />
          <div style={{ padding: 14 }}>
            {rank.filter(g => g.desq).map(g => (
              <div key={g.id} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.txt, marginBottom: 6 }}>
                  ❌ {g.nome} — {g.missing.length} requisito(s) aplicável(is) não considerado(s):
                </div>
                <table style={{ ...S.tbl, marginBottom: 4 }}>
                  <thead><tr>
                    <TH ch="ATIVIDADE" w={180} />
                    <TH ch="CATEGORIA" w={130} />
                    <TH ch="DESCRIÇÃO DO REQUISITO" />
                  </tr></thead>
                  <tbody>
                    {g.missing.map((m, mi) => (
                      <tr key={mi} style={{ borderBottom: `1px solid ${C.border}`, background: (g.desq ? C.redL : C.yellow) + "08" }}>
                        <td style={{ padding: "5px 9px", fontSize: 10, color: C.txt2 }}>{m.atividade}</td>
                        <td style={{ padding: "5px 9px" }}><Tag text={m.categoria} col={C.redL} /></td>
                        <td style={{ padding: "5px 9px", fontSize: 10, color: C.txt }}>{m.desc || "(sem descrição)"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            <div style={{ marginTop: 6, padding: "10px 14px", borderRadius: 5, background: C.gold + "10", border: `1px solid ${C.gold}33`, color: C.txt, fontSize: 11 }}>
              💡 <strong>"A Liderança que Protege sabe dimensionar o recurso certo para o risco da atividade. Segurança não é custo — é parte da composição de alta performance."</strong>
            </div>
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

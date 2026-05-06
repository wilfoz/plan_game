import { C } from "../constants/colors";
import { S } from "../styles";
import { fmt, fmtI } from "../utils/formatters";
import { DIAS_MES } from "../utils/calculations";
import { ATIVS, MO_CAT, EQ_CAT, EPI_CAT, REQ_CATEGORIAS, REQ_CAT_COLORS } from "../constants/catalogs";
import { useApp } from "../context/AppContext";
import { Card } from "../components/ui/Card";
import { BtnDel } from "../components/ui/Card";
import { Hdr2, Tag, Pill } from "../components/ui/Typography";
import { TH, TD, TotRow } from "../components/ui/Table";
import { NumInp, Sel } from "../components/ui/Inputs";

export default function Composicao() {
  const {
    grupos, gIdx, setGIdx, setScreen,
    aTab, setATab,
    gc, calcA, ESC,
    moAdd, moDel, moUpd,
    eqAdd, eqDel, eqUpd,
    uVb, uKpi, uEq,
    epiCargo, requisitos, toggleReq
  } = useApp();

  const aObj = ATIVS.find(a => a.id === aTab) || ATIVS[0];
  const comp = gc(gIdx, aObj.id);
  const esc = ESC[aObj.eKey] || 0;
  const calc = calcA(comp, esc, aObj.id);
  const colGrp = aObj.grp === "M" ? C.blueL : C.greenL;
  const totalGeral = ATIVS.reduce((s, a) => s + calcA(gc(gIdx, a.id), ESC[a.eKey] || 0, a.id).total, 0);
  const reqsAtiv = requisitos.filter(r => r.aId === aObj.id);

  const moUsados = new Set(comp.moRows.map(r => r.catId));
  const moOpts = MO_CAT.filter(r => !moUsados.has(r.id)).map(r => ({ id: r.id, label: r.cargo }));
  const eqOpts = EQ_CAT.map(r => ({ id: r.id, label: r.nome }));

  return (
    <div style={S.pg}>
      {/* seletor grupo */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 9, color: C.txt3, letterSpacing: 2 }}>GRUPO:</span>
        {grupos.map((g, i) => (
          <Pill key={g.id} on={gIdx === i} onClick={() => setGIdx(i)} ch={g.nome} />
        ))}
        <button style={{ ...S.btnP, marginLeft: "auto", fontSize: 10 }} onClick={() => setScreen("cronograma")}>
          CRONOGRAMA →
        </button>
      </div>

      {/* barra resumo */}
      <div style={{
        background: C.surf2, border: `1px solid ${C.border2}`, borderRadius: 6,
        padding: "9px 14px", marginBottom: 10, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap"
      }}>
        <div style={{ fontSize: 9, color: C.txt3, letterSpacing: 2 }}>CUSTO TOTAL (TODAS ATIVIDADES):</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.goldL }}>{fmt(totalGeral)}</div>
        <div style={{ marginLeft: "auto", fontSize: 10, color: C.txt2 }}>
          {ATIVS.filter(a => gc(gIdx, a.id).kpi > 0).length}/{ATIVS.length} atividades com KPI definido
        </div>
      </div>

      {/* tabs atividades */}
      <div style={{ marginBottom: 10 }}>
        {[["M", C.blueL, "🏗️ MONTAGEM"], ["L", C.greenL, "🔌 LANÇAMENTO"]].map(([grp, col, label]) => (
          <div key={grp} style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 9, color: col, letterSpacing: 3, marginBottom: 4 }}>{label}</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {ATIVS.filter(a => a.grp === grp).map(a => {
                const c = gc(gIdx, a.id);
                const has = c.moRows.length > 0 || c.eqRows.length > 0 || c.kpi > 0;
                const atv = aTab === a.id;
                return (
                  <button key={a.id} onClick={() => setATab(a.id)} style={{
                    padding: "4px 10px", borderRadius: 3, fontSize: 9, fontWeight: 700, letterSpacing: 1, cursor: "pointer",
                    border: `1px solid ${atv ? col : has ? col + "88" : C.border}`,
                    background: atv ? col + "33" : has ? col + "11" : "transparent",
                    color: atv ? col : has ? col : C.txt3
                  }}>
                    {a.desc.split(" ").slice(0, 3).join(" ")}{has ? " ✓" : ""}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* conteúdo 2 colunas */}
      <div style={S.g2}>
        {/* ESQUERDA */}
        <div>
          {/* cabeçalho atividade */}
          <div style={{
            background: colGrp + "18", border: `1px solid ${colGrp}33`, borderRadius: 6,
            padding: "10px 14px", marginBottom: 10,
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: colGrp }}>{aObj.desc}</div>
              <div style={{ fontSize: 10, color: C.txt2, marginTop: 2 }}>
                Escopo: <strong style={{ color: C.goldL }}>{fmtI(esc)} {aObj.und.toLowerCase()}</strong>
                &nbsp;·&nbsp;<Tag text={aObj.und} col={colGrp} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 8, color: C.txt3, letterSpacing: 2, marginBottom: 3 }}>KPI (un/mês/eq)</div>
                <NumInp v={comp.kpi || ""} onChange={e => uKpi(gIdx, aObj.id, e.target.value)} w={80} />
              </div>
              <div>
                <div style={{ fontSize: 8, color: C.txt3, letterSpacing: 2, marginBottom: 3 }}>EQUIPES</div>
                <NumInp v={comp.equipes} onChange={e => uEq(gIdx, aObj.id, e.target.value)} w={60} />
              </div>
              <div style={{ textAlign: "center", minWidth: 60 }}>
                <div style={{ fontSize: 8, color: C.txt3, letterSpacing: 1, marginBottom: 2 }}>DURAÇÃO</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: calc.dur > 0 ? C.goldL : C.txt3 }}>
                  {calc.dur > 0 ? calc.dur + "m" : "—"}
                </div>
              </div>
            </div>
          </div>

          {/* MÃO DE OBRA */}
          <Card>
            <Hdr2 col={C.blueL} ch={`👷 MÃO DE OBRA — ${aObj.desc.slice(0, 28)}`} />
            <table style={S.tbl}>
              <thead><tr>
                <TH ch="CARGO" w={180} />
                <TH ch="QTD" right w={50} />
                <TH ch="SALÁRIO/MÊS" right />
                <TH ch="ALIMENT./MÊS" right />
                <TH ch="ALOJAM./MÊS" right />
                <TH ch="SAÚDE/MÊS" right />
                <TH ch="FOLGAS/MÊS" right />
                <TH ch="TOTAL/MÊS" right accent />
                <TH ch="" w={30} />
              </tr></thead>
              <tbody>
                {comp.moRows.length === 0 && (
                  <tr><td colSpan={9} style={{ padding: "12px 9px", color: C.txt3, fontSize: 11, fontStyle: "italic", textAlign: "center" }}>
                    Nenhum cargo adicionado. Use o seletor abaixo para adicionar.
                  </td></tr>
                )}
                {comp.moRows.map((r, i) => {
                  const tot = (r.sal + r.alim + r.aloj + r.saude + r.folgas) * r.qtd;
                  return (
                    <tr key={r._id} style={S.trOn(C.blueL)}>
                      <td style={{ padding: "4px 9px", fontSize: 11, fontWeight: 600, color: C.txt }}>{r.cargo}</td>
                      <td style={{ padding: "3px 7px", textAlign: "right" }}>
                        <NumInp v={r.qtd} onChange={e => moUpd(gIdx, aObj.id, r._id, "qtd", e.target.value)} w={46} />
                      </td>
                      <TD ch={fmt(r.sal)} right />
                      <td style={{ padding: "3px 7px", textAlign: "right" }}>
                        <NumInp v={r.alim} onChange={e => moUpd(gIdx, aObj.id, r._id, "alim", e.target.value)} w={68} />
                      </td>
                      <td style={{ padding: "3px 7px", textAlign: "right" }}>
                        <NumInp v={r.aloj} onChange={e => moUpd(gIdx, aObj.id, r._id, "aloj", e.target.value)} w={68} />
                      </td>
                      <td style={{ padding: "3px 7px", textAlign: "right" }}>
                        <NumInp v={r.saude} onChange={e => moUpd(gIdx, aObj.id, r._id, "saude", e.target.value)} w={68} />
                      </td>
                      <td style={{ padding: "3px 7px", textAlign: "right" }}>
                        <NumInp v={r.folgas} onChange={e => moUpd(gIdx, aObj.id, r._id, "folgas", e.target.value)} w={68} />
                      </td>
                      <td style={{ padding: "4px 9px", textAlign: "right", fontWeight: 700, color: C.goldL, fontSize: 11 }}>
                        {fmt(tot)}
                      </td>
                      <td style={{ padding: "3px 6px", textAlign: "center" }}>
                        <BtnDel onClick={() => moDel(gIdx, aObj.id, r._id)} />
                      </td>
                    </tr>
                  );
                })}
                {comp.moRows.length > 0 && (
                  <tr style={S.totRow}>
                    <td style={{ padding: "5px 9px", fontSize: 11, fontWeight: 700, color: C.goldL }}>
                      TOTAL MO — {calc.moQtd} profissionais
                    </td>
                    <td colSpan={5} />
                    <td style={{ padding: "5px 9px", textAlign: "right", fontSize: 10, color: C.txt2 }}>/mês</td>
                    <td style={{ padding: "5px 9px", textAlign: "right", fontSize: 12, fontWeight: 700, color: C.goldL }}>
                      {fmt(calc.custoMo)}
                    </td>
                    <td />
                  </tr>
                )}
              </tbody>
            </table>
            <div style={{ padding: "8px 12px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <Sel
                  v=""
                  onChange={e => { if (e.target.value) moAdd(gIdx, aObj.id, e.target.value); }}
                  opts={moOpts}
                  placeholder={moOpts.length === 0 ? "✅ Todos os cargos adicionados" : "+ Selecione um cargo para adicionar..."}
                />
              </div>
              {moOpts.length > 0 && (
                <span style={{ fontSize: 10, color: C.txt3, whiteSpace: "nowrap" }}>
                  {MO_CAT.length - moOpts.length}/{MO_CAT.length} cargos
                </span>
              )}
            </div>
          </Card>

          {/* EQUIPAMENTOS */}
          <Card>
            <Hdr2 col={C.yellow} ch={`🏗️ EQUIPAMENTOS — ${aObj.desc.slice(0, 28)}`} />
            <table style={S.tbl}>
              <thead><tr>
                <TH ch="EQUIPAMENTO / FERRAMENTA" w={240} />
                <TH ch="QTD" right w={50} />
                <TH ch="LOCAÇÃO/MÊS" right />
                <TH ch="TOTAL/MÊS" right accent />
                <TH ch="" w={30} />
              </tr></thead>
              <tbody>
                {comp.eqRows.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: "12px 9px", color: C.txt3, fontSize: 11, fontStyle: "italic", textAlign: "center" }}>
                    Nenhum equipamento adicionado.
                  </td></tr>
                )}
                {comp.eqRows.map((r) => (
                  <tr key={r._id} style={S.trOn(C.yellow)}>
                    <td style={{ padding: "4px 9px", fontSize: 11, fontWeight: 600, color: C.txt }}>{r.nome}</td>
                    <td style={{ padding: "3px 7px", textAlign: "right" }}>
                      <NumInp v={r.qtd} onChange={e => eqUpd(gIdx, aObj.id, r._id, "qtd", e.target.value)} w={46} />
                    </td>
                    <TD ch={fmt(r.loc)} right />
                    <td style={{ padding: "4px 9px", textAlign: "right", fontWeight: 700, color: C.goldL, fontSize: 11 }}>
                      {fmt(r.loc * r.qtd)}
                    </td>
                    <td style={{ padding: "3px 6px", textAlign: "center" }}>
                      <BtnDel onClick={() => eqDel(gIdx, aObj.id, r._id)} />
                    </td>
                  </tr>
                ))}
                {comp.eqRows.length > 0 && (
                  <tr style={S.totRow}>
                    <td colSpan={2} style={{ padding: "5px 9px", fontSize: 11, fontWeight: 700, color: C.goldL }}>
                      TOTAL EQUIPAMENTOS — {comp.eqRows.length} itens
                    </td>
                    <td style={{ padding: "5px 9px", textAlign: "right", fontSize: 10, color: C.txt2 }}>/mês</td>
                    <td style={{ padding: "5px 9px", textAlign: "right", fontSize: 12, fontWeight: 700, color: C.goldL }}>
                      {fmt(calc.custoEq)}
                    </td>
                    <td />
                  </tr>
                )}
              </tbody>
            </table>
            <div style={{ padding: "8px 12px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <Sel
                  v=""
                  onChange={e => { if (e.target.value) eqAdd(gIdx, aObj.id, e.target.value); }}
                  opts={eqOpts}
                  placeholder="+ Selecione um equipamento para adicionar..."
                />
              </div>
            </div>
          </Card>

          {/* REQUISITOS DE SEGURANÇA */}
          <Card>
            <Hdr2 col={C.greenL} ch={`🛡️ Requisitos de Segurança — ${aObj.desc.slice(0, 28)}`} />
            {reqsAtiv.length === 0 ? (
              <div style={{ padding: 14, fontSize: 11, color: C.txt3, fontStyle: "italic", textAlign: "center" }}>
                Nenhum requisito cadastrado pelo facilitador para esta atividade.
              </div>
            ) : (
              <div style={{ padding: "10px 12px" }}>
                <div style={{ fontSize: 9, color: C.txt3, letterSpacing: 2, marginBottom: 8 }}>
                  SELECIONE OS REQUISITOS APLICÁVEIS (⏱️ tempo impacta duração · 🎯 score impacta segurança)
                </div>
                {REQ_CATEGORIAS.filter(cat => reqsAtiv.some(r => r.categoria === cat)).map(cat => (
                  <div key={cat} style={{ marginBottom: 8 }}>
                    <div style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: 2, color: REQ_CAT_COLORS[cat],
                      padding: "3px 0", borderBottom: `1px solid ${REQ_CAT_COLORS[cat]}33`, marginBottom: 4
                    }}>{cat.toUpperCase()}</div>
                    {reqsAtiv.filter(r => r.categoria === cat).map(req => {
                      const on = (comp.reqIds || []).includes(req._id);
                      return (
                        <div key={req._id}
                          onClick={() => toggleReq(gIdx, aObj.id, req._id)}
                          style={{
                            display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", marginBottom: 3,
                            borderRadius: 4, cursor: "pointer", fontSize: 10,
                            background: on ? REQ_CAT_COLORS[cat] + "12" : C.surf2,
                            border: `1px solid ${on ? REQ_CAT_COLORS[cat] + "55" : C.border}`,
                            transition: "all 0.15s"
                          }}>
                          <span style={{ fontSize: 13, flexShrink: 0 }}>{on ? "✅" : "⬜"}</span>
                          <span style={{ color: on ? C.txt : C.txt2, flex: 1 }}>{req.desc || "(sem descrição)"}</span>
                          <span style={{ background: C.blueL + "18", color: C.blueL, padding: "1px 6px", borderRadius: 3, fontSize: 9, fontWeight: 700, whiteSpace: "nowrap" }}>
                            ⏱️ {req.tempo}min
                          </span>
                          <span style={{ background: C.gold + "18", color: C.gold, padding: "1px 6px", borderRadius: 3, fontSize: 9, fontWeight: 700, whiteSpace: "nowrap" }}>
                            🎯 {req.score}pts
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
                {(comp.reqIds || []).length > 0 && (
                  <div style={{
                    marginTop: 6, padding: "8px 10px", borderRadius: 4,
                    background: C.greenL + "0A", border: `1px solid ${C.greenL}22`,
                    display: "flex", gap: 14, fontSize: 10, flexWrap: "wrap"
                  }}>
                    <span style={{ color: C.txt2 }}>✅ Selecionados: <strong style={{ color: C.greenL }}>
                      {(comp.reqIds || []).length}/{reqsAtiv.length}
                    </strong></span>
                    <span style={{ color: C.txt2 }}>⏱️ Tempo por dia: <strong style={{ color: C.blueL }}>
                      {reqsAtiv.filter(r => (comp.reqIds || []).includes(r._id)).reduce((s, r) => s + (r.tempo || 0), 0)} min/dia
                    </strong></span>
                    <span style={{ color: C.txt2 }}>🎯 Score: <strong style={{ color: C.gold }}>
                      {calc.scoreOk}/{calc.scoreMax} pts
                    </strong></span>
                    {calc.diasReq > 0 && (
                      <span style={{ color: C.txt2 }}>📅 Impacto duração: <strong style={{ color: C.yellow }}>
                        +{calc.diasReq} dias ({(calc.diasReq / DIAS_MES).toFixed(2)} meses)
                      </strong></span>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* VERBAS */}
          <Card>
            <Hdr2 col={C.txt2} ch="💼 VERBAS DIVERSAS" />
            <table style={S.tbl}>
              <thead><tr><TH ch="DESCRIÇÃO" /><TH ch="VALOR (R$)" right accent /></tr></thead>
              <tbody>
                {[["Ferramentas","ferramentas"],["Materiais","materiais"]].map(([l, k]) => (
                  <tr key={k} style={{ borderBottom: `1px solid ${C.border}`, background: comp.verbas[k] > 0 ? C.gold + "0D" : "transparent" }}>
                    <TD ch={l} />
                    <td style={{ padding: "3px 9px", textAlign: "right" }}>
                      <NumInp v={comp.verbas[k]} onChange={e => uVb(gIdx, aObj.id, k, e.target.value)} w={110} />
                    </td>
                  </tr>
                ))}
                <TotRow label="TOTAL VERBAS" value={calc.custoVb} cols={1} />
              </tbody>
            </table>
          </Card>
        </div>

        {/* DIREITA — RESUMO */}
        <div style={{ position: "sticky", top: 60, alignSelf: "flex-start" }}>
          <Card>
            <Hdr2 ch={`📊 RESUMO — ${aObj.desc.slice(0, 26)}`} />
            <div style={{ padding: 14 }}>
              <table style={{ ...S.tbl, marginBottom: 14 }}>
                <tbody>
                  <tr style={{ borderBottom: `2px solid ${C.border2}`, background: C.surf2 }}>
                    <td style={{ padding: "8px 9px", fontSize: 12, fontWeight: 700, color: C.goldL }}>💰 Custo desta Atividade</td>
                    <td style={{ padding: "8px 9px", textAlign: "right", fontSize: 14, fontWeight: 700, color: C.goldL }}>{fmt(calc.total)}</td>
                  </tr>
                  {[["└ 👷 MO /mês", calc.custoMo, C.blueL], ["└ 🏗️ Equip. /mês", calc.custoEq, C.yellow], ["└ 💼 Verbas", calc.custoVb, C.txt2]].map(([l, v, col]) => (
                    <tr key={l} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: "5px 9px 5px 18px", fontSize: 11, color: C.txt2 }}>{l}</td>
                      <td style={{ padding: "5px 9px", textAlign: "right", fontSize: 12, fontWeight: 700, color: col }}>{fmt(v)}</td>
                    </tr>
                  ))}
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "6px 9px", fontSize: 11, color: C.txt2 }}>⏱️ Duração estimada</td>
                    <td style={{ padding: "6px 9px", textAlign: "right", fontSize: 12, fontWeight: 700, color: calc.dur > 0 ? C.greenL : C.txt3 }}>
                      {calc.dur > 0 ? `${calc.durTotalDias} dias (${calc.dur} meses)` : "KPI não definido"}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "6px 9px", fontSize: 11, color: C.txt2 }}>👷 Profissionais / Equip.</td>
                    <td style={{ padding: "6px 9px", textAlign: "right", fontSize: 11, color: C.txt }}>
                      {calc.moQtd} / {comp.eqRows.length}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "6px 9px", fontSize: 11, color: C.txt2 }}>📋 Composições preenchidas</td>
                    <td style={{ padding: "6px 9px", textAlign: "right", fontSize: 11, color: C.goldL }}>
                      {ATIVS.filter(a => gc(gIdx, a.id).moRows.length > 0 || gc(gIdx, a.id).kpi > 0).length}/{ATIVS.length}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* EPIs requeridos */}
              {comp.moRows.length > 0 && (
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 9, color: C.txt3, letterSpacing: 3, marginBottom: 6 }}>EPIS REQUERIDOS</div>
                  {comp.moRows.map(mo => {
                    const epis = Object.keys(epiCargo[mo.catId] || {}).filter(k => (epiCargo[mo.catId] || {})[k]);
                    if (!epis.length) return (
                      <div key={mo._id} style={{ fontSize: 10, color: C.txt3, padding: "2px 0" }}>
                        {mo.cargo} — <span style={{ color: C.yellow }}>sem EPIs configurados</span>
                      </div>
                    );
                    return (
                      <div key={mo._id} style={{ marginBottom: 6 }}>
                        <div style={{ fontSize: 10, color: C.blueL, fontWeight: 700 }}>{mo.cargo} ×{mo.qtd}</div>
                        {epis.map(epiId => {
                          const epi = EPI_CAT.find(e => e.id === epiId);
                          return epi ? (
                            <div key={epiId} style={{ fontSize: 9, color: C.txt2, padding: "1px 0 1px 10px", borderLeft: `2px solid ${C.greenL}44` }}>
                              🦺 {epi.desc}
                            </div>
                          ) : null;
                        })}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Requisitos de Segurança no resumo */}
              {reqsAtiv.length > 0 && (
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 9, color: C.txt3, letterSpacing: 3, marginBottom: 6 }}>🛡️ REQUISITOS DE SEGURANÇA</div>
                  {reqsAtiv.map(req => {
                    const on = (comp.reqIds || []).includes(req._id);
                    return (
                      <div key={req._id} style={{
                        fontSize: 9, color: on ? C.txt : C.txt3, padding: "2px 0 2px 10px",
                        borderLeft: `2px solid ${on ? REQ_CAT_COLORS[req.categoria] + "88" : C.border}`,
                        display: "flex", gap: 4, alignItems: "center"
                      }}>
                        <span>{on ? "✅" : "⬜"}</span>
                        <span style={{ flex: 1 }}>{req.desc || req.categoria}</span>
                        <span style={{ color: C.blueL, fontSize: 8 }}>{req.tempo}min</span>
                      </div>
                    );
                  })}
                  <div style={{ marginTop: 4, fontSize: 9, color: C.greenL, fontWeight: 700 }}>
                    Score: {calc.scoreOk}/{calc.scoreMax} pts ({calc.scoreMax > 0 ? Math.round((calc.scoreOk / calc.scoreMax) * 100) : 100}%)
                  </div>
                </div>
              )}

              {/* total geral */}
              <div style={{ padding: "10px 12px", borderRadius: 5, background: C.surf3, border: `1px solid ${C.border2}` }}>
                <div style={{ fontSize: 9, color: C.txt3, letterSpacing: 2, marginBottom: 3 }}>CUSTO TOTAL — TODAS ATIVIDADES</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: C.goldL }}>{fmt(totalGeral)}</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

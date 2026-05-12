import { C } from "../constants/colors";
import { S } from "../styles";
import { fmt, fmtI } from "../utils/formatters";
import { ATIVS, MO_CAT, EQ_CAT, REQ_CAT_COLORS } from "../constants/catalogs";
import { useApp } from "../context/AppContext";
import { Card } from "../components/ui/Card";
import { BtnDel } from "../components/ui/Card";
import { Hdr2, Tag, Pill } from "../components/ui/Typography";
import { TH } from "../components/ui/Table";
import { LocalNumInp, Sel } from "../components/ui/Inputs";
import { calcEficiencia, calcCoerencia } from "../utils/calculations";

const fmt2 = n => n != null ? n.toFixed(2) : "—";



export default function Composicao() {
  const {
    grupos, gIdx, setGIdx, setScreen, role,
    aTab, setATab,
    gc, calcA, volumesPrev, comentariosAtiv,
    moAdd, moDel, moUpd,
    eqAdd, eqDel, eqUpd,
    uKpi, uEq, uMesInicia,
    requisitos, toggleReq,
    equipesBase, kpisBase, mesIniciaBase,
    travaEquipes,
    lt,
  } = useApp();

  const aObj = ATIVS.find(a => a.id === aTab) || ATIVS[0];
  const comp = gc(gIdx, aObj.id);
  const esc = volumesPrev[aObj.id] || 0;
  const compEff = travaEquipes ? { ...comp, equipes: 1 } : comp;
  const calc = calcA(compEff, esc);
  const colGrp = aObj.grp === "M" ? C.blueL : C.greenL;
  const totalGeral = ATIVS.reduce((s, a) => {
    const raw = gc(gIdx, a.id);
    const hasRes = raw.moRows.length > 0 || raw.eqRows.length > 0 || raw.kpi > 0;
    const kpiEff = hasRes ? (raw.kpi > 0 ? raw.kpi : kpisBase[a.id] || 0) : 0;
    const eqEff = travaEquipes ? 1 : (raw.equipes || 1);
    const c = calcA({ ...raw, kpi: kpiEff, equipes: eqEff }, volumesPrev[a.id] || 0);
    return s + c.total * (c.durMeses > 0 ? c.durMeses * c.fatorMobilizacao : 0);
  }, 0);
  const reqsAtiv = requisitos.filter(r => r.aId === aObj.id);

  const moUsados = new Set(comp.moRows.map(r => r.catId));
  const moOpts = MO_CAT.filter(r => !moUsados.has(r.id)).map(r => ({ id: r.id, label: r.cargo }));
  const eqOpts = EQ_CAT.map(r => ({ id: r.id, label: r.nome }));

  const addedReqIds = (comp.reqIds || []).map(String);
  const addedReqs = reqsAtiv.filter(r => addedReqIds.includes(String(r._id)));
  const availReqOpts = reqsAtiv
    .filter(r => !addedReqIds.includes(String(r._id)))
    .map(r => ({ id: r._id, label: `[${r.categoria}] ${r.desc || "(sem descrição)"}` }));

  // Eficiência desta atividade vs equipe base
  const baseComp = equipesBase?.[aObj.id] ?? null;
  const kpiBase = kpisBase?.[aObj.id] ?? 0;
  const ef = calcEficiencia(comp, baseComp, kpiBase, aObj.id);
  const subAlocacaoMap = Object.fromEntries((ef.subAlocacao || []).map(s => [s.cargo, s]));
  const coer = calcCoerencia(comp.moRows, comp.eqRows);

  const kpi = comp.kpi || 0;

  return (
    <div style={S.pg}>
      {/* barra de grupo ativo */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 9, color: C.txt3, letterSpacing: 2 }}>GRUPO:</span>
        {role === "F" ? (
          grupos.map((g, i) => (
            <Pill key={g.id} on={gIdx === i} onClick={() => setGIdx(i)} ch={g.nome} />
          ))
        ) : (
          <span style={{ fontSize: 12, fontWeight: 700, color: C.goldL }}>{grupos[gIdx]?.nome}</span>
        )}
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
                const obs = comentariosAtiv[a.id];
                return (
                  <button key={a.id} onClick={() => setATab(a.id)} style={{
                    padding: "4px 10px", borderRadius: 3, fontSize: 9, fontWeight: 700, letterSpacing: 1, cursor: "pointer",
                    border: `1px solid ${atv ? col : has ? col + "88" : C.border}`,
                    background: atv ? col + "33" : has ? col + "11" : "transparent",
                    color: atv ? col : has ? col : C.txt3,
                    textAlign: "left"
                  }}>
                    <div>{a.desc.split(" ").slice(0, 3).join(" ")}{has ? " ✓" : ""}</div>
                    {obs && (
                      <div style={{ fontSize: 8, fontWeight: 400, color: atv ? col : C.txt3, marginTop: 2, fontStyle: "italic" }}>
                        {obs}
                      </div>
                    )}
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
                Volume Previsto: <strong style={{ color: C.goldL }}>{fmtI(esc)} {aObj.und.toLowerCase()}</strong>
                &nbsp;·&nbsp;<Tag text={aObj.und} col={colGrp} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 8, color: C.txt3, letterSpacing: 2, marginBottom: 3 }}>KPI (un/dia/eq)</div>
                <LocalNumInp v={comp.kpi || ""} onSave={v => uKpi(gIdx, aObj.id, v)} w={80} />
              </div>
              <div>
                <div style={{ fontSize: 8, color: C.txt3, letterSpacing: 2, marginBottom: 3 }}>
                  EQUIPES{travaEquipes && <span style={{ color: C.txt3, fontWeight: 400 }}> 🔒</span>}
                </div>
                {travaEquipes ? (
                  <div style={{
                    width: 60, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                    background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 4,
                    fontSize: 13, fontWeight: 700, color: C.txt3,
                  }}>
                    1
                  </div>
                ) : (
                  <LocalNumInp v={comp.equipes} onSave={v => uEq(gIdx, aObj.id, v)} w={60} />
                )}
              </div>
              <div>
                <div style={{ fontSize: 8, color: C.txt3, letterSpacing: 2, marginBottom: 3 }}>
                  MÊS INI.{mesIniciaBase[aObj.id] > 0 && comp.mesInicia === 0 && (
                    <span style={{ color: C.txt3, fontWeight: 400 }}> (base: {mesIniciaBase[aObj.id]})</span>
                  )}
                </div>
                <LocalNumInp v={comp.mesInicia || ""} onSave={v => uMesInicia(gIdx, aObj.id, v)} w={65} />
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
                <TH ch="CARGO" w={170} />
                <TH ch="QTD" right w={50} />
                <TH ch="HRS/DIA" right w={70} />
                <TH ch="HRS TOT." right w={70} />
                <TH ch={`COEF (Hh/${aObj.und.toLowerCase()})`} right w={110} accent />
                <TH ch="SALÁRIO/MÊS" right />
                <TH ch="TOTAL/MÊS" right accent />
                <TH ch="" w={30} />
              </tr></thead>
              <tbody>
                {comp.moRows.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: "12px 9px", color: C.txt3, fontSize: 11, fontStyle: "italic", textAlign: "center" }}>
                    Nenhum cargo adicionado. Use o seletor abaixo para adicionar.
                  </td></tr>
                )}
                {comp.moRows.map((r) => {
                  const ht = r.qtd * (r.horasDia ?? 8.5);
                  const cf = kpi > 0 ? ht / kpi : null;
                  return (
                    <tr key={r._id} style={S.trOn(C.blueL)}>
                      <td style={{ padding: "4px 9px", fontSize: 11, fontWeight: 600, color: C.txt }}>
                        {r.cargo}
                        {role !== "G" && subAlocacaoMap[r.cargo] && (
                          <span style={{ fontSize: 8, fontWeight: 700, color: C.yellow, background: C.yellow + "18", border: `1px solid ${C.yellow}44`, borderRadius: 2, padding: "0 4px", marginLeft: 6 }}>⚠️ SUB</span>
                        )}
                      </td>
                      <td style={{ padding: "3px 7px", textAlign: "right" }}>
                        <LocalNumInp v={r.qtd} onSave={v => moUpd(gIdx, aObj.id, r._id, "qtd", v)} w={50} />
                      </td>
                      <td style={{ padding: "3px 7px", textAlign: "right" }}>
                        <LocalNumInp v={r.horasDia ?? 8.5} onSave={v => moUpd(gIdx, aObj.id, r._id, "horasDia", v)} w={55} />
                      </td>
                      <td style={{ padding: "4px 9px", textAlign: "right", fontSize: 10, color: C.txt2 }}>
                        {ht.toFixed(1)}
                      </td>
                      <td style={{ padding: "4px 9px", textAlign: "right", fontWeight: 700, color: C.goldL, fontSize: 11 }}>
                        {cf != null ? fmt2(cf) : <span style={{ color: C.txt3 }}>—</span>}
                      </td>
                      <td style={{ padding: "3px 7px", textAlign: "right" }}>
                        <LocalNumInp v={r.sal} onSave={v => moUpd(gIdx, aObj.id, r._id, "sal", v)} w={100} />
                      </td>
                      <td style={{ padding: "4px 9px", textAlign: "right", fontWeight: 700, color: C.goldL, fontSize: 11 }}>
                        {fmt(r.sal * r.qtd)}
                      </td>
                      <td style={{ padding: "3px 6px", textAlign: "center" }}>
                        <BtnDel onClick={() => moDel(gIdx, aObj.id, r._id)} />
                      </td>
                    </tr>
                  );
                })}
                {comp.moRows.length > 0 && (
                  <tr style={S.totRow}>
                    <td colSpan={4} style={{ padding: "5px 9px", fontSize: 11, fontWeight: 700, color: C.goldL }}>
                      TOTAL MO — {calc.moQtd} profissionais
                    </td>
                    <td style={{ padding: "5px 9px", textAlign: "right", fontSize: 11, fontWeight: 700, color: C.goldL }}>
                      {calc.coefMo != null ? `${fmt2(calc.coefMo)} Hh` : "—"}
                    </td>
                    <td />
                    <td style={{ padding: "5px 9px", textAlign: "right", fontSize: 12, fontWeight: 700, color: C.goldL }}>
                      {fmt(calc.custoMo)}
                    </td>
                    <td />
                  </tr>
                )}
              </tbody>
            </table>
            {(ef.obrigatorioAusente || []).filter(o => o.tipo === "mo").length > 0 && (
              role === "G" ? (
                <div style={{ padding: "10px 14px", background: C.redL + "15", borderTop: `2px solid ${C.redL}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.redL, letterSpacing: 1 }}>
                    ⚠️ RECURSO OBRIGATÓRIO NÃO INCLUÍDO NA EQUIPE
                  </div>
                </div>
              ) : (
                <div style={{ padding: "6px 12px", background: C.redL + "0D", borderTop: `1px solid ${C.redL}33` }}>
                  {(ef.obrigatorioAusente || []).filter(o => o.tipo === "mo").map(o => (
                    <div key={o.label} style={{ fontSize: 10, color: C.redL, padding: "2px 0" }}>
                      ❌ {o.label} — cargo obrigatório não adicionado
                    </div>
                  ))}
                </div>
              )
            )}
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
                <TH ch="EQUIPAMENTO / FERRAMENTA" w={190} />
                <TH ch="QTD" right w={50} />
                <TH ch="HRS/DIA" right w={70} />
                <TH ch="HRS TOT." right w={70} />
                <TH ch={`COEF (Ch/${aObj.und.toLowerCase()})`} right w={110} accent />
                <TH ch="LOCAÇÃO/MÊS" right />
                <TH ch="TOTAL/MÊS" right accent />
                <TH ch="" w={30} />
              </tr></thead>
              <tbody>
                {comp.eqRows.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: "12px 9px", color: C.txt3, fontSize: 11, fontStyle: "italic", textAlign: "center" }}>
                    Nenhum equipamento adicionado.
                  </td></tr>
                )}
                {comp.eqRows.map((r) => {
                  const hrs = r.horasDia ?? 8.5;
                  const ht = r.qtd * hrs;
                  const cf = kpi > 0 ? ht / kpi : null;
                  return (
                    <tr key={r._id} style={S.trOn(C.yellow)}>
                      <td style={{ padding: "4px 9px", fontSize: 11, fontWeight: 600, color: C.txt }}>{r.nome}</td>
                      <td style={{ padding: "3px 7px", textAlign: "right" }}>
                        <LocalNumInp v={r.qtd} onSave={v => eqUpd(gIdx, aObj.id, r._id, "qtd", v)} w={50} />
                      </td>
                      <td style={{ padding: "3px 7px", textAlign: "right" }}>
                        <LocalNumInp v={hrs} onSave={v => eqUpd(gIdx, aObj.id, r._id, "horasDia", v)} w={55} />
                      </td>
                      <td style={{ padding: "4px 9px", textAlign: "right", fontSize: 10, color: C.txt2 }}>
                        {ht.toFixed(1)}
                      </td>
                      <td style={{ padding: "4px 9px", textAlign: "right", fontWeight: 700, color: C.goldL, fontSize: 11 }}>
                        {cf != null ? fmt2(cf) : <span style={{ color: C.txt3 }}>—</span>}
                      </td>
                      <td style={{ padding: "3px 7px", textAlign: "right" }}>
                        <LocalNumInp v={r.loc} onSave={v => eqUpd(gIdx, aObj.id, r._id, "loc", v)} w={100} />
                      </td>
                      <td style={{ padding: "4px 9px", textAlign: "right", fontWeight: 700, color: C.goldL, fontSize: 11 }}>
                        {fmt(r.loc * r.qtd)}
                      </td>
                      <td style={{ padding: "3px 6px", textAlign: "center" }}>
                        <BtnDel onClick={() => eqDel(gIdx, aObj.id, r._id)} />
                      </td>
                    </tr>
                  );
                })}
                {comp.eqRows.length > 0 && (
                  <tr style={S.totRow}>
                    <td colSpan={4} style={{ padding: "5px 9px", fontSize: 11, fontWeight: 700, color: C.goldL }}>
                      TOTAL EQUIPAMENTOS — {comp.eqRows.length} itens
                    </td>
                    <td style={{ padding: "5px 9px", textAlign: "right", fontSize: 11, fontWeight: 700, color: C.goldL }}>
                      {calc.coefEq != null ? `${fmt2(calc.coefEq)} Ch` : "—"}
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
            {(ef.obrigatorioAusente || []).filter(o => o.tipo === "eq").length > 0 && (
              role === "G" ? (
                <div style={{ padding: "10px 14px", background: C.redL + "15", borderTop: `2px solid ${C.redL}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.redL, letterSpacing: 1 }}>
                    ⚠️ RECURSO OBRIGATÓRIO NÃO INCLUÍDO NA EQUIPE
                  </div>
                </div>
              ) : (
                <div style={{ padding: "6px 12px", background: C.redL + "0D", borderTop: `1px solid ${C.redL}33` }}>
                  {(ef.obrigatorioAusente || []).filter(o => o.tipo === "eq").map(o => (
                    <div key={o.label} style={{ fontSize: 10, color: C.redL, padding: "2px 0" }}>
                      ❌ {o.label} — equipamento obrigatório não adicionado
                    </div>
                  ))}
                </div>
              )
            )}
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
            <Hdr2 col={C.greenL} ch={`🛡️ REQUISITOS DE SEGURANÇA — ${aObj.desc.slice(0, 28)}`} />
            <table style={S.tbl}>
              <thead><tr>
                <TH ch="CATEGORIA" w={140} />
                <TH ch="DESCRIÇÃO" />
                <TH ch="" w={30} />
              </tr></thead>
              <tbody>
                {addedReqs.length === 0 && (
                  <tr><td colSpan={3} style={{ padding: "12px 9px", color: C.txt3, fontSize: 11, fontStyle: "italic", textAlign: "center" }}>
                    {reqsAtiv.length === 0
                      ? "Nenhum requisito cadastrado pelo facilitador para esta atividade."
                      : "Nenhum requisito adicionado. Use o seletor abaixo."}
                  </td></tr>
                )}
                {addedReqs.map((req) => (
                  <tr key={req._id} style={S.trOn(C.greenL)}>
                    <td style={{ padding: "4px 9px" }}>
                      <Tag text={req.categoria} col={REQ_CAT_COLORS[req.categoria]} />
                    </td>
                    <td style={{ padding: "4px 9px", fontSize: 10, color: C.txt }}>
                      {req.desc || "(sem descrição)"}
                    </td>
                    <td style={{ padding: "3px 6px", textAlign: "center" }}>
                      <BtnDel onClick={() => toggleReq(gIdx, aObj.id, req._id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reqsAtiv.length > 0 && (
              <div style={{ padding: "8px 12px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <Sel
                    v=""
                    onChange={e => { if (e.target.value) toggleReq(gIdx, aObj.id, e.target.value); }}
                    opts={availReqOpts}
                    placeholder={availReqOpts.length === 0 ? "✅ Todos os requisitos adicionados" : "+ Selecione um requisito para adicionar..."}
                  />
                </div>
                {addedReqs.length > 0 && (
                  <span style={{ fontSize: 10, color: C.txt3, whiteSpace: "nowrap" }}>
                    {addedReqs.length}/{reqsAtiv.length} requisitos
                  </span>
                )}
              </div>
            )}
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
                  {[["└ 👷 MO /mês", calc.custoMo, C.blueL], ["└ 🏗️ Equip. /mês", calc.custoEq, C.yellow]].map(([l, v, col]) => (
                    <tr key={l} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: "5px 9px 5px 18px", fontSize: 11, color: C.txt2 }}>{l}</td>
                      <td style={{ padding: "5px 9px", textAlign: "right", fontSize: 12, fontWeight: 700, color: col }}>{fmt(v)}</td>
                    </tr>
                  ))}
                  {calc.fatorMobilizacao > 1 && (
                    <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.yellow + "0A" }}>
                      <td style={{ padding: "5px 9px 5px 18px", fontSize: 11, color: C.yellow }}>
                        └ 🚛 Mobilização ({(compEff.equipes || 1) - 1} eq. extra) · +{calc.custoMobilizacaoPct}% s/ custo total
                      </td>
                      <td style={{ padding: "5px 9px", textAlign: "right", fontSize: 11, fontWeight: 700, color: C.yellow }}>
                        +{fmt(calc.custoMobilizacao)}
                      </td>
                    </tr>
                  )}
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

              {/* Alertas de sub-alocação — facilitador */}
              {role !== "G" && ef.temSubAlocacao && (
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 9, color: C.redL, letterSpacing: 3, marginBottom: 6 }}>⚠️ ALERTAS DE COMPOSIÇÃO</div>
                  {(ef.obrigatorioAusente || []).map(o => (
                    <div key={o.label} style={{ fontSize: 9, color: C.redL, padding: "2px 0 2px 8px", borderLeft: `2px solid ${C.redL}`, marginBottom: 3, lineHeight: 1.4 }}>
                      ❌ {o.label} — obrigatório ausente
                    </div>
                  ))}
                  {(ef.subAlocacao || []).map(s => (
                    <div key={s.cargo} style={{ fontSize: 9, color: C.yellow, padding: "2px 0 2px 8px", borderLeft: `2px solid ${C.yellow}`, marginBottom: 3, lineHeight: 1.4 }}>
                      ⚠️ {s.cargo}<br />
                      <span style={{ color: C.txt3 }}>coef {fmt2(s.coefGrupo)} · mín. {fmt2(s.minCoef)} ({s.minVarPct}%)</span>
                    </div>
                  ))}
                </div>
              )}
              {/* Alerta para o grupo — recursos obrigatórios ausentes */}
              {role === "G" && (ef.obrigatorioAusente || []).length > 0 && (
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginBottom: 10 }}>
                  <div style={{ padding: "10px 12px", borderRadius: 4, background: C.redL + "15", border: `2px solid ${C.redL}` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.redL, letterSpacing: 1 }}>
                      ⚠️ RECURSO OBRIGATÓRIO NÃO INCLUÍDO NA EQUIPE
                    </div>
                  </div>
                </div>
              )}
              {/* Alerta de incompatibilidade KPI/Coeficientes/Coerência — todos os papéis */}
              {((ef.varKpiPct != null && ef.varKpiPct > 40) || (ef.subAlocacao || []).length > 0 || coer.issues.length > 0) && (
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginBottom: 10 }}>
                  <div style={{ padding: "10px 12px", borderRadius: 4, background: C.yellow + "10", border: `1px solid ${C.yellow}55` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.yellow, letterSpacing: 2, marginBottom: 6 }}>
                      ⚠️ RECURSOS OU KPI — INCOMPATÍVEIS
                    </div>
                    {role !== "G" && ef.varKpiPct != null && ef.varKpiPct > 40 && (
                      <div style={{ fontSize: 9, color: C.yellow, padding: "3px 0 3px 8px", borderLeft: `2px solid ${C.yellow}`, marginBottom: 4, lineHeight: 1.4 }}>
                        🎯 KPI {ef.kpiGrupo} vs base {ef.kpiBase} un/dia ({ef.varKpiPct > 0 ? "+" : ""}{ef.varKpiPct}%) — divergente do valor de referência
                      </div>
                    )}
                    {role !== "G" && (ef.subAlocacao || []).map(s => (
                      <div key={s.cargo} style={{ fontSize: 9, color: C.redL, padding: "3px 0 3px 8px", borderLeft: `2px solid ${C.redL}`, marginBottom: 4, lineHeight: 1.4 }}>
                        📉 {s.cargo}: coef {s.coefGrupo} Hh abaixo do mínimo {s.minCoef} Hh ({s.minVarPct}%)
                      </div>
                    ))}
                    {coer.issues.map((iss, i) => {
                      let msg = null;
                      switch (iss.tipo) {
                        case "sem_equipamento":
                          msg = `${iss.nOp}× ${iss.cargo} sem ${iss.eqNomes.join(" / ")} — faltam ${iss.eqEsperado} equip.`;
                          break;
                        case "sem_operador":
                          msg = `${iss.nEq}× ${iss.eqNomes[0]}: falta ${iss.cargo} — precisam de ${iss.opEsperado} operador(es)`;
                          break;
                        case "eq_insuficiente":
                          msg = `${iss.nOp}× ${iss.cargo}: apenas ${iss.nEq} ${iss.eqNomes[0]} (precisam de ${iss.eqEsperado})`;
                          break;
                        case "eq_ocioso":
                          msg = `${iss.nEq}× ${iss.eqNomes[0]}: ${iss.nEq - iss.eqEsperado} ocioso(s) p/ ${iss.nOp}× ${iss.cargo}`;
                          break;
                        case "impar_puller_freio":
                          msg = `Ímpar: ${iss.nOp}× PULLER/FREIO — cada CONJUNTO requer 2 operadores`;
                          break;
                        case "transporte_insuficiente":
                          msg = `Transporte: ${iss.precisam} pessoas, ${iss.vagas} vagas — déficit de ${iss.deficit} vaga(s)`;
                          break;
                        default: return null;
                      }
                      return (
                        <div key={i} style={{ fontSize: 9, color: C.yellow, padding: "3px 0 3px 8px", borderLeft: `2px solid ${C.yellow}`, marginBottom: 4, lineHeight: 1.4 }}>
                          ⚙️ {msg}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Informações básicas da LT */}
              {lt.nome && (
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 9, color: C.txt3, letterSpacing: 3, marginBottom: 8 }}>⚡ LINHA DE TRANSMISSÃO</div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      {[
                        ["Nome", lt.nome, C.goldL],
                        ["Tensão", lt.tensao, C.yellow],
                        ["Extensão", lt.ext ? `${lt.ext} km` : "—", C.txt],
                        ["Circuito", lt.circ === "duplo" ? "Duplo" : "Simples", C.txt],
                        ["Cabos por fase", lt.cabFase ?? "—", C.blueL],
                        ["Para-raios", lt.pararaios ?? "—", C.txt2],
                        ["OPGW", lt.opgw ?? "—", C.txt2],
                      ].map(([label, val, col]) => (
                        <tr key={label} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: "4px 4px", fontSize: 10, color: C.txt2 }}>{label}</td>
                          <td style={{ padding: "4px 4px", textAlign: "right", fontSize: 10, fontWeight: 700, color: col }}>{val}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

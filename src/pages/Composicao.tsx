import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useIsMutating } from "@tanstack/react-query";
import { C } from "../constants/colors";
import { S } from "../styles";
import { fmt, fmtI } from "../utils/formatters";
import { REQ_CAT_COLORS, CAT_TRANSLATIONS } from "../constants/catalogs";
import { useApp } from "../context/AppContext";
import { Card } from "../components/ui/Card";
import { BtnDel } from "../components/ui/Card";
import { Hdr2, Tag, Pill } from "../components/ui/Typography";
import { TH } from "../components/ui/Table";
import { LocalNumInp, Sel } from "../components/ui/Inputs";
import { calcEficiencia, calcCoerencia } from "../utils/calculations";

const fmt2 = (n: number | null) => n != null ? n.toFixed(2) : "—";

export default function Composicao() {
  const { t } = useTranslation();
  const isMutating = useIsMutating();
  const {
    grupos, gIdx, setGIdx, setScreen, role,
    aTab, setATab,
    gc, calcA, volumesPrev, comentariosAtiv,
    moAdd, moDel, moUpd,
    eqAdd, eqDel, eqUpd,
    uKpi, uEq, uMesInicia,
    requisitos, toggleReq, addAllReqs,
    equipesBase, kpisBase, mesIniciaBase,
    travaEquipes,
    lt,
    lang,
    moCatalog,
    eqCatalog,
    atividadesCatalog,
    formatCurrency,
    convertCurrency,
    reconvertCurrency,
    translateRequisito,
  } = useApp();

  const currentLang = (lang === "es" ? "es" : "pt") as "pt" | "es";

  // Atalhos de teclado para navegar entre abas de atividades (a1-a7)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA");
      if (isInput && !e.altKey) return;

      const ativIds = ["a1", "a2", "a3", "a4", "a5", "a6", "a7"];
      const currentIndex = ativIds.indexOf(aTab);
      if (currentIndex === -1) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const nextIndex = (currentIndex - 1 + ativIds.length) % ativIds.length;
        setATab(ativIds[nextIndex]);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % ativIds.length;
        setATab(ativIds[nextIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [aTab, setATab]);

  const translateCargo = (cargoName: string) => {
    return moCatalog.find(m => m.cargo.pt === cargoName)?.cargo[currentLang] || cargoName;
  };

  const translateEquip = (eqName: string) => {
    return eqCatalog.find(e => e.nome.pt === eqName)?.nome[currentLang] || eqName;
  };

  const translateCategoria = (catName: string) => {
    return CAT_TRANSLATIONS[catName] || catName;
  };

  const aObj = atividadesCatalog.find(a => a.id === aTab) || atividadesCatalog[0];
  const comp = gc(gIdx, aObj.id);
  const esc = volumesPrev[aObj.id] || 0;
  const compEff = travaEquipes ? { ...comp, equipes: 1 } : comp;
  const calc = calcA(compEff, esc);
  const colGrp = aObj.grp === "M" ? C.blueL : C.greenL;

  const totalGeral = atividadesCatalog.reduce((s, a) => {
    const raw = gc(gIdx, a.id);
    const hasRes = raw.moRows.length > 0 || raw.eqRows.length > 0 || raw.kpi > 0;
    const kpiEff = hasRes ? (raw.kpi > 0 ? raw.kpi : kpisBase[a.id] || 0) : 0;
    const eqEff = travaEquipes ? 1 : (raw.equipes || 1);
    const c = calcA({ ...raw, kpi: kpiEff, equipes: eqEff }, volumesPrev[a.id] || 0);
    return s + c.total * (c.durMeses > 0 ? c.durMeses * c.fatorMobilizacao : 0);
  }, 0);

  const reqsAtiv = requisitos.filter(r => r.aId === aObj.id);
  const moUsados = new Set(comp.moRows.map(r => r.catId));
  
  const moOpts = moCatalog.filter(r => !moUsados.has(r.id)).map(r => ({ 
    id: r.id, 
    label: r.cargo[currentLang] 
  }));

  const eqOpts = eqCatalog.map(r => ({ 
    id: r.id, 
    label: r.nome[currentLang] 
  }));

  const addedReqIds = (comp.reqIds || []).map(String);
  const addedReqs = reqsAtiv.filter(r => addedReqIds.includes(String(r._id)));
  
  const availReqOpts = reqsAtiv
    .filter(r => !addedReqIds.includes(String(r._id)))
    .map(r => {
      const displayDesc = translateRequisito(r.desc);
      const displayCategory = translateCategoria(r.categoria);
      return { 
        id: r._id, 
        label: `[${displayCategory}] ${displayDesc || "(sem descrição)"}` 
      };
    });

  // Eficiência desta atividade vs equipe base
  const baseComp = equipesBase?.[aObj.id] ?? null;
  const kpiBase = kpisBase?.[aObj.id] ?? 0;
  const ef = calcEficiencia(comp, baseComp, kpiBase, aObj.id);
  const subAlocacaoMap = Object.fromEntries((ef.subAlocacao || []).map(s => [s.cargo, s]));
  const coer = calcCoerencia(comp.moRows, comp.eqRows);
  const kpi = comp.kpi || 0;

  const tabs: Array<['M' | 'L', string, string]> = [
    ["M", C.blueL, t("activities.groups.M")],
    ["L", C.greenL, t("activities.groups.L")]
  ];

  return (
    <div style={S.pg}>
      {/* barra de grupo ativo */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 9, color: C.txt3, letterSpacing: 2 }}>{t("composition.activeGroup")}</span>
        {role === "F" ? (
          grupos.map((g, i) => (
            <Pill key={g.id} on={gIdx === i} onClick={() => setGIdx(i)} ch={g.nome} />
          ))
        ) : (
          <span style={{ fontSize: 12, fontWeight: 700, color: C.goldL }}>{grupos[gIdx]?.nome}</span>
        )}
        <button style={{ ...S.btnP, marginLeft: "auto", fontSize: 10 }} onClick={() => setScreen("cronograma")}>
          {t("header.nav.gantt").toUpperCase()} →
        </button>
      </div>

      {/* barra resumo */}
      <div style={{
        background: C.surf2, border: `1px solid ${C.border2}`, borderRadius: 6,
        padding: "9px 14px", marginBottom: 10, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap"
      }}>
        <div style={{ fontSize: 9, color: C.txt3, letterSpacing: 2 }}>{t("composition.allActivitiesCost")}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.goldL }}>{formatCurrency(totalGeral)}</div>
        <div style={{ marginLeft: "auto", fontSize: 10, color: C.txt2 }}>
          {t("composition.kpisDefined", { count: atividadesCatalog.filter(a => gc(gIdx, a.id).kpi > 0).length, total: atividadesCatalog.length })}
        </div>
      </div>

      {/* tabs atividades */}
      <div style={{ marginBottom: 10 }}>
        {tabs.map(([grp, col, label]) => (
          <div key={grp} style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 9, color: col, letterSpacing: 3, marginBottom: 4 }}>{label}</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {atividadesCatalog.filter(a => a.grp === grp).map(a => {
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
                    <div>{a.desc[currentLang].split(" ").slice(0, 3).join(" ")}{has ? " ✓" : ""}</div>
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
      <div className="comp-grid-layout">
        {/* ESQUERDA */}
        <div>
          {/* cabeçalho atividade */}
          <div style={{
            background: colGrp + "18", border: `1px solid ${colGrp}33`, borderRadius: 6,
            padding: "10px 14px", marginBottom: 10,
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: colGrp, display: "flex", alignItems: "center", gap: 8 }}>
                <span>{aObj.desc[currentLang]}</span>
                {isMutating > 0 ? (
                  <span className="save-badge-animation" style={{ fontSize: 9, color: C.gold, background: C.gold + "15", border: `1px solid ${C.gold}44`, borderRadius: 4, padding: "2px 6px", fontWeight: 700 }}>
                    💾 {t("common.saving")}
                  </span>
                ) : (
                  <span style={{ fontSize: 9, color: C.greenL, background: C.greenL + "15", border: `1px solid ${C.greenL}44`, borderRadius: 4, padding: "2px 6px", fontWeight: 700 }}>
                    ✓ {currentLang === "es" ? "Guardado" : "Salvo"}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 10, color: C.txt2, marginTop: 2 }}>
                {t("activities.cols.volume")}: <strong style={{ color: C.goldL }}>{fmtI(esc, currentLang)} {aObj.und[currentLang].toLowerCase()}</strong>
                &nbsp;·&nbsp;<Tag text={aObj.und[currentLang]} col={colGrp} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 8, color: C.txt3, letterSpacing: 2, marginBottom: 3 }}>{t("composition.kpiBaseLabel")}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <LocalNumInp v={comp.kpi || ""} onSave={v => uKpi(gIdx, aObj.id, v)} w={80} />
                  {ef.varKpiPct != null && ef.varKpiPct > 40 && (
                    <span 
                      title={t("composition.warningKpiBase", { kpiGrupo: ef.kpiGrupo, kpiBase: ef.kpiBase, sign: "+", pct: ef.varKpiPct })} 
                      style={{ cursor: "help", fontSize: 13, userSelect: "none", color: ef.varKpiPct > 200 ? C.redL : C.yellow }}
                    >
                      ⚠️
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 8, color: C.txt3, letterSpacing: 2, marginBottom: 3 }}>
                  {t("composition.equipesLabelShort")}{travaEquipes && <span style={{ color: C.txt3, fontWeight: 400 }}> 🔒</span>}
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
                  {t("composition.startMonthLabelShort")}{mesIniciaBase[aObj.id] > 0 && comp.mesInicia === 0 && (
                    <span style={{ color: C.txt3, fontWeight: 400 }}> ({t("composition.baseLabelShort", { mes: mesIniciaBase[aObj.id] })})</span>
                  )}
                </div>
                <LocalNumInp v={comp.mesInicia || ""} onSave={v => uMesInicia(gIdx, aObj.id, v)} w={65} />
              </div>
              <div style={{ textAlign: "center", minWidth: 60 }}>
                <div style={{ fontSize: 8, color: C.txt3, letterSpacing: 1, marginBottom: 2 }}>{t("composition.durationLabelShort")}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: calc.dur > 0 ? C.goldL : C.txt3 }}>
                  {calc.dur > 0 ? calc.dur + "m" : "—"}
                </div>
              </div>
            </div>
          </div>

          {/* MÃO DE OBRA */}
          <Card mb={24}>
            <Hdr2 col={C.blueL} ch={`${t("composition.moTitleLong")} — ${aObj.desc[currentLang].slice(0, 28)}`} />
            
            {/* Tabela Desktop */}
            <div className="desktop-table-wrapper table-responsive">
              <table style={S.tbl}>
                <thead><tr>
                  <TH ch={t("composition.moCols.cargo")} w={170} />
                  <TH ch={t("composition.moCols.qtd")} right w={50} />
                  <TH ch={t("composition.moCols.hours")} right w={70} />
                  <TH ch={t("composition.moCols.hoursTotal")} right w={70} />
                  <TH ch={t("composition.moCols.coef", { und: aObj.und[currentLang].toLowerCase() })} right w={110} accent />
                  <TH ch={t("composition.moCols.salary")} right />
                  <TH ch={t("composition.moCols.total")} right accent />
                  <TH ch="" w={30} />
                </tr></thead>
                <tbody>
                  {comp.moRows.length === 0 && (
                    <tr><td colSpan={8} style={{ padding: "12px 9px", color: C.txt3, fontSize: 11, fontStyle: "italic", textAlign: "center" }}>
                      {t("composition.moEmpty")}
                    </td></tr>
                  )}
                  {comp.moRows.map((r) => {
                    const ht = r.qtd * (r.horasDia ?? 8.5);
                    const cf = kpi > 0 ? ht / kpi : null;
                    const displayCargoName = translateCargo(r.cargo);
                    return (
                      <tr key={r._id} style={S.trOn(C.blueL)}>
                        <td style={{ padding: "4px 9px", fontSize: 11, fontWeight: 600, color: C.txt }}>
                          {displayCargoName}
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
                          <LocalNumInp v={convertCurrency(r.sal)} onSave={v => moUpd(gIdx, aObj.id, r._id, "sal", reconvertCurrency(v))} w={100} />
                        </td>
                        <td style={{ padding: "4px 9px", textAlign: "right", fontWeight: 700, color: C.goldL, fontSize: 11 }}>
                          {formatCurrency(r.sal * r.qtd)}
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
                        {t("composition.moTotal", { count: calc.moQtd })}
                      </td>
                      <td style={{ padding: "5px 9px", textAlign: "right", fontSize: 11, fontWeight: 700, color: C.goldL }}>
                        {calc.coefMo != null ? `${fmt2(calc.coefMo)} Hh` : "—"}
                      </td>
                      <td />
                      <td style={{ padding: "5px 9px", textAlign: "right", fontSize: 12, fontWeight: 700, color: C.goldL }}>
                        {formatCurrency(calc.custoMo)}
                      </td>
                      <td />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Cards Empilhados Mobile */}
            <div className="mobile-resource-cards">
              {comp.moRows.length === 0 ? (
                <div style={{ padding: "16px", color: C.txt3, fontSize: 11, fontStyle: "italic", textAlign: "center", background: C.surf2, borderRadius: 6, border: `1px solid ${C.border2}` }}>
                  {t("composition.moEmpty")}
                </div>
              ) : (
                comp.moRows.map((r) => {
                  const ht = r.qtd * (r.horasDia ?? 8.5);
                  const cf = kpi > 0 ? ht / kpi : null;
                  const displayCargoName = translateCargo(r.cargo);
                  return (
                    <div key={r._id} style={{
                      background: C.surf2, border: `1px solid ${C.border2}`, borderRadius: 8, padding: 12,
                      display: "flex", flexDirection: "column", gap: 10, position: "relative"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}`, paddingBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: C.txt }}>
                          {displayCargoName}
                          {role !== "G" && subAlocacaoMap[r.cargo] && (
                            <span style={{ fontSize: 8, fontWeight: 700, color: C.yellow, background: C.yellow + "18", border: `1px solid ${C.yellow}44`, borderRadius: 2, padding: "0 4px", marginLeft: 6 }}>⚠️ SUB</span>
                          )}
                        </span>
                        <BtnDel onClick={() => moDel(gIdx, aObj.id, r._id)} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 9, color: C.txt3, marginBottom: 2 }}>{t("composition.moCols.qtd")}</label>
                          <LocalNumInp v={r.qtd} onSave={v => moUpd(gIdx, aObj.id, r._id, "qtd", v)} w="100%" />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 9, color: C.txt3, marginBottom: 2 }}>{t("composition.moCols.hours")}</label>
                          <LocalNumInp v={r.horasDia ?? 8.5} onSave={v => moUpd(gIdx, aObj.id, r._id, "horasDia", v)} w="100%" />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 9, color: C.txt3, marginBottom: 2 }}>{t("composition.moCols.salary")}</label>
                          <LocalNumInp v={convertCurrency(r.sal)} onSave={v => moUpd(gIdx, aObj.id, r._id, "sal", reconvertCurrency(v))} w="100%" />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                          <div style={{ fontSize: 9, color: C.txt3 }}>{t("composition.moCols.coef", { und: "" }).split(" ")[0]}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: C.goldL, marginTop: 2 }}>
                            {cf != null ? `${fmt2(cf)} Hh` : "—"}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 6, borderTop: `1px dashed ${C.border2}`, fontSize: 10 }}>
                        <span style={{ color: C.txt2 }}>{t("composition.moCols.hoursTotal")}: {ht.toFixed(1)}h</span>
                        <span style={{ fontWeight: 700, color: C.goldL }}>{t("composition.moCols.total")}: {formatCurrency(r.sal * r.qtd)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {(ef.obrigatorioAusente || []).filter(o => o.tipo === "mo").length > 0 && (
              role === "G" ? (
                <div style={{ padding: "10px 14px", background: C.redL + "15", borderTop: `2px solid ${C.redL}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.redL, letterSpacing: 1 }}>
                    {t("composition.warningRequiredMissing")}
                  </div>
                </div>
              ) : (
                <div style={{ padding: "6px 12px", background: C.redL + "0D", borderTop: `1px solid ${C.redL}33` }}>
                  {(ef.obrigatorioAusente || []).filter(o => o.tipo === "mo").map(o => (
                    <div key={o.label} style={{ fontSize: 10, color: C.redL, padding: "2px 0" }}>
                      {t("composition.warningRequiredMissingDetail", { label: translateCargo(o.label) })}
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
                  placeholder={moOpts.length === 0 ? t("composition.moSelectAll") : t("composition.moSelectPlaceholder")}
                />
              </div>
              {moOpts.length > 0 && (
                <span style={{ fontSize: 10, color: C.txt3, whiteSpace: "nowrap" }}>
                  {t("composition.moSelectCount", { count: moCatalog.length - moOpts.length, total: moCatalog.length })}
                </span>
              )}
            </div>
          </Card>

          {/* EQUIPAMENTOS */}
          <Card mb={24}>
            <Hdr2 col={C.yellow} ch={`${t("composition.eqTitleLong")} — ${aObj.desc[currentLang].slice(0, 28)}`} />
            
            {/* Tabela Desktop */}
            <div className="desktop-table-wrapper table-responsive">
              <table style={S.tbl}>
                <thead><tr>
                  <TH ch={t("composition.eqCols.name")} w={190} />
                  <TH ch={t("composition.eqCols.qtd")} right w={50} />
                  <TH ch={t("composition.eqCols.hours")} right w={70} />
                  <TH ch={t("composition.eqCols.hoursTotal")} right w={70} />
                  <TH ch={t("composition.eqCols.coef", { und: aObj.und[currentLang].toLowerCase() })} right w={110} accent />
                  <TH ch={t("composition.eqCols.rent")} right />
                  <TH ch={t("composition.eqCols.total")} right accent />
                  <TH ch="" w={30} />
                </tr></thead>
                <tbody>
                  {comp.eqRows.length === 0 && (
                    <tr><td colSpan={8} style={{ padding: "12px 9px", color: C.txt3, fontSize: 11, fontStyle: "italic", textAlign: "center" }}>
                      {t("composition.eqEmpty")}
                    </td></tr>
                  )}
                  {comp.eqRows.map((r) => {
                    const hrs = r.horasDia ?? 8.5;
                    const ht = r.qtd * hrs;
                    const cf = kpi > 0 ? ht / kpi : null;
                    const displayEqName = translateEquip(r.nome);
                    return (
                      <tr key={r._id} style={S.trOn(C.yellow)}>
                        <td style={{ padding: "4px 9px", fontSize: 11, fontWeight: 600, color: C.txt }}>{displayEqName}</td>
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
                          <LocalNumInp v={convertCurrency(r.loc)} onSave={v => eqUpd(gIdx, aObj.id, r._id, "loc", reconvertCurrency(v))} w={100} />
                        </td>
                        <td style={{ padding: "4px 9px", textAlign: "right", fontWeight: 700, color: C.goldL, fontSize: 11 }}>
                          {formatCurrency(r.loc * r.qtd)}
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
                        {t("composition.eqTotal", { count: comp.eqRows.length })}
                      </td>
                      <td style={{ padding: "5px 9px", textAlign: "right", fontSize: 11, fontWeight: 700, color: C.goldL }}>
                        {calc.coefEq != null ? `${fmt2(calc.coefEq)} Ch` : "—"}
                      </td>
                      <td style={{ padding: "5px 9px", textAlign: "right", fontSize: 10, color: C.txt2 }}>/{t("summary.months")}</td>
                      <td style={{ padding: "5px 9px", textAlign: "right", fontSize: 12, fontWeight: 700, color: C.goldL }}>
                        {formatCurrency(calc.custoEq)}
                      </td>
                      <td />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Cards Empilhados Mobile */}
            <div className="mobile-resource-cards">
              {comp.eqRows.length === 0 ? (
                <div style={{ padding: "16px", color: C.txt3, fontSize: 11, fontStyle: "italic", textAlign: "center", background: C.surf2, borderRadius: 6, border: `1px solid ${C.border2}` }}>
                  {t("composition.eqEmpty")}
                </div>
              ) : (
                comp.eqRows.map((r) => {
                  const hrs = r.horasDia ?? 8.5;
                  const ht = r.qtd * hrs;
                  const cf = kpi > 0 ? ht / kpi : null;
                  const displayEqName = translateEquip(r.nome);
                  return (
                    <div key={r._id} style={{
                      background: C.surf2, border: `1px solid ${C.border2}`, borderRadius: 8, padding: 12,
                      display: "flex", flexDirection: "column", gap: 10, position: "relative"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}`, paddingBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: C.txt }}>
                          {displayEqName}
                        </span>
                        <BtnDel onClick={() => eqDel(gIdx, aObj.id, r._id)} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 9, color: C.txt3, marginBottom: 2 }}>{t("composition.eqCols.qtd")}</label>
                          <LocalNumInp v={r.qtd} onSave={v => eqUpd(gIdx, aObj.id, r._id, "qtd", v)} w="100%" />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 9, color: C.txt3, marginBottom: 2 }}>{t("composition.eqCols.hours")}</label>
                          <LocalNumInp v={hrs} onSave={v => eqUpd(gIdx, aObj.id, r._id, "horasDia", v)} w="100%" />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 9, color: C.txt3, marginBottom: 2 }}>{t("composition.eqCols.rent")}</label>
                          <LocalNumInp v={convertCurrency(r.loc)} onSave={v => eqUpd(gIdx, aObj.id, r._id, "loc", reconvertCurrency(v))} w="100%" />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                          <div style={{ fontSize: 9, color: C.txt3 }}>{t("composition.eqCols.coef", { und: "" }).split(" ")[0]}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: C.goldL, marginTop: 2 }}>
                            {cf != null ? `${fmt2(cf)} Ch` : "—"}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 6, borderTop: `1px dashed ${C.border2}`, fontSize: 10 }}>
                        <span style={{ color: C.txt2 }}>{t("composition.eqCols.hoursTotal")}: {ht.toFixed(1)}h</span>
                        <span style={{ fontWeight: 700, color: C.goldL }}>{t("composition.eqCols.total")}: {formatCurrency(r.loc * r.qtd)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {(ef.obrigatorioAusente || []).filter(o => o.tipo === "eq").length > 0 && (
              role === "G" ? (
                <div style={{ padding: "10px 14px", background: C.redL + "15", borderTop: `2px solid ${C.redL}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.redL, letterSpacing: 1 }}>
                    {t("composition.warningRequiredMissing")}
                  </div>
                </div>
              ) : (
                <div style={{ padding: "6px 12px", background: C.redL + "0D", borderTop: `1px solid ${C.redL}33` }}>
                  {(ef.obrigatorioAusente || []).filter(o => o.tipo === "eq").map(o => (
                    <div key={o.label} style={{ fontSize: 10, color: C.redL, padding: "2px 0" }}>
                      {t("composition.eqWarningRequiredMissingDetail", { label: translateEquip(o.label) })}
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
                  placeholder={t("composition.eqSelectPlaceholder")}
                />
              </div>
            </div>
          </Card>

          {/* REQUISITOS DE SEGURANÇA */}
          <Card mb={24}>
            <Hdr2 col={C.greenL} ch={`${t("composition.reqTitle")} — ${aObj.desc[currentLang].slice(0, 28)}`} />
            {comp.moRows.length > 0 && (
              <div style={{ padding: "6px 12px", background: C.surf2, borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.txt2 }}>
                <strong>{t("composition.cargosContratados")}:</strong> {comp.moRows.map(r => `${translateCargo(r.cargo)} (${r.qtd})`).join(", ")}
              </div>
            )}
            <div className="table-responsive">
              <table style={S.tbl}>
                <thead><tr>
                  <TH ch={t("composition.reqCols.category")} w={140} />
                  <TH ch={t("composition.reqCols.desc")} />
                  <TH ch="" w={30} />
                </tr></thead>
                <tbody>
                  {addedReqs.length === 0 && (
                    <tr><td colSpan={3} style={{ padding: "12px 9px", color: C.txt3, fontSize: 11, fontStyle: "italic", textAlign: "center" }}>
                      {reqsAtiv.length === 0
                        ? t("composition.reqEmptyFacilitator")
                        : t("composition.reqEmpty")}
                    </td></tr>
                  )}
                  {addedReqs.map((req) => {
                    const displayDesc = translateRequisito(req.desc);
                    const displayCategory = translateCategoria(req.categoria);
                    return (
                      <tr key={req._id} style={S.trOn(C.greenL)}>
                        <td style={{ padding: "4px 9px" }}>
                          <Tag text={displayCategory} col={REQ_CAT_COLORS[req.categoria]} />
                        </td>
                        <td style={{ padding: "4px 9px", fontSize: 10, color: C.txt }}>
                          {displayDesc || "(sem descrição)"}
                        </td>
                        <td style={{ padding: "3px 6px", textAlign: "center" }}>
                          <BtnDel onClick={() => toggleReq(gIdx, aObj.id, req._id)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {reqsAtiv.length > 0 && (
              <div style={{ padding: "8px 12px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <Sel
                    v=""
                    onChange={e => { if (e.target.value) toggleReq(gIdx, aObj.id, e.target.value); }}
                    opts={availReqOpts}
                    placeholder={availReqOpts.length === 0 ? t("composition.reqSelectAll") : t("composition.reqSelectPlaceholder")}
                  />
                </div>
                {availReqOpts.length > 0 && (
                  <button
                    onClick={() => addAllReqs(gIdx, aObj.id)}
                    style={{
                      fontSize: 10, fontWeight: 700, padding: "5px 10px",
                      borderRadius: 4, border: `1px solid ${C.greenL}55`,
                      background: C.greenL + "15", color: C.greenL,
                      cursor: "pointer", whiteSpace: "nowrap",
                    }}
                    title={t("composition.reqMarkAllTitle")}
                  >
                    {t("composition.reqMarkAllButton")}
                  </button>
                )}
                <span style={{ fontSize: 10, color: C.txt3, whiteSpace: "nowrap" }}>
                  {addedReqs.length}/{reqsAtiv.length}
                </span>
              </div>
            )}
          </Card>
        </div>

        {/* DIREITA — RESUMO */}
        <div style={{ position: "sticky", top: 60, alignSelf: "flex-start" }}>
          <Card>
            <Hdr2 ch={`${t("composition.summaryTitle")} — ${aObj.desc[currentLang].slice(0, 26)}`} />
            <div style={{ padding: 14 }}>
              <table style={{ ...S.tbl, marginBottom: 14 }}>
                <tbody>
                  <tr style={{ borderBottom: `2px solid ${C.border2}`, background: C.surf2 }}>
                    <td style={{ padding: "8px 9px", fontSize: 14, fontWeight: 700, color: C.goldL }}>
                      {t("composition.summaryCols.costActivity")}
                    </td>
                    <td style={{ padding: "8px 9px", textAlign: "right", fontSize: 18, fontWeight: 700, color: C.goldL }}>
                      {formatCurrency(calc.total)}
                    </td>
                  </tr>
                  {[
                    [t("composition.summaryCols.laborMonth"), calc.custoMo, C.blueL], 
                    [t("composition.summaryCols.eqMonth"), calc.custoEq, C.yellow]
                  ].map(([l, v, col]) => (
                    <tr key={l as string} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: "5px 9px 5px 18px", fontSize: 11, color: C.txt2 }}>{l}</td>
                      <td style={{ padding: "5px 9px", textAlign: "right", fontSize: 12, fontWeight: 700, color: col as string }}>
                        {formatCurrency(v as number)}
                      </td>
                    </tr>
                  ))}
                  {calc.fatorMobilizacao > 1 && (
                    <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.yellow + "0A" }}>
                      <td style={{ padding: "5px 9px 5px 18px", fontSize: 11, color: C.yellow }}>
                        {t("composition.summaryCols.mobilization", { count: (compEff.equipes || 1) - 1, pct: calc.custoMobilizacaoPct })}
                      </td>
                      <td style={{ padding: "5px 9px", textAlign: "right", fontSize: 11, fontWeight: 700, color: C.yellow }}>
                        +{formatCurrency(calc.custoMobilizacao)}
                      </td>
                    </tr>
                  )}
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "6px 9px", fontSize: 13, color: C.txt2 }}>{t("composition.summaryCols.duration")}</td>
                    <td style={{ padding: "6px 9px", textAlign: "right", fontSize: 15, fontWeight: 700, color: calc.dur > 0 ? C.greenL : C.txt3 }}>
                      {calc.dur > 0 
                        ? t("composition.summaryCols.durationDays", { days: calc.durTotalDias, months: calc.dur })
                        : t("composition.summaryCols.durationKpiMissing")}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "6px 9px", fontSize: 11, color: C.txt2 }}>{t("composition.summaryCols.staffEq")}</td>
                    <td style={{ padding: "6px 9px", textAlign: "right", fontSize: 11, color: C.txt }}>
                      {calc.moQtd} / {comp.eqRows.length}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "6px 9px", fontSize: 11, color: C.txt2 }}>{t("composition.summaryCols.compsFilled")}</td>
                    <td style={{ padding: "6px 9px", textAlign: "right", fontSize: 11, color: C.goldL }}>
                      {atividadesCatalog.filter(a => gc(gIdx, a.id).moRows.length > 0 || gc(gIdx, a.id).kpi > 0).length}/{atividadesCatalog.length}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Alertas de sub-alocação — facilitador */}
              {role !== "G" && ef.temSubAlocacao && (
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginBottom: 12 }}>
                  <div style={{ fontSize: 9, color: "#991B1B", letterSpacing: 3, marginBottom: 6, fontWeight: 700 }}>{t("composition.alertsTitle")}</div>
                  {(ef.obrigatorioAusente || []).map(o => (
                    <div key={o.label} style={{ fontSize: 9, color: "#991B1B", padding: "4px 8px", background: "rgba(254, 226, 226, 0.4)", borderLeft: "3px solid #EF4444", borderRadius: "0 4px 4px 0", marginBottom: 6, lineHeight: 1.4 }}>
                      {t("composition.warningMissingRequired", { label: translateCargo(o.label) })}
                    </div>
                  ))}
                  {(ef.subAlocacao || []).map(s => (
                    <div key={s.cargo} style={{ fontSize: 9, color: "#B45309", padding: "4px 8px", background: "rgba(254, 243, 199, 0.4)", borderLeft: "3px solid #F59E0B", borderRadius: "0 4px 4px 0", marginBottom: 6, lineHeight: 1.4 }}>
                      {t("composition.warningSuballoc", { cargo: translateCargo(s.cargo), coefGrupo: fmt2(s.coefGrupo), minCoef: fmt2(s.minCoef), minVarPct: s.minVarPct })}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Alerta para o grupo — recursos obrigatórios ausentes */}
              {role === "G" && (ef.obrigatorioAusente || []).length > 0 && (
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginBottom: 12 }}>
                  <div style={{ padding: "10px 12px", borderRadius: 4, background: "rgba(254, 226, 226, 0.4)", border: "1px solid #FCA5A5" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#991B1B", letterSpacing: 1 }}>
                      {t("composition.warningRequiredMissing")}
                    </div>
                    {(ef.obrigatorioAusente || []).map(o => (
                      <div key={o.label} style={{ fontSize: 9, color: "#991B1B", padding: "2px 0 2px 8px", borderLeft: "2px solid #EF4444", marginTop: 4, lineHeight: 1.4 }}>
                        {t("composition.warningRequiredMissingDetail", { label: o.tipo === "mo" ? translateCargo(o.label) : translateEquip(o.label) })}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alerta de incompatibilidade KPI/Coeficientes/Coerência — todos os papéis */}
              {((ef.varKpiPct != null && ef.varKpiPct > 40) || (ef.subAlocacao || []).length > 0 || coer.issues.length > 0) && (
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginBottom: 12 }}>
                  <div style={{ padding: "10px 12px", borderRadius: 4, background: "rgba(254, 243, 199, 0.4)", border: "1px solid #FDE68A" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#B45309", letterSpacing: 2, marginBottom: 6 }}>
                      {t("composition.warningKpiCoherenceTitle")}
                    </div>
                    {ef.varKpiPct != null && ef.varKpiPct > 200 && (
                      <div style={{ fontSize: 9, color: "#991B1B", padding: "4px 8px", borderLeft: "3px solid #EF4444", background: "rgba(254, 242, 242, 0.9)", border: "1px solid #FCA5A5", borderRadius: "0 4px 4px 0", marginBottom: 6, lineHeight: 1.4, fontWeight: 700 }}>
                        {t("composition.warningKpiExorbitant")}
                      </div>
                    )}
                    {ef.varKpiPct != null && ef.varKpiPct > 40 && ef.varKpiPct <= 200 && (
                      <div style={{ fontSize: 9, color: "#B45309", padding: "4px 8px", borderLeft: "3px solid #F59E0B", background: "rgba(254, 243, 199, 0.2)", borderRadius: "0 4px 4px 0", marginBottom: 6, lineHeight: 1.4 }}>
                        {t("composition.warningKpiBase", { kpiGrupo: ef.kpiGrupo, kpiBase: ef.kpiBase, sign: ef.varKpiPct > 0 ? "+" : "", pct: ef.varKpiPct })}
                      </div>
                    )}
                    {role === "G" && (ef.subAlocacao || []).map(s => (
                      <div key={s.cargo} style={{ fontSize: 9, color: "#B45309", padding: "4px 8px", borderLeft: "3px solid #F59E0B", background: "rgba(254, 243, 199, 0.2)", borderRadius: "0 4px 4px 0", marginBottom: 6, lineHeight: 1.4 }}>
                        {t("composition.warningSuballocDetail", { cargo: translateCargo(s.cargo), coefGrupo: s.coefGrupo, minCoef: s.minCoef, minVarPct: s.minVarPct })}
                      </div>
                    ))}
                    {role !== "G" && (ef.subAlocacao || []).map(s => (
                      <div key={s.cargo} style={{ fontSize: 9, color: "#991B1B", padding: "4px 8px", borderLeft: "3px solid #EF4444", background: "rgba(254, 226, 226, 0.2)", borderRadius: "0 4px 4px 0", marginBottom: 6, lineHeight: 1.4 }}>
                        {t("composition.warningSuballocDetail", { cargo: translateCargo(s.cargo), coefGrupo: s.coefGrupo, minCoef: s.minCoef, minVarPct: s.minVarPct })}
                      </div>
                    ))}
                    {coer.issues.map((iss, i) => {
                      let msg = "";
                      switch (iss.tipo) {
                        case "sem_equipamento":
                          msg = t("composition.coherenceMessages.sem_equipamento", { nOp: iss.nOp, cargo: translateCargo(iss.cargo), eqNomes: iss.eqNomes.map(translateEquip).join(" / "), eqEsperado: iss.eqEsperado });
                           break;
                        case "sem_operador":
                          msg = t("composition.coherenceMessages.sem_operador", { nEq: iss.nEq, eqNomes: translateEquip(iss.eqNomes[0]), cargo: translateCargo(iss.cargo), opEsperado: iss.opEsperado });
                          break;
                        case "eq_insuficiente":
                          msg = t("composition.coherenceMessages.eq_insuficiente", { nOp: iss.nOp, cargo: translateCargo(iss.cargo), nEq: iss.nEq, eqNomes: translateEquip(iss.eqNomes[0]), eqEsperado: iss.eqEsperado });
                          break;
                        case "eq_ocioso":
                          msg = t("composition.coherenceMessages.eq_ocioso", { nEq: iss.nEq, eqNomes: translateEquip(iss.eqNomes[0]), ociosos: iss.nEq - iss.eqEsperado, nOp: iss.nOp, cargo: translateCargo(iss.cargo) });
                          break;
                        case "impar_puller_freio":
                          msg = t("composition.coherenceMessages.impar_puller_freio", { nOp: iss.nOp });
                          break;
                        case "transporte_insuficiente":
                          msg = t("composition.coherenceMessages.transporte_insuficiente", { precisam: iss.precisam, vagas: iss.vagas, deficit: iss.deficit });
                          break;
                        default: return null;
                      }
                      return (
                        <div key={i} style={{ fontSize: 9, color: "#B45309", padding: "4px 8px", borderLeft: "3px solid #F59E0B", background: "rgba(254, 243, 199, 0.2)", borderRadius: "0 4px 4px 0", marginBottom: 6, lineHeight: 1.4 }}>
                          {msg}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Informações básicas da LT */}
              {lt.nome && (
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 9, color: C.txt3, letterSpacing: 3, marginBottom: 8 }}>{t("composition.ltInfoTitle")}</div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      {[
                        [t("composition.ltInfoCols.name"), lt.nome, C.goldL],
                        [t("composition.ltInfoCols.tensao"), lt.tensao, C.yellow],
                        [t("composition.ltInfoCols.ext"), lt.ext ? `${lt.ext} km` : "—", C.txt],
                        [t("composition.ltInfoCols.circ"), lt.circ === "duplo" ? t("composition.ltInfoCols.circDuplo") : t("composition.ltInfoCols.circSimples"), C.txt],
                        [t("composition.ltInfoCols.cabFase"), lt.cabFase ?? "—", C.blueL],
                        [t("composition.ltInfoCols.pararaios"), lt.pararaios ?? "—", C.txt2],
                        [t("composition.ltInfoCols.opgw"), lt.opgw ?? "—", C.txt2],
                      ].map(([label, val, col]) => (
                        <tr key={label as string} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: "4px 4px", fontSize: 10, color: C.txt2 }}>{label}</td>
                          <td style={{ padding: "4px 4px", textAlign: "right", fontSize: 10, fontWeight: 700, color: col as string }}>{val}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* total geral */}
              <div style={{ padding: "10px 12px", borderRadius: 5, background: C.surf3, border: `1px solid ${C.border2}` }}>
                <div style={{ fontSize: 9, color: C.txt3, letterSpacing: 2, marginBottom: 3 }}>{t("composition.totalGeralTitle")}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: C.goldL }}>{formatCurrency(totalGeral)}</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

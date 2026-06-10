import { useTranslation } from "react-i18next";
import { C } from "../constants/colors";
import { S } from "../styles";
import { fmt, fmtI } from "../utils/formatters";
import { monthlyVolumes } from "../utils/calculations";
import { ATIVS } from "../constants/catalogs";
import { useApp } from "../context/AppContext";
import { Card } from "../components/ui/Card";
import { Hdr2, Tag, Pill } from "../components/ui/Typography";
import { TH, TD } from "../components/ui/Table";

const MONTH_NAMES_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const MONTH_NAMES_ES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const BASE_MONTH_OFFSET = 4; // May = index 4
const BASE_YEAR = 2026;

function monthLabel(idx: number, lang: "pt" | "es") {
  const monthNames = lang === "es" ? MONTH_NAMES_ES : MONTH_NAMES_PT;
  const offset = BASE_MONTH_OFFSET + idx;
  const year = BASE_YEAR + Math.floor(offset / 12);
  const month = offset % 12;
  return `${monthNames[month]}/${String(year).slice(2)}`;
}

export default function Cronograma() {
  const { t } = useTranslation();
  const { 
    grupos, gIdx, setGIdx, gc, calcA, volumesPrev, kpisBase, mesIniciaBase, lt, role, duracaoSomada, travaEquipes, lang 
  } = useApp();
  
  const currentLang = (lang === "es" ? "es" : "pt") as "pt" | "es";
  const g = grupos[gIdx] || { nome: "Grupo" };

  const tl = ATIVS.map(a => {
    const comp = gc(gIdx, a.id);
    const vol = volumesPrev[a.id] || 0;
    const hasResources = comp.moRows.length > 0 || comp.eqRows.length > 0 || comp.kpi > 0;
    const kpiEff = hasResources ? (comp.kpi > 0 ? comp.kpi : kpisBase[a.id] || 0) : 0;
    const eqEff = travaEquipes ? 1 : (comp.equipes || 1);
    const compEff = { ...comp, kpi: kpiEff, equipes: eqEff };
    const { total: ctMensal, dur, durMeses, durTotalDias, fatorMobilizacao } = calcA(compEff, vol);
    const ct = ctMensal * (durMeses > 0 ? durMeses * fatorMobilizacao : 0);
    const vols = monthlyVolumes(vol, kpiEff, eqEff);
    const mesGrupo = comp.mesInicia > 0 ? comp.mesInicia - 1 : null;
    const mesBase  = mesIniciaBase[a.id] > 0 ? mesIniciaBase[a.id] - 1 : null;
    const start = mesGrupo ?? mesBase ?? 0;
    return { 
      ...a, 
      dur, 
      durTotalDias, 
      start, 
      end: start + (dur || 0), 
      ct, 
      vols, 
      kpiEff, 
      equipes: comp.equipes, 
      vol, 
      mesInicia: comp.mesInicia, 
      mesIniciaBase: mesIniciaBase[a.id] 
    };
  });

  const custoM = tl.filter(a => a.grp === "M").reduce((s, a) => s + a.ct, 0);
  const custoL = tl.filter(a => a.grp === "L").reduce((s, a) => s + a.ct, 0);

  const mAtivs = tl.filter(a => a.grp === "M" && a.dur > 0);
  const lAtivs = tl.filter(a => a.grp === "L" && a.dur > 0);
  const maxEndM = Math.max(0, ...mAtivs.map(a => a.end));
  const maxEndL = Math.max(0, ...lAtivs.map(a => a.end));
  const durTotal = Math.max(maxEndM, maxEndL);

  let dispM: number, dispL: number, dispTotal: number;
  if (duracaoSomada) {
    dispM     = tl.filter(a => a.grp === "M").reduce((s, a) => s + a.dur, 0);
    dispL     = tl.filter(a => a.grp === "L").reduce((s, a) => s + a.dur, 0);
    dispTotal = dispM + dispL;
  } else {
    const minStartM = mAtivs.length ? Math.min(...mAtivs.map(a => a.start)) : 0;
    const minStartL = lAtivs.length ? Math.min(...lAtivs.map(a => a.start)) : 0;
    const allAtivs  = tl.filter(a => a.dur > 0);
    const minStartAll = allAtivs.length ? Math.min(...allAtivs.map(a => a.start)) : 0;
    const maxEndAll   = allAtivs.length ? Math.max(...allAtivs.map(a => a.end))   : 0;
    dispM     = mAtivs.length ? maxEndM - minStartM : 0;
    dispL     = lAtivs.length ? maxEndL - minStartL : 0;
    dispTotal = allAtivs.length ? maxEndAll - minStartAll : 0;
  }

  const totalMonths = Math.max(10, Math.ceil(durTotal));
  const MESES = Array.from({ length: totalMonths }, (_, i) => monthLabel(i, currentLang));

  const tableHeaders: Array<[string, string, string]> = [
    ["M", C.blueL, t("gantt.cards.M")],
    ["L", C.greenL, t("gantt.cards.L")]
  ];

  return (
    <div style={S.pg}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: 3 }}>
            {t("gantt.titleMain")} — {g.nome.toUpperCase()}
          </h2>
          <p style={{ margin: "3px 0 0", color: C.txt2, fontSize: 11 }}>
            {lt.nome} · {lt.ext} km
          </p>
        </div>
        {role === "F" && (
          <div style={{ display: "flex", gap: 6 }}>
            {grupos.map((g, i) => (
              <Pill key={g.id} on={gIdx === i} onClick={() => setGIdx(i)} ch={g.nome} />
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 12 }}>
        {[
          [t("gantt.cards.M"), dispM > 0 ? `${dispM.toFixed(1)} ${t("summary.months")}` : "—", fmt(custoM, currentLang), C.blueL],
          [t("gantt.cards.L"), dispL > 0 ? `${dispL.toFixed(1)} ${t("summary.months")}` : "—", fmt(custoL, currentLang), C.greenL],
          [t("gantt.cards.duration"), dispTotal > 0 ? `${dispTotal.toFixed(1)} ${t("summary.months")}` : "—", "", C.gold],
          [t("gantt.cards.cost"), "", fmt(custoM + custoL, currentLang), C.goldL]
        ].map(([l, dur, custo, col]) => (
          <div key={l as string} style={{ ...S.stat, borderColor: (col as string) + "33" }}>
            <div style={{ fontSize: 9, color: col as string, letterSpacing: 1, marginBottom: 3 }}>{l}</div>
            {dur && <div style={{ fontSize: 16, fontWeight: 700, color: col as string }}>{dur}</div>}
            {custo && <div style={{ fontSize: dur ? 10 : 14, fontWeight: 700, color: C.goldL }}>{currentLang === "es" ? "R$ " : "R$ "}{custo}</div>}
          </div>
        ))}
      </div>

      <Card>
        <Hdr2 ch={t("gantt.durationPerActivity")} />
        <table style={S.tbl}>
          <thead><tr>
            <TH ch={t("gantt.cols.grp")} w={30} />
            <TH ch={t("activities.cols.activity")} />
            <TH ch={t("activities.cols.und")} right w={55} />
            <TH ch={t("gantt.cols.volume")} right w={90} />
            <TH ch={t("gantt.cols.kpi")} right w={70} />
            <TH ch={t("gantt.cols.teams")} right w={50} />
            <TH ch={t("gantt.cols.startMonth")} right w={80} />
            <TH ch={t("gantt.cols.duration")} right accent w={100} />
            <TH ch={t("gantt.cols.cost")} right w={110} />
          </tr></thead>
          <tbody>
            {tableHeaders.map(([grp, col, gl]) => [
              <tr key={grp + "h"}>
                <td colSpan={99} style={{ padding: "4px 9px", fontSize: 9, fontWeight: 700, letterSpacing: 3, background: col + "18", color: col }}>{gl}</td>
              </tr>,
              ...tl.filter(a => a.grp === grp).map((a, i) => {
                const mesLabel = a.mesInicia > 0
                  ? `${a.mesInicia} ✎`
                  : a.mesIniciaBase > 0
                    ? `${a.mesIniciaBase}`
                    : "1";
                return (
                  <tr key={a.id} style={S.trOff(i)}>
                    <td style={{ padding: "5px 9px", textAlign: "center" }}><Tag text={a.und[currentLang]} col={col} /></td>
                    <TD ch={a.desc[currentLang]} />
                    <TD ch={a.und[currentLang]} right muted />
                    <TD ch={fmtI(a.vol, currentLang)} right muted />
                    <TD ch={a.kpiEff || "—"} right muted />
                    <TD ch={a.equipes} right muted />
                    <td style={{ padding: "5px 9px", textAlign: "right", fontSize: 10, color: a.mesInicia > 0 ? C.goldL : C.txt2, fontWeight: a.mesInicia > 0 ? 700 : 400 }}>
                      {mesLabel}
                    </td>
                    <td style={{
                      padding: "5px 9px", textAlign: "right",
                      fontWeight: a.dur > 0 ? 700 : 400,
                      color: a.dur > 0 ? C.goldL : C.txt3
                    }}>{a.dur > 0 ? `${a.durTotalDias}d (${a.dur}m)` : "—"}</td>
                    <TD ch={fmt(a.ct, currentLang)} right />
                  </tr>
                );
              })
            ])}
          </tbody>
        </table>
      </Card>

      <Card>
        <Hdr2 ch={t("gantt.ganttTitle")} />
        <div style={{ padding: 12, overflowX: "auto" }}>
          <table style={{ ...S.tbl, tableLayout: "fixed", minWidth: 900 }}>
            <colgroup>
              <col style={{ width: 30 }} /><col style={{ width: 180 }} />
              {MESES.map(m => <col key={m} style={{ width: 58 }} />)}
              <col style={{ width: 70 }} />
            </colgroup>
            <thead><tr>
              <TH ch="" />
              <TH ch={t("activities.cols.activity")} />
              {MESES.map(m => <TH key={m} ch={m} right />)}
              <TH ch={t("gantt.cols.dur")} right accent />
            </tr></thead>
            <tbody>
              {tableHeaders.map(([grp, col, gl]) => [
                <tr key={grp + "h"}>
                  <td colSpan={99} style={{ padding: "3px 9px", fontSize: 9, fontWeight: 700, letterSpacing: 3, background: col + "18", color: col }}>{gl}</td>
                </tr>,
                ...tl.filter(a => a.grp === grp).map((a, idx) => {
                  const cols2 = [col, "#A855F7", "#EC4899", C.yellow, C.redL, C.gold];
                  const c2 = cols2[idx % cols2.length];
                  return (
                    <tr key={a.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: "3px 5px", textAlign: "center" }}><Tag text={a.und[currentLang]} col={c2} /></td>
                      <td style={{ padding: "3px 9px", fontSize: 10 }}>
                        {a.desc[currentLang].length > 24 ? a.desc[currentLang].slice(0, 24) + "…" : a.desc[currentLang]}
                      </td>
                      {MESES.map((_, mi) => {
                        const on = a.dur > 0 && mi >= a.start && mi < a.end;
                        const volIdx = on ? mi - Math.floor(a.start) : -1;
                        const vol = volIdx >= 0 ? a.vols[volIdx] : null;
                        return (
                          <td key={mi} style={{ padding: "2px" }}>
                            <div style={{
                              height: 28, borderRadius: 2,
                              background: on ? c2 + "33" : C.surf2,
                              border: on ? `1px solid ${c2}55` : "none",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 8, color: on ? c2 : C.txt3, fontWeight: 700,
                              overflow: "hidden"
                            }}>
                              {on ? (vol != null ? fmtI(vol, currentLang) : "▓") : "·"}
                            </div>
                          </td>
                        );
                      })}
                      <td style={{
                        padding: "3px 9px", textAlign: "right", fontWeight: 700,
                        color: a.dur > 0 ? C.goldL : C.txt3, fontSize: 10
                      }}>
                        {a.dur > 0 ? `${a.durTotalDias}d` : "—"}
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
}

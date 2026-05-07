import { C } from "../constants/colors";
import { S } from "../styles";
import { fmt, fmtI } from "../utils/formatters";
import { monthlyVolumes } from "../utils/calculations";
import { ATIVS } from "../constants/catalogs";
import { useApp } from "../context/AppContext";
import { Card } from "../components/ui/Card";
import { Hdr2, Tag, Pill } from "../components/ui/Typography";
import { TH, TD } from "../components/ui/Table";

const MESES = ["Mai/26","Jun/26","Jul/26","Ago/26","Set/26","Out/26","Nov/26","Dez/26","Jan/27","Fev/27"];

export default function Cronograma() {
  const { grupos, gIdx, setGIdx, gc, calcA, volumesPrev, lt, role } = useApp();
  const g = grupos[gIdx] || { nome: "Grupo" };

  let cM = 0, cL = 0;
  const tl = ATIVS.map(a => {
    const comp = gc(gIdx, a.id);
    const vol = volumesPrev[a.id] || 0;
    const { total: ct, dur, durTotalDias } = calcA(comp, vol);
    const vols = monthlyVolumes(vol, comp.kpi, comp.equipes);
    const isM = a.grp === "M";
    const st = isM ? cM : cL;
    if (dur > 0) { if (isM) cM += dur; else cL += dur; }
    return { ...a, dur, durTotalDias, start: st, end: st + (dur || 0), ct, vols, kpi: comp.kpi, equipes: comp.equipes, vol };
  });

  const custoM = tl.filter(a => a.grp === "M").reduce((s, a) => s + a.ct, 0);
  const custoL = tl.filter(a => a.grp === "L").reduce((s, a) => s + a.ct, 0);

  return (
    <div style={S.pg}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: 3 }}>
            CRONOGRAMA — {g.nome.toUpperCase()}
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
          ["🏗️ MONTAGEM", `${cM.toFixed(1)} meses`, fmt(custoM), C.blueL],
          ["🔌 LANÇAMENTO", `${cL.toFixed(1)} meses`, fmt(custoL), C.greenL],
          ["⏱️ DURAÇÃO TOTAL", `${Math.max(cM, cL).toFixed(1)} meses`, "", C.gold],
          ["💰 CUSTO TOTAL", "", fmt(custoM + custoL), C.goldL]
        ].map(([l, dur, custo, col]) => (
          <div key={l} style={{ ...S.stat, borderColor: col + "33" }}>
            <div style={{ fontSize: 9, color: col, letterSpacing: 1, marginBottom: 3 }}>{l}</div>
            {dur && <div style={{ fontSize: 16, fontWeight: 700, color: col }}>{dur}</div>}
            {custo && <div style={{ fontSize: dur ? 10 : 14, fontWeight: 700, color: C.goldL }}>R$ {custo}</div>}
          </div>
        ))}
      </div>

      <Card>
        <Hdr2 ch="📋 DURAÇÃO POR ATIVIDADE" />
        <table style={S.tbl}>
          <thead><tr>
            <TH ch="GRP" w={30} /><TH ch="ATIVIDADE" /><TH ch="UND" right w={55} />
            <TH ch="VOL. PREV." right w={90} /><TH ch="KPI" right w={70} />
            <TH ch="EQ." right w={50} /><TH ch="DURAÇÃO" right accent w={100} />
            <TH ch="CUSTO" right w={110} />
          </tr></thead>
          <tbody>
            {[["M", C.blueL, "🏗️ MONTAGEM"], ["L", C.greenL, "🔌 LANÇAMENTO"]].map(([grp, col, gl]) => [
              <tr key={grp + "h"}>
                <td colSpan={99} style={{ padding: "4px 9px", fontSize: 9, fontWeight: 700, letterSpacing: 3, background: col + "18", color: col }}>{gl}</td>
              </tr>,
              ...tl.filter(a => a.grp === grp).map((a, i) => (
                <tr key={a.id} style={S.trOff(i)}>
                  <td style={{ padding: "5px 9px", textAlign: "center" }}><Tag text={a.und} col={col} /></td>
                  <TD ch={a.desc} />
                  <TD ch={a.und} right muted />
                  <TD ch={fmtI(a.vol)} right muted />
                  <TD ch={a.kpi || "—"} right muted />
                  <TD ch={a.equipes} right muted />
                  <td style={{
                    padding: "5px 9px", textAlign: "right",
                    fontWeight: a.dur > 0 ? 700 : 400,
                    color: a.dur > 0 ? C.goldL : C.txt3
                  }}>{a.dur > 0 ? `${a.durTotalDias}d (${a.dur}m)` : "—"}</td>
                  <TD ch={fmt(a.ct)} right />
                </tr>
              ))
            ])}
          </tbody>
        </table>
      </Card>

      <Card>
        <Hdr2 ch="📊 GANTT MENSAL — VOLUMES POR MÊS" />
        <div style={{ padding: 12, overflowX: "auto" }}>
          <table style={{ ...S.tbl, tableLayout: "fixed", minWidth: 900 }}>
            <colgroup>
              <col style={{ width: 30 }} /><col style={{ width: 200 }} />
              {MESES.map(m => <col key={m} style={{ width: 62 }} />)}
              <col style={{ width: 70 }} />
            </colgroup>
            <thead><tr>
              <TH ch="" /><TH ch="ATIVIDADE" />
              {MESES.map(m => <TH key={m} ch={m} right />)}
              <TH ch="DUR." right accent />
            </tr></thead>
            <tbody>
              {[["M", C.blueL, "🏗️ MONTAGEM"], ["L", C.greenL, "🔌 LANÇAMENTO"]].map(([grp, col, gl]) => [
                <tr key={grp + "h"}>
                  <td colSpan={99} style={{ padding: "3px 9px", fontSize: 9, fontWeight: 700, letterSpacing: 3, background: col + "18", color: col }}>{gl}</td>
                </tr>,
                ...tl.filter(a => a.grp === grp).map((a, idx) => {
                  const cols2 = [col, "#A855F7", "#EC4899", C.yellow, C.redL, C.gold];
                  const c2 = cols2[idx % cols2.length];
                  return (
                    <tr key={a.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: "3px 5px", textAlign: "center" }}><Tag text={a.und} col={c2} /></td>
                      <td style={{ padding: "3px 9px", fontSize: 10 }}>
                        {a.desc.length > 26 ? a.desc.slice(0, 26) + "…" : a.desc}
                      </td>
                      {MESES.map((_, mi) => {
                        const on = mi >= a.start && mi < a.end;
                        const vol = on ? a.vols[mi - Math.floor(a.start)] : null;
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
                              {on ? (vol != null ? fmtI(vol) : "▓") : "·"}
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

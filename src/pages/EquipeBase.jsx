import { useState } from "react";
import { C } from "../constants/colors";
import { S } from "../styles";
import { fmt, fmtI } from "../utils/formatters";
import { ATIVS, MO_CAT, EQ_CAT } from "../constants/catalogs";
import { useApp } from "../context/AppContext";
import { Card } from "../components/ui/Card";
import { BtnDel } from "../components/ui/Card";
import { Hdr2, Tag } from "../components/ui/Typography";
import { TH, TD } from "../components/ui/Table";
import { NumInp, Sel } from "../components/ui/Inputs";

const fmt2 = n => n != null ? n.toFixed(2) : "—";

function CoefCell({ row, kpi }) {
  if (!kpi) return <span style={{ color: C.txt3 }}>—</span>;
  const ht = row.qtd * (row.horasDia ?? 8.5);
  const cf = ht / kpi;
  return (
    <span style={{ color: C.goldL, fontWeight: 700 }}>
      {fmt2(cf)}
    </span>
  );
}

function AtivBlock({ a, base, kpi, vol }) {
  const {
    eqBaseAddMo, eqBaseDelMo, eqBaseUpdMo,
    eqBaseAddEq, eqBaseDelEq, eqBaseUpdEq,
  } = useApp();

  const [open, setOpen] = useState(false);

  const moRows = base?.moRows ?? [];
  const eqRows = base?.eqRows ?? [];
  const colGrp = a.grp === "M" ? C.blueL : C.greenL;

  const somaHh = kpi > 0
    ? moRows.reduce((s, r) => s + r.qtd * (r.horasDia ?? 8.5), 0) / kpi
    : null;
  const somaCh = kpi > 0
    ? eqRows.reduce((s, r) => s + r.qtd * (r.horasDia ?? 8.0), 0) / kpi
    : null;

  const hasBase = moRows.length > 0 || eqRows.length > 0;

  const moUsados = new Set(moRows.map(r => r.catId));
  const moOpts = MO_CAT.filter(r => !moUsados.has(r.id)).map(r => ({ id: r.id, label: r.cargo }));
  const eqOpts = EQ_CAT.map(r => ({ id: r.id, label: r.nome }));

  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      {/* Cabeçalho da atividade */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "10px 14px", cursor: "pointer",
          background: open ? colGrp + "10" : "transparent",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.txt }}>{a.desc}</span>
          <Tag text={a.und} col={colGrp} />
          {kpi > 0 && <Tag text={`KPI: ${kpi} ${a.und.toLowerCase()}/dia`} col={C.gold} />}
          {vol > 0 && <Tag text={`Vol: ${fmtI(vol)} ${a.und.toLowerCase()}`} col={C.txt2} />}
          {hasBase && (
            <Tag text={`${moRows.length} MO · ${eqRows.length} EQ`} col={C.greenL} />
          )}
          {somaHh != null && (
            <Tag text={`Σ ${fmt2(somaHh)} Hh/${a.und.toLowerCase()}`} col={C.goldL} />
          )}
          {somaCh != null && somaCh > 0 && (
            <Tag text={`Σ ${fmt2(somaCh)} Ch/${a.und.toLowerCase()}`} col={C.yellow} />
          )}
        </div>
        <span style={{ fontSize: 14, color: C.txt3 }}>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div style={{ padding: "0 14px 14px" }}>

          {/* MÃO DE OBRA */}
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 9, color: C.blueL, letterSpacing: 3, marginBottom: 6 }}>
              👷 MÃO DE OBRA
            </div>
            <table style={S.tbl}>
              <thead><tr>
                <TH ch="CARGO" w={200} />
                <TH ch="QTD" right w={60} />
                <TH ch="HRS/DIA" right w={80} />
                <TH ch="HRS TOTAIS" right w={90} />
                <TH ch={`COEF (Hh/${a.und.toLowerCase()})`} right w={120} accent />
                <TH ch="SALÁRIO/MÊS" right w={110} />
                <TH ch="" w={30} />
              </tr></thead>
              <tbody>
                {moRows.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: "10px 9px", color: C.txt3, fontSize: 11, fontStyle: "italic", textAlign: "center" }}>
                    Nenhum cargo definido. Adicione abaixo.
                  </td></tr>
                )}
                {moRows.map(r => {
                  const ht = r.qtd * (r.horasDia ?? 8.5);
                  return (
                    <tr key={r._id} style={S.trOn(C.blueL)}>
                      <td style={{ padding: "4px 9px", fontSize: 11, fontWeight: 600, color: C.txt }}>{r.cargo}</td>
                      <td style={{ padding: "3px 7px", textAlign: "right" }}>
                        <NumInp v={r.qtd} onChange={e => eqBaseUpdMo(a.id, r._id, "qtd", e.target.value)} w={50} />
                      </td>
                      <td style={{ padding: "3px 7px", textAlign: "right" }}>
                        <NumInp v={r.horasDia ?? 8.5} onChange={e => eqBaseUpdMo(a.id, r._id, "horasDia", e.target.value)} w={60} />
                      </td>
                      <td style={{ padding: "4px 9px", textAlign: "right", fontSize: 11, color: C.txt2 }}>
                        {fmt2(ht)}
                      </td>
                      <td style={{ padding: "4px 9px", textAlign: "right" }}>
                        <CoefCell row={r} kpi={kpi} />
                      </td>
                      <td style={{ padding: "4px 9px", textAlign: "right", fontSize: 11, color: C.txt2 }}>
                        {fmt(r.sal * r.qtd)}
                      </td>
                      <td style={{ padding: "3px 6px", textAlign: "center" }}>
                        <BtnDel onClick={() => eqBaseDelMo(a.id, r._id)} />
                      </td>
                    </tr>
                  );
                })}
                {moRows.length > 0 && somaHh != null && (
                  <tr style={S.totRow}>
                    <td colSpan={4} style={{ padding: "5px 9px", fontSize: 11, fontWeight: 700, color: C.goldL }}>
                      TOTAL MO — {moRows.reduce((s, r) => s + r.qtd, 0)} profissionais
                    </td>
                    <td style={{ padding: "5px 9px", textAlign: "right", fontSize: 12, fontWeight: 700, color: C.goldL }}>
                      {fmt2(somaHh)} Hh/{a.und.toLowerCase()}
                    </td>
                    <td style={{ padding: "5px 9px", textAlign: "right", fontSize: 12, fontWeight: 700, color: C.goldL }}>
                      {fmt(moRows.reduce((s, r) => s + r.sal * r.qtd, 0))}
                    </td>
                    <td />
                  </tr>
                )}
              </tbody>
            </table>
            <div style={{ padding: "8px 12px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <Sel
                  v=""
                  onChange={e => { if (e.target.value) eqBaseAddMo(a.id, e.target.value); }}
                  opts={moOpts}
                  placeholder={moOpts.length === 0 ? "✅ Todos os cargos adicionados" : "+ Selecione um cargo..."}
                />
              </div>
            </div>
          </div>

          {/* EQUIPAMENTOS */}
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 9, color: C.yellow, letterSpacing: 3, marginBottom: 6 }}>
              🏗️ EQUIPAMENTOS
            </div>
            <table style={S.tbl}>
              <thead><tr>
                <TH ch="EQUIPAMENTO" w={240} />
                <TH ch="QTD" right w={60} />
                <TH ch="HRS/DIA" right w={80} />
                <TH ch="HRS TOTAIS" right w={90} />
                <TH ch={`COEF (Ch/${a.und.toLowerCase()})`} right w={120} accent />
                <TH ch="LOC/MÊS" right w={110} />
                <TH ch="" w={30} />
              </tr></thead>
              <tbody>
                {eqRows.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: "10px 9px", color: C.txt3, fontSize: 11, fontStyle: "italic", textAlign: "center" }}>
                    Nenhum equipamento definido.
                  </td></tr>
                )}
                {eqRows.map(r => {
                  const ht = r.qtd * (r.horasDia ?? 8.0);
                  return (
                    <tr key={r._id} style={S.trOn(C.yellow)}>
                      <td style={{ padding: "4px 9px", fontSize: 11, fontWeight: 600, color: C.txt }}>{r.nome}</td>
                      <td style={{ padding: "3px 7px", textAlign: "right" }}>
                        <NumInp v={r.qtd} onChange={e => eqBaseUpdEq(a.id, r._id, "qtd", e.target.value)} w={50} />
                      </td>
                      <td style={{ padding: "3px 7px", textAlign: "right" }}>
                        <NumInp v={r.horasDia ?? 8.0} onChange={e => eqBaseUpdEq(a.id, r._id, "horasDia", e.target.value)} w={60} />
                      </td>
                      <td style={{ padding: "4px 9px", textAlign: "right", fontSize: 11, color: C.txt2 }}>
                        {fmt2(ht)}
                      </td>
                      <td style={{ padding: "4px 9px", textAlign: "right" }}>
                        <CoefCell row={{ ...r, horasDia: r.horasDia ?? 8.0 }} kpi={kpi} />
                      </td>
                      <td style={{ padding: "4px 9px", textAlign: "right", fontSize: 11, color: C.txt2 }}>
                        {fmt(r.loc * r.qtd)}
                      </td>
                      <td style={{ padding: "3px 6px", textAlign: "center" }}>
                        <BtnDel onClick={() => eqBaseDelEq(a.id, r._id)} />
                      </td>
                    </tr>
                  );
                })}
                {eqRows.length > 0 && somaCh != null && somaCh > 0 && (
                  <tr style={S.totRow}>
                    <td colSpan={4} style={{ padding: "5px 9px", fontSize: 11, fontWeight: 700, color: C.goldL }}>
                      TOTAL EQ — {eqRows.length} equipamentos
                    </td>
                    <td style={{ padding: "5px 9px", textAlign: "right", fontSize: 12, fontWeight: 700, color: C.goldL }}>
                      {fmt2(somaCh)} Ch/{a.und.toLowerCase()}
                    </td>
                    <td style={{ padding: "5px 9px", textAlign: "right", fontSize: 12, fontWeight: 700, color: C.goldL }}>
                      {fmt(eqRows.reduce((s, r) => s + r.loc * r.qtd, 0))}
                    </td>
                    <td />
                  </tr>
                )}
              </tbody>
            </table>
            <div style={{ padding: "8px 12px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <Sel
                  v=""
                  onChange={e => { if (e.target.value) eqBaseAddEq(a.id, e.target.value); }}
                  opts={eqOpts}
                  placeholder="+ Selecione um equipamento..."
                />
              </div>
            </div>
          </div>

          {/* Aviso quando kpi não definido */}
          {!kpi && (
            <div style={{
              marginTop: 8, padding: "8px 12px", borderRadius: 4,
              background: C.yellow + "10", border: `1px solid ${C.yellow}44`,
              fontSize: 10, color: C.yellow
            }}>
              ⚠️ Defina o KPI Base em <strong>ATIVIDADES</strong> para calcular os coeficientes desta atividade.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function EquipeBase() {
  const { equipesBase, kpisBase, volumesPrev } = useApp();

  const totalAtivComBase = ATIVS.filter(a => {
    const b = equipesBase?.[a.id];
    return (b?.moRows?.length ?? 0) > 0 || (b?.eqRows?.length ?? 0) > 0;
  }).length;

  return (
    <div style={S.pg}>
      {/* Resumo topo */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 14
      }}>
        {[
          ["📋 ATIVIDADES COM BASE", `${totalAtivComBase}/${ATIVS.length}`, C.gold],
          ["👷 FINALIDADE", "Referência técnica", C.blueL],
          ["📊 OBJETIVO", "Comparar eficiência", C.greenL],
        ].map(([l, v, col]) => (
          <div key={l} style={{ ...S.stat, borderColor: col + "44" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: col }}>{v}</div>
            <div style={{ fontSize: 9, color: C.txt3, letterSpacing: 1 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{
        padding: "10px 14px", marginBottom: 12, borderRadius: 6,
        background: C.gold + "08", border: `1px solid ${C.gold}22`,
        fontSize: 11, color: C.txt2, lineHeight: 1.7
      }}>
        💡 <strong>Equipe Base</strong> é a composição de referência definida pelo facilitador.
        Os coeficientes (Hh e Ch por unidade) serão usados para avaliar a eficiência das equipes dos grupos no Ranking.
        Clique em uma atividade para expandir e definir sua equipe base.
      </div>

      {[["M", C.blueL, "🏗️ MONTAGEM"], ["L", C.greenL, "🔌 LANÇAMENTO"]].map(([grp, col, label]) => (
        <Card key={grp}>
          <Hdr2 col={col} ch={label} />
          {ATIVS.filter(a => a.grp === grp).map(a => (
            <AtivBlock
              key={a.id}
              a={a}
              base={equipesBase?.[a.id]}
              kpi={kpisBase?.[a.id] ?? 0}
              vol={volumesPrev?.[a.id] ?? 0}
            />
          ))}
        </Card>
      ))}
    </div>
  );
}

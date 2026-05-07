import { C } from "../constants/colors";
import { S } from "../styles";
import { fmt, sc } from "../utils/formatters";
import { useApp } from "../context/AppContext";
import { Card } from "../components/ui/Card";
import { Hdr2, Tag } from "../components/ui/Typography";
import { TH, TD } from "../components/ui/Table";
import { ScoreRing } from "../components/ui/Typography";

export default function Ranking() {
  const { lt, buildRank } = useApp();
  const rank = buildRank();
  const medals = ["🥇","🥈","🥉"];

  return (
    <div style={S.pg}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: 5, margin: 0 }}>🏆 RANKING FINAL</h2>
        <p style={{ color: C.txt2, fontSize: 10, letterSpacing: 3, margin: "5px 0 0" }}>{lt.nome}</p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
          {[["💰","CUSTO","30%",C.yellow],["⏱️","DURAÇÃO","30%",C.blueL],["🦺","SEGURANÇA","40%",C.greenL]].map(([ic,l,p,col]) => (
            <span key={l} style={{ fontSize: 11, color: col }}>{ic} {l} <strong>{p}</strong></span>
          ))}
        </div>
      </div>

      <Card>
        <Hdr2 ch="📊 COMPARATIVO DE GRUPOS" />
        <table style={S.tbl}>
          <thead><tr>
            <TH ch="#" w={30} /><TH ch="GRUPO" /><TH ch="RESPONSÁVEL" />
            <TH ch="💰 CUSTO TOTAL" right /><TH ch="⏱️ DUR. MÁX." right />
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
                <td style={{ padding: "9px", textAlign: "right", fontSize: 11, color: C.blueL }}>{g.dm}m</td>
                <td style={{ padding: "8px 9px", textAlign: "center" }}><ScoreRing v={g.sC} label="CUSTO" /></td>
                <td style={{ padding: "8px 9px", textAlign: "center" }}><ScoreRing v={g.sD} label="DUR." /></td>
                <td style={{ padding: "8px 9px", textAlign: "center" }}><ScoreRing v={g.sS} label="SEG." /></td>
                <td style={{ padding: "10px 9px", textAlign: "right", fontSize: 22, fontWeight: 700, color: g.desq ? C.redL : sc(g.total || 0) }}>
                  {g.desq ? "—" : g.total}
                </td>
                <td style={{ padding: "9px" }}>
                  {!g.desq && i === 0 && <Tag text="⚡ ALTA PERFORMANCE" col={C.gold} />}
                  {!g.desq && i > 0 && <Tag text="✅ APROVADO" col={C.greenL} />}
                  {g.desq && <Tag text="❌ DESCLASSIFICADO" col={C.redL} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

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
                      <tr key={mi} style={{ borderBottom: `1px solid ${C.border}`, background: C.redL + "08" }}>
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

    </div>
  );
}

import { C } from "../constants/colors";
import { S } from "../styles";
import { fmt, fmtI } from "../utils/formatters";
import { useApp } from "../context/AppContext";
import { Card } from "../components/ui/Card";
import { Hdr2, Tag, Pill } from "../components/ui/Typography";
import { TH, TD } from "../components/ui/Table";
import { NumInp, TextInp } from "../components/ui/Inputs";

export default function Engenharia() {
  const { lt, torres, uLt, uTorre, fator, totalCabos, extCondutor, totalTorres, tonTotal } = useApp();
  return (
    <div style={S.pg}>
      <Card>
        <Hdr2 ch="⚡ LINHA DE TRANSMISSÃO" />
        <div style={{ padding: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 9, color: C.txt3, letterSpacing: 2, marginBottom: 4 }}>NOME</div>
              <TextInp v={lt.nome} onChange={e => uLt("nome", e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 9, color: C.txt3, letterSpacing: 2, marginBottom: 4 }}>TENSÃO</div>
              <TextInp v={lt.tensao} onChange={e => uLt("tensao", e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 9, color: C.txt3, letterSpacing: 2, marginBottom: 4 }}>EXTENSÃO (km)</div>
              <NumInp v={lt.ext} onChange={e => uLt("ext", +e.target.value)} w="100%" />
            </div>
            <div>
              <div style={{ fontSize: 9, color: C.txt3, letterSpacing: 2, marginBottom: 4 }}>CIRCUITO</div>
              <div style={{ display: "flex", gap: 6 }}>
                {["simples","duplo"].map(c => (
                  <Pill key={c} on={lt.circ === c} onClick={() => uLt("circ", c)} ch={c.toUpperCase()} />
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[["CABOS/FASE","cabFase"],["PARA-RAIOS","pararaios"],["OPGW","opgw"]].map(([l, k]) => (
              <div key={k}>
                <div style={{ fontSize: 9, color: C.txt3, letterSpacing: 2, marginBottom: 4 }}>{l}</div>
                <NumInp v={lt[k]} onChange={e => uLt(k, +e.target.value)} w="100%" />
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <Hdr2 col={C.blueL} ch="🏗️ TIPOS DE TORRES" />
        <table style={S.tbl}>
          <thead><tr>
            <TH ch="TIPO" /><TH ch="QTD" right w={100} /><TH ch="TONELADAS" right w={110} />
            <TH ch="TOTAL TORRES" right /><TH ch="TOTAL TON" right accent />
          </tr></thead>
          <tbody>
            {[["crossrope","🔁 CROSSROPE"],["suspensao","⬆️ SUSPENSÃO"],["ancoragem","⚓ ANCORAGEM"],["estaiada","🔩 ESTAIADA"]].map(([t, l]) => (
              <tr key={t} style={S.trOff(0)}>
                <td style={{ padding: "6px 9px", fontSize: 11, fontWeight: 700 }}>{l}</td>
                <td style={{ padding: "4px 8px", textAlign: "right" }}>
                  <NumInp v={torres[t].qtd} onChange={e => uTorre(t, "qtd", e.target.value)} w={70} />
                </td>
                <td style={{ padding: "4px 8px", textAlign: "right" }}>
                  <NumInp v={torres[t].ton} onChange={e => uTorre(t, "ton", e.target.value)} w={80} />
                </td>
                <TD ch={`${torres[t].qtd} torres`} right bold />
                <TD ch={`${fmt(torres[t].ton)} ton`} right bold accent />
              </tr>
            ))}
            <tr style={S.totRow}>
              <td style={{ padding: "6px 9px", fontSize: 11, fontWeight: 700, color: C.goldL }}>TOTAL</td>
              <td /><td />
              <TD ch={`${totalTorres} torres`} right bold accent />
              <TD ch={`${fmt(tonTotal)} ton`} right bold accent />
            </tr>
          </tbody>
        </table>
        <div style={{ padding: 12, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {[
            ["CONDUTORES", `${lt.cabFase * 3 * fator}`, "cabos"],
            ["PARA-RAIOS", `${lt.pararaios * fator}`, "cabos"],
            ["TOTAL CABOS", `${totalCabos}`, "cabos"],
            ["KM CONDUTOR", fmtI(extCondutor), "km"]
          ].map(([l, v, u]) => (
            <div key={l} style={S.stat}>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.goldL }}>{v}</div>
              <div style={{ fontSize: 9, color: C.txt3 }}>{u}</div>
              <div style={{ fontSize: 8, letterSpacing: 2, color: C.txt2, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

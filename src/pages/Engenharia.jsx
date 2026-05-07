import { C } from "../constants/colors";
import { S } from "../styles";
import { fmtI } from "../utils/formatters";
import { useApp } from "../context/AppContext";
import { Card } from "../components/ui/Card";
import { Hdr2, Pill } from "../components/ui/Typography";
import { NumInp, TextInp } from "../components/ui/Inputs";

export default function Engenharia() {
  const { lt, uLt, fator, totalCabos, extCondutor } = useApp();
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
        <div style={{ padding: 12, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {[
            ["CONDUTORES", `${lt.cabFase * 3 * fator}`, "cabos"],
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

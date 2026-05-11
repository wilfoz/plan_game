import { C } from "../constants/colors";
import { S } from "../styles";
import { fmtI } from "../utils/formatters";
import { useApp } from "../context/AppContext";
import { Card } from "../components/ui/Card";
import { Hdr2, Pill } from "../components/ui/Typography";
import { LocalNumInp, LocalTextInp } from "../components/ui/Inputs";

function Toggle({ on, onToggle, label, labelOn, labelOff }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: C.txt2, letterSpacing: 1, minWidth: 140 }}>{label}</span>
      <div
        onClick={onToggle}
        style={{
          width: 38, height: 20, borderRadius: 10, cursor: "pointer",
          background: on ? C.gold : C.border2,
          position: "relative", transition: "background 0.2s", flexShrink: 0,
        }}
      >
        <div style={{
          position: "absolute", top: 2, left: on ? 20 : 2,
          width: 16, height: 16, borderRadius: "50%", background: "#FFF",
          transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
        }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, color: on ? C.goldL : C.txt2 }}>
        {on ? labelOn : labelOff}
      </span>
    </div>
  );
}

export default function Engenharia() {
  const { lt, uLt, fator, totalCabos, extCondutor, extParaRaios, duracaoSomada, setDuracaoSomada, travaEquipes, setTravaEquipes } = useApp();
  return (
    <div style={S.pg}>
      <Card>
        <Hdr2 ch="⚡ LINHA DE TRANSMISSÃO" />
        <div style={{ padding: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 9, color: C.txt3, letterSpacing: 2, marginBottom: 4 }}>NOME</div>
              <LocalTextInp v={lt.nome} onSave={v => uLt("nome", v)} />
            </div>
            <div>
              <div style={{ fontSize: 9, color: C.txt3, letterSpacing: 2, marginBottom: 4 }}>TENSÃO</div>
              <LocalTextInp v={lt.tensao} onSave={v => uLt("tensao", v)} />
            </div>
            <div>
              <div style={{ fontSize: 9, color: C.txt3, letterSpacing: 2, marginBottom: 4 }}>EXTENSÃO (km)</div>
              <LocalNumInp v={lt.ext} onSave={v => uLt("ext", +v)} w="100%" />
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
                <LocalNumInp v={lt[k]} onSave={v => uLt(k, +v)} w="100%" />
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: 12, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {[
            ["CONDUTORES", `${lt.cabFase * 3 * fator}`, "cabos"],
            ["TOTAL CABOS", `${totalCabos}`, "cabos"],
            ["KM CONDUTOR", fmtI(extCondutor), "km"],
            ["KM PARA-RAIOS", fmtI(extParaRaios), "km"]
          ].map(([l, v, u]) => (
            <div key={l} style={S.stat}>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.goldL }}>{v}</div>
              <div style={{ fontSize: 9, color: C.txt3 }}>{u}</div>
              <div style={{ fontSize: 8, letterSpacing: 2, color: C.txt2, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <Hdr2 ch="⚙️ REGRAS DA JORNADA" />
        <div style={{ padding: "6px 16px 16px", display: "flex", flexDirection: "column", gap: 18 }}>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
            <Toggle
              on={duracaoSomada}
              onToggle={() => setDuracaoSomada(v => !v)}
              label="MODO DE DURAÇÃO"
              labelOn="SOMA DAS ATIVIDADES"
              labelOff="PERÍODO (INÍCIO → FIM)"
            />
            <span style={{ fontSize: 10, color: C.txt3, maxWidth: 320, lineHeight: 1.6 }}>
              {duracaoSomada
                ? "Exibe a soma de todas as durações individuais (M + L sequencial). Útil para comparar o esforço total entre grupos."
                : "Exibe o período de calendário do início da primeira até o fim da última atividade."}
            </span>
          </div>

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, display: "flex", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
            <Toggle
              on={travaEquipes}
              onToggle={() => setTravaEquipes(v => !v)}
              label="TRAVAR QTD. EQUIPES"
              labelOn="TRAVADO (apenas leitura)"
              labelOff="LIVRE (grupos editam)"
            />
            <span style={{ fontSize: 10, color: C.txt3, maxWidth: 320, lineHeight: 1.6 }}>
              {travaEquipes
                ? "Grupos não podem alterar a quantidade de equipes. Valor fixo: 1 equipe por atividade. Use para forçar a análise de KPI isolado."
                : "Grupos podem definir livremente a quantidade de equipes por atividade."}
            </span>
          </div>

        </div>
      </Card>
    </div>
  );
}

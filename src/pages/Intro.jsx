import { C } from "../constants/colors";
import { S } from "../styles";
import { useApp } from "../context/AppContext";

export default function Intro() {
  const { setRole, setScreen, setActiveSessionId, sess } = useApp();

  const voltarSessoes = () => {
    setRole(null);
    setActiveSessionId(null);
    setScreen("session-manager");
  };

  return (
    <div style={S.app}>
      {/* barra superior com nome da sessão e botão voltar */}
      <div style={{
        padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid ${C.border}`
      }}>
        <div style={{ fontSize: 11, color: C.txt3, letterSpacing: 1 }}>
          <span style={{ color: C.gold, fontWeight: 700 }}>⚡</span>{" "}
          {sess?.nome || "Sessão"}
        </div>
        <button style={{ ...S.btnS, fontSize: 10 }} onClick={voltarSessoes}>
          ← SESSÕES
        </button>
      </div>

      <div style={{ ...S.pg, textAlign: "center", paddingTop: 52 }}>
        <div style={{ fontSize: 50, marginBottom: 12 }}>⚡</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: 6, margin: 0 }}>JORNADAS LT</h1>
        <p style={{ fontSize: 11, color: C.gold, letterSpacing: 4, margin: "8px 0 20px" }}>
          SIMULADOR DE EQUIPES DE ALTA PERFORMANCE
        </p>
        <p style={{ maxWidth: 520, margin: "0 auto 32px", color: C.txt2, fontSize: 13, lineHeight: 1.9 }}>
          "O sucesso desta obra não depende de sorte, mas da capacidade de vocês, líderes, dimensionarem a força de trabalho correta."
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 36 }}>
          {[["💰","CUSTO","30%",C.yellow],["⏱️","DURAÇÃO","30%",C.blueL],["🦺","SEGURANÇA","40%",C.greenL]].map(([ic,l,p,col]) => (
            <div key={l} style={{ ...S.stat, minWidth: 110, borderColor: col + "44" }}>
              <div style={{ fontSize: 20 }}>{ic}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: col }}>{p}</div>
              <div style={{ fontSize: 8, color: C.txt3, letterSpacing: 2 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button style={{ ...S.btnP, fontSize: 12 }} onClick={() => { setRole("F"); setScreen("config"); }}>
            ⚙️ FACILITADOR
          </button>
          <button style={{ ...S.btnS, fontSize: 12 }} onClick={() => setScreen("grupo-login")}>
            👥 GRUPO
          </button>
        </div>
      </div>
    </div>
  );
}

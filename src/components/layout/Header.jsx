import { C } from "../../constants/colors";
import { S } from "../../styles";
import { useApp } from "../../context/AppContext";

const navF = [["config","⚙ LT"],["grupos","👥 GRUPOS"],["atividades","📋 ATIVIDADES"],["equipe-base","👷 EQ. BASE"],["requisitos","🛡️ REQUISITOS"],["composicao","🔧 COMPOSIÇÃO"],["cronograma","📅 CRONOGRAMA"],["ranking","🏆 RANKING"]];
const navG = [["composicao","🔧 COMPOSIÇÃO"],["cronograma","📅 CRONOGRAMA"]];

export default function Header() {
  const { screen, setScreen, role, setRole, setActiveSessionId, grupos, gIdx, sess } = useApp();

  const logout = () => {
    setRole(null);
    setActiveSessionId(null);
    setScreen("login");
  };

  // Facilitador volta para lista de sessões (permanece autenticado)
  const voltarSessoes = () => {
    setActiveSessionId(null);
    setScreen("session-manager");
  };

  return (
    <header style={S.hdr}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 30, height: 30, background: `linear-gradient(135deg,${C.gold},${C.goldDim})`,
          borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#FFF"
        }}>⚡</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3 }}>JORNADAS LT</div>
          <div style={{ fontSize: 8, letterSpacing: 1 }}>
            {sess && <span style={{ color: C.goldL }}>{sess.nome}</span>}
            {role === "G" && grupos[gIdx] && (
              <span style={{ color: C.txt3 }}> · {grupos[gIdx].nome}</span>
            )}
          </div>
        </div>
      </div>
      <nav style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {(role === "F" ? navF : navG).map(([s, l]) => (
          <button key={s} style={S.nb(screen === s)} onClick={() => setScreen(s)}>{l}</button>
        ))}
        {role === "F" && (
          <button
            style={{ ...S.nb(false), marginLeft: 8 }}
            onClick={voltarSessoes}
            title="Voltar às sessões"
          >
            ☰ SESSÕES
          </button>
        )}
        <button
          style={{ ...S.nb(false), marginLeft: role === "F" ? 2 : 8, color: C.redL + "CC", borderColor: C.redL + "44" }}
          onClick={logout}
          title="Sair"
        >
          SAIR
        </button>
      </nav>
    </header>
  );
}

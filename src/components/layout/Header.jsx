import { C } from "../../constants/colors";
import { S } from "../../styles";
import { useApp } from "../../context/AppContext";

const navF = [["config","⚙ LT"],["grupos","👥 GRUPOS"],["atividades","📋 ATIVIDADES"],["requisitos","🛡️ REQUISITOS"],["ranking","🏆 RANKING"]];
const navG = [["composicao","🔧 COMPOSIÇÃO"],["cronograma","📅 CRONOGRAMA"],["ranking","🏆 RANKING"]];

export default function Header() {
  const { screen, setScreen, role, setRole, grupos, gIdx } = useApp();
  return (
    <header style={S.hdr}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 30, height: 30, background: `linear-gradient(135deg,${C.gold},${C.goldDim})`,
          borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#FFF"
        }}>⚡</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3 }}>JORNADAS LT</div>
          <div style={{ fontSize: 8, color: C.txt3, letterSpacing: 2 }}>
            {role === "F" ? "FACILITADOR" : "GRUPO — " + (grupos[gIdx]?.nome || "")}
          </div>
        </div>
      </div>
      <nav style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {(role === "F" ? navF : navG).map(([s, l]) => (
          <button key={s} style={S.nb(screen === s)} onClick={() => setScreen(s)}>{l}</button>
        ))}
        <button style={{ ...S.nb(false), marginLeft: 8 }} onClick={() => { setScreen("intro"); setRole(null); }}>↩</button>
      </nav>
    </header>
  );
}

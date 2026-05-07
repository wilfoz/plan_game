import { useState } from "react";
import { C } from "../constants/colors";
import { S } from "../styles";
import { useApp } from "../context/AppContext";

const SENHA_FACILITADOR = "elecnorbrasil";

export default function Login() {
  const { sessions, setRole, setGIdx, setActiveSessionId, setScreen } = useApp();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const handleLogin = () => {
    setErro("");
    const usr = usuario.trim();
    if (!usr || !senha) { setErro("Preencha usuário e senha."); return; }

    if (usr.toUpperCase() === "FACILITADOR") {
      if (senha === SENHA_FACILITADOR) {
        setRole("F");
        setScreen("session-manager");
      } else {
        setErro("Senha incorreta.");
        setSenha("");
      }
      return;
    }

    // Busca o grupo em todas as sessões
    for (const s of sessions) {
      const idx = s.grupos.findIndex(
        g => g.nome.toUpperCase() === usr.toUpperCase() && g.senha === senha
      );
      if (idx !== -1) {
        setActiveSessionId(s.id);
        setGIdx(idx);
        setRole("G");
        setScreen("composicao");
        return;
      }
    }

    const nomeExiste = sessions.some(s =>
      s.grupos.some(g => g.nome.toUpperCase() === usr.toUpperCase())
    );
    setErro(nomeExiste ? "Senha incorreta." : "Grupo não encontrado em nenhuma sessão.");
    setSenha("");
  };

  return (
    <div style={{
      ...S.app, display: "flex", alignItems: "center",
      justifyContent: "center", minHeight: "100vh"
    }}>
      <div style={{ width: "100%", maxWidth: 400, padding: "0 20px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 60, height: 60, margin: "0 auto 16px",
            background: `linear-gradient(135deg,${C.gold},${C.goldDim})`,
            borderRadius: 14, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 28
          }}>⚡</div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 6 }}>JORNADAS LT</div>
          <div style={{ fontSize: 10, color: C.gold, letterSpacing: 4, marginTop: 6 }}>
            SIMULADOR DE ALTA PERFORMANCE
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: "28px 28px 24px"
        }}>
          <div style={{ fontSize: 10, color: C.txt3, letterSpacing: 3, marginBottom: 20, textAlign: "center" }}>
            IDENTIFICAÇÃO
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 9, color: C.txt3, letterSpacing: 2, marginBottom: 5 }}>
              USUÁRIO
            </label>
            <input
              value={usuario}
              onChange={e => { setUsuario(e.target.value); setErro(""); }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="FACILITADOR ou nome do grupo..."
              autoFocus
              style={{
                width: "100%", background: C.surf2,
                border: `1px solid ${erro ? C.redL + "88" : C.border2}`,
                borderRadius: 5, padding: "10px 12px", fontSize: 13, color: C.txt,
                outline: "none", boxSizing: "border-box", fontFamily: "inherit"
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 9, color: C.txt3, letterSpacing: 2, marginBottom: 5 }}>
              SENHA
            </label>
            <input
              type="password"
              value={senha}
              onChange={e => { setSenha(e.target.value); setErro(""); }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="••••••••"
              style={{
                width: "100%", background: C.surf2,
                border: `1px solid ${erro ? C.redL + "88" : C.border2}`,
                borderRadius: 5, padding: "10px 12px", fontSize: 13, color: C.txt,
                outline: "none", boxSizing: "border-box", fontFamily: "inherit"
              }}
            />
          </div>

          {erro && (
            <div style={{
              marginBottom: 14, padding: "8px 12px", borderRadius: 5,
              background: C.redL + "12", border: `1px solid ${C.redL}44`,
              fontSize: 11, color: C.redL, textAlign: "center"
            }}>
              {erro}
            </div>
          )}

          <button
            onClick={handleLogin}
            style={{
              width: "100%", padding: "11px", borderRadius: 5, cursor: "pointer",
              background: `linear-gradient(135deg,${C.gold},${C.goldDim})`,
              border: "none", color: "#000", fontSize: 12, fontWeight: 700,
              letterSpacing: 2, fontFamily: "inherit"
            }}
          >
            ENTRAR →
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { C } from "../constants/colors";
import { S } from "../styles";
import { useApp } from "../context/AppContext";
import { supabase } from "../lib/supabase";

if (!import.meta.env.VITE_FACILITADOR_SENHA) console.warn("VITE_FACILITADOR_SENHA não definida");
const SENHA_FACILITADOR = import.meta.env.VITE_FACILITADOR_SENHA ?? "";

const inputStyle = (erro, disabled) => ({
  width: "100%", background: C.surf2,
  border: `1px solid ${erro ? C.redL + "88" : C.border2}`,
  borderRadius: 5, padding: "10px 12px", fontSize: 13, color: C.txt,
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  opacity: disabled ? 0.6 : 1,
});

export default function Login() {
  const { setRole, setGIdx, setActiveSessionId, setScreen } = useApp();

  const [usuario, setUsuario]   = useState("");
  const [senha, setSenha]       = useState("");
  const [erro, setErro]         = useState("");
  const [carregando, setCarregando] = useState(false);

  // Seletor de sessão
  const [sessoes, setSessoes]   = useState(null); // null = tela de login; array = tela de seleção

  const entrarNaSessao = (s) => {
    setActiveSessionId(s.session_id);
    setGIdx(s.grupo_idx);
    setRole("G");
    setScreen("composicao");
  };

  const handleLogin = async () => {
    setErro("");
    const usr = usuario.trim();
    if (!usr || !senha) { setErro("Preencha usuário e senha."); return; }

    // ── Facilitador ─────────────────────────────────────────────────────────
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

    // ── Grupo ────────────────────────────────────────────────────────────────
    setCarregando(true);
    try {
      const { data, error } = await supabase.rpc("login_grupo", {
        p_nome: usr,
        p_senha: senha,
      });

      if (error) throw error;

      if (data && data.length === 1) {
        // Apenas uma sessão — entra direto
        entrarNaSessao(data[0]);
      } else if (data && data.length > 1) {
        // Múltiplas sessões — exibe seletor
        setSessoes(data);
      } else {
        const { data: exists } = await supabase
          .from("grupos")
          .select("id")
          .ilike("nome", usr)
          .limit(1);
        setErro(exists?.length ? "Senha incorreta." : "Grupo não encontrado em nenhuma sessão.");
        setSenha("");
      }
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{
      ...S.app, display: "flex", alignItems: "center",
      justifyContent: "center", minHeight: "100vh"
    }}>
      <div style={{ width: "100%", maxWidth: 420, padding: "0 20px" }}>

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

        {/* ── Seletor de sessão ── */}
        {sessoes ? (
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: "28px 28px 24px"
          }}>
            <div style={{ fontSize: 10, color: C.txt3, letterSpacing: 3, marginBottom: 4, textAlign: "center" }}>
              SELECIONE A SESSÃO
            </div>
            <div style={{ fontSize: 11, color: C.txt2, textAlign: "center", marginBottom: 20 }}>
              {usuario.toUpperCase()} está cadastrado em {sessoes.length} sessões.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sessoes.map(s => (
                <button
                  key={s.session_id}
                  onClick={() => entrarNaSessao(s)}
                  style={{
                    padding: "12px 16px", borderRadius: 6, cursor: "pointer",
                    background: C.surf2, border: `1px solid ${C.border2}`,
                    color: C.txt, fontSize: 13, fontWeight: 600,
                    fontFamily: "inherit", textAlign: "left",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = C.gold}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.border2}
                >
                  <span>{s.session_nome}</span>
                  <span style={{ fontSize: 10, color: C.gold, letterSpacing: 1 }}>ENTRAR →</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => { setSessoes(null); setSenha(""); setErro(""); }}
              style={{
                marginTop: 16, width: "100%", padding: "8px",
                background: "transparent", border: `1px solid ${C.border}`,
                borderRadius: 5, color: C.txt3, fontSize: 11,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              ← Voltar
            </button>
          </div>
        ) : (

        /* ── Formulário de login ── */
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
              disabled={carregando}
              style={inputStyle(erro, carregando)}
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
              disabled={carregando}
              style={inputStyle(erro, carregando)}
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
            disabled={carregando}
            style={{
              width: "100%", padding: "11px", borderRadius: 5,
              cursor: carregando ? "not-allowed" : "pointer",
              background: carregando
                ? C.surf2
                : `linear-gradient(135deg,${C.gold},${C.goldDim})`,
              border: "none",
              color: carregando ? C.txt3 : "#000",
              fontSize: 12, fontWeight: 700,
              letterSpacing: 2, fontFamily: "inherit",
              transition: "all 0.15s",
            }}
          >
            {carregando ? "VERIFICANDO..." : "ENTRAR →"}
          </button>
        </div>
        )}
      </div>
    </div>
  );
}

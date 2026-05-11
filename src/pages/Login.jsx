import { useState, useEffect } from "react";
import logoSvg from "../assets/logo.svg";
import { C } from "../constants/colors";
import { S } from "../styles";
import { useApp } from "../context/AppContext";
import { supabase } from "../lib/supabase";

// ── Rate limiting (client-side, por chave no localStorage) ─────────────────
const MAX_ATTEMPTS   = 5;
const LOCKOUT_MS     = 15 * 60 * 1000; // 15 minutos
const LS_KEY         = "jlt_login_attempts";

function getRecord(type) {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "{}")[type] ?? {}; }
  catch { return {}; }
}
function saveRecord(type, rec) {
  try {
    const all = JSON.parse(localStorage.getItem(LS_KEY) ?? "{}");
    localStorage.setItem(LS_KEY, JSON.stringify({ ...all, [type]: rec }));
  } catch { /* */ }
}
function secondsLocked(type) {
  const { lockedUntil = 0 } = getRecord(type);
  const remaining = lockedUntil - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}
function registerFail(type) {
  const rec = getRecord(type);
  const count = (rec.count ?? 0) + 1;
  const lockedUntil = count >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : (rec.lockedUntil ?? 0);
  saveRecord(type, { count, lockedUntil });
  return count;
}
function clearRecord(type) {
  saveRecord(type, {});
}

const inputStyle = (hasErro, disabled) => ({
  width: "100%", background: C.surf2,
  border: `1px solid ${hasErro ? C.redL + "88" : C.border2}`,
  borderRadius: 5, padding: "10px 12px", fontSize: 13, color: C.txt,
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  opacity: disabled ? 0.6 : 1,
});

export default function Login() {
  const { setRole, setGIdx, setActiveSessionId, setScreen, setCopyOptions } = useApp();

  const [usuario, setUsuario]       = useState("");
  const [senha, setSenha]           = useState("");
  const [erro, setErro]             = useState("");
  const [carregando, setCarregando] = useState(false);
  const [sessoes, setSessoes]       = useState(null);
  const [bloqueioSeg, setBloqueioSeg] = useState(0); // segundos restantes de bloqueio

  // Contador regressivo de bloqueio
  useEffect(() => {
    if (bloqueioSeg <= 0) return;
    const t = setTimeout(() => setBloqueioSeg(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [bloqueioSeg]);

  const entrarNaSessao = async (s, allSessoes = []) => {
    setActiveSessionId(s.session_id);
    setGIdx(s.grupo_idx);
    setRole("G");

    const others = allSessoes.filter(x => x.session_id !== s.session_id);
    if (others.length > 0) {
      try {
        // 1. Verifica se o grupo já tem recursos na sessão atual
        const { data: currentGrupoArr } = await supabase
          .from("grupos")
          .select("id")
          .eq("session_id", s.session_id)
          .ilike("nome", usuario.trim())
          .limit(1);

        const currentGrupoId = currentGrupoArr?.[0]?.id;

        if (currentGrupoId) {
          const { data: currentComps } = await supabase
            .from("grupo_comps")
            .select("mo_rows, eq_rows")
            .eq("grupo_id", currentGrupoId);

          const jaTemRecursos = (currentComps ?? []).some(
            r => (r.mo_rows?.length > 0) || (r.eq_rows?.length > 0)
          );

          // Se já tem recursos → entra direto sem oferecer cópia
          if (jaTemRecursos) {
            setScreen("composicao");
            return;
          }
        }

        // 2. Sessão atual vazia → verifica se há recursos em outras sessões para copiar
        const { data: srcGrupos } = await supabase
          .from("grupos")
          .select("id, session_id")
          .ilike("nome", usuario.trim())
          .in("session_id", others.map(o => o.session_id));

        if (srcGrupos?.length) {
          const { data: srcComps } = await supabase
            .from("grupo_comps")
            .select("grupo_id, mo_rows, eq_rows")
            .in("grupo_id", srcGrupos.map(g => g.id));

          const withComps = srcGrupos.filter(g =>
            srcComps?.some(c =>
              c.grupo_id === g.id &&
              ((c.mo_rows?.length > 0) || (c.eq_rows?.length > 0))
            )
          );

          if (withComps.length > 0) {
            setCopyOptions(withComps.map(g => ({
              grupo_id: g.id,
              session_id: g.session_id,
              session_nome: others.find(o => o.session_id === g.session_id)?.session_nome ?? "Sessão anterior",
            })));
            setScreen("copiar-composicao");
            return;
          }
        }
      } catch { /* prossegue normalmente em caso de erro */ }
    }

    setScreen("composicao");
  };

  const handleLogin = async () => {
    setErro("");
    const usr = usuario.trim();
    if (!usr || !senha) { setErro("Preencha usuário e senha."); return; }

    const tipo = usr.toUpperCase() === "FACILITADOR" ? "facilitador" : "grupo";

    // Verificar bloqueio
    const locked = secondsLocked(tipo);
    if (locked > 0) {
      const min = Math.ceil(locked / 60);
      setErro(`Muitas tentativas. Aguarde ${min} min${min > 1 ? "utos" : "uto"}.`);
      setBloqueioSeg(locked);
      return;
    }

    // ── Facilitador (verificação via RPC — senha nunca no bundle) ────────────
    if (tipo === "facilitador") {
      setCarregando(true);
      try {
        const { data: ok, error } = await supabase.rpc("login_facilitador", { p_senha: senha });
        if (error) throw error;
        if (ok) {
          clearRecord("facilitador");
          setRole("F");
          setScreen("session-manager");
        } else {
          const count = registerFail("facilitador");
          const remaining = MAX_ATTEMPTS - count;
          setErro(remaining > 0
            ? `Senha incorreta. ${remaining} tentativa${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}.`
            : `Conta bloqueada por 15 minutos após ${MAX_ATTEMPTS} tentativas.`
          );
          if (remaining <= 0) setBloqueioSeg(LOCKOUT_MS / 1000);
          setSenha("");
        }
      } catch {
        setErro("Erro de conexão. Tente novamente.");
      } finally {
        setCarregando(false);
      }
      return;
    }

    // ── Grupo (verificação via RPC com bcrypt) ────────────────────────────────
    setCarregando(true);
    try {
      const { data, error } = await supabase.rpc("login_grupo", {
        p_nome:  usr,
        p_senha: senha,
      });

      if (error) throw error;

      if (data && data.length === 1) {
        clearRecord("grupo");
        entrarNaSessao(data[0], data);
      } else if (data && data.length > 1) {
        clearRecord("grupo");
        setSessoes(data);
      } else {
        const { data: exists } = await supabase
          .from("grupos")
          .select("id")
          .ilike("nome", usr)
          .limit(1);

        if (exists?.length) {
          const count = registerFail("grupo");
          const remaining = MAX_ATTEMPTS - count;
          setErro(remaining > 0
            ? `Senha incorreta. ${remaining} tentativa${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}.`
            : `Conta bloqueada por 15 minutos após ${MAX_ATTEMPTS} tentativas.`
          );
          if (remaining <= 0) setBloqueioSeg(LOCKOUT_MS / 1000);
        } else {
          setErro("Grupo não encontrado em nenhuma sessão.");
        }
        setSenha("");
      }
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  const locked = bloqueioSeg > 0;

  return (
    <div style={{
      ...S.app, display: "flex", alignItems: "center",
      justifyContent: "center", minHeight: "100vh"
    }}>
      <div style={{ width: "100%", maxWidth: 420, padding: "0 20px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 96, height: 96, margin: "0 auto 16px",
            borderRadius: 14, display: "flex", alignItems: "center",
            justifyContent: "center",
          }}>
            <img src={logoSvg} alt="Logo" style={{ width: 64, height: 64 }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 6 }}>DIMENSIONAMENTO ESTRATÉGICO E SEGURO</div>
          <div style={{ fontSize: 10, color: C.gold, letterSpacing: 4, marginTop: 6 }}>
            5ª JORNADA DE SEGURANÇA · GRANDES REDES
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
                  onClick={() => entrarNaSessao(s, sessoes)}
                  style={{
                    padding: "12px 16px", borderRadius: 6, cursor: "pointer",
                    background: C.surf2, border: `1px solid ${C.border2}`,
                    color: C.txt, fontSize: 13, fontWeight: 600,
                    fontFamily: "inherit", textAlign: "left",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
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
              onKeyDown={e => e.key === "Enter" && !locked && !carregando && handleLogin()}
              placeholder="FACILITADOR ou nome do grupo..."
              autoFocus
              disabled={carregando || locked}
              style={inputStyle(erro, carregando || locked)}
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
              onKeyDown={e => e.key === "Enter" && !locked && !carregando && handleLogin()}
              placeholder="••••••••"
              disabled={carregando || locked}
              style={inputStyle(erro, carregando || locked)}
            />
          </div>

          {locked && (
            <div style={{
              marginBottom: 14, padding: "8px 12px", borderRadius: 5,
              background: C.yellow + "12", border: `1px solid ${C.yellow}44`,
              fontSize: 11, color: C.yellow, textAlign: "center"
            }}>
              Bloqueado por muitas tentativas. Aguarde {Math.ceil(bloqueioSeg / 60)} min.
            </div>
          )}

          {!locked && erro && (
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
            disabled={carregando || locked}
            style={{
              width: "100%", padding: "11px", borderRadius: 5,
              cursor: carregando || locked ? "not-allowed" : "pointer",
              background: carregando || locked
                ? C.surf2
                : `linear-gradient(135deg,${C.gold},${C.goldDim})`,
              border: "none",
              color: carregando || locked ? C.txt3 : "#000",
              fontSize: 12, fontWeight: 700,
              letterSpacing: 2, fontFamily: "inherit",
            }}
          >
            {carregando ? "VERIFICANDO..." : locked ? `BLOQUEADO (${bloqueioSeg}s)` : "ENTRAR →"}
          </button>
        </div>
        )}
      </div>
    </div>
  );
}

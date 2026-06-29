import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import logoSvg from "../assets/logo.svg";
import { C } from "../constants/colors";
import { S } from "../styles";
import { useApp } from "../context/AppContext";
import { supabase } from "../lib/supabase";

// ── Rate limiting (client-side, por chave no localStorage) ─────────────────
const MAX_ATTEMPTS   = 10;
const LOCKOUT_MS     = 15 * 60 * 1000; // 15 minutos
const LS_KEY         = "jlt_login_attempts";

interface AttemptRecord {
  count?: number;
  lockedUntil?: number;
}

function getRecord(type: string): AttemptRecord {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw)[type] ?? {}) : {};
  }
  catch { return {}; }
}

function saveRecord(type: string, rec: AttemptRecord) {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const all = raw ? JSON.parse(raw) : {};
    localStorage.setItem(LS_KEY, JSON.stringify({ ...all, [type]: rec }));
  } catch { /* */ }
}

function secondsLocked(type: string): number {
  const { lockedUntil = 0 } = getRecord(type);
  const remaining = lockedUntil - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

function registerFail(type: string): number {
  const rec = getRecord(type);
  const count = (rec.count ?? 0) + 1;
  const lockedUntil = count >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : (rec.lockedUntil ?? 0);
  saveRecord(type, { count, lockedUntil });
  return count;
}

function clearRecord(type: string) {
  saveRecord(type, {});
}

const inputStyle = (hasErro: boolean, disabled: boolean) => ({
  width: "100%", background: C.surf2,
  border: `1px solid ${hasErro ? C.redL + "88" : C.border2}`,
  borderRadius: 5, padding: "10px 12px", fontSize: 13, color: C.txt,
  outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit",
  opacity: disabled ? 0.6 : 1,
});

export default function Login() {
  const { t } = useTranslation();
  const { setRole, setGIdx, setActiveSessionId, setScreen, setCopyOptions, setActiveEventId, setActiveEventNome, setAdminToken, userSessions, setUserSessions } = useApp();

  const [usuario, setUsuario]       = useState("");
  const [senha, setSenha]           = useState("");
  const [erro, setErro]             = useState("");
  const [carregando, setCarregando] = useState(false);
  const [sessoes, setSessoes]       = useState<any[] | null>(null);
  const [bloqueioSeg, setBloqueioSeg] = useState(0); // segundos restantes de bloqueio

  // Contador regressivo de bloqueio
  useEffect(() => {
    if (bloqueioSeg <= 0) return;
    const t = setTimeout(() => setBloqueioSeg(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [bloqueioSeg]);

  // Se já temos sessões salvas no contexto e nenhuma sessão ativa selecionada, exibe o seletor
  useEffect(() => {
    if (userSessions && userSessions.length > 1 && !sessoes) {
      setSessoes(userSessions);
      // Se tivermos as sessões, podemos tentar deduzir o login digitado anteriormente
      const firstSess = userSessions[0];
      if (firstSess && firstSess.grupo_nome && !usuario) {
        setUsuario(firstSess.grupo_nome);
      }
    }
  }, [userSessions, sessoes]);

  const entrarNaSessao = async (s: any, allSessoes: any[] = []) => {
    setActiveSessionId(s.session_id);
    setGIdx(s.grupo_idx);
    setRole("G");
    // O grupo pertence ao evento (jornada) da sessão escolhida.
    setActiveEventId(s.event_id ?? null);
    setActiveEventNome(s.event_nome ?? "");

    // Isolamento por evento: a partir daqui o grupo só enxerga/troca entre as
    // sessões do PRÓPRIO evento, nunca de outra jornada (mesmo com nome igual).
    const sameEvent = (allSessoes ?? []).filter(x => x.event_id === s.event_id);
    setUserSessions(sameEvent);

    const others = sameEvent.filter(x => x.session_id !== s.session_id);
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
            (r: any) => (r.mo_rows?.length > 0) || (r.eq_rows?.length > 0)
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
    if (!usr || !senha) { setErro(t("login.errorEmpty")); return; }

    const isAdmin = usr.toUpperCase() === "ADMIN" || usr.toUpperCase() === "ADMINISTRADOR";
    const lockKey = isAdmin ? "admin" : "user";

    // Verificar bloqueio
    const locked = secondsLocked(lockKey);
    if (locked > 0) {
      const min = Math.ceil(locked / 60);
      setErro(t("login.lockout", { min }));
      setBloqueioSeg(locked);
      return;
    }

    setCarregando(true);
    try {
      if (isAdmin) {
        // 1. Tentar Login do Administrador (retorna token de sessão, não trafega/guarda senha)
        const { data: token, error } = await supabase.rpc("login_admin_session", { p_senha: senha });
        if (error) throw error;
        if (token) {
          clearRecord("admin");
          setAdminToken(token);
          setRole("ADMIN");
          setScreen("admin_dashboard");
        } else {
          const count = registerFail("admin");
          const remaining = MAX_ATTEMPTS - count;
          setErro(remaining > 0
            ? t("login.wrongPassword", { remaining })
            : t("login.accountLocked")
          );
          if (remaining <= 0) setBloqueioSeg(LOCKOUT_MS / 1000);
          setSenha("");
        }
      } else {
        // 2. Tentar Login de Facilitador de Evento
        const { data: facData, error: facErr } = await supabase.rpc("login_event_facilitador", {
          p_login: usr,
          p_senha: senha
        });
        if (facErr) throw facErr;
        
        if (facData && facData.length === 1) {
          clearRecord("user");
          setActiveEventId(facData[0].event_id);
          setActiveEventNome(facData[0].event_nome);
          setRole("F");
          setScreen("session-manager");
        } else {
          // 3. Tentar Login de Grupo
          const { data: grpData, error: grpErr } = await supabase.rpc("login_grupo", {
            p_nome: usr,
            p_senha: senha
          });
          if (grpErr) throw grpErr;

          if (grpData && grpData.length === 1) {
            clearRecord("user");
            setActiveEventId(grpData[0].event_id);
            setUserSessions(grpData);
            entrarNaSessao(grpData[0], grpData);
          } else if (grpData && grpData.length > 1) {
            clearRecord("user");
            setActiveEventId(grpData[0].event_id);
            setUserSessions(grpData);
            setSessoes(grpData);
          } else {
            const count = registerFail("user");
            const remaining = MAX_ATTEMPTS - count;
            setErro(remaining > 0
              ? t("login.wrongPassword", { remaining })
              : t("login.accountLocked")
            );
            if (remaining <= 0) setBloqueioSeg(LOCKOUT_MS / 1000);
            setSenha("");
          }
        }
      }
    } catch (e: any) {
      // Bloqueio aplicado pelo servidor (rate limit autoritativo): 'rate_limited:<segundos>'
      const m = String(e?.message ?? "").match(/rate_limited:(\d+)/);
      if (m) {
        const secs = parseInt(m[1], 10);
        setBloqueioSeg(secs);
        setErro(t("login.lockout", { min: Math.ceil(secs / 60) }));
      } else {
        setErro(t("login.connError"));
      }
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
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 6 }}>{t("header.tagline")}</div>
        </div>

        {/* ── Seletor de sessão ── */}
        {sessoes ? (
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: "28px 28px 24px"
          }}>
            <div style={{ fontSize: 10, color: C.txt3, letterSpacing: 3, marginBottom: 4, textAlign: "center" }}>
              {t("login.selectSession")}
            </div>
            <div style={{ fontSize: 11, color: C.txt2, textAlign: "center", marginBottom: 20 }}>
              {t("login.registeredSessions", { user: usuario.toUpperCase(), count: sessoes.length })}
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
                  <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span>{s.session_nome}</span>
                    {s.event_nome && (
                      <span style={{ fontSize: 9, color: C.txt3, letterSpacing: 1, fontWeight: 400 }}>
                        {t("login.eventLabel", { event: s.event_nome })}
                      </span>
                    )}
                  </span>
                  <span style={{ fontSize: 10, color: C.gold, letterSpacing: 1 }}>{t("login.sessionEnter")}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => { setUserSessions([]); setSessoes(null); setSenha(""); setErro(""); }}
              style={{
                marginTop: 16, width: "100%", padding: "8px",
                background: "transparent", border: `1px solid ${C.border}`,
                borderRadius: 5, color: C.txt3, fontSize: 11,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {t("common.back")}
            </button>
          </div>
        ) : (

        /* ── Formulário de login ── */
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: "28px 28px 24px"
        }}>
          <div style={{ fontSize: 10, color: C.txt3, letterSpacing: 3, marginBottom: 20, textAlign: "center" }}>
            {t("login.identification")}
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 9, color: C.txt3, letterSpacing: 2, marginBottom: 5 }}>
              {t("login.user")}
            </label>
            <input
              value={usuario}
              onChange={e => { setUsuario(e.target.value); setErro(""); }}
              onKeyDown={e => e.key === "Enter" && !locked && !carregando && handleLogin()}
              placeholder={t("login.userPlaceholder")}
              autoFocus
              disabled={carregando || locked}
              style={inputStyle(erro !== "", carregando || locked)}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 9, color: C.txt3, letterSpacing: 2, marginBottom: 5 }}>
              {t("login.password")}
            </label>
            <input
              type="password"
              value={senha}
              onChange={e => { setSenha(e.target.value); setErro(""); }}
              onKeyDown={e => e.key === "Enter" && !locked && !carregando && handleLogin()}
              placeholder={t("login.passPlaceholder")}
              disabled={carregando || locked}
              style={inputStyle(erro !== "", carregando || locked)}
            />
          </div>

          {locked && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              <div style={{
                padding: "8px 12px", borderRadius: 5,
                background: C.yellow + "12", border: `1px solid ${C.yellow}44`,
                fontSize: 11, color: C.yellow, textAlign: "center"
              }}>
                {t("login.lockoutTimer", { min: Math.ceil(bloqueioSeg / 60) })}
              </div>
              <div style={{
                padding: "8px 12px", borderRadius: 5,
                background: C.surf2, border: `1px solid ${C.border2}`,
                fontSize: 10, color: C.txt3, textAlign: "left", lineHeight: 1.4
              }}>
                {usuario.toUpperCase() === "ADMIN" || usuario.toUpperCase() === "ADMINISTRADOR"
                  ? t("login.lockoutSupportFacilitator")
                  : t("login.lockoutSupport")
                }
              </div>
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
            {carregando ? t("login.checking") : locked ? `${t("login.locked", { seg: bloqueioSeg })}` : t("login.button")}
          </button>
        </div>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { C } from "../../constants/colors";
import { S } from "../../styles";
import { useApp } from "../../context/AppContext";
import TutorialModal from "../ui/TutorialModal";
import { useIsMutating } from "@tanstack/react-query";

export default function Header() {
  const { t, i18n } = useTranslation();
  const {
    screen,
    setScreen,
    role,
    setRole,
    setActiveSessionId,
    grupos,
    gIdx,
    sess,
    lang,
    logout,
    adminSenha,
    setActiveEventId,
    setActiveEventNome,
    userSessions
  } = useApp();

  const [menuAberto, setMenuAberto] = useState(false);
  const [tutorialAberto, setTutorialAberto] = useState(false);
  const isMutating = useIsMutating();

  // Facilitador volta para lista de sessões (permanece autenticado)
  const voltarSessoes = () => {
    setActiveSessionId(null);
    setScreen("session-manager");
    setMenuAberto(false);
  };

  const irParaPainelAdmin = () => {
    setActiveSessionId(null);
    setActiveEventId(null);
    setActiveEventNome(null);
    setRole("ADMIN");
    setScreen("admin_dashboard");
    setMenuAberto(false);
  };

  // Definição dos menus baseados em chaves de tradução
  const navF = [
    ["config", t("header.nav.engineering")],
    ["grupos", t("header.nav.groups")],
    ["atividades", t("header.nav.activities")],
    ["equipe-base", t("header.nav.baseTeam")],
    ["requisitos", t("header.nav.requirements")],
    ["composicao", t("header.nav.compositions")],
    ["cronograma", t("header.nav.gantt")],
    ["ranking", t("header.nav.ranking")]
  ];

  const navG = [
    ["composicao", t("header.nav.compositions")],
    ["cronograma", t("header.nav.gantt")]
  ];

  const handleNavClick = (tela: string) => {
    setScreen(tela);
    setMenuAberto(false);
  };

  const navItems = role === "F" ? navF : navG;

  return (
    <header style={{ ...S.hdr, position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 30, height: 30, background: `linear-gradient(135deg,${C.gold},${C.goldDim})`,
          borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#FFF"
        }}>⚡</div>
        <div style={{ textAlign: "left" }}>
          <div className="header-title-desktop" style={{ fontWeight: 700 }}>
            {t("header.tagline")}
          </div>
          <div style={{ fontSize: 8, letterSpacing: 1, display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
            {sess && <span style={{ color: C.goldL }}>{sess.nome}</span>}
            {role === "G" && grupos[gIdx] && (
              <span style={{ color: C.txt3 }}> · {grupos[gIdx].nome}</span>
            )}
            {isMutating > 0 ? (
              <span style={{ color: C.txt3, fontStyle: "italic", marginLeft: 4, display: "inline-flex", alignItems: "center", gap: 2 }}>
                <span>💾</span> {t("common.saving")}
              </span>
            ) : (
              <span style={{ color: C.greenL, marginLeft: 4, display: "inline-flex", alignItems: "center", gap: 2 }}>
                <span>✓</span> {lang === "es" ? "Guardado" : "Salvo"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navegação Desktop (escondida no mobile via CSS) */}
      <nav className="header-nav">
        {navItems.map(([s, label]) => (
          <button
            key={s}
            style={S.nb(screen === s)}
            onClick={() => handleNavClick(s)}
          >
            {label}
          </button>
        ))}

        {role === "F" && (
          <button
            style={{ ...S.nb(false), marginLeft: 8 }}
            onClick={voltarSessoes}
            title={t("common.sessions")}
          >
            {t("common.sessions")}
          </button>
        )}

        {role === "G" && userSessions && userSessions.length > 1 && (
          <button
            style={{ ...S.nb(false), marginLeft: 8, borderColor: C.gold, color: C.gold }}
            onClick={() => {
              setActiveSessionId(null);
              setScreen("login");
            }}
            title={lang === "es" ? "Cambiar Sesión" : "Trocar Sessão"}
          >
            🔀 {lang === "es" ? "SESSÕES" : "SESSÕES"}
          </button>
        )}

        {adminSenha && (
          <button
            style={{ ...S.nb(false), marginLeft: 8, borderColor: C.gold, color: C.gold }}
            onClick={irParaPainelAdmin}
          >
            ⬅ PAINEL ADMIN
          </button>
        )}

        <button
          style={{ ...S.nb(false), marginLeft: 8, borderColor: C.gold, color: C.gold }}
          onClick={() => setTutorialAberto(true)}
          title={t("tutorial.title")}
        >
          📖 TUTORIAL
        </button>

        {/* Widget Seletor de Idioma PT | ES */}
        <div style={{
          display: "flex",
          marginLeft: 8,
          border: `1px solid ${C.border}`,
          borderRadius: 5,
          overflow: "hidden",
          background: C.surface,
          alignItems: "center",
          height: 32
        }}>
          <button
            style={{
              background: lang === "pt" ? C.gold + "15" : "transparent",
              color: lang === "pt" ? C.gold : C.txt3,
              border: "none",
              padding: "0 12px",
              height: "100%",
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 36
            }}
            onClick={() => i18n.changeLanguage("pt-BR")}
          >
            PT
          </button>
          <div style={{ width: 1, height: 16, background: C.border }} />
          <button
            style={{
              background: lang === "es" ? C.gold + "15" : "transparent",
              color: lang === "es" ? C.gold : C.txt3,
              border: "none",
              padding: "0 12px",
              height: "100%",
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 36
            }}
            onClick={() => i18n.changeLanguage("es")}
          >
            ES
          </button>
        </div>

        <button
          style={{ ...S.nb(false), marginLeft: 8, color: C.redL + "CC", borderColor: C.redL + "44" }}
          onClick={() => { setMenuAberto(false); logout(); }}
          title={t("common.logout")}
        >
          {t("common.logout")}
        </button>
      </nav>

      {/* Botão do Menu Hambúrguer (exibido apenas no mobile via CSS) */}
      <button
        onClick={() => setMenuAberto(!menuAberto)}
        style={{
          background: "transparent",
          border: `1px solid ${C.border}`,
          borderRadius: 4,
          padding: "6px 10px",
          color: C.txt,
          fontSize: 16,
          cursor: "pointer",
        }}
        className="mobile-only"
      >
        {menuAberto ? "✕" : "☰"}
      </button>

      {/* Dropdown Menu Móvel */}
      {menuAberto && (
        <div className="header-menu-dropdown mobile-only">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {navItems.map(([s, label]) => (
              <button
                key={s}
                style={{
                  ...S.nb(screen === s),
                  width: "100%",
                  padding: "10px",
                  textAlign: "center"
                }}
                onClick={() => handleNavClick(s)}
              >
                {label}
              </button>
            ))}

            {role === "F" && (
              <button
                style={{ ...S.nb(false), width: "100%", padding: "10px" }}
                onClick={voltarSessoes}
              >
                {t("common.sessions")}
              </button>
            )}

            {role === "G" && userSessions && userSessions.length > 1 && (
              <button
                style={{ ...S.nb(false), width: "100%", padding: "10px", borderColor: C.gold, color: C.gold }}
                onClick={() => {
                  setActiveSessionId(null);
                  setScreen("login");
                  setMenuAberto(false);
                }}
              >
                🔀 {lang === "es" ? "SESIONES" : "SESSÕES"}
              </button>
            )}

            {adminSenha && (
              <button
                style={{
                  ...S.nb(false),
                  width: "100%",
                  padding: "10px",
                  borderColor: C.gold,
                  color: C.gold
                }}
                onClick={irParaPainelAdmin}
              >
                ⬅ PAINEL ADMIN
              </button>
            )}

            <button
              style={{
                ...S.nb(false),
                width: "100%",
                padding: "10px",
                borderColor: C.gold,
                color: C.gold
              }}
              onClick={() => { setTutorialAberto(true); setMenuAberto(false); }}
            >
              📖 TUTORIAL
            </button>
          </div>

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 12,
            borderTop: `1px solid ${C.border}`
          }}>
            {/* Widget Seletor de Idioma PT | ES (Mobile) */}
            <div style={{
              display: "flex",
              border: `1px solid ${C.border}`,
              borderRadius: 5,
              overflow: "hidden",
              background: C.surface,
              alignItems: "center",
              height: 44
            }}>
              <button
                style={{
                  background: lang === "pt" ? C.gold + "15" : "transparent",
                  color: lang === "pt" ? C.gold : C.txt3,
                  border: "none",
                  padding: "0 18px",
                  height: "100%",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 50
                }}
                onClick={() => { i18n.changeLanguage("pt-BR"); setMenuAberto(false); }}
              >
                PT
              </button>
              <div style={{ width: 1, height: 24, background: C.border }} />
              <button
                style={{
                  background: lang === "es" ? C.gold + "15" : "transparent",
                  color: lang === "es" ? C.gold : C.txt3,
                  border: "none",
                  padding: "0 18px",
                  height: "100%",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 50
                }}
                onClick={() => { i18n.changeLanguage("es"); setMenuAberto(false); }}
              >
                ES
              </button>
            </div>

            <button
              style={{
                ...S.nb(false),
                color: C.redL,
                borderColor: C.redL + "44",
                padding: "6px 16px"
              }}
              onClick={() => { setMenuAberto(false); logout(); }}
            >
              {t("common.logout")}
            </button>
          </div>
        </div>
      )}
      <TutorialModal isOpen={tutorialAberto} onClose={() => setTutorialAberto(false)} />
    </header>
  );
}

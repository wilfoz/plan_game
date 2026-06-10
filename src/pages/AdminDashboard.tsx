import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import { useApp } from "../context/AppContext";
import { C } from "../constants/colors";
import { S } from "../styles";
import { AdminDashboardData } from "../types";

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const { adminSenha, logout, lang, setActiveEventId, setActiveEventNome, setRole, setScreen } = useApp();
  const qc = useQueryClient();

  const [nome, setNome] = useState("");
  const [facLogin, setFacLogin] = useState("");
  const [facSenha, setFacSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  // 1. Query para buscar os dados do dashboard
  const { data: eventos = [], isLoading, error: queryErr } = useQuery<AdminDashboardData[]>({
    queryKey: ["admin_dashboard", adminSenha],
    queryFn: async () => {
      if (!adminSenha) return [];
      const { data, error } = await supabase.rpc("get_admin_dashboard_data", {
        p_admin_senha: adminSenha,
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!adminSenha,
  });

  // 2. Mutation para criar evento
  const createEventMutation = useMutation({
    mutationFn: async () => {
      setErro("");
      setSucesso("");
      if (!nome.trim() || !facLogin.trim() || !facSenha.trim()) {
        throw new Error("empty_fields");
      }
      if (!adminSenha) throw new Error("no_admin_pass");

      const { data, error } = await supabase.rpc("create_event", {
        p_admin_senha: adminSenha,
        p_nome: nome.trim(),
        p_fac_login: facLogin.trim(),
        p_fac_senha: facSenha,
      });

      if (error) {
        if (error.message.includes("unique") || error.code === "23505") {
          throw new Error("login_taken");
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      setNome("");
      setFacLogin("");
      setFacSenha("");
      setSucesso(t("common.save")); // Ou mensagem customizada se necessário
      qc.invalidateQueries({ queryKey: ["admin_dashboard"] });
    },
    onError: (err: any) => {
      if (err.message === "empty_fields") {
        setErro(t("admin.errorEmpty"));
      } else if (err.message === "login_taken") {
        setErro(t("admin.errorLoginTaken"));
      } else {
        setErro(t("admin.errorGeneric"));
      }
    },
  });

  // 3. Mutation para excluir evento
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      if (!adminSenha) throw new Error("no_admin_pass");
      const { error } = await supabase.rpc("delete_event", {
        p_admin_senha: adminSenha,
        p_event_id: eventId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_dashboard"] });
    },
    onError: () => {
      alert(t("admin.errorGeneric"));
    },
  });

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    createEventMutation.mutate();
  };

  const handleDeleteEvent = (eventId: string, eventNome: string) => {
    if (confirm(`${t("admin.confirmDelete")}\n\nEvento: ${eventNome}`)) {
      deleteEventMutation.mutate(eventId);
    }
  };

  const handleEnterEvent = (evt: AdminDashboardData) => {
    setActiveEventId(evt.event_id);
    setActiveEventNome(evt.event_nome);
    setRole("F");
    setScreen("session-manager");
  };

  // Cálculos de indicadores
  const totalEventos = eventos.length;
  const totalSessoes = eventos.reduce((acc, curr) => acc + Number(curr.total_sessions || 0), 0);
  const totalGrupos = eventos.reduce((acc, curr) => acc + Number(curr.total_groups || 0), 0);
  const mediaGruposPorEvento = totalEventos > 0 ? (totalGrupos / totalEventos).toFixed(1) : "0";

  return (
    <div style={{ ...S.app, display: "flex", flexDirection: "column" }}>
      {/* Header do Admin */}
      <header style={S.hdr}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30, height: 30, background: `linear-gradient(135deg,${C.gold},${C.goldDim})`,
            borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#FFF"
          }}>👑</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3 }}>{t("admin.title")}</div>
            <div style={{ fontSize: 8, color: C.gold, letterSpacing: 1 }}>
              ADMINISTRADOR
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* Widget Seletor de Idioma PT | ES */}
          <div style={{
            display: "flex",
            border: `1px solid ${C.border}`,
            borderRadius: 4,
            overflow: "hidden",
            background: C.surf3
          }}>
            <button
              style={{
                background: lang === "pt" ? C.gold : "transparent",
                color: lang === "pt" ? "#fff" : C.txt2,
                border: "none",
                padding: "4px 8px",
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onClick={() => i18n.changeLanguage("pt-BR")}
            >
              PT
            </button>
            <button
              style={{
                background: lang === "es" ? C.gold : "transparent",
                color: lang === "es" ? "#fff" : C.txt2,
                border: "none",
                padding: "4px 8px",
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onClick={() => i18n.changeLanguage("es")}
            >
              ES
            </button>
          </div>

          <button
            style={{ ...S.nb(false), color: C.redL + "CC", borderColor: C.redL + "44" }}
            onClick={logout}
          >
            {t("common.logout")}
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main style={S.pg}>
        {/* Cartões de Indicadores */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 24
        }}>
          <div style={S.stat}>
            <div style={{ fontSize: 9, color: C.txt3, letterSpacing: 2 }}>{t("admin.indicatorEvents").toUpperCase()}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.gold, marginTop: 4 }}>{totalEventos}</div>
          </div>
          <div style={S.stat}>
            <div style={{ fontSize: 9, color: C.txt3, letterSpacing: 2 }}>{t("admin.indicatorSessions").toUpperCase()}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.gold, marginTop: 4 }}>{totalSessoes}</div>
          </div>
          <div style={S.stat}>
            <div style={{ fontSize: 9, color: C.txt3, letterSpacing: 2 }}>{t("admin.indicatorGroups").toUpperCase()}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.gold, marginTop: 4 }}>{totalGrupos}</div>
          </div>
          <div style={S.stat}>
            <div style={{ fontSize: 9, color: C.txt3, letterSpacing: 2 }}>MÉDIA GRUPOS / EVENTO</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.gold, marginTop: 4 }}>{mediaGruposPorEvento}</div>
          </div>
        </div>

        {/* Layout 2 Colunas */}
        <div className="admin-grid-layout">
          {/* Coluna da Esquerda: Formulário de Cadastro */}
          <div style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: 24
          }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 20, borderBottom: `1px solid ${C.border}`, paddingBottom: 10 }}>
              {t("admin.createEvent").toUpperCase()}
            </h2>

            <form onSubmit={handleCreateEvent} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 9, color: C.txt3, letterSpacing: 2, marginBottom: 5 }}>
                  {t("admin.eventName")}
                </label>
                <input
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: 5ª Jornada de Segurança"
                  style={{
                    width: "100%", background: C.surf2, border: `1px solid ${C.border2}`,
                    borderRadius: 4, padding: "8px 12px", fontSize: 12, color: C.txt,
                    outline: "none", boxSizing: "border-box"
                  }}
                  disabled={createEventMutation.isPending}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 9, color: C.txt3, letterSpacing: 2, marginBottom: 5 }}>
                  {t("admin.facLogin")}
                </label>
                <input
                  value={facLogin}
                  onChange={e => setFacLogin(e.target.value)}
                  placeholder="Ex: fac_jornada_5"
                  style={{
                    width: "100%", background: C.surf2, border: `1px solid ${C.border2}`,
                    borderRadius: 4, padding: "8px 12px", fontSize: 12, color: C.txt,
                    outline: "none", boxSizing: "border-box"
                  }}
                  disabled={createEventMutation.isPending}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 9, color: C.txt3, letterSpacing: 2, marginBottom: 5 }}>
                  {t("admin.facPassword")}
                </label>
                <input
                  type="password"
                  value={facSenha}
                  onChange={e => setFacSenha(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: "100%", background: C.surf2, border: `1px solid ${C.border2}`,
                    borderRadius: 4, padding: "8px 12px", fontSize: 12, color: C.txt,
                    outline: "none", boxSizing: "border-box"
                  }}
                  disabled={createEventMutation.isPending}
                />
              </div>

              {erro && (
                <div style={{
                  padding: "8px 12px", borderRadius: 4,
                  background: C.redL + "12", border: `1px solid ${C.redL}44`,
                  fontSize: 11, color: C.redL, textAlign: "center"
                }}>
                  {erro}
                </div>
              )}

              {sucesso && (
                <div style={{
                  padding: "8px 12px", borderRadius: 4,
                  background: C.greenL + "12", border: `1px solid ${C.greenL}44`,
                  fontSize: 11, color: C.greenL, textAlign: "center"
                }}>
                  Evento criado com sucesso!
                </div>
              )}

              <button
                type="submit"
                disabled={createEventMutation.isPending}
                style={{
                  ...S.btnP,
                  width: "100%",
                  padding: "10px",
                  fontSize: 11,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  background: createEventMutation.isPending ? C.surf3 : C.gold,
                  color: createEventMutation.isPending ? C.txt3 : "#fff",
                  cursor: createEventMutation.isPending ? "not-allowed" : "pointer"
                }}
              >
                {createEventMutation.isPending ? t("common.saving") : t("admin.createButton")}
              </button>
            </form>
          </div>

          {/* Coluna da Direita: Lista de Eventos */}
          <div style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: 24
          }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 20, borderBottom: `1px solid ${C.border}`, paddingBottom: 10 }}>
              {t("admin.eventsList").toUpperCase()}
            </h2>

            {isLoading ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: C.txt3, fontSize: 12 }}>
                {t("common.loading")}
              </div>
            ) : queryErr ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: C.redL, fontSize: 12 }}>
                {t("admin.errorGeneric")}
              </div>
            ) : eventos.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: C.txt3, fontSize: 12 }}>
                {t("admin.emptyEvents")}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {eventos.map((evt, idx) => (
                  <div
                    key={evt.event_id}
                    onClick={() => handleEnterEvent(evt)}
                    style={{
                      background: C.surf2,
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      padding: 16,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "border-color 0.2s",
                      position: "relative",
                      cursor: "pointer"
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = C.gold}
                    onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                  >
                    <div>
                      <h3 style={{ fontSize: 13, fontWeight: 700, color: C.txt, margin: "0 0 4px 0" }}>
                        {evt.event_nome}
                      </h3>
                      <div style={{ fontSize: 10, color: C.txt3, display: "flex", gap: 12 }}>
                        <span>
                          <strong>Facilitador:</strong> {evt.facilitador_login}
                        </span>
                        <span>
                          <strong>{t("admin.created")}:</strong> {new Date(evt.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <span style={{
                          background: C.blueL + "12",
                          color: C.blueL,
                          fontSize: 9,
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: 3,
                          border: `1px solid ${C.blueL}22`
                        }}>
                          {t("admin.totalSessions", { count: evt.total_sessions })}
                        </span>
                        <span style={{
                          background: C.gold + "12",
                          color: C.goldDim,
                          fontSize: 9,
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: 3,
                          border: `1px solid ${C.gold}22`
                        }}>
                          {t("admin.totalGroups", { count: evt.total_groups })}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(evt.event_id, evt.event_nome);
                      }}
                      disabled={deleteEventMutation.isPending}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: C.redL,
                        cursor: "pointer",
                        padding: 8,
                        borderRadius: 4,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        transition: "background 0.2s"
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = C.redL + "11"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      title={t("common.delete")}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

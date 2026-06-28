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
  const { adminToken, logout, lang, setActiveEventId, setActiveEventNome, setRole, setScreen } = useApp();
  const qc = useQueryClient();

  // Estados de criação de evento
  const [nome, setNome] = useState("");
  const [facLogin, setFacLogin] = useState("");
  const [facSenha, setFacSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [segurancaAplicavel, setSegurancaAplicavel] = useState(true);

  // Estados de edição de evento ativo
  const [editingEvent, setEditingEvent] = useState<AdminDashboardData | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editFacLogin, setEditFacLogin] = useState("");
  const [editFacSenha, setEditFacSenha] = useState("");
  const [editCotacao, setEditCotacao] = useState(5.0);
  const [editSegurancaAplicavel, setEditSegurancaAplicavel] = useState(true);
  const [activeCatalogTab, setActiveCatalogTab] = useState<"mo" | "eq" | "ativ" | "req">("mo");
  const [selectedAtivFilter, setSelectedAtivFilter] = useState("a1");

  // Estados para novos registros de catálogos
  const [newMo, setNewMo] = useState({ id: "", cargo_pt: "", cargo_es: "", sal: 0 });
  const [newEq, setNewEq] = useState({ id: "", nome_pt: "", nome_es: "", loc: 0 });
  const [newReq, setNewReq] = useState({ categoria: "Procedimento", descricao_pt: "", descricao_es: "", aplicavel: true });

  // 1. Query para buscar os dados do dashboard
  const { data: eventos = [], isLoading, error: queryErr } = useQuery<AdminDashboardData[]>({
    queryKey: ["admin_dashboard", adminToken],
    queryFn: async () => {
      if (!adminToken) return [];
      const { data, error } = await supabase.rpc("get_admin_dashboard_data", {
        p_admin_token: adminToken,
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!adminToken,
  });

  // 2. Mutation para criar evento
  const createEventMutation = useMutation({
    mutationFn: async () => {
      setErro("");
      setSucesso("");
      if (!nome.trim() || !facLogin.trim() || !facSenha.trim()) {
        throw new Error("empty_fields");
      }
      if (!adminToken) throw new Error("no_admin_pass");

      const { data, error } = await supabase.rpc("create_event", {
        p_admin_token: adminToken,
        p_nome: nome.trim(),
        p_fac_login: facLogin.trim(),
        p_fac_senha: facSenha,
        p_seguranca_aplicavel: segurancaAplicavel,
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
      setSegurancaAplicavel(true);
      setSucesso(t("common.save"));
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
      if (!adminToken) throw new Error("no_admin_pass");
      const { error } = await supabase.rpc("delete_event", {
        p_admin_token: adminToken,
        p_event_id: eventId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      if (editingEvent && editingEvent.event_id === editingEvent.event_id) {
        setEditingEvent(null);
      }
      qc.invalidateQueries({ queryKey: ["admin_dashboard"] });
    },
    onError: () => {
      alert(t("admin.errorGeneric"));
    },
  });

  // 4. Mutation para atualizar evento geral
  const updateEventMutation = useMutation({
    mutationFn: async () => {
      setErro("");
      setSucesso("");
      if (!editingEvent) return;
      if (!editNome.trim() || !editFacLogin.trim()) {
        throw new Error("empty_fields");
      }
      if (!adminToken) throw new Error("no_admin_pass");

      const { error } = await supabase.rpc("update_event", {
        p_admin_token: adminToken,
        p_event_id: editingEvent.event_id,
        p_nome: editNome.trim(),
        p_fac_login: editFacLogin.trim(),
        p_fac_senha: editFacSenha.trim() || null,
        p_cotacao_dolar: Number(editCotacao) || 5.0,
        p_seguranca_aplicavel: editSegurancaAplicavel,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setSucesso("Configurações gerais salvas!");
      qc.invalidateQueries({ queryKey: ["admin_dashboard"] });
      if (editingEvent) {
        setEditingEvent(prev => prev ? {
          ...prev,
          event_nome: editNome.trim(),
          facilitador_login: editFacLogin.trim(),
          cotacao_dolar: Number(editCotacao) || 5.0,
          seguranca_aplicavel: editSegurancaAplicavel,
        } : null);
      }
    },
    onError: (err: any) => {
      setErro(err.message || "Erro ao salvar.");
    },
  });

  // Queries e Mutations dos Catálogos do Evento
  const { data: eventMos = [], refetch: refetchMos } = useQuery({
    queryKey: ["admin_mo_cat", editingEvent?.event_id],
    queryFn: async () => {
      if (!editingEvent) return [];
      const { data, error } = await supabase
        .from("event_mo_cat")
        .select("*")
        .eq("event_id", editingEvent.event_id)
        .order("id", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!editingEvent,
  });

  const { data: eventEqs = [], refetch: refetchEqs } = useQuery({
    queryKey: ["admin_eq_cat", editingEvent?.event_id],
    queryFn: async () => {
      if (!editingEvent) return [];
      const { data, error } = await supabase
        .from("event_eq_cat")
        .select("*")
        .eq("event_id", editingEvent.event_id)
        .order("id", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!editingEvent,
  });

  const { data: eventAtivs = [], refetch: refetchAtivs } = useQuery({
    queryKey: ["admin_atividades", editingEvent?.event_id],
    queryFn: async () => {
      if (!editingEvent) return [];
      const { data, error } = await supabase
        .from("event_atividades")
        .select("*")
        .eq("event_id", editingEvent.event_id)
        .order("id", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!editingEvent,
  });

  const { data: eventReqs = [], refetch: refetchReqs } = useQuery({
    queryKey: ["admin_requisitos_base", editingEvent?.event_id, selectedAtivFilter],
    queryFn: async () => {
      if (!editingEvent) return [];
      const { data, error } = await supabase
        .from("event_requisitos_base")
        .select("*")
        .eq("event_id", editingEvent.event_id)
        .eq("atividade_id", selectedAtivFilter)
        .order("categoria", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!editingEvent,
  });

  // Mutações Mão de Obra
  const saveMoMutation = useMutation({
    mutationFn: async (mo: any) => {
      if (!editingEvent) return;
      const isNew = !eventMos.some(m => m.id === mo.id);
      if (isNew) {
        const { error } = await supabase.from("event_mo_cat").insert({
          id: mo.id,
          event_id: editingEvent.event_id,
          cargo_pt: mo.cargo_pt,
          cargo_es: mo.cargo_es,
          sal: mo.sal,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("event_mo_cat")
          .update({
            cargo_pt: mo.cargo_pt,
            cargo_es: mo.cargo_es,
            sal: mo.sal,
          })
          .eq("id", mo.id)
          .eq("event_id", editingEvent.event_id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      refetchMos();
      setNewMo({ id: "", cargo_pt: "", cargo_es: "", sal: 0 });
    },
    onError: () => alert("Erro ao salvar Mão de Obra."),
  });

  const deleteMoMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!editingEvent) return;
      const { error } = await supabase
        .from("event_mo_cat")
        .delete()
        .eq("id", id)
        .eq("event_id", editingEvent.event_id);
      if (error) throw error;
    },
    onSuccess: () => refetchMos(),
    onError: () => alert("Erro ao excluir. Item pode estar em uso."),
  });

  // Mutações Equipamento
  const saveEqMutation = useMutation({
    mutationFn: async (eq: any) => {
      if (!editingEvent) return;
      const isNew = !eventEqs.some(e => e.id === eq.id);
      if (isNew) {
        const { error } = await supabase.from("event_eq_cat").insert({
          id: eq.id,
          event_id: editingEvent.event_id,
          nome_pt: eq.nome_pt,
          nome_es: eq.nome_es,
          loc: eq.loc,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("event_eq_cat")
          .update({
            nome_pt: eq.nome_pt,
            nome_es: eq.nome_es,
            loc: eq.loc,
          })
          .eq("id", eq.id)
          .eq("event_id", editingEvent.event_id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      refetchEqs();
      setNewEq({ id: "", nome_pt: "", nome_es: "", loc: 0 });
    },
    onError: () => alert("Erro ao salvar Equipamento."),
  });

  const deleteEqMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!editingEvent) return;
      const { error } = await supabase
        .from("event_eq_cat")
        .delete()
        .eq("id", id)
        .eq("event_id", editingEvent.event_id);
      if (error) throw error;
    },
    onSuccess: () => refetchEqs(),
    onError: () => alert("Erro ao excluir. Item pode estar em uso."),
  });

  // Mutation Atividade (apenas update)
  const saveAtivMutation = useMutation({
    mutationFn: async (ativ: any) => {
      if (!editingEvent) return;
      const { error } = await supabase
        .from("event_atividades")
        .update({
          desc_pt: ativ.desc_pt,
          desc_es: ativ.desc_es,
          und_pt: ativ.und_pt,
          und_es: ativ.und_es,
          kpi_base: ativ.kpi_base,
        })
        .eq("id", ativ.id)
        .eq("event_id", editingEvent.event_id);
      if (error) throw error;
    },
    onSuccess: () => refetchAtivs(),
    onError: () => alert("Erro ao salvar Atividade."),
  });

  // Mutações Requisitos
  const saveReqMutation = useMutation({
    mutationFn: async (req: any) => {
      if (!editingEvent) return;
      if (req.id) {
        const { error } = await supabase
          .from("event_requisitos_base")
          .update({
            categoria: req.categoria,
            descricao_pt: req.descricao_pt,
            descricao_es: req.descricao_es,
            aplicavel: req.aplicavel,
          })
          .eq("id", req.id)
          .eq("event_id", editingEvent.event_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_requisitos_base").insert({
          event_id: editingEvent.event_id,
          atividade_id: selectedAtivFilter,
          categoria: req.categoria,
          descricao_pt: req.descricao_pt,
          descricao_es: req.descricao_es,
          aplicavel: req.aplicavel,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      refetchReqs();
      setNewReq({ categoria: "Procedimento", descricao_pt: "", descricao_es: "", aplicavel: true });
    },
    onError: () => alert("Erro ao salvar Requisito."),
  });

  const deleteReqMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!editingEvent) return;
      const { error } = await supabase
        .from("event_requisitos_base")
        .delete()
        .eq("id", id)
        .eq("event_id", editingEvent.event_id);
      if (error) throw error;
    },
    onSuccess: () => refetchReqs(),
    onError: () => alert("Erro ao excluir Requisito."),
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
          {/* Seletor de Idioma */}
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
          <div style={{ ...S.stat, cursor: "pointer" }} onClick={() => setEditingEvent(null)}>
            <div style={{ fontSize: 9, color: C.txt3, letterSpacing: 2 }}>MÉDIA GRUPOS / EVENTO</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.gold, marginTop: 4 }}>{mediaGruposPorEvento}</div>
          </div>
        </div>

        {/* Layout Condicional: Configurando Evento ou Visualizando Lista */}
        {editingEvent ? (
          /* TELA DE CONFIGURAÇÃO DO EVENTO */
          <div style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 24,
            animation: "fadeIn 0.3s ease",
            width: "100%",
            boxSizing: "border-box"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}`, paddingBottom: 15 }}>
              <div>
                <button
                  onClick={() => {
                    setEditingEvent(null);
                    setErro("");
                    setSucesso("");
                  }}
                  style={{ ...S.nb(false), fontSize: 10, padding: "4px 8px", marginRight: 10 }}
                >
                  ← Voltar
                </button>
                <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 2, color: C.gold }}>
                  CONFIGURAR EVENTO: {editingEvent.event_nome.toUpperCase()}
                </span>
              </div>
              <span style={{ fontSize: 11, color: C.txt3 }}>
                Criado em: {new Date(editingEvent.created_at).toLocaleDateString()}
              </span>
            </div>

            {/* Configurações Gerais do Evento */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, background: C.surf2, padding: 16, borderRadius: 6, border: `1px solid ${C.border}` }}>
              <div style={{ flex: "1 1 200px" }}>
                <label style={{ display: "block", fontSize: 9, color: C.txt3, letterSpacing: 1, marginBottom: 5 }}>Nome do Evento</label>
                <input
                  value={editNome}
                  onChange={e => setEditNome(e.target.value)}
                  style={{ width: "100%", background: C.surf3, border: `1px solid ${C.border2}`, borderRadius: 4, padding: "6px 10px", fontSize: 12, color: C.txt, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ flex: "1 1 150px" }}>
                <label style={{ display: "block", fontSize: 9, color: C.txt3, letterSpacing: 1, marginBottom: 5 }}>Facilitador Login</label>
                <input
                  value={editFacLogin}
                  onChange={e => setEditFacLogin(e.target.value)}
                  style={{ width: "100%", background: C.surf3, border: `1px solid ${C.border2}`, borderRadius: 4, padding: "6px 10px", fontSize: 12, color: C.txt, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ flex: "1 1 150px" }}>
                <label style={{ display: "block", fontSize: 9, color: C.txt3, letterSpacing: 1, marginBottom: 5 }}>Nova Senha (opcional)</label>
                <input
                  type="password"
                  placeholder="Manter atual"
                  value={editFacSenha}
                  onChange={e => setEditFacSenha(e.target.value)}
                  style={{ width: "100%", background: C.surf3, border: `1px solid ${C.border2}`, borderRadius: 4, padding: "6px 10px", fontSize: 12, color: C.txt, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ flex: "1 1 100px" }}>
                <label style={{ display: "block", fontSize: 9, color: C.txt3, letterSpacing: 1, marginBottom: 5 }}>Cotação Dólar ($ 1 = R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editCotacao}
                  onChange={e => setEditCotacao(parseFloat(e.target.value) || 0)}
                  style={{ width: "100%", background: C.surf3, border: `1px solid ${C.border2}`, borderRadius: 4, padding: "6px 10px", fontSize: 12, color: C.txt, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ flex: "1 1 200px", display: "flex", alignItems: "center", height: 38, marginTop: 16 }}>
                <input
                  type="checkbox"
                  id="seguranca-ap-edit"
                  checked={editSegurancaAplicavel}
                  onChange={e => setEditSegurancaAplicavel(e.target.checked)}
                  disabled={updateEventMutation.isPending}
                  style={{ cursor: "pointer", marginRight: 8 }}
                />
                <label htmlFor="seguranca-ap-edit" style={{ fontSize: 12, color: C.txt2, cursor: "pointer", userSelect: "none" }}>
                  Aplicar Requisitos de Segurança
                </label>
              </div>

              <div style={{ display: "flex", alignItems: "flex-end", flex: "1 1 120px" }}>
                <button
                  onClick={() => updateEventMutation.mutate()}
                  disabled={updateEventMutation.isPending}
                  style={{ ...S.btnP, background: C.gold, color: "#fff", width: "100%", padding: "8px 12px", fontSize: 11, cursor: "pointer" }}
                >
                  {updateEventMutation.isPending ? "Salvando..." : "Salvar Geral"}
                </button>
              </div>
            </div>

            {erro && <div style={{ background: C.redL + "12", border: `1px solid ${C.redL}44`, color: C.redL, padding: "8px 12px", borderRadius: 4, fontSize: 11, textAlign: "center" }}>{erro}</div>}
            {sucesso && <div style={{ background: C.greenL + "12", border: `1px solid ${C.greenL}44`, color: C.greenL, padding: "8px 12px", borderRadius: 4, fontSize: 11, textAlign: "center" }}>{sucesso}</div>}

            {/* Abas para Catálogos Customizados */}
            <div>
              <div style={{ display: "flex", gap: 10, borderBottom: `1px solid ${C.border}`, paddingBottom: 10, marginBottom: 16 }}>
                {[
                  { id: "mo", label: "👷 Mão de Obra" },
                  { id: "eq", label: "🚜 Equipamentos" },
                  { id: "ativ", label: "📋 Atividades" },
                  { id: "req", label: "🛡️ Requisitos Padrão" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCatalogTab(tab.id as any)}
                    style={{
                      background: activeCatalogTab === tab.id ? `linear-gradient(135deg,${C.gold},${C.goldDim})` : "transparent",
                      color: activeCatalogTab === tab.id ? "#fff" : C.txt2,
                      border: `1px solid ${activeCatalogTab === tab.id ? C.gold : C.border}`,
                      borderRadius: 4,
                      padding: "6px 16px",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Aba Mão de Obra */}
              {activeCatalogTab === "mo" && (
                <div style={{ animation: "fadeIn 0.2s ease" }}>
                  <div style={{ maxHeight: 350, overflowY: "auto", border: `1px solid ${C.border}`, borderRadius: 4, marginBottom: 16 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, textAlign: "left" }}>
                      <thead>
                        <tr style={{ background: C.surf3, color: C.txt3, borderBottom: `1px solid ${C.border}` }}>
                          <th style={{ padding: 10 }}>ID</th>
                          <th style={{ padding: 10 }}>Cargo (PT)</th>
                          <th style={{ padding: 10 }}>Cargo (ES)</th>
                          <th style={{ padding: 10 }}>Salário (R$)</th>
                          <th style={{ padding: 10, textAlign: "right" }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {eventMos.map((mo: any) => (
                          <TableRowMo key={mo.id} mo={mo} onSave={(updated) => saveMoMutation.mutate(updated)} onDelete={(id) => deleteMoMutation.mutate(id)} />
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Formulário Novo Mão de Obra */}
                  <div style={{ background: C.surf2, padding: 16, borderRadius: 6, border: `1px solid ${C.border}`, display: "flex", gap: 10, alignItems: "flex-end" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: 9, color: C.txt3, marginBottom: 5 }}>ID do Recurso (ex: mo17)</label>
                      <input
                        placeholder="ID único"
                        value={newMo.id}
                        onChange={e => setNewMo({ ...newMo, id: e.target.value.toLowerCase().trim() })}
                        style={{ width: "100%", background: C.surf3, border: `1px solid ${C.border2}`, borderRadius: 4, padding: 6, fontSize: 11, color: C.txt, boxSizing: "border-box" }}
                      />
                    </div>
                    <div style={{ flex: 2 }}>
                      <label style={{ display: "block", fontSize: 9, color: C.txt3, marginBottom: 5 }}>Cargo (Português)</label>
                      <input
                        placeholder="Ex: ELETRICISTA"
                        value={newMo.cargo_pt}
                        onChange={e => setNewMo({ ...newMo, cargo_pt: e.target.value.toUpperCase() })}
                        style={{ width: "100%", background: C.surf3, border: `1px solid ${C.border2}`, borderRadius: 4, padding: 6, fontSize: 11, color: C.txt, boxSizing: "border-box" }}
                      />
                    </div>
                    <div style={{ flex: 2 }}>
                      <label style={{ display: "block", fontSize: 9, color: C.txt3, marginBottom: 5 }}>Cargo (Espanhol)</label>
                      <input
                        placeholder="Ex: ELECTRICISTA"
                        value={newMo.cargo_es}
                        onChange={e => setNewMo({ ...newMo, cargo_es: e.target.value.toUpperCase() })}
                        style={{ width: "100%", background: C.surf3, border: `1px solid ${C.border2}`, borderRadius: 4, padding: 6, fontSize: 11, color: C.txt, boxSizing: "border-box" }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: 9, color: C.txt3, marginBottom: 5 }}>Salário (R$)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={newMo.sal || ""}
                        onChange={e => setNewMo({ ...newMo, sal: parseFloat(e.target.value) || 0 })}
                        style={{ width: "100%", background: C.surf3, border: `1px solid ${C.border2}`, borderRadius: 4, padding: 6, fontSize: 11, color: C.txt, boxSizing: "border-box" }}
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (!newMo.id || !newMo.cargo_pt) return alert("Preencha ID e Cargo!");
                        saveMoMutation.mutate(newMo);
                      }}
                      style={{ ...S.btnP, background: C.gold, color: "#fff", padding: "6px 12px", fontSize: 11, cursor: "pointer" }}
                    >
                      Adicionar ➕
                    </button>
                  </div>
                </div>
              )}

              {/* Aba Equipamento */}
              {activeCatalogTab === "eq" && (
                <div style={{ animation: "fadeIn 0.2s ease" }}>
                  <div style={{ maxHeight: 350, overflowY: "auto", border: `1px solid ${C.border}`, borderRadius: 4, marginBottom: 16 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, textAlign: "left" }}>
                      <thead>
                        <tr style={{ background: C.surf3, color: C.txt3, borderBottom: `1px solid ${C.border}` }}>
                          <th style={{ padding: 10 }}>ID</th>
                          <th style={{ padding: 10 }}>Equipamento (PT)</th>
                          <th style={{ padding: 10 }}>Equipamento (ES)</th>
                          <th style={{ padding: 10 }}>Locação Mensal (R$)</th>
                          <th style={{ padding: 10, textAlign: "right" }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {eventEqs.map((eq: any) => (
                          <TableRowEq key={eq.id} eq={eq} onSave={(updated) => saveEqMutation.mutate(updated)} onDelete={(id) => deleteEqMutation.mutate(id)} />
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Formulário Novo Equipamento */}
                  <div style={{ background: C.surf2, padding: 16, borderRadius: 6, border: `1px solid ${C.border}`, display: "flex", gap: 10, alignItems: "flex-end" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: 9, color: C.txt3, marginBottom: 5 }}>ID do Recurso (ex: eq21)</label>
                      <input
                        placeholder="ID único"
                        value={newEq.id}
                        onChange={e => setNewEq({ ...newEq, id: e.target.value.toLowerCase().trim() })}
                        style={{ width: "100%", background: C.surf3, border: `1px solid ${C.border2}`, borderRadius: 4, padding: 6, fontSize: 11, color: C.txt, boxSizing: "border-box" }}
                      />
                    </div>
                    <div style={{ flex: 2 }}>
                      <label style={{ display: "block", fontSize: 9, color: C.txt3, marginBottom: 5 }}>Nome (Português)</label>
                      <input
                        placeholder="Ex: CAMINHÃO PIPIPA"
                        value={newEq.nome_pt}
                        onChange={e => setNewEq({ ...newEq, nome_pt: e.target.value.toUpperCase() })}
                        style={{ width: "100%", background: C.surf3, border: `1px solid ${C.border2}`, borderRadius: 4, padding: 6, fontSize: 11, color: C.txt, boxSizing: "border-box" }}
                      />
                    </div>
                    <div style={{ flex: 2 }}>
                      <label style={{ display: "block", fontSize: 9, color: C.txt3, marginBottom: 5 }}>Nome (Espanhol)</label>
                      <input
                        placeholder="Ex: CAMIÓN CISTERNA"
                        value={newEq.nome_es}
                        onChange={e => setNewEq({ ...newEq, nome_es: e.target.value.toUpperCase() })}
                        style={{ width: "100%", background: C.surf3, border: `1px solid ${C.border2}`, borderRadius: 4, padding: 6, fontSize: 11, color: C.txt, boxSizing: "border-box" }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: 9, color: C.txt3, marginBottom: 5 }}>Locação (R$)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={newEq.loc || ""}
                        onChange={e => setNewEq({ ...newEq, loc: parseFloat(e.target.value) || 0 })}
                        style={{ width: "100%", background: C.surf3, border: `1px solid ${C.border2}`, borderRadius: 4, padding: 6, fontSize: 11, color: C.txt, boxSizing: "border-box" }}
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (!newEq.id || !newEq.nome_pt) return alert("Preencha ID e Nome!");
                        saveEqMutation.mutate(newEq);
                      }}
                      style={{ ...S.btnP, background: C.gold, color: "#fff", padding: "6px 12px", fontSize: 11, cursor: "pointer" }}
                    >
                      Adicionar ➕
                    </button>
                  </div>
                </div>
              )}

              {/* Aba Atividade */}
              {activeCatalogTab === "ativ" && (
                <div style={{ animation: "fadeIn 0.2s ease" }}>
                  <div style={{ maxHeight: 350, overflowY: "auto", border: `1px solid ${C.border}`, borderRadius: 4 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, textAlign: "left" }}>
                      <thead>
                        <tr style={{ background: C.surf3, color: C.txt3, borderBottom: `1px solid ${C.border}` }}>
                          <th style={{ padding: 10 }}>ID</th>
                          <th style={{ padding: 10 }}>Grupo</th>
                          <th style={{ padding: 10 }}>Descrição (PT)</th>
                          <th style={{ padding: 10 }}>Descrição (ES)</th>
                          <th style={{ padding: 10 }}>Unidade (PT)</th>
                          <th style={{ padding: 10 }}>Unidade (ES)</th>
                          <th style={{ padding: 10 }}>KPI Base</th>
                          <th style={{ padding: 10, textAlign: "right" }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {eventAtivs.map((ativ: any) => (
                          <TableRowAtiv key={ativ.id} ativ={ativ} onSave={(updated) => saveAtivMutation.mutate(updated)} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Aba Requisitos */}
              {activeCatalogTab === "req" && (
                <div style={{ animation: "fadeIn 0.2s ease" }}>
                  {/* Seletor de Filtro de Atividade */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.txt }}>Atividade:</span>
                    <select
                      value={selectedAtivFilter}
                      onChange={e => setSelectedAtivFilter(e.target.value)}
                      style={{ background: C.surf2, border: `1px solid ${C.border}`, color: C.txt, fontSize: 11, padding: "4px 8px", borderRadius: 4 }}
                    >
                      {eventAtivs.map((a: any) => (
                        <option key={a.id} value={a.id}>
                          {a.id.toUpperCase()} - {a.desc_pt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ maxHeight: 300, overflowY: "auto", border: `1px solid ${C.border}`, borderRadius: 4, marginBottom: 16 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, textAlign: "left" }}>
                      <thead>
                        <tr style={{ background: C.surf3, color: C.txt3, borderBottom: `1px solid ${C.border}` }}>
                          <th style={{ padding: 10 }}>Categoria</th>
                          <th style={{ padding: 10 }}>Requisito (PT)</th>
                          <th style={{ padding: 10 }}>Requisito (ES)</th>
                          <th style={{ padding: 10 }}>Aplicável?</th>
                          <th style={{ padding: 10, textAlign: "right" }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {eventReqs.map((req: any) => (
                          <TableRowReq key={req.id} req={req} onSave={(updated) => saveReqMutation.mutate(updated)} onDelete={(id) => deleteReqMutation.mutate(id)} />
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Formulário Novo Requisito */}
                  <div style={{ background: C.surf2, padding: 16, borderRadius: 6, border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 10 }}>
                    <h4 style={{ margin: "0 0 5px 0", fontSize: 10, fontWeight: 700, color: C.gold }}>ADICIONAR NOVO REQUISITO PARA {selectedAtivFilter.toUpperCase()}</h4>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", fontSize: 9, color: C.txt3, marginBottom: 5 }}>Categoria</label>
                        <select
                          value={newReq.categoria}
                          onChange={e => setNewReq({ ...newReq, categoria: e.target.value })}
                          style={{ width: "100%", background: C.surf3, border: `1px solid ${C.border2}`, borderRadius: 4, padding: 5, fontSize: 11, color: C.txt }}
                        >
                          <option>Procedimento</option>
                          <option>EPC</option>
                          <option>EPIs</option>
                          <option>Treinamentos</option>
                          <option>Projetos</option>
                          <option>Outros</option>
                        </select>
                      </div>
                      <div style={{ flex: 3 }}>
                        <label style={{ display: "block", fontSize: 9, color: C.txt3, marginBottom: 5 }}>Descrição (Português)</label>
                        <input
                          placeholder="Descrição PT"
                          value={newReq.descricao_pt}
                          onChange={e => setNewReq({ ...newReq, descricao_pt: e.target.value })}
                          style={{ width: "100%", background: C.surf3, border: `1px solid ${C.border2}`, borderRadius: 4, padding: 6, fontSize: 11, color: C.txt, boxSizing: "border-box" }}
                        />
                      </div>
                      <div style={{ flex: 3 }}>
                        <label style={{ display: "block", fontSize: 9, color: C.txt3, marginBottom: 5 }}>Descrição (Espanhol)</label>
                        <input
                          placeholder="Descrição ES"
                          value={newReq.descricao_es}
                          onChange={e => setNewReq({ ...newReq, descricao_es: e.target.value })}
                          style={{ width: "100%", background: C.surf3, border: `1px solid ${C.border2}`, borderRadius: 4, padding: 6, fontSize: 11, color: C.txt, boxSizing: "border-box" }}
                        />
                      </div>
                      <div style={{ display: "flex", gap: 5, alignItems: "center", paddingBottom: 8 }}>
                        <input
                          type="checkbox"
                          id="new-req-ap"
                          checked={newReq.aplicavel}
                          onChange={e => setNewReq({ ...newReq, aplicavel: e.target.checked })}
                        />
                        <label htmlFor="new-req-ap" style={{ fontSize: 11, color: C.txt }}>Aplicável</label>
                      </div>
                      <button
                        onClick={() => {
                          if (!newReq.descricao_pt) return alert("Digite a descrição!");
                          saveReqMutation.mutate(newReq);
                        }}
                        style={{ ...S.btnP, background: C.gold, color: "#fff", padding: "6px 12px", fontSize: 11, cursor: "pointer" }}
                      >
                        Adicionar ➕
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* TELA PADRÃO: CADASTRO E LISTA DE EVENTOS */
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

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    id="seguranca-ap-create"
                    checked={segurancaAplicavel}
                    onChange={e => setSegurancaAplicavel(e.target.checked)}
                    disabled={createEventMutation.isPending}
                    style={{ cursor: "pointer" }}
                  />
                  <label htmlFor="seguranca-ap-create" style={{ fontSize: 12, color: C.txt2, cursor: "pointer", userSelect: "none" }}>
                    Aplicar Requisitos de Segurança
                  </label>
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
                  {eventos.map((evt) => (
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
                          {evt.cotacao_dolar && (
                            <span style={{
                              background: C.greenL + "12",
                              color: C.greenL,
                              fontSize: 9,
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: 3,
                              border: `1px solid ${C.greenL}22`
                            }}>
                              Cambio: R$ {Number(evt.cotacao_dolar).toFixed(2)}
                            </span>
                          )}
                          <span style={{
                            background: evt.seguranca_aplicavel !== false ? C.greenL + "12" : C.yellow + "12",
                            color: evt.seguranca_aplicavel !== false ? C.greenL : C.yellow,
                            fontSize: 9,
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: 3,
                            border: `1px solid ${evt.seguranca_aplicavel !== false ? C.greenL : C.yellow}22`
                          }}>
                            {evt.seguranca_aplicavel !== false ? "🛡️ Segurança Ativa" : "⚠️ Sem Requisitos"}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setEditingEvent(evt);
                            setEditNome(evt.event_nome);
                            setEditFacLogin(evt.facilitador_login);
                            setEditFacSenha("");
                            setEditCotacao(evt.cotacao_dolar ?? 5.0);
                            setEditSegurancaAplicavel(evt.seguranca_aplicavel !== false);
                            setErro("");
                            setSucesso("");
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: C.gold,
                            cursor: "pointer",
                            padding: 8,
                            borderRadius: 4,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 16,
                            transition: "background 0.2s"
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = C.gold + "11"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          title="Configurar Evento"
                        >
                          ⚙️
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(evt.event_id, evt.event_nome)}
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ── COMPONENTES AUXILIARES DE EDICÃO INLINE ──────────────────────────────────

function TableRowMo({ mo, onSave, onDelete }: { mo: any; onSave: (updated: any) => void; onDelete: (id: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [cargoPt, setCargoPt] = useState(mo.cargo_pt);
  const [cargoEs, setCargoEs] = useState(mo.cargo_es);
  const [sal, setSal] = useState(mo.sal);

  const handleSave = () => {
    onSave({ id: mo.id, cargo_pt: cargoPt, cargo_es: cargoEs, sal });
    setIsEditing(false);
  };

  return (
    <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.txt }}>
      <td style={{ padding: 10, fontWeight: 700 }}>{mo.id}</td>
      <td style={{ padding: 10 }}>
        {isEditing ? (
          <input value={cargoPt} onChange={e => setCargoPt(e.target.value.toUpperCase())} style={{ background: C.surf3, border: `1px solid ${C.border2}`, color: C.txt, fontSize: 11, padding: 4, borderRadius: 3, width: "100%" }} />
        ) : (
          mo.cargo_pt
        )}
      </td>
      <td style={{ padding: 10 }}>
        {isEditing ? (
          <input value={cargoEs} onChange={e => setCargoEs(e.target.value.toUpperCase())} style={{ background: C.surf3, border: `1px solid ${C.border2}`, color: C.txt, fontSize: 11, padding: 4, borderRadius: 3, width: "100%" }} />
        ) : (
          mo.cargo_es
        )}
      </td>
      <td style={{ padding: 10 }}>
        {isEditing ? (
          <input type="number" value={sal} onChange={e => setSal(parseFloat(e.target.value) || 0)} style={{ background: C.surf3, border: `1px solid ${C.border2}`, color: C.txt, fontSize: 11, padding: 4, borderRadius: 3, width: "100%" }} />
        ) : (
          `R$ ${Number(mo.sal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
        )}
      </td>
      <td style={{ padding: 10, textAlign: "right" }}>
        {isEditing ? (
          <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
            <button onClick={handleSave} style={{ border: "none", background: C.greenL, color: "#fff", cursor: "pointer", fontSize: 10, padding: "2px 6px", borderRadius: 3 }}>Salvar 💾</button>
            <button onClick={() => setIsEditing(false)} style={{ border: "none", background: C.surf3, color: C.txt2, cursor: "pointer", fontSize: 10, padding: "2px 6px", borderRadius: 3 }}>Cancelar</button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
            <button onClick={() => setIsEditing(true)} style={{ border: "none", background: C.surf2, border: `1px solid ${C.border}`, color: C.txt, cursor: "pointer", fontSize: 10, padding: "2px 6px", borderRadius: 3 }}>Editar ✏️</button>
            <button onClick={() => { if(confirm("Excluir item?")) onDelete(mo.id); }} style={{ border: "none", background: "transparent", color: C.redL, cursor: "pointer", fontSize: 12 }}>🗑️</button>
          </div>
        )}
      </td>
    </tr>
  );
}

function TableRowEq({ eq, onSave, onDelete }: { eq: any; onSave: (updated: any) => void; onDelete: (id: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [nomePt, setNomePt] = useState(eq.nome_pt);
  const [nomeEs, setNomeEs] = useState(eq.nome_es);
  const [loc, setLoc] = useState(eq.loc);

  const handleSave = () => {
    onSave({ id: eq.id, nome_pt: nomePt, nome_es: nomeEs, loc });
    setIsEditing(false);
  };

  return (
    <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.txt }}>
      <td style={{ padding: 10, fontWeight: 700 }}>{eq.id}</td>
      <td style={{ padding: 10 }}>
        {isEditing ? (
          <input value={nomePt} onChange={e => setNomePt(e.target.value.toUpperCase())} style={{ background: C.surf3, border: `1px solid ${C.border2}`, color: C.txt, fontSize: 11, padding: 4, borderRadius: 3, width: "100%" }} />
        ) : (
          eq.nome_pt
        )}
      </td>
      <td style={{ padding: 10 }}>
        {isEditing ? (
          <input value={nomeEs} onChange={e => setNomeEs(e.target.value.toUpperCase())} style={{ background: C.surf3, border: `1px solid ${C.border2}`, color: C.txt, fontSize: 11, padding: 4, borderRadius: 3, width: "100%" }} />
        ) : (
          eq.nome_es
        )}
      </td>
      <td style={{ padding: 10 }}>
        {isEditing ? (
          <input type="number" value={loc} onChange={e => setLoc(parseFloat(e.target.value) || 0)} style={{ background: C.surf3, border: `1px solid ${C.border2}`, color: C.txt, fontSize: 11, padding: 4, borderRadius: 3, width: "100%" }} />
        ) : (
          `R$ ${Number(eq.loc).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
        )}
      </td>
      <td style={{ padding: 10, textAlign: "right" }}>
        {isEditing ? (
          <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
            <button onClick={handleSave} style={{ border: "none", background: C.greenL, color: "#fff", cursor: "pointer", fontSize: 10, padding: "2px 6px", borderRadius: 3 }}>Salvar 💾</button>
            <button onClick={() => setIsEditing(false)} style={{ border: "none", background: C.surf3, color: C.txt2, cursor: "pointer", fontSize: 10, padding: "2px 6px", borderRadius: 3 }}>Cancelar</button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
            <button onClick={() => setIsEditing(true)} style={{ border: "none", background: C.surf2, border: `1px solid ${C.border}`, color: C.txt, cursor: "pointer", fontSize: 10, padding: "2px 6px", borderRadius: 3 }}>Editar ✏️</button>
            <button onClick={() => { if(confirm("Excluir item?")) onDelete(eq.id); }} style={{ border: "none", background: "transparent", color: C.redL, cursor: "pointer", fontSize: 12 }}>🗑️</button>
          </div>
        )}
      </td>
    </tr>
  );
}

function TableRowAtiv({ ativ, onSave }: { ativ: any; onSave: (updated: any) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [descPt, setDescPt] = useState(ativ.desc_pt);
  const [descEs, setDescEs] = useState(ativ.desc_es);
  const [undPt, setUndPt] = useState(ativ.und_pt);
  const [undEs, setUndEs] = useState(ativ.und_es);
  const [kpiBase, setKpiBase] = useState(ativ.kpi_base);

  const handleSave = () => {
    onSave({ id: ativ.id, desc_pt: descPt, desc_es: descEs, und_pt: undPt, und_es: undEs, kpi_base: kpiBase });
    setIsEditing(false);
  };

  return (
    <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.txt }}>
      <td style={{ padding: 10, fontWeight: 700 }}>{ativ.id.toUpperCase()}</td>
      <td style={{ padding: 10, color: C.gold }}>{ativ.grp}</td>
      <td style={{ padding: 10 }}>
        {isEditing ? (
          <input value={descPt} onChange={e => setDescPt(e.target.value)} style={{ background: C.surf3, border: `1px solid ${C.border2}`, color: C.txt, fontSize: 11, padding: 4, borderRadius: 3, width: "100%" }} />
        ) : (
          ativ.desc_pt
        )}
      </td>
      <td style={{ padding: 10 }}>
        {isEditing ? (
          <input value={descEs} onChange={e => setDescEs(e.target.value)} style={{ background: C.surf3, border: `1px solid ${C.border2}`, color: C.txt, fontSize: 11, padding: 4, borderRadius: 3, width: "100%" }} />
        ) : (
          ativ.desc_es
        )}
      </td>
      <td style={{ padding: 10 }}>
        {isEditing ? (
          <input value={undPt} onChange={e => setUndPt(e.target.value.toUpperCase())} style={{ background: C.surf3, border: `1px solid ${C.border2}`, color: C.txt, fontSize: 11, padding: 4, borderRadius: 3, width: "100%" }} />
        ) : (
          ativ.und_pt
        )}
      </td>
      <td style={{ padding: 10 }}>
        {isEditing ? (
          <input value={undEs} onChange={e => setUndEs(e.target.value.toUpperCase())} style={{ background: C.surf3, border: `1px solid ${C.border2}`, color: C.txt, fontSize: 11, padding: 4, borderRadius: 3, width: "100%" }} />
        ) : (
          ativ.und_es
        )}
      </td>
      <td style={{ padding: 10 }}>
        {isEditing ? (
          <input type="number" step="0.1" value={kpiBase} onChange={e => setKpiBase(parseFloat(e.target.value) || 0)} style={{ background: C.surf3, border: `1px solid ${C.border2}`, color: C.txt, fontSize: 11, padding: 4, borderRadius: 3, width: "100%" }} />
        ) : (
          ativ.kpi_base
        )}
      </td>
      <td style={{ padding: 10, textAlign: "right" }}>
        {isEditing ? (
          <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
            <button onClick={handleSave} style={{ border: "none", background: C.greenL, color: "#fff", cursor: "pointer", fontSize: 10, padding: "2px 6px", borderRadius: 3 }}>Salvar 💾</button>
            <button onClick={() => setIsEditing(false)} style={{ border: "none", background: C.surf3, color: C.txt2, cursor: "pointer", fontSize: 10, padding: "2px 6px", borderRadius: 3 }}>Cancelar</button>
          </div>
        ) : (
          <button onClick={() => setIsEditing(true)} style={{ border: "none", background: C.surf2, border: `1px solid ${C.border}`, color: C.txt, cursor: "pointer", fontSize: 10, padding: "2px 6px", borderRadius: 3 }}>Editar ✏️</button>
        )}
      </td>
    </tr>
  );
}

function TableRowReq({ req, onSave, onDelete }: { req: any; onSave: (updated: any) => void; onDelete: (id: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [categoria, setCategoria] = useState(req.categoria);
  const [descPt, setDescPt] = useState(req.descricao_pt);
  const [descEs, setDescEs] = useState(req.descricao_es);
  const [aplicavel, setAplicavel] = useState(req.aplicavel);

  const handleSave = () => {
    onSave({ id: req.id, categoria, descricao_pt: descPt, descricao_es: descEs, aplicavel });
    setIsEditing(false);
  };

  return (
    <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.txt }}>
      <td style={{ padding: 10 }}>
        {isEditing ? (
          <select value={categoria} onChange={e => setCategoria(e.target.value)} style={{ background: C.surf3, border: `1px solid ${C.border2}`, color: C.txt, fontSize: 11, padding: 3, borderRadius: 3 }}>
            <option>Procedimento</option>
            <option>EPC</option>
            <option>EPIs</option>
            <option>Treinamentos</option>
            <option>Projetos</option>
            <option>Outros</option>
          </select>
        ) : (
          req.categoria
        )}
      </td>
      <td style={{ padding: 10 }}>
        {isEditing ? (
          <input value={descPt} onChange={e => setDescPt(e.target.value)} style={{ background: C.surf3, border: `1px solid ${C.border2}`, color: C.txt, fontSize: 11, padding: 4, borderRadius: 3, width: "100%" }} />
        ) : (
          req.descricao_pt
        )}
      </td>
      <td style={{ padding: 10 }}>
        {isEditing ? (
          <input value={descEs} onChange={e => setDescEs(e.target.value)} style={{ background: C.surf3, border: `1px solid ${C.border2}`, color: C.txt, fontSize: 11, padding: 4, borderRadius: 3, width: "100%" }} />
        ) : (
          req.descricao_es
        )}
      </td>
      <td style={{ padding: 10 }}>
        {isEditing ? (
          <input type="checkbox" checked={aplicavel} onChange={e => setAplicavel(e.target.checked)} />
        ) : (
          req.aplicavel ? "Sim ✅" : "Não ❌"
        )}
      </td>
      <td style={{ padding: 10, textAlign: "right" }}>
        {isEditing ? (
          <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
            <button onClick={handleSave} style={{ border: "none", background: C.greenL, color: "#fff", cursor: "pointer", fontSize: 10, padding: "2px 6px", borderRadius: 3 }}>Salvar 💾</button>
            <button onClick={() => setIsEditing(false)} style={{ border: "none", background: C.surf3, color: C.txt2, cursor: "pointer", fontSize: 10, padding: "2px 6px", borderRadius: 3 }}>Cancelar</button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
            <button onClick={() => setIsEditing(true)} style={{ border: "none", background: C.surf2, border: `1px solid ${C.border}`, color: C.txt, cursor: "pointer", fontSize: 10, padding: "2px 6px", borderRadius: 3 }}>Editar ✏️</button>
            <button onClick={() => { if(confirm("Excluir requisito?")) onDelete(req.id); }} style={{ border: "none", background: "transparent", color: C.redL, cursor: "pointer", fontSize: 12 }}>🗑️</button>
          </div>
        )}
      </td>
    </tr>
  );
}

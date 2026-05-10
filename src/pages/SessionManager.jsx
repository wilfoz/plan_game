import { useState } from "react";
import { C } from "../constants/colors";
import { S } from "../styles";
import { useApp } from "../context/AppContext";

export default function SessionManager() {
  const { sessions, addSession, delSession, uSessionNome, setActiveSessionId, setRole, setScreen } = useApp();
  const [novoNome, setNovoNome] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [editNome, setEditNome] = useState("");

  const criarSessao = () => {
    if (!novoNome.trim()) return;
    const id = addSession(novoNome.trim());
    setNovoNome("");
    setActiveSessionId(id);
    setScreen("config");
  };

  const entrarSessao = (id) => {
    setActiveSessionId(id);
    setScreen("config");
  };

  const iniciarEdicao = (s) => { setEditandoId(s.id); setEditNome(s.nome); };
  const confirmarEdicao = () => {
    if (editNome.trim()) uSessionNome(editandoId, editNome.trim());
    setEditandoId(null);
  };

  const excluir = (id) => {
    if (!window.confirm("Excluir esta sessão? Todos os dados serão perdidos.")) return;
    delSession(id);
  };

  const logout = () => {
    setRole(null);
    setActiveSessionId(null);
    setScreen("login");
  };

  return (
    <div style={S.app}>
      <div style={{ ...S.pg, maxWidth: 700, paddingTop: 48 }}>

        {/* Cabeçalho */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>⚡</div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: 6 }}>JORNADAS LT</h1>
          <p style={{ margin: "6px 0 0", fontSize: 11, color: C.gold, letterSpacing: 4 }}>
            PAINEL DO FACILITADOR
          </p>
          <p style={{ margin: "16px auto 0", maxWidth: 480, fontSize: 12, color: C.txt3, lineHeight: 1.8 }}>
            Crie uma sessão para cada turma ou jornada de treinamento. Cada sessão encapsula sua própria Linha de Transmissão, grupos e composições.
          </p>
        </div>

        {/* Criar nova sessão */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
          padding: "16px 20px", marginBottom: 20,
          display: "flex", gap: 10, alignItems: "center"
        }}>
          <input
            value={novoNome}
            onChange={e => setNovoNome(e.target.value)}
            onKeyDown={e => e.key === "Enter" && criarSessao()}
            placeholder="Nome da sessão (ex: Turma A — Maio 2026)..."
            style={{
              flex: 1, background: C.surf2, border: `1px solid ${C.border2}`,
              borderRadius: 4, padding: "9px 12px", fontSize: 13, color: C.txt, outline: "none"
            }}
          />
          <button
            style={{ ...S.btnP, whiteSpace: "nowrap", opacity: novoNome.trim() ? 1 : 0.5 }}
            onClick={criarSessao}
          >
            + CRIAR SESSÃO
          </button>
        </div>

        {/* Lista de sessões */}
        {sessions.length === 0 ? (
          <div style={{
            background: C.surf2, border: `1px dashed ${C.border2}`, borderRadius: 8,
            padding: "48px", textAlign: "center", color: C.txt3, fontSize: 13, lineHeight: 1.8
          }}>
            Nenhuma sessão criada ainda.<br />
            Digite um nome acima e clique em <strong>CRIAR SESSÃO</strong> para começar.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 10, color: C.txt3, letterSpacing: 2, marginBottom: 4 }}>SESSÕES DISPONÍVEIS</div>
            {sessions.map((s, i) => (
              <div key={s.id} style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
                padding: "14px 18px", display: "flex", alignItems: "center", gap: 12
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%", background: C.gold + "22",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, color: C.goldDim, flexShrink: 0
                }}>
                  {i + 1}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {editandoId === s.id ? (
                    <input
                      value={editNome}
                      autoFocus
                      onChange={e => setEditNome(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") confirmarEdicao(); if (e.key === "Escape") setEditandoId(null); }}
                      onBlur={confirmarEdicao}
                      style={{
                        width: "100%", background: C.surf2, border: `1px solid ${C.gold}`,
                        borderRadius: 4, padding: "5px 9px", fontSize: 13, color: C.txt,
                        outline: "none", boxSizing: "border-box"
                      }}
                    />
                  ) : (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.txt }}>{s.nome}</div>
                      <div style={{ fontSize: 11, color: C.txt3, marginTop: 2 }}>
                        {s.grupos.length} grupo{s.grupos.length !== 1 ? "s" : ""}
                        {s.lt?.nome ? ` · ${s.lt.nome}` : " · LT não configurada"}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button style={{ ...S.btnS, fontSize: 10 }} onClick={() => iniciarEdicao(s)} title="Renomear">✏️</button>
                  <button style={{ ...S.btnP, fontSize: 10 }} onClick={() => entrarSessao(s.id)}>ENTRAR →</button>
                  <button
                    onClick={() => excluir(s.id)}
                    title="Excluir sessão"
                    style={{
                      background: "transparent", border: `1px solid ${C.redL}`,
                      color: C.redL, borderRadius: 4, padding: "6px 10px",
                      fontSize: 11, cursor: "pointer", fontWeight: 700
                    }}
                  >✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Logout */}
        <div style={{ textAlign: "center", marginTop: 28 }}>
          <button onClick={logout} style={{
            background: "transparent", border: "none", color: C.txt3,
            fontSize: 11, cursor: "pointer", fontFamily: "inherit", letterSpacing: 1
          }}>
            ← SAIR
          </button>
        </div>
      </div>
    </div>
  );
}

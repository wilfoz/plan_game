import { S } from "../styles";
import { useApp } from "../context/AppContext";
import { Card } from "../components/ui/Card";
import { Hdr2 } from "../components/ui/Typography";
import { TH, TD } from "../components/ui/Table";
import { TextInp } from "../components/ui/Inputs";
import { BtnDel } from "../components/ui/Card";
import { C } from "../constants/colors";

export default function Equipes() {
  const { grupos, addGrupo, uGrupo, delGrupo } = useApp();
  return (
    <div style={S.pg}>
      <Card>
        <Hdr2 ch="👥 GRUPOS PARTICIPANTES" right={
          <button style={S.btnS} onClick={addGrupo}>+ ADICIONAR</button>
        } />
        <table style={S.tbl}>
          <thead><tr>
            <TH ch="#" w={30} /><TH ch="NOME DO GRUPO" /><TH ch="RESPONSÁVEL" /><TH ch="SENHA DE ACESSO" w={160} /><TH ch="" w={40} />
          </tr></thead>
          <tbody>
            {grupos.map((g, i) => (
              <tr key={g.id} style={S.trOff(i)}>
                <TD ch={i + 1} bold accent />
                <td style={{ padding: "4px 8px" }}>
                  <TextInp v={g.nome} onChange={e => uGrupo(g.id, "nome", e.target.value)} />
                </td>
                <td style={{ padding: "4px 8px" }}>
                  <TextInp v={g.resp} placeholder="Nome do responsável..." onChange={e => uGrupo(g.id, "resp", e.target.value)} />
                </td>
                <td style={{ padding: "4px 8px" }}>
                  <TextInp v={g.senha || ""} placeholder="Senha do grupo..." onChange={e => uGrupo(g.id, "senha", e.target.value)} />
                </td>
                <td style={{ padding: "4px 8px", textAlign: "center" }}>
                  {grupos.length > 1 && <BtnDel onClick={() => delGrupo(i)} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: "8px 13px", fontSize: 11, color: C.txt2 }}>
          ℹ️ Cada grupo monta composições para <strong style={{ color: C.goldL }}>todas as 16 atividades</strong> — Montagem E Lançamento.
        </div>
      </Card>
    </div>
  );
}

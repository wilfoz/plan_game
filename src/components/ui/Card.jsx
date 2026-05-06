import { C } from "../../constants/colors";

export const Card = ({ children, b }) => (
  <div style={{
    background: C.surface, border: `1px solid ${b || C.border}`,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
    borderRadius: 6, marginBottom: 12, overflow: "hidden"
  }}>{children}</div>
);

export const BtnAdd = ({ onClick, ch = "+ ADICIONAR LINHA" }) => (
  <button onClick={onClick} style={{
    background: "transparent", border: `1px dashed ${C.border2}`,
    borderRadius: 3, color: C.txt3, padding: "5px 12px", fontSize: 10, fontWeight: 700,
    cursor: "pointer", letterSpacing: 1, width: "100%", marginTop: 4, transition: "all 0.15s"
  }}
    onMouseOver={e => { e.target.style.borderColor = C.gold; e.target.style.color = C.goldL; }}
    onMouseOut={e => { e.target.style.borderColor = C.border2; e.target.style.color = C.txt3; }}
  >{ch}</button>
);

export const BtnDel = ({ onClick }) => (
  <button onClick={onClick} style={{
    background: "transparent", border: `1px solid ${C.border}`,
    borderRadius: 3, color: C.txt3, padding: "3px 7px", fontSize: 12, cursor: "pointer", lineHeight: 1
  }}
    onMouseOver={e => { e.target.style.borderColor = C.redL; e.target.style.color = C.redL; }}
    onMouseOut={e => { e.target.style.borderColor = C.border; e.target.style.color = C.txt3; }}
    title="Remover linha">✕</button>
);

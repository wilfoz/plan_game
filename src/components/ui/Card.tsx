import { ReactNode } from "react";
import { C } from "../../constants/colors";

interface CardProps {
  children: ReactNode;
  b?: string;
  mb?: number;
}

export const Card = ({ children, b, mb }: CardProps) => (
  <div style={{
    background: C.surface, border: `1px solid ${b || C.border}`,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
    borderRadius: 6, marginBottom: mb !== undefined ? mb : 12, overflow: "hidden"
  }}>{children}</div>
);

interface BtnAddProps {
  onClick: () => void;
  ch?: string;
}

export const BtnAdd = ({ onClick, ch = "+ ADICIONAR LINHA" }: BtnAddProps) => (
  <button onClick={onClick} style={{
    background: "transparent", border: `1px dashed ${C.border2}`,
    borderRadius: 3, color: C.txt3, padding: "5px 12px", fontSize: 10, fontWeight: 700,
    cursor: "pointer", letterSpacing: 1, width: "100%", marginTop: 4, transition: "all 0.15s"
  }}
    onMouseOver={e => {
      const target = e.currentTarget;
      target.style.borderColor = C.gold;
      target.style.color = C.goldL;
    }}
    onMouseOut={e => {
      const target = e.currentTarget;
      target.style.borderColor = C.border2;
      target.style.color = C.txt3;
    }}
  >{ch}</button>
);

interface BtnDelProps {
  onClick: () => void;
  title?: string;
}

export const BtnDel = ({ onClick, title = "Remover linha" }: BtnDelProps) => (
  <button onClick={onClick} style={{
    background: "transparent", border: `1px solid ${C.border}`,
    borderRadius: 3, color: C.txt3, padding: "6px 10px", fontSize: 11, cursor: "pointer",
    minWidth: 32, minHeight: 32, display: "inline-flex", alignItems: "center", justifyContent: "center"
  }}
    onMouseOver={e => {
      const target = e.currentTarget;
      target.style.borderColor = C.redL;
      target.style.color = C.redL;
    }}
    onMouseOut={e => {
      const target = e.currentTarget;
      target.style.borderColor = C.border;
      target.style.color = C.txt3;
    }}
    title={title}>✕</button>
);

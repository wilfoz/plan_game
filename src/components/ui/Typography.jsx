import { C } from "../../constants/colors";
import { sc } from "../../utils/formatters";

export const Hdr2 = ({ col = C.gold, ch, right }) => (
  <div style={{
    background: col + "18", borderBottom: `1px solid ${col}33`, padding: "7px 13px",
    fontSize: 10, fontWeight: 700, letterSpacing: 3, color: col,
    display: "flex", justifyContent: "space-between", alignItems: "center"
  }}>
    <span>{ch}</span>{right}
  </div>
);

export const Tag = ({ text, col = C.gold }) => (
  <span style={{
    background: col + "22", color: col, border: `1px solid ${col}44`,
    borderRadius: 3, padding: "1px 6px", fontSize: 9, fontWeight: 700, letterSpacing: 1
  }}>{text}</span>
);

export const Pill = ({ on, onClick, ch, col }) => {
  const c = col || (on ? C.gold : C.border);
  return (
    <button onClick={onClick} style={{
      padding: "4px 11px", borderRadius: 3, fontSize: 10,
      fontWeight: 700, letterSpacing: 1, border: `1px solid ${c}`,
      background: on ? c + "33" : "transparent", color: on ? C.goldL : C.txt3, cursor: "pointer"
    }}>{ch}</button>
  );
};

export const ScoreRing = ({ v, label }) => (
  <div style={{ textAlign: "center", minWidth: 48 }}>
    <div style={{
      width: 42, height: 42, borderRadius: "50%", margin: "0 auto 3px",
      background: `conic-gradient(${sc(v)} ${(v || 0) * 3.6}deg,${C.surf3} 0deg)`,
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%", background: C.surf2,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, fontWeight: 700, color: sc(v)
      }}>{v || "—"}</div>
    </div>
    <div style={{ fontSize: 8, color: C.txt3, letterSpacing: 1 }}>{label}</div>
  </div>
);

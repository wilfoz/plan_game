import { C } from "./constants/colors";
import React from "react";

export const S = {
  app: {
    minHeight: "100vh", background: C.bg, color: C.txt,
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
  } as React.CSSProperties,
  hdr: {
    background: C.surface, borderBottom: `2px solid ${C.goldDim}`,
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    padding: "10px 18px", display: "flex", alignItems: "center", justifyContent: "space-between",
    position: "sticky", top: 0, zIndex: 100
  } as React.CSSProperties,
  pg: { padding: "14px 18px", maxWidth: 1400, margin: "0 auto" } as React.CSSProperties,
  g2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } as React.CSSProperties,
  tbl: { width: "100%", borderCollapse: "collapse", fontSize: 11 } as React.CSSProperties,
  trOn: (col: string) => ({ borderBottom: `1px solid ${C.border}`, background: col + "0D" }) as React.CSSProperties,
  trOff: (i: number) => ({ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surf2 + "44" : "transparent" }) as React.CSSProperties,
  totRow: { borderTop: `2px solid ${C.border2}`, background: C.surf3 } as React.CSSProperties,
  btnP: {
    background: C.gold, color: "#FFF", border: "none",
    borderRadius: 4, padding: "10px 20px", fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: 2
  } as React.CSSProperties,
  btnS: {
    background: "transparent", color: C.gold, border: `1px solid ${C.gold}`, borderRadius: 4,
    padding: "8px 14px", fontSize: 10, fontWeight: 700, cursor: "pointer"
  } as React.CSSProperties,
  nb: (a: boolean) => ({
    padding: "5px 11px", borderRadius: 3, fontSize: 10, fontWeight: 700, letterSpacing: 1,
    border: `1px solid ${a ? C.gold : C.border}`, background: a ? C.gold + "44" : "transparent",
    color: a ? C.goldL : C.txt3, cursor: "pointer"
  }) as React.CSSProperties,
  stat: { background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 5, padding: "10px 12px", textAlign: "center" } as React.CSSProperties,
};

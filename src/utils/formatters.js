import { C } from "../constants/colors";

export const fmt = n => (n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmtI = n => Math.round(n || 0).toLocaleString("pt-BR");
export const sc = v => v >= 80 ? C.greenL : v >= 60 ? C.yellow : C.redL;

let _uid = 0;
export const uid = () => ++_uid;

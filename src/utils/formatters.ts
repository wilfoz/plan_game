import { C } from "../constants/colors";

export const fmt = (n: number | undefined | null, locale: string = "pt-BR") =>
  (n || 0).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtI = (n: number | undefined | null, locale: string = "pt-BR") =>
  Math.round(n || 0).toLocaleString(locale);

export const sc = (v: number) =>
  v >= 80 ? C.greenL : v >= 60 ? C.yellow : C.redL;

let _uid = Date.now();
export const uid = (): string => String(++_uid);

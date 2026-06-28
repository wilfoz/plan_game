export interface MultilingualText {
  pt: string;
  es: string;
}

export interface MoCatItem {
  id: string;
  cargo: MultilingualText;
  sal: number;
}

export interface EqCatItem {
  id: string;
  nome: MultilingualText;
  loc: number;
}

export interface EpcCatItem {
  id: string;
  desc: MultilingualText;
  custo: number;
}

export interface EpiCatItem {
  id: string;
  desc: MultilingualText;
}

export interface AtividadeItem {
  id: string;
  grp: 'M' | 'L';
  desc: MultilingualText;
  und: MultilingualText;
}

export interface MoRow {
  _id: string;
  catId: string;
  cargo: string;
  sal: number;
  qtd: number;
  horasDia: number;
  obrigatorio?: boolean;
  minVarPct?: number | null;
}

export interface EqRow {
  _id: string;
  catId: string;
  nome: string;
  loc: number;
  qtd: number;
  horasDia: number;
  obrigatorio?: boolean;
}

export interface Comp {
  moRows: MoRow[];
  eqRows: EqRow[];
  reqIds: string[];
  kpi: number;
  equipes: number;
  mesInicia: number;
}

export interface GrupoComps {
  [atividadeId: string]: Comp;
}

export interface Session {
  id: string;
  nome: string;
  created_at: string;
  event_id?: string;
  grupos?: Grupo[];
  lt?: LtConfig;
}

export interface LtConfig {
  nome: string;
  tensao: string;
  ext: number;
  circ: 'simples' | 'duplo';
  cabFase: number;
  pararaios: number;
  opgw: number;
  travaEquipes: boolean;
}

export interface Grupo {
  id: string;
  nome: string;
  resp: string;
  senha?: string;
  ordem: number;
  session_id?: string;
}

export interface Requisito {
  _id: string;
  aId: string;
  categoria: string;
  desc: string;
  aplicavel: boolean;
}

export interface AtividadeConfig {
  kpiBase: number;
  volumePrev: number;
  comentario: string;
  mesIniciaBase: number;
}

export interface AtividadesConfig {
  [atividadeId: string]: AtividadeConfig;
}

export interface Evento {
  id: string;
  nome: string;
  facilitador_login: string;
  created_at: string;
  total_sessions?: number;
  total_groups?: number;
  seguranca_aplicavel?: boolean;
}

export interface AdminDashboardData {
  event_id: string;
  event_nome: string;
  facilitador_login: string;
  created_at: string;
  total_sessions: number;
  total_groups: number;
  cotacao_dolar?: number;
  seguranca_aplicavel?: boolean;
}

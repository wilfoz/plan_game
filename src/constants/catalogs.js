export const MO_CAT = [
  { id: "mo1", cargo: "AJUDANTE GERAL", sal: 2500 },
  { id: "mo4", cargo: "MONTADOR", sal: 3400 },
  { id: "mo5", cargo: "ENCARREGADO DE TURMA", sal: 8600 },
  { id: "mo6", cargo: "OPERADOR DE GUINDASTE", sal: 8600 },
  { id: "mo6", cargo: "OPERADOR DE GUINCHO", sal: 4500 },
  { id: "mo7", cargo: "OPERADOR DE PULLER/FREIO", sal: 8600 },
  { id: "mo7", cargo: "OPERADOR DE TRATOR", sal: 8600 },
  { id: "mo7", cargo: "OPERADOR DE MAQUINAS PESASAS", sal: 1000 },
  { id: "mo8", cargo: "MOTORISTA", sal: 3100 },
  { id: "mo10", cargo: "MOTORISTA OPERADOR MUNCK", sal: 3700 },
  { id: "mo18", cargo: "ESPOREIRO", sal: 3155 },
  { id: "mo21", cargo: "TOPOGRAFO DE OBRAS", sal: 8614 },
  { id: "mo22", cargo: "AUXILIAR DE TOPOGRAFIA", sal: 2096 },
  { id: "mo23", cargo: "NIVELADOR", sal: 3000 },
  { id: "mo24", cargo: "VIGIA", sal: 2000 },
];

export const EQ_CAT = [
  { id: "eq1", nome: "GUINDASTE", loc: 150000 },
  { id: "eq2", nome: "CONJUNTO LANÇAMENTO - PULLER E FREIO", loc: 287500 },
  { id: "eq3", nome: "CAMINHÃO MUNCK", loc: 31000 },
  { id: "eq4", nome: "CAMINHÃO PRANCHA", loc: 18000 },
  { id: "eq5", nome: "CAMINHONETE 4X4", loc: 8500 },
  { id: "eq6", nome: "TRATOR", loc: 17000 },
  { id: "eq7", nome: "RETROESCAVADEIRA 4X4", loc: 15000 },
  { id: "eq8", nome: "ESCAVADEIRA HIDRÁULICA", loc: 25000 },
  { id: "eq9", nome: "GUINCHO P/ MONTAGEM", loc: 6900 },
  { id: "eq10", nome: "PRENSA HIDRAULICA P/ EMENDAS", loc: 5290 },
  { id: "eq11", nome: "MOTOSSERRA", loc: 3397.1 },
  { id: "eq12", nome: "CAMINHÃO CABINADO 10 PESSOAS", loc: 9000 },
  { id: "eq13", nome: "GPS RTK", loc: 10580 },
  { id: "eq14", nome: "ESTAÇÃO TOTAL", loc: 6000 },
  { id: "eq15", nome: "TRATOR DE ESTEIRA", loc: 40000 },
  { id: "eq16", nome: "PÁ CARREGADEIRA", loc: 25000 },
];

export const EPI_CAT = [
  { id: "epi1", desc: "Calças operacionais", custo: 50 },
  { id: "epi2", desc: "Camisas operacionais", custo: 50 },
  { id: "epi3", desc: "Touca árabe", custo: 50 },
  { id: "epi4", desc: "Botina biq de PVC", custo: 50 },
  { id: "epi5", desc: "Luva de vaqueta", custo: 50 },
  { id: "epi6", desc: "Óculos escuro antirrisco", custo: 50 },
  { id: "epi7", desc: "Perneira bindim c/ velcro 3T", custo: 50 },
  { id: "epi8", desc: "Capacete MSA aba frontal c/ carneira", custo: 50 },
  { id: "epi9", desc: "Protetor solar FPS60", custo: 50 },
  { id: "epi10", desc: "Colete refletivo laranja", custo: 50 },
  { id: "epi11", desc: "Protetor auricular tipo plug", custo: 50 },
  { id: "epi12", desc: "Cinto de Segurança", custo: 50 },
  { id: "epi13", desc: "Talabarte em Y", custo: 50 },
  { id: "epi14", desc: "Trava Quedas", custo: 50 },
  { id: "epi15", desc: "Talabarte Abdominal", custo: 50 },
  { id: "epi16", desc: "Bolsa p/ Cinto", custo: 50 },
  { id: "epi17", desc: "Botina para operador de motosserra", custo: 50 },
  { id: "epi18", desc: "Calça para operador de motosserra", custo: 50 },
  { id: "epi19", desc: "Camisa para operador de motosserra", custo: 50 },
  { id: "epi20", desc: "Luva vaqueta motosserrista", custo: 50 },
];

export const EPC_CAT = [
  { id: "epc1", desc: "Sinalização viária", custo: 2000 },
  { id: "epc2", desc: "Corda linha de vida", custo: 1500 },
  { id: "epc3", desc: "Barreira de proteção", custo: 800 },
  { id: "epc4", desc: "Cone de sinalização (cx)", custo: 200 },
];

export const ATIVS = [
  { id: "a1", grp: "M", desc: "Pré Montagem Torre", und: "TON" },
  {
    id: "a2",
    grp: "M",
    desc: "Montagem Mecanizada",
    und: "TON",
  },
  {
    id: "a3",
    grp: "M",
    desc: "Montagem Manual",
    und: "TON",
  },
  { id: "a4", grp: "M", desc: "Revisão Torre", und: "TON" },
  { id: "a5", grp: "L", desc: "Lançamento de Cabo Piloto", und: "KM" },
  { id: "a6", grp: "L", desc: "Lançamento de Cabo Condutor", und: "KM" },
  { id: "a7", grp: "L", desc: "Grampeação de Cabo Condutor", und: "TORRE" },
];

export const REQ_CATEGORIAS = [
  "Procedimento",
  "EPC",
  "EPIs",
  "Treinamentos",
  "Outros",
];
export const REQ_TEMPOS = [0, 15, 30, 45, 60, 90, 120];
export const REQ_CAT_COLORS = {
  Procedimento: "#6366F1",
  EPC: "#F59E0B",
  EPIs: "#10B981",
  Treinamentos: "#EC4899",
  Outros: "#9CA3AF",
};

-- Migração 014: Catálogos dinâmicos por evento e cotação do dólar
-- Adiciona a coluna cotacao_dolar na tabela public.events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS cotacao_dolar NUMERIC NOT NULL DEFAULT 5.0;

-- Tabela de categorias de mão de obra por evento
CREATE TABLE IF NOT EXISTS public.event_mo_cat (
  id          TEXT NOT NULL,
  event_id    UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  cargo_pt    TEXT NOT NULL,
  cargo_es    TEXT NOT NULL,
  sal         NUMERIC NOT NULL DEFAULT 0,
  PRIMARY KEY (id, event_id)
);
ALTER TABLE public.event_mo_cat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all" ON public.event_mo_cat FOR ALL TO anon USING (true) WITH CHECK (true);

-- Tabela de equipamentos por evento
CREATE TABLE IF NOT EXISTS public.event_eq_cat (
  id          TEXT NOT NULL,
  event_id    UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  nome_pt     TEXT NOT NULL,
  nome_es     TEXT NOT NULL,
  loc         NUMERIC NOT NULL DEFAULT 0,
  PRIMARY KEY (id, event_id)
);
ALTER TABLE public.event_eq_cat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all" ON public.event_eq_cat FOR ALL TO anon USING (true) WITH CHECK (true);

-- Tabela de atividades por evento
CREATE TABLE IF NOT EXISTS public.event_atividades (
  id          TEXT NOT NULL,
  event_id    UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  grp         TEXT NOT NULL,
  desc_pt     TEXT NOT NULL,
  desc_es     TEXT NOT NULL,
  und_pt      TEXT NOT NULL,
  und_es      TEXT NOT NULL,
  kpi_base    NUMERIC NOT NULL DEFAULT 0,
  PRIMARY KEY (id, event_id)
);
ALTER TABLE public.event_atividades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all" ON public.event_atividades FOR ALL TO anon USING (true) WITH CHECK (true);

-- Tabela de requisitos base por evento
CREATE TABLE IF NOT EXISTS public.event_requisitos_base (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  atividade_id  TEXT NOT NULL,
  categoria     TEXT NOT NULL,
  descricao_pt  TEXT NOT NULL,
  descricao_es  TEXT NOT NULL,
  aplicavel     BOOLEAN NOT NULL DEFAULT true
);
ALTER TABLE public.event_requisitos_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all" ON public.event_requisitos_base FOR ALL TO anon USING (true) WITH CHECK (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_event_mo_cat_event ON public.event_mo_cat(event_id);
CREATE INDEX IF NOT EXISTS idx_event_eq_cat_event ON public.event_eq_cat(event_id);
CREATE INDEX IF NOT EXISTS idx_event_atividades_event ON public.event_atividades(event_id);
CREATE INDEX IF NOT EXISTS idx_event_requisitos_base_event ON public.event_requisitos_base(event_id);

-- Função de Seed para popular catálogos dinâmicos padrão
CREATE OR REPLACE FUNCTION public.seed_event_catalogs(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  -- 1. Inserir Mãos de Obra Padrão
  INSERT INTO public.event_mo_cat (id, event_id, cargo_pt, cargo_es, sal)
  VALUES ('mo1', p_event_id, 'AJUDANTE', 'AYUDANTE', 2500)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_mo_cat (id, event_id, cargo_pt, cargo_es, sal)
  VALUES ('mo2', p_event_id, 'MONTADOR', 'MONTADOR', 3400)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_mo_cat (id, event_id, cargo_pt, cargo_es, sal)
  VALUES ('mo3', p_event_id, 'ENCARREGADO', 'ENCARGADO', 8600)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_mo_cat (id, event_id, cargo_pt, cargo_es, sal)
  VALUES ('mo4', p_event_id, 'OPERADOR DE GUINDASTE', 'OPERADOR DE GRÚA', 8600)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_mo_cat (id, event_id, cargo_pt, cargo_es, sal)
  VALUES ('mo5', p_event_id, 'OPERADOR DE GUINCHO', 'OPERADOR DE CABRESTANTE', 4500)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_mo_cat (id, event_id, cargo_pt, cargo_es, sal)
  VALUES ('mo6', p_event_id, 'OPERADOR DE PULLER/FREIO', 'OPERADOR DE PULLER/FRENO', 8600)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_mo_cat (id, event_id, cargo_pt, cargo_es, sal)
  VALUES ('mo7', p_event_id, 'OPERADOR DE TRATOR', 'OPERADOR DE TRACTOR', 8600)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_mo_cat (id, event_id, cargo_pt, cargo_es, sal)
  VALUES ('mo8', p_event_id, 'OPERADOR DE MAQUINAS', 'OPERADOR DE MAQUINARIA', 10000)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_mo_cat (id, event_id, cargo_pt, cargo_es, sal)
  VALUES ('mo9', p_event_id, 'MOTORISTA', 'CONDUCTOR', 3100)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_mo_cat (id, event_id, cargo_pt, cargo_es, sal)
  VALUES ('mo10', p_event_id, 'MOTORISTA OPERADOR MUNCK', 'CONDUCTOR OPERADOR DE CAMIÓN PLUMA', 3700)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_mo_cat (id, event_id, cargo_pt, cargo_es, sal)
  VALUES ('mo11', p_event_id, 'ESPOREIRO', 'LINIERO TREPADOR', 3155)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_mo_cat (id, event_id, cargo_pt, cargo_es, sal)
  VALUES ('mo12', p_event_id, 'TOPOGRAFO DE OBRAS', 'TOPÓGRAFO DE OBRAS', 8614)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_mo_cat (id, event_id, cargo_pt, cargo_es, sal)
  VALUES ('mo13', p_event_id, 'AUXILIAR DE TOPOGRAFIA', 'AUXILIAR DE TOPOGRAFÍA', 2096)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_mo_cat (id, event_id, cargo_pt, cargo_es, sal)
  VALUES ('mo14', p_event_id, 'NIVELADOR', 'NIVELADOR', 3000)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_mo_cat (id, event_id, cargo_pt, cargo_es, sal)
  VALUES ('mo15', p_event_id, 'VIGIA', 'VIGÍA', 2000)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_mo_cat (id, event_id, cargo_pt, cargo_es, sal)
  VALUES ('mo16', p_event_id, 'MOTOSSERRISTA', 'MOTOSERRISTA', 3000)
  ON CONFLICT (id, event_id) DO NOTHING;

  -- 2. Inserir Equipamentos Padrão
  INSERT INTO public.event_eq_cat (id, event_id, nome_pt, nome_es, loc)
  VALUES ('eq1', p_event_id, 'GUINDASTE', 'GRÚA', 150000)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_eq_cat (id, event_id, nome_pt, nome_es, loc)
  VALUES ('eq2', p_event_id, 'CONJUNTO LANÇAMENTO - PULLER E FREIO', 'CONJUNTO DE TENDIDO - PULLER Y FRENO', 287500)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_eq_cat (id, event_id, nome_pt, nome_es, loc)
  VALUES ('eq3', p_event_id, 'CAMINHÃO MUNCK', 'CAMIÓN PLUMA', 31000)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_eq_cat (id, event_id, nome_pt, nome_es, loc)
  VALUES ('eq4', p_event_id, 'CAMINHÃO PRANCHA', 'CAMIÓN GÓNDOLA / PLATAFORMA', 18000)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_eq_cat (id, event_id, nome_pt, nome_es, loc)
  VALUES ('eq5', p_event_id, 'CAMINHÃO CARROCERIA', 'CAMIÓN CARROCERÍA', 18000)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_eq_cat (id, event_id, nome_pt, nome_es, loc)
  VALUES ('eq6', p_event_id, 'CAMINHONETE 4X4', 'CAMIONETA 4X4', 8500)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_eq_cat (id, event_id, nome_pt, nome_es, loc)
  VALUES ('eq7', p_event_id, 'TRATOR', 'TRACTOR', 17000)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_eq_cat (id, event_id, nome_pt, nome_es, loc)
  VALUES ('eq8', p_event_id, 'RETROESCAVADEIRA 4X4', 'RETROEXCAVADORA 4X4', 15000)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_eq_cat (id, event_id, nome_pt, nome_es, loc)
  VALUES ('eq9', p_event_id, 'GUINCHO P/ MONTAGEM', 'CABRESTANTE DE MONTAJE', 6900)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_eq_cat (id, event_id, nome_pt, nome_es, loc)
  VALUES ('eq10', p_event_id, 'PRENSA HIDRAULICA P/ EMENDAS', 'PRENSA HIDRÁULICA PARA EMPALMES', 5290)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_eq_cat (id, event_id, nome_pt, nome_es, loc)
  VALUES ('eq11', p_event_id, 'MOTOSSERRA', 'MOTOSIERRA', 3397.1)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_eq_cat (id, event_id, nome_pt, nome_es, loc)
  VALUES ('eq12', p_event_id, 'MASTRO DE MONTAGEM', 'MÁSTIL DE MONTAJE', 4000)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_eq_cat (id, event_id, nome_pt, nome_es, loc)
  VALUES ('eq13', p_event_id, 'CAMINHÃO CABINADO 10 PESSOAS', 'CAMIÓN CABINADO PARA PERSONAL', 9000)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_eq_cat (id, event_id, nome_pt, nome_es, loc)
  VALUES ('eq14', p_event_id, 'GPS RTK', 'GPS RTK', 10580)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_eq_cat (id, event_id, nome_pt, nome_es, loc)
  VALUES ('eq15', p_event_id, 'ESTAÇÃO TOTAL', 'ESTACIÓN TOTAL', 6000)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_eq_cat (id, event_id, nome_pt, nome_es, loc)
  VALUES ('eq16', p_event_id, 'MICRO ONIBUS (20 PASSAGEIROS)', 'MICROBÚS (20 PASAJEROS)', 16000)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_eq_cat (id, event_id, nome_pt, nome_es, loc)
  VALUES ('eq17', p_event_id, 'MICRO ONIBUS (30 PASSAGEIROS)', 'MICROBÚS (30 PASAJEROS)', 18000)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_eq_cat (id, event_id, nome_pt, nome_es, loc)
  VALUES ('eq18', p_event_id, 'ESCAVADEIRA HIDRÁULICA', 'EXCAVADORA HIDRÁULICA', 25000)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_eq_cat (id, event_id, nome_pt, nome_es, loc)
  VALUES ('eq19', p_event_id, 'TRATOR DE ESTEIRA', 'TRACTOR DE ORUGAS', 40000)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_eq_cat (id, event_id, nome_pt, nome_es, loc)
  VALUES ('eq20', p_event_id, 'PÁ CARREGADEIRA', 'PALA CARGADORA', 25000)
  ON CONFLICT (id, event_id) DO NOTHING;

  -- 3. Inserir Atividades Padrão
  INSERT INTO public.event_atividades (id, event_id, grp, desc_pt, desc_es, und_pt, und_es, kpi_base)
  VALUES ('a1', p_event_id, 'M', 'Pré Montagem Torre', 'Premontaje de Torre', 'TON', 'TON', 9)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_atividades (id, event_id, grp, desc_pt, desc_es, und_pt, und_es, kpi_base)
  VALUES ('a2', p_event_id, 'M', 'Montagem Mecanizada', 'Montaje Mecanizado', 'TON', 'TON', 36)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_atividades (id, event_id, grp, desc_pt, desc_es, und_pt, und_es, kpi_base)
  VALUES ('a3', p_event_id, 'M', 'Montagem Manual', 'Montaje Manual', 'TON', 'TON', 9)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_atividades (id, event_id, grp, desc_pt, desc_es, und_pt, und_es, kpi_base)
  VALUES ('a4', p_event_id, 'M', 'Revisão Torre', 'Revisión de Torre', 'TON', 'TON', 18)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_atividades (id, event_id, grp, desc_pt, desc_es, und_pt, und_es, kpi_base)
  VALUES ('a5', p_event_id, 'L', 'Lançamento de Cabo OPGW', 'Tendido de Cable OPGW', 'KM', 'KM', 1.5)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_atividades (id, event_id, grp, desc_pt, desc_es, und_pt, und_es, kpi_base)
  VALUES ('a6', p_event_id, 'L', 'Lançamento de Cabo Condutor', 'Tendido de Cable Conductor', 'KM', 'KM', 1.2)
  ON CONFLICT (id, event_id) DO NOTHING;
  INSERT INTO public.event_atividades (id, event_id, grp, desc_pt, desc_es, und_pt, und_es, kpi_base)
  VALUES ('a7', p_event_id, 'L', 'Grampeação de Cabo Condutor', 'Engrapado de Cable Conductor', 'TORRE', 'TORRE', 3)
  ON CONFLICT (id, event_id) DO NOTHING;

  -- 4. Inserir Requisitos Base Padrão
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a1', 'Procedimento', 'Procedimento Específico da atividade', 'Procedimiento Específico de la actividad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a1', 'Procedimento', 'Análise Preliminar de Riscos (APR)', 'Análisis Preliminar de Riesgos (APR)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a1', 'Treinamentos', 'Planilha de Perigos e Riscos (PPR)', 'Planilla de Peligros y Riesgos (PPR)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a1', 'Treinamentos', 'Permissão de Trabalho Específico (PTE)', 'Permiso de Trabajo Específico (PTE)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a1', 'Treinamentos', 'Diálogo Diário de Segurança (DDS)', 'Diálogo Diario de Seguridad (DDS)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a1', 'Procedimento', 'Detector de Tensão', 'Detector de Tensión', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a1', 'Treinamentos', 'Plano de Atendimento de Emergências (PAE)', 'Plan de Atención de Emergencias (PAE)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a1', 'Procedimento', 'Checklist específico para máquinas, veículos e equipamentos', 'Checklist específico para máquinas, vehículos y equipos', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a1', 'Projetos', 'Especificações técnicas e projetos', 'Especificaciones técnicas y proyectos', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a1', 'Procedimento', 'Relatórios de inspeção de acessórios e equipamentos (Laudos)', 'Informes de inspección de accesorios y equipos (Laudos)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a1', 'Procedimento', 'Protocolo da atividade / Duplo Check', 'Protocolo de la actividad / Doble Check', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a1', 'EPIs', 'Capacete', 'Casco', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a1', 'EPIs', 'Óculos', 'Gafas de seguridad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a1', 'EPIs', 'Botina', 'Botas de seguridad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a1', 'EPIs', 'Uniforme Padrão', 'Uniforme Estándar', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a1', 'EPIs', 'Botina de segurança com biqueira de aço', 'Botas de seguridad con puntera de acero', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a1', 'EPIs', 'Luvas de segurança', 'Guantes de seguridad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a1', 'EPIs', 'Avental de Raspa', 'Delantal de cuero/raspa', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a1', 'EPIs', 'Máscara de solda', 'Máscara de soldadura', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a1', 'Treinamentos', 'Integração de Saúde e Segurança', 'Inducción de Salud y Seguridad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a1', 'Treinamentos', 'Segurança e Saúde nos Trabalhos em Espaços Confinados', 'Seguridad y Salud en Trabajos en Espacios Confinados', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a1', 'Treinamentos', 'Movimentação de Produtos Perigosos - MOPP', 'Transporte de Mercancías Peligrosas', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a1', 'EPC', 'Sinalização', 'Señalización', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a1', 'EPC', 'Autofalante', 'Megáfono / Altavoz', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a1', 'EPIs', 'Perneira de proteção', 'Polainas de protección', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a2', 'Procedimento', 'Procedimento Específico da atividade', 'Procedimiento Específico de la actividad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a2', 'Procedimento', 'Análise Preliminar de Riscos (APR)', 'Análisis Preliminar de Riesgos (APR)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a2', 'Procedimento', 'Planilha de Perigos e Riscos (PPR)', 'Planilla de Peligros y Riesgos (PPR)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a2', 'Treinamentos', 'Permissão de Trabalho Específico (PTE)', 'Permiso de Trabajo Específico (PTE)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a2', 'Treinamentos', 'Diálogo Diário de Segurança (DDS)', 'Diálogo Diario de Seguridad (DDS)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a2', 'Treinamentos', 'Plano de Atendimento de Emergências (PAE)', 'Plan de Atención de Emergencias (PAE)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a2', 'Procedimento', 'Checklist específico para máquinas, veículos, equipamentos', 'Checklist específico para máquinas, veículos, equipamentos', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a2', 'Projetos', 'Especificações técnicas e projetos', 'Especificaciones técnicas y proyectos', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a2', 'Projetos', 'Plano de rigging', 'Plan de izaje (rigging)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a2', 'Procedimento', 'Içamento das estruturas excedendo a capacidade nominal do equipamento', 'Izaje de estructuras excediendo la capacidad nominal del equipo', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a2', 'Procedimento', 'Relatórios de inspeção de acessórios e equipamentos (Laudos)', 'Informes de inspección de accesorios y equipos (Laudos)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a2', 'Procedimento', 'Protocolo da atividade / Duplo Check', 'Protocolo de la actividad / Doble Check', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a2', 'EPIs', 'Capacete', 'Casco', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a2', 'EPIs', 'Óculos', 'Gafas de seguridad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a2', 'EPIs', 'Botina', 'Botas de seguridad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a2', 'EPIs', 'Uniforme Padrão', 'Uniforme Estándar', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a2', 'EPIs', 'Cinto de Segurança tipo paraquedista e dispositivos retenção de queda', 'Arnés de Seguridad tipo paracaidista y dispositivos anticaídas', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a2', 'EPIs', 'Botina de segurança com biqueira de aço', 'Botas de seguridad con puntera de acero', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a2', 'EPIs', 'Luvas de segurança', 'Guantes de seguridad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a2', 'EPIs', 'Máscara de solda', 'Máscara de soldadura', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a2', 'EPIs', 'Avental de Raspa', 'Delantal de cuero/raspa', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a2', 'Treinamentos', 'NR 18 - Integração de Saúde e Segurança', 'NR 18 - Inducción de Salud y Seguridad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a2', 'Treinamentos', 'NR-33 - Segurança e Saúde nos Trabalhos em Espaços Confinados', 'NR-33 - Seguridad y Salud en Trabajos en Espacios Confinados', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a2', 'Treinamentos', 'NR-35 - Trabalho em Altura', 'NR-35 - Trabajo en Altura', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a2', 'Treinamentos', 'Movimentação de Produtos Perigosos - MOPP', 'Transporte de Mercancías Peligrosas', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a2', 'Treinamentos', 'Montagem Mecanizada de Estruturas Estaiadas e Autoportantes', 'Montaje Mecanizado de Estructuras Atirantadas y Autoportantes', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a2', 'Treinamentos', 'Utilização e Inspeção em Acessórios de Carga', 'Uso e Inspección de Accesorios de Carga', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a2', 'EPC', 'Sinalização', 'Señalización', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a2', 'EPC', 'Autofalante', 'Megáfono / Altavoz', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a2', 'EPC', 'Corda Linha de vida', 'Cuerda Línea de vida', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a2', 'EPIs', 'Perneira de proteção', 'Polainas de protección', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a3', 'Procedimento', 'Procedimento Específico da atividade', 'Procedimiento Específico de la actividad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a3', 'Procedimento', 'Análise Preliminar de Riscos (APR)', 'Análisis Preliminar de Riesgos (APR)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a3', 'Procedimento', 'Planilha de Perigos e Riscos (PPR)', 'Planilla de Peligros y Riesgos (PPR)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a3', 'Procedimento', 'Permissão de Trabalho Específico (PTE)', 'Permiso de Trabajo Específico (PTE)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a3', 'Treinamentos', 'Diálogo Diário de Segurança (DDS)', 'Diálogo Diario de Seguridad (DDS)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a3', 'Treinamentos', 'Plano de Atendimento de Emergências (PAE)', 'Plan de Atención de Emergencias (PAE)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a3', 'Procedimento', 'Checklist específico para máquinas, veículos e equipamentos', 'Checklist específico para máquinas, vehículos y equipos', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a3', 'Projetos', 'Especificações técnicas e projetos', 'Especificaciones técnicas y proyectos', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a3', 'Procedimento', 'Pluma com números de series divergentes entre os módulos', 'Pluma con números de series divergentes entre los módulos', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a3', 'Procedimento', 'Relatórios de inspeção de acessórios e equipamentos (Laudos)', 'Informes de inspección de accesorios y equipos (Laudos)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a3', 'Procedimento', 'Protocolo da atividade / Duplo Check', 'Protocolo de la actividad / Doble Check', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a3', 'Treinamentos', 'Integração de Saúde e Segurança', 'Inducción de Salud y Seguridad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a3', 'Treinamentos', 'NR-33 - Segurança e Saúde nos Trabalhos em Espaços Confinados', 'NR-33 - Seguridad y Salud en Trabajos en Espacios Confinados', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a3', 'Treinamentos', 'NR-35 - Trabalho em Altura', 'NR-35 - Trabajo en Altura', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a3', 'Treinamentos', 'Movimentação de Produtos Perigosos - MOPP', 'Transporte de Mercancías Peligrosas', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a3', 'Treinamentos', 'Utilização e Inspeção em Acessórios de Carga', 'Uso e Inspección de Accesorios de Carga', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a3', 'EPIs', 'Capacete', 'Casco', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a3', 'EPIs', 'Óculos', 'Gafas de seguridad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a3', 'EPIs', 'Botina', 'Botas de seguridad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a3', 'EPIs', 'Uniforme Padrão', 'Uniforme Estándar', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a3', 'EPIs', 'Cinto de Segurança tipo paraquedista e dispositivos retenção de queda', 'Arnés de Seguridad tipo paracaidista y dispositivos anticaídas', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a3', 'EPIs', 'Botina de segurança com biqueira de aço', 'Botas de seguridad con puntera de acero', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a3', 'EPIs', 'Luvas de segurança', 'Guantes de seguridad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a3', 'EPC', 'Autofalante', 'Megáfono / Altavoz', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a3', 'EPC', 'Sinalização', 'Señalización', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a3', 'EPC', 'Corda Linha de vida', 'Cuerda Línea de vida', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a3', 'EPIs', 'Perneira de proteção', 'Polainas de protección', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a4', 'Procedimento', 'Procedimento Específico da atividade', 'Procedimiento Específico de la actividad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a4', 'Procedimento', 'Análise Preliminar de Riscos (APR)', 'Análisis Preliminar de Riesgos (APR)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a4', 'Procedimento', 'Planilha de Perigos e Riscos (PPR)', 'Planilla de Peligros y Riesgos (PPR)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a4', 'Procedimento', 'Permissão de Trabalho Específico (PTE)', 'Permiso de Trabajo Específico (PTE)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a4', 'Treinamentos', 'Diálogo Diário de Segurança (DDS)', 'Diálogo Diario de Seguridad (DDS)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a4', 'Treinamentos', 'Plano de Atendimento de Emergências (PAE)', 'Plan de Atención de Emergencias (PAE)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a4', 'Procedimento', 'Checklist específico para máquinas, veículos e equipamentos', 'Checklist específico para máquinas, vehículos y equipos', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a4', 'Projetos', 'Especificações técnicas e projetos', 'Especificaciones técnicas y proyectos', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a4', 'Procedimento', 'Pluma com números de series divergentes entre os módulos', 'Pluma con números de series divergentes entre los módulos', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a4', 'Procedimento', 'Relatórios de inspeção de acessórios e equipamentos (Laudos)', 'Informes de inspección de accesorios y equipos (Laudos)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a4', 'Procedimento', 'Protocolo da atividade / Duplo Check', 'Protocolo de la actividad / Doble Check', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a4', 'Treinamentos', 'Integração de Saúde e Segurança', 'Inducción de Salud y Seguridad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a4', 'Treinamentos', 'NR-33 - Segurança e Saúde nos Trabalhos em Espaços Confinados', 'NR-33 - Seguridad y Salud en Trabajos en Espacios Confinados', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a4', 'Treinamentos', 'NR-35 - Trabalho em Altura', 'NR-35 - Trabajo en Altura', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a4', 'Treinamentos', 'Movimentação de Produtos Perigosos - MOPP', 'Transporte de Mercancías Peligrosas', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a4', 'EPIs', 'Capacete', 'Casco', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a4', 'EPIs', 'Óculos', 'Gafas de seguridad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a4', 'EPIs', 'Botina', 'Botas de seguridad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a4', 'EPIs', 'Uniforme Padrão', 'Uniforme Estándar', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a4', 'EPIs', 'Cinto de Segurança tipo paraquedista e dispositivos retenção de queda', 'Arnés de Seguridad tipo paracaidista y dispositivos anticaídas', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a4', 'EPIs', 'Botina de segurança com biqueira de aço', 'Botas de seguridad con puntera de acero', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a4', 'EPIs', 'Luvas de segurança', 'Guantes de seguridad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a4', 'EPIs', 'Avental de raspa', 'Delantal de cuero/raspa', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a4', 'EPIs', 'Máscara de solda', 'Máscara de soldadura', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a4', 'EPC', 'Autofalante', 'Megáfono / Altavoz', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a4', 'EPC', 'Sinalização', 'Señalización', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a4', 'EPC', 'Corda Linha de vida', 'Cuerda Línea de vida', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a4', 'EPIs', 'Perneira de proteção', 'Polainas de protección', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a5', 'Procedimento', 'Procedimento Específico da atividade', 'Procedimiento Específico de la actividad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a5', 'Procedimento', 'Análise Preliminar de Riscos (APR)', 'Análisis Preliminar de Riesgos (APR)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a5', 'Procedimento', 'Planilha de Perigos e Riscos (PPR)', 'Planilla de Peligros y Riesgos (PPR)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a5', 'Procedimento', 'Permissão de Trabalho Específico (PTE)', 'Permiso de Trabajo Específico (PTE)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a5', 'Treinamentos', 'Diálogo Diário de Segurança (DDS)', 'Diálogo Diario de Seguridad (DDS)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a5', 'Treinamentos', 'Plano de Atendimento de Emergências (PAE)', 'Plan de Atención de Emergencias (PAE)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a5', 'Procedimento', 'Checklist específico para máquinas, veículos e equipamentos', 'Checklist específico para máquinas, vehículos y equipos', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a5', 'Projetos', 'Especificações técnicas, projetos, planos de lançamentos', 'Especificaciones técnicas, proyectos, planes de tendido', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a5', 'Procedimento', 'Relatórios de inspeção de acessórios e equipamentos (Laudos)', 'Informes de inspección de accesorios y equipos (Laudos)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a5', 'Treinamentos', 'NR 18 - Integração de Saúde e Segurança', 'NR 18 - Inducción de Salud y Seguridad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a5', 'Treinamentos', 'NR-10 – Básico / SEP', 'NR-10 – Básico / SEP', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a5', 'Treinamentos', 'NR-33 - Segurança e Saúde nos Trabalhos em Espaços Confinados', 'NR-33 - Seguridad y Salud en Trabajos en Espacios Confinados', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a5', 'Treinamentos', 'NR-35 - Trabalho em Altura', 'NR-35 - Trabajo en Altura', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a5', 'Treinamentos', 'Segurança em Atividades com corte e solda', 'Seguridad en Actividades con corte y soldadura', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a5', 'Treinamentos', 'Lançamento de Cabos', 'Tendido de Cables', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a5', 'Treinamentos', 'Utilização e Inspeção em Acessórios de Carga', 'Uso e Inspección de Accesorios de Carga', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a5', 'EPIs', 'Capacete', 'Casco', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a5', 'EPIs', 'Óculos', 'Gafas de seguridad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a5', 'EPIs', 'Botina', 'Botas de seguridad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a5', 'EPIs', 'Uniforme Antichama', 'Uniforme Ignífugo / Antichama', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a5', 'EPIs', 'Cinto de Segurança tipo paraquedista e dispositivos retenção de queda', 'Arnés de Seguridad tipo paracaidista y dispositivos anticaídas', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a5', 'EPIs', 'Botina de segurança com biqueira de aço', 'Botas de seguridad con puntera de acero', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a5', 'EPIs', 'Luvas de segurança', 'Guantes de seguridad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a5', 'EPC', 'Desligamento e/ou Bloqueio das Redes elétricas', 'Desconexión y/o Bloqueo de Redes eléctricas', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a5', 'Procedimento', '5 Regras de Ouro', '5 Reglas de Oro', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a5', 'EPC', 'Aterramento Temporário', 'Puesta a Tierra Temporal', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a5', 'EPC', 'Ponte para atravessar de uma fase para outra', 'Puente para cruzar de una fase a otra', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a5', 'EPC', 'Sinalização', 'Señalización', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a5', 'EPC', 'Autofalante', 'Megáfono / Altavoz', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a5', 'EPIs', 'Perneira de proteção', 'Polainas de protección', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a6', 'Procedimento', 'Procedimento Específico da atividade', 'Procedimiento Específico de la actividad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a6', 'Procedimento', 'Análise Preliminar de Riscos (APR)', 'Análisis Preliminar de Riesgos (APR)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a6', 'Procedimento', 'Planilha de Perigos e Riscos (PPR)', 'Planilla de Peligros y Riesgos (PPR)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a6', 'Procedimento', 'Permissão de Trabalho Específico (PTE)', 'Permiso de Trabajo Específico (PTE)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a6', 'Treinamentos', 'Diálogo Diário de Segurança (DDS)', 'Diálogo Diario de Seguridad (DDS)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a6', 'Treinamentos', 'Plano de Atendimento de Emergências (PAE)', 'Plan de Atención de Emergencias (PAE)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a6', 'Procedimento', 'Checklist específico para máquinas, veículos e equipamentos', 'Checklist específico para máquinas, vehículos y equipos', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a6', 'Projetos', 'Especificações técnicas, projetos, planos de lançamentos', 'Especificaciones técnicas, proyectos, planes de tendido', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a6', 'Procedimento', 'Relatórios de inspeção de acessórios e equipamentos (Laudos)', 'Informes de inspección de accesorios y equipos (Laudos)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a6', 'Treinamentos', 'NR 18 - Integração de Saúde e Segurança', 'NR 18 - Inducción de Salud y Seguridad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a6', 'Treinamentos', 'NR-10 – Básico / SEP', 'NR-10 – Básico / SEP', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a6', 'Treinamentos', 'NR-33 - Segurança e Saúde nos Trabalhos em Espaços Confinados', 'NR-33 - Seguridad y Salud en Trabajos en Espacios Confinados', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a6', 'Treinamentos', 'NR-35 - Trabalho em Altura', 'NR-35 - Trabajo en Altura', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a6', 'Treinamentos', 'Segurança em Atividades com corte e solda', 'Seguridad en Actividades con corte y soldadura', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a6', 'Treinamentos', 'Instalação de Aterramentos Temporários', 'Instalación de Puestas a Tierra Temporales', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a6', 'Treinamentos', 'Lançamento de Cabos', 'Tendido de Cables', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a6', 'Treinamentos', 'Utilização e Inspeção em Acessórios de Carga', 'Uso e Inspección de Accesorios de Carga', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a6', 'Treinamentos', 'Regulagem e nivelamento de cabos', 'Regulación y nivelación de cables', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a6', 'EPIs', 'Capacete', 'Casco', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a6', 'EPIs', 'Óculos', 'Gafas de seguridad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a6', 'EPIs', 'Botina', 'Botas de seguridad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a6', 'EPIs', 'Uniforme Antichama', 'Uniforme Ignífugo / Antichama', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a6', 'EPIs', 'Cinto de Segurança tipo paraquedista e dispositivos retenção de queda', 'Arnés de Seguridad tipo paracaidista y dispositivos anticaídas', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a6', 'EPIs', 'Botina de segurança com biqueira de aço', 'Botas de seguridad con puntera de acero', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a6', 'EPIs', 'Luvas de segurança', 'Guantes de seguridad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a6', 'EPC', 'Desligamento e/ou Bloqueio das Redes elétricas', 'Desconexión y/o Bloqueo de Redes eléctricas', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a6', 'Procedimento', '5 Regras de Ouro', '5 Reglas de Oro', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a6', 'EPC', 'Aterramento Temporário', 'Puesta a Tierra Temporal', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a6', 'EPC', 'Ponte para atravessar de uma fase para outra', 'Puente para cruzar de una fase a otra', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a6', 'EPC', 'Sinalização', 'Señalización', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a6', 'EPC', 'Autofalante', 'Megáfono / Altavoz', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a7', 'Procedimento', 'Procedimento Específico da atividade', 'Procedimiento Específico de la actividad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a7', 'Procedimento', 'Análise Preliminar de Riscos (APR)', 'Análisis Preliminar de Riesgos (APR)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a7', 'Procedimento', 'Planilha de Perigos e Riscos (PPR)', 'Planilla de Peligros y Riesgos (PPR)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a7', 'Procedimento', 'Permissão de Trabalho Específico (PTE)', 'Permiso de Trabajo Específico (PTE)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a7', 'Treinamentos', 'Diálogo Diário de Segurança (DDS)', 'Diálogo Diario de Seguridad (DDS)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a7', 'Treinamentos', 'Plano de Atendimento de Emergências (PAE)', 'Plan de Atención de Emergencias (PAE)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a7', 'Procedimento', 'Checklist específico para máquinas, veículos e equipamentos', 'Checklist específico para máquinas, vehículos y equipos', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a7', 'Projetos', 'Especificações técnicas, projetos, planos de lançamentos', 'Especificaciones técnicas, proyectos, planes de tendido', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a7', 'Procedimento', 'Relatórios de inspeção de acessórios e equipamentos (Laudos)', 'Informes de inspección de accesorios y equipos (Laudos)', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a7', 'Treinamentos', 'NR 18 - Integração de Saúde e Segurança', 'NR 18 - Inducción de Salud y Seguridad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a7', 'Treinamentos', 'NR-10 – Básico / SEP', 'NR-10 – Básico / SEP', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a7', 'Treinamentos', 'NR-33 - Segurança e Saúde nos Trabalhos em Espaços Confinados', 'NR-33 - Seguridad y Salud en Trabajos en Espacios Confinados', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a7', 'Treinamentos', 'NR-35 - Trabalho em Altura', 'NR-35 - Trabajo en Altura', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a7', 'Treinamentos', 'Segurança em Atividades com corte e solda', 'Seguridad en Actividades con corte y soldadura', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a7', 'Treinamentos', 'Instalação de Aterramentos Temporários', 'Instalación de Puestas a Tierra Temporales', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a7', 'Treinamentos', 'Utilização e Inspeção em Acessórios de Carga', 'Uso e Inspección de Accesorios de Carga', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a7', 'EPIs', 'Capacete', 'Casco', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a7', 'EPIs', 'Óculos', 'Gafas de seguridad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a7', 'EPIs', 'Botina', 'Botas de seguridad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a7', 'EPIs', 'Uniforme Antichama', 'Uniforme Ignífugo / Antichama', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a7', 'EPIs', 'Cinto de Segurança tipo paraquedista e dispositivos retenção de queda', 'Arnés de Seguridad tipo paracaidista y dispositivos anticaídas', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a7', 'EPIs', 'Botina de segurança com biqueira de aço', 'Botas de seguridad con puntera de acero', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a7', 'EPIs', 'Luvas de segurança', 'Guantes de seguridad', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a7', 'EPIs', 'Máscara de solda', 'Máscara de soldadura', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a7', 'EPIs', 'Avental de raspa', 'Delantal de cuero/raspa', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a7', 'Procedimento', '5 Regras de Ouro', '5 Reglas de Oro', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a7', 'EPC', 'Aterramento Temporário', 'Puesta a Tierra Temporal', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a7', 'EPC', 'Ponte para atravessar de uma fase para outra', 'Puente para cruzar de una fase a otra', false);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a7', 'EPC', 'Sinalização', 'Señalización', true);
  INSERT INTO public.event_requisitos_base (event_id, atividade_id, categoria, descricao_pt, descricao_es, aplicavel)
  VALUES (p_event_id, 'a7', 'EPC', 'Autofalante', 'Megáfono / Altavoz', false);

END;
$$;

-- Atualizar a RPC de criação de eventos para rodar o seed automático
CREATE OR REPLACE FUNCTION public.create_event(
  p_admin_senha text,
  p_nome text,
  p_fac_login text,
  p_fac_senha text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_event_id uuid;
BEGIN
  IF NOT public.login_admin(p_admin_senha) THEN
    RAISE EXCEPTION 'Acesso negado: Senha administrativa incorreta.';
  END IF;

  INSERT INTO events (nome, facilitador_login, facilitador_senha_hash)
  VALUES (
    p_nome,
    p_fac_login,
    crypt(p_fac_senha, gen_salt('bf', 12))
  )
  RETURNING id INTO v_event_id;

  -- Roda o seed dinâmico para este evento
  PERFORM public.seed_event_catalogs(v_event_id);

  RETURN v_event_id;
END;
$$;

-- Atualizar RPC de Dashboard administrativa para expor a cotação do dólar
DROP FUNCTION IF EXISTS public.get_admin_dashboard_data(text);
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_data(p_admin_senha text)
RETURNS TABLE(
  event_id uuid,
  event_nome text,
  facilitador_login text,
  created_at timestamptz,
  total_sessions bigint,
  total_groups bigint,
  cotacao_dolar numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public.login_admin(p_admin_senha) THEN
    RAISE EXCEPTION 'Acesso negado: Senha administrativa incorreta.';
  END IF;

  RETURN QUERY
  SELECT
    e.id AS event_id,
    e.nome AS event_nome,
    e.facilitador_login,
    e.created_at,
    COALESCE(count(DISTINCT s.id), 0)::bigint AS total_sessions,
    COALESCE(count(DISTINCT g.id), 0)::bigint AS total_groups,
    e.cotacao_dolar
  FROM events e
  LEFT JOIN sessions s ON s.event_id = e.id
  LEFT JOIN grupos g ON g.session_id = s.id
  GROUP BY e.id, e.nome, e.facilitador_login, e.created_at, e.cotacao_dolar
  ORDER BY e.created_at DESC;
END;
$$;

-- Criar RPC para o administrador atualizar o evento (incluindo a cotação do dólar)
CREATE OR REPLACE FUNCTION public.update_event(
  p_admin_senha text,
  p_event_id uuid,
  p_nome text,
  p_fac_login text,
  p_fac_senha text,
  p_cotacao_dolar numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public.login_admin(p_admin_senha) THEN
    RAISE EXCEPTION 'Acesso negado: Senha administrativa incorreta.';
  END IF;

  -- Se senha for enviada (não for vazia), atualiza com nova senha
  IF p_fac_senha IS NOT NULL AND p_fac_senha <> '' THEN
    UPDATE events
       SET nome = p_nome,
           facilitador_login = p_fac_login,
           facilitador_senha_hash = crypt(p_fac_senha, gen_salt('bf', 12)),
           cotacao_dolar = p_cotacao_dolar
     WHERE id = p_event_id;
  ELSE
    UPDATE events
       SET nome = p_nome,
           facilitador_login = p_fac_login,
           cotacao_dolar = p_cotacao_dolar
     WHERE id = p_event_id;
  END IF;
END;
$$;

-- Seed retroativo para eventos já criados
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.events LOOP
    -- Semeia se não tiver cadastros nele
    IF NOT EXISTS (SELECT 1 FROM public.event_mo_cat WHERE event_id = r.id) THEN
      PERFORM public.seed_event_catalogs(r.id);
    END IF;
  END LOOP;
END $$;

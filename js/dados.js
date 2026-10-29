/* =========================================================
   Dados 100% FICTÍCIOS usados pelos simuladores.
   Instituições, cursos, vagas, notas de corte e pessoas foram
   inventados para a demonstração. Nada aqui é oficial.
   Para atualizar valores de uma nova edição, altere este arquivo.
   ========================================================= */

// Salário mínimo de 2026 (R$ 1.621,00). Base para os limites de renda.
const SALARIO_MINIMO = 1621.00;

const EDICAO = {
  sisu:   { ano: 2026, editaisEnem: [2023, 2024, 2025] },
  prouni: { ano: 2026, semestre: 2, editaisEnem: [2024, 2025] },
  fies:   { ano: 2026, semestre: 2, enemDesde: 2010 }
};

// Candidato fictício. O CPF é gerado na hora (formato válido, pessoa inexistente).
const CANDIDATO_FICTICIO = {
  nome: 'Ana Clara Simulada Rocha',
  nomeMae: 'Joana Fictícia Rocha',
  dataNascimento: '2008-03-14',
  sexo: 'Feminino',
  email: 'ana.simulada@exemplo.com',
  celular: '(51) 99999-0000',
  telefone: '',
  cep: '95680-000',
  uf: 'RS',
  municipio: 'Igrejinha',
  logradouro: 'Rua das Simulações',
  numero: '100',
  complemento: 'Casa',
  bairro: 'Centro',
  // Participações no Enem. Notas inventadas.
  enem: [
    { edicao: 2023, inscricao: '230001234567', situacao: 'treineiro',
      notas: { lc: 520.4, ch: 540.1, cn: 498.7, mt: 530.2, red: 640 } },
    { edicao: 2024, inscricao: '241009876543', situacao: 'valida',
      notas: { lc: 582.3, ch: 611.8, cn: 541.2, mt: 593.6, red: 760 } },
    { edicao: 2025, inscricao: '251004567890', situacao: 'valida',
      notas: { lc: 601.7, ch: 624.9, cn: 556.4, mt: 618.1, red: 820 } }
  ]
};

// Grupo familiar fictício (usado no Prouni e no Fies).
const GRUPO_FAMILIAR_FICTICIO = [
  { nome: 'Joana Fictícia Rocha', parentesco: 'Mãe', dataNascimento: '1982-07-02', renda: 1850.00 },
  { nome: 'Carlos Inventado Rocha', parentesco: 'Pai', dataNascimento: '1979-11-20', renda: 1700.00 },
  { nome: 'Pedro Simulado Rocha', parentesco: 'Irmão(ã)', dataNascimento: '2013-05-09', renda: 0 }
];

const PARENTESCOS = [
  'Pai', 'Mãe', 'Padrasto', 'Madrasta', 'Cônjuge/Companheiro(a)', 'Filho(a)', 'Enteado(a)',
  'Irmão(ã)', 'Avô/Avó', 'Neto(a)', 'Tio(a)', 'Sobrinho(a)', 'Primo(a)', 'Outro'
];

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB',
  'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

const AREAS_ENEM = {
  lc: 'Linguagens e Códigos',
  ch: 'Ciências Humanas',
  cn: 'Ciências da Natureza',
  mt: 'Matemática',
  red: 'Redação'
};

/* ---------------------------------------------------------
   SISU — modalidades de concorrência (Lei nº 12.711/2012,
   atualizada pela Lei nº 14.723/2023).
   --------------------------------------------------------- */
const MODALIDADES_SISU = {
  AC:     'Ampla concorrência',
  LB_PPI: 'Candidatos autodeclarados pretos, pardos ou indígenas, com renda familiar bruta per capita igual ou inferior a 1 salário mínimo e que tenham cursado integralmente o ensino médio em escolas públicas',
  LB_Q:   'Candidatos autodeclarados quilombolas, com renda familiar bruta per capita igual ou inferior a 1 salário mínimo e que tenham cursado integralmente o ensino médio em escolas públicas',
  LB_PCD: 'Candidatos com deficiência, com renda familiar bruta per capita igual ou inferior a 1 salário mínimo e que tenham cursado integralmente o ensino médio em escolas públicas',
  LB_EP:  'Candidatos com renda familiar bruta per capita igual ou inferior a 1 salário mínimo que tenham cursado integralmente o ensino médio em escolas públicas',
  LI_PPI: 'Candidatos autodeclarados pretos, pardos ou indígenas, independentemente da renda, que tenham cursado integralmente o ensino médio em escolas públicas',
  LI_Q:   'Candidatos autodeclarados quilombolas, independentemente da renda, que tenham cursado integralmente o ensino médio em escolas públicas',
  LI_PCD: 'Candidatos com deficiência, independentemente da renda, que tenham cursado integralmente o ensino médio em escolas públicas',
  LI_EP:  'Candidatos que, independentemente da renda, tenham cursado integralmente o ensino médio em escolas públicas'
};

// Quanto a nota de corte de cada modalidade fica abaixo da ampla concorrência (fictício).
const DIFERENCA_CORTE_SISU = {
  AC: 0, LI_EP: 25, LI_PPI: 40, LI_Q: 60, LI_PCD: 70,
  LB_EP: 45, LB_PPI: 60, LB_Q: 80, LB_PCD: 90, V: 50
};

const OFERTAS_SISU = [
  { id: 's1', ies: 'Universidade Federal do Vale', sigla: 'UFVALE', local: 'Campus Taquara', municipio: 'Taquara', uf: 'RS',
    curso: 'Análise e Desenvolvimento de Sistemas', grau: 'Tecnológico', turno: 'Noturno', formato: 'Presencial',
    vagas: 40, pesos: { lc: 1, ch: 1, cn: 1, mt: 2, red: 1 }, corteAC: 642.5,
    acoesProprias: [{ tipo: 'V', descricao: 'Reserva de vagas para pessoas refugiadas ou com visto humanitário' }] },
  { id: 's2', ies: 'Universidade Federal do Vale', sigla: 'UFVALE', local: 'Campus Taquara', municipio: 'Taquara', uf: 'RS',
    curso: 'Administração', grau: 'Bacharelado', turno: 'Noturno', formato: 'Presencial',
    vagas: 50, pesos: { lc: 1, ch: 2, cn: 1, mt: 2, red: 1 }, corteAC: 655.1, acoesProprias: [] },
  { id: 's3', ies: 'Universidade Federal do Vale', sigla: 'UFVALE', local: 'Campus Parobé', municipio: 'Parobé', uf: 'RS',
    curso: 'Pedagogia', grau: 'Licenciatura', turno: 'Noturno', formato: 'Presencial',
    vagas: 45, pesos: { lc: 2, ch: 2, cn: 1, mt: 1, red: 2 }, corteAC: 601.9, acoesProprias: [] },
  { id: 's4', ies: 'Universidade Federal do Vale', sigla: 'UFVALE', local: 'Campus Parobé', municipio: 'Parobé', uf: 'RS',
    curso: 'Enfermagem', grau: 'Bacharelado', turno: 'Integral', formato: 'Presencial',
    vagas: 30, pesos: { lc: 1, ch: 1, cn: 3, mt: 1, red: 1 }, corteAC: 688.4, acoesProprias: [] },
  { id: 's5', ies: 'Universidade Federal do Vale', sigla: 'UFVALE', local: 'Campus Taquara', municipio: 'Taquara', uf: 'RS',
    curso: 'ABI - Ciências da Natureza', grau: 'Área Básica de Ingresso (ABI)', turno: 'Integral', formato: 'Presencial',
    vagas: 30, pesos: { lc: 1, ch: 1, cn: 2, mt: 2, red: 1 }, corteAC: 598.2, acoesProprias: [] },
  { id: 's6', ies: 'Instituto Federal Litoral Serra', sigla: 'IFLS', local: 'Campus Santo Antônio da Patrulha', municipio: 'Santo Antônio da Patrulha', uf: 'RS',
    curso: 'Ciência da Computação', grau: 'Bacharelado', turno: 'Matutino', formato: 'Presencial',
    vagas: 36, pesos: { lc: 1, ch: 1, cn: 2, mt: 3, red: 1 }, corteAC: 681.0, acoesProprias: [] },
  { id: 's7', ies: 'Instituto Federal Litoral Serra', sigla: 'IFLS', local: 'Campus Rolante', municipio: 'Rolante', uf: 'RS',
    curso: 'Processos Gerenciais', grau: 'Tecnológico', turno: 'Noturno', formato: 'Presencial',
    vagas: 40, pesos: { lc: 1, ch: 1, cn: 1, mt: 1, red: 1 }, corteAC: 589.6, acoesProprias: [] },
  { id: 's8', ies: 'Instituto Federal Litoral Serra', sigla: 'IFLS', local: 'Campus Santo Antônio da Patrulha', municipio: 'Santo Antônio da Patrulha', uf: 'RS',
    curso: 'Matemática', grau: 'Licenciatura', turno: 'Noturno', formato: 'Presencial',
    vagas: 30, pesos: { lc: 1, ch: 1, cn: 1, mt: 3, red: 1 }, corteAC: 611.3, acoesProprias: [] },
  { id: 's9', ies: 'Universidade Federal Metropolitana', sigla: 'UFMET', local: 'Campus Centro', municipio: 'Porto Alegre', uf: 'RS',
    curso: 'Medicina', grau: 'Bacharelado', turno: 'Integral', formato: 'Presencial',
    vagas: 60, pesos: { lc: 1, ch: 1, cn: 3, mt: 2, red: 2 }, corteAC: 791.7, acoesProprias: [] },
  { id: 's10', ies: 'Universidade Federal Metropolitana', sigla: 'UFMET', local: 'Campus Centro', municipio: 'Porto Alegre', uf: 'RS',
    curso: 'Engenharia Civil', grau: 'Bacharelado', turno: 'Integral', formato: 'Presencial',
    vagas: 50, pesos: { lc: 1, ch: 1, cn: 2, mt: 3, red: 1 }, corteAC: 721.8,
    notaMinima: { mt: 650 }, acoesProprias: [] },
  { id: 's11', ies: 'Universidade Federal Metropolitana', sigla: 'UFMET', local: 'Campus Centro', municipio: 'Porto Alegre', uf: 'RS',
    curso: 'Direito', grau: 'Bacharelado', turno: 'Matutino', formato: 'Presencial',
    vagas: 70, pesos: { lc: 2, ch: 3, cn: 1, mt: 1, red: 2 }, corteAC: 739.4, acoesProprias: [] },
  { id: 's12', ies: 'Universidade Federal Metropolitana', sigla: 'UFMET', local: 'Polo Osório', municipio: 'Osório', uf: 'RS',
    curso: 'Letras - Português', grau: 'Licenciatura', turno: 'Não se aplica', formato: 'EaD',
    vagas: 40, pesos: { lc: 3, ch: 1, cn: 1, mt: 1, red: 2 }, corteAC: 562.0, acoesProprias: [] },
  { id: 's13', ies: 'Universidade Estadual do Litoral', sigla: 'UELIT', local: 'Unidade Osório', municipio: 'Osório', uf: 'RS',
    curso: 'Psicologia', grau: 'Bacharelado', turno: 'Integral', formato: 'Presencial',
    vagas: 40, pesos: { lc: 2, ch: 2, cn: 1, mt: 1, red: 2 }, corteAC: 701.2,
    acoesProprias: [{ tipo: 'B', descricao: 'Bônus de 5% na nota para quem cursou o ensino médio no Litoral Norte do RS', percentual: 5 }] },
  { id: 's14', ies: 'Universidade Estadual do Litoral', sigla: 'UELIT', local: 'Unidade Osório', municipio: 'Osório', uf: 'RS',
    curso: 'Gestão Ambiental', grau: 'Tecnológico', turno: 'Noturno', formato: 'Semipresencial',
    vagas: 35, pesos: { lc: 1, ch: 1, cn: 2, mt: 1, red: 1 }, corteAC: 575.5, acoesProprias: [] }
];

/* ---------------------------------------------------------
   INSTITUIÇÕES PRIVADAS — usadas pelo Prouni e pelo Fies.
   prouni: bolsas e notas de corte; fies: vagas, mensalidade e conceito.
   --------------------------------------------------------- */
const OFERTAS_PRIVADAS = [
  { id: 'p1', ies: 'Faculdade Vale Verde', sigla: 'FVV', local: 'Unidade Centro', municipio: 'Taquara', uf: 'RS',
    curso: 'Análise e Desenvolvimento de Sistemas', grau: 'Tecnológico', turno: 'Noturno', formato: 'Presencial', mensalidade: 890.00,
    prouni: { integral: 4, parcial: 6, corte: { integral: 640.2, parcial: 598.4 } },
    fies: { vagas: 10, vagasSocial: 10, conceito: 4, corte: 590.3 } },
  { id: 'p2', ies: 'Faculdade Vale Verde', sigla: 'FVV', local: 'Unidade Centro', municipio: 'Taquara', uf: 'RS',
    curso: 'Administração', grau: 'Bacharelado', turno: 'Noturno', formato: 'Presencial', mensalidade: 1020.00,
    prouni: { integral: 5, parcial: 8, corte: { integral: 612.7, parcial: 571.0 } },
    fies: { vagas: 12, vagasSocial: 12, conceito: 4, corte: 560.8 } },
  { id: 'p3', ies: 'Faculdade Vale Verde', sigla: 'FVV', local: 'Unidade Centro', municipio: 'Taquara', uf: 'RS',
    curso: 'Pedagogia', grau: 'Licenciatura', turno: 'Noturno', formato: 'Presencial', mensalidade: 760.00,
    prouni: { integral: 6, parcial: 6, corte: { integral: 585.9, parcial: 540.2 } },
    fies: { vagas: 8, vagasSocial: 8, conceito: 3, corte: 530.0 } },
  { id: 'p4', ies: 'Centro Universitário Paranhana', sigla: 'UNIPARANHANA', local: 'Campus Igrejinha', municipio: 'Igrejinha', uf: 'RS',
    curso: 'Enfermagem', grau: 'Bacharelado', turno: 'Noturno', formato: 'Presencial', mensalidade: 1580.00,
    prouni: { integral: 3, parcial: 5, corte: { integral: 668.3, parcial: 630.1 } },
    fies: { vagas: 10, vagasSocial: 10, conceito: 4, corte: 615.4 } },
  { id: 'p5', ies: 'Centro Universitário Paranhana', sigla: 'UNIPARANHANA', local: 'Campus Igrejinha', municipio: 'Igrejinha', uf: 'RS',
    curso: 'Direito', grau: 'Bacharelado', turno: 'Noturno', formato: 'Presencial', mensalidade: 1690.00,
    prouni: { integral: 4, parcial: 6, corte: { integral: 702.6, parcial: 655.9 } },
    fies: { vagas: 15, vagasSocial: 15, conceito: 5, corte: 640.7 } },
  { id: 'p6', ies: 'Centro Universitário Paranhana', sigla: 'UNIPARANHANA', local: 'Campus Igrejinha', municipio: 'Igrejinha', uf: 'RS',
    curso: 'Psicologia', grau: 'Bacharelado', turno: 'Matutino', formato: 'Presencial', mensalidade: 1720.00,
    prouni: { integral: 2, parcial: 4, corte: { integral: 690.0, parcial: 648.5 } },
    fies: { vagas: 8, vagasSocial: 8, conceito: 4, corte: 628.9 } },
  { id: 'p7', ies: 'Universidade Horizonte', sigla: 'UNIHORIZONTE', local: 'Polo Santo Antônio da Patrulha', municipio: 'Santo Antônio da Patrulha', uf: 'RS',
    curso: 'Gestão de Recursos Humanos', grau: 'Tecnológico', turno: 'Curso a distância', formato: 'EaD', mensalidade: 289.00,
    prouni: { integral: 10, parcial: 15, corte: { integral: 560.4, parcial: 505.8 } },
    fies: null },
  { id: 'p8', ies: 'Universidade Horizonte', sigla: 'UNIHORIZONTE', local: 'Campus Porto Alegre', municipio: 'Porto Alegre', uf: 'RS',
    curso: 'Engenharia de Software', grau: 'Bacharelado', turno: 'Noturno', formato: 'Presencial', mensalidade: 1450.00,
    prouni: { integral: 3, parcial: 4, corte: { integral: 676.1, parcial: 632.4 } },
    fies: { vagas: 12, vagasSocial: 12, conceito: 5, corte: 620.2 } },
  { id: 'p9', ies: 'Faculdade Litoral Norte', sigla: 'FALINO', local: 'Unidade Osório', municipio: 'Osório', uf: 'RS',
    curso: 'Fisioterapia', grau: 'Bacharelado', turno: 'Integral', formato: 'Presencial', mensalidade: 1390.00,
    prouni: { integral: 2, parcial: 3, corte: { integral: 655.7, parcial: 612.0 } },
    fies: { vagas: 6, vagasSocial: 6, conceito: 3, corte: 598.1 } },
  { id: 'p10', ies: 'Faculdade Litoral Norte', sigla: 'FALINO', local: 'Unidade Santo Antônio da Patrulha', municipio: 'Santo Antônio da Patrulha', uf: 'RS',
    curso: 'Ciências Contábeis', grau: 'Bacharelado', turno: 'Noturno', formato: 'Presencial', mensalidade: 980.00,
    prouni: { integral: 4, parcial: 6, corte: { integral: 590.8, parcial: 548.3 } },
    fies: { vagas: 10, vagasSocial: 10, conceito: 4, corte: 545.6 } },
  { id: 'p11', ies: 'Faculdade Litoral Norte', sigla: 'FALINO', local: 'Unidade Osório', municipio: 'Osório', uf: 'RS',
    curso: 'Medicina Veterinária', grau: 'Bacharelado', turno: 'Integral', formato: 'Presencial', mensalidade: 2350.00,
    prouni: null,
    fies: { vagas: 8, vagasSocial: 8, conceito: 4, corte: 660.4 } }
];

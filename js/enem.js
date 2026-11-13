/* =========================================================
   Simulador Enem
   Fluxo baseado no Edital Inep nº 64/2026 (Enem 2026) e nas
   orientações da Página do Participante. Dados só em memória.
   ========================================================= */

const ENEM = {
  taxa: 85.00,
  pagamentoAte: '2026-06-10',
  primeiraProva: '2026-11-08'
};

const estado = {
  candidato: null,
  numeroInscricao: null,
  pago: false,
  boletoGerado: false
};

// Escolas fictícias para a etapa "Ensino médio".
const ESCOLAS_FICTICIAS = [
  { nome: 'Escola Estadual de Ensino Médio Vale Verde', municipio: 'Igrejinha', rede: 'Pública' },
  { nome: 'Colégio Horizonte', municipio: 'Igrejinha', rede: 'Privada' },
  { nome: 'Escola Estadual de Ensino Médio Paranhana', municipio: 'Taquara', rede: 'Pública' },
  { nome: 'Instituto Estadual de Educação Serra Azul', municipio: 'Taquara', rede: 'Pública' },
  { nome: 'Escola Estadual de Ensino Médio Rio Paranhana', municipio: 'Parobé', rede: 'Pública' },
  { nome: 'Escola Estadual de Ensino Médio Encosta da Serra', municipio: 'Três Coroas', rede: 'Pública' },
  { nome: 'Escola Estadual de Ensino Médio Vale do Rolante', municipio: 'Rolante', rede: 'Pública' },
  { nome: 'Escola Estadual de Ensino Médio Litoral Serra', municipio: 'Santo Antônio da Patrulha', rede: 'Pública' },
  { nome: 'Colégio Primavera', municipio: 'Santo Antônio da Patrulha', rede: 'Privada' }
];

const MUNICIPIOS_PROVA_RS = ['Caxias do Sul', 'Gravataí', 'Igrejinha', 'Novo Hamburgo', 'Osório', 'Parobé',
  'Porto Alegre', 'Rolante', 'Santo Antônio da Patrulha', 'Taquara', 'Três Coroas'];

// Condições e recursos exatamente como listados no item 4.2 do Edital nº 64/2026.
const CONDICOES = ['Baixa visão', 'Cegueira', 'Visão monocular', 'Deficiência física', 'Deficiência auditiva', 'Surdez',
  'Deficiência intelectual', 'Surdocegueira', 'Dislexia', 'Transtorno do Déficit de Atenção com Hiperatividade (TDAH)',
  'Transtorno do Espectro Autista (TEA)', 'Discalculia', 'Diabetes', 'Fibromialgia', 'Transtornos mentais',
  'Gestante', 'Lactante', 'Idoso', 'Estudante em classe hospitalar', 'Outra condição específica'];

const CONDICOES_AUDITIVAS = ['Deficiência auditiva', 'Surdez', 'Surdocegueira'];

const RECURSOS = ['Prova em Braille', 'Tradutor-intérprete de Libras', 'Videoprova em Libras', 'Prova com letra ampliada',
  'Prova com letra superampliada', 'Leitor de tela', 'Guia-intérprete', 'Auxílio para leitura', 'Auxílio para transcrição',
  'Leitura labial', 'Tempo adicional', 'Calculadora', 'Sala com acessibilidade', 'Apoio para pernas e pés',
  'Mesa para cadeira de rodas', 'Mesa e cadeira sem braços', 'Sala reservada para acompanhante'];

const ESCOLARIDADE_PAIS = [
  'Nunca estudou.',
  'Não completou a 4ª série/5º ano do Ensino Fundamental.',
  'Completou a 4ª série/5º ano, mas não completou a 8ª série/9º ano do Ensino Fundamental.',
  'Completou a 8ª série/9º ano do Ensino Fundamental, mas não completou o Ensino Médio.',
  'Completou o Ensino Médio, mas não completou a Faculdade.',
  'Completou a Faculdade, mas não completou a Pós-graduação.',
  'Completou a Pós-graduação.',
  'Não sei.'
];

// Faixas de renda em salários mínimos, como no questionário do Enem.
function faixasRenda() {
  const limites = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20].map((n) => n * SALARIO_MINIMO);
  const faixas = ['Nenhuma renda', `Até ${Formatar.moeda(limites[0])}`];
  for (let i = 1; i < limites.length; i++) {
    faixas.push(`De ${Formatar.moeda(limites[i - 1] + 0.01)} até ${Formatar.moeda(limites[i])}`);
  }
  faixas.push(`Acima de ${Formatar.moeda(limites[limites.length - 1])}`);
  return faixas;
}

const QUESTIONARIO = [
  { id: 'q001', texto: 'Até que série seu pai, ou o homem responsável por você, estudou?', opcoes: ESCOLARIDADE_PAIS },
  { id: 'q002', texto: 'Até que série sua mãe, ou a mulher responsável por você, estudou?', opcoes: ESCOLARIDADE_PAIS },
  { id: 'q005', texto: 'Incluindo você, quantas pessoas moram atualmente em sua residência?',
    opcoes: Array.from({ length: 20 }, (_, i) => String(i + 1)), lista: true },
  { id: 'q006', texto: 'Qual é a renda mensal de sua família? (Some a sua renda com a dos seus familiares.)', opcoes: faixasRenda(), lista: true },
  { id: 'q024', texto: 'Na sua residência tem computador?', opcoes: ['Não.', 'Sim, um.', 'Sim, dois.', 'Sim, três.', 'Sim, quatro ou mais.'] },
  { id: 'q025', texto: 'Na sua residência tem acesso à Internet?', opcoes: ['Não.', 'Sim.'] }
];

const TEXTO_SITUACAO = {
  concluido: 'Já concluí o ensino médio',
  concluirei_2026: 'Estou cursando e concluirei o ensino médio em 2026',
  apos_2026: 'Estou cursando e concluirei o ensino médio após 2026 (treineiro)',
  nao_cursando: 'Não concluí e não estou cursando o ensino médio'
};

/* ---------- Campos que aparecem conforme a resposta ---------- */
function mostrar(id, visivel) {
  $(`#${id}`).classList.toggle('oculto', !visivel);
}

document.addEventListener('change', (e) => {
  const { name, value } = e.target;
  if (name === 'isencao_motivo') {
    mostrar('bloco_isencao_renda', value === 'renda');
    mostrar('bloco_isencao_nis', value === 'cadunico');
  }
  if (name === 'faltou_2025') mostrar('bloco_justificativa', value === 'sim');
  if (['isencao_motivo', 'faltou_2025', 'justificativa_documento'].includes(name)) atualizarResultadoIsencao();
  if (name === 'situacao_em') {
    mostrar('bloco_concluido', value === 'concluido');
    mostrar('bloco_cursando', value === 'concluirei_2026');
    mostrar('bloco_treineiro', value === 'apos_2026');
    mostrar('bloco_certificacao', value === 'nao_cursando');
  }
  if (name === 'precisa_atendimento') mostrar('bloco_atendimento', value === 'sim');
  if (name === 'condicao') mostrar('bloco_aparelho_auditivo', marcados('condicao').some((c) => CONDICOES_AUDITIVAS.includes(c)));
  if (name === 'escola_municipio') atualizarEscolas();
});

/* ---------- Isenção ---------- */
function situacaoIsencao() {
  const motivo = lerValor('isencao_motivo');
  const faltou = lerValor('faltou_2025') === 'sim';
  const taxa = `taxa de ${Formatar.moeda(ENEM.taxa)}`;
  if (!motivo || motivo === 'nenhum') return { isento: false, texto: `Sem isenção: ${taxa}` };
  if (faltou && !lerValor('justificativa_documento')) {
    return { isento: false, texto: `Isenção negada: faltou no Enem 2025 sem documento que comprove o motivo. ${taxa[0].toUpperCase()}${taxa.slice(1)}` };
  }
  if (motivo === 'concluinte_publica') return { isento: true, texto: 'Isenção automática (concluinte da rede pública)' };
  return { isento: true, texto: 'Pedido de isenção aprovado' };
}

function atualizarResultadoIsencao() {
  if (!lerValor('isencao_motivo') || !lerValor('faltou_2025')) {
    $('#resultado_isencao').innerHTML = '';
    return;
  }
  const s = situacaoIsencao();
  $('#resultado_isencao').innerHTML = `<div class="caixa ${s.isento ? 'ok' : 'alerta'}"><p>${escaparHtml(s.texto)}.</p></div>`;
}

/* ---------- Dados pessoais ---------- */
function entrarDados(etapa) {
  if (!lerValor('cpf', etapa)) definirValor('cpf', estado.candidato.cpf, etapa);
}

function validarDados(etapa) {
  const erros = [];
  if (lerValor('email', etapa).toLowerCase() !== lerValor('email_confirmacao', etapa).toLowerCase()) {
    erros.push('Confirme o e-mail: os dois e-mails precisam ser iguais.');
  }
  if (!lerValor('celular', etapa) && !lerValor('telefone', etapa)) {
    erros.push('Telefone: informe um telefone fixo ou celular.');
  }
  return erros;
}

/* ---------- Ensino médio ---------- */
function idadeNaPrimeiraProva() {
  return idadeEm(lerValor('data_nascimento'), ENEM.primeiraProva);
}

function atualizarEscolas() {
  const municipio = lerValor('escola_municipio');
  const escolas = ESCOLAS_FICTICIAS.filter((e) => e.municipio === municipio)
    .map((e) => ({ valor: e.nome, texto: `${e.nome} (${e.rede})` }));
  preencherSelect($('#escola'), escolas, municipio ? 'Selecione' : 'Selecione o município primeiro');
}

function entrarEscolaridade() {
  const municipio = $('#escola_municipio');
  if (municipio.options.length === 0) {
    preencherSelect(municipio, [...new Set(ESCOLAS_FICTICIAS.map((e) => e.municipio))].sort((a, b) => a.localeCompare(b, 'pt-BR')));
  }
  const idade = idadeNaPrimeiraProva();
  $('#aviso_certificacao').innerHTML = idade !== null && idade < 18
    ? `<div class="caixa alerta"><p>Você terá ${idade} anos no primeiro dia de prova. A certificação exige 18 anos completos até essa data.</p></div>`
    : '';
}

function validarEscolaridade() {
  const erros = [];
  const situacao = lerValor('situacao_em');
  if (lerValor('isencao_motivo') === 'concluinte_publica') {
    if (situacao && situacao !== 'concluirei_2026') {
      erros.push('A isenção automática é só para quem conclui o ensino médio em 2026 na rede pública. Revise a situação ou o pedido de isenção.');
    }
    const escola = ESCOLAS_FICTICIAS.find((e) => e.nome === lerValor('escola'));
    if (situacao === 'concluirei_2026' && escola && escola.rede !== 'Pública') {
      erros.push('A escola escolhida é privada, mas a isenção informada é de concluinte da rede pública.');
    }
  }
  if (situacao === 'nao_cursando' && lerValor('certificacao') === 'sim' && idadeNaPrimeiraProva() < 18) {
    erros.push('Certificação: é preciso ter 18 anos completos até o primeiro dia de prova.');
  }
  return erros;
}

/* ---------- Atendimento especializado ---------- */
function caixasHtml(nome, itens) {
  return itens.map((item) => `<label class="opcao"><input type="checkbox" name="${nome}" value="${escaparHtml(item)}"> <span>${escaparHtml(item)}</span></label>`).join('');
}

function marcados(nome) {
  return $$(`[name="${nome}"]:checked`).map((c) => c.value);
}

function validarAtendimento() {
  if (lerValor('precisa_atendimento') !== 'sim') return [];
  const erros = [];
  if (!marcados('condicao').length) erros.push('Condição: marque pelo menos uma condição.');
  if (!marcados('recurso').length) erros.push('Recursos de acessibilidade: marque pelo menos um recurso.');
  return erros;
}

/* ---------- Questionário ---------- */
function renderizarQuestionario() {
  $('#lista_questionario').innerHTML = QUESTIONARIO.map((q, i) => {
    const campo = q.lista
      ? `<select name="${q.id}" required style="max-width: 420px">${['<option value="">Selecione</option>']
        .concat(q.opcoes.map((o) => `<option>${escaparHtml(o)}</option>`)).join('')}</select>`
      : `<div class="opcoes">${q.opcoes.map((o, j) => `<label class="opcao"><input type="radio" name="${q.id}" value="${escaparHtml(o)}" ${j === 0 ? 'required' : ''}> <span>${escaparHtml(o)}</span></label>`).join('')}</div>`;
    return `<div class="pergunta"><span class="rotulo obrigatorio">${i + 1}. ${escaparHtml(q.texto)}</span>${campo}</div>`;
  }).join('');
}

/* ---------- Conferência e comprovante ---------- */
function textoEscolaridade() {
  const situacao = lerValor('situacao_em');
  if (situacao === 'concluido') return `${TEXTO_SITUACAO.concluido} em ${lerValor('ano_conclusao')} (escola ${lerValor('tipo_escola').toLowerCase()})`;
  if (situacao === 'concluirei_2026') return `${TEXTO_SITUACAO.concluirei_2026} · ${lerValor('escola')} (${lerValor('escola_municipio')}/RS) · ${lerValor('tipo_ensino')}`;
  if (situacao === 'nao_cursando') {
    return TEXTO_SITUACAO.nao_cursando + (lerValor('certificacao') === 'sim' ? ', com certificação' : ', sem certificação');
  }
  return TEXTO_SITUACAO[situacao];
}

function textoAtendimento() {
  if (lerValor('precisa_atendimento') !== 'sim') return 'Não';
  const aparelho = lerValor('aparelho_auditivo') && !$('#bloco_aparelho_auditivo').classList.contains('oculto')
    ? ' · Usa aparelho auditivo ou implante coclear' : '';
  return `Condição: ${marcados('condicao').join(', ')} · Recursos: ${marcados('recurso').join(', ')}${aparelho}`;
}

function textoEndereco() {
  return [lerValor('logradouro'), lerValor('numero'), lerValor('complemento'), lerValor('bairro'),
    `${lerValor('municipio')}/${lerValor('uf')}`, `CEP ${lerValor('cep')}`].filter(Boolean).join(', ');
}

function paresInscricao() {
  return [
    ['Nome', lerValor('nome')],
    ['CPF', lerValor('cpf')],
    ['Data de nascimento', Formatar.data(lerValor('data_nascimento'))],
    ['E-mail', lerValor('email')],
    ['Telefone', [lerValor('celular'), lerValor('telefone')].filter(Boolean).join(' · ')],
    ['Atendimento especializado', textoAtendimento()],
    ['Tratamento pelo nome social', lerValor('usa_nome_social') ? 'Sim' : 'Não'],
    ['Língua estrangeira', lerValor('lingua')],
    ['Ensino médio', textoEscolaridade()],
    ['Município de prova', `${lerValor('prova_municipio')}/${lerValor('prova_uf')}`],
    ['Isenção da taxa', situacaoIsencao().texto]
  ];
}

function entrarConferencia() {
  const dadosPessoais = [
    ['Nome da mãe', lerValor('nome_mae')], ['Cor/raça', lerValor('cor_raca')], ['Estado civil', lerValor('estado_civil')],
    ['Nacionalidade', lerValor('nacionalidade')], ['Endereço', textoEndereco()]
  ];
  const respostas = QUESTIONARIO.map((q, i) => [`${i + 1}. ${q.texto}`, lerValor(q.id)]);
  $('#resumo_conferencia').innerHTML =
    '<h3>Inscrição</h3>' + listaDefinicaoHtml(paresInscricao()) +
    '<h3>Outros dados pessoais</h3>' + listaDefinicaoHtml(dadosPessoais) +
    '<h3>Questionário socioeconômico</h3>' + listaDefinicaoHtml(respostas);
}

function situacaoInscricao() {
  if (situacaoIsencao().isento) return 'Confirmada (isento da taxa)';
  return estado.pago ? 'Confirmada (pagamento processado)' : 'Aguardando pagamento da taxa';
}

function renderizarComprovante() {
  $('#comprovante').innerHTML = `
    <div class="comprovante-topo">
      <div><strong>Comprovante de inscrição · Enem 2026</strong><br><span class="ajuda">Documento de simulação, sem validade.</span></div>
      <div><span class="numero">Nº ${estado.numeroInscricao}</span><br><span class="ajuda">Concluída em ${Formatar.agora()}</span></div>
    </div>
    ${listaDefinicaoHtml([['Situação', situacaoInscricao()], ...paresInscricao()])}`;
}

function renderizarPagamento() {
  const bloco = $('#bloco_pagamento');
  if (situacaoIsencao().isento) {
    bloco.innerHTML = '';
    return;
  }
  if (estado.pago) {
    bloco.innerHTML = '<div class="caixa ok"><p>Pagamento processado. Sua inscrição está confirmada.</p></div>';
    return;
  }
  const boleto = estado.boletoGerado
    ? `<div class="comprovante">
        <div class="comprovante-topo"><div><strong>GRU Cobrança · Taxa de inscrição Enem 2026</strong><br><span class="ajuda">Boleto de simulação, sem código de pagamento.</span></div></div>
        ${listaDefinicaoHtml([
          ['Valor', Formatar.moeda(ENEM.taxa)],
          ['Pagar até', Formatar.data(ENEM.pagamentoAte)],
          ['Formas de pagamento', 'Pix (QR Code da GRU), cartão de crédito, débito em conta, entre outras, conforme o banco'],
          ['Onde pagar', 'Qualquer banco, casa lotérica ou aplicativo bancário'],
          ['Linha digitável', 'SIMULAÇÃO, SEM VALOR']
        ])}
      </div>
      <p><button type="button" class="botao" id="btn_pagar">Simular pagamento</button></p>`
    : '<p><button type="button" class="botao" id="btn_boleto">Gerar GRU Cobrança</button></p>';
  bloco.innerHTML = `<h3>Pagamento da taxa</h3>
    <div class="caixa alerta"><p>A inscrição só é confirmada depois que o pagamento de <strong>${Formatar.moeda(ENEM.taxa)}</strong> é processado.
    Gerar a GRU não é pagar. Prazo: até ${Formatar.data(ENEM.pagamentoAte)}.</p></div>${boleto}`;
}

$('#bloco_pagamento').addEventListener('click', (e) => {
  if (e.target.id === 'btn_boleto') estado.boletoGerado = true;
  if (e.target.id === 'btn_pagar') estado.pago = true;
  renderizarPagamento();
  renderizarComprovante();
});

function entrarComprovante() {
  estado.numeroInscricao = estado.numeroInscricao || gerarNumero('26', 10);
  renderizarComprovante();
  renderizarPagamento();
}

/* ---------- Dados fictícios para a demonstração ---------- */
const preenchimentos = {
  login() { definirValor('login_cpf', gerarCpfFicticio()); },
  isencao() {
    definirValor('isencao_motivo', 'concluinte_publica');
    definirValor('faltou_2025', 'nao');
  },
  dados() {
    const c = CANDIDATO_FICTICIO;
    definirValor('data_nascimento', c.dataNascimento);
    definirValor('nome', c.nome);
    definirValor('nome_mae', c.nomeMae);
    definirValor('cor_raca', 'Parda');
    definirValor('estado_civil', 'Solteiro(a)');
    definirValor('nacionalidade', 'Brasileiro(a)');
    ['cep', 'uf', 'municipio', 'logradouro', 'numero', 'complemento', 'bairro', 'email', 'celular']
      .forEach((campo) => definirValor(campo, c[campo]));
    definirValor('email_confirmacao', c.email);
  },
  atendimento() { definirValor('precisa_atendimento', 'nao'); },
  lingua() { definirValor('lingua', 'Inglês'); },
  escolaridade() {
    definirValor('situacao_em', 'concluirei_2026');
    definirValor('escola_municipio', 'Igrejinha');
    definirValor('escola', ESCOLAS_FICTICIAS[0].nome);
    definirValor('tipo_ensino', 'Ensino regular');
  },
  local() {
    definirValor('prova_uf', 'RS');
    definirValor('prova_municipio', 'Igrejinha');
  },
  questionario() {
    definirValor('q001', ESCOLARIDADE_PAIS[3]);
    definirValor('q002', ESCOLARIDADE_PAIS[4]);
    definirValor('q005', '4');
    definirValor('q006', faixasRenda()[2]);
    definirValor('q024', 'Sim, um.');
    definirValor('q025', 'Sim.');
  },
  conferencia() { definirValor('declaracao_veracidade', true); }
};

/* ---------- Início ---------- */
$('#lista_condicoes').innerHTML = caixasHtml('condicao', CONDICOES);
$('#lista_recursos').innerHTML = caixasHtml('recurso', RECURSOS);
$('#municipios_rs').innerHTML = MUNICIPIOS_PROVA_RS.map((m) => `<option value="${m}">`).join('');
preencherSelect($('#uf'), UFS);
preencherSelect($('#prova_uf'), UFS);
renderizarQuestionario();

const assistente = new Assistente({
  formulario: $('#formulario'),
  indicador: $('#indicador'),
  aoEntrar: {
    dados: entrarDados,
    escolaridade: entrarEscolaridade,
    conferencia: entrarConferencia,
    comprovante: entrarComprovante
  },
  validar: {
    login(etapa) {
      const erros = validarLoginCpf(etapa);
      if (!erros.length) estado.candidato = { cpf: mascararCpf(lerValor('login_cpf', etapa)) };
      return erros;
    },
    dados: validarDados,
    escolaridade: validarEscolaridade,
    atendimento: validarAtendimento
  }
});

$('#btn_alterar').addEventListener('click', () => assistente.ir(assistente.etapas.findIndex((e) => e.dataset.id === 'dados')));

iniciarPainelApresentador({
  aoPreencher() {
    const funcao = preenchimentos[assistente.idAtual];
    if (funcao) funcao();
  }
});

/* =========================================================
   Simulador Fies
   Fluxo baseado no passo a passo do MEC para o Fies 2026
   (Lei nº 10.260/2001). Dados só em memória.
   ========================================================= */

const estado = {
  candidato: null,
  opcoes: [null, null, null],   // { oferta }
  numeroInscricao: null
};

const COTAS_FIES = {
  nenhuma: 'Não. Quero concorrer apenas na ampla concorrência',
  pp: 'Sim: pessoas autodeclaradas pretas ou pardas',
  ind: 'Sim: pessoas indígenas',
  quil: 'Sim: pessoas quilombolas',
  pcd: 'Sim: pessoas com deficiência'
};
const DIFERENCA_CORTE = { cota: 30, social: 40 }; // fictício

/* ---------- Regras ---------- */
function participacoesValidas() {
  return estado.candidato.enem.filter((p) =>
    p.edicao >= EDICAO.fies.enemDesde && p.situacao === 'valida' && p.notas.red > 0 && mediaObjetivas(p.notas) >= 450);
}

function melhorEdicao() {
  const validas = participacoesValidas();
  if (!validas.length) return null;
  return validas
    .map((p) => ({ edicao: p.edicao, media: mediaSimples(p.notas), objetivas: mediaObjetivas(p.notas) }))
    .sort((a, b) => b.media - a.media)[0];
}

function cotasPermitidas() {
  const cor = lerValor('raca_cor');
  const lista = ['nenhuma'];
  if (cor === 'Preta' || cor === 'Parda') lista.push('pp');
  if (cor === 'Indígena') lista.push('ind');
  if (lerValor('quilombola') === 'sim') lista.push('quil');
  if (lerValor('pcd') === 'sim') lista.push('pcd');
  return lista;
}

function podeFiesSocial() {
  return lerValor('cadunico') === 'sim' && grupo.totais().emSalarios <= 0.5;
}

function querFiesSocial() {
  return lerValor('fies_social') === 'sim';
}

/* ---------- Etapa: dados pessoais ---------- */
function entrarDados(etapa) {
  const c = estado.candidato;
  definirValor('cpf', c.cpf, etapa);
  $('#tabela_enem').innerHTML = tabelaEnemHtml(c.enem, (ano) => ano >= EDICAO.fies.enemDesde);
  const melhor = melhorEdicao();
  $('#situacao_enem').innerHTML = melhor
    ? `<div class="caixa ok"><p>Edição considerada: <strong>Enem ${melhor.edicao}</strong>. Média das provas objetivas:
       <strong>${Formatar.nota(melhor.objetivas)}</strong> (mínimo 450). Média geral: <strong>${Formatar.nota(melhor.media)}</strong>.</p></div>`
    : '<div class="caixa erro"><p>Nenhuma edição do Enem atende aos requisitos (média de 450 nas provas objetivas e redação acima de zero).</p></div>';
  const uf = $('#uf');
  if (uf.options.length === 0) preencherSelect(uf, UFS);
}

function validarDados(etapa) {
  const erros = [];
  if (!melhorEdicao()) erros.push('Enem: requisitos de nota não atendidos.');
  if (lerValor('email', etapa).toLowerCase() !== lerValor('email_confirmacao', etapa).toLowerCase()) {
    erros.push('Confirme o e-mail: os dois e-mails precisam ser iguais.');
  }
  return erros;
}

/* ---------- Campos que aparecem conforme a resposta ---------- */
document.addEventListener('change', (e) => {
  const { name, value } = e.target;
  if (name === 'raca_cor') $('#bloco_etnia').classList.toggle('oculto', value !== 'Indígena');
  if (name === 'pcd') $('#bloco_deficiencia').classList.toggle('oculto', value !== 'sim');
  if (name === 'cadunico') {
    $('#bloco_nis').classList.toggle('oculto', value !== 'sim');
    atualizarFiesSocial();
  }
});

/* ---------- Grupo familiar ---------- */
const grupo = new GrupoFamiliar({
  tabela: $('#tabela_grupo'),
  resultado: $('#resultado_renda'),
  descreverRenda(t) {
    const linha = (ok, texto) => `${ok ? '✅' : '❌'} ${texto}`;
    return [
      linha(t.emSalarios <= 3, `Fies: até 3 salários mínimos por pessoa (${Formatar.moeda(SALARIO_MINIMO * 3)})`),
      linha(t.emSalarios <= 0.5, `Fies Social: até meio salário mínimo por pessoa (${Formatar.moeda(SALARIO_MINIMO / 2)}), com CadÚnico`)
    ].join('<br>');
  }
});

function validarGrupo() {
  return grupo.totais().emSalarios > 3
    ? ['Renda per capita acima de 3 salários mínimos: com essa renda não é possível concorrer ao Fies.']
    : [];
}

/* ---------- Etapa: Fies Social e cotas ---------- */
function atualizarFiesSocial() {
  const pode = podeFiesSocial();
  const sim = $('[name="fies_social"][value="sim"]');
  sim.disabled = !pode;
  if (!pode && sim.checked) sim.checked = false;
  const perCapita = Formatar.moeda(grupo.totais().perCapita);
  $('#aviso_fies_social').innerHTML = pode
    ? `<div class="caixa ok"><p>Você está no CadÚnico e sua renda per capita é ${perCapita}: pode concorrer ao Fies Social.</p></div>`
    : `<div class="caixa alerta"><p>Para o Fies Social é preciso estar no CadÚnico e ter renda per capita de até ${Formatar.moeda(SALARIO_MINIMO / 2)}. A sua é ${perCapita}.</p></div>`;
}

function entrarModalidade() {
  atualizarFiesSocial();
  const permitidas = cotasPermitidas();
  const atual = lerValor('cota');
  $('#lista_cotas').innerHTML = Object.entries(COTAS_FIES).map(([valor, texto]) => {
    const pode = permitidas.includes(valor);
    return `<label class="opcao"><input type="radio" name="cota" value="${valor}" required
      ${pode ? '' : 'disabled'} ${pode && atual === valor ? 'checked' : ''}>
      <span>${escaparHtml(texto)} ${pode ? '' : '<span class="ajuda">(não se aplica ao seu perfil)</span>'}</span></label>`;
  }).join('');
}

/* ---------- Etapa: cursos ---------- */
function ofertasFies() {
  return OFERTAS_PRIVADAS.filter((o) => o.fies);
}

function iniciarFiltros() {
  const unicos = (chave) => [...new Set(ofertasFies().map((o) => o[chave]))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  preencherSelect($('#f_ies'), unicos('ies'), 'Todas');
  preencherSelect($('#f_municipio'), unicos('municipio'), 'Todos');
  preencherSelect($('#f_turno'), unicos('turno'), 'Todos');
  ['#f_curso', '#f_ies', '#f_municipio', '#f_turno'].forEach((sel) => $(sel).addEventListener('input', renderizarOfertas));
}

function renderizarOfertas() {
  const termo = $('#f_curso').value.trim().toLowerCase();
  const filtros = { ies: $('#f_ies').value, municipio: $('#f_municipio').value, turno: $('#f_turno').value };
  const lista = ofertasFies().filter((o) =>
    (!termo || o.curso.toLowerCase().includes(termo)) &&
    Object.entries(filtros).every(([chave, valor]) => !valor || o[chave] === valor));

  if (!lista.length) {
    $('#lista_ofertas').innerHTML = '<div class="caixa">Nenhum curso encontrado com esses filtros.</div>';
    return;
  }

  const livres = estado.opcoes.map((op, i) => (op ? null : i)).filter((i) => i !== null);
  $('#lista_ofertas').innerHTML = lista.map((o) => {
    const posicao = estado.opcoes.findIndex((op) => op && op.oferta.id === o.id);
    const acoes = posicao >= 0
      ? `<span class="etiqueta destaque">Escolhido como ${posicao + 1}ª opção</span>`
      : (livres.length
        ? livres.map((i) => `<button type="button" class="botao ${i === livres[0] ? '' : 'secundario '}pequeno" data-escolher="${o.id}" data-posicao="${i}">Escolher como ${i + 1}ª opção</button>`).join('')
        : '<span class="ajuda">As três opções já foram escolhidas. Remova uma para trocar.</span>');
    return `<article class="oferta">
      <div>
        <h4>${escaparHtml(o.curso)}</h4>
        <div class="meta">${escaparHtml(o.grau)} · ${escaparHtml(o.turno)} · ${escaparHtml(o.formato)}</div>
        <div class="meta">${escaparHtml(o.ies)} (${escaparHtml(o.sigla)}) · ${escaparHtml(o.local)} · ${escaparHtml(o.municipio)}/${o.uf}</div>
        <span class="etiqueta">Conceito do curso: ${o.fies.conceito}</span>
        <span class="etiqueta">Mensalidade: ${Formatar.moeda(o.mensalidade)}</span>
        <span class="etiqueta">Vagas Fies: ${o.fies.vagas}</span>
        <span class="etiqueta">Vagas Fies Social: ${o.fies.vagasSocial}</span>
      </div>
      <div class="acoes">${acoes}</div>
    </article>`;
  }).join('');
}

$('#lista_ofertas').addEventListener('click', (e) => {
  const botao = e.target.closest('[data-escolher]');
  if (!botao) return;
  estado.opcoes[Number(botao.dataset.posicao)] = { oferta: OFERTAS_PRIVADAS.find((o) => o.id === botao.dataset.escolher) };
  renderizarOpcoes();
  renderizarOfertas();
  $('#opcoes_escolhidas').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

function renderizarOpcoes() {
  $('#opcoes_escolhidas').innerHTML = estado.opcoes.map((opcao, i) => {
    const titulo = `${i + 1}ª opção${i === 0 ? ' (obrigatória)' : ' (opcional)'}`;
    if (!opcao) {
      return `<div class="opcao-escolhida vazia"><div class="titulo-opcao">${titulo}</div>Nenhum curso escolhido. Use a busca abaixo.</div>`;
    }
    const o = opcao.oferta;
    return `<div class="opcao-escolhida">
      <div class="titulo-opcao">${titulo}</div>
      <h4>${escaparHtml(o.curso)} · ${escaparHtml(o.turno)}</h4>
      <div class="meta">${escaparHtml(o.local)} · ${escaparHtml(o.municipio)}/${o.uf} · ${escaparHtml(o.ies)} (${escaparHtml(o.sigla)})</div>
      <p>Mensalidade: ${Formatar.moeda(o.mensalidade)} · Conceito do curso: ${o.fies.conceito}</p>
      <button type="button" class="botao perigo pequeno" data-remover="${i}">Remover ${i + 1}ª opção</button>
    </div>`;
  }).join('');
}

$('#opcoes_escolhidas').addEventListener('click', (e) => {
  const botao = e.target.closest('[data-remover]');
  if (!botao) return;
  estado.opcoes[Number(botao.dataset.remover)] = null;
  // As opções restantes sobem, mantendo a ordem de preferência.
  const restantes = estado.opcoes.filter(Boolean);
  estado.opcoes = [0, 1, 2].map((i) => restantes[i] || null);
  renderizarOpcoes();
  renderizarOfertas();
});

function entrarCursos() {
  renderizarOpcoes();
  renderizarOfertas();
}

function validarCursos() {
  return estado.opcoes[0] ? [] : ['1ª opção: escolha pelo menos um curso.'];
}

/* ---------- Conferência e comprovante ---------- */
const TEXTO_ENSINO_MEDIO = {
  publica: 'Integralmente em escola pública',
  privada_bolsa_integral: 'Integralmente em escola privada, com bolsa integral',
  mista: 'Parte em escola pública e parte em escola privada',
  privada: 'Integralmente em escola privada, sem bolsa ou com bolsa parcial'
};

function paresDados() {
  const endereco = [lerValor('logradouro'), lerValor('numero'), lerValor('complemento'), lerValor('bairro'),
    `${lerValor('municipio')}/${lerValor('uf')}`, `CEP ${lerValor('cep')}`].filter(Boolean).join(', ');
  return [
    ['Nome completo', lerValor('nome')],
    ['CPF', estado.candidato.cpf],
    ['Data de nascimento', Formatar.data(lerValor('data_nascimento'))],
    ['Sexo', lerValor('sexo')],
    ['Estado civil', lerValor('estado_civil')],
    ['E-mail', lerValor('email')],
    ['Telefone celular', lerValor('celular')],
    ['Endereço', endereco]
  ];
}

function paresPerfil() {
  const melhor = melhorEdicao();
  return [
    ['Cor/raça', lerValor('raca_cor') + (lerValor('raca_cor') === 'Indígena' ? ` (etnia: ${lerValor('etnia')})` : '')],
    ['Quilombola', lerValor('quilombola') === 'sim' ? 'Sim' : 'Não'],
    ['Pessoa com deficiência', lerValor('pcd') === 'sim' ? `Sim (${lerValor('tipo_deficiencia')})` : 'Não'],
    ['Ensino médio', `${TEXTO_ENSINO_MEDIO[lerValor('ensino_medio')]} · concluído em ${lerValor('ano_conclusao')}`],
    ['Já concluiu curso superior', lerValor('superior_concluido') === 'sim' ? 'Sim' : 'Não'],
    ['Já teve Fies', lerValor('ja_teve_fies') === 'sim' ? 'Sim' : 'Não'],
    ['Enem considerado', `${melhor.edicao} · média ${Formatar.nota(melhor.media)}`]
  ];
}

function paresModalidade() {
  return [
    ['Inscrito(a) no CadÚnico', lerValor('cadunico') === 'sim' ? `Sim (NIS ${lerValor('nis')})` : 'Não'],
    ['Concorre ao Fies Social', querFiesSocial() ? 'Sim' : 'Não'],
    ['Cotas', COTAS_FIES[lerValor('cota')]]
  ];
}

function opcaoHtml(opcao, i) {
  const o = opcao.oferta;
  return `<h3>${i + 1}ª opção</h3>` + listaDefinicaoHtml([
    ['Curso', `${o.curso} (${o.grau})`],
    ['Turno', o.turno],
    ['Local de oferta', `${o.local} · ${o.municipio}/${o.uf}`],
    ['Instituição', `${o.ies} (${o.sigla})`],
    ['Mensalidade', Formatar.moeda(o.mensalidade)]
  ]);
}

function entrarConferencia() {
  $('#resumo_conferencia').innerHTML =
    '<h3>Dados pessoais</h3>' + listaDefinicaoHtml(paresDados()) +
    '<h3>Cor, etnia e ensino médio</h3>' + listaDefinicaoHtml(paresPerfil()) +
    '<h3>Grupo familiar (renda mensal bruta)</h3>' + listaDefinicaoHtml(grupo.resumo()) +
    '<h3>Fies Social e cotas</h3>' + listaDefinicaoHtml(paresModalidade()) +
    estado.opcoes.filter(Boolean).map(opcaoHtml).join('');
}

function entrarComprovante() {
  estado.numeroInscricao = estado.numeroInscricao || gerarNumero('FIES26-', 9);
  $('#comprovante').innerHTML = `
    <div class="comprovante-topo">
      <div><strong>Comprovante de inscrição · Fies 2026/2</strong><br><span class="ajuda">Documento de simulação, sem validade.</span></div>
      <div><span class="numero">Nº ${estado.numeroInscricao}</span><br><span class="ajuda">Concluída em ${Formatar.agora()}</span></div>
    </div>
    ${listaDefinicaoHtml(paresDados().filter(([r]) => ['Nome completo', 'CPF', 'E-mail'].includes(r)))}
    ${listaDefinicaoHtml([['Renda per capita', Formatar.moeda(grupo.totais().perCapita)], ...paresModalidade()])}
    ${estado.opcoes.filter(Boolean).map(opcaoHtml).join('')}`;
  $('#resultado').innerHTML = '';
}

function simularResultado() {
  const nota = melhorEdicao().media;
  const cota = lerValor('cota');
  const opcoes = estado.opcoes.filter(Boolean);
  for (let i = 0; i < opcoes.length; i++) {
    const corte = opcoes[i].oferta.fies.corte;
    let via = null;
    if (nota >= corte) via = 'ampla concorrência';
    else if (cota !== 'nenhuma' && nota >= corte - DIFERENCA_CORTE.cota) via = 'cotas';
    else if (querFiesSocial() && nota >= corte - DIFERENCA_CORTE.social) via = 'vagas do Fies Social';
    if (via) {
      const percentual = querFiesSocial()
        ? 'Pelo Fies Social, o financiamento pode cobrir até 100% da mensalidade.'
        : 'O percentual financiado é definido depois, conforme a renda familiar e o valor da mensalidade.';
      $('#resultado').innerHTML = `<div class="caixa ok">
        <p><strong>Pré-selecionado(a) na ${i + 1}ª opção:</strong> ${escaparHtml(opcoes[i].oferta.curso)} · ${escaparHtml(opcoes[i].oferta.ies)}, por ${via}.</p>
        <p>${percentual}</p>
        <p>Próximos passos: complementar a inscrição no prazo, validar as informações na CPSA da faculdade e assinar o contrato no banco.</p></div>`;
      return;
    }
  }
  $('#resultado').innerHTML = `<div class="caixa alerta"><p><strong>Não pré-selecionado(a) na chamada única.</strong>
    Você entrou automaticamente na lista de espera e pode ser pré-selecionado(a) até o fim do prazo do edital, pela ordem de classificação.</p></div>`;
}

$('#btn_resultado').addEventListener('click', simularResultado);

/* ---------- Dados fictícios para a demonstração ---------- */
const preenchimentos = {
  login() { definirValor('login_cpf', gerarCpfFicticio()); },
  dados() {
    const c = CANDIDATO_FICTICIO;
    definirValor('nome', c.nome);
    definirValor('data_nascimento', c.dataNascimento);
    definirValor('sexo', c.sexo);
    definirValor('estado_civil', 'Solteiro(a)');
    ['email', 'celular', 'telefone', 'cep', 'uf', 'municipio', 'logradouro', 'numero', 'complemento', 'bairro']
      .forEach((campo) => definirValor(campo, c[campo]));
    definirValor('email_confirmacao', c.email);
  },
  perfil() {
    definirValor('raca_cor', 'Parda');
    definirValor('quilombola', 'nao');
    definirValor('pcd', 'nao');
    definirValor('ensino_medio', 'publica');
    definirValor('ano_conclusao', '2025');
    definirValor('superior_concluido', 'nao');
    definirValor('ja_teve_fies', 'nao');
  },
  // Família com renda baixa para mostrar o Fies Social.
  grupo() {
    grupo.preencherFicticio(0, [
      { ...GRUPO_FAMILIAR_FICTICIO[0], renda: 1300 },
      { ...GRUPO_FAMILIAR_FICTICIO[1], renda: 0 },
      GRUPO_FAMILIAR_FICTICIO[2]
    ]);
  },
  modalidade() {
    definirValor('cadunico', 'sim');
    definirValor('nis', '12345678901');
    definirValor('fies_social', 'sim');
    definirValor('cota', 'pp');
  },
  cursos() {
    estado.opcoes = ['p5', 'p4', 'p2'].map((id) => ({ oferta: OFERTAS_PRIVADAS.find((o) => o.id === id) }));
    renderizarOpcoes();
    renderizarOfertas();
  },
  conferencia() { definirValor('declaracao_veracidade', true); }
};

/* ---------- Início ---------- */
const assistente = new Assistente({
  formulario: $('#formulario'),
  indicador: $('#indicador'),
  aoEntrar: {
    dados: entrarDados,
    grupo: () => grupo.renderizar(),
    modalidade: entrarModalidade,
    cursos: entrarCursos,
    conferencia: entrarConferencia,
    comprovante: entrarComprovante
  },
  validar: {
    login(etapa) {
      const erros = validarLoginCpf(etapa);
      if (!erros.length) {
        estado.candidato = { ...CANDIDATO_FICTICIO, cpf: mascararCpf(lerValor('login_cpf', etapa)) };
        grupo.definirCandidato(estado.candidato);
      }
      return erros;
    },
    dados: validarDados,
    grupo: validarGrupo,
    cursos: validarCursos
  }
});

$('#btn_alterar').addEventListener('click', () => assistente.ir(assistente.etapas.findIndex((e) => e.dataset.id === 'cursos')));

iniciarFiltros();
iniciarPainelApresentador({
  aoPreencher() {
    const funcao = preenchimentos[assistente.idAtual];
    if (funcao) funcao();
  }
});

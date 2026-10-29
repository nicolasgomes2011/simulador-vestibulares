/* =========================================================
   Simulador Prouni
   Fluxo baseado no passo a passo do MEC para o Prouni 2026
   (Lei nº 11.096/2005, alterada pela Lei nº 14.350/2022).
   Dados só em memória.
   ========================================================= */

const estado = {
  candidato: null,
  opcoes: [null, null],   // { oferta, bolsa: 'integral' | 'parcial', modalidade: 'ampla' | 'ppi' | 'pcd' }
  numeroInscricao: null
};

const NOMES_BOLSA = { integral: 'Bolsa integral (100%)', parcial: 'Bolsa parcial (50%)' };
const NOMES_MODALIDADE = {
  ampla: 'Ampla concorrência',
  ppi: 'Políticas afirmativas: autodeclarados indígenas, pretos ou pardos',
  pcd: 'Políticas afirmativas: pessoas com deficiência'
};
const DIFERENCA_CORTE_COTAS = 30; // fictício

/* ---------- Regras ---------- */
function melhorEdicao() {
  const validas = estado.candidato.enem.filter((p) =>
    EDICAO.prouni.editaisEnem.includes(p.edicao) && p.situacao === 'valida' && p.notas.red > 0);
  if (!validas.length) return null;
  return validas
    .map((p) => ({ edicao: p.edicao, media: mediaSimples(p.notas) }))
    .sort((a, b) => b.media - a.media)[0];
}

function ehProfessor() {
  return lerValor('professor') === 'sim';
}

function modalidadesPermitidas() {
  const lista = ['ampla'];
  if (['Indígena', 'Parda', 'Preta'].includes(lerValor('raca_cor'))) lista.push('ppi');
  if (lerValor('pcd') === 'sim') lista.push('pcd');
  return lista;
}

// Professor da rede pública concorre a licenciatura independentemente da renda.
function bolsasPermitidas(oferta) {
  const salarios = grupo.totais().emSalarios;
  const semLimite = ehProfessor() && oferta.grau === 'Licenciatura';
  return {
    integral: oferta.prouni.integral > 0 && (semLimite || salarios <= 1.5),
    parcial: oferta.prouni.parcial > 0 && (semLimite || salarios <= 3)
  };
}

/* ---------- Grupo familiar ---------- */
const grupo = new GrupoFamiliar({
  tabela: $('#tabela_grupo'),
  resultado: $('#resultado_renda'),
  descreverRenda(t) {
    const linha = (ok, texto) => `${ok ? '✅' : '❌'} ${texto}`;
    return [
      linha(t.emSalarios <= 1.5, `Bolsa integral: até 1,5 salário mínimo por pessoa (${Formatar.moeda(SALARIO_MINIMO * 1.5)})`),
      linha(t.emSalarios <= 3, `Bolsa parcial: até 3 salários mínimos por pessoa (${Formatar.moeda(SALARIO_MINIMO * 3)})`)
    ].join('<br>');
  }
});

function validarGrupo() {
  if (grupo.totais().emSalarios > 3 && !ehProfessor()) {
    return ['Renda per capita acima de 3 salários mínimos: com essa renda não é possível concorrer às bolsas do Prouni.'];
  }
  return [];
}

/* ---------- Etapa: dados pessoais ---------- */
function entrarDados(etapa) {
  const c = estado.candidato;
  definirValor('nome', c.nome, etapa);
  definirValor('cpf', c.cpf, etapa);
  definirValor('data_nascimento', Formatar.data(c.dataNascimento), etapa);
  definirValor('sexo', c.sexo, etapa);
  definirValor('nome_mae', c.nomeMae, etapa);
  $('#tabela_enem').innerHTML = tabelaEnemHtml(c.enem, (ano) => EDICAO.prouni.editaisEnem.includes(ano));
  const melhor = melhorEdicao();
  $('#situacao_enem').innerHTML = melhor && melhor.media >= 450
    ? `<div class="caixa ok"><p>Edição considerada: <strong>Enem ${melhor.edicao}</strong>, média das cinco provas <strong>${Formatar.nota(melhor.media)}</strong> (mínimo exigido: 450).</p></div>`
    : '<div class="caixa erro"><p>Você não atinge os requisitos do Enem para o Prouni (média mínima de 450 e redação acima de zero nas edições 2024 ou 2025).</p></div>';
  const uf = $('#uf');
  if (uf.options.length === 0) preencherSelect(uf, UFS);
}

$('#usa_nome_social').addEventListener('change', (e) => {
  $('#bloco_nome_social').classList.toggle('oculto', !e.target.checked);
});

function validarDados(etapa) {
  const erros = [];
  const melhor = melhorEdicao();
  if (!melhor || melhor.media < 450) erros.push('Enem: requisitos de nota não atendidos.');
  if (lerValor('email', etapa).toLowerCase() !== lerValor('email_confirmacao', etapa).toLowerCase()) {
    erros.push('Confirme o e-mail: os dois e-mails precisam ser iguais.');
  }
  return erros;
}

/* ---------- Etapa: perfil ---------- */
document.addEventListener('change', (e) => {
  if (e.target.name === 'pcd') $('#bloco_deficiencia').classList.toggle('oculto', e.target.value !== 'sim');
});

/* ---------- Etapa: cursos ---------- */
function ofertasProuni() {
  return OFERTAS_PRIVADAS.filter((o) => o.prouni);
}

function iniciarFiltros() {
  const unicos = (chave) => [...new Set(ofertasProuni().map((o) => o[chave]))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  preencherSelect($('#f_ies'), unicos('ies'), 'Todas');
  preencherSelect($('#f_municipio'), unicos('municipio'), 'Todos');
  ['#f_curso', '#f_ies', '#f_municipio'].forEach((sel) => $(sel).addEventListener('input', renderizarOfertas));
}

function renderizarOfertas() {
  const termo = $('#f_curso').value.trim().toLowerCase();
  const ies = $('#f_ies').value;
  const municipio = $('#f_municipio').value;
  const lista = ofertasProuni().filter((o) =>
    (!termo || o.curso.toLowerCase().includes(termo)) && (!ies || o.ies === ies) && (!municipio || o.municipio === municipio));

  if (!lista.length) {
    $('#lista_ofertas').innerHTML = '<div class="caixa">Nenhum curso encontrado com esses filtros.</div>';
    return;
  }

  $('#lista_ofertas').innerHTML = lista.map((o) => {
    const permitidas = bolsasPermitidas(o);
    const posicao = estado.opcoes.findIndex((op) => op && op.oferta.id === o.id);
    let acoes;
    if (!permitidas.integral && !permitidas.parcial) {
      acoes = '<div class="caixa erro"><p>Pela renda informada, você não pode concorrer às bolsas deste curso.</p></div>';
    } else if (posicao >= 0) {
      acoes = `<span class="etiqueta destaque">Escolhido como ${posicao + 1}ª opção</span>`;
    } else {
      acoes = `<button type="button" class="botao pequeno" data-escolher="${o.id}" data-posicao="0">Escolher como 1ª opção</button>
               <button type="button" class="botao secundario pequeno" data-escolher="${o.id}" data-posicao="1">Escolher como 2ª opção</button>`;
    }
    return `<article class="oferta">
      <div>
        <h4>${escaparHtml(o.curso)}</h4>
        <div class="meta">${escaparHtml(o.grau)} · ${escaparHtml(o.turno)} · ${escaparHtml(o.formato)}</div>
        <div class="meta">${escaparHtml(o.ies)} (${escaparHtml(o.sigla)}) · ${escaparHtml(o.local)} · ${escaparHtml(o.municipio)}/${o.uf}</div>
        <span class="etiqueta">Mensalidade: ${Formatar.moeda(o.mensalidade)}</span>
        <span class="etiqueta">Bolsas integrais: ${o.prouni.integral}</span>
        <span class="etiqueta">Bolsas parciais: ${o.prouni.parcial}</span>
        <span class="etiqueta">Nota de corte parcial: integral ${Formatar.nota(o.prouni.corte.integral)} · parcial ${Formatar.nota(o.prouni.corte.parcial)}</span>
      </div>
      <div class="acoes">${acoes}</div>
    </article>`;
  }).join('');
}

$('#lista_ofertas').addEventListener('click', (e) => {
  const botao = e.target.closest('[data-escolher]');
  if (!botao) return;
  const oferta = OFERTAS_PRIVADAS.find((o) => o.id === botao.dataset.escolher);
  const permitidas = bolsasPermitidas(oferta);
  estado.opcoes[Number(botao.dataset.posicao)] = {
    oferta,
    bolsa: permitidas.integral && !permitidas.parcial ? 'integral' : (!permitidas.integral ? 'parcial' : ''),
    modalidade: ''
  };
  renderizarOpcoes();
  renderizarOfertas();
  $('#opcoes_escolhidas').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

function renderizarOpcoes() {
  const modalidades = modalidadesPermitidas();
  $('#opcoes_escolhidas').innerHTML = estado.opcoes.map((opcao, i) => {
    const titulo = `${i + 1}ª opção${i === 0 ? ' (obrigatória)' : ' (opcional)'}`;
    if (!opcao) {
      return `<div class="opcao-escolhida vazia"><div class="titulo-opcao">${titulo}</div>Nenhum curso escolhido. Use a busca abaixo.</div>`;
    }
    const o = opcao.oferta;
    const permitidas = bolsasPermitidas(o);
    const radioBolsa = ['integral', 'parcial'].map((tipo) => `<label class="opcao">
        <input type="radio" name="opcao_${i}_bolsa" value="${tipo}" data-opcao="${i}" data-campo="bolsa" required
          ${opcao.bolsa === tipo ? 'checked' : ''} ${permitidas[tipo] ? '' : 'disabled'}>
        <span>${NOMES_BOLSA[tipo]}${permitidas[tipo] ? '' : ' <span class="ajuda">(indisponível para você)</span>'}</span></label>`).join('');
    const radioModalidade = Object.keys(NOMES_MODALIDADE).map((m) => `<label class="opcao">
        <input type="radio" name="opcao_${i}_modalidade" value="${m}" data-opcao="${i}" data-campo="modalidade" required
          ${opcao.modalidade === m ? 'checked' : ''} ${modalidades.includes(m) ? '' : 'disabled'}>
        <span>${NOMES_MODALIDADE[m]}${modalidades.includes(m) ? '' : ' <span class="ajuda">(não se aplica ao seu perfil)</span>'}</span></label>`).join('');
    return `<div class="opcao-escolhida">
      <div class="titulo-opcao">${titulo}</div>
      <h4>${escaparHtml(o.curso)} · ${escaparHtml(o.grau)}</h4>
      <div class="meta">${escaparHtml(o.ies)} (${escaparHtml(o.sigla)}) · ${escaparHtml(o.local)} · ${escaparHtml(o.municipio)}/${o.uf} · ${escaparHtml(o.turno)} · ${escaparHtml(o.formato)}</div>
      <div class="pergunta"><span class="rotulo obrigatorio">Tipo de bolsa (${i + 1}ª opção)</span><div class="opcoes">${radioBolsa}</div></div>
      <div class="pergunta"><span class="rotulo obrigatorio">Modalidade de concorrência (${i + 1}ª opção)</span><div class="opcoes">${radioModalidade}</div></div>
      <button type="button" class="botao perigo pequeno" data-remover="${i}">Remover ${i + 1}ª opção</button>
    </div>`;
  }).join('');
}

$('#opcoes_escolhidas').addEventListener('change', (e) => {
  const campo = e.target.closest('[data-opcao]');
  if (!campo) return;
  estado.opcoes[Number(campo.dataset.opcao)][campo.dataset.campo] = campo.value;
});

$('#opcoes_escolhidas').addEventListener('click', (e) => {
  const botao = e.target.closest('[data-remover]');
  if (!botao) return;
  const i = Number(botao.dataset.remover);
  estado.opcoes[i] = null;
  if (i === 0 && estado.opcoes[1]) estado.opcoes = [estado.opcoes[1], null];
  renderizarOpcoes();
  renderizarOfertas();
});

function entrarCursos() {
  // Se o perfil ou a renda mudaram, desfaz escolhas que deixaram de valer.
  estado.opcoes.forEach((opcao) => {
    if (!opcao) return;
    if (opcao.bolsa && !bolsasPermitidas(opcao.oferta)[opcao.bolsa]) opcao.bolsa = '';
    if (opcao.modalidade && !modalidadesPermitidas().includes(opcao.modalidade)) opcao.modalidade = '';
  });
  renderizarOpcoes();
  renderizarOfertas();
}

function validarCursos() {
  return estado.opcoes[0] ? [] : ['1ª opção: escolha pelo menos um curso.'];
}

/* ---------- Ficha e comprovante ---------- */
const TEXTO_ENSINO_MEDIO = {
  publica: 'Integralmente em escola da rede pública',
  privada_bolsa_integral: 'Integralmente em instituição privada, como bolsista integral',
  parcial_bolsa_integral: 'Parte em escola pública e parte em instituição privada, como bolsista integral',
  parcial_sem_bolsa: 'Parte em escola pública e parte em instituição privada, como bolsista parcial ou sem bolsa',
  privada_sem_bolsa: 'Integralmente em instituição privada, como bolsista parcial ou sem bolsa'
};

function paresDados() {
  const c = estado.candidato;
  const endereco = [lerValor('logradouro'), lerValor('numero'), lerValor('complemento'), lerValor('bairro'),
    `${lerValor('municipio')}/${lerValor('uf')}`, `CEP ${lerValor('cep')}`].filter(Boolean).join(', ');
  return [
    ['Nome', c.nome],
    ['Nome social', lerValor('usa_nome_social') ? lerValor('nome_social') : ''],
    ['CPF', c.cpf],
    ['Data de nascimento', Formatar.data(c.dataNascimento)],
    ['Estado civil', lerValor('estado_civil')],
    ['Nacionalidade', lerValor('nacionalidade')],
    ['E-mail', lerValor('email')],
    ['Telefone celular', lerValor('celular')],
    ['Endereço', endereco]
  ];
}

function paresPerfil() {
  const melhor = melhorEdicao();
  return [
    ['Raça/cor', lerValor('raca_cor')],
    ['Pessoa com deficiência', lerValor('pcd') === 'sim' ? `Sim (${lerValor('tipo_deficiencia')})` : 'Não'],
    ['Professor(a) da rede pública', ehProfessor() ? 'Sim' : 'Não'],
    ['Ensino médio', TEXTO_ENSINO_MEDIO[lerValor('ensino_medio')]],
    ['Ano de conclusão', lerValor('ano_conclusao')],
    ['Enem considerado', `${melhor.edicao} · média ${Formatar.nota(melhor.media)}`]
  ];
}

function opcaoHtml(opcao, i) {
  const o = opcao.oferta;
  return `<h3>${i + 1}ª opção</h3>` + listaDefinicaoHtml([
    ['Curso', `${o.curso} (${o.grau})`],
    ['Instituição', `${o.ies} (${o.sigla})`],
    ['Local de oferta', `${o.local} · ${o.municipio}/${o.uf}`],
    ['Turno', o.turno],
    ['Tipo de bolsa', NOMES_BOLSA[opcao.bolsa]],
    ['Modalidade', NOMES_MODALIDADE[opcao.modalidade]]
  ]);
}

function entrarFicha() {
  $('#ficha').innerHTML =
    '<h3>Dados pessoais</h3>' + listaDefinicaoHtml(paresDados()) +
    '<h3>Perfil e formação escolar</h3>' + listaDefinicaoHtml(paresPerfil()) +
    '<h3>Grupo familiar (renda bruta mensal)</h3>' + listaDefinicaoHtml(grupo.resumo()) +
    estado.opcoes.filter(Boolean).map(opcaoHtml).join('');
}

function entrarComprovante() {
  estado.numeroInscricao = estado.numeroInscricao || gerarNumero('PROUNI26-', 9);
  $('#comprovante').innerHTML = `
    <div class="comprovante-topo">
      <div><strong>Comprovante de inscrição · Prouni 2026/2</strong><br><span class="ajuda">Documento de simulação, sem validade.</span></div>
      <div><span class="numero">Nº ${estado.numeroInscricao}</span><br><span class="ajuda">Confirmada em ${Formatar.agora()}</span></div>
    </div>
    ${listaDefinicaoHtml(paresDados().filter(([r]) => ['Nome', 'Nome social', 'CPF', 'E-mail'].includes(r)))}
    ${listaDefinicaoHtml([['Renda per capita', Formatar.moeda(grupo.totais().perCapita)]])}
    ${estado.opcoes.filter(Boolean).map(opcaoHtml).join('')}`;
  $('#resultado').innerHTML = '';
}

// Desde o Decreto nº 12.917/2026, quem escolhe cotas concorre primeiro na ampla concorrência.
function simularResultado() {
  const nota = melhorEdicao().media;
  const opcoes = estado.opcoes.filter(Boolean);
  for (let i = 0; i < opcoes.length; i++) {
    const op = opcoes[i];
    const corte = op.oferta.prouni.corte[op.bolsa];
    let via = null;
    if (nota >= corte) via = 'ampla concorrência';
    else if (op.modalidade !== 'ampla' && nota >= corte - DIFERENCA_CORTE_COTAS) via = 'políticas afirmativas (cotas)';
    if (via) {
      $('#resultado').innerHTML = `<div class="caixa ok">
        <p><strong>Pré-selecionado(a) na ${i + 1}ª opção:</strong> ${escaparHtml(op.oferta.curso)} · ${escaparHtml(op.oferta.ies)},
        ${NOMES_BOLSA[op.bolsa].toLowerCase()}, por ${via}.</p>
        <p>Pré-seleção <strong>não garante</strong> a bolsa: leve à faculdade, no prazo, os documentos de identidade do grupo familiar,
        comprovantes de residência, de ensino médio e de renda.</p></div>`;
      return;
    }
  }
  $('#resultado').innerHTML = `<div class="caixa alerta">
    <p><strong>Não pré-selecionado(a) na 1ª chamada.</strong> Aguarde a 2ª chamada. Se não for pré-selecionado(a), manifeste interesse na lista de espera no prazo do edital.</p>
    <p><button type="button" class="botao pequeno" id="btn_lista_espera">Manifestar interesse na lista de espera</button></p></div>`;
}

$('#btn_resultado').addEventListener('click', simularResultado);
$('#resultado').addEventListener('click', (e) => {
  if (e.target.id !== 'btn_lista_espera') return;
  $('#resultado').innerHTML = '<div class="caixa ok"><p>Interesse na lista de espera registrado (simulação). Acompanhe o resultado no portal e na instituição.</p></div>';
});

/* ---------- Dados fictícios para a demonstração ---------- */
const preenchimentos = {
  login() { definirValor('login_cpf', gerarCpfFicticio()); },
  dados() {
    const c = CANDIDATO_FICTICIO;
    definirValor('estado_civil', 'Solteiro(a)');
    definirValor('nacionalidade', 'Brasileira');
    ['email', 'celular', 'telefone', 'cep', 'uf', 'municipio', 'logradouro', 'numero', 'complemento', 'bairro']
      .forEach((campo) => definirValor(campo, c[campo]));
    definirValor('email_confirmacao', c.email);
  },
  perfil() {
    definirValor('raca_cor', 'Parda');
    definirValor('pcd', 'nao');
    definirValor('professor', 'nao');
    definirValor('ensino_medio', 'publica');
    definirValor('ano_conclusao', '2025');
  },
  grupo() { grupo.preencherFicticio(0, GRUPO_FAMILIAR_FICTICIO); },
  cursos() {
    estado.opcoes = [
      { oferta: OFERTAS_PRIVADAS.find((o) => o.id === 'p1'), bolsa: 'integral', modalidade: 'ppi' },
      { oferta: OFERTAS_PRIVADAS.find((o) => o.id === 'p4'), bolsa: 'parcial', modalidade: 'ampla' }
    ];
    renderizarOpcoes();
    renderizarOfertas();
  },
  ficha() { definirValor('declaracao_veracidade', true); }
};

/* ---------- Início ---------- */
const assistente = new Assistente({
  formulario: $('#formulario'),
  indicador: $('#indicador'),
  aoEntrar: {
    dados: entrarDados,
    grupo: () => grupo.renderizar(),
    cursos: entrarCursos,
    ficha: entrarFicha,
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

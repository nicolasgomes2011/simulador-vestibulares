/* =========================================================
   Simulador Fies
   Fluxo baseado no Edital SESu/MEC nº 52/2026 (Fies, 2º semestre
   de 2026) e na Lei nº 10.260/2001. Dados só em memória.
   ========================================================= */

const estado = {
  candidato: null,
  opcoes: [null, null, null],   // { oferta }
  numeroInscricao: null
};

// Modalidades de concorrência do edital (item 2.7.1.1).
const MODALIDADES_FIES = {
  ampla: 'Ampla concorrência',
  ppiq: 'Autodeclarados pretos, pardos, indígenas e quilombolas',
  pcd: 'Pessoas com deficiência'
};
const TIPOS_VAGA = { social: 'Vagas Fies Social', demais: 'Demais vagas Fies' };
const DIFERENCA_CORTE = { cota: 30, social: 40 }; // fictício

/* ---------- Regras ---------- */
// Média aritmética das 5 provas igual ou superior a 450 e redação acima de zero (item 2.3).
function participacoesValidas() {
  return estado.candidato.enem.filter((p) =>
    p.edicao >= EDICAO.fies.enemDesde && p.situacao === 'valida' && p.notas.red > 0 && mediaSimples(p.notas) >= 450);
}

function melhorEdicao() {
  const validas = participacoesValidas();
  if (!validas.length) return null;
  return validas
    .map((p) => ({ edicao: p.edicao, media: mediaSimples(p.notas) }))
    .sort((a, b) => b.media - a.media)[0];
}

function modalidadesPermitidas() {
  const cor = lerValor('raca_cor');
  const lista = ['ampla'];
  if (['Preta', 'Parda', 'Indígena'].includes(cor) || lerValor('quilombola') === 'sim') lista.push('ppiq');
  if (lerValor('pcd') === 'sim') lista.push('pcd');
  return lista;
}

// No sistema real, o FiesSeleção consulta o CadÚnico pelo CPF. Aqui, usa a renda declarada.
function identificadoNoCadUnico() {
  return grupo.totais().emSalarios <= 0.5;
}

function querFiesSocial() {
  return identificadoNoCadUnico() && lerValor('tipo_vaga') === 'social';
}

function hojeIso() {
  return new Date().toISOString().slice(0, 10);
}

/* ---------- Etapa: dados pessoais ---------- */
function entrarDados(etapa) {
  const c = estado.candidato;
  if (!lerValor('cpf', etapa)) definirValor('cpf', c.cpf, etapa);
  $('#tabela_enem').innerHTML = tabelaEnemHtml(c.enem, (ano) => ano >= EDICAO.fies.enemDesde);
  const melhor = melhorEdicao();
  $('#situacao_enem').innerHTML = melhor
    ? `<div class="caixa ok"><p>Edição considerada: <strong>Enem ${melhor.edicao}</strong>, média das cinco provas
       <strong>${Formatar.nota(melhor.media)}</strong> (mínimo exigido: 450).</p></div>`
    : '<div class="caixa erro"><p>Nenhuma edição do Enem atende aos requisitos (média de 450 nas cinco provas e redação acima de zero).</p></div>';
}

function validarDados(etapa) {
  const erros = [];
  if (!melhorEdicao()) erros.push('Enem: requisitos de nota não atendidos.');
  if (lerValor('email', etapa).toLowerCase() !== lerValor('email_confirmacao', etapa).toLowerCase()) {
    erros.push('Confirme o e-mail: os dois e-mails precisam ser iguais.');
  }
  return erros;
}

/* ---------- Etapa: perfil e modalidade ---------- */
function renderizarModalidades() {
  const permitidas = modalidadesPermitidas();
  const atual = lerValor('cota');
  $('#lista_modalidades').innerHTML = Object.entries(MODALIDADES_FIES).map(([valor, texto]) => {
    const pode = permitidas.includes(valor);
    return `<label class="opcao"><input type="radio" name="cota" value="${valor}" required
      ${pode ? '' : 'disabled'} ${pode && atual === valor ? 'checked' : ''}>
      <span>${escaparHtml(texto)} ${pode ? '' : '<span class="ajuda">(não se aplica ao seu perfil)</span>'}</span></label>`;
  }).join('');
}

document.addEventListener('change', (e) => {
  if (['raca_cor', 'quilombola', 'pcd'].includes(e.target.name)) renderizarModalidades();
});

/* ---------- Grupo familiar ---------- */
const grupo = new GrupoFamiliar({
  tabela: $('#tabela_grupo'),
  resultado: $('#resultado_renda'),
  comParentesco: false,
  cpfAPartirDe: 14,
  descreverRenda(t) {
    const linha = (ok, texto) => `${ok ? '✅' : '❌'} ${texto}`;
    return [
      linha(t.emSalarios <= 3, `Fies: até 3 salários mínimos por pessoa (${Formatar.moeda(SALARIO_MINIMO * 3)})`),
      linha(t.emSalarios <= 0.5, `Fies Social: até meio salário mínimo por pessoa (${Formatar.moeda(SALARIO_MINIMO / 2)}), com CadÚnico`)
    ].join('<br>');
  }
});

function validarGrupo() {
  const erros = grupo.erros(hojeIso());
  if (grupo.totais().emSalarios > 3) {
    erros.push('Renda per capita acima de 3 salários mínimos: com essa renda não é possível concorrer ao Fies.');
  }
  return erros;
}

/* ---------- Etapa: cursos ---------- */
function renderizarTipoVaga() {
  if (!identificadoNoCadUnico()) {
    $('#bloco_tipo_vaga').innerHTML = `<div class="caixa info"><p>Seu CPF não foi identificado no CadÚnico com renda per capita de até
      ${Formatar.moeda(SALARIO_MINIMO / 2)}. Você concorre às <strong>demais vagas Fies</strong>.</p></div>`;
    return;
  }
  const atual = lerValor('tipo_vaga');
  $('#bloco_tipo_vaga').innerHTML = `<div class="caixa ok"><p>Seu CPF foi identificado no CadÚnico com renda per capita de até meio salário mínimo.</p></div>
    <div class="pergunta"><span class="rotulo obrigatorio">A qual tipo de vaga você vai concorrer?</span>
      <div class="opcoes">${Object.entries(TIPOS_VAGA).map(([valor, texto]) => `<label class="opcao">
        <input type="radio" name="tipo_vaga" value="${valor}" required ${atual === valor ? 'checked' : ''}> <span>${texto}</span></label>`).join('')}</div>
      <p class="dica">A escolha vale para todas as opções de curso. No sistema real, a consulta ao CadÚnico é automática, feita pelo CPF.</p>
    </div>`;
}

function ofertasFies() {
  return OFERTAS_PRIVADAS.filter((o) => o.fies);
}

function iniciarFiltros() {
  const unicos = (valores) => [...new Set(valores)].sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'));
  preencherSelect($('#f_uf'), unicos(ofertasFies().map((o) => o.uf)), 'Todos');
  preencherSelect($('#f_municipio'), unicos(ofertasFies().map((o) => o.municipio)), 'Todos');
  preencherSelect($('#f_conceito'), unicos(ofertasFies().map((o) => String(o.fies.conceito))), 'Todos');
  preencherSelect($('#f_ies'), unicos(ofertasFies().map((o) => o.ies)), 'Todas');
  ['#f_uf', '#f_municipio', '#f_curso', '#f_conceito', '#f_ies'].forEach((sel) => $(sel).addEventListener('input', renderizarOfertas));
}

function renderizarOfertas() {
  const termo = $('#f_curso').value.trim().toLowerCase();
  const uf = $('#f_uf').value;
  const municipio = $('#f_municipio').value;
  const conceito = $('#f_conceito').value;
  const ies = $('#f_ies').value;
  const lista = ofertasFies().filter((o) =>
    (!termo || o.curso.toLowerCase().includes(termo)) && (!uf || o.uf === uf) && (!municipio || o.municipio === municipio) &&
    (!conceito || String(o.fies.conceito) === conceito) && (!ies || o.ies === ies));

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
        <span class="etiqueta">Vagas Fies Social: ${o.fies.vagasSocial}</span>
        <span class="etiqueta">Demais vagas Fies: ${o.fies.vagas}</span>
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
  // As opções restantes sobem, mantendo a ordem de prioridade.
  const restantes = estado.opcoes.filter(Boolean);
  estado.opcoes = [0, 1, 2].map((i) => restantes[i] || null);
  renderizarOpcoes();
  renderizarOfertas();
});

function entrarCursos() {
  renderizarTipoVaga();
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
  return [
    ['Nome completo', lerValor('nome')],
    ['CPF', lerValor('cpf')],
    ['Data de nascimento', Formatar.data(lerValor('data_nascimento'))],
    ['E-mail', lerValor('email')],
    ['Telefone celular', lerValor('celular')]
  ];
}

function paresPerfil() {
  const melhor = melhorEdicao();
  const simNao = (nome) => (lerValor(nome) === 'sim' ? 'Sim' : 'Não');
  return [
    ['Etnia/cor', lerValor('raca_cor')],
    ['Quilombola', simNao('quilombola')],
    ['Pessoa com deficiência', simNao('pcd')],
    ['Concluiu o ensino superior', simNao('superior_concluido')],
    ['Ensino médio', TEXTO_ENSINO_MEDIO[lerValor('ensino_medio')]],
    ['Enem considerado', `${melhor.edicao} · média ${Formatar.nota(melhor.media)}`]
  ];
}

function paresModalidade() {
  return [
    ['Modalidade de concorrência', MODALIDADES_FIES[lerValor('cota')]],
    ['Tipo de vaga', querFiesSocial() ? TIPOS_VAGA.social : TIPOS_VAGA.demais]
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
    '<h3>Perfil</h3>' + listaDefinicaoHtml(paresPerfil()) +
    '<h3>Grupo familiar (renda bruta mensal)</h3>' + listaDefinicaoHtml(grupo.resumo()) +
    '<h3>Modalidade e tipo de vaga</h3>' + listaDefinicaoHtml(paresModalidade()) +
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
    else if (cota !== 'ampla' && nota >= corte - DIFERENCA_CORTE.cota) via = MODALIDADES_FIES[cota].toLowerCase();
    else if (querFiesSocial() && nota >= corte - DIFERENCA_CORTE.social) via = 'vagas Fies Social';
    if (via) {
      const percentual = querFiesSocial()
        ? 'Pelo Fies Social, o financiamento pode cobrir até 100% dos encargos educacionais.'
        : 'O percentual financiado é definido depois, conforme a renda familiar e o valor da mensalidade.';
      $('#resultado').innerHTML = `<div class="caixa ok">
        <p><strong>Pré-selecionado(a) na ${i + 1}ª opção:</strong> ${escaparHtml(opcoes[i].oferta.curso)} · ${escaparHtml(opcoes[i].oferta.ies)}, por ${escaparHtml(via)}.</p>
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
    definirValor('email', c.email);
    definirValor('email_confirmacao', c.email);
    definirValor('celular', c.celular);
  },
  perfil() {
    definirValor('raca_cor', 'Parda');
    definirValor('quilombola', 'nao');
    definirValor('pcd', 'nao');
    definirValor('superior_concluido', 'nao');
    definirValor('ensino_medio', 'publica');
    definirValor('cota', 'ppiq');
  },
  // Família com renda baixa para mostrar o Fies Social.
  grupo() {
    grupo.preencherFicticio(0, [
      { ...GRUPO_FAMILIAR_FICTICIO[0], renda: 1300 },
      { ...GRUPO_FAMILIAR_FICTICIO[1], renda: 0 },
      GRUPO_FAMILIAR_FICTICIO[2]
    ]);
  },
  cursos() {
    if (identificadoNoCadUnico()) definirValor('tipo_vaga', 'social');
    estado.opcoes = ['p5', 'p4', 'p2'].map((id) => ({ oferta: OFERTAS_PRIVADAS.find((o) => o.id === id) }));
    renderizarOpcoes();
    renderizarOfertas();
  },
  conferencia() { definirValor('declaracao_veracidade', true); }
};

/* ---------- Início ---------- */
renderizarModalidades();

const assistente = new Assistente({
  formulario: $('#formulario'),
  indicador: $('#indicador'),
  aoEntrar: {
    dados: entrarDados,
    perfil: renderizarModalidades,
    grupo: () => grupo.definirCandidato(candidatoDoFormulario()),
    cursos: entrarCursos,
    conferencia: entrarConferencia,
    comprovante: entrarComprovante
  },
  validar: {
    login(etapa) {
      const erros = validarLoginCpf(etapa);
      // Só as notas do Enem são da "base do sistema"; os dados pessoais vêm do formulário.
      if (!erros.length) estado.candidato = { cpf: mascararCpf(lerValor('login_cpf', etapa)), enem: CANDIDATO_FICTICIO.enem };
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

/* =========================================================
   Simulador Sisu
   Fluxo baseado no passo a passo e nas perguntas frequentes
   do MEC para o Sisu 2026. Dados só em memória.
   ========================================================= */

const estado = {
  candidato: null,
  modalidades: ['AC'],      // modalidades confirmadas (AC é sempre incluída)
  opcoes: [null, null],     // { oferta, acoes: ['B' | 'V'] }
  numeroInscricao: null,
  confirmadaEm: null
};

const ORDEM_MODALIDADES = ['LB_PPI', 'LB_Q', 'LB_PCD', 'LB_EP', 'LI_PPI', 'LI_Q', 'LI_PCD', 'LI_EP'];

/* ---------- Regras ---------- */
function respostasQuestionario() {
  return {
    escolaPublica: lerValor('q_escola_publica'),
    cor: lerValor('q_cor'),
    quilombola: lerValor('q_quilombola'),
    pcd: lerValor('q_pcd'),
    baixaRenda: lerValor('q_baixa_renda')
  };
}

// Sem ensino médio integral em escola pública, só resta a ampla concorrência.
function modalidadesPossiveis(r) {
  if (r.escolaPublica !== 'sim') return [];
  const ppi = ['Preta', 'Parda', 'Indígena'].includes(r.cor);
  return ORDEM_MODALIDADES.filter((codigo) => {
    const [renda, grupo] = codigo.split('_');
    if (renda === 'LB' && r.baixaRenda !== 'sim') return false;
    if (grupo === 'PPI') return ppi;
    if (grupo === 'Q') return r.quilombola === 'sim';
    if (grupo === 'PCD') return r.pcd === 'sim';
    return true; // EP
  });
}

function participacoesValidas() {
  return estado.candidato.enem.filter((p) =>
    EDICAO.sisu.editaisEnem.includes(p.edicao) && p.situacao === 'valida' && p.notas.red > 0);
}

function atendeMinimo(oferta, notas) {
  if (!oferta.notaMinima) return true;
  return Object.entries(oferta.notaMinima).every(([area, minimo]) => notas[area] >= minimo);
}

// Para cada curso, o sistema usa a edição com a melhor média ponderada.
function notaParaOferta(oferta) {
  const candidatas = participacoesValidas().filter((p) => atendeMinimo(oferta, p.notas));
  if (!candidatas.length) return null;
  return candidatas
    .map((p) => ({ edicao: p.edicao, nota: mediaPonderada(p.notas, oferta.pesos) }))
    .sort((a, b) => b.nota - a.nota)[0];
}

function notaComBonus(opcao, nota) {
  const bonus = opcao.acoes.includes('B') ? opcao.oferta.acoesProprias.find((a) => a.tipo === 'B') : null;
  return bonus ? nota * (1 + bonus.percentual / 100) : nota;
}

function distribuirVagas(oferta) {
  const reservadas = Math.floor(oferta.vagas / 2);
  const baixaRenda = Math.ceil(reservadas / 2);
  const grupo = (total, prefixo) => {
    const ppi = Math.max(1, Math.round(total * 0.22));
    const pcd = Math.max(1, Math.round(total * 0.08));
    const q = Math.max(1, Math.round(total * 0.02));
    return {
      [`${prefixo}_PPI`]: ppi, [`${prefixo}_Q`]: q, [`${prefixo}_PCD`]: pcd,
      [`${prefixo}_EP`]: Math.max(0, total - ppi - pcd - q)
    };
  };
  const vagas = { AC: oferta.vagas - reservadas, ...grupo(baixaRenda, 'LB'), ...grupo(reservadas - baixaRenda, 'LI') };
  if (oferta.acoesProprias.some((a) => a.tipo === 'V')) {
    vagas.V = 2;
    vagas.AC -= 2; // vagas V saem da ampla concorrência
  }
  return vagas;
}

function notaDeCorte(oferta, codigo) {
  return oferta.corteAC - (DIFERENCA_CORTE_SISU[codigo] ?? 0);
}

// Modalidades em que o candidato concorre nesta opção, na ordem de classificação.
function modalidadesDaOpcao(opcao) {
  const lista = ['AC', ...estado.modalidades.filter((m) => m !== 'AC')];
  if (opcao.acoes.includes('V')) lista.push('V');
  return lista;
}

function nomeModalidade(codigo, oferta) {
  if (codigo === 'V') {
    const acao = oferta.acoesProprias.find((a) => a.tipo === 'V');
    return `Ação afirmativa própria da instituição: ${acao ? acao.descricao : 'reserva de vagas'}`;
  }
  return MODALIDADES_SISU[codigo];
}

/* ---------- Etapa: cadastro ---------- */
function entrarCadastro(etapa) {
  const c = estado.candidato;
  definirValor('nome', c.nome, etapa);
  definirValor('cpf', c.cpf, etapa);
  definirValor('data_nascimento', Formatar.data(c.dataNascimento), etapa);
  definirValor('nome_mae', c.nomeMae, etapa);
  $('#tabela_enem').innerHTML = tabelaEnemHtml(c.enem, (ano) => EDICAO.sisu.editaisEnem.includes(ano));
  const uf = $('#uf');
  if (uf.options.length === 0) preencherSelect(uf, UFS);
}

$('#usa_nome_social').addEventListener('change', (e) => {
  $('#bloco_nome_social').classList.toggle('oculto', !e.target.checked);
});

function validarCadastro(etapa) {
  const erros = [];
  if (lerValor('email', etapa) && lerValor('email', etapa).toLowerCase() !== lerValor('email_confirmacao', etapa).toLowerCase()) {
    erros.push('Confirme o e-mail: os dois e-mails precisam ser iguais.');
  }
  return erros;
}

/* ---------- Etapa: questionário (calculadora) ---------- */
function atualizarCalculadora() {
  const total = lerMoeda($('#calc_renda').value);
  const pessoas = Math.max(1, Number($('#calc_pessoas').value) || 1);
  const perCapita = total / pessoas;
  const dentro = perCapita <= SALARIO_MINIMO;
  $('#calc_resultado').innerHTML = total
    ? `Renda per capita: <strong>${Formatar.moeda(perCapita)}</strong>
       (${(perCapita / SALARIO_MINIMO).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} salário mínimo).
       ${dentro ? 'Fica <strong>dentro</strong>' : 'Fica <strong>acima</strong>'} do limite de 1 salário mínimo (${Formatar.moeda(SALARIO_MINIMO)}).`
    : `Informe a renda para calcular. Limite: 1 salário mínimo por pessoa (${Formatar.moeda(SALARIO_MINIMO)}).`;
}
$('#calc_renda').addEventListener('input', atualizarCalculadora);
$('#calc_pessoas').addEventListener('input', atualizarCalculadora);

/* ---------- Etapa: modalidades ---------- */
function entrarModalidades() {
  const possiveis = modalidadesPossiveis(respostasQuestionario());
  estado.modalidades = estado.modalidades.filter((m) => m === 'AC' || possiveis.includes(m));

  const itens = [`<label class="opcao"><input type="checkbox" checked disabled>
      <span><strong>AC</strong> · ${MODALIDADES_SISU.AC} <span class="ajuda">(todos concorrem)</span></span></label>`]
    .concat(possiveis.map((codigo) => `<label class="opcao">
      <input type="checkbox" name="modalidade" value="${codigo}" ${estado.modalidades.includes(codigo) ? 'checked' : ''}>
      <span><strong>${codigo}</strong> · ${escaparHtml(MODALIDADES_SISU[codigo])}</span></label>`));

  const aviso = possiveis.length
    ? '<div class="caixa ok"><p>Pelas suas respostas, você pode concorrer também nas modalidades abaixo. Marque as que deseja confirmar.</p></div>'
    : '<div class="caixa alerta"><p>Pelas suas respostas, você concorre apenas na <strong>ampla concorrência</strong> (e em ações afirmativas próprias das instituições, quando houver). As cotas da Lei nº 12.711/2012 exigem ensino médio cursado integralmente em escola pública.</p></div>';

  $('#lista_modalidades').innerHTML = `${aviso}<div class="opcoes">${itens.join('')}</div>`;
}

$('#lista_modalidades').addEventListener('change', () => {
  estado.modalidades = ['AC', ...$$('[name="modalidade"]:checked').map((c) => c.value)];
});

/* ---------- Etapa: cursos ---------- */
function valoresUnicos(chave) {
  return [...new Set(OFERTAS_SISU.map((o) => o[chave]))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

function iniciarFiltros() {
  preencherSelect($('#f_ies'), valoresUnicos('ies'), 'Todas');
  preencherSelect($('#f_local'), valoresUnicos('municipio'), 'Todos');
  preencherSelect($('#f_formato'), ['Presencial', 'EaD', 'Semipresencial'], 'Todos');
  preencherSelect($('#f_turno'), valoresUnicos('turno'), 'Todos');
  ['#f_curso', '#f_ies', '#f_local', '#f_formato', '#f_turno'].forEach((sel) => {
    $(sel).addEventListener('input', renderizarOfertas);
  });
}

function pesosTexto(pesos) {
  return `LC ${pesos.lc} · CH ${pesos.ch} · CN ${pesos.cn} · MT ${pesos.mt} · RED ${pesos.red}`;
}

function renderizarOfertas() {
  const termo = $('#f_curso').value.trim().toLowerCase();
  const filtros = { ies: $('#f_ies').value, municipio: $('#f_local').value, formato: $('#f_formato').value, turno: $('#f_turno').value };
  const lista = OFERTAS_SISU.filter((o) =>
    (!termo || o.curso.toLowerCase().includes(termo)) &&
    Object.entries(filtros).every(([chave, valor]) => !valor || o[chave] === valor));

  if (!lista.length) {
    $('#lista_ofertas').innerHTML = '<div class="caixa">Nenhum curso encontrado com esses filtros.</div>';
    return;
  }

  $('#lista_ofertas').innerHTML = lista.map((o) => {
    const nota = notaParaOferta(o);
    const posicao = estado.opcoes.findIndex((op) => op && op.oferta.id === o.id);
    let acoes;
    if (!nota) {
      const minimos = Object.entries(o.notaMinima || {}).map(([a, v]) => `${AREAS_ENEM[a]}: ${v}`).join(', ');
      acoes = `<div class="caixa erro"><p>Você não atingiu a nota mínima exigida pela instituição para este curso (${escaparHtml(minimos)}) e não pode concorrer a ele.</p></div>`;
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
        <span class="etiqueta">Vagas: ${o.vagas}</span>
        <span class="etiqueta">Pesos: ${pesosTexto(o.pesos)}</span>
        <span class="etiqueta">Nota de corte parcial (AC): ${Formatar.nota(o.corteAC)}</span>
        ${nota ? `<span class="etiqueta destaque">Sua nota: ${Formatar.nota(nota.nota)} (Enem ${nota.edicao})</span>` : ''}
        ${o.acoesProprias.length ? '<span class="etiqueta">Possui ação afirmativa própria</span>' : ''}
      </div>
      <div class="acoes">${acoes}</div>
    </article>`;
  }).join('');
}

$('#lista_ofertas').addEventListener('click', (e) => {
  const botao = e.target.closest('[data-escolher]');
  if (!botao) return;
  const oferta = OFERTAS_SISU.find((o) => o.id === botao.dataset.escolher);
  estado.opcoes[Number(botao.dataset.posicao)] = { oferta, acoes: [] };
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
    const nota = notaParaOferta(o);
    const vagas = distribuirVagas(o);
    const acoes = o.acoesProprias.map((a) => `<label class="opcao">
        <input type="checkbox" data-acao-propria="${a.tipo}" data-opcao="${i}" ${opcao.acoes.includes(a.tipo) ? 'checked' : ''}>
        <span>Desejo concorrer à ação afirmativa própria da instituição (${a.tipo === 'B' ? 'bônus' : 'reserva de vagas'}): ${escaparHtml(a.descricao)}</span></label>`).join('');
    const linhas = modalidadesDaOpcao(opcao).map((m) =>
      `<tr><td><strong>${m}</strong></td><td>${escaparHtml(nomeModalidade(m, o))}</td><td class="num">${vagas[m] ?? '-'}</td></tr>`).join('');
    return `<div class="opcao-escolhida">
      <div class="titulo-opcao">${titulo}</div>
      <h4>${escaparHtml(o.curso)} · ${escaparHtml(o.grau)}</h4>
      <div class="meta">${escaparHtml(o.ies)} (${escaparHtml(o.sigla)}) · ${escaparHtml(o.local)} · ${escaparHtml(o.municipio)}/${o.uf} · ${escaparHtml(o.turno)} · ${escaparHtml(o.formato)}</div>
      <p>Nota do Enem considerada: <strong>${Formatar.nota(notaComBonus(opcao, nota.nota))}</strong> (Enem ${nota.edicao}${opcao.acoes.includes('B') ? ', com bônus' : ''}) · Pesos: ${pesosTexto(o.pesos)}</p>
      ${acoes ? `<div class="pergunta">${acoes}</div>` : ''}
      <p class="rotulo">Modalidades em que você está inscrito(a) neste curso:</p>
      <div class="tabela-rolagem"><table><thead><tr><th>Código</th><th>Modalidade</th><th class="num">Vagas</th></tr></thead><tbody>${linhas}</tbody></table></div>
      <button type="button" class="botao perigo pequeno" data-remover="${i}">Remover ${i + 1}ª opção</button>
    </div>`;
  }).join('');
}

$('#opcoes_escolhidas').addEventListener('click', (e) => {
  const botao = e.target.closest('[data-remover]');
  if (!botao) return;
  const i = Number(botao.dataset.remover);
  estado.opcoes[i] = null;
  // Sem 1ª opção, a 2ª sobe de posição.
  if (i === 0 && estado.opcoes[1]) estado.opcoes = [estado.opcoes[1], null];
  renderizarOpcoes();
  renderizarOfertas();
});

$('#opcoes_escolhidas').addEventListener('change', (e) => {
  const caixa = e.target.closest('[data-acao-propria]');
  if (!caixa) return;
  const opcao = estado.opcoes[Number(caixa.dataset.opcao)];
  const tipo = caixa.dataset.acaoPropria;
  opcao.acoes = caixa.checked ? [...opcao.acoes, tipo] : opcao.acoes.filter((t) => t !== tipo);
  renderizarOpcoes();
});

function entrarCursos() {
  renderizarOpcoes();
  renderizarOfertas();
}

function validarCursos() {
  return estado.opcoes[0] ? [] : ['1ª opção: escolha pelo menos um curso.'];
}

/* ---------- Conferência e comprovante ---------- */
function paresCandidato() {
  const c = estado.candidato;
  const endereco = [lerValor('logradouro'), lerValor('numero'), lerValor('complemento'), lerValor('bairro'),
    `${lerValor('municipio')}/${lerValor('uf')}`, `CEP ${lerValor('cep')}`].filter(Boolean).join(', ');
  return [
    ['Nome', c.nome],
    ['Nome social', lerValor('usa_nome_social') ? lerValor('nome_social') : ''],
    ['CPF', c.cpf],
    ['Data de nascimento', Formatar.data(c.dataNascimento)],
    ['E-mail', lerValor('email')],
    ['Telefone celular', lerValor('celular')],
    ['Telefone fixo', lerValor('telefone')],
    ['Endereço', endereco]
  ];
}

function paresQuestionario() {
  const r = respostasQuestionario();
  const simNao = (v) => (v === 'sim' ? 'Sim' : 'Não');
  return [
    ['Ensino médio integralmente em escola pública', simNao(r.escolaPublica)],
    ['Cor/etnia', r.cor],
    ['Quilombola', simNao(r.quilombola)],
    ['Pessoa com deficiência', simNao(r.pcd)],
    ['Renda per capita até 1 salário mínimo', simNao(r.baixaRenda)],
    ['Modalidades confirmadas', estado.modalidades.join(', ')]
  ];
}

function opcaoHtml(opcao, i) {
  const o = opcao.oferta;
  const nota = notaParaOferta(o);
  return `<h3>${i + 1}ª opção</h3>` + listaDefinicaoHtml([
    ['Curso', `${o.curso} (${o.grau})`],
    ['Instituição', `${o.ies} (${o.sigla})`],
    ['Local de oferta', `${o.local} · ${o.municipio}/${o.uf}`],
    ['Turno', o.turno],
    ['Formato de oferta', o.formato],
    ['Modalidades', modalidadesDaOpcao(opcao).join(', ')],
    ['Ações afirmativas próprias', opcao.acoes.length ? opcao.acoes.map((t) => (t === 'B' ? 'Bônus' : 'Reserva de vagas')).join(', ') : 'Não'],
    ['Nota considerada', `${Formatar.nota(notaComBonus(opcao, nota.nota))} (Enem ${nota.edicao})`]
  ]);
}

function entrarConferencia() {
  $('#resumo_conferencia').innerHTML =
    '<h3>Dados do candidato</h3>' + listaDefinicaoHtml(paresCandidato()) +
    '<h3>Questionário socioeconômico</h3>' + listaDefinicaoHtml(paresQuestionario()) +
    estado.opcoes.filter(Boolean).map(opcaoHtml).join('');
}

function entrarComprovante() {
  estado.numeroInscricao = estado.numeroInscricao || gerarNumero('SISU26-', 9);
  estado.confirmadaEm = Formatar.agora();
  $('#comprovante').innerHTML = `
    <div class="comprovante-topo">
      <div><strong>Comprovante de inscrição · Sisu 2026</strong><br><span class="ajuda">Documento de simulação, sem validade.</span></div>
      <div><span class="numero">Nº ${estado.numeroInscricao}</span><br><span class="ajuda">Confirmada em ${estado.confirmadaEm}</span></div>
    </div>
    ${listaDefinicaoHtml(paresCandidato().filter(([r]) => ['Nome', 'Nome social', 'CPF', 'E-mail'].includes(r)))}
    ${estado.opcoes.filter(Boolean).map(opcaoHtml).join('')}`;
  renderizarClassificacao();
  $('#resultado').innerHTML = '';
}

function situacaoNaOpcao(opcao) {
  const nota = notaParaOferta(opcao.oferta).nota;
  return modalidadesDaOpcao(opcao).map((m) => {
    const notaUsada = m === 'AC' ? notaComBonus(opcao, nota) : nota;
    const corte = notaDeCorte(opcao.oferta, m);
    return { modalidade: m, corte, nota: notaUsada, dentro: notaUsada >= corte };
  });
}

function renderizarClassificacao() {
  $('#classificacao_parcial').innerHTML = estado.opcoes.filter(Boolean).map((opcao, i) => {
    const linhas = situacaoNaOpcao(opcao).map((s) => `<tr>
      <td><strong>${s.modalidade}</strong></td><td class="num">${Formatar.nota(s.corte)}</td><td class="num">${Formatar.nota(s.nota)}</td>
      <td>${s.dentro ? '✅ Dentro das vagas' : '❌ Fora das vagas'}</td></tr>`).join('');
    return `<p class="rotulo">${i + 1}ª opção · ${escaparHtml(opcao.oferta.curso)} · ${escaparHtml(opcao.oferta.sigla)}</p>
      <div class="tabela-rolagem"><table><thead><tr><th>Modalidade</th><th class="num">Nota de corte parcial</th><th class="num">Sua nota</th><th>Situação parcial</th></tr></thead>
      <tbody>${linhas}</tbody></table></div>`;
  }).join('');
}

// Ordem de classificação: AC, depois cotas, depois V. 1ª opção antes da 2ª.
function simularResultado() {
  const opcoes = estado.opcoes.filter(Boolean);
  for (let i = 0; i < opcoes.length; i++) {
    const aprovado = situacaoNaOpcao(opcoes[i]).find((s) => s.dentro);
    if (aprovado) {
      $('#resultado').innerHTML = `<div class="caixa ok">
        <p><strong>Selecionado(a) na ${i + 1}ª opção:</strong> ${escaparHtml(opcoes[i].oferta.curso)} · ${escaparHtml(opcoes[i].oferta.ies)}, modalidade <strong>${aprovado.modalidade}</strong>.</p>
        ${i === 0 && opcoes[1] ? '<p>Como a seleção foi na 1ª opção, a 2ª opção não é processada.</p>' : ''}
        <p>Próximo passo: fazer a matrícula no prazo e do jeito definidos pela instituição, levando os documentos da modalidade.</p></div>`;
      return;
    }
  }
  $('#resultado').innerHTML = `<div class="caixa alerta">
    <p><strong>Não selecionado(a) na chamada regular.</strong> Você pode manifestar interesse na lista de espera em <strong>apenas uma</strong> das opções. Isso <strong>não é automático</strong>.</p>
    <div class="opcoes">${opcoes.map((op, i) => `<label class="opcao"><input type="radio" name="lista_espera" value="${i}" ${i === 0 ? 'checked' : ''}>
      ${i + 1}ª opção · ${escaparHtml(op.oferta.curso)} · ${escaparHtml(op.oferta.sigla)}</label>`).join('')}</div>
    <p><button type="button" class="botao pequeno" id="btn_lista_espera">Confirmar interesse na lista de espera</button></p></div>`;
}

$('#btn_resultado').addEventListener('click', simularResultado);
$('#resultado').addEventListener('click', (e) => {
  if (e.target.id !== 'btn_lista_espera') return;
  const i = Number(lerValor('lista_espera'));
  const opcao = estado.opcoes.filter(Boolean)[i];
  $('#resultado').innerHTML = `<div class="caixa ok"><p>Interesse na lista de espera confirmado (simulação) para: <strong>${escaparHtml(opcao.oferta.curso)} · ${escaparHtml(opcao.oferta.ies)}</strong>.</p>
    <p>As convocações da lista de espera são feitas por cada instituição. Acompanhe o site e os canais oficiais da instituição, não o site do Sisu.</p></div>`;
});

/* ---------- Dados fictícios para a demonstração ---------- */
const preenchimentos = {
  login() { definirValor('login_cpf', gerarCpfFicticio()); },
  cadastro() {
    const c = CANDIDATO_FICTICIO;
    ['email', 'celular', 'telefone', 'cep', 'uf', 'municipio', 'logradouro', 'numero', 'complemento', 'bairro']
      .forEach((campo) => definirValor(campo, c[campo]));
    definirValor('email_confirmacao', c.email);
  },
  questionario() {
    definirValor('q_escola_publica', 'sim');
    definirValor('q_cor', 'Parda');
    definirValor('q_quilombola', 'nao');
    definirValor('q_pcd', 'nao');
    definirValor('q_baixa_renda', 'sim');
    definirValor('calc_renda', '355000');
    definirValor('calc_pessoas', '4');
    definirValor('declaracao_veracidade', true);
  },
  modalidades() {
    $$('[name="modalidade"]').forEach((c) => { c.checked = true; });
    estado.modalidades = ['AC', ...$$('[name="modalidade"]').map((c) => c.value)];
  },
  cursos() {
    estado.opcoes = [
      { oferta: OFERTAS_SISU.find((o) => o.id === 's1'), acoes: [] },
      { oferta: OFERTAS_SISU.find((o) => o.id === 's7'), acoes: [] }
    ];
    renderizarOpcoes();
    renderizarOfertas();
  }
};

/* ---------- Início ---------- */
const assistente = new Assistente({
  formulario: $('#formulario'),
  indicador: $('#indicador'),
  aoEntrar: {
    cadastro: entrarCadastro,
    questionario: atualizarCalculadora,
    modalidades: entrarModalidades,
    cursos: entrarCursos,
    conferencia: entrarConferencia,
    comprovante: entrarComprovante
  },
  validar: {
    login(etapa) {
      const erros = validarLoginCpf(etapa);
      if (!erros.length) estado.candidato = { ...CANDIDATO_FICTICIO, cpf: mascararCpf(lerValor('login_cpf', etapa)) };
      return erros;
    },
    cadastro: validarCadastro,
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

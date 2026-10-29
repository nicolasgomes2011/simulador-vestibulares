/* =========================================================
   Funções compartilhadas pelos três simuladores.
   IMPORTANTE: nenhum dado é enviado pela rede nem salvo
   (sem banco de dados, sem localStorage, sem cookies).
   Tudo fica só na memória da página e some ao recarregar.
   ========================================================= */

const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
const $$ = (seletor, raiz = document) => [...raiz.querySelectorAll(seletor)];

function escaparHtml(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ---------- Formatação ---------- */
const Formatar = {
  moeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  },
  nota(valor) {
    return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },
  data(iso) {
    if (!iso) return '';
    const [ano, mes, dia] = iso.split('-');
    return `${dia}/${mes}/${ano}`;
  },
  agora() {
    return new Date().toLocaleString('pt-BR');
  }
};

function lerMoeda(texto) {
  const limpo = String(texto || '').replace(/[^\d,]/g, '').replace(',', '.');
  return Number(limpo) || 0;
}

/* ---------- CPF (validação dos dígitos verificadores) ---------- */
function apenasDigitos(texto) {
  return String(texto ?? '').replace(/\D/g, '');
}

function cpfValido(cpf) {
  const d = apenasDigitos(cpf);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const digito = (base) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (base.length + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(d.slice(0, 9)) === Number(d[9]) && digito(d.slice(0, 10)) === Number(d[10]);
}

// Gera um CPF com formato válido, apenas para a simulação.
function gerarCpfFicticio() {
  const base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('');
  const calc = (s) => {
    let soma = 0;
    for (let i = 0; i < s.length; i++) soma += Number(s[i]) * (s.length + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  const d1 = calc(base);
  const d2 = calc(base + d1);
  return mascararCpf(base + d1 + d2);
}

function mascararCpf(valor) {
  const d = apenasDigitos(valor).slice(0, 11);
  return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function gerarNumero(prefixo, tamanho = 10) {
  let n = '';
  for (let i = 0; i < tamanho; i++) n += Math.floor(Math.random() * 10);
  return prefixo + n;
}

/* ---------- Máscaras de digitação (atributo data-mascara) ---------- */
const MASCARAS = {
  cpf: mascararCpf,
  telefone(valor) {
    const d = apenasDigitos(valor).slice(0, 11);
    if (d.length <= 10) return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
    return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
  },
  cep(valor) {
    return apenasDigitos(valor).slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');
  },
  moeda(valor) {
    const d = apenasDigitos(valor);
    if (!d) return '';
    return (Number(d) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },
  numero(valor) {
    return apenasDigitos(valor);
  }
};

function aplicarMascara(campo) {
  const tipo = campo.dataset.mascara;
  if (!MASCARAS[tipo]) return;
  campo.value = MASCARAS[tipo](campo.value);
  if (tipo === 'cpf') {
    const d = apenasDigitos(campo.value);
    campo.setCustomValidity(d.length === 11 && !cpfValido(d) ? 'CPF inválido: confira os dígitos.' : '');
  }
}

document.addEventListener('input', (evento) => {
  if (evento.target.matches('[data-mascara]')) aplicarMascara(evento.target);
});

/* ---------- Preenchimento de campos (usado pelo "dados fictícios") ---------- */
function definirValor(nome, valor, raiz = document) {
  const campo = raiz.querySelector(`[name="${nome}"]`);
  if (!campo) return;
  if (campo.type === 'radio') {
    const alvo = raiz.querySelector(`[name="${nome}"][value="${valor}"]`);
    if (alvo) { alvo.checked = true; alvo.dispatchEvent(new Event('change', { bubbles: true })); }
    return;
  }
  if (campo.type === 'checkbox') {
    campo.checked = Boolean(valor);
  } else {
    campo.value = valor;
    if (campo.dataset.mascara) aplicarMascara(campo);
  }
  campo.dispatchEvent(new Event('input', { bubbles: true }));
  campo.dispatchEvent(new Event('change', { bubbles: true }));
}

function lerValor(nome, raiz = document) {
  const campos = raiz.querySelectorAll(`[name="${nome}"]`);
  if (!campos.length) return '';
  if (campos[0].type === 'radio') {
    const marcado = [...campos].find((c) => c.checked);
    return marcado ? marcado.value : '';
  }
  if (campos[0].type === 'checkbox') return campos[0].checked;
  return campos[0].value.trim();
}

function preencherSelect(select, opcoes, textoVazio = 'Selecione') {
  select.innerHTML = `<option value="">${escaparHtml(textoVazio)}</option>` +
    opcoes.map((o) => {
      const valor = typeof o === 'string' ? o : o.valor;
      const texto = typeof o === 'string' ? o : o.texto;
      return `<option value="${escaparHtml(valor)}">${escaparHtml(texto)}</option>`;
    }).join('');
}

/* ---------- Renda familiar ---------- */
function calcularRendaPerCapita(rendas) {
  const total = rendas.reduce((soma, r) => soma + (Number(r) || 0), 0);
  const pessoas = rendas.length || 1;
  return { total, pessoas, perCapita: total / pessoas, emSalarios: total / pessoas / SALARIO_MINIMO };
}

/* ---------- Enem ---------- */
function mediaSimples(notas) {
  return (notas.lc + notas.ch + notas.cn + notas.mt + notas.red) / 5;
}

function mediaObjetivas(notas) {
  return (notas.lc + notas.ch + notas.cn + notas.mt) / 4;
}

function mediaPonderada(notas, pesos) {
  const somaPesos = pesos.lc + pesos.ch + pesos.cn + pesos.mt + pesos.red;
  return (notas.lc * pesos.lc + notas.ch * pesos.ch + notas.cn * pesos.cn +
    notas.mt * pesos.mt + notas.red * pesos.red) / somaPesos;
}

function situacaoEnemTexto(participacao) {
  if (participacao.situacao === 'treineiro') return 'Não pode ser usada (participou como treineiro)';
  if (participacao.notas.red === 0) return 'Não pode ser usada (redação zerada)';
  return 'Pode ser usada';
}

function tabelaEnemHtml(participacoes, edicoesAceitas) {
  const linhas = participacoes.map((p) => {
    const aceita = edicoesAceitas(p.edicao) && p.situacao === 'valida' && p.notas.red > 0;
    const situacao = !edicoesAceitas(p.edicao) ? 'Edição não aceita neste processo' : situacaoEnemTexto(p);
    return `<tr class="${aceita ? '' : 'excluida'}">
      <td>${p.edicao}</td><td>${p.inscricao}</td>
      <td class="num">${Formatar.nota(p.notas.lc)}</td><td class="num">${Formatar.nota(p.notas.ch)}</td>
      <td class="num">${Formatar.nota(p.notas.cn)}</td><td class="num">${Formatar.nota(p.notas.mt)}</td>
      <td class="num">${Formatar.nota(p.notas.red)}</td><td>${situacao}</td></tr>`;
  }).join('');
  return `<div class="tabela-rolagem"><table>
    <thead><tr><th>Edição</th><th>Nº de inscrição</th><th class="num">Linguagens</th><th class="num">Humanas</th>
    <th class="num">Natureza</th><th class="num">Matemática</th><th class="num">Redação</th><th>Situação</th></tr></thead>
    <tbody>${linhas}</tbody></table></div>`;
}

/* ---------- Resumo em lista de definição ---------- */
function listaDefinicaoHtml(pares) {
  return '<dl>' + pares
    .filter(([, valor]) => valor !== undefined && valor !== null && valor !== '')
    .map(([rotulo, valor]) => `<dt>${escaparHtml(rotulo)}</dt><dd>${escaparHtml(valor)}</dd>`)
    .join('') + '</dl>';
}

/* =========================================================
   Assistente de etapas
   Cada <section class="etapa" data-id="..." data-titulo="...">
   vira uma tela. O assistente cria os botões Voltar/Continuar,
   confere os campos obrigatórios e chama as funções da página.
   ========================================================= */
class Assistente {
  constructor({ formulario, indicador, aoEntrar = {}, validar = {} }) {
    this.formulario = formulario;
    this.indicador = indicador;
    this.aoEntrar = aoEntrar;
    this.validar = validar;
    this.etapas = $$('.etapa', formulario);
    this.atual = 0;

    this.formulario.setAttribute('novalidate', '');
    this.formulario.addEventListener('submit', (e) => e.preventDefault());
    this.criarIndicador();
    this.criarNavegacao();
    this.ir(0, false);
  }

  get idAtual() {
    return this.etapas[this.atual].dataset.id;
  }

  criarIndicador() {
    this.indicador.innerHTML = this.etapas
      .map((etapa) => `<li>${escaparHtml(etapa.dataset.titulo)}</li>`)
      .join('');
  }

  criarNavegacao() {
    this.etapas.forEach((etapa, i) => {
      if (etapa.hasAttribute('data-sem-navegacao')) return;
      const nav = document.createElement('div');
      nav.className = 'navegacao-etapa';
      const voltar = i > 0
        ? '<button type="button" class="botao secundario" data-acao="voltar">← Voltar</button>'
        : '<span></span>';
      const textoProxima = etapa.dataset.botaoProxima || 'Continuar →';
      nav.innerHTML = `${voltar}<button type="button" class="botao" data-acao="proxima">${escaparHtml(textoProxima)}</button>`;
      etapa.appendChild(nav);
    });
    this.formulario.addEventListener('click', (e) => {
      const botao = e.target.closest('[data-acao]');
      if (!botao) return;
      if (botao.dataset.acao === 'voltar') this.anterior();
      if (botao.dataset.acao === 'proxima') this.proxima();
    });
  }

  ir(indice, rolar = true) {
    this.atual = indice;
    this.etapas.forEach((etapa, i) => etapa.classList.toggle('ativa', i === indice));
    $$('li', this.indicador).forEach((li, i) => {
      li.classList.toggle('atual', i === indice);
      li.classList.toggle('feita', i < indice);
    });
    const etapa = this.etapas[indice];
    const funcao = this.aoEntrar[etapa.dataset.id];
    if (funcao) funcao(etapa);
    this.limparErros(etapa);
    if (rolar) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const titulo = $('h2', etapa);
      if (titulo) { titulo.setAttribute('tabindex', '-1'); titulo.focus({ preventScroll: true }); }
    }
  }

  proxima() {
    const etapa = this.etapas[this.atual];
    if (!this.conferir(etapa)) return;
    if (this.atual < this.etapas.length - 1) this.ir(this.atual + 1);
  }

  anterior() {
    if (this.atual > 0) this.ir(this.atual - 1);
  }

  limparErros(etapa) {
    $$('.campo.invalido', etapa).forEach((c) => c.classList.remove('invalido'));
    $$('.msg-campo', etapa).forEach((m) => { m.textContent = ''; });
    const caixa = $('.caixa-erros', etapa);
    if (caixa) caixa.remove();
  }

  // Confere campos obrigatórios visíveis e as regras extras da etapa.
  conferir(etapa) {
    this.limparErros(etapa);
    const erros = [];
    const gruposRadio = new Set();

    $$('input, select, textarea', etapa).forEach((campo) => {
      if (campo.disabled || campo.closest('.oculto') || campo.type === 'button') return;
      if (campo.type === 'radio') {
        if (gruposRadio.has(campo.name)) return;
        gruposRadio.add(campo.name);
      }
      if (campo.checkValidity()) return;
      const caixaCampo = campo.closest('.campo, .pergunta, td');
      const rotulo = caixaCampo ? $('label, .rotulo', caixaCampo) : null;
      const nome = campo.dataset.nome ||
        (rotulo ? rotulo.textContent.replace('*', '').trim() : (campo.getAttribute('aria-label') || campo.name));
      const mensagem = campo.validity.valueMissing ? 'Campo obrigatório.' : campo.validationMessage;
      if (caixaCampo) {
        caixaCampo.classList.add('invalido');
        let msg = $('.msg-campo', caixaCampo);
        if (!msg) {
          msg = document.createElement('span');
          msg.className = 'msg-campo';
          caixaCampo.appendChild(msg);
        }
        msg.textContent = mensagem;
      }
      erros.push(`${nome}: ${mensagem}`);
    });

    const extra = this.validar[etapa.dataset.id];
    if (extra) erros.push(...(extra(etapa) || []));

    if (erros.length) {
      const caixa = document.createElement('div');
      caixa.className = 'caixa erro caixa-erros';
      caixa.setAttribute('role', 'alert');
      caixa.innerHTML = `<p><strong>Corrija antes de continuar:</strong></p><ul>${erros.map((e) => `<li>${escaparHtml(e)}</li>`).join('')}</ul>`;
      const cabecalho = $('.etapa-cabecalho', etapa);
      (cabecalho || etapa.firstChild).after(caixa);
      caixa.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    return true;
  }
}

// Dados do candidato digitados na etapa de dados pessoais.
function candidatoDoFormulario() {
  return { nome: lerValor('nome'), cpf: lerValor('cpf'), dataNascimento: lerValor('data_nascimento') };
}

/* =========================================================
   Grupo familiar (Prouni e Fies)
   Tabela com o candidato + membros da família e a renda bruta
   mensal de cada um. Calcula a renda per capita na hora.
   ========================================================= */
class GrupoFamiliar {
  constructor({ tabela, resultado, descreverRenda }) {
    this.tabela = tabela;
    this.resultado = resultado;
    this.descreverRenda = descreverRenda;
    this.candidato = null;
    this.rendaCandidato = '';
    this.membros = [];

    this.tabela.addEventListener('input', (e) => {
      const campo = e.target;
      if (campo.name === 'renda_candidato') this.rendaCandidato = campo.value;
      if (campo.dataset.indice !== undefined) this.membros[Number(campo.dataset.indice)][campo.dataset.campo] = campo.value;
      this.atualizarResultado();
    });
    this.tabela.addEventListener('change', (e) => {
      const campo = e.target;
      if (campo.dataset.indice !== undefined) this.membros[Number(campo.dataset.indice)][campo.dataset.campo] = campo.value;
    });
    this.tabela.addEventListener('click', (e) => {
      const remover = e.target.closest('[data-remover-membro]');
      if (remover) {
        this.membros.splice(Number(remover.dataset.removerMembro), 1);
        this.renderizar();
      }
      if (e.target.closest('[data-adicionar-membro]')) {
        this.membros.push({ nome: '', cpf: '', dataNascimento: '', parentesco: '', renda: '' });
        this.renderizar();
        const linhas = $$('tbody tr', this.tabela);
        $('input', linhas[linhas.length - 1]).focus();
      }
    });
  }

  definirCandidato(candidato) {
    this.candidato = candidato;
    this.renderizar();
  }

  rendas() {
    return [lerMoeda(this.rendaCandidato), ...this.membros.map((m) => lerMoeda(m.renda))];
  }

  totais() {
    return calcularRendaPerCapita(this.rendas());
  }

  renderizar() {
    const c = this.candidato;
    const opcoesParentesco = (atual) => '<option value="">Selecione</option>' + PARENTESCOS
      .map((p) => `<option ${p === atual ? 'selected' : ''}>${escaparHtml(p)}</option>`).join('');
    const linhasMembros = this.membros.map((m, i) => `<tr>
      <td><input type="text" name="membro_${i}_nome" aria-label="Nome do membro ${i + 1}" data-indice="${i}" data-campo="nome" value="${escaparHtml(m.nome)}" required></td>
      <td><input type="text" name="membro_${i}_cpf" aria-label="CPF do membro ${i + 1}" data-indice="${i}" data-campo="cpf" data-mascara="cpf" inputmode="numeric" value="${escaparHtml(m.cpf)}" required minlength="14">
          <button type="button" class="botao-painel" data-gerar-cpf="membro_${i}_cpf">Gerar fictício</button></td>
      <td><input type="date" name="membro_${i}_nascimento" aria-label="Data de nascimento do membro ${i + 1}" data-indice="${i}" data-campo="dataNascimento" value="${escaparHtml(m.dataNascimento)}" required></td>
      <td><select name="membro_${i}_parentesco" aria-label="Parentesco do membro ${i + 1}" data-indice="${i}" data-campo="parentesco" required>${opcoesParentesco(m.parentesco)}</select></td>
      <td><input type="text" name="membro_${i}_renda" aria-label="Renda bruta mensal do membro ${i + 1}" data-indice="${i}" data-campo="renda" data-mascara="moeda" inputmode="numeric" placeholder="0,00" value="${escaparHtml(m.renda)}" required></td>
      <td><button type="button" class="botao perigo pequeno" data-remover-membro="${i}" aria-label="Remover membro ${i + 1}">Remover</button></td>
    </tr>`).join('');

    this.tabela.innerHTML = `<div class="tabela-rolagem"><table class="tabela-grupo">
      <thead><tr><th>Nome completo</th><th>CPF</th><th>Data de nascimento</th><th>Parentesco</th><th>Renda bruta mensal (R$)</th><th></th></tr></thead>
      <tbody>
        <tr>
          <td><strong>${escaparHtml(c ? c.nome : '')}</strong></td>
          <td>${escaparHtml(c ? c.cpf : '')}</td>
          <td>${c ? Formatar.data(c.dataNascimento) : ''}</td>
          <td>Candidato(a)</td>
          <td><input type="text" name="renda_candidato" aria-label="Sua renda bruta mensal" data-mascara="moeda" inputmode="numeric" placeholder="0,00" value="${escaparHtml(this.rendaCandidato)}" required></td>
          <td></td>
        </tr>
        ${linhasMembros}
      </tbody></table></div>
      <button type="button" class="botao secundario pequeno" data-adicionar-membro>+ Adicionar membro do grupo familiar</button>`;
    this.atualizarResultado();
  }

  atualizarResultado() {
    const t = this.totais();
    const salarios = t.emSalarios.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
    this.resultado.innerHTML = `Renda familiar bruta mensal: <strong>${Formatar.moeda(t.total)}</strong> ·
      Pessoas no grupo: <strong>${t.pessoas}</strong> ·
      Renda per capita: <strong>${Formatar.moeda(t.perCapita)}</strong> (${salarios} salário mínimo)
      ${this.descreverRenda ? `<div>${this.descreverRenda(t)}</div>` : ''}`;
  }

  preencherFicticio(rendaCandidato, membros) {
    this.rendaCandidato = MASCARAS.moeda(Math.round(rendaCandidato * 100));
    this.membros = membros.map((m) => ({
      nome: m.nome, cpf: gerarCpfFicticio(), dataNascimento: m.dataNascimento, parentesco: m.parentesco,
      renda: MASCARAS.moeda(Math.round(m.renda * 100))
    }));
    this.renderizar();
  }

  // Linhas para a ficha/comprovante.
  resumo() {
    const linhas = [[`${this.candidato.nome} (candidato/a)`, Formatar.moeda(lerMoeda(this.rendaCandidato))]]
      .concat(this.membros.map((m) => [`${m.nome} (${m.parentesco})`, Formatar.moeda(lerMoeda(m.renda))]));
    const t = this.totais();
    linhas.push(['Renda per capita', `${Formatar.moeda(t.perCapita)} (${t.pessoas} pessoas)`]);
    return linhas;
  }
}

/* =========================================================
   Painel do apresentador: tamanho da fonte, dicas e
   preenchimento automático com dados fictícios.
   ========================================================= */
function iniciarPainelApresentador({ aoPreencher } = {}) {
  const painel = $('#painel-apresentador');
  if (!painel) return;
  let tamanho = 18;

  painel.addEventListener('click', (e) => {
    const botao = e.target.closest('button');
    if (!botao) return;
    const acao = botao.dataset.painel;
    if (acao === 'menor' || acao === 'maior') {
      tamanho = Math.min(28, Math.max(14, tamanho + (acao === 'maior' ? 2 : -2)));
      document.documentElement.style.setProperty('--fonte-base', `${tamanho}px`);
    }
    if (acao === 'dicas') {
      const ligado = document.body.classList.toggle('mostrar-dicas');
      botao.setAttribute('aria-pressed', String(ligado));
    }
    if (acao === 'preencher' && aoPreencher) aoPreencher();
  });
}

/* ---------- Botões "Gerar CPF fictício" (atributo data-gerar-cpf="nome_do_campo") ---------- */
document.addEventListener('click', (e) => {
  const botao = e.target.closest('[data-gerar-cpf]');
  if (botao) definirValor(botao.dataset.gerarCpf, gerarCpfFicticio());
});

/* ---------- Validação do CPF digitado no login simulado ---------- */
function validarLoginCpf(etapa) {
  const cpf = lerValor('login_cpf', etapa);
  if (!cpf) return []; // campo vazio já é avisado como obrigatório
  return cpfValido(cpf) ? [] : ['CPF: informe um CPF válido (use o botão "Gerar CPF fictício").'];
}

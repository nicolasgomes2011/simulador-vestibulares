# Simulador de Vestibulares

Simulador educativo das inscrições no **Sisu**, no **Prouni** e no **Fies**.

Faz parte do projeto de extensão *Apoio à Inscrição em Processos Seletivos para a Educação
Superior e Bolsas*, do IFRS Campus Rolante, em parceria com o Rotary Club de Santo Antônio
da Patrulha.

O site é projetado no telão durante as palestras e navegado passo a passo. Depois do
evento, ele fica disponível como material de apoio.

## Cuidados (requisitos do projeto)

- **Aviso fixo** em todas as páginas: "Simulador educativo, não é o site oficial".
- **Dados 100% fictícios**: candidata, notas do Enem, instituições, cursos, vagas e notas de corte.
- **Nenhum dado é coletado**: não há servidor, banco de dados, `localStorage` ou cookies.
  Tudo fica só na memória da página e é apagado ao recarregar.
- **Sem campo de senha** no login gov.br ilustrativo, para não ensinar a digitar a senha fora do site oficial.
- Identidade visual própria, sem logotipos ou cores do governo.

## Como usar

Abra o arquivo `index.html` no navegador (duplo clique). Não precisa instalar nada.

Para servir pela rede local (opcional):

```bash
python -m http.server 8080
```

e acesse `http://localhost:8080`.

### Painel do apresentador

No topo de cada simulador:

- **Preencher com dados fictícios**: preenche a etapa atual com os dados de exemplo.
- **Dicas**: mostra ou esconde as explicações em linguagem simples (começam escondidas).
- **A− / A+**: diminui ou aumenta a fonte para o telão.

## Etapas de cada simulador

| Sisu | Prouni | Fies |
|------|--------|------|
| Acesso gov.br | Acesso gov.br | Acesso gov.br (Fies Seleção) |
| Dados de cadastro (contato, nome social, endereço) | Dados pessoais, contato e endereço | Dados pessoais, contato e endereço |
| Questionário socioeconômico (origem escolar, cor/etnia, quilombola, deficiência, renda) | Perfil e formação escolar (raça/cor, deficiência, professor da rede pública, tipo de escola) | Cor, etnia e ensino médio |
| Modalidades de concorrência (AC, LB_*, LI_*) | Grupo familiar e renda de cada membro | Grupo familiar e renda mensal bruta |
| Até 2 opções de curso | Até 2 opções, tipo de bolsa e modalidade | Fies Social (CadÚnico/NIS) e cotas |
| Conferência e comprovante | Ficha de inscrição e comprovante | Até 3 opções de curso |
| Classificação parcial, resultado e lista de espera | Resultado da 1ª chamada e lista de espera | Conferência, comprovante e resultado |

## Estrutura

```
index.html        Página inicial
sisu.html         Simulador Sisu
prouni.html       Simulador Prouni
fies.html         Simulador Fies
css/style.css     Estilos (pensados para projeção)
js/dados.js       Dados fictícios e valores da edição (salário mínimo, edições do Enem, cursos)
js/comum.js       Funções compartilhadas: etapas, validação, máscaras, CPF, grupo familiar
js/sisu.js        Regras e telas do Sisu
js/prouni.js      Regras e telas do Prouni
js/fies.js        Regras e telas do Fies
```

Para atualizar para uma nova edição, altere principalmente `js/dados.js`.

## Fontes

Os campos e as etapas seguem as orientações públicas do MEC para a edição de 2026:

- Sisu: perguntas frequentes do Sisu e passo a passo do Sisu+ (gov.br/mec).
- Prouni: passo a passo de inscrição, 1º e 2º semestres de 2026 (gov.br/mec); Lei nº 11.096/2005 e Lei nº 14.350/2022.
- Fies: passo a passo de inscrição, 2º semestre de 2026 (gov.br/mec); Lei nº 10.260/2001.
- Lei nº 12.711/2012, atualizada pela Lei nº 14.723/2023 (modalidades de cotas).

**Limite conhecido:** os formulários oficiais só aparecem depois do login gov.br e o MEC não
publica todos os rótulos de tela. Alguns textos foram escritos a partir das descrições
oficiais. Antes de cada palestra, vale comparar com capturas de tela ou vídeos oficiais da
edição vigente e ajustar os rótulos nos arquivos `.html`.

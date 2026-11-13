# Simulador de Vestibulares

Simulador educativo das inscrições no **Enem**, no **Sisu**, no **Prouni** e no **Fies**.

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

**Enem** (na ordem do item 5.2 do edital): acesso gov.br, isenção da taxa (e justificativa de
ausência), dados pessoais, endereço residencial e contato, atendimento especializado e tratamento
pelo nome social, língua estrangeira, situação do ensino médio (treineiro e certificação), local
de prova, questionário socioeconômico, conferência, comprovante e pagamento da taxa (GRU simulada).

| Sisu | Prouni | Fies |
|------|--------|------|
| Acesso gov.br | Acesso gov.br | Acesso gov.br (FiesSeleção) |
| Dados de cadastro (contato, nome social, endereço) | Dados pessoais, contato e endereço | Dados pessoais e e-mail |
| Questionário socioeconômico (origem escolar, cor/etnia, quilombola, deficiência, renda) | Perfil e formação escolar (raça/cor, deficiência, professor da rede pública, tipo de escola) | Perfil (etnia/cor, quilombola, deficiência, ensino superior) e modalidade |
| Modalidades de concorrência (AC, LB_*, LI_*) | Grupo familiar e renda de cada membro | Grupo familiar (CPF a partir de 14 anos) e renda |
| Até 2 opções de curso | Até 2 opções, tipo de bolsa e modalidade | Tipo de vaga (Fies Social) e até 3 opções |
| Conferência e comprovante | Ficha de inscrição e comprovante | Conferência e comprovante |
| Classificação parcial, resultado e lista de espera | Resultado da 1ª chamada e lista de espera | Resultado e lista de espera |

## Estrutura

```
index.html        Página inicial
enem.html         Simulador Enem
sisu.html         Simulador Sisu
prouni.html       Simulador Prouni
fies.html         Simulador Fies
css/style.css     Estilos (pensados para projeção)
js/dados.js       Dados fictícios e valores da edição (salário mínimo, edições do Enem, cursos)
js/comum.js       Funções compartilhadas: etapas, validação, máscaras, CPF, grupo familiar
js/enem.js        Regras e telas do Enem (taxa, datas, escolas fictícias, questionário)
js/sisu.js        Regras e telas do Sisu
js/prouni.js      Regras e telas do Prouni
js/fies.js        Regras e telas do Fies
```

Para atualizar para uma nova edição, altere principalmente `js/dados.js`.

## Fontes

Os campos e as etapas seguem as orientações públicas do MEC e do Inep para a edição de 2026:

- Enem: Edital Inep nº 64, de 21 de maio de 2026 (itens 4, 5, 6, 7 e 16) e "Saiba como se inscrever no Enem 2026" (gov.br/inep).
- Sisu: Edital SESu/MEC nº 29, de 22 de dezembro de 2025, e perguntas frequentes do Sisu (gov.br/mec).
- Prouni: Edital SESu/MEC nº 51, de 30 de junho de 2026; Lei nº 11.096/2005 e Lei nº 14.350/2022.
- Fies: Edital SESu/MEC nº 52, de 30 de junho de 2026; Lei nº 10.260/2001.
- Lei nº 12.711/2012, atualizada pela Lei nº 14.723/2023 (modalidades de cotas).

**Limite conhecido:** os editais definem quais informações são pedidas, mas os rótulos exatos
das telas só aparecem depois do login gov.br. Alguns textos foram escritos a partir dos editais.
No Fies, a consulta ao CadÚnico é automática pelo CPF; o simulador usa a renda declarada no grupo
familiar para representar esse resultado.

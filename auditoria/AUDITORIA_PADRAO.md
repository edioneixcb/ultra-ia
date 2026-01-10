# PROTOCOLO UNIVERSAL DE AUDITORIA DE SISTEMAS

> **Protocolo Normativo para Auditoria Exaustiva de Sistemas de Software**  
> **Aplicavel a:** Qualquer sistema de software, qualquer tecnologia, qualquer arquitetura  
> **Objetivo:** Identificar e documentar todos os erros, falhas, debitos tecnicos e desvios de padroes  
> **Execucao:** Otimizado para agentes de IA com supervisao humana

---

## ÍNDICE

1. [Definições e Invariantes](#1-definições-e-invariantes)
2. [Baseline de Ambiente e Matriz de Alvos](#2-baseline-de-ambiente-e-matriz-de-alvos)
3. [Modelo de Cobertura e Validação Matemática](#3-modelo-de-cobertura-e-validação-matemática)
4. [Fluxo de Execução Agent-first](#4-fluxo-de-execução-agent-first)
5. [Matriz Normativa de Checks](#5-matriz-normativa-de-checks)
6. [Checkpoints Obrigatórios](#6-checkpoints-obrigatórios)
7. [Meta-validação](#7-meta-validação)
8. [Apêndice A: Implementações de Referência](#apêndice-a-implementações-de-referência)

---

## 1. DEFINIÇÕES E INVARIANTES

### 1.1 Terminologia Fundamental

| Termo                   | Definição                                                                                           |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| **Erro**                | Qualquer desvio do comportamento esperado, padrão estabelecido ou requisito funcional/não-funcional |
| **Falha**               | Manifestação observável de um erro em runtime ou durante execução de processos                      |
| **Check**               | Verificação individual que produz evidência verificável sobre um aspecto do sistema                 |
| **Alvo**                | Ambiente, plataforma ou contexto específico onde o sistema é executado ou construído                |
| **Baseline**            | Estado documentado do ambiente e dependências externas no início da auditoria                       |
| **Evidência**           | Artefato verificável (log, arquivo, saída de comando, código) que comprova o resultado de um check  |
| **Checkpoint**          | Ponto obrigatório de validação e reporte durante a execução da auditoria                            |
| **Cobertura**           | Medida formal da proporção de classes de falha cobertas por checks aplicáveis                       |
| **N/A (Não Aplicável)** | Check que não se aplica ao contexto do sistema auditado, com justificativa e evidência              |

### 1.2 Princípios Invioláveis

```
╔════════════════════════════════════════════════════════════════════╗
║  ZERO SUPOSIÇÕES                                                  ║
║     Toda afirmação requer evidência verificável                   ║
╠════════════════════════════════════════════════════════════════════╣
║  ZERO OMISSÕES                                                    ║
║     Todo erro encontrado DEVE ser documentado                     ║
╠════════════════════════════════════════════════════════════════════╣
║  N/A REQUER JUSTIFICATIVA                                          ║
║     Item não aplicável deve ter motivo + evidência documentados   ║
╠════════════════════════════════════════════════════════════════════╣
║  CHAIN-OF-THOUGHT                                                 ║
║     Documentar raciocínio: Observação → Hipótese → Verificação   ║
╠════════════════════════════════════════════════════════════════════╣
║  RASTREABILIDADE                                                  ║
║     Cada check deve referenciar erro/lição que o motivou         ║
╠════════════════════════════════════════════════════════════════════╣
║  REPRODUTIBILIDADE                                                ║
║     Evidências devem permitir reprodução independente            ║
╚════════════════════════════════════════════════════════════════════╝
```

### 1.3 Níveis de Severidade

| Nível          | Descrição                                                | Critério                                                         | Bloqueia Deploy? |
| -------------- | -------------------------------------------------------- | ---------------------------------------------------------------- | ---------------- |
| **BLOQUEADOR** | Sistema não funciona ou não pode ser construído          | Falha impede execução ou build                                   | SIM              |
| **CRÍTICO**    | Alto risco de falha em produção ou violação de segurança | Pode causar perda de dados, indisponibilidade ou vulnerabilidade | SIM              |
| **ALTO**       | Pode causar problemas significativos                     | Impacta funcionalidade principal ou experiência do usuário       | NÃO              |
| **MÉDIO**      | Melhoria necessária                                      | Impacta qualidade, manutenibilidade ou performance               | NÃO              |
| **BAIXO**      | Refinamento                                              | Impacto mínimo ou cosmético                                      | NÃO              |

### 1.4 Regras de Aplicabilidade (N/A)

Um check pode ser marcado como **N/A** somente quando:

1. **Tecnologia não utilizada**: O sistema não usa a tecnologia ou ferramenta requerida pelo check
2. **Funcionalidade não implementada**: A funcionalidade verificada não existe e não é requisito
3. **Contexto não se aplica**: O contexto (plataforma, ambiente, arquitetura) não se aplica ao sistema

**NUNCA** marcar N/A quando:

- O check deveria se aplicar mas não está implementado (isso é um erro)
- Não há certeza sobre aplicabilidade (investigar primeiro)
- É difícil verificar (encontrar forma de verificar)
- O sistema deveria ter a funcionalidade (documentar como débito técnico)

### 1.5 Niveis de Evidencia por Severidade

Cada nivel de severidade exige um nivel minimo de evidencia para validacao do check:

| Severidade | Nivel de Evidencia | Requisito                                                     |
| ---------- | ------------------ | ------------------------------------------------------------- |
| BLOQUEADOR | Completa           | Output de comando + screenshot/log + verificacao independente |
| CRITICO    | Completa           | Output de comando + log verificavel                           |
| ALTO       | Padrao             | Output de comando ou declaracao com referencia                |
| MEDIO      | Resumida           | Declaracao com amostragem verificavel                         |
| BAIXO      | Minima             | Declaracao do executor                                        |

**Regra:** Evidencia de nivel inferior ao requerido invalida o check.

**Exemplos de Evidencia por Nivel:**

- **Completa:** `npm audit --json > audit.json` + conteudo do arquivo + revisor confirma
- **Padrao:** `npm test` output mostrando resultado
- **Resumida:** "Verificados 15 arquivos, amostra de 3 validada manualmente"
- **Minima:** "Executor confirma que verificou visualmente"

### 1.6 Formato Obrigatorio para N/A

```
+---------------------------------------------------------------------+
| [N/A] [ID-CHECK]: [Nome do Check]                                   |
+---------------------------------------------------------------------+
| MOTIVO: [Tecnologia nao utilizada / Funcionalidade nao existe /     |
|         Contexto nao se aplica / Outro: _______________]            |
+---------------------------------------------------------------------+
| EVIDENCIA: [Como voce sabe que nao se aplica]                       |
|   Exemplo: "Manifesto de dependencias nao contem [tecnologia]"      |
|   Exemplo: "Estrutura de diretorios nao contem [componente]"        |
|   Exemplo: "Sistema nao possui funcionalidade de [recurso]"         |
+---------------------------------------------------------------------+
| VERIFICADO POR: [Auto-deteccao / Analise manual / Checkpoint]       |
| DATA: [YYYY-MM-DD HH:MM]                                            |
+---------------------------------------------------------------------+
```

### 1.7 Classificacao de Decisoes Durante Execucao

Decisoes tomadas durante execucao devem ser classificadas por criterios objetivos:

| Nivel           | Criterio Objetivo                                                       | Acao Requerida             |
| --------------- | ----------------------------------------------------------------------- | -------------------------- |
| 1 - Operacional | Afeta 1 arquivo ou menos E sem mudanca de comportamento                 | Executar e documentar      |
| 2 - Tecnica     | Afeta 2-5 arquivos OU escolha entre alternativas equivalentes           | Informar e prosseguir      |
| 3 - Critica     | Afeta mais de 5 arquivos OU muda comportamento OU afeta seguranca/dados | Parar e aguardar aprovacao |

**Exemplos por Nivel:**

- **Nivel 1:** Remover import nao utilizado, corrigir typo, ajustar indentacao
- **Nivel 2:** Escolher entre duas bibliotecas equivalentes, refatorar funcao isolada
- **Nivel 3:** Remover funcionalidade, mudar arquitetura, alterar schema de banco

**Regra:** Decisao classificada incorretamente invalida a execucao.

### 1.8 Regra dos 3E (Especificacao-Execucao-Evidencia)

Todo check deve ter tres componentes obrigatorios para ser considerado valido:

| Componente        | Definicao                             | Exemplo                               |
| ----------------- | ------------------------------------- | ------------------------------------- |
| **Especificacao** | O que EXATAMENTE deve ser verificado  | "Arquivo X deve existir no caminho Y" |
| **Execucao**      | COMO verificar (comando/procedimento) | "Executar: Test-Path Y/X"             |
| **Evidencia**     | PROVA verificavel por terceiros       | "Output: True"                        |

**Regra:** Check sem qualquer componente dos 3E e invalido e deve ser refeito.

**Aplicacao Pratica:**

```
CHECK: VER-01 - Artefatos declarados existem
+---------------------------------------------------------------------+
| ESPECIFICACAO: Arquivo tests/e2e/.env.example deve existir          |
| EXECUCAO: Test-Path tests/e2e/.env.example                          |
| EVIDENCIA: True                                                      |
| RESULTADO: PASSOU                                                    |
+---------------------------------------------------------------------+
```

---

## 2. BASELINE DE AMBIENTE E MATRIZ DE ALVOS

### 2.1 Objetivo

Estabelecer o estado documentado do ambiente e definir os alvos onde o sistema será auditado. Esta fase é **obrigatória** e deve ser executada antes de qualquer verificação técnica.

### 2.2 Manifesto de Baseline de Ambiente

O manifesto deve documentar:

#### 2.2.1 Ambiente de Execução

- **Sistema operacional**: Versão, arquitetura, variantes
- **Runtime/Interpretador**: Versão, variantes, configurações críticas
- **Ferramentas de build**: Versões, configurações, variantes
- **Ambiente de desenvolvimento**: IDE, extensões críticas, configurações

#### 2.2.2 Dependências Externas

- **Serviços de terceiros**: APIs, bancos de dados, serviços de autenticação
- **Status operacional**: Disponibilidade, quotas, limites de rate
- **Configurações de rede**: DNS, proxies, firewalls, NAT
- **Armazenamento**: Sistemas de arquivos, bancos de dados, caches

#### 2.2.3 Configurações Críticas

- **Variáveis de ambiente**: Lista completa, valores padrão, fontes
- **Secrets e credenciais**: Localização, método de injeção, rotação
- **Certificados e chaves**: Validade, localização, método de acesso

### 2.3 Matriz de Alvos

A matriz define os ambientes, plataformas e contextos onde o sistema será auditado:

| Alvo   | Descrição      | Ambiente                | Critérios de Bloqueio             |
| ------ | -------------- | ----------------------- | --------------------------------- |
| **T1** | [Nome do alvo] | [Descrição do ambiente] | [Condições que impedem auditoria] |
| **T2** | [Nome do alvo] | [Descrição do ambiente] | [Condições que impedem auditoria] |

**Critérios de Bloqueio Comuns:**

- Ambiente não acessível ou não configurado
- Dependências externas indisponíveis ou sem quota
- Ferramentas de build ausentes ou incompatíveis
- Secrets ou credenciais não configurados

### 2.4 Evidência Mínima de Baseline

O manifesto de baseline deve incluir:

1. **Inventário de tecnologias**: Lista verificável de tecnologias detectadas
2. **Versões documentadas**: Versões exatas de todas as dependências críticas
3. **Configurações capturadas**: Estado de configurações críticas (com secrets mascarados)
4. **Status de dependências externas**: Verificação de disponibilidade e quotas
5. **Pré-condições validadas**: Confirmação de que pré-requisitos estão atendidos

### 2.5 Validação de Baseline

Antes de prosseguir, validar:

- [ ] Todas as tecnologias críticas foram identificadas
- [ ] Versões de dependências foram documentadas
- [ ] Status de dependências externas foi verificado
- [ ] Pré-condições de cada alvo foram validadas
- [ ] Nenhum critério de bloqueio está ativo

**Se qualquer validação falhar, a auditoria deve ser bloqueada até resolução.**

---

## 3. MODELO DE COBERTURA E VALIDAÇÃO MATEMÁTICA

### 3.1 Definição de Universo de Falhas

O universo de falhas **U** é o conjunto de todas as classes de falha possíveis que podem ocorrer no sistema:

```
U = {F₁, F₂, F₃, ..., Fₙ}
```

Onde cada **Fᵢ** representa uma classe de falha distinta (ex: "Erro de sintaxe", "Vulnerabilidade de segurança", "Falha de build", "Erro de runtime").

### 3.2 Mapeamento Check → Classes de Falha

Cada check **Cⱼ** cobre um subconjunto de classes de falha:

```
Cⱼ → {Fᵢ, Fⱼ, Fₖ, ...}
```

Um check pode detectar múltiplas classes de falha, e uma classe de falha pode ser detectada por múltiplos checks.

### 3.3 Cobertura por Alvo

Para cada alvo **Tₖ**, a cobertura **D(C, Tₖ)** é definida como:

```
D(C, Tₖ) = |{Fᵢ ∈ U : Fᵢ é detectável por algum check Cⱼ aplicável a Tₖ}|
```

Onde:

- **C** = conjunto de checks aplicáveis ao alvo Tₖ
- **U** = universo de falhas
- **D(C, Tₖ)** = número de classes de falha cobertas para o alvo Tₖ

### 3.4 Cobertura Total

A cobertura total **D_total** é a união de todas as coberturas por alvo:

```
D_total = ⋃ₖ D(C, Tₖ)
```

### 3.5 Critérios de Aceite

Para considerar a auditoria completa:

1. **Cobertura mínima**: `|D_total| / |U| ≥ 0.95` (95% das classes de falha cobertas)
2. **Cobertura por alvo**: Cada alvo crítico deve ter `D(C, Tₖ) / |U| ≥ 0.90` (90% de cobertura)
3. **Checks aplicáveis executados**: 100% dos checks aplicáveis foram executados
4. **Evidências coletadas**: 100% dos checks executados têm evidência documentada

### 3.6 Cálculo de Score

O score **S** é calculado como:

```
S = (Checks Passando / Checks Aplicáveis) × 100
```

Onde:

- **Checks Passando** = checks com resultado ✅
- **Checks Aplicáveis** = Total de Checks - Checks N/A (com justificativa válida)

**Regras:**

- Checks N/A com justificativa válida não contam no denominador
- Checks N/A sem justificativa contam como falha
- Qualquer check BLOQUEADOR falhando resulta em S = 0
- Meta: S = 100 para aprovação

---

## 4. FLUXO DE EXECUÇÃO AGENT-FIRST

### 4.1 Papéis de Agentes

A auditoria é executada por agentes especializados com responsabilidades distintas:

| Papel          | Responsabilidade                                              | Artefatos Gerados                  |
| -------------- | ------------------------------------------------------------- | ---------------------------------- |
| **Collector**  | Coleta evidências brutas (logs, saídas de comandos, arquivos) | Arquivos de evidência, logs brutos |
| **Normalizer** | Normaliza evidências em formato padronizado                   | Evidências normalizadas, metadados |
| **Deduper**    | Remove duplicatas e consolida erros similares                 | Lista deduplicada de erros         |
| **Classifier** | Classifica erros por categoria e severidade                   | Matriz de erros classificados      |
| **Verifier**   | Valida evidências e verifica consistência                     | Relatório de validação             |
| **Reporter**   | Gera relatórios e roadmaps                                    | Roadmap final, relatórios          |

### 4.2 Cadeia de Evidência

Cada check deve produzir uma cadeia de evidência:

```
Observação → Evidência Bruta → Evidência Normalizada → Classificação → Documentação
```

**Requisitos:**

- Cada etapa deve ser rastreável
- Evidências brutas devem ser preservadas
- Metadados devem incluir timestamp, agente executor, alvo

### 4.3 Artefatos Exigidos

A auditoria deve produzir:

1. **Manifesto de Baseline**: Estado inicial do ambiente (Secao 2)
2. **Matriz de Alvos**: Alvos auditados e status (Secao 2)
3. **Evidencias por Check**: Arquivo ou referencia para cada check executado
4. **Lista de Erros Classificados**: Erros encontrados com categoria e severidade
5. **Relatorio de Cobertura**: Calculo de D(C, Tk) para cada alvo
6. **Roadmap de Correcoes**: Lista priorizada de acoes (maximo 30 palavras por item)
7. **Relatorio de Meta-validacao**: Validacao da propria auditoria (Secao 7)
8. **Matriz de Rastreabilidade**: Mapeamento requisito-artefato-teste-evidencia

#### 4.3.1 Matriz de Rastreabilidade Integrada

Para cada entrega significativa, documentar o mapeamento completo:

| Requisito/Check            | Artefato Produzido          | Teste/Validacao | Evidencia      |
| -------------------------- | --------------------------- | --------------- | -------------- |
| [ID do check ou requisito] | [Arquivo criado/modificado] | [Como validar]  | [Prova fisica] |

**Exemplo de Matriz Preenchida:**

| Requisito/Check              | Artefato Produzido       | Teste/Validacao        | Evidencia                       |
| ---------------------------- | ------------------------ | ---------------------- | ------------------------------- |
| CFG-02 Secrets nao hardcoded | scripts/check-secrets.js | npm run check-secrets  | Output: "0 secrets encontrados" |
| VER-01 Artefato existe       | tests/e2e/.env.example   | Test-Path              | Output: True                    |
| FLX-01 Fluxo completo        | components/SendMenu.tsx  | Teste E2E 17-send-menu | 5/5 testes passando             |

**Regras da Matriz:**

- Cada linha deve ter todos os 4 campos preenchidos
- Artefatos referenciados devem existir fisicamente (validado por VER-01)
- Testes referenciados devem passar (validado por BLD-02)
- Evidencias devem seguir nivel requerido por severidade (Secao 1.5)

### 4.4 Handoffs Entre Agentes

Cada handoff deve incluir:

- **Payload**: Dados ou artefatos transferidos
- **Contrato**: Formato esperado e validacoes
- **Timestamp**: Momento da transferencia
- **Validacao**: Confirmacao de recebimento e integridade

### 4.5 Micro-Checkpoints Integrados

Micro-checkpoints sao pontos de validacao DENTRO de uma fase de execucao, usados para decisoes criticas que nao podem aguardar o proximo checkpoint formal.

#### 4.5.1 Quando Usar Micro-Checkpoint

| Condicao                            | Micro-Checkpoint Obrigatorio      |
| ----------------------------------- | --------------------------------- |
| Decisao Nivel 3 (Secao 1.7)         | SIM - Parar e aguardar aprovacao  |
| Descoberta contradiz plano          | SIM - Reportar e aguardar         |
| Evidencia revela risco nao previsto | SIM - Documentar e escalar        |
| Execucao normal de Niveis 1-2       | NAO - Prosseguir com documentacao |

#### 4.5.2 Agente Responsavel

O **Verifier** (Secao 4.1) e responsavel por:

- Identificar necessidade de micro-checkpoint
- Pausar execucao
- Gerar payload de micro-checkpoint
- Aguardar resolucao antes de prosseguir

#### 4.5.3 Formato de Micro-Checkpoint

| Campo        | Conteudo                              |
| ------------ | ------------------------------------- |
| ID           | MC-[FASE]-[SEQUENCIAL]                |
| Motivo       | Decisao Nivel 3 / Contradicao / Risco |
| Contexto     | O que estava sendo feito              |
| Descoberta   | O que foi encontrado                  |
| Opcoes       | Alternativas disponiveis              |
| Recomendacao | Sugestao do Verifier                  |
| Status       | Pendente / Resolvido                  |

#### 4.5.4 Handoff de Micro-Checkpoint

Micro-checkpoint segue o mesmo formato de handoff (Secao 4.4):

- **Payload**: Formato da tabela acima
- **Contrato**: Resolucao deve incluir decisao + justificativa
- **Timestamp**: Momento da pausa e da resolucao
- **Validacao**: Verifier confirma que pode prosseguir

#### 4.5.5 Exemplo de Micro-Checkpoint

```
+---------------------------------------------------------------------+
| MICRO-CHECKPOINT: MC-IMPL-001                                       |
+---------------------------------------------------------------------+
| MOTIVO: Decisao Nivel 3                                             |
| CONTEXTO: Removendo imports nao utilizados                          |
| DESCOBERTA: Import "X" parece nao usado mas e referenciado          |
|             indiretamente via reflexao                              |
| OPCOES:                                                             |
|   A) Manter import (seguro)                                         |
|   B) Remover e testar (risco)                                       |
|   C) Investigar mais antes de decidir                               |
| RECOMENDACAO: Opcao C - Investigar antes de decidir                 |
| STATUS: Pendente                                                    |
+---------------------------------------------------------------------+
```

---

## 5. MATRIZ NORMATIVA DE CHECKS

### 5.1 Estrutura de um Check

Cada check segue este formato:

```
[ID] [NOME]
├── Severidade: [BLOQUEADOR/CRÍTICO/ALTO/MÉDIO/BAIXO]
├── Aplica-se quando: [Condição de aplicabilidade]
├── Evidência mínima: [Tipo de evidência requerida]
├── Critério de aprovação: [O que significa passar]
├── Classes de falha detectadas: [Lista de classes Fᵢ]
└── Origem: [Referência a erro/lição que motivou]
```

### 5.2 Categorias de Checks

#### 5.2.1 CONFIGURAÇÃO (CFG)

Checks relacionados a configuração do sistema, variáveis de ambiente, arquivos de configuração.

| ID     | Nome                               | Severidade | Aplica-se quando                  | Evidência mínima                    | Critério                                 |
| ------ | ---------------------------------- | ---------- | --------------------------------- | ----------------------------------- | ---------------------------------------- |
| CFG-01 | Build reproduzível                 | BLOQUEADOR | Sistema possui processo de build  | Log de build bem-sucedido           | Build completa sem erros                 |
| CFG-02 | Secrets não hardcoded              | CRÍTICO    | Sempre                            | Análise de código e configuração    | Nenhum secret encontrado em código       |
| CFG-03 | Variáveis de ambiente documentadas | ALTO       | Sistema usa variáveis de ambiente | Lista de variáveis e valores padrão | Todas as variáveis críticas documentadas |
| CFG-04 | Configurações válidas              | CRÍTICO    | Arquivos de configuração existem  | Validação de sintaxe/formato        | Todos os arquivos válidos                |

#### 5.2.2 SEGURANÇA (SEC)

Checks relacionados a autenticação, autorização, proteção de dados, validação de inputs.

| ID     | Nome                       | Severidade | Aplica-se quando                   | Evidência mínima                                   | Critério                              |
| ------ | -------------------------- | ---------- | ---------------------------------- | -------------------------------------------------- | ------------------------------------- |
| SEC-01 | Rotas protegidas           | CRÍTICO    | Sistema possui autenticação        | Análise de código de rotas                         | Rotas sensíveis protegidas            |
| SEC-02 | Inputs validados           | CRÍTICO    | Sistema aceita inputs externos     | Análise de pontos de entrada                       | Validação presente em todos os inputs |
| SEC-03 | Secrets scanning universal | CRÍTICO    | Sempre                             | Relatório de scan (pattern + entropia + histórico) | Nenhum secret detectado               |
| SEC-04 | Autenticação com expiração | ALTO       | Sistema usa tokens de autenticação | Análise de implementação                           | Tokens têm expiração configurada      |

**Secret Scanning Universal (SEC-03):**

O check SEC-03 deve executar três camadas de detecção:

1. **Pattern-based**: Buscar padrões conhecidos (chaves de API, tokens, senhas)
2. **Entropy-based**: Detectar strings com alta entropia que podem ser secrets
3. **VCS History**: Verificar histórico de controle de versão por secrets commitados

Cada camada deve produzir evidência separada.

#### 5.2.3 DEPENDENCIAS (DEP)

Checks relacionados a dependencias externas, vulnerabilidades, compatibilidade.

| ID     | Nome                               | Severidade | Aplica-se quando                        | Evidencia minima                     | Criterio                            |
| ------ | ---------------------------------- | ---------- | --------------------------------------- | ------------------------------------ | ----------------------------------- |
| DEP-01 | Sem vulnerabilidades criticas      | CRITICO    | Sistema usa gerenciador de dependencias | Relatorio de auditoria de seguranca  | 0 vulnerabilidades criticas         |
| DEP-02 | Dependencias atualizadas           | MEDIO      | Sistema usa gerenciador de dependencias | Lista de dependencias desatualizadas | Plano de atualizacao documentado    |
| DEP-03 | Dependencias utilizadas            | ALTO       | Sistema usa gerenciador de dependencias | Analise de uso vs declaracao         | Sem dependencias orfas criticas     |
| DEP-04 | Dependencias declaradas instaladas | BLOQUEADOR | Sistema usa gerenciador de dependencias | Verificacao de instalacao            | 100% das deps declaradas instaladas |

**Classe de Falha Adicional (DEP-04):**

- F_DEP_NAO_INSTALADA: Dependencia declarada em manifesto mas nao instalada

**Origem DEP-04:** Mesclado de VER-04 para evitar duplicacao. Valida que todas as dependencias declaradas estao efetivamente instaladas e disponiveis.

#### 5.2.4 DEPENDENCIAS EXTERNAS E LIMITES OPERACIONAIS (EXT)

Checks relacionados a serviços de terceiros, quotas, limites operacionais, status de APIs externas.

| ID     | Nome                            | Severidade | Aplica-se quando                     | Evidência mínima                              | Critério                                 |
| ------ | ------------------------------- | ---------- | ------------------------------------ | --------------------------------------------- | ---------------------------------------- |
| EXT-01 | Quotas e limites documentados   | ALTO       | Sistema usa serviços externos        | Documentação de quotas e limites              | Todos os serviços críticos documentados  |
| EXT-02 | Tratamento de indisponibilidade | ALTO       | Sistema depende de serviços externos | Análise de tratamento de erros                | Fallback ou tratamento de erro presente  |
| EXT-03 | Rate limiting respeitado        | MÉDIO      | Sistema faz chamadas a APIs externas | Análise de implementação                      | Rate limiting implementado ou respeitado |
| EXT-04 | Status de serviços verificados  | MÉDIO      | Sistema depende de serviços externos | Verificação de status no momento da auditoria | Serviços críticos operacionais           |

#### 5.2.5 BUILD E TESTES (BLD)

Checks relacionados a processo de build, testes automatizados, cobertura.

| ID     | Nome                  | Severidade | Aplica-se quando                    | Evidência mínima                | Critério                         |
| ------ | --------------------- | ---------- | ----------------------------------- | ------------------------------- | -------------------------------- |
| BLD-01 | Build Contract válido | BLOQUEADOR | Sistema possui processo de build    | Build executado com sucesso     | Build completa sem erros         |
| BLD-02 | Testes passando       | CRÍTICO    | Sistema possui testes automatizados | Relatório de execução de testes | 100% dos testes passando         |
| BLD-03 | Cobertura mínima      | MÉDIO      | Sistema possui testes automatizados | Relatório de cobertura          | Cobertura ≥ 70% ou justificativa |

**Build Contract:**

O Build Contract define o processo de build para cada alvo:

- **Comando/Procedimento**: Como executar o build
- **Pré-condições**: Dependências e configurações necessárias
- **Saída esperada**: Artefatos gerados
- **Validação**: Como verificar sucesso

#### 5.2.6 RUNTIME (RTM)

Checks relacionados a comportamento em runtime, tratamento de erros, resiliência.

| ID     | Nome                  | Severidade | Aplica-se quando                  | Evidência mínima                    | Critério                                 |
| ------ | --------------------- | ---------- | --------------------------------- | ----------------------------------- | ---------------------------------------- |
| RTM-01 | Tratamento de erros   | ALTO       | Sempre                            | Análise de tratamento de exceções   | Erros críticos tratados                  |
| RTM-02 | Timeouts configurados | MÉDIO      | Sistema faz operações assíncronas | Análise de implementação            | Timeouts presentes em operações críticas |
| RTM-03 | Logging adequado      | MÉDIO      | Sempre                            | Análise de implementação de logging | Logging presente em pontos críticos      |

#### 5.2.7 SINTAXE E CODIGO (SYN)

Checks relacionados a erros de sintaxe, codigo morto, padroes de codigo.

| ID     | Nome                  | Severidade | Aplica-se quando                       | Evidencia minima                | Criterio                 |
| ------ | --------------------- | ---------- | -------------------------------------- | ------------------------------- | ------------------------ |
| SYN-01 | Sintaxe valida        | BLOQUEADOR | Sistema usa linguagem tipada/compilada | Relatorio de compilacao         | 0 erros de sintaxe       |
| SYN-02 | Codigo morto removido | MEDIO      | Sempre                                 | Analise de codigo nao utilizado | Sem codigo morto critico |
| SYN-03 | Padroes de codigo     | BAIXO      | Sistema possui linter/formatter        | Relatorio de linting            | Padroes consistentes     |

#### 5.2.8 VERIFICACAO FISICA (VER)

Checks que validam existencia fisica de artefatos declarados em documentacao ou planos.

| ID     | Nome                                           | Severidade | Aplica-se quando                                | Evidencia minima                                 | Criterio                                         |
| ------ | ---------------------------------------------- | ---------- | ----------------------------------------------- | ------------------------------------------------ | ------------------------------------------------ |
| VER-01 | Artefatos declarados existem                   | CRITICO    | Documentacao/plano menciona criacao de arquivos | Output de comando de existencia                  | 100% dos arquivos declarados existem             |
| VER-02 | APIs/metodos validados na documentacao oficial | CRITICO    | Codigo usa APIs/bibliotecas externas            | Link para documentacao + versao                  | Todas as APIs usadas existem na versao declarada |
| VER-03 | Configuracoes referenciadas preenchidas        | ALTO       | Sistema referencia configuracao externa         | Verificacao de valores (mascarados se sensiveis) | Configs criticas tem valores validos             |

**Classes de Falha Detectadas:**

- F_ARTEFATO_INEXISTENTE: Arquivo declarado nao existe
- F_API_INEXISTENTE: API/metodo usado nao existe na versao
- F_CONFIG_VAZIA: Configuracao critica sem valor

**Origem:** Falhas identificadas em auditorias anteriores onde artefatos foram documentados como criados mas nao existiam fisicamente.

#### 5.2.9 FLUXO E COMPLETUDE (FLX)

Checks que validam completude de fluxos ponta-a-ponta entre componentes do sistema.

| ID     | Nome                             | Severidade | Aplica-se quando                             | Evidencia minima                     | Criterio                           |
| ------ | -------------------------------- | ---------- | -------------------------------------------- | ------------------------------------ | ---------------------------------- |
| FLX-01 | Fluxo ponta-a-ponta completo     | CRITICO    | Funcionalidade envolve multiplas camadas     | Diagrama ou lista de conexoes        | Sem gaps no fluxo                  |
| FLX-02 | Handlers conectados a triggers   | ALTO       | Sistema possui event handlers                | Analise de bindings                  | Todos os handlers sao acionaveis   |
| FLX-03 | Camadas integradas               | ALTO       | Sistema possui multiplas camadas (UI/API/DB) | Analise de chamadas entre camadas    | Todas as camadas se comunicam      |
| FLX-04 | Funcionalidades novas tem testes | ALTO       | Nova funcionalidade implementada             | Mapeamento funcionalidade para teste | Cada funcionalidade nova tem teste |

**Classes de Falha Detectadas:**

- F_FLUXO_INCOMPLETO: Caminho interrompido entre componentes
- F_HANDLER_ORFAO: Handler definido mas nunca chamado
- F_CAMADA_DESCONECTADA: Camada nao integrada com adjacentes
- F_SEM_TESTE: Funcionalidade nova sem cobertura de teste

**Origem:** Falhas onde componentes foram criados mas nao conectados ao sistema.

**Nota sobre FLX-03:** Reformulado para "Camadas integradas" para universalidade. Aplica-se a qualquer arquitetura em camadas (UI/API/DB, Frontend/Backend, Client/Server, etc).

#### 5.2.10 CONSISTENCIA (CON)

Checks que validam aderencia a padroes ja estabelecidos no sistema.

| ID     | Nome                      | Severidade | Aplica-se quando                     | Evidencia minima                 | Criterio                               |
| ------ | ------------------------- | ---------- | ------------------------------------ | -------------------------------- | -------------------------------------- |
| CON-01 | Nomenclatura consistente  | MEDIO      | Sistema tem convencoes estabelecidas | Comparacao com codigo existente  | Novos elementos seguem convencao       |
| CON-02 | Arquitetura respeitada    | ALTO       | Sistema tem arquitetura definida     | Analise de localizacao/estrutura | Codigo no local correto da arquitetura |
| CON-03 | Estilo de codigo uniforme | BAIXO      | Sistema tem codigo existente         | Comparacao com codigo similar    | Estilo consistente com existente       |

**Classes de Falha Detectadas:**

- F_NOMENCLATURA_INCONSISTENTE: Nome nao segue padrao estabelecido
- F_ARQUITETURA_VIOLADA: Codigo em camada/local errado
- F_ESTILO_DIVERGENTE: Estilo diferente do padrao existente

**Origem:** Falhas onde implementacoes usavam convencoes diferentes do codigo existente.

#### 5.2.11 CHECKS PREVENTIVOS (PRE)

Checks executados ANTES de iniciar implementacao. Integram com Checkpoint 2 (Validacao Preventiva).

| ID     | Nome                                 | Severidade | Aplica-se quando                             | Evidencia minima                         | Criterio                              |
| ------ | ------------------------------------ | ---------- | -------------------------------------------- | ---------------------------------------- | ------------------------------------- |
| PRE-01 | API/biblioteca validada antes de uso | CRITICO    | Plano inclui uso de API externa              | Link para documentacao oficial da versao | API existe e comportamento confirmado |
| PRE-02 | Impacto de mudanca analisado         | ALTO       | Plano inclui modificacao de codigo existente | Lista de dependentes/afetados            | Impacto mapeado e aceito              |
| PRE-03 | Dependencias identificadas           | ALTO       | Nova funcionalidade sera implementada        | Lista de dependencias tecnicas           | Todas as deps disponiveis             |
| PRE-04 | Requisitos implicitos extraidos      | MEDIO      | Requisito explicito recebido                 | Lista de requisitos derivados            | Requisitos implicitos documentados    |

**Classes de Falha Detectadas:**

- F_API_NAO_VALIDADA: API usada sem confirmar existencia
- F_IMPACTO_NAO_ANALISADO: Mudanca sem analise de dependentes
- F_DEP_NAO_IDENTIFICADA: Dependencia descoberta durante implementacao
- F_REQ_IMPLICITO_PERDIDO: Requisito implicito nao capturado

**Origem:** Falhas onde APIs foram usadas sem validar existencia, ou mudancas quebraram dependentes.

**Momento de Execucao:** Apos Checkpoint 1 (Scoping), antes de qualquer implementacao.

**Agente Responsavel:** Verifier executa checks PRE como pre-condicao para Checkpoint 2.

### 5.3 Aplicabilidade Universal

Cada check deve ser definido de forma **agnóstica de tecnologia**, especificando:

- **O que verificar** (não como verificar)
- **Evidência mínima requerida** (não comando específico)
- **Critério de aprovação** (não saída específica)

Comandos e procedimentos específicos ficam no **Apêndice A** (não normativo).

---

## 6. CHECKPOINTS OBRIGATORIOS

### 6.1 Objetivo

Checkpoints garantem que a auditoria nao omite etapas criticas e que evidencias sao coletadas em momentos estrategicos. A v2.0 expande de 3 para 5 checkpoints para maior controle.

### 6.2 Checkpoint 1: Scoping e Baseline

**Momento:** Antes de iniciar verificacoes tecnicas

**Payload Minimo:**

- Manifesto de baseline completo (Secao 2.2)
- Matriz de alvos preenchida (Secao 2.3)
- Lista de checks aplicaveis vs nao aplicaveis
- Validacao de pre-condicoes

**Criterio de Aprovacao:**

- Baseline documentado e validado
- Nenhum criterio de bloqueio ativo
- Lista de checks aplicaveis gerada

### 6.3 Checkpoint 2: Validacao Preventiva (NOVO v2.0)

**Momento:** Apos Checkpoint 1, antes de iniciar implementacao

**Payload Minimo:**

- Checks PRE-01 a PRE-04 executados para cada item do plano
- APIs/bibliotecas validadas na documentacao oficial
- Analise de impacto para modificacoes
- Dependencias confirmadas disponiveis
- Requisitos implicitos documentados

**Criterio de Aprovacao:**

- 100% dos checks PRE aplicaveis passando
- Nenhuma API/biblioteca nao validada
- Todos os impactos mapeados e aceitos

**Agente Responsavel:** Verifier

### 6.4 Checkpoint 3: Execucao Tecnica

**Momento:** Apos execucao de todas as fases tecnicas (checks aplicaveis)

**Payload Minimo:**

- Evidencias coletadas para cada check executado
- Lista de erros encontrados (deduplicada)
- Calculo de cobertura D(C, Tk) para cada alvo
- Score calculado

**Criterio de Aprovacao:**

- 100% dos checks aplicaveis executados
- Evidencias coletadas para todos os checks
- Cobertura minima atingida (Secao 3.5)

### 6.5 Checkpoint 4: Verificacao Fisica (NOVO v2.0)

**Momento:** Apos implementacao, antes de validacao final

**Payload Minimo:**

- Checks VER-01 a VER-03 executados
- Checks FLX-01 a FLX-04 executados
- Checks CON-01 a CON-03 executados
- Matriz de Rastreabilidade preenchida (Secao 4.3.1)

**Criterio de Aprovacao:**

- 100% dos artefatos declarados existem
- 100% dos fluxos completos (sem gaps)
- Consistencia com padroes existentes validada
- Matriz de Rastreabilidade completa

**Agente Responsavel:** Verifier

### 6.6 Checkpoint 5: Pre-entrega

**Momento:** Antes de gerar roadmap final

**Payload Minimo:**

- Relatorio de meta-validacao (Secao 7)
- Roadmap de correcoes gerado
- Score final calculado
- Todos os N/A justificados
- Anti-padroes verificados (Secao 8)

**Criterio de Aprovacao:**

- Meta-validacao aprovada
- Roadmap completo e priorizado
- Score documentado
- Nenhum anti-padrao detectado ou todos tratados

### 6.7 Formato de Checkpoint

```
+---------------------------------------------------------------------+
| CHECKPOINT [N]: [Nome]                                              |
+---------------------------------------------------------------------+
| DATA/HORA: [YYYY-MM-DD HH:MM]                                       |
| EXECUTADO POR: [Agente/Identificador]                               |
+---------------------------------------------------------------------+
| PAYLOAD:                                                            |
| [ ] [Item 1]                                                        |
| [ ] [Item 2]                                                        |
| ...                                                                 |
+---------------------------------------------------------------------+
| VALIDACAO:                                                          |
| [ ] Criterio 1 atendido                                             |
| [ ] Criterio 2 atendido                                             |
| ...                                                                 |
+---------------------------------------------------------------------+
| RESULTADO: [ ] APROVADO  [ ] BLOQUEADO                              |
| MOTIVO DO BLOQUEIO (se aplicavel): [Descricao]                      |
+---------------------------------------------------------------------+
```

### 6.8 Diagrama de Fluxo de Checkpoints

```
Checkpoint 1          Checkpoint 2         Checkpoint 3
(Scoping)      -->    (Preventivo)   -->   (Execucao)
    |                      |                    |
    v                      v                    v
 Baseline              Validar APIs         Executar
 Matriz Alvos          Impacto              Checks
 Checks N/A            Dependencias         Evidencias
                                                |
                                                v
                       Checkpoint 5         Checkpoint 4
                       (Pre-entrega)  <--   (Verificacao)
                            |                    |
                            v                    v
                        Roadmap              VER/FLX/CON
                        Score                Matriz Rastr.
```

---

## 7. META-VALIDAÇÃO

### 7.1 Objetivo

Verificar se a própria auditoria foi executada corretamente e completamente.

### 7.2 Checklist de Meta-Validação

```
┌─────────────────────────────────────────────────────────────────┐
│                    META-VALIDAÇÃO DA AUDITORIA                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ COMPLETUDE                                                      │
│ □ Baseline documentado e validado?                            │
│ □ Matriz de alvos preenchida?                                  │
│ □ Todos os checks aplicáveis executados?                       │
│ □ Evidências coletadas para todos os checks?                   │
│                                                                 │
│ VALIDADE DOS N/A                                                │
│ □ Todos os N/A têm justificativa?                              │
│ □ Todas as justificativas têm evidência?                       │
│ □ Nenhum N/A é na verdade um erro?                              │
│                                                                 │
│ CONSISTÊNCIA                                                   │
│ □ Score calculado corretamente?                                │
│ □ Bloqueadores identificados corretamente?                      │
│ □ Roadmap inclui todos os erros?                               │
│                                                                 │
│ RASTREABILIDADE                                                 │
│ □ Cada check tem origem documentada?                            │
│ □ Evidências são rastreáveis?                                  │
│ □ Cadeia de evidência completa?                                │
│                                                                 │
│ COBERTURA                                                       │
│ □ Cobertura mínima atingida?                                   │
│ □ Cobertura por alvo documentada?                              │
│ □ Classes de falha mapeadas?                                   │
│                                                                 │
│ QUALIDADE DO ROADMAP                                            │
│ □ Todos os itens têm ≤ 30 palavras?                             │
│ □ Prioridades estão corretas?                                   │
│ □ Não há duplicatas?                                           │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ RESULTADO: □ AUDITORIA VÁLIDA  □ AUDITORIA INCOMPLETA           │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 Anti-omissao

Verificar se existe algum tipo de erro que o protocolo nao detectaria:

- [ ] Erros de ambiente especifico nao cobertos?
- [ ] Erros de integracao nao cobertos?
- [ ] Erros de performance nao cobertos?
- [ ] Erros de seguranca nao cobertos?
- [ ] Erros de fluxo/completude nao cobertos? (v2.0)
- [ ] Erros de consistencia nao cobertos? (v2.0)

Se sim, documentar e adicionar checks apropriados.

### 7.4 Reprodutibilidade

Verificar se a auditoria e reproduzivel:

- [ ] Evidencias permitem reproducao independente?
- [ ] Baseline documentado permite reconstruir ambiente?
- [ ] Procedimentos sao deterministicos?

### 7.5 Auditoria da Auditoria (NOVO v2.0)

Verificacao final de que a propria auditoria foi executada corretamente.

#### 7.5.1 Checklist de Auditoria da Auditoria

| Verificacao                                             | Evidencia Requerida                     |
| ------------------------------------------------------- | --------------------------------------- |
| Todos os 5 checkpoints foram executados?                | Logs de checkpoint com timestamps       |
| Todos os checks aplicaveis foram executados?            | Matriz de checks com resultados         |
| Todos os N/A tem justificativa valida?                  | Lista de N/A com motivos e evidencias   |
| Evidencias seguem nivel requerido por severidade?       | Amostragem de evidencias validada       |
| Micro-checkpoints foram tratados corretamente?          | Log de micro-checkpoints com resolucoes |
| Regra dos 3E foi seguida em todos os checks?            | Amostragem de checks com 3E completo    |
| Decisoes Nivel 3 foram aprovadas?                       | Registro de aprovacoes                  |
| Checks PRE foram executados antes de implementacao?     | Evidencia de Checkpoint 2               |
| Checks VER/FLX/CON foram executados apos implementacao? | Evidencia de Checkpoint 4               |

#### 7.5.2 Validacao de Cobertura de Anti-Padroes

- [ ] Verificado se erros encontrados correspondem a anti-padroes conhecidos (Secao 8)?
- [ ] Novos padroes de erro identificados para catalogacao?
- [ ] Anti-padroes aplicaveis foram verificados preventivamente?
- [ ] Catalogo de anti-padroes foi consultado antes de implementar?

#### 7.5.3 Formato de Relatorio de Auditoria da Auditoria

```
+---------------------------------------------------------------------+
| AUDITORIA DA AUDITORIA                                              |
+---------------------------------------------------------------------+
| DATA: [YYYY-MM-DD]                                                  |
| AUDITOR: [Identificador]                                            |
+---------------------------------------------------------------------+
| CHECKPOINTS:                                                        |
| [X] CP1 - Scoping         | Executado em [data] | APROVADO          |
| [X] CP2 - Preventivo      | Executado em [data] | APROVADO          |
| [X] CP3 - Execucao        | Executado em [data] | APROVADO          |
| [X] CP4 - Verificacao     | Executado em [data] | APROVADO          |
| [X] CP5 - Pre-entrega     | Executado em [data] | APROVADO          |
+---------------------------------------------------------------------+
| CHECKS:                                                             |
| Total Aplicaveis: [N]                                               |
| Executados: [N] (100%)                                              |
| Passando: [N] ([%])                                                 |
| Falhando: [N] ([%])                                                 |
| N/A Justificados: [N]                                               |
+---------------------------------------------------------------------+
| MICRO-CHECKPOINTS:                                                  |
| Total Acionados: [N]                                                |
| Resolvidos: [N]                                                     |
| Pendentes: [N] (deve ser 0)                                         |
+---------------------------------------------------------------------+
| ANTI-PADROES:                                                       |
| Verificados: [N]                                                    |
| Detectados: [N]                                                     |
| Tratados: [N]                                                       |
+---------------------------------------------------------------------+
| RESULTADO: [ ] AUDITORIA VALIDA  [ ] AUDITORIA INCOMPLETA           |
+---------------------------------------------------------------------+
```

---

## 8. CATALOGO DE ANTI-PADROES (NOVO v2.0)

### 8.1 Objetivo

Catalogar erros e praticas identificadas em auditorias anteriores para:

- Prevenir recorrencia de erros conhecidos
- Guiar verificacoes durante implementacao
- Treinar novos auditores e agentes
- Criar memoria organizacional de licoes aprendidas

### 8.2 Formato de Anti-Padrao

Cada anti-padrao deve seguir este formato:

| Campo             | Descricao                              |
| ----------------- | -------------------------------------- |
| ID                | AP-[CATEGORIA]-[SEQUENCIAL]            |
| Nome              | Titulo descritivo (maximo 30 palavras) |
| Descricao         | O que e o anti-padrao                  |
| Sintoma           | Como identificar quando ocorre         |
| Causa Raiz        | Por que acontece                       |
| Prevencao         | Como evitar                            |
| Check Relacionado | Qual check detecta                     |

### 8.3 Anti-Padroes por Categoria

#### 8.3.1 AP-VER: Verificacao Fisica

| ID        | Nome                                       | Sintoma                                                   | Prevencao                                                       | Check          |
| --------- | ------------------------------------------ | --------------------------------------------------------- | --------------------------------------------------------------- | -------------- |
| AP-VER-01 | Artefato documentado mas inexistente       | Documentacao menciona arquivo que nao existe fisicamente  | Sempre executar verificacao de existencia apos declarar criacao | VER-01         |
| AP-VER-02 | API usada sem validar existencia na versao | Codigo usa metodo que nao existe na versao da biblioteca  | Validar API na documentacao oficial antes de usar               | VER-02, PRE-01 |
| AP-VER-03 | Configuracao referenciada mas vazia        | Codigo referencia configuracao que nao tem valor definido | Verificar valores de configuracao em todos os ambientes         | VER-03         |

#### 8.3.2 AP-FLX: Fluxo e Completude

| ID        | Nome                             | Sintoma                                               | Prevencao                                          | Check          |
| --------- | -------------------------------- | ----------------------------------------------------- | -------------------------------------------------- | -------------- |
| AP-FLX-01 | Handler criado mas nao conectado | Funcao existe mas nunca e chamada pelo sistema        | Tracar fluxo completo apos implementacao           | FLX-01, FLX-02 |
| AP-FLX-02 | Camadas desconectadas            | Frontend nao chama backend ou backend nao chama banco | Verificar integracao entre todas as camadas        | FLX-03         |
| AP-FLX-03 | Funcionalidade sem teste         | Codigo novo implementado sem cobertura de teste       | Exigir teste para cada funcionalidade nova         | FLX-04         |
| AP-FLX-04 | Fluxo com gap silencioso         | Fluxo parece completo mas tem ponto de falha oculto   | Testar fluxo completo E2E antes de declarar pronto | FLX-01         |

#### 8.3.3 AP-CON: Consistencia

| ID        | Nome                                  | Sintoma                                               | Prevencao                                       | Check          |
| --------- | ------------------------------------- | ----------------------------------------------------- | ----------------------------------------------- | -------------- |
| AP-CON-01 | Convencao diferente do existente      | Novo codigo usa estilo diferente do padrao do projeto | Analisar codigo existente antes de implementar  | CON-01, CON-03 |
| AP-CON-02 | Codigo em local errado da arquitetura | Arquivo criado na camada/pasta errada                 | Revisar arquitetura antes de criar novo arquivo | CON-02         |

#### 8.3.4 AP-PRE: Preventivos

| ID        | Nome                             | Sintoma                                  | Prevencao                                                 | Check  |
| --------- | -------------------------------- | ---------------------------------------- | --------------------------------------------------------- | ------ |
| AP-PRE-01 | Impacto de mudanca nao analisado | Mudanca quebra dependentes nao previstos | Mapear todos os dependentes antes de modificar            | PRE-02 |
| AP-PRE-02 | Dependencia nao identificada     | Erro de build por dependencia faltando   | Listar todas as dependencias antes de implementar         | PRE-03 |
| AP-PRE-03 | Requisito implicito perdido      | Funcionalidade entregue incompleta       | Extrair requisitos implicitos de cada requisito explicito | PRE-04 |

#### 8.3.5 AP-GEN: Genericos

| ID        | Nome                                   | Sintoma                                            | Prevencao                                 | Check     |
| --------- | -------------------------------------- | -------------------------------------------------- | ----------------------------------------- | --------- |
| AP-GEN-01 | Plano aprovado mas execucao diverge    | Implementacao nao corresponde ao que foi planejado | Usar micro-checkpoints durante execucao   | Secao 4.5 |
| AP-GEN-02 | Evidencia insuficiente para severidade | Check marcado como passando sem prova adequada     | Seguir Niveis de Evidencia por severidade | Secao 1.5 |
| AP-GEN-03 | Decisao critica sem aprovacao          | Mudanca de alto impacto feita sem validacao        | Classificar decisoes e aprovar Nivel 3    | Secao 1.7 |
| AP-GEN-04 | Suposicao nao verificada               | Afirmacao feita sem evidencia fisica               | Aplicar Regra dos 3E em toda afirmacao    | Secao 1.8 |

### 8.4 Como Usar o Catalogo

#### 8.4.1 Antes de Implementar

1. Revisar anti-padroes relacionados a tarefa
2. Identificar quais checks previnem cada anti-padrao
3. Planejar execucao desses checks

#### 8.4.2 Durante Implementacao

1. Verificar periodicamente se nao esta caindo em anti-padrao conhecido
2. Se detectar risco de anti-padrao, acionar micro-checkpoint
3. Documentar decisoes que evitaram anti-padroes

#### 8.4.3 Apos Implementacao

1. Confirmar que anti-padroes aplicaveis foram evitados
2. Executar checks relacionados
3. Documentar na Matriz de Rastreabilidade

#### 8.4.4 Ao Encontrar Novo Erro

1. Analisar se erro corresponde a anti-padrao existente
2. Se nao, propor adicao ao catalogo
3. Definir check que detectaria o erro
4. Atualizar catalogo via processo de revisao

### 8.5 Manutencao do Catalogo

O catalogo deve ser atualizado sempre que:

- Novo tipo de erro e identificado em auditoria
- Anti-padrao existente precisa de refinamento
- Check relacionado e adicionado ou modificado
- Prevencao mais eficaz e descoberta

Atualizacoes devem ser registradas no CHANGELOG_AUDITORIA.md.

---

## APENDICE A: IMPLEMENTACOES DE REFERENCIA

> **⚠️ IMPORTANTE:** Este apêndice contém exemplos práticos de implementação **não normativos**.  
> Os comandos e scripts aqui são **referências** para tecnologias comuns e podem ser adaptados conforme necessário.  
> O protocolo normativo (Seções 1-7) é **agnóstico de tecnologia** e define apenas **contratos de evidência**.

### A.1 Detecção de Tecnologias

#### A.1.1 Node.js / NPM

**Evidência requerida:** Presença de `package.json` ou `package-lock.json`

**Implementação de referência (bash):**

```bash
if [ -f "package.json" ]; then
  echo "✅ Node.js/NPM detectado"
fi
```

**Implementação de referência (PowerShell):**

```powershell
if (Test-Path "package.json") {
  Write-Host "✅ Node.js/NPM detectado"
}
```

#### A.1.2 TypeScript

**Evidência requerida:** Presença de `tsconfig.json`

**Implementação de referência (bash):**

```bash
if [ -f "tsconfig.json" ]; then
  echo "✅ TypeScript detectado"
fi
```

### A.2 Secret Scanning Universal

#### A.2.1 Pattern-based Scanning

**Evidência requerida:** Lista de padrões detectados com localização

**Implementação de referência (bash):**

```bash
# Buscar padrões comuns de secrets
grep -rn "password\s*[:=]\s*['\"][^'\"]*['\"]" --include="*.ts" --include="*.js" \
  | grep -v node_modules \
  | grep -v test
```

#### A.2.2 Entropy-based Scanning

**Evidência requerida:** Strings com alta entropia detectadas

**Implementação de referência (Python):**

```python
import re
import math

def calculate_entropy(s):
    if not s:
        return 0
    entropy = 0
    for x in set(s):
        p_x = float(s.count(x)) / len(s)
        entropy += - p_x * math.log2(p_x)
    return entropy

# Buscar strings com alta entropia (> 3.5)
# (implementação completa requer análise de código)
```

#### A.2.3 VCS History Scanning

**Evidência requerida:** Commits contendo secrets no histórico

**Implementação de referência (git):**

```bash
# Buscar no histórico do git por padrões de secrets
git log --all --source --full-history -S "password" \
  | grep -i "password\|secret\|key\|token"
```

### A.3 Build Contract

#### A.3.1 Node.js / NPM Build

**Evidência requerida:** Log de build bem-sucedido

**Implementação de referência:**

```bash
npm run build 2>&1 | tee build.log
if [ $? -eq 0 ]; then
  echo "✅ Build bem-sucedido"
else
  echo "❌ Build falhou"
fi
```

#### A.3.2 Python Build

**Evidência requerida:** Instalação bem-sucedida ou wheel gerado

**Implementação de referência:**

```bash
python -m build 2>&1 | tee build.log
if [ $? -eq 0 ]; then
  echo "✅ Build bem-sucedido"
fi
```

### A.4 Validação de Configuração

#### A.4.1 JSON Validation

**Evidência requerida:** Validação de sintaxe JSON

**Implementação de referência (bash):**

```bash
for f in *.json; do
  if [ -f "$f" ]; then
    python3 -m json.tool "$f" > /dev/null 2>&1 \
      && echo "✅ $f válido" \
      || echo "❌ $f inválido"
  fi
done
```

### A.5 Análise de Dependências

#### A.5.1 Vulnerabilidades (NPM)

**Evidência requerida:** Relatório de auditoria de segurança

**Implementação de referência:**

```bash
npm audit --json > audit-report.json
```

#### A.5.2 Dependências Desatualizadas

**Evidência requerida:** Lista de dependências desatualizadas

**Implementação de referência:**

```bash
npm outdated --json > outdated-deps.json
```

### A.6 Execucao de Testes

#### A.6.1 Jest (Node.js)

**Evidencia requerida:** Relatorio de execucao de testes

**Implementacao de referencia:**

```bash
npm test -- --json --outputFile=test-results.json
```

#### A.6.2 Cobertura

**Evidencia requerida:** Relatorio de cobertura

**Implementacao de referencia:**

```bash
npm test -- --coverage --coverageReporters=json
```

### A.7 Verificacao Fisica (VER) - NOVO v2.0

#### A.7.1 VER-01: Verificacao de Existencia de Arquivos

**Evidencia requerida:** Lista de arquivos com status de existencia

**Implementacao de referencia (Bash):**

```bash
# Criar lista de arquivos esperados
cat arquivos_esperados.txt | while read file; do
  if [ -f "$file" ]; then
    echo "[OK] $file existe"
  else
    echo "[FALHA] $file NAO existe"
  fi
done
```

**Implementacao de referencia (PowerShell):**

```powershell
Get-Content arquivos_esperados.txt | ForEach-Object {
  if (Test-Path $_) {
    Write-Host "[OK] $_ existe" -ForegroundColor Green
  } else {
    Write-Host "[FALHA] $_ NAO existe" -ForegroundColor Red
  }
}
```

#### A.7.2 VER-02: Validacao de API na Documentacao Oficial

**Evidencia requerida:** Link para documentacao + confirmacao de existencia

**Procedimento:**

1. Identificar API/metodo usado no codigo
2. Localizar documentacao oficial da biblioteca/framework
3. Verificar versao da biblioteca no projeto (package.json, requirements.txt, etc)
4. Confirmar que metodo existe na versao usada
5. Documentar link + versao como evidencia

**Formato de Evidencia:**

```
API: router.addListener
Biblioteca: expo-router
Versao no projeto: 4.0.17
Documentacao: https://docs.expo.dev/router/reference/
Status: [EXISTE | NAO EXISTE | DEPRECADO]
```

#### A.7.3 VER-03: Verificacao de Configuracoes

**Evidencia requerida:** Lista de configuracoes com status

**Implementacao de referencia (Node.js):**

```javascript
const requiredEnvVars = ['DATABASE_URL', 'API_KEY', 'SECRET'];
requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`[OK] ${varName} configurado`);
  } else {
    console.log(`[FALHA] ${varName} NAO configurado`);
  }
});
```

### A.8 Fluxo e Completude (FLX) - NOVO v2.0

#### A.8.1 FLX-01: Tracar Fluxo Ponta-a-Ponta

**Evidencia requerida:** Diagrama ou lista de conexoes

**Procedimento:**

1. Identificar ponto de entrada (botao, API endpoint, evento)
2. Tracar cada chamada ate destino final
3. Documentar cada no do fluxo
4. Verificar que nao ha gaps

**Formato de Documentacao:**

```
FLUXO: Enviar Mensagem
[Botao Enviar] --> [handleSend()] --> [MessageService.send()] --> [API /messages] --> [Database INSERT]
     [OK]              [OK]                  [OK]                    [OK]              [OK]
STATUS: COMPLETO (5/5 nos conectados)
```

#### A.8.2 FLX-02: Verificar Handlers Conectados

**Evidencia requerida:** Lista de handlers com seus triggers

**Implementacao de referencia (grep):**

```bash
# Encontrar definicoes de handlers
grep -rn "const handle" --include="*.tsx" --include="*.ts" | head -20

# Verificar se sao usados
for handler in $(grep -rho "handle[A-Z][a-zA-Z]*" --include="*.tsx" | sort -u); do
  count=$(grep -r "$handler" --include="*.tsx" | wc -l)
  if [ $count -gt 1 ]; then
    echo "[OK] $handler usado $count vezes"
  else
    echo "[ALERTA] $handler definido mas nao usado"
  fi
done
```

#### A.8.3 FLX-04: Verificar Cobertura de Teste por Funcionalidade

**Evidencia requerida:** Mapeamento funcionalidade para teste

**Formato de Documentacao:**

```
| Funcionalidade | Arquivo de Teste | Testes | Status |
|----------------|------------------|--------|--------|
| Enviar mensagem | SendMessage.test.tsx | 5 | OK |
| Login | Auth.test.tsx | 8 | OK |
| Nova feature X | [NENHUM] | 0 | FALHA |
```

### A.9 Consistencia (CON) - NOVO v2.0

#### A.9.1 CON-01: Verificar Nomenclatura

**Evidencia requerida:** Comparacao com padroes existentes

**Procedimento:**

1. Identificar padrao de nomenclatura existente (camelCase, PascalCase, snake_case)
2. Verificar se novos arquivos/funcoes seguem o padrao
3. Documentar divergencias

**Implementacao de referencia:**

```bash
# Verificar padrao de arquivos de componentes (espera PascalCase)
ls components/*.tsx | while read file; do
  basename=$(basename "$file" .tsx)
  if [[ "$basename" =~ ^[A-Z] ]]; then
    echo "[OK] $basename segue PascalCase"
  else
    echo "[FALHA] $basename NAO segue PascalCase"
  fi
done
```

#### A.9.2 CON-02: Verificar Localizacao na Arquitetura

**Evidencia requerida:** Lista de arquivos com localizacao correta/incorreta

**Procedimento:**

1. Definir regras de arquitetura (ex: componentes em /components, services em /services)
2. Verificar se cada arquivo novo esta no local correto
3. Documentar violacoes

### A.10 Checks Preventivos (PRE) - NOVO v2.0

#### A.10.1 PRE-01: Validar API Antes de Uso

**Evidencia requerida:** Confirmacao na documentacao oficial ANTES de codificar

**Procedimento:**

1. ANTES de escrever codigo que usa API externa
2. Abrir documentacao oficial
3. Verificar que metodo existe
4. Verificar parametros e retorno
5. Documentar link como evidencia

#### A.10.2 PRE-02: Analise de Impacto

**Evidencia requerida:** Lista de dependentes afetados

**Implementacao de referencia:**

```bash
# Encontrar todos os arquivos que importam o arquivo a ser modificado
arquivo="services/AuthService.ts"
grep -rln "from.*AuthService" --include="*.ts" --include="*.tsx"
```

**Formato de Documentacao:**

```
ARQUIVO A MODIFICAR: services/AuthService.ts
DEPENDENTES:
1. app/login.tsx (importa AuthService)
2. contexts/AuthContext.tsx (importa AuthService)
3. services/SessionManager.ts (importa AuthService)
IMPACTO ANALISADO: Mudanca em metodo login() afeta todos os 3 dependentes
ACAO: Verificar compatibilidade com todos os dependentes
```

#### A.10.3 PRE-03: Identificar Dependencias

**Evidencia requerida:** Lista de dependencias necessarias

**Procedimento:**

1. Listar bibliotecas que serao usadas
2. Verificar se estao instaladas (npm list, pip list, etc)
3. Verificar versoes compativeis
4. Documentar dependencias novas necessarias

---

## APENDICE B: BOAS PRATICAS DE EXECUCAO (NOVO v2.0)

> **Nota:** Este apendice contem recomendacoes de comportamento durante execucao.
> Diferente dos checks (verificaveis), estas sao praticas que melhoram qualidade.

### B.1 Comunicacao Durante Execucao

| Momento                 | Comunicacao Recomendada                     |
| ----------------------- | ------------------------------------------- |
| Inicio de fase          | "Iniciando [fase], estimativa [tempo]"      |
| Progresso significativo | "Completado [N] de [M] itens"               |
| Descoberta inesperada   | "Encontrei [situacao], avaliando impacto"   |
| Bloqueio                | "Bloqueado por [motivo], aguardando [acao]" |
| Conclusao               | "Finalizado [fase] com [resultado]"         |

### B.2 Documentacao em Tempo Real

- Documentar descobertas imediatamente, nao ao final
- Capturar evidencias no momento da verificacao
- Registrar decisoes com justificativa quando tomadas
- Nao confiar na memoria - documentar tudo

### B.3 Tratamento de Incertezas

| Situacao                   | Acao Recomendada                       |
| -------------------------- | -------------------------------------- |
| Nao sei se check se aplica | Investigar antes de marcar N/A         |
| Evidencia ambigua          | Coletar evidencia adicional            |
| Resultado inesperado       | Verificar duas vezes antes de reportar |
| Contradicao com plano      | Acionar micro-checkpoint               |
| Duvida sobre impacto       | Classificar como Nivel 3 e aprovar     |

### B.4 Prevencao de Anti-Padroes

- Consultar Secao 8 antes de iniciar tarefa
- Identificar anti-padroes relacionados a tarefa
- Verificar proativamente se nao esta caindo em anti-padrao
- Ao final, confirmar que anti-padroes foram evitados

### B.5 Uso de Micro-Checkpoints

- Nao hesitar em acionar micro-checkpoint quando necessario
- Melhor parar e perguntar do que prosseguir e errar
- Documentar resolucao de cada micro-checkpoint
- Micro-checkpoint nao e sinal de fraqueza, e sinal de rigor

---

## GLOSSARIO

| Termo                | Definicao                                                                              |
| -------------------- | -------------------------------------------------------------------------------------- |
| **Alvo**             | Ambiente, plataforma ou contexto especifico onde o sistema e executado ou construido   |
| **Anti-Padrao**      | Erro ou pratica identificada em auditorias anteriores que deve ser evitada             |
| **Baseline**         | Estado documentado do ambiente e dependencias externas no inicio da auditoria          |
| **Check**            | Verificacao individual que produz evidencia verificavel sobre um aspecto do sistema    |
| **Checkpoint**       | Ponto obrigatorio de validacao e reporte durante a execucao da auditoria               |
| **Cobertura**        | Medida formal da proporcao de classes de falha cobertas por checks aplicaveis          |
| **Erro**             | Qualquer desvio do comportamento esperado, padrao estabelecido ou requisito            |
| **Evidencia**        | Artefato verificavel que comprova o resultado de um check                              |
| **Evidencia Fisica** | Artefato tangivel e verificavel como output de comando, screenshot ou log              |
| **Falha**            | Manifestacao observavel de um erro em runtime ou durante execucao de processos         |
| **Micro-Checkpoint** | Ponto de validacao dentro de uma fase de execucao para decisoes criticas               |
| **N/A**              | Check que nao se aplica ao contexto do sistema auditado, com justificativa e evidencia |
| **Regra 3E**         | Principio que exige Especificacao + Execucao + Evidencia para cada check               |
| **Roadmap**          | Lista priorizada de correcoes necessarias para atingir score 100/100                   |

---

## APENDICE C: NOTAS DE VERSAO (OPCIONAL)

> **IMPORTANTE:** Este apendice e completamente opcional e pode ser removido sem impacto no protocolo.
> O protocolo principal e atemporal e nao requer conhecimento de versoes anteriores.
> Este apendice existe apenas para referencia historica, se necessario.

### C.1 Sobre Este Apendice

Este apendice contem informacoes sobre historico de versoes do protocolo. Estas informacoes sao puramente informativas e nao afetam a execucao da auditoria.

**Voce pode:**

- Remover este apendice completamente
- Ignorar este apendice durante a leitura
- Manter apenas para referencia historica

### C.2 Informacoes de Versao

**Versao Atual:** 2.0.0  
**Data de Criacao:** 2026-01-07  
**Changelog:** Consulte CHANGELOG_AUDITORIA.md se disponivel

### C.3 Mudancas Principais da Versao Atual

[Lista de mudancas principais - pode ser removida se nao necessario]

---

**FIM DO APENDICE C - Este apendice pode ser removido sem impacto**

---

**FIM DO PROTOCOLO UNIVERSAL DE AUDITORIA DE SISTEMAS**

_Este documento define um protocolo normativo universal para auditoria de sistemas de software, aplicavel a qualquer tecnologia, arquitetura ou contexto._

---

## ANEXO B - EVIDENCIA DE PRONTIDAO PARA PRODUCAO (Exemplo)

**Data:** 2026-01-06  
**Ambiente:** Windows 10 (PowerShell)

### B.1 Gate de Segurança (Dependências)

**Evidência:**

```bash
npm audit
```

**Resultado observado:** `found 0 vulnerabilities`

**Evidência:**

```bash
npm audit --omit=dev
```

**Resultado observado:** `found 0 vulnerabilities`

### B.2 Gate de Qualidade (Testes)

**Evidência:**

```bash
npm test -- --silent
```

**Resultado observado:** `Test Suites: 49 passed, 49 total` e `Tests: 642 passed, 642 total`

### B.3 Gate de Build (Export Android)

**Evidência:**

```bash
npx expo export --platform android --output-dir .expo-export-tmp
```

**Resultado observado:** `App exported to: .expo-export-tmp`

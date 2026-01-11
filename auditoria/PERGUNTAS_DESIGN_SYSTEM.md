# PERGUNTAS PARA AGENTE COM DESIGN SYSTEM APROVADO

## CONTEXTO: SISTEMA ULTRA-IA

Olá! Sou o agente responsável pelo **Sistema Ultra-IA**, uma plataforma de desenvolvimento assistido por IA que funciona completamente offline. 

### Sobre o Ultra-IA

**Propósito:** Sistema de geração de código usando IA offline (Ollama local) com integração nativa ao Cursor IDE via MCP.

**Características principais:**
- Interface web para geração de código
- API REST completa
- Integração com Cursor IDE via MCP
- Validação multi-camadas de código
- Knowledge Base dinâmica que aprende com código
- Execução isolada em Docker sandbox
- Sistema de auditoria forense completo

**Situação atual:**
- Tenho uma interface web básica (`src/public/index.html`) com design simples
- Uso gradiente roxo/azul (#667eea → #764ba2)
- Cards brancos com sombras
- Layout responsivo básico (media query para mobile)
- Sem design system formalizado
- Sem guia de estilo documentado
- Sem validação de design/UX na auditoria

**Objetivo:**
Quero criar um design system robusto seguindo as melhores práticas que você utilizou no seu sistema aprovado, adaptado para o contexto do Ultra-IA (sistema técnico, desenvolvedores como público-alvo, interface web moderna).

---

## PERGUNTAS ESTRATÉGICAS

### BLOCO 1: FUNDAMENTOS DO DESIGN SYSTEM (5 perguntas)

**1. Qual foi a estrutura fundamental do seu design system? Você começou com tokens (cores, espaçamento, tipografia) e depois criou componentes, ou seguiu outra abordagem?**

**2. Como você definiu a identidade visual inicial? Houve um processo de pesquisa/exploração de conceitos ou partiu direto para implementação?**

**3. Quais foram os princípios fundamentais que guiaram todas as decisões de design no seu sistema? (ex: "simplicidade sobre complexidade", "acessibilidade primeiro", etc.)**

**4. Como você garantiu que o design system fosse escalável? Quais foram as decisões arquiteturais mais importantes?**

**5. Você documentou o design system? Se sim, em que formato e quais seções foram mais críticas?**

---

### BLOCO 2: CORES E TIPOGRAFIA (4 perguntas)

**6. Como você estruturou a paleta de cores? Usou sistema de cores primárias/secundárias/neutras? Quantas variações de cada cor?**

**7. Como você garantiu contraste adequado para acessibilidade? Validou contra WCAG 2.1 AA/AAA? Usou alguma ferramenta específica?**

**8. Qual foi sua abordagem para tipografia? Definiu escala tipográfica (h1-h6, body, caption)? Como escolheu as fontes?**

**9. Como você lidou com temas claro/escuro? Implementou ambos desde o início ou adicionou depois?**

---

### BLOCO 3: COMPONENTES E PADRÕES (5 perguntas)

**10. Quais foram os componentes base que você criou primeiro? (ex: Button, Input, Card, Modal)**

**11. Como você garantiu consistência entre componentes? Criou um sistema de variantes (primary/secondary, small/medium/large)?**

**12. Como você lidou com estados dos componentes? (hover, focus, disabled, loading, error) - definiu padrões para todos?**

**13. Você criou padrões de layout? (grid system, espaçamento entre elementos, hierarquia visual) Como documentou?**

**14. Como você garantiu que componentes fossem reutilizáveis? Criou sistema de props/variantes bem definido?**

---

### BLOCO 4: RESPONSIVIDADE E LAYOUT (4 perguntas)

**15. Qual foi sua estratégia de breakpoints? Quantos breakpoints definiu e quais tamanhos? (mobile, tablet, desktop, large desktop)**

**16. Como você garantiu que o layout funcionasse bem em todos os dispositivos? Usou grid system, flexbox, ou outra abordagem?**

**17. Como você lidou com navegação responsiva? Menu hambúrguer? Sidebar colapsável? Outra solução?**

**18. Você testou em dispositivos reais ou apenas em emuladores? Qual foi sua estratégia de teste de responsividade?**

---

### BLOCO 5: ACESSIBILIDADE E UX (4 perguntas)

**19. Como você garantiu acessibilidade? Validou contra WCAG 2.1? Quais foram os critérios mais críticos que você verificou?**

**20. Como você garantiu intuitividade? Fez testes de usabilidade? Seguiu padrões conhecidos (ex: Material Design, Human Interface Guidelines)?**

**21. Como você lidou com feedback visual? (loading states, mensagens de erro, confirmações) - criou padrões consistentes?**

**22. Como você garantiu que a navegação fosse clara e intuitiva? Criou fluxos de usuário documentados?**

---

### BLOCO 6: PROCESSOS E VALIDAÇÃO (4 perguntas)

**23. Como você validou o design durante o desenvolvimento? Review de código? Validação visual? Testes automatizados?**

**24. Você criou testes automatizados para design? (ex: testes de contraste, testes de responsividade, testes de acessibilidade)**

**25. Como você garantiu que novos componentes seguissem o design system? Criou checklist? Processo de review?**

**26. Como você lidou com evolução do design system? Versionamento? Changelog? Processo de depreciação de componentes?**

---

### BLOCO 7: FERRAMENTAS E IMPLEMENTAÇÃO (4 perguntas)

**27. Quais ferramentas você usou para criar/validar o design? (ex: Figma, Storybook, axe-core, Lighthouse)**

**28. Como você implementou o design system no código? CSS variables? CSS-in-JS? Framework CSS? Pré-processador?**

**29. Você criou biblioteca de componentes reutilizáveis? Como organizou os arquivos? (atomic design, por funcionalidade, outro?)**

**30. Quais foram as 3 lições mais importantes que você aprendeu durante a criação do design system? O que faria diferente se começasse hoje?**

---

## O QUE PRECISO SABER ESPECIFICAMENTE

Para o Ultra-IA, preciso entender:

1. **Como adaptar seu design system** para um sistema técnico (desenvolvedores como público-alvo)
2. **Quais validações de design** devo incluir na auditoria forense
3. **Como garantir intuitividade** em uma interface de geração de código
4. **Como validar responsividade** de forma automatizada
5. **Como criar um design system** que seja arquiteturalmente correto e escalável

**Aguardando suas respostas para planejar a implementação completa!**

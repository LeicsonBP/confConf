\# BRIEFING DE ENTRADA — PLANEJAMENTO  
\#\# Plataforma de Gestão de Confraternizações e Amigo Secreto

\> \*\*Instrução ao agente de planejamento (Harness):\*\*  
\> Este documento é a fonte única de requisitos do projeto. Sua tarefa nesta fase é executar integralmente a \*\*FASE 1 — Planejamento e Definição da Arquitetura\*\*, descrita na seção 9\. Não implemente código nesta fase. Toda decisão técnica relevante deve ser apresentada com alternativas, prós, contras e recomendação, aguardando aprovação explícita do cliente antes de avançar.

\---

\#\# 1\. VISÃO GERAL

Desenvolver uma \*\*plataforma web\*\* para administração de confraternizações e organização de amigos secretos, com dois ambientes distintos:

\- \*\*Portal Administrativo\*\* — acesso exclusivo do administrador master.  
\- \*\*Portal do Usuário\*\* — acesso individual dos participantes, exclusivamente por convite.

Requisitos transversais obrigatórios:  
\- Identidade visual \*\*diferenciada, moderna e própria\*\* (evitar soluções convencionais propostas por IAs).  
\- Arquitetura consistente com boas práticas de engenharia de software.  
\- \*\*Segurança e privacidade garantidas em nível de arquitetura e banco de dados\*\* — não apenas por ocultação na interface.  
\- Documentação contínua e versionada.  
\- Testes unitários obrigatórios; testes de integração quando pertinentes.  
\- Desenvolvimento incremental em duas fases, com aprovação do cliente em cada decisão técnica relevante.

\---

\#\# 2\. STACK E INFRAESTRUTURA

\#\#\# 2.1 Definido  
\| Camada \| Ferramenta \|  
\|---\|---\|  
\| Hospedagem \| Vercel \|  
\| Banco de Dados \+ Backend \| Supabase \|  
\| Versionamento / Repositório \| GitHub \|  
\| Ambiente de desenvolvimento com IA \| DeepSeek Harness \|

\#\#\# 2.2 A definir na Fase 1 — Frontend  
O cliente utilizou anteriormente Next.js \+ TypeScript e deseja \*\*explorar alternativas\*\* dentro do ecossistema JavaScript/TypeScript. Apresentar comparativo entre frameworks considerando, no mínimo:  
\- Experiência de desenvolvimento;  
\- Flexibilidade visual e possibilidades de personalização;  
\- Desempenho;  
\- Escalabilidade;  
\- Facilidade de manutenção;  
\- Compatibilidade com Vercel \+ Supabase;  
\- Integração com ferramentas de IA.

A decisão final é \*\*sempre do cliente\*\*. Não adotar a solução "mais popular" por padrão.

\---

\#\# 3\. ESCOPO FUNCIONAL

\#\#\# 3.1 Portal Administrativo  
\- Acesso \*\*exclusivo\*\* por usuário e senha master (sem cadastro público, sem criação de novas contas administrativas). Credenciais a definir na Fase 1\.  
\- CRUD de confraternizações com os campos:  
  \- Nome da confraternização;  
  \- Descrição do evento;  
  \- Local;  
  \- Data e horário;  
  \- Valor máximo do presente do amigo secreto;  
  \- Informações adicionais;  
  \- Definição de haverá ou não amigo secreto (recurso \*\*opcional\*\* — o evento existe sem sorteio).  
\- Geração e compartilhamento de \*\*links de convite\*\* para cadastro de participantes.  
\- Gerenciamento de participantes vinculados a cada evento.  
\- \*\*Visão consolidada de restrições alimentares\*\* por evento.  
\- \*\*Planejamento alimentar\*\*: estimativas de quantidade e variedade de alimentos (salgadinhos e outros) com base no total de participantes e restrições (vegetarianos, veganos, intolerância à lactose, restrição ao glúten, outras). Apresentar como \*\*estimativas\*\*, não quantidades definitivas.  
\- O administrador \*\*também pode participar\*\* como usuário comum, com cadastro próprio no ambiente individual.

\#\#\# 3.2 Portal do Usuário (Participante)  
\- Acesso \*\*exclusivamente por convite\*\* gerado pelo administrador.  
\- Cadastro com: \*\*nome completo, data de nascimento, senha numérica de até 6 dígitos, restrições alimentares e um capcha simples\*\*.  
\- Geração automática de \*\*identificador único\*\*: nome do participante sem caracteres especiais \+ padronização \+ 3 dígitos aleatórios. Deve haver \*\*validação de duplicidade e tratamento de conflitos\*\*.  
\- A plataforma deve fornecer ao participante suas credenciais para retorno posterior.  
\- \*\*Área individual\*\* com:  
  \- Consulta às confraternizações das quais participa;  
  \- Visualização das informações dos eventos;  
  \- Consulta \*\*exclusiva\*\* ao resultado do amigo secreto (apenas quem foi sorteado para ele);  
  \- Cadastro e gerenciamento de \*\*lista de desejos\*\* (adicionar, editar, remover — UX simples e intuitiva).  
  \- Confirmação do sorteio após o mesmo ser realizado.  
  \- Botão com modal para reportar algum problema (como receber ele mesmo no sorteio, o que \*\*NÃO DEVE ACONTECER\*\*).

\#\#\# 3.3 Amigo Secreto — Regras de Privacidade (Críticas)  
\- Recurso \*\*opcional\*\* por evento.  
\- Sorteio \*\*iniciado e executado pelo administrador\*\*.  
\- Distribuição \*\*aleatória\*\* realizada pela plataforma.  
\- Cada participante visualiza \*\*apenas\*\* a pessoa sorteada para ele.  
\- \*\*O administrador NÃO pode visualizar nenhum resultado\*\* — nem individual, nem consolidado, nem a relação completa.  
\- Sorteio só pode ser realizado com o mínimo de 2 participantes, e deve ser impossível o usuário receber ele mesmo no sorteio.  
\- A restrição deve ser garantida \*\*pela arquitetura e pelas regras de segurança do banco de dados\*\* (ex.: RLS no Supabase), não apenas pela ocultação na interface.  
\- O usuário deve ter a opção de \*\*CONFIRMAR\*\* o sorteio num botão em sua interface, possibilitando ao administrador ter a certeza de que o sorteio foi um sucesso.  
\---

\#\# 4\. REQUISITOS NÃO FUNCIONAIS

\| Categoria \| Diretriz \|  
\|---\|---\|  
\| Arquitetura \| Bem definida, com separação de responsabilidades e modularidade \|  
\| Paradigma \| Orientação a objetos quando aplicável \|  
\| Código \| Limpo, legível, reutilizável, nomenclatura padronizada \|  
\| Erros \| Tratamento adequado e consistente em todas as camadas \|  
\| Segurança \| Garantida por arquitetura e políticas de banco (RLS etc.) \|  
\| Testes \| Unitários obrigatórios; integração quando necessário \|  
\| Documentação \| Contínua, no repositório, com comentários no código quando pertinente \|  
\| UI/UX \| Identidade visual diferenciada, moderna, intuitiva e performática \|  
\| Manutenibilidade \| Facilidade de evolução e sustentabilidade \|

\---

\#\# 5\. METODOLOGIA E ROTINA DE QUALIDADE

\#\#\# 5.1 Rotina obrigatória por commit  
Antes de considerar qualquer alteração concluída, executar e registrar:  
1\. Revisão da arquitetura e organização do código;  
2\. Verificação de aderência a padrões e convenções;  
3\. Execução dos testes pertinentes;  
4\. Criação/atualização de testes unitários;  
5\. Revisão da documentação existente;  
6\. Atualização da documentação relativa à alteração;  
7\. Verificação de impactos em funcionalidades existentes;  
8\. Registro das decisões técnicas relevantes (ADRs).

\> Nenhuma implementação é considerada concluída sem cumprir todas as verificações acima.

\#\#\# 5.2 Documentação contínua  
\- Parte integrante do processo, nunca etapa final.  
\- Revisão obrigatória a cada alteração relevante.  
\- Organizada em arquivos no repositório GitHub \+ comentários explicativos no código.

\---

\#\# 6\. GOVERNANÇA DO PROJETO

\- A IA atua como \*\*parceira técnica\*\*: pode propor, analisar, recomendar e sugerir melhorias.  
\- \*\*Nenhuma decisão arquitetural ou tecnológica relevante\*\* deve ser tomada sem aprovação explícita do cliente.  
\- Toda escolha importante deve vir com \*\*alternativas, vantagens, desvantagens e recomendação técnica\*\*.  
\- A autonomia da IA é ampla na análise e proposição; o controle decisório é sempre do cliente.

\---

\#\# 7\. PONTOS EM ABERTO (A RESOLVER NA FASE 1\)

\- Definição das credenciais master do administrador (política, armazenamento, rotação).  
\- Escolha do framework frontend (após comparativo).  
\- Estratégia de autenticação (ex.: Supabase Auth vs. custom).  
\- Política de RLS no Supabase para garantia de privacidade dos sorteios.  
\- Regras de expiração e revogação de convites.  
\- Modelo de identidade visual (branding, tom, referências).  
\- Critérios de aceite por funcionalidade.

\---

\#\# 8\. ENTREGÁVEIS ESPERADOS

\#\#\# Fase 1 — Planejamento e Definição da Arquitetura  
1\. Análise integral dos requisitos, identificação de funcionalidades e regras de negócio;  
2\. Identificação de lacunas e pontos que precisam de definição;  
3\. Proposta de arquitetura geral da aplicação;  
4\. Comparativo de frameworks e tecnologias para cada camada (com recomendação);  
5\. Estrutura recomendada de banco de dados;  
6\. Estratégias de autenticação e autorização;  
7\. Regras de segurança e privacidade (incluindo RLS);  
8\. Organização inicial do repositório;  
9\. Estratégia de testes;  
10\. Padrões de documentação;  
11\. Roadmap de desenvolvimento.

\#\#\# Fase 2 — Desenvolvimento e Implementação  
\- Implementação incremental dos módulos aprovados (Portal Administrativo, Portal do Usuário, Amigo Secreto, Planejamento Alimentar, Lista de Desejos);  
\- Suíte de testes unitários e de integração;  
\- Documentação técnica contínua e versionada;  
\- Registro de decisões arquiteturais (ADRs).

\---

\#\# 9\. FASES DO PROJETO

\#\#\# FASE 1 — Planejamento e Definição da Arquitetura (fase atual)  
Executar os 11 entregáveis listados na seção 8\. Apresentar todas as decisões técnicas relevantes para avaliação e aprovação do cliente \*\*antes\*\* de qualquer implementação.

\#\#\# FASE 2 — Desenvolvimento e Implementação  
Inicia somente após aprovação da Fase 1\. Implementação incremental, respeitando a arquitetura aprovada, com documentação, testes e revisão a cada commit.

\---

\#\# 10\. DIRETRIZ FINAL

Construir uma aplicação \*\*moderna, intuitiva, segura, tecnicamente bem construída\*\*, com identidade visual diferenciada, arquitetura consistente e documentação completa. O sucesso do projeto não se mede apenas pela funcionalidade entregue, mas pela \*\*qualidade estrutural, sustentabilidade e aderência às decisões aprovadas pelo cliente\*\*.

\*\*Inicie a Fase 1 apresentando sua análise inicial, as lacunas identificadas e o plano de trabalho proposto para o planejamento.\*\*
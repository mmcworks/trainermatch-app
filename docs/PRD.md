# PRD — Marketplace Academia ↔ Professor (nome provisório: `trainer-app`)

> Versão 0.1 · 04/11/2026 · Status: **rascunho para revisão**

## 1. Visão

Conectar academias que precisam de professores de educação física **por hora/turno** a professores registrados no CREF disponíveis, com **busca por localização, horário, preço e reputação**, **negociação com prazo** e **avaliação mútua**.

- **Lançamento:** Grande Vitória/ES (Vitória, Vila Velha, Serra, Cariacica, Viana). Arquitetura pronta para todo o Brasil.
- **Receita:** assinatura paga **somente pelas academias**. Os professores não pagam nada.
- **Pagamento da hora-aula:** feito **fora do sistema**, direto entre academia e professor.

## 2. Perfis de usuário

| Perfil | Descrição | Plataforma principal |
|---|---|---|
| **Professor** | Profissional com CREF ativo (definitivo ou provisório), autônomo (CPF) ou PJ/MEI (CPF + CNPJ) | App mobile |
| **Gestor da academia** | Dono/gerente responsável por publicar turnos, contratar e avaliar | Web + app |
| **Admin da plataforma** | Aprova cadastros, verifica CREF, modera conteúdo, gerencia assinaturas | Web (painel admin) |

## 3. Regras de negócio

### RN-01 Cadastro do professor
- Campos obrigatórios: nome, CPF, e-mail, celular (confirmado por OTP), foto, **CREF (número, UF, categoria, validade)**, tipo de pessoa (Autônomo / PJ-MEI), modalidades (1 ou mais), valor mínimo/hora, endereço-base + raio de atendimento (km), disponibilidade semanal.
- Se for PJ/MEI: CNPJ obrigatório, validado automaticamente (situação **ativa**).
- Opcionais: diploma, certificações por modalidade, anos de experiência por modalidade, bio, fotos/vídeos.
- O status começa como `pendente_verificacao`. O professor só aparece na busca e só pode se candidatar depois que o admin **aprovar o CREF**.
- CREF vencido → perfil suspenso automaticamente. O professor recebe avisos 30 e 7 dias antes do vencimento.

### RN-02 Cadastro da academia
- Campos obrigatórios: razão social/nome fantasia, **CNPJ (validado, ativo)**, endereço (geocodificado), responsável (nome, CPF, celular com OTP), e-mail.
- Opcionais: fotos, modalidades oferecidas, estrutura, regras internas (uniforme etc.).
- O cadastro é **gratuito**. Sem assinatura, a academia pode publicar turnos, buscar, ver perfis e notas, e negociar.
- Um CNPJ = uma conta. Unidades adicionais ficam no plano Rede.

### RN-03 Turnos
- Campos: data, hora de início e fim, modalidade, valor máximo/hora, quantidade de professores, requisitos (certificações), descrição.
- Recorrência: semanal, com data de término.
- Fuso horário: o da academia. Tudo é armazenado em UTC.
- Status: `rascunho → aberto → preenchido → em_andamento → concluido → avaliado` | `cancelado` | `expirado` (quando ninguém foi contratado até o início).

### RN-04 Busca
- **Professor busca turnos:** filtros de distância, data/horário, valor/hora, modalidade, nota da academia.
- **Academia busca professores:** filtros de distância, disponibilidade no horário, valor/hora, nota mínima, modalidade, certificações. Pode **convidar** um professor para um turno.
- Ordenação padrão por *pontuação de match*: nota, distância, adequação de preço, confiabilidade, atividade recente.
- Selo **"Preço compatível"** quando `valor mínimo do professor ≤ valor máximo da academia`.
- **Dados de contato nunca aparecem** antes da contratação confirmada. O endereço da academia aparece apenas como bairro/cidade.

### RN-05 Negociação (propostas e contrapropostas)
- Começa por **candidatura** do professor ou **convite** da academia, sempre com um valor/hora.
- O outro lado pode **aceitar**, **recusar** ou fazer **contraproposta**.
- **Prazo de resposta** de cada proposta, calculado pela antecedência do turno:

| Antecedência | Prazo |
|---|---|
| > 72h | 12h |
| 24h – 72h | 4h |
| 6h – 24h | 1h |
| < 6h (urgente) | 20 min, **sem contraproposta** |

- O prazo nunca passa do **corte de 2h antes do início**. Ao chegar no corte, tudo expira.
- Máximo de **2 contrapropostas por lado** por negociação.
- **Aceite automático** (opcional, por turno): aceita na hora candidaturas com valor ≤ máximo, até completar a quantidade de vagas.
- Quando todas as vagas do turno são preenchidas, as demais negociações viram `encerrada` e os professores são notificados.
- O professor não pode ter contratações sobrepostas. A regra é garantida no banco de dados.
- Lembretes de prazo quando restarem 50% e 10% do tempo.

### RN-06 Assinatura, teste grátis e liberação de contatos
- **Teste grátis = 1ª contratação.** A primeira contratação confirmada de cada CNPJ libera os contatos sem cobrança. Só existe **um teste por CNPJ**.
- Da 2ª contratação em diante, a academia precisa de **assinatura ativa**:
  - Se aceitar uma proposta sem assinatura → vai para o checkout. A negociação fica `aguardando_assinatura` por até **30 min** (ou até o corte de 2h, o que vier primeiro). O professor fica reservado nesse período.
  - Pagamento aprovado → `confirmada` → **contatos liberados para os dois lados** (WhatsApp/telefone/e-mail do professor; telefone, e-mail e endereço completo da academia).
- **Limite do plano** (ver seção 5): passou do limite, a academia pode fazer upgrade ou pagar uma contratação avulsa.
- **Contagem:** 1 contratação = 1 professor confirmado em 1 turno. **Turnos recorrentes do mesmo professor contam como 1 por mês.**
- Assinatura cancelada ou inadimplente: o histórico e os contatos já liberados continuam visíveis. Novas confirmações ficam bloqueadas.
- Cobrança pelo parceiro **Asaas** (cartão, Pix, boleto), com NFS-e automática, no **painel web**.

### RN-07 Execução do turno
- Lembretes ao professor 24h e 2h antes, com botão **"Confirmo presença"**.
- **Check-in/out** por geolocalização (raio de 150 m da academia), liberado de 30 min antes até 15 min depois do início.
  - Atraso = check-in após o início. Esse dado alimenta a métrica de pontualidade.
- Depois do turno, o professor marca **"Recebi o pagamento"** (sim / não / parcial). O dado alimenta o critério "Pagamento em dia" da academia.

### RN-08 Cancelamentos, faltas e penalidades
- **Professor:**
  - Cancelamento com ≥ 24h de antecedência: sem penalidade.
  - Cancelamento entre 24h e 2h: **meia ocorrência**.
  - Cancelamento com < 2h ou falta sem aviso (no-show): **1 ocorrência**.
- **Academia:** a mesma lógica vale para cancelamentos tardios de turnos já confirmados.
- As ocorrências contam numa **janela móvel de 90 dias**:

| Ocorrências | Consequência | Aviso |
|---|---|---|
| 1 | Advertência | Push + e-mail explicando a regra e quantas ocorrências faltam para a suspensão |
| 2 | **Último aviso** | Push + e-mail + banner fixo no app: "na próxima ocorrência sua conta será suspensa por 15 dias" |
| 3 | Suspensão de 15 dias | Notificação com data de retorno |
| 3ª suspensão em 12 meses | Análise do admin / banimento | Contato do admin |

- **Aviso com antecedência:**
  - As regras aparecem no cadastro, e o professor precisa aceitá-las.
  - Na tela de cancelamento, o app mostra o impacto antes de confirmar: *"Este cancelamento gera 1 ocorrência"*.
  - O contador de ocorrências fica sempre visível no perfil.
- **Contestação:** o professor pode contestar uma ocorrência em até 7 dias (ex.: atestado médico). O admin analisa.

### RN-09 Avaliações
- Só turnos `concluido` podem ser avaliados. Cada lado tem **7 dias**.
- **Avaliação às cegas:** as notas só aparecem quando os dois avaliam ou quando o prazo acaba.
- Nota geral **1–10** + critérios (1–10):
  - **Academia avalia professor:** pontualidade, conhecimento técnico, atendimento aos alunos, comportamento/profissionalismo, educação/comunicação, apresentação/uniforme, cumprimento das regras.
  - **Professor avalia academia:** pagamento em dia, estrutura, equipamentos, tratamento da equipe, turno condizente com a descrição, segurança/higiene, organização.
- Comentário opcional (até 500 caracteres) + tags rápidas. O avaliado tem direito a uma resposta pública. Avaliações abusivas podem ser denunciadas.
- **Nota exibida:** média bayesiana com peso maior para avaliações recentes. Com menos de 3 avaliações, aparece o selo "Novo" no lugar da nota.

### RN-10 Chat
- Liberado a partir da primeira proposta.
- Telefones, e-mails e links são **mascarados automaticamente** até a contratação ser confirmada.

### RN-11 Privacidade (LGPD)
- Consentimentos registrados (termos, privacidade, regras de penalidade).
- Documentos ficam em armazenamento privado.
- O usuário pode exportar e excluir a conta. O histórico de avaliações é anonimizado na exclusão.

## 4. Escopo do MVP

**Entra:** RN-01 a RN-11, notificações push + e-mail, painel admin (aprovações, ocorrências, contestações, moderação, assinaturas).
**Fica para depois:**
- **V1.1:** WhatsApp, turnos SOS com destaque, favoritos/"contratar novamente".
- **V2:** relatórios avançados, multiunidades, verificação automática de CREF/biometria.
- **V3:** match por IA, gamificação.

## 5. Planos (proposta inicial — ver seção 6 para referências)

| | **Grátis** | **Essencial** | **Pro** ⭐ | **Rede** |
|---|---|---|---|---|
| Preço mensal | R$ 0 | **R$ 89** | **R$ 189** | **a partir de R$ 390** |
| Preço anual (2 meses grátis) | — | R$ 890/ano | R$ 1.890/ano | sob consulta |
| Contratações confirmadas/mês | 1ª grátis (teste) | até 4 | até 15 | ilimitadas |
| Contratação avulsa extra | R$ 39 | R$ 29 | R$ 19 | — |
| Unidades / gestores | 1 / 1 | 1 / 1 | 1 / 3 | várias / ilimitados |
| Publicar turnos, buscar, negociar | ✅ | ✅ | ✅ | ✅ |
| Aceite automático | — | — | ✅ | ✅ |
| Turnos urgentes/SOS em destaque (V1.1) | — | — | ✅ | ✅ |
| Favoritos e banco de professores | — | ✅ | ✅ | ✅ |
| Relatórios de horas/custos | — | básico | completo | completo + por unidade |

**Lançamento em Vitória — "Academias Fundadoras":** as 30 primeiras assinantes pagam **50% nos 3 primeiros meses** e mantêm o preço travado por 12 meses.

## 6. Referências de mercado usadas na precificação (valores aproximados, a validar)

| Referência | Modelo | Faixa de preço |
|---|---|---|
| Sistemas de gestão de academias (Tecnofit, Next Fit, EVO) | Assinatura por porte | ~R$ 150 – R$ 600+/mês |
| Plataformas de freelancers por turno (ex.: UmFreela) | Assinatura + taxa por vaga | ~R$ 35/mês + R$ 1,50 – R$ 4 por vaga |
| GetNinjas | O profissional paga para desbloquear contato | Gratuito para quem contrata |
| Indeed Flex / staffing | Margem sobre a hora trabalhada | 20–40% sobre a hora |

**Lógica do preço:**
- Uma academia que cobre 4 turnos de 3h a ~R$ 40/h gasta ~R$ 480/mês com professores. Os R$ 89 do Essencial representam ~18% desse valor, abaixo da margem de uma agência de staffing.
- O Pro fica no patamar de um sistema de gestão de entrada, que o gestor já tem como referência.
- **Validar com 10–15 academias de Vitória antes do lançamento** (entrevistas da Fase 0).

## 7. Métricas de sucesso (primeiros 6 meses)
- Turnos publicados → preenchidos (meta: ≥ 70%)
- Tempo médio até a contratação (meta: < 6h)
- Conversão do teste grátis em assinatura (meta: ≥ 25%)
- Taxa de faltas (meta: < 3%)
- Nota média dos dois lados e taxa de avaliação (meta: ≥ 60% dos turnos avaliados)
- Cancelamento de assinaturas (churn) mensal (meta: < 6%)

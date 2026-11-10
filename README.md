# TrainerMatch 🏋️‍♂️

Plataforma inteligente de contratação pontual e recorrente de instrutores e professores de educação física para academias e estúdios fitness.

---

## 🚀 Tecnologias

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router, Server-Side Rendering, Serverless Route Handlers)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS (Dark/Light mode automático, paleta moderna e responsiva)
- **Banco de Dados & ORM:** Prisma ORM com SQLite (ambiente local) e PostgreSQL (deploy em nuvem)
- **Ícones:** Lucide React (Ícones outline elegantes e leves)
- **Gerenciamento de Estado:** Zustand (armazenamento reativo com sincronização persistente)
- **Segurança & Autenticação:** Criptografia Bcrypt com sessões seguras em cookies HTTP

---

## ✨ Principais Funcionalidades

### 🎓 Para Professores & Instrutores:
- **Feed de Vagas em Tempo Real:** Visualização de aulas abertas com filtro de modalidade, distância (raio de cobertura de 10km a 100km) e cálculo de deslocamento.
- **Detecção de Conflitos de Horário:** Alertas visuais preventivos contra sobreposição de horários e tempo de deslocamento insuficiente entre academias.
- **Agenda com Calendário Integrado:** Navegação mensal e foco no dia de hoje com marcadores visuais de status (Aulas Contratadas, Disponibilidade, Aulas Canceladas e Folgas).
- **Grade Semanal Flexível:** Cadastro de múltiplos períodos livres no mesmo dia com persistência e preservação automática de aulas já contratadas.
- **Auditoria de Cancelamento:** Cancelamento justificado pré-início de aulas com histórico completo.
- **Gestão de Perfil:** Envio de diplomas e certificados (limite de 3MB), múltiplas chaves PIX com definição de chave padrão, visualização de avaliações e pilares.
- **Atalho no Celular:** Modal interativa orientando a fixação como Web App (PWA) no Safari (iOS) e Chrome (Android).

### 🏢 Para Academias:
- **Publicação Ágil de Aulas:** Criação de turnos com seleção de modalidade, data e faixas de horário.
- **Radar de Professores:** Busca por modalidade e localização com envio direto de propostas aos profissionais disponíveis.
- **Gestão de Contratações:** Validação de check-in, histórico e cancelamento com motivos operacionais e auditoria.

---

## 🛠️ Como Executar Localmente

1. **Instalar dependências:**
   ```bash
   cd prototype
   npm install
   ```

2. **Sincronizar Banco de Dados:**
   ```bash
   npx prisma db push
   ```

3. **Iniciar Servidor de Desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse no navegador: [http://localhost:3000](http://localhost:3000)

---

## 📦 Deploy na Vercel

1. Suba este repositório para o seu GitHub.
2. No painel da [Vercel](https://vercel.com), importe o projeto e selecione `prototype` como o **Root Directory**.
3. Crie um banco **Vercel Postgres (Neon)** na aba *Storage* e conecte ao projeto.
4. O build será realizado automaticamente na nuvem via `prisma generate && next build`.

# Plataforma de gestão de leads (mini-CRM)

Transformar os 4 formulários existentes (Contato, Vender/Avaliação, Match IA, Agendar visita) em um **CRM único** com deduplicação, histórico e exportação — tudo dentro do que o Lovable Cloud já oferece (sem custos extras).

## O que muda para o visitante
Nada. Os formulários continuam iguais.

## O que muda para você (admin)

### 1. Tabela única de contatos (`crm_contacts`)
- Cada pessoa vira **um único registro**, identificada por telefone (normalizado: só dígitos) **ou** e-mail.
- Campos: nome, telefone, e-mail, origem inicial, tags, status do funil (novo / em contato / qualificado / visitando / proposta / fechado / perdido), score IA (quente/morno/frio), última interação, dono.
- Se a pessoa preencher outro formulário depois, **atualiza** o registro existente e adiciona um evento no histórico — nunca duplica.

### 2. Timeline automática (`crm_events`)
Cada formulário, mudança de status, e-mail enviado, nota manual ou qualificação IA cria um evento com data, tipo e payload. Exibido como linha do tempo na ficha do contato.

### 3. Migração dos leads atuais
- `contact_leads`, `seller_leads`, `match_leads` (e visitas agendadas) são **mantidos** como histórico bruto.
- Um job de migração roda 1x e popula `crm_contacts` + `crm_events` deduplicando.
- A partir daí, todos os formulários gravam no destino antigo **e** disparam o "merge" no CRM via trigger.

### 4. Painel CRM novo (`/admin/crm`)
- **Lista** com busca, filtros (status, score, origem, tag, período), ordenação por última interação.
- **Ficha do contato** com:
  - Dados de contato + botões WhatsApp / e-mail / ligar.
  - Timeline completa (todos os formulários, notas, mudanças de status).
  - Kanban-style status changer.
  - Tags editáveis.
  - Notas manuais.
  - Botão "Qualificar com IA" (reaproveita a função `qualify-lead`).
- **Exportação CSV** dos contatos filtrados (1 clique).
- **Métricas** no topo: total, novos na semana, taxa de conversão, leads quentes pendentes.

### 5. Substituição gradual das abas antigas
As abas atuais (Leads / Captações / Match IA) viram **filtros** dentro do CRM (origem = contato / avaliacao / match). Mantemos os links antigos funcionando.

## Detalhes técnicos

**Banco (1 migration):**
```
crm_contacts(id, name, phone_normalized UNIQUE, email_normalized UNIQUE,
  raw_phone, raw_email, status, ai_score, ai_summary, tags text[],
  source_first, source_last, owner_id, last_interaction_at, created_at, updated_at)

crm_events(id, contact_id FK, type, source, title, payload jsonb,
  created_by, created_at)
```
RLS: apenas admins (`has_role`) leem/escrevem. Service role total.

**Função `merge_lead(name, phone, email, source, payload jsonb)`** (SECURITY DEFINER):
1. Normaliza telefone (só dígitos, últimos 11) e email (lower/trim).
2. Procura contato por phone_normalized OU email_normalized.
3. Insere ou atualiza; preenche campos vazios; atualiza `last_interaction_at` e `source_last`.
4. Insere evento em `crm_events`.
5. Retorna contact_id.

**Triggers** em `contact_leads`, `seller_leads`, `match_leads` (AFTER INSERT) chamam `merge_lead`. Garante que qualquer formulário — atual ou futuro — alimenta o CRM automaticamente.

**Frontend:**
- `src/pages/admin/AdminCrm.tsx` (lista + filtros + export CSV).
- `src/pages/admin/AdminCrmContact.tsx` (ficha + timeline + notas).
- Rota `/admin/crm` e `/admin/crm/:id` adicionadas em `App.tsx` e `AdminLayout.tsx`.
- Export CSV client-side (sem dependência nova).

**Custo:** zero. Tudo roda no Postgres/Edge/Storage já incluídos no Lovable Cloud. IA só consome crédito quando você clicar em "Qualificar".

## Fora desta entrega (posso fazer depois se quiser)
- E-mail automático de follow-up por status.
- Integração com Google Calendar nas visitas.
- Pipeline kanban arrastável (drag-and-drop).
- Relatório PDF mensal.

Quer que eu siga com isso exatamente, ou ajustar algo (campos, status do funil, nome da aba)?

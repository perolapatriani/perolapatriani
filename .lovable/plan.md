## Objetivo

Você cadastra um imóvel → o sistema gera artigo SEO, imagens 1080x1350, legenda/hashtags/CTA, publica no blog, agenda e publica no Instagram (Feed + Stories), compartilha em outras redes e registra métricas.

## O que já existe (aproveitamos)

- CMS de posts com agendamento automático (`posts` + cron `publish_scheduled_posts`)
- Geração de conteúdo social por IA (`generate-social-content`, `generate-property-copy`)
- Gerador de cards Instagram/TikTok em canvas (`InstagramCardDialog`, `BlogCardDialog`)
- CRM unificado com origem de lead e timeline
- Storage `media` para imagens

## Realidade sobre publicação automática

Publicar no Instagram sem intervenção exige uma conta **Instagram Business** ligada a uma **Página do Facebook** e um app Meta aprovado (permissões `instagram_content_publish`, `pages_show_list`). Isso é configuração sua no painel da Meta — eu construo toda a integração, mas o token vem de você.

- **Instagram Feed + Stories**: suportado pela Graph API → automação real.
- **Facebook Page**: suportado → automação real.
- **Threads**: API própria da Meta, suportada → automação real (mesmo fluxo de token).
- **Pinterest**: API separada, com aprovação própria — deixo para uma fase posterior ou como "compartilhar manual".

Cloudflare Images não é necessário: uso o Storage do próprio backend (gratuito, já configurado). Para IA, uso a IA integrada do Lovable ou sua chave Gemini já existente em vez da OpenAI (mesma qualidade, sem custo extra) — se preferir OpenAI, você fornece a chave.

## Fases

### Fase 1 — Motor de conteúdo automático
- Tabela `automation_jobs` (fila) + `social_posts` (post gerado, canal, status, agendamento, métricas).
- Edge function `auto-publish-property`: ao publicar um imóvel, gera artigo SEO completo (H1, H2, FAQ, palavras-chave, meta description, links internos), cria o post no blog com slug amigável e artigos relacionados.
- Renderização das imagens 1080x1350 no servidor, salvas no Storage.
- Sitemap regenerado automaticamente incluindo imóveis e artigos.

### Fase 2 — SEO completo no site
- JSON-LD por página: `RealEstateListing`, `Article`, `FAQPage`, `BreadcrumbList`.
- Breadcrumbs visuais, Open Graph e Twitter Cards por rota, linkagem interna automática entre artigos e imóveis.

### Fase 3 — Publicação nas redes
- Tela **Integrações** no admin para conectar Instagram Business, Facebook, Threads, Meta Pixel, Google Analytics e Search Console.
- Edge functions `publish-instagram` (Feed + Stories com link), `publish-facebook`, `publish-threads`.
- Cron a cada 15 min processa a fila de posts agendados.

### Fase 4 — Métricas e painel
- Cron diário puxa alcance, curtidas, comentários e cliques da Graph API para `social_posts`.
- Dashboard: calendário editorial, agendados, publicados, pendentes, falhas, gráficos de desempenho e leads por origem, com botão de gerar/publicar manualmente.

## Detalhes técnicos

- Banco: `social_posts` (canal, status, `scheduled_for`, `published_at`, `external_id`, `reach`, `likes`, `comments`, `clicks`), `automation_jobs`, `integration_settings` (tokens em secrets, nunca no banco).
- Imagens geradas server-side e servidas por URL pública — a Graph API exige URL acessível.
- Todas as functions com validação de entrada, RLS admin-only e tratamento de erro sem vazar respostas de API.
- Cron via `pg_cron` + `pg_net`, já habilitados.

## Ordem de entrega

Começo pela Fase 1 + 2 (funciona sozinho, sem depender de aprovação da Meta). Depois, quando você tiver o app Meta criado, ligamos a Fase 3 e 4.
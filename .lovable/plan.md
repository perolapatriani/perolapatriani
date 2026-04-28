# Site Premium — Pérola Patriani Consultoria Imobiliária

Site institucional boutique de alto padrão com painel administrativo para gestão de imóveis, lançamentos, bairros, depoimentos e blog. Captação de leads 100% via WhatsApp (13) 99129-6030.

## Identidade visual

Paleta extraída do logo (rosa blush, rosé queimado, nude perolado, champagne, azul serenity, azul névoa, branco acetinado, grafite suave) configurada como design tokens HSL no `index.css` e `tailwind.config.ts`.

Tipografia editorial:
- **Cormorant Garamond** (serifada display) para headlines
- **Inter** (sans humanista) para corpo e UI
- **Italiana** opcional para acentos editoriais

Estética: clean luxury, glassmorphism sutil, gradientes rosa→azul suaves, bordas arredondadas, sombras leves rosadas, microinterações elegantes (fade-in, scale, parallax leve), muito whitespace, grids editoriais.

O logo enviado será adicionado em `src/assets/` e usado no header (versão compacta) e footer.

## Páginas e rotas

```text
/                      Home (todas as seções abaixo)
/imoveis               Listagem com filtros
/imoveis/:slug         Ficha completa do imóvel
/lancamentos           Grade de empreendimentos
/lancamentos/:slug     Ficha do lançamento
/bairros               Grade de bairros
/bairros/:slug         Imóveis filtrados por bairro
/sobre                 Bio Pérola Patriani
/blog                  Listagem de posts
/blog/:slug            Post individual
/contato               Formulário + dados
/auth                  Login admin
/admin                 Painel (protegido)
```

## Estrutura da Home

1. **Header fixo** translúcido — logo + menu (Início, Imóveis, Lançamentos, Bairros, Sobre, Blog, Contato) + CTA "Fale comigo". Glass blur ativa no scroll. Menu mobile com drawer animado.
2. **Hero** — headline "Seu próximo imóvel merece mais que uma busca. Merece estratégia.", subheadline consultiva, CTAs "Ver imóveis" / "Falar com Pérola", imagem premium de fundo com gradiente rosa+azul, **widget de busca flutuante glassmorphism** (tipo, finalidade, bairro, faixa de valor, código).
3. **Imóveis em destaque** — carrossel premium (Embla) com cards: foto grande, badge Destaque/Novo, preço, bairro, metragem, dormitórios, CTA "Ver imóvel".
4. **Encontre por bairro** — grade visual editorial com 10 bairros do litoral paulista (Centro, Cibratel, Belas Artes, Suarão, Praia dos Sonhos, Bopiranga, Agenor de Campos, Mongaguá, Praia Grande, Peruíbe), overlay suave + hover refinado.
5. **Lançamentos** — layout editorial: imagem grande à esquerda, nome/localização/diferenciais à direita, CTA "Quero conhecer".
6. **Serviços** — 6 cards com ícones finos (Lucide): Compra, Venda, Locação, Consultoria de Investimento, Avaliação, Captação Estratégica.
7. **Por que escolher Pérola** — bloco institucional + luxury stats (imóveis atendidos, clientes assessorados, vendas concluídas, satisfação).
8. **Sobre / Bio** — foto + texto sofisticado em duas colunas editoriais.
9. **Depoimentos** — slider premium com cards glassmorphism, estrelas discretas.
10. **Blog** — 3 cards de conteúdo destacado em grid editorial.
11. **CTA final** — "Seu imóvel ideal existe. Vamos encontrá-lo com estratégia." + botão "Agendar atendimento" (WhatsApp).
12. **Footer** — logo, navegação, contato, WhatsApp, Instagram (@perolapatriani.imoveis), TikTok (@pérolapatriani), YouTube, CRECI, endereço, copyright.

**Botão flutuante WhatsApp** fixo no canto inferior direito em todas as páginas.

## Captação de leads (WhatsApp)

Todos os pontos de conversão (CTAs principais, widget de busca, formulário de contato, "Falar sobre este imóvel" nas fichas, "Quero conhecer" nos lançamentos, "Agendar atendimento") montam mensagem pré-preenchida contextual e abrem `https://wa.me/5513991296030?text=...`.

Exemplos de mensagem:
- Widget de busca: "Olá Pérola! Procuro [tipo] para [finalidade] em [bairro], faixa [valor]."
- Ficha de imóvel: "Olá Pérola! Tenho interesse no imóvel [código] — [título]."
- CTA final: "Olá Pérola! Gostaria de agendar um atendimento consultivo."

## Backend (Lovable Cloud) e painel admin

Tabelas com RLS:

| Tabela | Conteúdo |
|---|---|
| `properties` | imóveis (título, slug, tipo, finalidade, preço, bairro, dormitórios, suítes, vagas, metragem, descrição, código, status, destaque, fotos[]) |
| `launches` | empreendimentos (nome, slug, localização, diferenciais, data entrega, fotos[], status) |
| `neighborhoods` | bairros (nome, slug, descrição, imagem) |
| `testimonials` | depoimentos (nome, texto, nota, foto) |
| `posts` | blog (título, slug, capa, resumo, conteúdo markdown, publicado_em) |
| `user_roles` | papéis (`admin`) — tabela separada com função `has_role` SECURITY DEFINER |

**Storage bucket** público `media` para fotos de imóveis, lançamentos, bairros, capas de blog.

**Autenticação**: e-mail/senha (auto-confirm ativado), rota `/auth`. Acesso ao `/admin` exige role `admin`. Primeiro admin é cadastrado via SQL após criação da conta da Pérola.

**Painel `/admin`** com abas para CRUD de cada tabela: lista, criar, editar, excluir, upload de imagens (drag-and-drop), marcar destaque, publicar/despublicar.

**Leitura pública** (RLS): qualquer visitante lê imóveis/lançamentos/bairros/depoimentos/posts publicados. **Escrita** restrita a admin.

## Funcionalidades técnicas

- 100% responsivo (mobile-first, breakpoints sm/md/lg/xl)
- Animações suaves (Tailwind keyframes: fade-in, scale-in, slide), Intersection Observer para reveal on scroll
- Lazy load de imagens (`loading="lazy"`) e rotas (React.lazy + Suspense)
- SEO: meta tags por rota com react-helmet-async, Open Graph, sitemap básico, structured data JSON-LD para imóveis
- Loading states elegantes (skeletons em tom champagne)
- Acessibilidade: contraste AA, foco visível, aria-labels, navegação por teclado
- Validação de inputs com Zod nos formulários
- React Query para cache e fetching

## Stack técnica

React 18 + Vite + TypeScript + Tailwind + shadcn/ui + Embla Carousel + Lucide Icons + React Router + React Hook Form + Zod + React Query + React Helmet Async + Lovable Cloud (Supabase: Postgres, Auth, Storage).

## Etapas de implementação

1. Configurar design system (tokens HSL, fontes, animações) e adicionar logo aos assets
2. Layout base: Header fixo com glass scroll, Footer premium, botão WhatsApp flutuante, layout responsivo
3. Ativar Lovable Cloud, criar tabelas + RLS + bucket de storage + auth + role admin
4. Construir Home completa (12 seções) com dados seed iniciais
5. Páginas de listagem e fichas (Imóveis, Lançamentos, Bairros, Blog) consumindo o banco
6. Página Sobre, Contato e helper de WhatsApp com mensagens contextuais
7. Auth (`/auth`) + painel admin (`/admin`) com CRUD completo e upload de imagens
8. Polimento final: SEO, animações scroll-reveal, lazy loading, QA responsivo

Após implementação, a Pérola cria a conta dela em `/auth` e eu promovo para admin via SQL — então ela pode gerenciar todo o conteúdo pelo painel.
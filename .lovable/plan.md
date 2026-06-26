## Reposicionar "Vender seu imóvel" como "Descubra quanto vale seu imóvel"

Mudança de copy + foco: em vez de pedir "cadastre seu imóvel para venda" (alto compromisso), oferecer **avaliação gratuita de valor** (baixo compromisso, lead magnet clássico que converte muito mais).

### Mudanças de texto

**`src/components/home/SellWithUs.tsx`** (seção da home)
- Eyebrow: "Para proprietários" → "Avaliação gratuita"
- Título: "Quer vender seu imóvel com estratégia?" → "Descubra quanto vale o seu imóvel"
- Subtítulo: focar em "análise de valor de mercado gratuita e sem compromisso, baseada em dados reais do litoral paulista"
- Bullets: "Análise de valor em até 24h", "Comparativo com imóveis similares vendidos", "Sem compromisso de venda", "Relatório personalizado por WhatsApp"
- CTA primário: "Cadastrar meu imóvel" → "Quero saber quanto vale"
- Citação lateral: "Saber o valor real é o primeiro passo para decidir."

**`src/pages/Vender.tsx`**
- `<Seo title>`: "Descubra quanto vale seu imóvel · Pérola Patriani"
- `<Seo description>`: avaliação gratuita de imóveis no litoral paulista
- H1: "Descubra quanto vale o seu imóvel"
- Parágrafo: "Receba uma avaliação gratuita e sem compromisso..."
- Botão submit: "Quero vender com a Pérola" → "Receber avaliação gratuita"
- Toast: "Cadastro recebido!" → "Pedido de avaliação recebido!"
- Aside "Por que vender comigo?" → "Como funciona a avaliação":
  - "Análise comparativa com vendas recentes da região"
  - "Avaliação enviada por WhatsApp em até 24h"
  - "Você decide se quer vender ou não — sem pressão"
- Mensagem do WhatsApp ajustada para "Quero receber avaliação do meu imóvel"

**`src/components/layout/Header.tsx`** (se houver link "Vender")
- Trocar label para "Avaliar imóvel" (verificar e ajustar)

**`public/llms.txt`**
- Linha `/vender`: "Avaliação gratuita de imóveis para proprietários no litoral paulista."

### O que NÃO muda
- Rota `/vender` permanece (evita quebrar links já compartilhados)
- Tabela `seller_leads` e edge function `notify-lead` — mesmos campos, só muda o `source` para `avaliacao_gratuita` para diferenciar no admin
- Estrutura do formulário permanece (os mesmos dados são necessários pra avaliar)

Posso seguir?

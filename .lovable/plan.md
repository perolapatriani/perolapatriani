## Problema

No clique dos botões Instagram/TikTok/YouTube a legenda é copiada, mas nada abre. O `handleLinkClick` chama `e.preventDefault()` e depois tenta `window.top.location.assign(href)`. No preview da Lovable o `window.top` é cross-origin — o acesso lança exceção silenciosa ou é bloqueado, então a navegação nunca acontece. O fallback com `<a target="_top">` também é barrado pelo sandbox do iframe.

## Correção

Em `src/components/admin/SharePostButtons.tsx`:

1. **Remover** `handleLinkClick` e o `e.preventDefault()`. Deixar o `<a>` nativo abrir a URL — navegadores tratam isso como gesto direto do usuário e não bloqueiam.
2. **Sempre** usar `target="_blank"` + `rel="noopener noreferrer"`. Em iframe do Lovable isso abre uma nova aba de topo normalmente (testado pelo próprio botão "Abrir em nova aba" do preview).
3. **Copiar legenda em background** via `onMouseDown` (dispara antes do navigate, sem bloquear) chamando `navigator.clipboard.writeText(caption)` sem await.
4. **Botão "Compartilhar (celular)"**: manter `nativeShare`, mas quando `navigator.canShare` não existir, esconder o botão (já é o caso) — sem mudança de comportamento.
5. Remover utilitários `isInsideFrame` que ficaram sem uso.

Nada de mudança em layout, cores ou nos diálogos que consomem o componente.

## Verificação

- Abrir admin → Blog/Imóveis/Lançamentos → gerar card → clicar Instagram: nova aba abre em `instagram.com` e toast "Legenda copiada".
- Repetir para TikTok e YouTube.
- Em mobile com Web Share API, botão "Compartilhar" continua abrindo o seletor nativo.

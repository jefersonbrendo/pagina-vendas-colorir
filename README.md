# Bonecas de Papel para Colorir — página para o público 30-65+

Página de vendas estática (HTML, CSS e JavaScript puro), sem build. É só publicar a pasta
na Vercel ou no Netlify (os dois já estão configurados: `vercel.json` e `netlify.toml`).

Para ver no computador: abra um terminal nesta pasta, rode `python -m http.server 8000`
e acesse http://localhost:8000.

## Onde trocar cada coisa

| O quê | Onde |
|---|---|
| **Links do checkout** (um por plano) | `index.html`, bloco `window.CONFIG` no topo do `<head>`: `checkout.plano1`, `plano2`, `plano3` |
| **ID do Pixel da Meta** | `index.html`, `window.CONFIG.metaPixelId` **e** na tag `<noscript>` logo depois do `<body>` (`id=SEU_PIXEL_ID_META`) |
| **Pixel da Utmify** | `index.html`, `window.CONFIG.utmifyPixelId`. O script de UTMs da Utmify já está no `<head>` e não precisa de ID |
| **Preços, nomes e itens dos planos** | `index.html`, seção `<!-- 7. OFERTA E PREÇOS -->`. Os nomes e itens estão entre `[colchetes]`. Se mudar um preço, mude também o `data-price` do botão do plano (é o valor enviado ao Pixel da Meta) |
| **Número de páginas** | `index.html`, seção `<!-- 4. O QUE VOCÊ RECEBE -->`: troque `[XXX]` |
| **Imagens** | Coloque os arquivos na pasta `img/` com os nomes abaixo. Enquanto um arquivo não existir, a página mostra um quadro tracejado com o nome que falta |
| **WhatsApp e e-mail de suporte** | `index.html`, rodapé (`<!-- 11. RODAPÉ -->`): link `https://wa.me/55XXXXXXXXXXX` (só números, com 55 e DDD), texto do número e e-mail |
| **Nome da marca** | `index.html`, rodapé: `[NOME DA SUA MARCA]` |
| **Política de privacidade e termos** | `privacidade.html` e `termos.html` |

Os links e IDs ficam todos no `window.CONFIG`. Enquanto estiverem como `SEU-...`, os pixels não
carregam e os botões dos planos só levam até a seção de preços.

## Imagens (WebP, com estes nomes)

| Arquivo | O que mostrar | Tamanho |
|---|---|---|
| `img/hero-bonecas.webp` | Boneca colorida com roupinhas recortadas, lápis de cor e tesoura sobre a mesa | 1200x900 (4:3) |
| `img/memoria-caixa.webp` | Caixa de sapato antiga com roupinhas de papel (opcional) | 1200x800 (3:2) |
| `img/para-voce.webp` | Mulher de uns 55 anos colorindo à mesa, com uma xícara de café | 1000x750 (4:3) |
| `img/com-a-neta.webp` | Avó e neta recortando bonecas juntas | 1000x750 (4:3) |
| `img/amostra-1.webp` a `amostra-4.webp` | Páginas do material em traço para colorir, temas diferentes | 800x1000 (4:5) |
| `img/prova-1.webp` a `prova-4.webp` | Prints de comentários **reais** das redes sociais | até 800 de largura |

Dica de peso: a imagem do topo deve ficar abaixo de ~150 KB para a página continuar rápida no 4G.
Se uma imagem não tiver o formato indicado, ela é cortada para caber no quadro.
Se quiser mais ou menos prints, copie ou apague um bloco `<figure>` na seção 6.

## Rastreamento

- **Pixel da Meta:** envia `PageView` ao abrir a página e `InitiateCheckout` (com valor e moeda)
  no clique dos botões dos planos, antes de ir para o checkout.
- **Utmify:** o script de UTMs e o pixel carregam cedo, no `<head>`. No painel da Utmify, configure
  a regra de Initiate Checkout **por URL** com o domínio do seu checkout (ex.: `pay.lowify.com.br`).
  Se a Utmify também estiver enviando eventos para o mesmo Pixel da Meta, confira no Gerenciador de
  Eventos se o InitiateCheckout não está contando em dobro.
- **Parâmetros:** todos os parâmetros do endereço da página (UTMs, `fbclid` etc.) são repassados
  para o link do checkout (`js/main.js`).
- Não coloque `onclick` nos botões de compra: o pixel da Utmify chama o `onclick` no lugar de
  abrir o checkout, e o botão fica travado.

## Botões

Todos dizem "QUERO MINHAS BONECAS". Os do topo, do meio e do fim levam até os planos (`#planos`).
Os dos cartões de preço levam ao checkout do plano.

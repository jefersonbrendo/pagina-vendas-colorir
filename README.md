# Bonecas de Papel para Colorir — página para o público 30-65+

Página de vendas estática (HTML, CSS e JavaScript puro), sem build. É só publicar a pasta
na Vercel ou no Netlify (os dois já estão configurados: `vercel.json` e `netlify.toml`).

Para ver no computador: abra um terminal nesta pasta, rode `python -m http.server 8000`
e acesse http://localhost:8000.

## Onde trocar cada coisa

| O quê | Onde |
|---|---|
| **Links do checkout** | `index.html`, bloco `window.CONFIG` no topo do `<head>`: `checkout.alegria` (R$ 24,90), `checkout.alegriaOferta` (R$ 16,90, do pop-up) e `checkout.basico` (R$ 9,90) |
| **ID do Pixel da Meta** | `index.html`, `window.CONFIG.metaPixelId` **e** na tag `<noscript>` logo depois do `<body>` (`id=SEU_PIXEL_ID_META`) |
| **Pixel da Utmify** | `index.html`, `window.CONFIG.utmifyPixelId`. O script de UTMs da Utmify já está no `<head>` e não precisa de ID |
| **Preços, nomes e benefícios dos pacotes** | `index.html`, seção `<!-- 7. OFERTA E PREÇOS -->` (cards) e o `<dialog id="oferta">` no fim da página (pop-up). Se mudar um preço, mude também o `data-price` do link (é o valor enviado ao Pixel da Meta) |
| **Barra "A promoção termina hoje"** | `index.html`, logo depois do `<body>` (`<div class="topo-oferta">`). A data é preenchida sozinha pelo `js/main.js` com o dia de hoje (horário de Brasília). Para tirar a barra, apague esse bloco |
| **Imagens** | Coloque os arquivos na pasta `img/` com os nomes abaixo. Enquanto um arquivo não existir, a página mostra um quadro tracejado com o nome que falta |
| **WhatsApp e e-mail de suporte** | `index.html`, rodapé (`<!-- 11. RODAPÉ -->`): link `https://wa.me/55XXXXXXXXXXX` (só números, com 55 e DDD), texto do número e e-mail |
| **Nome da marca** | `index.html`, rodapé: `[NOME DA SUA MARCA]` |
| **Política de privacidade e termos** | `privacidade.html` e `termos.html` |

Os links e IDs ficam todos no `window.CONFIG`. Enquanto estiverem como `SEU-...`, os pixels não
carregam e os links de checkout só levam até a seção de preços.

## Imagens (WebP, com estes nomes)

| Arquivo | O que mostrar | Tamanho |
|---|---|---|
| `img/hero-bonecas.webp` | Boneca colorida com roupinhas recortadas, lápis de cor e tesoura sobre a mesa | 1200x900 (4:3) |
| `img/com-a-neta.webp` | ✅ já colocada: avó e neta recortando juntas | 1000x750 (4:3) |
| `img/amostra-1.webp` a `amostra-4.webp` | ✅ já colocadas (capas dos kits Bonecas Prontas, Realistas, Pets e Barbies). Aparecem em grade em "O que você recebe"; para mais, copie um bloco `<figure>` | 750x1000 (3:4) |
| `img/prova-1.webp` a `prova-4.webp` | Prints de comentários **reais** das redes sociais (✅ `prova-1` e `prova-2` já colocadas). Aparecem inteiros, sem corte | qualquer formato, até ~900 de largura |

Dica de peso: a imagem do topo deve ficar abaixo de ~150 KB para a página continuar rápida no 4G.
Se uma imagem não tiver o formato indicado, ela é cortada para caber no quadro.
Os prints aparecem no carrossel da seção 6; para mais ou menos, copie ou apague um bloco `car-slide`.

## Rastreamento

- **Pixel da Meta:** envia `PageView` ao abrir a página e `InitiateCheckout` (com valor e moeda)
  no clique de qualquer link de checkout (card do Alegria e os dois links do pop-up), antes de ir para o checkout.
- **Utmify:** o script de UTMs e o pixel carregam cedo, no `<head>`. No painel da Utmify, configure
  a regra de Initiate Checkout **por URL** com o domínio do seu checkout (ex.: `pay.lowify.com.br`).
  Se a Utmify também estiver enviando eventos para o mesmo Pixel da Meta, confira no Gerenciador de
  Eventos se o InitiateCheckout não está contando em dobro.
- **Parâmetros:** todos os parâmetros do endereço da página (UTMs, `fbclid` etc.) são repassados
  para o link do checkout (`js/main.js`).
- Não coloque `onclick` nos botões de compra: o pixel da Utmify chama o `onclick` no lugar de
  abrir o checkout, e o botão fica travado.

## Pacotes e pop-up (mesma lógica da página principal)

- **Pacote Alegria — R$ 24,90:** o botão do card leva direto ao checkout (`checkout.alegria`).
- **Pacote Básico — R$ 9,90:** o botão do card **abre um pop-up** oferecendo o Pacote Alegria por R$ 16,90:
  - "SIM! QUERO O PACOTE ALEGRIA POR R$ 16,90" leva a `checkout.alegriaOferta`;
  - "Não, obrigada. Quero apenas o Básico por R$ 9,90" leva a `checkout.basico`.
- O pop-up fecha no X, na tecla Esc ou tocando fora dele.

Os botões do topo, do meio e do fim dizem "QUERO MINHAS BONECAS" e levam até os pacotes (`#planos`).

A **barra fixa de compra** (rodapé da tela, `<div class="barra-compra">`) também leva aos pacotes. Ela aparece
depois que a pessoa passa do botão do topo e some quando os pacotes ou a chamada final estão na tela.

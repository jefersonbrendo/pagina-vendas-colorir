/* Checkout e rastreamento.
   - Leva todos os parâmetros do endereço da página (UTMs, fbclid etc.) para o link do checkout.
   - Dispara InitiateCheckout no Pixel da Meta antes de ir para o checkout.
   Os links e IDs ficam em window.CONFIG, no topo do index.html. */
(function () {
  var config = window.CONFIG || {};
  var checkout = config.checkout || {};
  var pageParams = new URLSearchParams(window.location.search);

  // Junta os parâmetros da página ao link do checkout, sem repetir os que já estiverem nele
  // (ex.: os que o script da Utmify adicionar).
  function withPageParams(url) {
    try {
      var target = new URL(url, window.location.href);
      pageParams.forEach(function (value, key) {
        if (!target.searchParams.has(key)) target.searchParams.append(key, value);
      });
      return target.toString();
    } catch (e) {
      return url;
    }
  }

  function isPlaceholder(url) {
    return !url || /SEU-CHECKOUT/.test(url);
  }

  // Pop-up da oferta: abre no botão do Pacote Básico (mesma lógica da página principal)
  var offer = document.getElementById('oferta');
  function closeOffer() {
    if (offer && offer.open) offer.close();
  }
  if (offer && typeof offer.showModal === 'function') {
    Array.prototype.forEach.call(document.querySelectorAll('[data-open-oferta]'), function (button) {
      button.addEventListener('click', function () {
        offer.showModal();
      });
    });
    Array.prototype.forEach.call(offer.querySelectorAll('[data-close-oferta]'), function (button) {
      button.addEventListener('click', closeOffer);
    });
    // Tocar fora da caixa (no fundo escuro) também fecha
    offer.addEventListener('click', function (event) {
      if (event.target === offer) closeOffer();
    });
  } else {
    // Navegador muito antigo sem <dialog>: o botão do Básico vai direto para o checkout do Básico
    Array.prototype.forEach.call(document.querySelectorAll('[data-open-oferta]'), function (button) {
      button.addEventListener('click', function () {
        var basic = document.querySelector('a[data-checkout="basico"]');
        if (basic) basic.click();
      });
    });
  }

  var links = document.querySelectorAll('a[data-checkout]');
  Array.prototype.forEach.call(links, function (link) {
    var url = checkout[link.getAttribute('data-checkout')];

    if (isPlaceholder(url)) {
      // Enquanto o link não for configurado, o botão só leva aos planos (e fecha o pop-up, se estiver nele).
      console.warn('[checkout] Configure CONFIG.checkout.' + link.getAttribute('data-checkout') + ' no index.html');
      link.addEventListener('click', closeOffer);
      return;
    }

    // O link já fica completo no carregamento: funciona mesmo se o JavaScript de clique não rodar.
    // Não use link.onclick: o pixel da Utmify chama o onclick no lugar de abrir o checkout.
    link.href = withPageParams(url);

    link.addEventListener(
      'click',
      function (event) {
        var value = parseFloat(link.getAttribute('data-price')) || undefined;
        if (window.fbq) {
          try {
            window.fbq('track', 'InitiateCheckout', { value: value, currency: 'BRL' });
          } catch (e) {}
        }

        // Ctrl/Cmd+clique ou botão do meio: deixa o navegador abrir em outra aba normalmente.
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) return;

        // Dá um instante para o evento sair antes de trocar de página.
        event.preventDefault();
        if (link.getAttribute('data-going')) return;
        link.setAttribute('data-going', '1');
        var href = withPageParams(link.href);
        setTimeout(function () {
          window.location.href = href;
        }, 300);
      },
      true
    );
  });
})();

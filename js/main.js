/* Checkout e rastreamento.
   - Leva todos os parâmetros do endereço da página (UTMs, fbclid etc.) para o link do checkout.
   - Dispara InitiateCheckout no Pixel da Meta antes de ir para o checkout.
   Os links e IDs ficam em window.CONFIG, no topo do index.html. */
(function () {
  // Barra do topo: data de hoje no horário de Brasília (ex.: 01/10/2026), atualiza se a página ficar aberta na virada do dia
  var todaySlot = document.querySelector('[data-hoje]');
  function showToday() {
    if (!todaySlot) return;
    try {
      todaySlot.textContent = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date());
    } catch (e) {
      var d = new Date();
      todaySlot.textContent = ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
    }
    todaySlot.classList.remove('invisivel');
  }
  showToday();
  setInterval(showToday, 60000);

  // Barra fixa de compra: aparece depois que o botão do topo sai da tela (rolando para baixo) e some
  // quando os pacotes ou a chamada final estão visíveis (ali já existem botões de compra).
  var buyBar = document.querySelector('[data-barra-compra]');
  var heroButton = document.querySelector('.hero .btn');
  var hideZones = document.querySelectorAll('#planos, .final');
  if (buyBar && heroButton) {
    var ticking = false;
    var updateBar = function () {
      ticking = false;
      var vh = window.innerHeight;
      var pastHero = heroButton.getBoundingClientRect().bottom < 0;
      var inZone = Array.prototype.some.call(hideZones, function (zone) {
        var r = zone.getBoundingClientRect();
        return r.top < vh && r.bottom > 0;
      });
      buyBar.hidden = !pastHero || inZone;
    };
    var onScroll = function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateBar);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    updateBar();
  }

  // Carrossel das amostras: passa sozinho, uma por vez, em loop.
  // Pausa ao tocar, passar o mouse ou focar com o teclado, e quando a aba fica em segundo plano.
  // Quem pediu "reduzir movimento" no aparelho não tem a rotação automática.
  Array.prototype.forEach.call(document.querySelectorAll('[data-carrossel]'), function (root) {
    var track = root.querySelector('.car-track');
    var originals = Array.prototype.slice.call(track.children);
    var count = originals.length;
    if (count < 2) return;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Cópias das primeiras amostras no fim, para o loop não ter "pulo" de volta
    originals.slice(0, 3).forEach(function (slide) {
      var clone = slide.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });

    var index = 0;
    var perView = function () {
      return parseInt(getComputedStyle(root).getPropertyValue('--per'), 10) || 1;
    };
    var dotsBox = root.querySelector('[data-car-dots]');
    var dots = originals.map(function (_, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', 'Ver amostra ' + (i + 1) + ' de ' + count);
      dot.addEventListener('click', function () { goTo(i); restart(); });
      dotsBox.appendChild(dot);
      return dot;
    });

    var fallback = null;
    function setPosition(animate) {
      track.style.transition = animate && !reduceMotion ? 'transform 0.6s ease' : 'none';
      track.style.transform = 'translateX(' + (-index * 100 / perView()) + '%)';
      var active = index % count;
      dots.forEach(function (d, i) { d.setAttribute('aria-current', i === active ? 'true' : 'false'); });
      Array.prototype.forEach.call(track.children, function (slide, i) {
        var visible = i >= index && i < index + perView();
        slide.setAttribute('aria-hidden', visible && i < count ? 'false' : 'true');
      });
    }
    function settle() {
      // Chegou nas cópias: volta para a amostra original equivalente, sem animação
      if (index >= count) {
        index = index % count;
        setPosition(false);
      }
    }
    function goTo(i) {
      index = i;
      setPosition(true);
      clearTimeout(fallback);
      fallback = setTimeout(settle, reduceMotion ? 0 : 700); // caso o transitionend não chegue
    }
    function next() { goTo(index + 1); }
    function prev() {
      if (index === 0) {
        index = count;      // salta para a cópia do início, sem animação...
        setPosition(false);
        void track.offsetWidth;
      }
      goTo(index - 1);      // ...e anda uma para trás com animação
    }
    track.addEventListener('transitionend', function (e) {
      if (e.target === track) settle();
    });

    root.querySelector('[data-car-next]').addEventListener('click', function () { next(); restart(); });
    root.querySelector('[data-car-prev]').addEventListener('click', function () { prev(); restart(); });

    // Arrastar com o dedo
    var startX = null;
    root.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; pause(); }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (startX !== null) {
        var dx = e.changedTouches[0].clientX - startX;
        if (dx < -40) next();
        else if (dx > 40) prev();
      }
      startX = null;
      resumeLater();
    });

    // Rotação automática
    var timer = null;
    var paused = false;
    function start() {
      if (reduceMotion || timer) return;
      timer = setInterval(function () {
        if (!paused && !document.hidden) next();
      }, 3500);
    }
    function restart() {
      clearInterval(timer);
      timer = null;
      start();
    }
    function pause() { paused = true; }
    var resumeTimer = null;
    function resumeLater() {
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(function () { paused = false; }, 4000);
    }
    root.addEventListener('mouseenter', pause);
    root.addEventListener('mouseleave', function () { paused = false; });
    root.addEventListener('focusin', pause);
    root.addEventListener('focusout', function () { paused = false; });

    // Baixa todas as amostras quando a seção se aproxima, para nenhuma aparecer em branco ao passar
    var loadAll = function () {
      Array.prototype.forEach.call(track.querySelectorAll('img'), function (img) { img.loading = 'eager'; });
    };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { loadAll(); io.disconnect(); }
      }, { rootMargin: '800px 0px' });
      io.observe(root);
    } else {
      loadAll();
    }

    window.addEventListener('resize', function () { setPosition(false); });
    setPosition(false);
    start();
  });

  // Vídeo do topo: só baixa e toca quando a pessoa toca no botão (com som); depois mostra os controles normais
  Array.prototype.forEach.call(document.querySelectorAll('[data-video]'), function (box) {
    var video = box.querySelector('video');
    var play = box.querySelector('[data-video-play]');
    if (!video || !play) return;
    play.addEventListener('click', function () {
      play.hidden = true;
      video.controls = true;
      video.muted = false;
      var p = video.play();
      if (p && p.catch) {
        p.catch(function () {
          // Se o navegador bloquear o som, toca sem som (os controles deixam ligar o volume)
          video.muted = true;
          video.play().catch(function () {});
        });
      }
    });
  });

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

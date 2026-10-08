/* Rastreamento extra do Microsoft Clarity (página /dia-das-criancas).
 *
 * Tags (clarity "set"), no carregamento:
 *   utm_source, utm_campaign, utm_content, utm_term  -> da URL; "sem-utm" quando não existir
 *   dispositivo                                       -> "mobile" ou "desktop"
 *   pagina                                            -> "dia_das_criancas"
 *   variacao                                          -> só se a página definir uma (window.CONFIG.variacao
 *                                                        ou <html data-variacao="...">), para testes A/B
 * Eventos (clarity "event"):
 *   clique_cta (+ tag cta_posicao)  -> clique em qualquer botão de compra marcado com data-cta
 *   viu_<secao>                     -> cada seção com data-secao quando aparece na tela (uma vez)
 *   scroll_25/50/75/100             -> marcos de rolagem (uma vez cada)
 *   abriu_faq (+ tag faq_item)      -> abriu um item das perguntas frequentes
 *   tempo_30s, tempo_60s            -> tempo com a página visível (pausa em segundo plano)
 * Prioridade de gravação (clarity "upgrade"): "clique_cta" e "viu_oferta".
 *
 * Nada de dado pessoal é enviado: só UTMs, tipo de aparelho e nomes fixos de seção/botão.
 * Para ver no console o que está sendo enviado: abra a página com ?clarity_debug=1
 * (fica salvo no navegador; para desligar, ?clarity_debug=0).
 */
(function () {
  'use strict';

  // ---------- Modo de depuração: mostra no console cada chamada ao Clarity ----------
  var debug = false;
  try {
    var flag = new URLSearchParams(location.search).get('clarity_debug');
    if (flag === '1') localStorage.setItem('clarity_debug', '1');
    if (flag === '0') localStorage.removeItem('clarity_debug');
    debug = localStorage.getItem('clarity_debug') === '1';
  } catch (e) {}

  // ---------- Wrapper seguro: nunca quebra a página se o Clarity não existir ----------
  function clarity() {
    var args = Array.prototype.slice.call(arguments);
    if (debug && window.console) console.log('[clarity]', args.join(' · '));
    try {
      if (typeof window.clarity === 'function') window.clarity.apply(window, args);
    } catch (e) {}
  }
  function tag(chave, valor) { clarity('set', chave, String(valor)); }
  function evento(nome) { clarity('event', nome); }
  function prioriza(motivo) { clarity('upgrade', motivo); }

  // ---------- 1. Tags no carregamento ----------
  var params = new URLSearchParams(location.search);
  ['utm_source', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
    var v = (params.get(k) || '').trim();
    tag(k, v ? v.slice(0, 200) : 'sem-utm');
  });

  var ua = navigator.userAgent || '';
  var toque = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  var mobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua) || (toque && window.innerWidth < 1024);
  tag('dispositivo', mobile ? 'mobile' : 'desktop');
  tag('pagina', 'dia_das_criancas');

  var variacao = (window.CONFIG && window.CONFIG.variacao) || document.documentElement.getAttribute('data-variacao');
  if (variacao) tag('variacao', variacao);

  // ---------- 2a. Cliques nos botões de compra ----------
  // Ouve em fase de captura e sem preventDefault: não interfere no checkout nem no pop-up.
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest && e.target.closest('[data-cta]');
    if (!el) return;
    tag('cta_posicao', el.getAttribute('data-cta'));
    evento('clique_cta');
    prioriza('clique_cta');
  }, { capture: true, passive: true });

  // ---------- 2b. Seções vistas (uma vez cada) ----------
  var secoes = document.querySelectorAll('[data-secao]');
  function viu(el) {
    if (el.__vista) return;
    el.__vista = true;
    var nome = el.getAttribute('data-secao');
    evento('viu_' + nome);
    if (nome === 'oferta') prioriza('viu_oferta');
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        // "Viu" = 30% da seção na tela, ou 35% da altura da tela tomada por ela (seções mais altas que a tela)
        var visivel = en.intersectionRect.height;
        var alvo = Math.min(en.boundingClientRect.height * 0.3, window.innerHeight * 0.35);
        if (visivel >= alvo) {
          viu(en.target);
          io.unobserve(en.target);
        }
      });
    }, { threshold: [0, 0.1, 0.2, 0.3, 0.5, 0.75, 1] });
    Array.prototype.forEach.call(secoes, function (s) { io.observe(s); });
  }

  // ---------- 2c. Marcos de rolagem ----------
  var marcos = [25, 50, 75, 100];
  var feitos = {};
  var agendado = false;
  function confereRolagem() {
    agendado = false;
    var doc = document.documentElement;
    var total = Math.max(doc.scrollHeight, document.body.scrollHeight);
    var visto = (window.scrollY || doc.scrollTop) + window.innerHeight;
    var pct = total > 0 ? (visto / total) * 100 : 0;
    marcos.forEach(function (m) {
      if (!feitos[m] && pct >= (m === 100 ? 98 : m)) {
        feitos[m] = true;
        evento('scroll_' + m);
      }
    });
    if (feitos[100]) window.removeEventListener('scroll', aoRolar);
  }
  function aoRolar() {
    if (!agendado) {
      agendado = true;
      window.requestAnimationFrame(confereRolagem);
    }
  }
  window.addEventListener('scroll', aoRolar, { passive: true });
  window.addEventListener('load', confereRolagem, { once: true });

  // ---------- 2d. Perguntas frequentes ----------
  // "toggle" não sobe pela página, então ouvimos na fase de captura.
  var faqItens = Array.prototype.slice.call(document.querySelectorAll('[data-secao="faq"] details'));
  document.addEventListener('toggle', function (e) {
    var d = e.target;
    if (!d || d.tagName !== 'DETAILS' || !d.open) return;
    var i = faqItens.indexOf(d);
    if (i < 0) return;
    tag('faq_item', i + 1);
    evento('abriu_faq');
  }, true);

  // ---------- 2e. Tempo com a página visível ----------
  var segundos = 0;
  var relogio = setInterval(function () {
    if (document.visibilityState !== 'visible') return; // em segundo plano não conta
    segundos++;
    if (segundos === 30) evento('tempo_30s');
    if (segundos === 60) {
      evento('tempo_60s');
      clearInterval(relogio);
    }
  }, 1000);
})();

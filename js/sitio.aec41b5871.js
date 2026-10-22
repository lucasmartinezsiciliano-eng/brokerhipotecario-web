/* Firmax · brokerhipotecario.es. Sin librerías. */
(function () {
  'use strict';
  var FX = window.FX || {};
  var d = document;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var guardar = function (k, v, ses) { try { (ses ? sessionStorage : localStorage).setItem(k, v); } catch (e) {} };
  var leer = function (k, ses) { try { return (ses ? sessionStorage : localStorage).getItem(k); } catch (e) { return null; } };
  var params = new URLSearchParams(location.search);

  // ---------- menú ----------
  var abrir = $('[data-abrir-nav]');
  var nav = $('#nav');
  if (abrir && nav) {
    abrir.addEventListener('click', function () {
      var a = nav.classList.toggle('abierta');
      abrir.setAttribute('aria-expanded', a ? 'true' : 'false');
    });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('abierta')) { nav.classList.remove('abierta'); abrir.setAttribute('aria-expanded', 'false'); abrir.focus(); }
    });
  }
  var desplegables = $$('[data-desplegable]');
  desplegables.forEach(function (x) {
    x.addEventListener('toggle', function () { if (x.open) desplegables.forEach(function (o) { if (o !== x) o.open = false; }); });
  });
  d.addEventListener('click', function (e) {
    if (window.matchMedia('(min-width: 1040px)').matches) desplegables.forEach(function (x) { if (!x.contains(e.target)) x.open = false; });
  });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') desplegables.forEach(function (x) { if (x.open) { x.open = false; $('summary', x).focus(); } }); });

  // ---------- barra fija del móvil: aparece al pasar la cabecera ----------
  var barra = $('[data-barra]');
  var heroe = $('.heroe');
  if (barra) {
    barra.hidden = false;
    if (d.body.classList.contains('es-landing')) barra.classList.add('visible');
    else if (heroe && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (ent) { barra.classList.toggle('visible', !ent[0].isIntersecting); }, { rootMargin: '-80px 0px 0px 0px' }).observe(heroe);
    } else barra.classList.add('visible');
  }

  // ---------- código del anuncio (viaja en el mensaje de WhatsApp) ----------
  var limpiar = function (s) { return String(s || '').replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24); };
  var variante = limpiar(params.get('v')).toLowerCase();
  var refUrl = limpiar(params.get('ref') || params.get('utm_content'));
  if (refUrl) guardar('fx.ref', refUrl, true);
  var ref = refUrl || leer('fx.ref', true) || d.body.getAttribute('data-ref-defecto') || '';
  if (ref && variante && d.body.classList.contains('es-landing')) ref = ref + '-' + variante;

  // ---------- landing: variante del anuncio y opciones que rellenan el mensaje ----------
  var datosLanding = null;
  var nodo = $('#landing-datos');
  if (nodo) { try { datosLanding = JSON.parse(nodo.textContent); } catch (e) {} }
  if (datosLanding && variante && datosLanding.variantes[variante]) {
    var vv = datosLanding.variantes[variante];
    var h1 = $('[data-v-h1]'), sub = $('[data-v-sub]');
    if (h1) h1.textContent = vv.h1;
    if (sub) sub.textContent = vv.sub;
  }
  var elegido = function (nombre) { var x = $('[data-elegir] input[name="' + nombre + '"]:checked'); return x ? x.value : ''; };

  function mensaje(a) {
    var url;
    try { url = new URL(a.href); } catch (e) { return; }
    var texto;
    if (datosLanding) {
      var m = datosLanding.mensaje;
      texto = m.hola;
      var que = elegido('que'), donde = elegido('donde');
      if (que) texto += ' ' + que + (donde ? datosLanding.donde.replace('§', donde) : '') + '.';
      else if (donde) texto += datosLanding.donde.replace('§', donde).replace(/^,\s*/, ' ').replace(/^ (\w)/, function (_, c) { return ' ' + c.toUpperCase(); }) + '.';
      if (ref) texto += ' ' + m.ref + ' ' + ref;
    } else {
      if (!a.getAttribute('data-base')) a.setAttribute('data-base', url.searchParams.get('text') || '');
      texto = a.getAttribute('data-base') + (ref ? ' Ref. ' + ref : '');
    }
    a.href = url.origin + url.pathname + '?text=' + encodeURIComponent(texto);
  }
  var enlacesWa = $$('[data-wa]');
  var rehacer = function () { enlacesWa.forEach(mensaje); };
  rehacer();
  $$('[data-elegir] input').forEach(function (i) { i.addEventListener('change', rehacer); });

  // ---------- cookies y píxel de Meta ----------
  var aviso = $('[data-cookies]');
  var hayPixel = !!FX.pixel;
  var estado = null;
  try { estado = JSON.parse(leer('fx.cookies') || 'null'); } catch (e) {}
  var pixelCargado = false;

  function cargarPixel() {
    if (pixelCargado || !hayPixel) return;
    pixelCargado = true;
    /* Código base de Meta, cargado solo tras aceptar. */
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, d, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', FX.pixel);
    window.fbq('track', 'PageView');
  }
  function borrarCookiesMeta() {
    ['_fbp', '_fbc'].forEach(function (c) {
      d.cookie = c + '=; Max-Age=0; path=/';
      d.cookie = c + '=; Max-Age=0; path=/; domain=.' + location.hostname.replace(/^www\./, '');
    });
  }
  function aplicar(medicion) {
    estado = { v: 1, medicion: !!medicion, fecha: new Date().toISOString() };
    guardar('fx.cookies', JSON.stringify(estado));
    if (estado.medicion) cargarPixel();
    else { if (window.fbq) window.fbq('consent', 'revoke'); borrarCookiesMeta(); }
    cerrarAviso();
  }
  function abrirAviso(config) {
    if (!aviso) return;
    aviso.hidden = false;
    var form = $('[data-cookies-config]', aviso);
    var casilla = $('[data-cookies-medicion]', aviso);
    if (casilla) casilla.checked = !!(estado && estado.medicion);
    form.hidden = !config;
    $('[data-cookies-guardar]', aviso).hidden = !config;
    $('[data-cookies-configurar]', aviso).hidden = !!config;
  }
  function cerrarAviso() { if (aviso) aviso.hidden = true; }
  if (aviso) {
    $('[data-cookies-aceptar]', aviso).addEventListener('click', function () { aplicar(true); });
    $('[data-cookies-rechazar]', aviso).addEventListener('click', function () { aplicar(false); });
    $('[data-cookies-configurar]', aviso).addEventListener('click', function () { abrirAviso(true); });
    $('[data-cookies-guardar]', aviso).addEventListener('click', function () { aplicar($('[data-cookies-medicion]', aviso).checked); });
  }
  $$('[data-cookies-abrir]').forEach(function (b) { b.addEventListener('click', function () { abrirAviso(true); }); });
  // Si no hay píxel, no hay nada que pedir: el aviso solo sale en el borrador, para verlo.
  if (hayPixel || FX.borrador) {
    if (!estado) abrirAviso(false);
    else if (estado.medicion) cargarPixel();
  }

  // Contacto: solo se mide si la persona aceptó. Nunca se manda nada de su situación económica.
  function medir(canal) {
    if (!(estado && estado.medicion && window.fbq)) return;
    var id = 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    window.fbq('track', 'Contact', { content_name: canal }, { eventID: id });
  }
  enlacesWa.forEach(function (a) { a.addEventListener('click', function () { mensaje(a); medir('whatsapp'); }); });
})();

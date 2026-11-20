/* ---------------------------------------------------------------------------
   Guardianes del Pulque — indicador de visitas en el footer
   ---------------------------------------------------------------------------
   Lee los totales publicos de GoatCounter y los pinta en el footer:
   una linea con las visitas de la semana + un panel con el desglose
   semanal agrupado por mes, desde el 11 de noviembre de 2026.

   Requiere, una sola vez, en el panel de GoatCounter:
   Settings -> "Allow adding visitor counts on your website" ACTIVADO.
   Sin eso el endpoint /counter/ responde 403 y el indicador no aparece.

   Sin cookies, sin IPs, sin consentimiento. Los totales vienen cacheados
   por GoatCounter hasta 4 horas, asi que no son al minuto.
--------------------------------------------------------------------------- */
(function () {
  'use strict';

  /* === CONFIGURACION ===================================================== */
  var GC = 'https://guardianesdelpulque.goatcounter.com'; // <- tu subdominio
  var INICIO = '2026-11-20';   // primer dia con datos; no se consulta antes
  /* ======================================================================= */

  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
               'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var MESES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul',
                     'ago', 'sep', 'oct', 'nov', 'dic'];

  var depurar = /[?&]stats\b/.test(location.search);
  var hoy = new Date();
  var HOY = iso(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));

  /* --- utilidades de fecha ----------------------------------------------- */
  function iso(ms) { return new Date(ms).toISOString().slice(0, 10); }
  function ms(fecha) {
    var p = fecha.split('-');
    return Date.UTC(+p[0], +p[1] - 1, +p[2]);
  }
  function dia(fecha) { return +fecha.slice(8, 10); }
  function mesDe(fecha) { return +fecha.slice(5, 7) - 1; }

  // Meses con datos, del mas reciente al mas antiguo.
  function meses() {
    var out = [];
    var y = +INICIO.slice(0, 4), m = +INICIO.slice(5, 7) - 1;
    var yFin = +HOY.slice(0, 4), mFin = +HOY.slice(5, 7) - 1;
    while (y < yFin || (y === yFin && m <= mFin)) {
      out.unshift({ y: y, m: m });
      if (++m > 11) { m = 0; y++; }
    }
    return out;
  }

  // Tramos de semana (lunes a domingo) recortados al mes y a hoy, de modo
  // que las semanas de un mes suman exactamente el total del mes.
  function semanas(y, m) {
    var desde = Math.max(Date.UTC(y, m, 1), ms(INICIO));
    var hasta = Math.min(Date.UTC(y, m + 1, 0), ms(HOY));
    var out = [], cur = desde;
    while (cur <= hasta) {
      var lunes0 = (new Date(cur).getUTCDay() + 6) % 7;      // 0 = lunes
      var fin = Math.min(cur + (6 - lunes0) * 864e5, hasta);
      out.push([iso(cur), iso(fin)]);
      cur = fin + 864e5;
    }
    return out.reverse();
  }

  /* --- consulta a GoatCounter -------------------------------------------- */
  var memoria = {};

  function pedir(desde, hasta) {
    var clave = 'gdpv:' + desde + ':' + (hasta || '');
    if (clave in memoria) return Promise.resolve(memoria[clave]);
    try {
      var g = sessionStorage.getItem(clave);
      if (g !== null) { memoria[clave] = +g; return Promise.resolve(+g); }
    } catch (e) { /* modo privado: seguimos sin cache */ }

    var url = GC + '/counter/TOTAL.json?start=' + encodeURIComponent(desde) +
              (hasta ? '&end=' + encodeURIComponent(hasta) : '');

    return fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error('GoatCounter respondio ' + r.status);
        return r.json();
      })
      .then(function (d) {
        var n = parseInt(String(d.count).replace(/[^\d]/g, ''), 10);
        if (isNaN(n)) throw new Error('respuesta inesperada');
        memoria[clave] = n;
        try { sessionStorage.setItem(clave, n); } catch (e) {}
        return n;
      })
      .catch(function (err) {
        if (depurar) console.warn('[estadisticas] ' + url + ' — ' + err.message);
        memoria[clave] = null;
        return null;
      });
  }

  // OJO: en GoatCounter el parametro 'end' es EXCLUSIVO (no incluye ese dia).
  // Comprobado contra una instancia real: start=2026-10-01&end=2026-10-31 se
  // come el dia 31. Asi que aqui se recibe el ultimo dia INCLUSIVO, como se
  // muestra en la etiqueta, y se manda el dia siguiente.
  function pedirRango(desde, hastaInclusivo) {
    return pedir(desde, iso(ms(hastaInclusivo) + 864e5));
  }

  // Etiqueta legible de INICIO, p. ej. '20 nov 2026'. Derivada, no escrita
  // a mano, para que no se desfase si cambia la constante.
  function etiquetaInicio() {
    return dia(INICIO) + ' ' + MESES_CORTO[mesDe(INICIO)] + ' ' + INICIO.slice(0, 4);
  }

  function fmt(n) {
    return n === null ? '—' : n.toLocaleString('es-MX');
  }

  /* --- estilos ------------------------------------------------------------ */
  var CSS = [
    '#gdp-vis{display:block;flex-basis:100%;margin:.1rem 0 0 30px;font-size:.74rem;opacity:.85}',
    '#gdp-vis-btn{',
      'font:inherit;font-size:.74rem;color:inherit;background:none;border:0;',
      'padding:0;cursor:pointer;text-decoration:underline;',
      'text-decoration-style:dotted;text-underline-offset:3px;opacity:.75;',
      'transition:opacity .15s ease}',
    '#gdp-vis-btn:hover,#gdp-vis-btn:focus-visible{opacity:1}',

    /* el popover: centrado abajo por defecto, anclado si hay soporte */
    '#gdp-vis-panel{',
      'margin:0;inset:auto;position:fixed;left:50%;bottom:64px;',
      'translate:-50% 0;width:min(340px,calc(100vw - 28px));',
      'max-height:min(62vh,520px);overflow:auto;overscroll-behavior:contain;',
      'padding:14px 16px 12px;border:1px solid var(--stroke,#e5e7eb);',
      'border-radius:14px;background:#fff;color:#0f172a;',
      'box-shadow:0 12px 34px rgba(15,23,42,.16);',
      'font-size:.78rem;line-height:1.45;text-align:left}',
    '#gdp-vis-panel::backdrop{background:rgba(15,23,42,.14)}',
    '@supports (anchor-name:--gdp){',
      '#gdp-vis-btn{anchor-name:--gdp}',
      '#gdp-vis-panel{position-anchor:--gdp;position-area:block-start span-inline-end;',
        'left:auto;right:auto;bottom:auto;translate:none;margin-bottom:8px;',
        'position-try-fallbacks:flip-block,flip-inline;',
        'max-height:min(62vh,520px)}',
      '#gdp-vis-panel::backdrop{background:none}}',

    '#gdp-vis-panel h3{margin:0 0 .6rem;font-size:.84rem;letter-spacing:.01em}',
    '.gdp-kpi{display:flex;justify-content:space-between;gap:1rem;',
      'padding:.3rem 0;border-bottom:1px dashed rgba(15,23,42,.1)}',
    '.gdp-kpi:last-of-type{border-bottom:0}',
    '.gdp-kpi b{font-variant-numeric:tabular-nums;font-weight:700}',
    '.gdp-kpi span{color:#475569}',
    '.gdp-sep{margin:.7rem 0 .4rem;font-size:.7rem;text-transform:uppercase;',
      'letter-spacing:.07em;color:#64748b}',

    /* acordeon nativo por mes */
    '.gdp-mes{border-top:1px solid rgba(15,23,42,.08)}',
    '.gdp-mes summary{display:flex;align-items:center;gap:7px;cursor:pointer;',
      'list-style:none;padding:.38rem 0}',
    '.gdp-mes summary::-webkit-details-marker{display:none}',
    '.gdp-mes summary::before{content:"";width:6px;height:6px;flex:none;',
      'border-right:2px solid currentColor;border-bottom:2px solid currentColor;',
      'rotate:-45deg;opacity:.55;transition:rotate .25s ease}',
    '.gdp-mes[open] summary::before{rotate:45deg}',
    '.gdp-mes summary b{margin-left:auto;font-variant-numeric:tabular-nums}',
    '.gdp-sem{display:flex;justify-content:space-between;gap:1rem;',
      'padding:.22rem 0 .22rem 13px;color:#475569;font-size:.74rem}',
    '.gdp-sem b{font-variant-numeric:tabular-nums;color:#0f172a}',
    '.gdp-nota{margin:.8rem 0 0;padding-top:.6rem;font-size:.68rem;color:#64748b;',
      'border-top:1px solid rgba(15,23,42,.08)}',

    /* modo oscuro del sitio */
    'body.mode-community #gdp-vis-panel{background:#021814;color:#dcfce7;',
      'border-color:rgba(22,163,74,.5);box-shadow:0 12px 34px rgba(0,0,0,.5)}',
    'body.mode-community .gdp-kpi span,body.mode-community .gdp-sem,',
    'body.mode-community .gdp-sep,body.mode-community .gdp-nota{color:#86efac}',
    'body.mode-community .gdp-sem b{color:#dcfce7}',
    'body.mode-community .gdp-kpi,body.mode-community .gdp-mes,',
    'body.mode-community .gdp-nota{border-color:rgba(22,163,74,.28)}',

    /* movimiento: solo si lo aceptan */
    '@media (prefers-reduced-motion:no-preference){',
      '#gdp-vis-panel{transition:opacity .2s ease,translate .22s cubic-bezier(.22,1,.36,1),',
        'overlay .2s allow-discrete,display .2s allow-discrete}',
      '#gdp-vis-panel:not(:popover-open){opacity:0}',
      '@starting-style{#gdp-vis-panel:popover-open{opacity:0}}',
      '@supports (interpolate-size:allow-keywords){',
        '.gdp-mes::details-content{block-size:0;overflow:hidden;opacity:0;',
          'transition:block-size .3s cubic-bezier(.22,1,.36,1),opacity .24s ease,',
          'content-visibility .3s allow-discrete}',
        '.gdp-mes[open]::details-content{block-size:auto;opacity:1}}}'
  ].join('');

  /* --- construccion ------------------------------------------------------- */
  function monta(semanaActual) {
    var fila = document.querySelector('footer .container.row') ||
               document.querySelector('footer .row');
    if (!fila) return;
    var bloque = fila.firstElementChild;
    if (!bloque) return;

    var estilo = document.createElement('style');
    estilo.textContent = ':root{interpolate-size:allow-keywords}' + CSS;
    document.head.appendChild(estilo);

    var cont = document.createElement('div');
    cont.id = 'gdp-vis';
    var n = fmt(semanaActual);
    cont.innerHTML = '· ' + n + ' visita' +
      (semanaActual === 1 ? '' : 's') + ' esta semana · ' +
      '<button type="button" id="gdp-vis-btn" popovertarget="gdp-vis-panel" ' +
      'aria-label="Ver el desglose de visitas por semana y por mes">' +
      'ver detalle</button>';
    // el footer es un flex row: esto hace que el indicador caiga en su propia linea
    bloque.style.flexWrap = 'wrap';
    bloque.appendChild(cont);

    var panel = document.createElement('div');
    panel.id = 'gdp-vis-panel';
    panel.setAttribute('popover', '');
    panel.innerHTML =
      '<h3>Visitas al sitio</h3>' +
      '<div class="gdp-kpi"><span>Últimos 7 días</span><b data-k="semana">…</b></div>' +
      '<div class="gdp-kpi"><span>Este mes</span><b data-k="mes">…</b></div>' +
      '<div class="gdp-kpi"><span>Desde el ' + etiquetaInicio() + '</span><b data-k="total">…</b></div>' +
      '<p class="gdp-sep">Por mes y semana</p>' +
      '<div data-k="lista"></div>' +
      '<p class="gdp-nota">Se cuentan <b>personas</b>, no clics: cada visitante ' +
      'cuenta una sola vez dentro de cada periodo. Por eso las semanas pueden ' +
      'sumar un poco más que el mes — quien vuelve en dos semanas distintas ' +
      'cuenta en las dos, pero una sola vez en el mes. Medición con ' +
      'GoatCounter, sin cookies y sin guardar direcciones IP; los totales se ' +
      'actualizan cada pocas horas.</p>';
    document.body.appendChild(panel);

    var pon = function (k, v) {
      var el = panel.querySelector('[data-k="' + k + '"]');
      if (el) el.textContent = fmt(v);
    };
    pon('semana', semanaActual);

    var y0 = +HOY.slice(0, 4), m0 = +HOY.slice(5, 7);
    pedir(y0 + '-' + (m0 < 10 ? '0' : '') + m0 + '-01').then(function (v) {
      pon('mes', v);
    });
    pedir(INICIO).then(function (v) { pon('total', v); });

    /* un <details> por mes; las semanas se piden al abrirlo */
    var lista = panel.querySelector('[data-k="lista"]');
    meses().forEach(function (mes) {
      var d = document.createElement('details');
      d.className = 'gdp-mes';
      d.name = 'gdp-mes';                       // acordeon exclusivo
      var fin = new Date(Date.UTC(mes.y, mes.m + 1, 0));
      d.innerHTML = '<summary>' + MESES[mes.m] + ' ' + mes.y +
                    ' <b>…</b></summary><div class="gdp-cuerpo"></div>';
      lista.appendChild(d);

      var ini = Math.max(Date.UTC(mes.y, mes.m, 1), ms(INICIO));
      pedirRango(iso(ini), iso(Math.min(fin.getTime(), ms(HOY)))).then(function (v) {
        d.querySelector('summary b').textContent = fmt(v);
      });

      var cargado = false;
      d.addEventListener('toggle', function () {
        if (!d.open || cargado) return;
        cargado = true;
        var cuerpo = d.querySelector('.gdp-cuerpo');
        semanas(mes.y, mes.m).forEach(function (sem) {
          var r = document.createElement('div');
          r.className = 'gdp-sem';
          var d1 = dia(sem[0]), d2 = dia(sem[1]);
          var etq = (d1 === d2 ? d1 : d1 + '–' + d2) + ' ' +
                    MESES_CORTO[mesDe(sem[0])];
          r.innerHTML = '<span>' + etq + '</span><b>…</b>';
          cuerpo.appendChild(r);
          pedirRango(sem[0], sem[1]).then(function (v) {
            r.querySelector('b').textContent = fmt(v);
          });
        });
      });
    });
  }

  /* --- arranque ----------------------------------------------------------- */
  function arranca() {
    pedir('week').then(function (v) {
      // Si GoatCounter no responde, o todavia no hay ni una visita, el footer
      // se queda tal cual estaba: nadie ve un indicador roto ni un cero
      // desangelado el primer dia. Con ?stats en la URL si se monta, para
      // poder depurar la configuracion.
      if (!v && !depurar) return;
      monta(v);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arranca);
  } else {
    arranca();
  }
})();

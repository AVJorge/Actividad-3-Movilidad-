/* Entradas y salidas: cómo proyectar una población
   Lógica del material interactivo. Sin dependencias externas. */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);

  // Formato mexicano: punto decimal y espacio como separador de miles (como en la actividad: 29 000).
  const group = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const fmt = (n) => group(String(Math.round(n)));
  const money = (n) => '$' + fmt(n);
  const dec1 = (n) => {
    const t = (Math.round(n * 10) / 10).toFixed(1);
    const [i, d] = t.split('.');
    return d === '0' ? group(i) : group(i) + '.' + d;
  };
  const pct = (r) => String(Math.round(r * 1000) / 10) + ' %';

  /* ---------- 1. Tienda ---------- */
  const STORE = { start: 100, inflow: 10, rate: 0.05, months: 12 };
  let sOk, sBad, sMes, sLines;

  function storeReset() {
    sOk = STORE.start; sBad = STORE.start; sMes = 0; sLines = [];
    $('sLog').textContent = 'Presiona “Avanzar un mes” para ver el cálculo.';
    $('sNext').disabled = false;
    storeDraw();
  }
  function storeDraw() {
    $('sOk').textContent = dec1(sOk);
    $('sBad').textContent = dec1(sBad);
    $('sMes').textContent = sMes;
    $('sGap').textContent = dec1(sBad - sOk) + ' productos';
  }
  function storeNext() {
    if (sMes >= STORE.months) return;
    const before = sOk;
    const out = before * STORE.rate;
    sOk = before - out + STORE.inflow;
    sBad += STORE.inflow;
    sMes++;
    sLines.push(`Mes ${sMes}: ${dec1(before)} − (5 % × ${dec1(before)} = ${dec1(out)}) + 10 = ${dec1(sOk)}   |   inflado: ${dec1(sBad)}`);
    if (sMes === STORE.months) {
      sLines.push(`Después de ${STORE.months} meses, el inventario inflado supera al real por ${dec1(sBad - sOk)} productos.`);
      $('sNext').disabled = true;
    }
    const log = $('sLog');
    log.textContent = sLines.join('\n');
    log.style.whiteSpace = 'pre-wrap';
    log.scrollTop = log.scrollHeight;
    storeDraw();
  }
  $('sNext').addEventListener('click', storeNext);
  $('sReset').addEventListener('click', storeReset);
  storeReset();

  /* ---------- 3. Simulador ---------- */
  const MAXY = 6;
  const inputs = ['iP', 'iC', 'iR', 'iI', 'iK'].map($);
  let shown = 0;
  let chartKey = 'tot';

  function params() {
    return {
      P: +$('iP').value,
      C: +$('iC').value,
      R: +$('iR').value / 100,
      I: +$('iI').value / 100,
      K: +$('iK').value
    };
  }

  function rows() {
    const p = params();
    const out = [];
    let pop = p.P;
    let acc = 0;
    for (let n = 0; n <= MAXY; n++) {
      const sal = pop * p.R;
      const fin = pop - sal + p.C;
      acc += sal;
      out.push({ n, ini: pop, sal, nue: p.C, fin, int: pop * p.I, monto: pop * p.K, acc });
      pop = fin;
    }
    return out;
  }

  function seriesOf(r, key) {
    return r.map((x) => (key === 'tot' ? x.ini : key === 'int' ? x.int : key === 'out' ? x.sal : x.acc));
  }

  function renderLabels() {
    const p = params();
    $('vP').textContent = fmt(p.P);
    $('vC').textContent = fmt(p.C);
    $('vR').textContent = pct(p.R);
    $('vI').textContent = pct(p.I);
    $('vK').textContent = money(p.K);
  }

  function renderTable(r) {
    const body = $('tBody');
    body.textContent = '';
    for (let i = 0; i < shown; i++) {
      const x = r[i];
      const tr = document.createElement('tr');
      if (i === shown - 1) tr.className = 'hl';
      [x.n, fmt(x.ini), fmt(x.sal), fmt(x.nue), fmt(x.fin), fmt(x.int), money(x.monto)].forEach((v) => {
        const td = document.createElement('td');
        td.textContent = v;
        tr.appendChild(td);
      });
      body.appendChild(tr);
    }
    if (shown) {
      $('tAccLbl').textContent = `Salidas acumuladas (años 0 a ${shown - 1})`;
      $('tAcc').textContent = fmt(r[shown - 1].acc);
    } else {
      $('tAccLbl').textContent = 'Salidas acumuladas';
      $('tAcc').textContent = '—';
    }
    $('tNext').disabled = shown > MAXY;
    $('tAll').disabled = shown > MAXY;
  }

  function renderExplain(r) {
    const e = $('tExplain');
    const p = params();
    if (!shown) {
      e.textContent = 'Presiona “Calcular el siguiente año”. Verás de dónde sale cada número.';
      return;
    }
    const x = r[shown - 1];
    const origen = x.n === 0
      ? 'El año 0 es el punto de partida: la población actual.'
      : `La población al inicio del año ${x.n} es la población al <b>final</b> del año ${x.n - 1}.`;
    let trend = '';
    if (Math.abs(x.sal - x.nue) < 0.5) trend = '<br><i>Las salidas son iguales a las entradas: la población se mantiene.</i>';
    else if (x.sal > x.nue) trend = '<br><i>En este escenario salen más estudiantes de los que entran: la población disminuye.</i>';
    e.innerHTML = `${origen}<br>
      <span class="chip out">Salen</span> ${pct(p.R)} × ${fmt(x.ini)} = <b>${fmt(x.sal)}</b> &nbsp;·&nbsp;
      <span class="chip in">Entran</span> <b>${fmt(x.nue)}</b><br>
      <span class="chip base">Final</span> ${fmt(x.ini)} − ${fmt(x.sal)} + ${fmt(x.nue)} = <b>${fmt(x.fin)}</b> &nbsp;·&nbsp;
      Internacionales: ${pct(p.I)} × ${fmt(x.ini)} = <b>${fmt(x.int)}</b>${trend}`;
  }

  const SVGNS = 'http://www.w3.org/2000/svg';
  function el(name, attrs, text) {
    const n = document.createElementNS(SVGNS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }

  function renderChart(r) {
    const svg = $('chart');
    const W = 720, H = 300, L = 78, R = 20, T = 26, B = 40;
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    svg.appendChild(el('line', { x1: L, y1: H - B, x2: W - R, y2: H - B, stroke: '#bbb' }));
    svg.appendChild(el('line', { x1: L, y1: T, x2: L, y2: H - B, stroke: '#bbb' }));
    svg.appendChild(el('text', { x: (L + W - R) / 2, y: H - 6, 'font-size': 13, 'text-anchor': 'middle', fill: '#5b6670' }, 'Año'));

    if (!shown) {
      svg.appendChild(el('text', { x: W / 2, y: H / 2, 'text-anchor': 'middle', fill: '#999', 'font-size': 15 }, 'Calcula al menos un año para ver la gráfica'));
      svg.setAttribute('aria-label', 'Gráfica vacía');
      return;
    }

    const full = seriesOf(r, chartKey);
    const data = full.slice(0, shown).map((v, n) => ({ n, v }));
    const levelBased = chartKey === 'tot' || chartKey === 'int';
    let hi = Math.max(...full), lo = levelBased ? Math.min(...full) : 0;
    if (hi === lo) { hi = hi * 1.1 || 1; lo = levelBased ? lo * 0.9 : 0; }
    const pad = (hi - lo) * 0.12;
    const maxV = hi + pad;
    const minV = levelBased ? Math.max(0, lo - pad) : 0;

    const xs = (n) => L + (n + 0.5) * (W - L - R) / (MAXY + 1);
    const ys = (v) => H - B - (v - minV) / (maxV - minV) * (H - T - B);

    for (let k = 0; k <= 4; k++) {
      const v = minV + (maxV - minV) * k / 4, y = ys(v);
      svg.appendChild(el('line', { x1: L, x2: W - R, y1: y, y2: y, stroke: '#eee' }));
      svg.appendChild(el('text', { x: L - 8, y: y + 4, 'font-size': 12, 'text-anchor': 'end', fill: '#5b6670' }, fmt(v)));
    }
    for (let n = 0; n <= MAXY; n++) {
      svg.appendChild(el('text', { x: xs(n), y: H - B + 18, 'font-size': 12, 'text-anchor': 'middle', fill: '#5b6670' }, n));
    }

    const col = chartKey === 'out' || chartKey === 'acc' ? '#c2492d' : chartKey === 'int' ? '#1f8a5b' : '#2b5d8a';
    if (chartKey === 'out') {
      const bw = (W - L - R) / (MAXY + 1) * 0.55;
      data.forEach((d) => svg.appendChild(el('rect', { x: xs(d.n) - bw / 2, y: ys(d.v), width: bw, height: Math.max(0, H - B - ys(d.v)), fill: col, rx: 3 })));
    } else {
      svg.appendChild(el('polyline', { fill: 'none', stroke: col, 'stroke-width': 3, points: data.map((d) => xs(d.n) + ',' + ys(d.v)).join(' ') }));
      data.forEach((d) => svg.appendChild(el('circle', { cx: xs(d.n), cy: ys(d.v), r: 5, fill: '#fff', stroke: col, 'stroke-width': 2.5 })));
    }
    const last = data[data.length - 1];
    svg.appendChild(el('text', { x: xs(last.n), y: Math.max(14, ys(last.v) - 12), 'font-size': 13, 'font-weight': 700, 'text-anchor': 'middle', fill: col }, fmt(last.v)));

    const names = { tot: 'población total', int: 'estudiantes internacionales', out: 'salidas por año', acc: 'salidas acumuladas' };
    svg.setAttribute('aria-label', `Gráfica de ${names[chartKey]}, años 0 a ${shown - 1}. Último valor: ${fmt(last.v)}.`);
  }

  function render() {
    renderLabels();
    const r = rows();
    renderTable(r);
    renderExplain(r);
    renderChart(r);
  }

  inputs.forEach((i) => i.addEventListener('input', render));
  $('tNext').addEventListener('click', () => { if (shown <= MAXY) { shown++; render(); } });
  $('tAll').addEventListener('click', () => { shown = MAXY + 1; render(); });
  $('tReset').addEventListener('click', () => { shown = 0; render(); });
  document.querySelectorAll('#cTabs button').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('#cTabs button').forEach((x) => { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); });
    b.classList.add('on');
    b.setAttribute('aria-pressed', 'true');
    chartKey = b.dataset.k;
    render();
  }));
  render();

  /* ---------- 4. Hoja de cálculo ---------- */
  const FX = {
    '=$B$2': 'La población del año 0 se toma directamente de la celda de parámetros.',
    '=B9*$B$4': 'Salidas del año = población al inicio × porcentaje que se cambia. El $ mantiene fija la celda de la tasa al copiar la fórmula.',
    '=$B$3': 'Los estudiantes nuevos son una cantidad fija: siempre se lee la misma celda.',
    '=B9-C9+D9': 'Población final = inicio − salidas + nuevos. Es el modelo completo en una celda.',
    '=B9*$B$5': 'Internacionales = población de ese año × su porcentaje.',
    '=B9*$B$6': 'Monto del año = población de ese año × costo por estudiante.',
    '=A9+1': 'El número de año aumenta de uno en uno al copiar la fórmula hacia abajo.',
    '=E9': 'Paso clave: la población al inicio de un año es la población final del año anterior.',
    '=B10*$B$4': 'El mismo cálculo con la población del año 1. Al copiar, B10 cambia y $B$4 no.',
    '=B10-C10+D10': 'El mismo modelo aplicado al año siguiente.',
    '=B10*$B$5': 'Internacionales del año 1, calculados sobre la población de ese año.',
    '=B10*$B$6': 'Monto del año 1.',
    '=SUMA(C9:C13)': 'Suma las salidas de las filas del periodo que te piden. Las filas 9 a 13 son los años 0 a 4, es decir, cinco años. Ajusta el rango a lo que pida la pregunta.'
  };
  document.querySelectorAll('.sheet td.f').forEach((td) => {
    td.tabIndex = 0;
    td.setAttribute('role', 'button');
    const show = () => {
      document.querySelectorAll('.sheet td.f.sel').forEach((x) => x.classList.remove('sel'));
      td.classList.add('sel');
      const f = td.textContent.trim();
      $('ftext').textContent = f;
      $('fexp').textContent = FX[f] || '';
    };
    td.addEventListener('click', show);
    td.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(); } });
  });

  /* ---------- 6. Preguntas ---------- */
  const Q = [
    {
      p: 'La Universidad Ejemplo tiene 12 000 estudiantes y el 2 % son internacionales. Para saber cuántos internacionales habrá en el año 3, ¿qué haces?',
      o: ['Multiplico 2 % × 12 000 y el resultado lo multiplico por 3.',
          'Proyecto la población hasta el año 3 y aplico el 2 % a esa población.',
          'Sumo el 2 % tres veces: 6 % × 12 000.'],
      a: 1,
      f: ['El porcentaje no se multiplica por los años; se aplica a la población del año que te piden.',
          'Correcto. Primero proyectas la población y después aplicas el porcentaje.',
          'El porcentaje de internacionales no se acumula; es una proporción de la población de cada año.']
    },
    {
      p: 'Cada año entran 800 estudiantes y sale el 3 %. Un compañero calcula la población del año 2 como 12 000 + 800 + 800. ¿Qué le falta?',
      o: ['Nada, el cálculo está completo.',
          'Restar las salidas de cada año antes de sumar a los nuevos.',
          'Multiplicar 800 por 3 %.'],
      a: 1,
      f: ['Ese es el “inventario inflado”: ignora a quienes se van.',
          'Correcto. Sin las salidas, la población queda sobreestimada.',
          'El 3 % se aplica a la población inscrita, no a los estudiantes nuevos.']
    },
    {
      p: 'Si el porcentaje de salida no cambia, ¿por qué las salidas no son iguales cada año?',
      o: ['Porque la población sobre la que se calcula el porcentaje cambia cada año.',
          'Por un error de redondeo en la hoja de cálculo.',
          'Porque el porcentaje aumenta cada año.'],
      a: 0,
      f: ['Correcto. El mismo porcentaje de una población distinta da una cantidad distinta.',
          'El redondeo no explica la diferencia; la causa es que la base cambia.',
          'El porcentaje se mantiene; lo que cambia es la población.']
    }
  ];
  const qz = $('quiz');
  Q.forEach((q, qi) => {
    const d = document.createElement('div');
    d.className = 'q';
    const p = document.createElement('p');
    p.textContent = `${qi + 1}. ${q.p}`;
    d.appendChild(p);
    const fb = document.createElement('div');
    fb.className = 'fb';
    fb.setAttribute('aria-live', 'polite');
    q.o.forEach((txt, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = txt;
      b.addEventListener('click', () => {
        d.querySelectorAll('button').forEach((x) => x.classList.remove('right', 'wrong'));
        b.classList.add(i === q.a ? 'right' : 'wrong');
        fb.textContent = (i === q.a ? '✅ ' : '↺ ') + q.f[i] + (i === q.a ? '' : ' Intenta otra opción.');
      });
      d.appendChild(b);
    });
    d.appendChild(fb);
    qz.appendChild(d);
  });

  /* ---------- 7. Lista de revisión ---------- */
  const cbs = document.querySelectorAll('#check input');
  cbs.forEach((c) => c.addEventListener('change', () => {
    const n = [...cbs].filter((x) => x.checked).length;
    $('pbar').style.width = (n / cbs.length * 100) + '%';
    $('pwrap').setAttribute('aria-valuenow', n);
    $('ptext').textContent = `${n} de ${cbs.length}` + (n === cbs.length ? ' · ¡Listo para entregar!' : '');
  }));
})();

/* =====================================================================
   Selector de actividades y Actividad integradora 4
   ===================================================================== */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const group = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const money = (n) => (n < 0 ? '−$' : '$') + group(String(Math.round(Math.abs(n))));
  const money2 = (n) => {
    const t = Math.abs(n).toFixed(2).split('.');
    return (n < 0 ? '−$' : '$') + group(t[0]) + '.' + t[1];
  };
  const pctS = (x) => String(Math.round(x * 1000) / 10) + ' %';

  /* ---------- Selector ---------- */
  // El enlace (#ai3, #ai4) y el contenedor (act3, act4) tienen nombres distintos
  // para que el navegador no salte al contenido y el selector quede a la vista.
  const ACTS = { ai3: 'act3', ai4: 'act4' };
  function show(act) {
    Object.keys(ACTS).forEach((a) => {
      $(ACTS[a]).hidden = a !== act;
      if (a === act) $('sw-' + a).setAttribute('aria-current', 'page');
      else $('sw-' + a).removeAttribute('aria-current');
    });
  }
  function route() {
    let h = location.hash.slice(1);
    try { h = decodeURIComponent(h); } catch (e) { h = ''; }
    if (ACTS[h]) { show(h); window.scrollTo({ top: 0, behavior: 'instant' }); return; }
    const el = h ? document.getElementById(h) : null;
    const box = el && el.closest('.activity');
    const act = box ? Object.keys(ACTS).find((a) => ACTS[a] === box.id) : 'ai3';
    show(act);
    if (el && box) el.scrollIntoView();
  }
  window.addEventListener('hashchange', route);
  route();

  /* ---------- Paso 1. Presupuesto ---------- */
  const INCOME = [
    { name: 'Sueldo de medio tiempo', v: 9500 },
    { name: 'Apoyo familiar', v: 3000 }
  ];
  const EXPENSES = [
    { name: 'Aportación a la renta', t: 'f', v: 3000, adj: 3000 },
    { name: 'Alimentación en casa', t: 'v', v: 4200, adj: 3800 },
    { name: 'Transporte', t: 'f', v: 1500, adj: 1500 },
    { name: 'Celular e internet', t: 'f', v: 800, adj: 800 },
    { name: 'Comida fuera y antojos', t: 'v', v: 1800, adj: 600 },
    { name: 'Plataformas de streaming', t: 'v', v: 450, adj: 150 },
    { name: 'Ropa y calzado', t: 'v', v: 1200, adj: 500 },
    { name: 'Salidas y entretenimiento', t: 'v', v: 1000, adj: 400 },
    { name: 'Otros gastos', t: 'v', v: 600, adj: 300 }
  ];
  let state = 'original'; // original | adjusted | mine | edited
  let capacity = 0, saving = 0;   // capacidad de pago y ahorro mensual (paso 2)
  let method = 'simple';          // tipo de interés (paso 3)
  const N = 12;                   // plazo en meses

  function buildBudget() {
    const tin = $('bIn'), tout = $('bOut');
    INCOME.forEach((r, i) => {
      const tr = tin.insertRow();
      tr.insertCell().textContent = r.name;
      const c = tr.insertCell();
      c.innerHTML = `<input type="number" min="0" step="100" id="in${i}" aria-label="${r.name}">`;
    });
    EXPENSES.forEach((r, i) => {
      const tr = tout.insertRow();
      tr.id = 'row-out' + i;
      const c0 = tr.insertCell();
      c0.textContent = r.name;
      const tag = document.createElement('span');
      tag.className = 'tag' + (r.t === 'v' ? ' v' : '');
      tag.textContent = r.t === 'v' ? 'variable' : 'fijo';
      c0.appendChild(tag);
      const c = tr.insertCell();
      c.innerHTML = `<input type="number" min="0" step="50" id="out${i}" aria-label="${r.name}">`;
    });
    document.querySelectorAll('#bIn input, #bOut input').forEach((inp) =>
      inp.addEventListener('input', () => {
        if (parseFloat(inp.value) < 0) inp.value = 0;
        state = state === 'mine' ? 'mine' : 'edited';
        budgetRender();
      }));
  }
  function setBudget(mode) {
    state = mode;
    INCOME.forEach((r, i) => { $('in' + i).value = mode === 'mine' ? 0 : r.v; });
    EXPENSES.forEach((r, i) => {
      $('out' + i).value = mode === 'mine' ? 0 : mode === 'adjusted' ? r.adj : r.v;
    });
    budgetRender();
  }
  const num = (id) => Math.max(0, parseFloat($(id).value) || 0);
  function totals() {
    const ti = INCOME.reduce((a, _, i) => a + num('in' + i), 0);
    const tg = EXPENSES.reduce((a, _, i) => a + num('out' + i), 0);
    return { ti, tg, saldo: ti - tg };
  }
  function budgetRender() {
    const { ti, tg, saldo } = totals();
    $('bTi').textContent = money(ti);
    $('bTg').textContent = money(tg);
    const s = $('bSaldo');
    s.textContent = money(saldo);
    s.className = 'mono ' + (saldo > 0 ? 'pos' : saldo < 0 ? 'neg' : '');
    const mx = Math.max(ti, tg, 1);
    $('barIn').style.width = (ti / mx * 100) + '%';
    $('barOut').style.width = (tg / mx * 100) + '%';

    EXPENSES.forEach((r, i) => {
      $('row-out' + i).classList.toggle('changed', state !== 'mine' && num('out' + i) < r.v);
    });

    let m;
    if (ti === 0 && tg === 0) {
      m = 'Escribe tus ingresos y gastos de un mes típico. El saldo se calcula solo.';
    } else if (saldo < 0) {
      m = `<span class="chip out">Saldo negativo</span> Se gastan <b>${money(-saldo)}</b> más de lo que se gana cada mes. Esa diferencia se cubre con deudas o con ahorros que se agotan. Antes de pensar en un crédito hay que ajustar los gastos.`;
    } else if (saldo === 0) {
      m = '<span class="chip base">Saldo cero</span> Alcanza justo para los gastos, pero no queda margen para imprevistos, ahorro ni mensualidades.';
    } else {
      let extra = '';
      if (state === 'adjusted') {
        const cut = EXPENSES.reduce((a, r) => a + (r.v - r.adj), 0);
        extra = ` Se redujeron <b>${money(cut)}</b> de gastos, sobre todo variables, sin tocar los fijos.`;
      }
      m = `<span class="chip in">Excedente</span> Quedan <b>${money(saldo)}</b> al mes.${extra} Ahora sí se puede decidir cuánto ahorrar, cuánto destinar a créditos y cuánto invertir.`;
    }
    $('bMsg').innerHTML = m;
    distRender();
  }
  buildBudget();
  $('bAdjust').addEventListener('click', () => setBudget('adjusted'));
  $('bReset').addEventListener('click', () => setBudget('original'));
  $('bMine').addEventListener('click', () => { setBudget('mine'); $('in0').focus(); });

  /* ---------- Paso 2. Reparto del excedente ---------- */
  // Reparte un monto entero según porcentajes, de modo que las partes sumen exactamente el total.
  function split(totalPesos, pcts) {
    const sum = pcts.reduce((x, y) => x + y, 0);
    if (sum <= 0) return pcts.map(() => 0);
    const raw = pcts.map((p) => totalPesos * p / sum);
    const parts = raw.map(Math.floor);
    let rest = totalPesos - parts.reduce((x, y) => x + y, 0);
    raw.map((r, i) => [r - Math.floor(r), i]).sort((x, y) => y[0] - x[0])
      .forEach(([, i]) => { if (rest > 0) { parts[i]++; rest--; } });
    return parts;
  }
  const pctIn = (id) => {
    const el = $(id);
    let v = parseFloat(el.value);
    if (v < 0) { v = 0; el.value = 0; }
    if (v > 100) { v = 100; el.value = 100; }
    return v || 0;
  };
  let distOk = true;
  function distRender() {
    const a = pctIn('dA'), c = pctIn('dC'), v = pctIn('dI');
    const sum = Math.round((a + c + v) * 100) / 100;
    const { saldo } = totals();
    const base = Math.max(0, Math.round(saldo));
    distOk = Math.abs(sum - 100) < 0.001;
    const [pa, pc, pv] = distOk ? split(base, [a, c, v]) : [base * a / 100, base * c / 100, base * v / 100];
    $('mA').textContent = money(pa);
    $('mC').textContent = money(pc);
    $('mI').textContent = money(pv);
    capacity = distOk ? pc : 0;
    saving = distOk ? pa : 0;
    let m;
    if (saldo <= 0) {
      m = '<span class="chip out">Sin excedente</span> Con saldo cero o negativo no hay nada que repartir: la capacidad de pago es $0. Regresa al paso 1 y ajusta los gastos.';
    } else if (!distOk) {
      m = `<span class="chip out">Revisa los porcentajes</span> Suman ${sum} %. Deben sumar 100 % para repartir todo el excedente.`;
    } else {
      m = `De un excedente de <b>${money(saldo)}</b>, la capacidad de pago es <b>${money(capacity)}</b> al mes. Ninguna mensualidad nueva debería superar esa cantidad.`;
    }
    $('dMsg').innerHTML = m;
    cmpRender();
  }
  document.querySelectorAll('#dPresets .pill').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('#dPresets .pill').forEach((x) => x.classList.remove('on'));
    b.classList.add('on');
    if (b.dataset.p !== 'custom') {
      const [x, y, z] = b.dataset.p.split(',');
      $('dA').value = x; $('dC').value = y; $('dI').value = z;
    } else {
      $('dA').focus();
    }
    distRender();
  }));
  ['dA', 'dC', 'dI'].forEach((id) => $(id).addEventListener('input', () => {
    document.querySelectorAll('#dPresets .pill').forEach((x) => x.classList.toggle('on', x.dataset.p === 'custom'));
    distRender();
  }));

  /* ---------- Paso 3. Interés ---------- */
  const total = (P, i) => method === 'simple' ? P * (1 + i * N) : P * Math.pow(1 + i, N);

  function interestRender() {
    const P = 8000, i = 0.03;
    if (method === 'simple') {
      $('mFormula').innerHTML = '<span class="nw">M = P(1 + i × n)</span> &nbsp;&nbsp;<span class="nw">equivale a</span>&nbsp;&nbsp; <span class="nw">M = P + P × i × n</span>';
      const I = P * i * N;
      $('mSteps').innerHTML = `1. Interés de un mes: $8 000 × 0.03 = <b>${money2(P * i)}</b><br>
        2. Interés de 12 meses: ${money2(P * i)} × 12 = <b>${money2(I)}</b><br>
        3. Total a pagar: $8 000 + ${money2(I)} = <b>${money2(P + I)}</b><br>
        <span class="small">El interés de cada mes es el mismo porque siempre se calcula sobre $8 000.</span>`;
    } else {
      $('mFormula').innerHTML = '<span class="nw">M = P(1 + i)<sup>n</sup></span>';
      const f = Math.pow(1 + i, N);
      $('mSteps').innerHTML = `1. Factor mensual: 1 + 0.03 = <b>1.03</b><br>
        2. Factor de 12 meses: 1.03<sup>12</sup> = <b>${f.toFixed(5)}</b><br>
        3. Total a pagar: $8 000 × ${f.toFixed(5)} = <b>${money2(P * f)}</b><br>
        <span class="small">Cada mes el interés se calcula sobre un saldo mayor, por eso el total supera al del interés simple.</span>`;
    }
  }
  function setMethod(m) {
    method = m;
    ['mTabs', 'xTabs'].forEach((g) => document.querySelectorAll('#' + g + ' button').forEach((b) => {
      const on = b.dataset.m === m;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    }));
    interestRender();
    cmpRender();
    sheetRender();
  }
  ['mTabs', 'xTabs'].forEach((g) => document.querySelectorAll('#' + g + ' button').forEach((b) =>
    b.addEventListener('click', () => setMethod(b.dataset.m))));

  /* ---------- Paso 4. Comparador ---------- */
  const STORES = [
    { n: 'X', cel: 6900, aud: 1100, r: 2 },
    { n: 'Y', cel: 6200, aud: 1150, r: 3 },
    { n: 'Z', cel: 5900, aud: 1250, r: 4 }
  ];
  const RATES = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
  function buildCmp() {
    const body = $('cmpBody');
    STORES.forEach((s, k) => {
      const tr = body.insertRow();
      tr.insertCell().textContent = 'Tienda ' + s.n;
      tr.insertCell().textContent = money(s.cel);
      tr.insertCell().textContent = money(s.aud);
      const c = tr.insertCell();
      const sel = document.createElement('select');
      sel.id = 'rate' + k;
      sel.setAttribute('aria-label', 'Tasa mensual de la tienda ' + s.n);
      RATES.forEach((r) => { const o = document.createElement('option'); o.value = r; o.textContent = r + ' %'; if (r === s.r) o.selected = true; sel.appendChild(o); });
      sel.addEventListener('change', cmpRender);
      c.appendChild(sel);
      for (let j = 0; j < 4; j++) tr.insertCell();
    });
  }
  function cmpRender() {
    if (!$('rate0')) return;
    $('cmpMethod').textContent = method === 'simple' ? 'interés simple' : 'interés compuesto';
    const rows = STORES.map((s, k) => {
      const i = +$('rate' + k).value / 100;
      const tc = total(s.cel, i), ta = total(s.aud, i);
      return { s, tc, ta, tb: tc + ta, mens: (tc + ta) / N, cash: s.cel + s.aud };
    });
    const minOf = (key) => Math.min(...rows.map((r) => r[key]));
    const mins = { tc: minOf('tc'), ta: minOf('ta'), tb: minOf('tb'), mens: minOf('mens') };
    const trs = $('cmpBody').rows;
    rows.forEach((r, k) => {
      const cells = trs[k].cells;
      [['tc', 4], ['ta', 5], ['tb', 6], ['mens', 7]].forEach(([key, col]) => {
        cells[col].textContent = money2(r[key]);
        cells[col].className = Math.abs(r[key] - mins[key]) < 0.005 ? 'best' : '';
        if (key === 'mens' && capacity > 0 && r.mens > capacity) cells[col].classList.add('over');
      });
    });

    const best = rows.find((r) => Math.abs(r.tb - mins.tb) < 0.005);
    const bestInterest = best.tb - best.cash;
    $('optStore').innerHTML = `<h4>Opción 1 · Todo en una tienda</h4><p>La tienda ${best.s.n} tiene el menor total por ambos artículos: <b>${money2(best.tb)}</b>, de los cuales <b>${money2(bestInterest)}</b> son intereses.</p>`;

    const rc = rows.find((r) => Math.abs(r.tc - mins.tc) < 0.005);
    const ra = rows.find((r) => Math.abs(r.ta - mins.ta) < 0.005);
    const mix = mins.tc + mins.ta;
    const diff = best.tb - mix;
    $('optMix').innerHTML = `<h4>Opción 2 · Compra combinada</h4><p>Celular en ${rc.s.n} y audífonos en ${ra.s.n}: <b>${money2(mix)}</b>. ` +
      (diff > 0.005 ? `Ahorras <b>${money2(diff)}</b> frente a comprar todo en la tienda ${best.s.n}.` : 'En este escenario coincide con la mejor tienda, así que no hay ahorro adicional.') + '</p>';

    const cCel = Math.min(...STORES.map((s) => s.cel)), cAud = Math.min(...STORES.map((s) => s.aud));
    const cash = cCel + cAud;
    const lowest = Math.min(best.tb, mix);
    $('optCash').innerHTML = `<h4>Opción 3 · Pago de contado</h4><p>Comprando cada artículo donde su precio de contado es menor, pagarías <b>${money(cash)}</b>, es decir, <b>${money2(lowest - cash)}</b> menos que la mejor opción a crédito.</p>`;

    let m;
    const monthly = saving + capacity;
    const { saldo } = totals();
    if (saldo <= 0) {
      m = '<span class="chip out">Sin capacidad de pago</span> Con el presupuesto actual no hay excedente para mensualidades. Ninguna compra a crédito es responsable todavía.';
    } else if (!distOk) {
      m = '<span class="chip out">Falta definir el reparto</span> Los porcentajes del paso 2 deben sumar 100 % para conocer la capacidad de pago.';
    } else if (capacity <= 0) {
      m = '<span class="chip out">Sin capacidad de pago</span> En el paso 2 no destinaste ninguna parte del excedente a créditos, así que no conviene adquirir una deuda nueva.';
    } else {
      const fits = rows.filter((r) => r.mens <= capacity);
      if (fits.length) {
        m = `<span class="chip in">Cabe en el presupuesto</span> Con una capacidad de pago de <b>${money(capacity)}</b> al mes, la mensualidad de la tienda ${fits.map((r) => r.s.n).join(', ')} no la rebasa.`;
      } else {
        m = `<span class="chip out">No cabe en el presupuesto</span> La capacidad de pago es de <b>${money(capacity)}</b> al mes y todas las mensualidades la superan (en rojo). Comprar a crédito así desequilibraría el presupuesto.`;
      }
      if (monthly > 0) {
        m += `<br>Alternativa: si juntas la parte de ahorro y la de crédito (${money(monthly)} al mes), reúnes ${money(cash)} para pagar de contado en <b>${Math.ceil(cash / monthly)} meses</b>, sin pagar intereses.`;
      }
    }
    $('cmpCap').innerHTML = m;
  }

  /* ---------- Paso 5. Hoja de cálculo ---------- */
  function sheetRender() {
    const simple = method === 'simple';
    const tot = (c, r) => simple ? `=${c}${r}*(1+D${r}*$J$1)` : `=${c}${r}*(1+D${r})^$J$1`;
    const FX = {};
    FX[tot('B', 2)] = simple
      ? 'Total de la computadora con interés simple: precio × (1 + tasa × plazo). La tasa está en D2 y el plazo en J1.'
      : 'Total de la computadora con interés compuesto: precio × (1 + tasa) elevado al plazo. El símbolo ^ significa “elevado a”.';
    FX[tot('C', 2)] = 'Lo mismo para la impresora: cambia el precio (columna C), la tasa y el plazo son los mismos.';
    FX['=E2+F2'] = 'Total por ambos artículos en la misma tienda.';
    FX['=G2/$J$1'] = 'Mensualidad aproximada: el total dividido entre 12 pagos iguales. Compárala con tu capacidad de pago.';
    FX['=MIN(G2:G4)'] = 'Encuentra el menor total por ambos artículos entre las tres tiendas.';
    FX['=INDICE(A2:A4,COINCIDIR(G6,G2:G4,0))'] = 'Devuelve el nombre de la tienda que tiene el menor total. COINCIDIR busca en qué fila está el mínimo e INDICE trae el nombre de esa fila.';
    FX['=MIN(E2:E4)+MIN(F2:F4)'] = 'Compra combinada: el menor total de la computadora más el menor total de la impresora, aunque sean de tiendas distintas.';
    FX['=G2-(B2+C2)'] = 'Intereses pagados en una tienda: total a crédito menos precio de contado.';
    FX['12'] = 'Plazo en meses. Al escribirlo en una celda, las fórmulas lo leen con $J$1.';

    const H = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const rows = [
      ['1', ['lbl', 'Tienda'], ['lbl', 'Computadora'], ['lbl', 'Impresora'], ['lbl', 'Tasa mensual'], ['lbl', 'Total computadora'], ['lbl', 'Total impresora'], ['lbl', 'Total ambos'], ['lbl', 'Mensualidad'], ['lbl', 'Plazo (meses)'], ['f inp', '12']],
      ['2', ['inp', 'dato'], ['inp', 'dato'], ['inp', 'dato'], ['inp', 'dato %'], ['f', tot('B', 2)], ['f', tot('C', 2)], ['f', '=E2+F2'], ['f', '=G2/$J$1'], ['', ''], ['', '']],
      ['3', ['inp', 'dato'], ['inp', 'dato'], ['inp', 'dato'], ['inp', 'dato %'], ['note', '… copia la fila 2 hacia abajo para las otras tiendas …', 4], ['', ''], ['', '']],
      ['4', ['inp', 'dato'], ['inp', 'dato'], ['inp', 'dato'], ['inp', 'dato %'], ['', ''], ['', ''], ['', ''], ['', ''], ['', ''], ['', '']],
      ['5', ['', ''], ['', ''], ['', ''], ['', ''], ['', ''], ['', ''], ['', ''], ['', ''], ['', ''], ['', '']],
      ['6', ['lbl', 'Menor total', 6], ['f', '=MIN(G2:G4)'], ['', ''], ['', ''], ['', '']],
      ['7', ['lbl', 'Mejor tienda', 6], ['f', '=INDICE(A2:A4,COINCIDIR(G6,G2:G4,0))', 4]],
      ['8', ['lbl', 'Compra combinada', 6], ['f', '=MIN(E2:E4)+MIN(F2:F4)', 4]],
      ['9', ['lbl', 'Intereses pagados en la tienda de la fila 2', 6], ['f', '=G2-(B2+C2)', 4]]
    ];
    const t = $('sheet4');
    t.textContent = '';
    const hr = t.insertRow();
    H.forEach((h) => { const th = document.createElement('th'); th.textContent = h; hr.appendChild(th); });
    rows.forEach((r) => {
      const tr = t.insertRow();
      const rh = tr.insertCell(); rh.className = 'rh'; rh.textContent = r[0];
      r.slice(1).forEach(([cls, txt, span]) => {
        const td = tr.insertCell();
        td.textContent = txt;
        if (span) td.colSpan = span;
        if (cls === 'note') { td.style.color = '#777'; td.style.fontFamily = "'Source Sans 3',sans-serif"; }
        else if (cls) td.className = cls;
      });
    });
    t.querySelectorAll('td.f').forEach((td) => {
      td.tabIndex = 0;
      td.setAttribute('role', 'button');
      const showF = () => {
        t.querySelectorAll('td.sel').forEach((x) => x.classList.remove('sel'));
        td.classList.add('sel');
        const f = td.textContent.trim();
        $('ftext4').textContent = f;
        $('fexp4').textContent = FX[f] || '';
      };
      td.addEventListener('click', showF);
      td.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showF(); } });
    });
    $('ftext4').textContent = 'Selecciona una celda azul.';
    $('fexp4').textContent = 'Aquí aparecerá la explicación de la fórmula.';
  }

  buildCmp();
  setMethod('simple');
  setBudget('original');

  /* ---------- Paso 7. Preguntas ---------- */
  const Q = [
    {
      p: 'Una tienda tiene el precio de contado más bajo, pero la tasa de interés más alta. ¿Cómo decides si conviene?',
      o: ['Elijo esa tienda porque el precio es el más bajo.', 'Calculo el total a pagar de cada tienda y comparo esos totales.', 'Elijo la tienda con la tasa más baja, sin importar el precio.'],
      a: 1,
      f: ['El precio de contado no incluye los intereses; el total a crédito puede ser mayor.', 'Correcto. Precio y tasa juntos determinan el total a pagar.', 'Una tasa baja sobre un precio alto también puede resultar cara.']
    },
    {
      p: 'Con interés simple, una tasa de 3 % mensual durante 12 meses agrega al precio de contado…',
      o: ['3 % del precio.', '12 % del precio.', '36 % del precio.'],
      a: 2,
      f: ['El 3 % se paga cada mes, no una sola vez.', 'Revisa la fórmula: la tasa mensual se multiplica por el número de meses.', 'Correcto. 3 % × 12 meses = 36 % del precio.']
    },
    {
      p: 'Tu presupuesto tiene saldo negativo y quieres comprar una computadora a meses. ¿Qué haces primero?',
      o: ['Busco la tienda con la mensualidad más baja.', 'Ajusto mis gastos hasta tener un excedente y calculo mi capacidad de pago.', 'Pido un préstamo para cubrir el saldo negativo.'],
      a: 1,
      f: ['Aunque sea baja, cualquier mensualidad aumenta un saldo que ya es negativo.', 'Correcto. Sin excedente no hay capacidad de pago para una deuda nueva.', 'Eso cubre el problema por un mes, pero genera intereses y no lo resuelve.']
    }
  ];
  const qz = $('quizB');
  Q.forEach((q, qi) => {
    const d = document.createElement('div'); d.className = 'q';
    const p = document.createElement('p'); p.textContent = `${qi + 1}. ${q.p}`; d.appendChild(p);
    const fb = document.createElement('div'); fb.className = 'fb'; fb.setAttribute('aria-live', 'polite');
    q.o.forEach((txt, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = txt;
      b.addEventListener('click', () => {
        d.querySelectorAll('button').forEach((x) => x.classList.remove('right', 'wrong'));
        b.classList.add(i === q.a ? 'right' : 'wrong');
        fb.textContent = (i === q.a ? '✅ ' : '↺ ') + q.f[i] + (i === q.a ? '' : ' Intenta otra opción.');
      });
      d.appendChild(b);
    });
    d.appendChild(fb); qz.appendChild(d);
  });

  /* ---------- Paso 8. Lista ---------- */
  const cbs = document.querySelectorAll('#check4 input');
  cbs.forEach((c) => c.addEventListener('change', () => {
    const n = [...cbs].filter((x) => x.checked).length;
    $('pbar4').style.width = (n / cbs.length * 100) + '%';
    $('pwrap4').setAttribute('aria-valuenow', n);
    $('ptext4').textContent = `${n} de ${cbs.length}` + (n === cbs.length ? ' · ¡Listo para entregar!' : '');
  }));
})();

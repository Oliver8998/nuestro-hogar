import EN from './i18n_en.js';

const CLAVE = 'hogar-idioma';

export function idioma() {
  try {
    const g = localStorage.getItem(CLAVE);
    if (g === 'es' || g === 'en') return g;
  } catch (e) {}
  return (navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en';
}

export function ponerIdioma(i) {
  try {
    localStorage.setItem(CLAVE, i);
  } catch (e) {}
  location.reload();
}

const norm = s => s.replace(/\s+/g, ' ').trim();
const exactas = new Map();
const patrones = [];
for (const [es, en] of Object.entries(EN)) {
  const k = norm(es);
  if (!/\{\d+\}/.test(k)) {
    exactas.set(k, en);
    continue;
  }
  const orden = [];
  const trozos = k.split(/(\{\d+\})/);
  const fuente = trozos.map((p, i) => {
    const m = p.match(/^\{(\d+)\}$/);
    if (m) {
      orden.push(Number(m[1]));
      return /[A-Za-zÁÉÍÓÚáéíóúñÑ]$/.test(trozos[i - 1] || '') ? '(.*?)' : '(.+?)';
    }
    return p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('');
  const literal = (k.replace(/\{\d+\}/g, '').match(/[A-Za-zÁÉÍÓÚáéíóúñÑ]/g) || []).length;
  if ((literal < 3 && !/^[A-Za-zÁÉÍÓÚáéíóúñÑ]+ \{/.test(k)) || k === '{0} de {1}') continue;
  patrones.push({ re: new RegExp(`^${fuente}$`, 's'), orden, en, literal });
}
patrones.sort((a, b) => b.literal - a.literal);

const cache = new Map();
const EMOJI = /^([\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D\u20E3\s\d.,:+×·%/-]*)(.*?)([\s\p{Extended_Pictographic}\uFE0F\u200D!?.…▾▸›]*)$/u;

function sinFormato(t) {
  if (exactas.has(t)) return exactas.get(t);
  const nums = t.match(/^(\d+) de (\d+)$/);
  if (nums) return `${nums[1]} of ${nums[2]}`;
  for (const p of patrones) {
    const m = t.match(p.re);
    if (!m) continue;
    let r = p.en;
    p.orden.forEach((n, k) => {
      const v = m[k + 1];
      const tv = v === 'es' && new RegExp(`[a-z]\\{${n}\\}`).test(p.en) ? 's' : traducirTexto(v);
      r = r.split(`{${n}}`).join(tv);
    });
    return r.replace(/\{\d+\}/g, '');
  }
  return null;
}

export function traducirTexto(texto) {
  if (!texto || !/[A-Za-zÁÉÍÓÚáéíóúñÑ]/.test(texto)) return texto;
  if (cache.has(texto)) return cache.get(texto);
  const t = norm(texto);
  let r = sinFormato(t);
  if (r === null && /^[a-záéíóúñ]/.test(t)) {
    const may = sinFormato(t[0].toUpperCase() + t.slice(1));
    if (may !== null) r = may[0].toLowerCase() + may.slice(1);
  }
  if (r === null) {
    const m = t.match(EMOJI);
    if (m && m[2] && (m[1] || m[3])) {
      const dentro = sinFormato(m[2]);
      if (dentro !== null) r = `${m[1]}${dentro}${m[3]}`;
    }
  }
  if (r === null && /\s[·|]\s/.test(t)) {
    const partes = t.split(/(\s[·|]\s)/);
    const tr = partes.map(p => (/^\s[·|]\s$/.test(p) ? p : traducirTexto(p)));
    if (tr.some((p, i) => p !== partes[i])) r = tr.join('');
  }
  if (r === null && t.includes(', ')) {
    const partes = t.split(', ');
    const tr = partes.map(p => traducirTexto(p));
    if (tr.some((p, i) => p !== partes[i])) r = tr.join(', ');
  }
  if (r === null) r = texto;
  else {
    const ini = texto.match(/^\s*/)[0];
    const fin = texto.match(/\s*$/)[0];
    r = ini + r + fin;
  }
  if (cache.size > 5000) cache.clear();
  cache.set(texto, r);
  return r;
}

const ATRIBUTOS = ['placeholder', 'title', 'aria-label', 'alt'];
const IGNORAR = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT']);

function nodoTexto(n) {
  const p = n.parentNode;
  if (!p || IGNORAR.has(p.nodeName) || (p.closest && p.closest('[data-no-traducir]'))) return;
  const v = n.nodeValue;
  const t = traducirTexto(v);
  if (t !== v) n.nodeValue = t;
}

function elemento(el) {
  if (el.nodeType !== 1) return;
  if (IGNORAR.has(el.nodeName) && el.nodeName !== 'INPUT' && el.nodeName !== 'TEXTAREA') return;
  for (const a of ATRIBUTOS) {
    if (!el.hasAttribute(a)) continue;
    const v = el.getAttribute(a);
    const t = traducirTexto(v);
    if (t !== v) el.setAttribute(a, t);
  }
}

function recorrer(raiz) {
  if (raiz.nodeType === 3) {
    nodoTexto(raiz);
    return;
  }
  if (raiz.nodeType !== 1 || raiz.nodeName === 'SCRIPT' || raiz.nodeName === 'STYLE') return;
  elemento(raiz);
  const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n;
  while ((n = w.nextNode())) {
    if (n.nodeType === 3) nodoTexto(n);
    else elemento(n);
  }
}

export function activarTraduccion() {
  if (idioma() !== 'en') return;
  document.documentElement.lang = 'en';
  recorrer(document.body);
  const obs = new MutationObserver(lista => {
    for (const m of lista) {
      if (m.type === 'characterData') nodoTexto(m.target);
      else if (m.type === 'attributes') elemento(m.target);
      else for (const n of m.addedNodes) recorrer(n);
    }
  });
  obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATRIBUTOS });
}

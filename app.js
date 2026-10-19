/* تكامل — واجهة الموقع: البيانات، العرض، الروابط، البحث، المساعد. */
(function () {
'use strict';

const T = window.T = {};
const PUB = window.TAKAMUL || { subjects: [], lessons: [], labs: [], site: {} };
const DRAFT_KEY = 'takamul.draft.v1';
const VIEWPUB_KEY = 'takamul.viewPublished';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const view = $('#view');

/* ---------- helpers ---------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = o => JSON.parse(JSON.stringify(o));
function plural(n, one, two, few) { return n === 1 ? one : n === 2 ? two : `${n} ${few}`; }
/* Arabic counted noun: 1, 2, 3–10, 11+ */
const W = { lesson: ['موضوع واحد', 'موضوعان', 'مواضيع', 'موضوعًا'], topic: ['وحدة واحدة', 'وحدتان', 'وحدات', 'وحدة'], branch: ['فرع واحد', 'فرعان', 'فروع', 'فرعًا'], term: ['مصطلح واحد', 'مصطلحان', 'مصطلحات', 'مصطلحًا'], subj: ['مادة واحدة', 'مادتان', 'مواد', 'مادة'], lab: ['تجربة واحدة', 'تجربتان', 'تجارب', 'تجربة'] };
function cnt(n, w, bold) { w = W[w]; if (n === 1) return w[0]; if (n === 2) return w[1]; const m = n % 100; return (bold ? `<b>${n}</b>` : n) + ' ' + (m >= 3 && m <= 10 ? w[2] : w[3]); }
T.esc = esc;

/* ---------- local files (uploads from the editor, kept in IndexedDB) ---------- */
const FILES = T.FILES = {};
function idbOpen() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('takamul-files', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('files');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
T.idbAll = async function () {
  try {
    const db = await idbOpen();
    return await new Promise(res => {
      const out = {}; const req = db.transaction('files').objectStore('files').openCursor();
      req.onsuccess = () => { const c = req.result; if (c) { out[c.key] = c.value; c.continue(); } else res(out); };
      req.onerror = () => res(out);
    });
  } catch (e) { return {}; }
};
T.idbPut = async function (key, val) {
  const db = await idbOpen();
  return new Promise((res, rej) => { const tx = db.transaction('files', 'readwrite'); tx.objectStore('files').put(val, key); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
};
T.idbClear = async function () {
  try { const db = await idbOpen(); await new Promise(res => { const tx = db.transaction('files', 'readwrite'); tx.objectStore('files').clear(); tx.oncomplete = res; tx.onerror = res; }); } catch (e) {}
  Object.keys(FILES).forEach(k => { URL.revokeObjectURL(FILES[k]); delete FILES[k]; });
};
T.loadFiles = async function () {
  const all = await T.idbAll();
  Object.entries(all).forEach(([k, v]) => { if (!FILES[k] && v && v.blob) FILES[k] = URL.createObjectURL(v.blob); });
  return Object.keys(all).length;
};
const fileUrl = T.fileUrl = p => FILES[p] || p;

/* ---------- data (published content, or the editor draft in this browser) ---------- */
let DATA, IX, USING_DRAFT = false;
function readDraft() { try { const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); return d && d.data ? d : null; } catch (e) { return null; } }
function viewPub() { try { return sessionStorage.getItem(VIEWPUB_KEY) === '1'; } catch (e) { return false; } }
T.readDraft = readDraft;
T.saveDraft = function (data, meta) { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(Object.assign({ data, savedAt: Date.now() }, meta || {}))); return true; } catch (e) { return false; } };
T.clearDraft = function () { try { localStorage.removeItem(DRAFT_KEY); sessionStorage.removeItem(VIEWPUB_KEY); } catch (e) {} };
T.published = () => clone(PUB);

function loadData() {
  let d = readDraft();
  // a draft that is now identical to the published content is no longer needed
  if (d && JSON.stringify(d.data) === JSON.stringify(PUB)) { T.clearDraft(); try { localStorage.removeItem('takamul.base.v1'); } catch (e) {} d = null; }
  if (d && !viewPub()) { DATA = d.data; USING_DRAFT = true; } else { DATA = clone(PUB); USING_DRAFT = false; }
  DATA.labs = DATA.labs || []; DATA.aliases = DATA.aliases || {}; DATA.site = DATA.site || {};
  T.data = DATA;
  buildIndex();
  drawDraftBar();
}
T.loadData = loadData;
T.useData = function (d) { DATA = d; d.labs = d.labs || []; d.aliases = d.aliases || {}; d.site = d.site || {}; T.data = DATA; buildIndex(); };

function drawDraftBar() {
  const bar = $('#draftbar');
  const has = !!readDraft();
  if (!has) { bar.innerHTML = ''; return; }
  const d = readDraft();
  if (USING_DRAFT && d.publishedAt && d.publishedAt >= d.savedAt) { bar.innerHTML = `<div class="draftbar" style="background:#167a5a">✓ نُشرت تعديلاتك، وتظهر لكل الزوار خلال دقيقة أو دقيقتين<a href="#editor">العودة للمحرّر</a></div>`; return; }
  bar.innerHTML = USING_DRAFT
    ? `<div class="draftbar">عندك تعديلات لم تُنشر بعد، ولا يراها غيرك<button type="button" class="db-pub" data-publish>☁ نشر للجميع</button><a href="#editor">المحرّر</a><a href="#" data-viewpub="1">عرض النسخة المنشورة</a></div>`
    : `<div class="draftbar">تشاهد النسخة المنشورة<a href="#" data-viewpub="0">عرض مسودتي</a></div>`;
}
document.addEventListener('click', e => {
  if (e.target.closest('[data-publish]') && window.TEditor) { e.preventDefault(); window.TEditor.publishQuiet(); return; }
  const a = e.target.closest('[data-viewpub]');
  if (!a) return;
  e.preventDefault();
  try { a.dataset.viewpub === '1' ? sessionStorage.setItem(VIEWPUB_KEY, '1') : sessionStorage.removeItem(VIEWPUB_KEY); } catch (err) {}
  loadData(); route();
});

/* ---------- links inside lessons ---------- */
const LINK_RE = /\[\[([^\]|]+)\|([^\]]+)\]\]/g;
function ytId(u) { const m = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/); return m && m[1]; }
function parseTarget(t) {
  t = String(t).trim(); let m;
  if ((m = t.match(/^(?:درس|موضوع|lesson)\s*:\s*(.+)$/i))) return { kind: 'lesson', id: m[1].trim() };
  if ((m = t.match(/^(?:تجربة|lab)\s*:\s*(.+)$/i))) return { kind: 'lab', id: m[1].trim() };
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(t)) return { kind: 'video', url: t, file: true };
  if (/^https?:\/\//i.test(t)) {
    const yt = ytId(t);
    if (yt) return { kind: 'video', url: t, embed: `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0` };
    const vm = t.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vm) return { kind: 'video', url: t, embed: `https://player.vimeo.com/video/${vm[1]}?autoplay=1` };
    return { kind: 'url', url: t };
  }
  return { kind: 'url', url: t };
}
T.parseTarget = parseTarget;
const termKey = w => { w = String(w).trim(); return (DATA.aliases && DATA.aliases[w]) || w; };
function extractLinks(body) {
  const out = []; let m; LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(body || ''))) out.push(Object.assign({ word: m[1].trim(), raw: m[2] }, parseTarget(m[2])));
  return out;
}
T.extractLinks = extractLinks;

/* ---------- index ---------- */
function buildIndex() {
  const subj = {}, les = {}, place = {}, labs = {}, order = {};
  DATA.subjects.forEach(s => {
    subj[s.id] = s; order[s.id] = [];
    s.topics.forEach(t => t.branches.forEach(b => b.lessons.forEach((lid, i) => { place[lid] = { s, t, b, i }; order[s.id].push(lid); })));
  });
  DATA.lessons.forEach(l => { les[l.id] = l; });
  DATA.labs.forEach(x => { labs[x.id] = x; });
  const out = {}, inb = {}, terms = {}, labIn = {};
  DATA.lessons.forEach(l => {
    const links = extractLinks(l.body);
    out[l.id] = links;
    links.forEach(k => {
      if (k.kind === 'lesson' && les[k.id]) (inb[k.id] = inb[k.id] || new Set()).add(l.id);
      const key = termKey(k.word);
      const tm = terms[key] = terms[key] || { term: key, src: new Set(), tgt: new Set() };
      if (place[l.id]) tm.src.add(l.id);
      if (k.kind === 'lesson' && les[k.id] && place[k.id]) tm.tgt.add(k.id);
    });
    ((l.body || '').match(/^::lab\[([^\]]+)\]/gm) || []).forEach(x => { const id = x.slice(6, -1).trim(); (labIn[id] = labIn[id] || []).push(l.id); });
  });
  Object.values(terms).forEach(tm => {
    tm.lessons = [...new Set([...tm.src, ...tm.tgt])];
    tm.subjects = [...new Set(tm.lessons.map(id => place[id].s.id))];
  });
  IX = T.ix = { subj, les, place, labs, out, inb, terms, labIn, order };
  buildSearch();
}
const hasBody = l => !!(l && l.body && l.body.trim());
T.hasBody = hasBody;

/* ---------- icons ---------- */
function subjIcon(s, size = 26) {
  const st = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
  switch (s && s.icon) {
    case 'bio': return `<svg ${st}><path d="M7 3c0 6 10 6 10 12s-10 6-10 6M17 3c0 6-10 6-10 12"/><path d="M8.5 7h7M8.5 17h7"/></svg>`;
    case 'chem': return `<svg ${st}><path d="M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3"/><path d="M7.5 15h9"/></svg>`;
    case 'phys': return `<svg ${st}><circle cx="12" cy="12" r="1.6" fill="currentColor"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/></svg>`;
    case 'math': return `<svg ${st}><path d="M4 20 L20 20 L4 4 Z"/><path d="M4 14 a6 6 0 0 1 6 6"/></svg>`;
    case 'earth': return `<svg ${st}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>`;
    case 'ar': return `<span style="font-size:${Math.round(size * .9)}px;line-height:1">ض</span>`;
    case 'en': return `<span style="font-size:${Math.round(size * .72)}px;line-height:1;font-family:Georgia,serif">Aa</span>`;
    default: return `<svg ${st}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/></svg>`;
  }
}
T.subjIcon = subjIcon;
const playSvg = s => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M18 12 7 19V5z" fill="#F48C06"/></svg>`;

/* ---------- lesson body renderer (shared with the editor preview) ---------- */
function kwHtml(word, target, ctx) {
  const p = parseTarget(target), term = termKey(word);
  let cls = 'kw', style = '', href = '#';
  if (p.kind === 'lesson') {
    href = '#lesson/' + p.id;
    const pl = IX.place[p.id];
    if (!IX.les[p.id] || !pl) cls += ' broken';
    else if (pl.s.id !== ctx.subjectId) { cls += ' x'; style = `--c:${pl.s.color}`; }
  } else if (p.kind === 'lab') { cls += ' vid'; if (!IX.labs[p.id]) cls += ' broken'; }
  else if (p.kind === 'video') cls += ' vid';
  else { cls += ' ext'; href = p.url; }
  return `<a class="${cls}" href="${esc(href)}" data-target="${esc(target)}" data-term="${esc(term)}"${style ? ` style="${style}"` : ''}>${esc(word)}</a>`;
}
function inline(text, ctx) {
  const links = [];
  let s = text.replace(LINK_RE, (_, w, t) => { links.push(kwHtml(w.trim(), t, ctx)); return `\u0000${links.length - 1}\u0000`; });
  s = esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => links[+i]);
}
function labHtml(id, ctx) {
  const lab = IX.labs[id];
  if (!lab) return `<div class="pending"><b>تجربة غير موجودة</b>المعرّف «${esc(id)}» غير مسجل في قائمة التجارب.</div>`;
  const local = lab.packaged && FILES[lab.src] && !ctx.published;
  return `<section class="lab" id="lab-${esc(id)}">
    <div class="lab-h"><span class="badge">تجربة</span><span>${esc(lab.title || 'تجربة تفاعلية')}</span><button type="button" data-fs>⛶ ملء الشاشة</button></div>
    <div class="lab-b" style="aspect-ratio:${esc(lab.ratio || '16/9')}">
      <button type="button" class="lab-ph" data-src="${esc(fileUrl(lab.src))}"${local ? ' data-local="1"' : ''}>
        <span class="play">${playSvg(28)}</span><span>${local ? 'تعمل هذه التجربة بعد النشر (ملفاتها مضغوطة)' : 'اضغط لتشغيل التجربة'}</span>
      </button>
    </div></section>`;
}
/* media line: ![caption](path-or-url){size align}  e.g. {50% يمين} */
const MEDIA_RE = /^!\[([^\]]*)\]\(([^)\s]+)\)\s*(?:\{([^}]*)\})?$/;
const SIZE_WORDS = { 'صغير': 33, 'متوسط': 50, 'كبير': 75, 'كامل': 100, small: 33, medium: 50, large: 75, full: 100 };
const ALIGN_WORDS = { 'يمين': 'r', 'يسار': 'l', 'وسط': 'c', right: 'r', left: 'l', center: 'c' };
function parseMedia(line) {
  const m = String(line).trim().match(MEDIA_RE);
  if (!m) return null;
  let size = 100, align = 'c';
  (m[3] || '').split(/\s+/).filter(Boolean).forEach(w => {
    const p = w.match(/^(\d{1,3})%?$/);
    if (p) size = Math.max(15, Math.min(100, +p[1]));
    else if (SIZE_WORDS[w.toLowerCase()]) size = SIZE_WORDS[w.toLowerCase()];
    else if (ALIGN_WORDS[w.toLowerCase()]) align = ALIGN_WORDS[w.toLowerCase()];
  });
  const src = m[2].trim();
  const kind = /\.(mp4|webm|ogg|ogv|mov|m4v)(\?|#|$)/i.test(src) ? 'video' : ytId(src) || /vimeo\.com\//.test(src) ? 'embed' : 'image';
  return { cap: m[1].trim(), src, size, align, kind };
}
function mediaLine(o) {
  const opts = [];
  if (o.size && o.size !== 100) opts.push(o.size + '%');
  if (o.align === 'r') opts.push('يمين'); else if (o.align === 'l') opts.push('يسار');
  return `![${(o.cap || '').replace(/[\[\]]/g, '')}](${o.src})${opts.length ? `{${opts.join(' ')}}` : ''}`;
}
T.parseMedia = parseMedia; T.mediaLine = mediaLine;
function mediaHtml(o) {
  const url = fileUrl(o.src);
  let inner;
  if (o.kind === 'video') inner = `<video src="${esc(url)}" controls preload="metadata" playsinline></video>`;
  else if (o.kind === 'embed') {
    const p = parseTarget(o.src);
    inner = `<div class="embed"><iframe src="${esc((p.embed || '').replace('autoplay=1', 'autoplay=0'))}" title="${esc(o.cap || 'فيديو')}" allow="fullscreen; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`;
  } else inner = `<img src="${esc(url)}" alt="${esc(o.cap)}" loading="lazy">`;
  const cls = 'media' + (o.align === 'r' ? ' fl-r' : o.align === 'l' ? ' fl-l' : '') + (o.size < 100 ? ' sized' : '');
  return `<figure class="${cls}" style="--w:${o.size}%" data-src="${esc(o.src)}">${inner}${o.cap ? `<figcaption>${esc(o.cap)}</figcaption>` : ''}</figure>`;
}
function renderBody(src, ctx = {}) {
  const lines = String(src || '').replace(/\r/g, '').split('\n');
  let html = '', para = [], list = null, n = 0;
  const heads = [];
  const flushP = () => { if (para.length) { html += `<p>${inline(para.join(' '), ctx)}</p>`; para = []; } };
  const flushL = () => { if (list) { html += '<ul>' + list.map(x => `<li>${inline(x, ctx)}</li>`).join('') + '</ul>'; list = null; } };
  for (const raw of lines) {
    const line = raw.trim(); let m;
    if (!line) { flushP(); flushL(); continue; }
    if ((m = line.match(/^(#{2,3})\s+(.+)$/))) {
      flushP(); flushL();
      const lvl = m[1].length, id = 'sec-' + (++n);
      if (lvl === 2) heads.push({ id, text: m[2].replace(LINK_RE, '$1').replace(/\*\*/g, '') });
      html += `<h${lvl} id="${id}">${inline(m[2], ctx)}</h${lvl}>`; continue;
    }
    if ((m = line.match(/^[-•]\s+(.+)$/))) { flushP(); (list = list || []).push(m[1]); continue; }
    if ((m = parseMedia(line))) { flushP(); flushL(); html += mediaHtml(m); continue; }
    if ((m = line.match(/^::lab\[([^\]]+)\]$/))) {
      flushP(); flushL();
      const id = m[1].trim(), lab = IX.labs[id];
      heads.push({ id: 'lab-' + id, text: '🧪 ' + (lab ? (lab.title || 'التجربة') : 'التجربة') });
      html += labHtml(id, ctx); continue;
    }
    flushL(); para.push(line);
  }
  flushP(); flushL();
  return { html, heads };
}
T.renderBody = renderBody;

/* labs: load when visible or clicked; fullscreen */
let labObs = null;
function wireLabs(root) {
  if (labObs) labObs.disconnect();
  const load = btn => {
    if (btn.dataset.local) return;
    const f = document.createElement('iframe');
    f.src = btn.dataset.src; f.loading = 'lazy'; f.title = 'تجربة تفاعلية';
    f.allow = 'fullscreen; autoplay'; f.setAttribute('allowfullscreen', '');
    btn.replaceWith(f);
  };
  labObs = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { labObs.unobserve(e.target); load(e.target); } }), { rootMargin: '150px' }) : null;
  $$('.lab-ph', root).forEach(b => { b.onclick = () => load(b); if (labObs) labObs.observe(b); });
  $$('.lab [data-fs]', root).forEach(b => b.onclick = () => {
    const box = b.closest('.lab'); const ph = $('.lab-ph', box); if (ph) load(ph);
    if (document.fullscreenElement) document.exitFullscreen(); else if (box.requestFullscreen) box.requestFullscreen();
  });
}
T.wireLabs = wireLabs;

/* ---------- popover / modal for linked words ---------- */
let popEl = null;
function closePop() { if (popEl) { popEl.remove(); popEl = null; } }
function openModal(title, inner) {
  closePop();
  const m = document.createElement('div');
  m.className = 'modal';
  m.innerHTML = `<div class="box" role="dialog" aria-label="${esc(title)}"><div class="box-h">${esc(title)}<button type="button" aria-label="إغلاق">×</button></div>${inner}</div>`;
  const close = () => { m.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  m.addEventListener('click', e => { if (e.target === m || e.target.closest('.box-h button')) close(); });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(m);
  return m;
}
T.openModal = openModal;
function showPop(anchor, html, color) {
  closePop();
  popEl = document.createElement('div');
  popEl.className = 'pop';
  if (color) popEl.style.setProperty('--c', color);
  popEl.innerHTML = html;
  document.body.appendChild(popEl);
  const r = anchor.getBoundingClientRect(), w = popEl.offsetWidth;
  let left = r.right - w + 30;
  left = Math.max(12, Math.min(left, document.documentElement.clientWidth - w - 12));
  popEl.style.left = (left + scrollX) + 'px';
  popEl.style.top = (r.bottom + scrollY + 12) + 'px';
  $$('[data-close]', popEl).forEach(b => b.onclick = closePop);
}
function onKwClick(a, ctx) {
  const p = parseTarget(a.dataset.target);
  if (p.kind === 'lesson') {
    const L = IX.les[p.id], pl = IX.place[p.id];
    if (!L || !pl) { showPop(a, `<div class="ph">رابط غير صالح</div><p>الموضوع «${esc(p.id)}» غير موجود.</p><div class="row"><button class="b2" data-close>إغلاق</button></div>`, 'var(--red)'); return; }
    const same = pl.s.id === ctx.subjectId;
    showPop(a, `<div class="ph"><span class="dot" style="--c:${pl.s.color}"></span>${same ? 'موضوع في المادة نفسها' : 'موضوع من مادة ' + esc(pl.s.name)}</div>
      <h5>${esc(L.title)}</h5><p>${esc(L.summary || (hasBody(L) ? '' : 'هذا الموضوع قيد الإعداد.'))}</p>
      <div class="row"><a class="b1" href="#lesson/${esc(L.id)}">افتح الموضوع ←</a><button class="b2" data-close>إغلاق</button></div>`, pl.s.color);
  } else if (p.kind === 'url') {
    let host = p.url; try { host = new URL(p.url).hostname.replace(/^www\./, ''); } catch (e) {}
    showPop(a, `<div class="ph">مقالة / رابط خارجي</div><h5>${esc(a.textContent)}</h5><p dir="ltr" style="text-align:right">${esc(host)}</p>
      <div class="row"><a class="b1" href="${esc(p.url)}" target="_blank" rel="noopener">افتح الرابط ↗</a><button class="b2" data-close>إغلاق</button></div>`, 'var(--orange)');
  } else if (p.kind === 'video') {
    const src = p.file ? fileUrl(p.url) : p.embed;
    openModal(a.textContent, `<div class="vid">${p.file ? `<video src="${esc(src)}" controls autoplay style="width:100%;height:100%"></video>` : `<iframe src="${esc(src)}" allow="autoplay; fullscreen; encrypted-media" allowfullscreen></iframe>`}</div>`);
  } else if (p.kind === 'lab') {
    const lab = IX.labs[p.id];
    if (!lab) return;
    openModal(lab.title || 'تجربة', `<div class="vid" style="aspect-ratio:${esc(lab.ratio || '16/9')};background:#fff"><iframe src="${esc(fileUrl(lab.src))}" allow="fullscreen" allowfullscreen></iframe></div>`);
  }
}
T.wireKw = function (root, ctx) {
  root.addEventListener('click', e => {
    const a = e.target.closest('.kw');
    if (!a || !root.contains(a)) return;
    e.preventDefault(); e.stopPropagation();
    onKwClick(a, ctx);
  });
};
document.addEventListener('click', e => { if (popEl && !popEl.contains(e.target) && !e.target.closest('.kw')) closePop(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePop(); });
addEventListener('resize', closePop);

/* ---------- search ---------- */
const STOP = new Set('ما ماذا كيف لماذا لما هل في من على عن الي الى اين متى هو هي ان او مع لا ذلك هذا هذه كل بين عند اي ايش شو كم قد ثم تم يتم التي الذي الذين عندما حين اذا لو بعض يعني اريد اعرف اشرح عرف نبذه وما فيه فيها به بها له لها انا نحن انت معنى معني هي هو الفرق the a an of is what how why in on to and or do does'.split(' '));
function norm(s) {
  return String(s || '').toLowerCase()
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}
function stem(w) {
  for (const p of ['وال', 'بال', 'كال', 'فال', 'لل', 'ال']) if (w.startsWith(p) && w.length - p.length >= 3) { w = w.slice(p.length); break; }
  for (const s of ['ات', 'ين', 'ون']) if (w.endsWith(s) && w.length - s.length >= 3) { w = w.slice(0, -s.length); break; }
  return w;
}
const toks = s => [...new Set(norm(s).split(' ').filter(w => w && !STOP.has(w)).map(stem).filter(w => w.length >= 2))];
const stemStr = s => ' ' + norm(s).split(' ').map(stem).join(' ') + ' ';
T.norm = norm;
let DOCS = [];
function buildSearch() {
  DOCS = DATA.lessons.filter(l => IX.place[l.id]).map(l => {
    const pl = IX.place[l.id];
    return {
      l, pl,
      title: stemStr(l.title), kw: stemStr((l.keywords || []).join(' ')), faq: stemStr((l.faq || []).join(' ')),
      sum: stemStr(l.summary), body: stemStr((l.body || '').replace(LINK_RE, '$1')), where: stemStr([pl.s.name, pl.t.name, pl.b.name].join(' ')),
      faqT: (l.faq || []).map(toks),
    };
  });
}
function search(q) {
  const qt = toks(q), nq = ' ' + norm(q) + ' ';
  if (!qt.length && nq.trim().length < 2) return [];
  const res = [];
  for (const d of DOCS) {
    let s = 0;
    for (const t of qt) {
      const has = f => f.includes(t.length >= 3 ? t : ' ' + t + ' ');
      if (has(d.title)) s += 6;
      if (has(d.kw)) s += 5;
      if (has(d.faq)) s += 3;
      if (has(d.sum)) s += 2;
      if (has(d.body)) s += 1;
      if (has(d.where)) s += 1.5;
    }
    const nt = norm(d.l.title);
    if (nq.trim().length >= 3 && (' ' + nt + ' ').includes(nq)) s += 8;
    for (const ft of d.faqT) {
      if (!ft.length || !qt.length) continue;
      const inter = ft.filter(x => qt.includes(x)).length;
      const j = inter / new Set([...ft, ...qt]).size;
      if (j >= .5) s += 10 * j;
    }
    if (s > 0) res.push({ d, s: s + (hasBody(d.l) ? .5 : 0) });
  }
  return res.sort((a, b) => b.s - a.s);
}
T.search = search;
function searchTerms(q) {
  const nq = norm(q); if (nq.length < 2) return [];
  return Object.values(IX.terms).filter(t => norm(t.term).includes(nq) || (nq.length >= 3 && nq.includes(norm(t.term)))).slice(0, 3);
}
function hl(text, q) {
  const t = String(text), lt = t.toLowerCase();
  for (const w of norm(q).split(' ').filter(w => w.length >= 2 && !STOP.has(w)).map(stem)) {
    const i = lt.indexOf(w);
    if (i >= 0) return esc(t.slice(0, i)) + '<mark>' + esc(t.slice(i, i + w.length)) + '</mark>' + esc(t.slice(i + w.length));
  }
  return esc(t);
}
function attachSearch(wrapEl) {
  const input = $('input', wrapEl);
  let box = null, sel = -1, items = [];
  const close = () => { if (box) { box.remove(); box = null; } sel = -1; };
  const draw = () => {
    const q = input.value.trim();
    if (q.length < 2) { close(); return; }
    const r = search(q).slice(0, 6), tr = searchTerms(q);
    if (!box) { box = document.createElement('div'); box.className = 'results'; wrapEl.appendChild(box); }
    let h = '';
    if (r.length) {
      h += '<div class="grp">المواضيع</div>' + r.map(({ d }) => `<a href="#lesson/${esc(d.l.id)}"><span class="dot" style="--c:${d.pl.s.color}"></span><span>${hl(d.l.title, q)}<small>${esc(d.pl.s.name)} · ${esc(d.pl.b.name)}${hasBody(d.l) ? '' : ' · قريبًا'}</small></span></a>`).join('');
    }
    if (tr.length) h += '<div class="grp">المصطلحات</div>' + tr.map(t => `<a href="#terms/${encodeURIComponent(t.term)}"><span class="dot" style="--c:var(--brand)"></span><span>${esc(t.term)}<small>${t.subjects.length > 1 ? 'مشترك بين ' + plural(t.subjects.length, 'مادة', 'مادتين', 'مواد') : 'مصطلح'}</small></span></a>`).join('');
    if (!r.length && !tr.length) h += `<div class="grp">لا نتائج مطابقة</div>`;
    else h += `<a class="all" href="#search/${encodeURIComponent(q)}"><span class="dot" style="--c:var(--orange)"></span><span>عرض كل النتائج عن «${esc(q)}»</span></a>`;
    box.innerHTML = h;
    items = $$('a', box);
    sel = -1;
    $$('a', box).forEach(a => a.addEventListener('click', () => { close(); input.value = ''; input.blur(); }));
  };
  input.addEventListener('input', draw);
  input.addEventListener('focus', draw);
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!items.length) return; e.preventDefault();
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items.forEach((x, i) => x.classList.toggle('sel', i === sel));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (sel >= 0 && items[sel]) { items[sel].click(); return; }
      const v = input.value.trim(); if (!v) return;
      close(); input.value = ''; input.blur(); location.hash = '#search/' + encodeURIComponent(v);
    } else if (e.key === 'Escape') { close(); input.blur(); }
  });
  document.addEventListener('click', e => { if (!wrapEl.contains(e.target)) close(); });
}

/* ---------- assistant (no AI: matches questions with lesson summaries, keywords and FAQs) ---------- */
const Chat = T.Chat = (function () {
  let el = null, msgs = null;
  const history = [];
  function suggestions() {
    const qs = [];
    DATA.lessons.filter(hasBody).forEach(l => (l.faq || []).slice(0, 2).forEach(f => qs.push(f)));
    return qs.slice(0, 4);
  }
  function build() {
    el = document.createElement('div');
    el.className = 'chat';
    el.innerHTML = `<div class="chat-h"><div class="av">${subjIcon({}, 20)}</div><div><b>مساعد تكامل</b><small>يبحث لك في مواضيع الموقع ويقترح ما تقرأ</small></div><button type="button" aria-label="إغلاق">×</button></div>
      <div class="msgs"></div>
      <form class="chat-in"><input placeholder="اكتب سؤالك…" aria-label="سؤالك"><button aria-label="إرسال"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></button></form>`;
    msgs = $('.msgs', el);
    $('.chat-h button', el).onclick = close;
    $('form', el).onsubmit = e => { e.preventDefault(); const i = $('input', el); const v = i.value.trim(); if (v) { i.value = ''; ask(v); } };
    msgs.addEventListener('click', e => {
      const b = e.target.closest('[data-q]'); if (b) { ask(b.dataset.q); return; }
      if (e.target.closest('a[href^="#"]') && innerWidth < 860) close();
    });
    document.body.appendChild(el);
    if (!history.length) greet(); else history.forEach(h => msgs.insertAdjacentHTML('beforeend', h));
  }
  function push(html) { history.push(html); msgs.insertAdjacentHTML('beforeend', html); msgs.scrollTop = msgs.scrollHeight; }
  function greet() {
    const s = suggestions();
    push(`<div class="msg b">أهلًا! اسألني عن أي موضوع، وسأعطيك نبذة عنه وأقترح عليك موضوعًا من مواضيع الموقع لتعرف أكثر.</div>`);
    if (s.length) push(`<div class="sugg">${s.map(q => `<button type="button" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>`);
  }
  function open() { if (!el) build(); el.classList.remove('hide'); setTimeout(() => $('input', el).focus(), 50); }
  function close() { if (el) el.classList.add('hide'); }
  function toggle() { if (el && !el.classList.contains('hide')) close(); else open(); }
  function lessonLink(l, extra = '') {
    const pl = IX.place[l.id];
    return `<a href="#lesson/${esc(l.id)}"><span class="dot" style="--c:${pl.s.color}"></span>${esc(l.title)} <small style="color:${pl.s.color}">· ${esc(pl.s.name)}${extra}</small></a>`;
  }
  function answer(q) {
    const r = search(q);
    const best = r[0];
    const termHit = Object.values(IX.terms).find(t => norm(t.term) === norm(q).replace(/^(ما هو|ما هي|ما|عرف|اشرح)\s+/, ''));
    let termLine = '';
    if (termHit && termHit.subjects.length > 1) termLine = `<div class="rel">مصطلح «${esc(termHit.term)}» يرد في ${plural(termHit.subjects.length, 'مادة', 'مادتين', 'مواد')}. <a href="#terms/${encodeURIComponent(termHit.term)}" style="display:inline;color:var(--brand)">افتحه في فهرس المصطلحات</a></div>`;
    if (!best || best.s < 6) {
      const near = (r.length ? r.map(x => x.d.l) : DATA.lessons.filter(hasBody)).filter(l => IX.place[l.id]).slice(0, 3);
      return `<div class="msg b">لم أجد موضوعًا عن هذا بعد.${near.length ? `<div class="rel">أقرب المواضيع الموجودة:${near.map(l => lessonLink(l, hasBody(l) ? '' : ' · قريبًا')).join('')}</div>` : ''}${termLine}</div>`;
    }
    const L = best.d.l, pl = best.d.pl;
    if (!hasBody(L) && !L.summary) {
      return `<div class="msg b" style="--c:${pl.s.color}"><span class="st">${esc(pl.s.name)} · ${esc(pl.b.name)}</span><h6>${esc(L.title)}</h6>هذا الموضوع موجود في فهرس الموقع، لكن شرحه قيد الإعداد.<br><a class="go" href="#lesson/${esc(L.id)}">اعرض مكانه في المادة ←</a>${termLine}</div>`;
    }
    const cross = [...new Set([...(IX.out[L.id] || []).filter(k => k.kind === 'lesson').map(k => k.id), ...(IX.inb[L.id] || [])])]
      .map(id => IX.les[id]).filter(x => x && IX.place[x.id] && IX.place[x.id].s.id !== pl.s.id).slice(0, 3);
    const others = r.slice(1, 3).filter(x => x.s >= best.s * .5 && hasBody(x.d.l)).map(x => x.d.l).filter(x => !cross.includes(x));
    return `<div class="msg b" style="--c:${pl.s.color}"><span class="st">${esc(pl.s.name)} · ${esc(pl.b.name)}</span><h6>${esc(L.title)}</h6>${esc(L.summary || '')}
      <br><a class="go" href="#lesson/${esc(L.id)}">اقرأ الموضوع كاملًا ←</a>
      ${cross.length ? `<div class="rel">مرتبط به من مواد أخرى:${cross.map(x => lessonLink(x)).join('')}</div>` : ''}
      ${others.length ? `<div class="rel">قد يهمك أيضًا:${others.map(x => lessonLink(x)).join('')}</div>` : ''}${termLine}</div>`;
  }
  function ask(q) {
    open();
    push(`<div class="msg u">${esc(q)}</div>`);
    const t = document.createElement('div'); t.className = 'msg b typing'; t.innerHTML = '<i></i><i></i><i></i>';
    msgs.appendChild(t); msgs.scrollTop = msgs.scrollHeight;
    setTimeout(() => { t.remove(); push(answer(q)); }, 650);
  }
  return { open, close, toggle, ask, reset() { history.length = 0; if (el) { el.remove(); el = null; } } };
})();

/* ---------- pages ---------- */
const nav = $('#nav');
function setNav(name) { $$('a', nav).forEach(a => a.classList.toggle('on', a.dataset.r === (name || 'home') || (name === 'lesson' && a.dataset.r === 'subject'))); nav.classList.remove('open'); }
function sCount(s) { let n = 0, ready = 0; s.topics.forEach(t => t.branches.forEach(b => b.lessons.forEach(id => { n++; if (hasBody(IX.les[id])) ready++; }))); return { n, ready }; }
function thumb(l, s, big) {
  const c = s ? s.color : 'var(--brand)';
  return `<div class="thumb" style="--c:${c}">${l.cover ? `<img src="${esc(fileUrl(l.cover))}" alt="" loading="lazy">` : `<span class="ph">${subjIcon(s, big ? 90 : 46)}</span>`}`;
}
function topShared() {
  return Object.values(IX.terms).sort((a, b) => b.subjects.length - a.subjects.length || b.lessons.length - a.lessons.length)[0];
}

function pageHome() {
  const ready = DATA.lessons.filter(l => hasBody(l) && IX.place[l.id]);
  const total = DATA.lessons.filter(l => IX.place[l.id]).length;
  const nTerms = Object.keys(IX.terms).length;
  const shared = topShared();
  const subs = DATA.subjects;
  // hero network art
  const R = 38, nodes = subs.map((s, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / subs.length; return { s, x: 50 + R * Math.cos(a), y: 50 + R * Math.sin(a) }; });
  const pairs = [];
  Object.values(IX.terms).forEach(t => { for (let i = 0; i < t.subjects.length; i++) for (let j = i + 1; j < t.subjects.length; j++) pairs.push([t.subjects[i], t.subjects[j]]); });
  [['bio', 'chem'], ['chem', 'phys'], ['math', 'phys'], ['earth', 'phys'], ['ar', 'en'], ['bio', 'earth']].forEach(p => pairs.push(p));
  const pos = Object.fromEntries(nodes.map(n => [n.s.id, n]));
  const lines = [...new Set(pairs.map(p => p.slice().sort().join('|')))].map(k => k.split('|')).filter(([a, b]) => pos[a] && pos[b])
    .map(([a, b]) => `<line x1="${pos[a].x}" y1="${pos[a].y}" x2="${pos[b].x}" y2="${pos[b].y}" stroke="#2F327D" stroke-opacity=".14" stroke-width=".5" stroke-dasharray="1.5 1.5"/>`).join('');
  const art = `<div class="hero-art">
    <div class="bubble" style="width:70px;height:70px;background:#FFE1BC;top:2%;left:4%"></div>
    <div class="bubble" style="width:22px;height:22px;background:var(--cyan);top:12%;right:8%"></div>
    <div class="bubble" style="width:14px;height:14px;background:var(--orange);bottom:16%;left:12%"></div>
    <svg viewBox="0 0 100 100" style="position:absolute;inset:0;width:100%;height:100%">
      <circle cx="50" cy="50" r="${R}" fill="none" stroke="#2F327D" stroke-opacity=".1" stroke-width=".6"/>
      <circle cx="50" cy="50" r="24" fill="#fff" opacity=".6"/>
      ${lines}${nodes.map(n => `<line x1="50" y1="50" x2="${n.x}" y2="${n.y}" stroke="${n.s.color}" stroke-opacity=".35" stroke-width=".6"/>`).join('')}
    </svg>
    ${nodes.map(n => `<a href="#subject/${esc(n.s.id)}" title="${esc(n.s.name)}" style="position:absolute;left:${n.x}%;top:${n.y}%;transform:translate(-50%,-50%);width:15%;aspect-ratio:1;border-radius:50%;background:#fff;box-shadow:0 10px 24px rgba(47,50,125,.14);display:grid;place-items:center;color:${n.s.color};border:3px solid ${n.s.color}">${subjIcon(n.s, 26)}</a>`).join('')}
    <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:24%;aspect-ratio:1;border-radius:50%;background:#fff;display:grid;place-items:center;box-shadow:0 14px 34px rgba(108,63,209,.22)"><svg width="58%" viewBox="0 0 46 34"><defs><clipPath id="hk"><circle cx="15" cy="17" r="13"/></clipPath></defs><circle cx="15" cy="17" r="13" fill="#2D7FF9"/><circle cx="31" cy="17" r="13" fill="#F0435A"/><circle cx="31" cy="17" r="13" fill="#6C3FD1" clip-path="url(#hk)"/></svg></div>
    <div class="float keep" style="top:4%;right:-2%"><span class="fi" style="background:var(--blue)">${subjIcon({}, 20)}</span><span><b>${cnt(total, 'lesson')}</b>في ${cnt(subs.length, 'subj')}</span></div>
    ${shared ? `<a class="float" href="#terms/${encodeURIComponent(shared.term)}" style="bottom:-5%;right:14%;animation-delay:-2s"><span class="fi" style="background:var(--brand)">⇄</span><span><b>${esc(shared.term)}</b>${shared.subjects.map(id => IX.subj[id].name).join(' ↔ ')}</span></a>` : ''}
    <a class="float" href="#labs" style="bottom:4%;left:-8%;animation-delay:-4s"><span class="fi" style="background:var(--orange)">▶</span><span><b>${DATA.labs.length === 1 ? 'تجربة' : DATA.labs.length + ' تجارب'}</b>تفاعلية</span></a>
  </div>`;

  const sugg = [];
  ready.forEach(l => (l.faq || []).slice(0, 1).forEach(f => sugg.push(f)));
  ['البناء الضوئي', 'الطاقة'].forEach(x => sugg.push(x));

  // latest
  const featured = IX.les[DATA.site.featured] && IX.place[DATA.site.featured] ? IX.les[DATA.site.featured] : ready[0];
  const rest = ready.filter(l => l !== featured).sort((a, b) => String(b.updated || '').localeCompare(String(a.updated || '')));
  const labItems = DATA.labs.filter(x => IX.labIn[x.id]).map(x => ({ lab: x, l: IX.les[IX.labIn[x.id][0]] }));
  const list = [...rest.slice(0, 2).map(l => ({ l })), ...labItems.slice(0, 1), ...rest.slice(2).map(l => ({ l }))].slice(0, 3);
  const fs = featured && IX.place[featured.id].s;
  const latest = featured ? `<section class="sec"><div class="wrap">
    <div class="sec-h"><h2>أحدث <em>المواضيع والتجارب</em></h2><p>ما أُضيف مؤخرًا إلى المنصة</p></div>
    <div class="latest">
      <article class="feat"><a href="#lesson/${esc(featured.id)}">${thumb(featured, fs, true)}<span class="pill on-img">موضوع مميز</span></div></a>
        <span class="pill">موضوع</span> <span class="subj-tag" style="--c:${fs.color}">● ${esc(fs.name)}</span>
        <h3><a href="#lesson/${esc(featured.id)}">${esc(featured.title)}</a></h3><p>${esc(featured.summary || featured.subtitle || '')}</p>
        <a class="more" href="#lesson/${esc(featured.id)}">افتح الموضوع</a></article>
      <div class="items">${list.map(it => {
        const l = it.l, s = IX.place[l.id].s;
        if (it.lab) return `<a class="item" href="#lesson/${esc(l.id)}"><div class="thumb" style="--c:var(--navy);background:linear-gradient(160deg,#1f2160,#3b3f9a)"><span style="width:52px;height:52px;border-radius:50%;background:#fff;display:grid;place-items:center">${playSvg(22)}</span><span class="pill on-img">تجربة</span></div>
          <div><span class="subj-tag" style="--c:${s.color}">● ${esc(s.name)}</span><h4>${esc(it.lab.title)}</h4><p>تجربة تفاعلية داخل موضوع «${esc(l.title)}».</p></div></a>`;
        return `<a class="item" href="#lesson/${esc(l.id)}">${thumb(l, s)}<span class="pill on-img">موضوع</span></div>
          <div><span class="subj-tag" style="--c:${s.color}">● ${esc(s.name)}</span><h4>${esc(l.title)}</h4><p>${esc(l.summary || l.subtitle || '')}</p></div></a>`;
      }).join('')}</div>
    </div></div></section>` : '';

  // integration demo
  let integ = '';
  if (shared && shared.lessons.length > 1) {
    const ls = shared.lessons.slice(0, 6).map(id => IX.les[id]);
    const pts = ls.map((l, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / ls.length; return { l, s: IX.place[l.id].s, x: 50 + 36 * Math.cos(a), y: 50 + 34 * Math.sin(a) }; });
    integ = `<section class="sec" style="padding-top:20px"><div class="wrap"><div class="integ">
      <div><span class="pill" style="background:#EEE7FF;color:var(--brand)">كيف تترابط المواد؟</span>
        <h3 style="margin-top:14px">مصطلح واحد، <em>${plural(shared.subjects.length, 'مادة', 'مادتان', 'مواد')}</em></h3>
        <p>مصطلح «<b>${esc(shared.term)}</b>» يظهر في مواضيع ${shared.subjects.map(id => `<b style="color:${IX.subj[id].color}">${esc(IX.subj[id].name)}</b>`).join(' و')}. في «تكامل» كل كلمة مرتبطة تفتح شرحها في المادة الأخرى، فيرى الطالب الموضوع من أكثر من زاوية.</p>
        <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap"><a class="btn btn-o" href="#terms/${encodeURIComponent(shared.term)}">افتح فهرس المصطلحات</a><a class="btn btn-g" href="#lesson/${esc(ls[0].id)}">ابدأ من «${esc(ls[0].title)}»</a></div></div>
      <div class="web"><svg viewBox="0 0 100 100" preserveAspectRatio="none">${pts.map(p => `<line x1="50" y1="50" x2="${p.x}" y2="${p.y}" stroke="${p.s.color}" stroke-width=".5" stroke-dasharray="2 1.5" vector-effect="non-scaling-stroke" style="stroke-width:2"/>`).join('')}</svg>
        <span class="node center" style="left:50%;top:50%">${esc(shared.term)}</span>
        ${pts.map(p => `<a class="node" href="#lesson/${esc(p.l.id)}" style="left:${p.x}%;top:${p.y}%;--c:${p.s.color}"><small>${esc(p.s.name)}</small>${esc(p.l.title)}</a>`).join('')}
      </div></div></div></section>`;
  }

  view.innerHTML = `
  <section class="hero"><div class="wrap">
    <div>
      <h1>كل المواد،<br><em>معرفة واحدة</em> مترابطة</h1>
      <p class="lead">«تكامل» يجمع المواد الدراسية في مكان واحد، ويربط كل مفهوم بما يتصل به في المواد الأخرى: من الخلية في الأحياء إلى الطاقة في الفيزياء والروابط في الكيمياء.</p>
      <div class="hero-search search" id="heroSearch"><input type="search" placeholder="ابحث عن موضوع أو مصطلح…" aria-label="بحث"><button class="btn btn-o" type="button" data-search-hero>بحث</button></div>
      <div class="chips"><span class="chips-l">💬 اسأل المساعد:</span>${sugg.slice(0, 4).map(q => `<button type="button" class="chip" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>
    </div>
    ${art}
  </div></section>
  <section class="sec" style="padding-top:20px"><div class="wrap">
    <div class="sec-h"><h2>اختر <em>المادة</em></h2><p>كل مادة مقسمة إلى وحدات وفروع ومواضيع</p></div>
    <div class="subjects">${subs.map(s => { const c = sCount(s); return `<a class="scard" href="#subject/${esc(s.id)}" style="--c:${s.color}">
      <span class="sicon">${subjIcon(s, 28)}</span><h3>${esc(s.name)}</h3>
      <div class="tops">${s.topics.map(t => esc(t.name)).join(' · ')}</div>
      <div class="meta"><span>${cnt(s.topics.length, 'topic', 1)}</span><span>${cnt(c.n, 'lesson', 1)}</span>${c.ready ? `<span><b>${c.ready}</b> جاهز</span>` : ''}</div></a>`; }).join('')}</div>
  </div></section>
  ${latest}${integ}`;
  attachSearch($('#heroSearch'));
  $('[data-search-hero]').onclick = () => { const i = $('#heroSearch input'); const v = i.value.trim(); if (v) location.hash = '#search/' + encodeURIComponent(v); else i.focus(); };
  $$('.chips [data-q]').forEach(b => b.onclick = () => Chat.ask(b.dataset.q));
  document.title = `${DATA.site.name || 'تكامل'} — ${DATA.site.tagline || ''}`;
}

function subjTabs(cur) {
  return `<div class="tabs">${DATA.subjects.map(s => `<a href="#subject/${esc(s.id)}" class="${s.id === cur ? 'on' : ''}" style="--c:${s.color}"><span class="dot"></span>${esc(s.name)}</a>`).join('')}</div>`;
}
function pageSubject(id) {
  const s = IX.subj[id] || DATA.subjects[0];
  const ed = !!(window.TInline && window.TInline.canEdit());
  const add = (kind, pid, label) => ed ? `<button type="button" class="add-btn" data-add="${kind}" data-pid="${esc(pid)}">＋ ${label}</button>` : '';
  if (!s) { view.innerHTML = '<div class="wrap sec">لا توجد مواد بعد.</div>'; return; }
  const c = sCount(s);
  view.innerHTML = `<section class="strip"><div class="wrap">
      ${subjTabs(s.id)}
      <div class="subj-head" style="--c:${s.color}"><span class="sicon">${subjIcon(s, 32)}</span><div><h1>${esc(s.name)}</h1><p>${cnt(s.topics.length, 'topic')} · ${cnt(c.n, 'lesson')}${c.ready ? ` · ${c.ready} جاهز للقراءة` : ''}</p></div></div>
    </div></section>
    <div class="wrap" style="padding-bottom:60px"><div class="topics">${s.topics.map(t => `
      <section class="topic" style="--c:${s.color}" id="t-${esc(t.id)}"><h2>${esc(t.name)}<span>${cnt(t.branches.length, 'branch')}</span></h2>
      ${t.branches.map(b => `<div class="branch"><h3>${esc(b.name)}</h3>${b.lessons.map(lid => {
        const l = IX.les[lid]; if (!l) return '';
        const ready = hasBody(l), lab = /^::lab\[/m.test(l.body || '');
        return `<a class="lrow${ready ? '' : ' empty'}" href="#lesson/${esc(l.id)}" ${s.dir === 'ltr' ? 'dir="ltr"' : ''}><span class="dot" style="--c:${ready ? s.color : '#d5d5e2'}"></span><span class="t">${esc(l.title)}</span>${lab ? '<span class="lab-i">تجربة</span>' : ''}${ready ? (l.minutes ? `<span class="mins">${l.minutes} د</span>` : '') : '<span class="soon">قريبًا</span>'}</a>`;
      }).join('')}${add('lesson', b.id, 'موضوع جديد')}</div>`).join('')}${add('branch', t.id, 'فرع جديد')}</section>`).join('')}
      ${ed ? `<button type="button" class="topic add-topic" data-add="topic" data-pid="${esc(s.id)}">＋ وحدة جديدة في ${esc(s.name)}</button>` : ''}</div></div>`;
  document.title = `${s.name} — تكامل`;
  $$('[data-add]', view).forEach(b => b.onclick = () => window.TInline.addTo(b.dataset.add, b.dataset.pid));
}

function treeHtml(s, cur) {
  const pl = IX.place[cur];
  return `<div class="tree-subj" style="--c:${s.color}"><span class="sicon">${subjIcon(s, 18)}</span><a href="#subject/${esc(s.id)}">${esc(s.name)}</a></div>
  <div class="tree">${s.topics.map(t => `<details class="t1"${pl && pl.t === t ? ' open' : ''}><summary>${esc(t.name)}</summary>
    ${t.branches.map(b => `<details class="t2"${pl && pl.b === b ? ' open' : ''}><summary>${esc(b.name)}</summary><div class="ls">
      ${b.lessons.map(id => { const l = IX.les[id]; return l ? `<a href="#lesson/${esc(id)}" class="${id === cur ? 'cur' : ''}${hasBody(l) ? '' : ' empty'}">${esc(l.title)}</a>` : ''; }).join('')}
    </div></details>`).join('')}</details>`).join('')}</div>`;
}
function relatedOf(L, s) {
  const outIds = (IX.out[L.id] || []).filter(k => k.kind === 'lesson' && IX.les[k.id] && IX.place[k.id]);
  const seen = new Set(), rel = [];
  outIds.forEach(k => { const pl = IX.place[k.id]; if (pl.s.id !== s.id && !seen.has(k.id)) { seen.add(k.id); rel.push({ l: IX.les[k.id], via: k.word }); } });
  [...(IX.inb[L.id] || [])].forEach(id => { const pl = IX.place[id]; if (pl && pl.s.id !== s.id && !seen.has(id)) { seen.add(id); rel.push({ l: IX.les[id], via: null }); } });
  return rel;
}
function lessonView(L, opts = {}) {
  // shared by the lesson page and the editor preview
  const pl = IX.place[L.id] || opts.place;
  const s = pl ? pl.s : { id: '', name: '', color: 'var(--brand)' };
  const ctx = { subjectId: s.id, published: false };
  const { html, heads } = renderBody(L.body, ctx);
  const ltr = s.dir === 'ltr';
  const ready = hasBody(L);
  return {
    s, heads, ready,
    main: `<article class="card lesson">
      ${L.cover ? `<div class="cover"><img src="${esc(fileUrl(L.cover))}" alt=""></div>` : ''}
      <div class="lbody"${ltr ? ' dir="ltr" lang="en"' : ''}>
        <div class="ltags" dir="rtl">${s.name ? `<span class="tag subj" style="--c:${s.color}">● ${esc(s.name)}</span>` : ''}${L.code ? `<span class="tag code">${esc(L.code)}</span>` : ''}${L.minutes ? `<span class="tag">⏱ ${L.minutes} دقائق قراءة</span>` : ''}${/^::lab\[/m.test(L.body || '') ? '<span class="tag">🧪 تجربة تفاعلية</span>' : ''}${L.sample ? '<span class="tag sample">موضوع نموذجي</span>' : ''}</div>
        <h1>${esc(L.title)}</h1>${L.subtitle ? `<div class="sub">${esc(L.subtitle)}</div>` : ''}
        ${ready ? `<div class="prose">${html}</div>` : `<div class="pending" dir="rtl"><b>هذا الموضوع قيد الإعداد</b>${L.summary ? esc(L.summary) : 'سيُضاف محتواه قريبًا.'}</div>`}
        ${opts.pager || ''}
      </div></article>`,
  };
}
T.lessonView = lessonView;

let spy = null;
function pageLesson(id, term) {
  const L = IX.les[id], pl = IX.place[id];
  if (!L || !pl) { view.innerHTML = `<div class="wrap sec"><div class="pending"><b>الموضوع غير موجود</b><a class="more" href="#">العودة للرئيسية</a></div></div>`; return; }
  const s = pl.s;
  const rel = relatedOf(L, s);
  // end of lesson: the other topics of the same branch (or of the same topic), then related lessons from other subjects
  let sibs = pl.b.lessons.filter(x => x !== id), groupName = pl.b.name;
  if (!sibs.length) { sibs = pl.t.branches.flatMap(b => b.lessons).filter(x => x !== id); groupName = pl.t.name; }
  const card = (l, c, note) => `<a class="rcard${hasBody(l) ? '' : ' soon'}" href="#lesson/${esc(l.id)}" style="--c:${c.color}">${note ? `<small>${esc(note)}</small>` : ''}<b>${esc(l.title)}</b>${l.summary ? `<span>${esc(l.summary)}</span>` : ''}${hasBody(l) ? '' : '<em>قريبًا</em>'}</a>`;
  const sibCards = sibs.map(x => IX.les[x]).filter(Boolean).map(l => card(l, s, groupName === pl.b.name ? '' : IX.place[l.id].b.name));
  const footer = (sibCards.length || rel.length) ? `<div class="lfoot" dir="rtl">
      ${sibCards.length ? `<h3>مواضيع أخرى في «${esc(groupName)}»</h3><div class="rcards">${sibCards.join('')}</div>` : ''}
      ${rel.length ? `<h3>مرتبط به من مواد أخرى</h3><div class="rcards">${rel.map(r => { const rs = IX.place[r.l.id].s; return card(r.l, rs, rs.name + (r.via ? ' · عبر «' + r.via + '»' : '')); }).join('')}</div>` : ''}
    </div>` : '';
  const v = lessonView(L, { pager: footer });
  const q = (L.faq && L.faq[0]) || `ما هو ${L.title}؟`;
  view.innerHTML = `<section class="strip"><div class="wrap">
      <div class="crumbs"><a href="#subject">المواد</a><i></i><a href="#subject/${esc(s.id)}" style="color:${s.color};font-weight:600">${esc(s.name)}</a><i></i><a href="#subject/${esc(s.id)}">${esc(pl.t.name)}</a><i></i><span>${esc(pl.b.name)}</span><i></i><b>${esc(L.title)}</b></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">${window.TInline && window.TInline.canEdit() ? '<button class="btn btn-o" type="button" data-inline>✎ تعديل هذه الصفحة</button>' : ''}<button class="btn btn-g tree-toggle" type="button" data-tree>☰ فهرس المادة</button></div>
    </div></section>
    <div class="wrap"><div class="lgrid">
      <aside class="tree-col"><div class="card sticky">${treeHtml(s, id)}</div></aside>
      <div>${v.main}</div>
      <aside class="side">
        ${v.heads.length > 1 ? `<div class="card toc-card"><h4>في هذا الموضوع</h4><nav class="toc">${v.heads.map(h => `<a href="#lesson/${esc(id)}" data-sec="${esc(h.id)}">${esc(h.text)}</a>`).join('')}</nav></div>` : ''}
        <div class="card links-card"><h4>🔗 مرتبط بمواد أخرى</h4>${rel.length ? rel.map(r => { const rs = IX.place[r.l.id].s; return `<a class="lk" href="#lesson/${esc(r.l.id)}" style="--c:${rs.color}"><span class="sicon">${subjIcon(rs, 18)}</span><span><b>${esc(r.l.title)}</b><small><em>${esc(rs.name)}</em>${r.via ? ` · عبر «${esc(r.via)}»` : ' · يشير إلى هذا الموضوع'}${hasBody(r.l) ? '' : ' · قريبًا'}</small></span></a>`; }).join('') : '<p class="muted" style="font-size:13.5px">لا روابط بمواد أخرى بعد. أضفها من المحرّر بتحديد كلمة وربطها بموضوع.</p>'}</div>
        <div class="card ask-card"><h4>المساعد</h4><p>عندك سؤال عن هذا الموضوع؟</p><button type="button" data-q="${esc(q)}">${esc(q)}<span>←</span></button></div>
      </aside>
    </div></div>`;
  document.title = `${L.title} — ${s.name} — تكامل`;
  const art = $('.lesson', view);
  T.wireKw(art, { subjectId: s.id });
  wireLabs(art);
  $('.ask-card [data-q]', view).onclick = e => Chat.ask(e.currentTarget.dataset.q);
  const tc = $('.tree-col', view);
  $('[data-tree]', view).onclick = () => tc.classList.toggle('open');
  const ie = $('[data-inline]', view);
  if (ie) ie.onclick = () => window.TInline.start(id);
  tc.addEventListener('click', e => { if (e.target.closest('a')) tc.classList.remove('open'); });
  // table of contents: scroll without changing the route
  $$('.toc a', view).forEach(a => a.onclick = e => { e.preventDefault(); const t = document.getElementById(a.dataset.sec); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  if (spy) spy.disconnect();
  const tocLinks = $$('.toc a', view);
  if (tocLinks.length && 'IntersectionObserver' in window) {
    spy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) tocLinks.forEach(a => a.classList.toggle('on', a.dataset.sec === e.target.id)); }), { rootMargin: '-90px 0px -65% 0px' });
    v.heads.forEach(h => { const el = document.getElementById(h.id); if (el) spy.observe(el); });
    tocLinks[0].classList.add('on');
  }
  if (term) {
    const k = $$('.kw', art).find(a => a.dataset.term === term || a.textContent.trim() === term);
    if (k) setTimeout(() => { k.scrollIntoView({ behavior: 'smooth', block: 'center' }); k.classList.add('flash'); }, 120);
  }
}

const AR_LETTERS = 'ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي'.split(' ');
function letterOf(term) {
  let n = norm(term).replace(/^ال(?=..)/, '');
  const ch = n.charAt(0);
  if (/[a-z]/i.test(ch)) return 'A–Z';
  return AR_LETTERS.includes(ch) ? ch : '#';
}
function pageTerms(focus) {
  const all = Object.values(IX.terms).filter(t => t.lessons.length);
  const sortKey = t => norm(t.term).replace(/^ال(?=..)/, '');
  all.sort((a, b) => sortKey(a).localeCompare(sortKey(b), 'ar'));
  let onlyShared = false, filter = '';
  view.innerHTML = `<section class="strip"><div class="wrap"><div class="crumbs"><a href="#">الرئيسية</a><i></i><b>فهرس المصطلحات</b></div>
    <div class="subj-head"><span class="sicon" style="--c:var(--brand)">أ–ي</span><div><h1>فهرس المصطلحات</h1><p>${cnt(all.length, 'term')} · يُبنى تلقائيًا من الكلمات المرتبطة في المواضيع</p></div></div></div></section>
    <div class="wrap" style="padding-bottom:60px">
      <div class="terms-tools"><input type="search" placeholder="ابحث في المصطلحات…" aria-label="بحث في المصطلحات"><button type="button" class="toggle">⇄ المشتركة بين المواد فقط</button></div>
      <div class="letters"></div><div class="tlist"></div></div>`;
  const draw = () => {
    const nf = norm(filter);
    const list = all.filter(t => (!onlyShared || t.subjects.length > 1) && (!nf || norm(t.term).includes(nf)));
    const groups = {};
    list.forEach(t => { (groups[letterOf(t.term)] = groups[letterOf(t.term)] || []).push(t); });
    const order = [...AR_LETTERS, 'A–Z', '#'];
    $('.letters', view).innerHTML = order.filter(x => x !== '#' || groups['#']).map(L => `<a href="#terms" data-letter="${L}" class="${groups[L] ? '' : 'off'}">${L === 'A–Z' ? 'A' : L}</a>`).join('');
    $('.tlist', view).innerHTML = list.length ? order.filter(L => groups[L]).map(L => `<div class="letter-grp" id="L-${L}"><b>${L === 'A–Z' ? 'A–Z' : L}</b><div class="terms">${groups[L].map(t => `
      <div class="term" id="term-${encodeURIComponent(t.term)}"><h3>${esc(t.term)}${t.subjects.length > 1 ? `<span class="multi">${plural(t.subjects.length, 'مادة', 'مادتان', 'مواد')}</span>` : ''}</h3>
      <ul>${t.lessons.map(id => { const l = IX.les[id], s = IX.place[id].s; return `<li><a href="#lesson/${esc(id)}${t.src.has(id) ? '/' + encodeURIComponent(t.term) : ''}" style="--c:${s.color}"><span class="dot"></span>${esc(l.title)} <small>· ${esc(s.name)}</small></a></li>`; }).join('')}</ul></div>`).join('')}</div></div>`).join('')
      : '<div class="pending"><b>لا مصطلحات مطابقة</b></div>';
    $$('.letters a', view).forEach(a => a.onclick = e => { e.preventDefault(); const g = document.getElementById('L-' + a.dataset.letter); if (g) g.scrollIntoView({ behavior: 'smooth' }); });
  };
  $('.terms-tools input', view).oninput = e => { filter = e.target.value; draw(); };
  const tg = $('.toggle', view);
  tg.onclick = () => { onlyShared = !onlyShared; tg.classList.toggle('on', onlyShared); draw(); };
  draw();
  document.title = 'المصطلحات — تكامل';
  if (focus) {
    const el = document.getElementById('term-' + encodeURIComponent(focus));
    if (el) setTimeout(() => { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('flash'); }, 120);
  }
}

function pageSearch(q) {
  q = (q || '').trim();
  const r = q ? search(q) : [], tr = q ? searchTerms(q) : [];
  view.innerHTML = `<section class="strip"><div class="wrap"><div class="crumbs"><a href="#">الرئيسية</a><i></i><b>البحث</b></div>
    <div class="subj-head"><span class="sicon" style="--c:var(--navy)"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></span><div><h1>${q ? `نتائج «${esc(q)}»` : 'البحث'}</h1><p>${q ? (r.length ? cnt(r.length, 'lesson') : 'لا مواضيع مطابقة') : 'اكتب كلمة للبحث في المواضيع والمصطلحات'}</p></div></div>
    <form class="search-page" id="searchPage"><input type="search" value="${esc(q)}" placeholder="ابحث عن موضوع أو مصطلح…" aria-label="بحث"><button class="btn btn-o">بحث</button></form></div></section>
    <div class="wrap" style="padding-bottom:60px">
      ${tr.length ? `<div class="sres-terms">${tr.map(t => `<a class="chip" href="#terms/${encodeURIComponent(t.term)}">مصطلح: <b>${esc(t.term)}</b>${t.subjects.length > 1 ? ' · ' + plural(t.subjects.length, 'مادة', 'مادتان', 'مواد') : ''}</a>`).join('')}</div>` : ''}
      <div class="sres">${r.map(({ d }) => `<a class="sres-i" href="#lesson/${esc(d.l.id)}" style="--c:${d.pl.s.color}">
        <small>${esc(d.pl.s.name)} › ${esc(d.pl.t.name)} › ${esc(d.pl.b.name)}</small><b>${hl(d.l.title, q)}</b>${d.l.summary ? `<span>${esc(d.l.summary)}</span>` : ''}${hasBody(d.l) ? '' : '<em>قريبًا</em>'}</a>`).join('')}</div>
      ${q && !r.length && !tr.length ? '<div class="pending"><b>لم نجد شيئًا مطابقًا</b>جرّب كلمة أخرى أو تصفّح المواد.</div>' : ''}
    </div>`;
  $('#searchPage').onsubmit = e => { e.preventDefault(); const v = $('#searchPage input').value.trim(); if (v) location.hash = '#search/' + encodeURIComponent(v); };
  document.title = (q ? `بحث: ${q}` : 'البحث') + ' — تكامل';
}

function pageLabs() {
  view.innerHTML = `<section class="strip"><div class="wrap"><div class="crumbs"><a href="#">الرئيسية</a><i></i><b>التجارب</b></div>
    <div class="subj-head"><span class="sicon" style="--c:var(--orange)">${playSvg(26)}</span><div><h1>التجارب التفاعلية</h1><p>${DATA.labs.length} ${DATA.labs.length === 1 ? 'تجربة' : 'تجارب'} مضمَّنة داخل المواضيع</p></div></div></div></section>
    <div class="wrap" style="padding-bottom:60px"><div class="labs">${DATA.labs.map(x => {
      const lid = (IX.labIn[x.id] || [])[0], l = IX.les[lid], s = l && IX.place[lid] ? IX.place[lid].s : null;
      return `<a class="labcard" href="${l ? `#lesson/${esc(lid)}` : '#labs'}"><div class="lb"><span class="play">${playSvg(24)}</span></div><div class="c">${s ? `<span class="subj-tag" style="--c:${s.color}">● ${esc(s.name)}</span>` : ''}<h3>${esc(x.title)}</h3><p class="muted" style="font-size:13px">${l ? `داخل موضوع «${esc(l.title)}»` : 'غير مضمَّنة في أي موضوع بعد'}</p></div></a>`;
    }).join('') || '<div class="pending"><b>لا تجارب بعد</b>أضف تجربة من المحرّر.</div>'}</div></div>`;
  document.title = 'التجارب — تكامل';
}

/* ---------- router ---------- */
function route() {
  const raw = location.hash.replace(/^#\/?/, '');
  const parts = raw.split('/').map(x => { try { return decodeURIComponent(x); } catch (e) { return x; } });
  const name = parts[0] || 'home';
  closePop();
  if (name === 'try') { location.replace('#editor'); return; }  // the old trial link now opens the real editor
  if (name === 'editor') {
    if (window.TEditor) window.TEditor.open();
    return;
  }
  if (window.TEditor && window.TEditor.isOpen()) { window.TEditor.close(); loadData(); }
  document.body.style.overflow = '';
  switch (name) {
    case 'home': pageHome(); break;
    case 'subject': pageSubject(parts[1]); break;
    case 'lesson': pageLesson(parts[1], parts.slice(2).join('/')); break;
    case 'terms': pageTerms(parts.slice(1).join('/')); break;
    case 'labs': pageLabs(); break;
    case 'search': pageSearch(parts.slice(1).join('/')); break;
    default: pageHome();
  }
  setNav(name);
  if (!(name === 'lesson' && parts[2]) && !(name === 'terms' && parts[1])) window.scrollTo({ top: 0, behavior: 'instant' });
}
T.route = route;
T.refresh = async function () { loadData(); await T.loadFiles(); route(); };

/* ---------- boot ---------- */
loadData();
attachSearch($('#topSearch'));
$('#fab').onclick = () => Chat.toggle();
document.addEventListener('click', e => { if (e.target.closest('[data-ask]')) Chat.open(); });
$('#menuBtn').onclick = () => nav.classList.toggle('open');
addEventListener('hashchange', route);
document.addEventListener('DOMContentLoaded', () => {
  route();
  T.loadFiles().then(n => { if (n && USING_DRAFT && !(window.TEditor && window.TEditor.isOpen())) route(); });
});
})();

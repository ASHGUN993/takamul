/* تكامل — التعديل المباشر على صفحة الموضوع.
   النص والعنوان قابلان للكتابة في مكانهما، والصور والفيديو تُسحب لتغيير حجمها وتُنقل يمينًا أو يسارًا.
   يحوّل الصفحة إلى صيغة الموضوع نفسها (نفس ما يكتبه المحرّر) ويحفظها في المسودة. */
(function () {
'use strict';
const T = window.T;
if (!T) return;
const E = () => window.TEditor;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = T.esc;
const today = () => new Date().toISOString().slice(0, 10);

const CSS = `
body.inline-editing .fab,body.inline-editing .lfoot,body.inline-editing [data-inline]{display:none!important}
.ie-bar{position:sticky;top:82px;z-index:46;background:#252641;color:#fff;border-radius:18px;padding:8px 10px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:14px;box-shadow:0 14px 34px rgba(37,38,65,.25)}
.ie-bar button{border:0;background:rgba(255,255,255,.1);color:#fff;border-radius:10px;padding:7px 11px;font-size:13px;line-height:1}
.ie-bar button:hover{background:rgba(255,255,255,.2)}
.ie-bar .sep{width:1px;align-self:stretch;background:rgba(255,255,255,.18);margin:0 2px}
.ie-bar .st{font-size:12px;color:#B2B3CF;margin-inline-start:auto;padding:0 6px}
.ie-bar .done{background:#fff;color:var(--navy);font-weight:600}
.ie-bar .pub{background:var(--orange);font-weight:600}
.ie-bar .demo{font-size:12px;color:#FFE1BC;padding:0 4px}
.ie-on .lbody h1[contenteditable],.ie-on .lbody .sub[contenteditable]{outline:0;border-radius:8px;transition:background .15s}
.ie-on .lbody h1[contenteditable]:hover,.ie-on .lbody .sub[contenteditable]:hover{background:#FFF8EE}
.ie-on .lbody .sub:empty:before{content:attr(data-ph);color:#b4b4c6}
.ie-on .prose{outline:2px dashed #d9dbf5;outline-offset:14px;border-radius:6px;min-height:140px;caret-color:var(--orange)}
.ie-on .prose:focus{outline-color:#a9acef}
.ie-on .prose figure.media,.ie-on .prose .lab{position:relative;user-select:none}
.ie-on .prose figure.media{cursor:default;transition:box-shadow .15s}
.ie-on .prose figure.media:hover,.ie-on .prose figure.media.sel{box-shadow:0 0 0 2px var(--orange)}
.ie-on .prose figcaption{outline:0;min-height:1.4em;user-select:text}
.ie-on .prose figcaption:empty:before{content:"أضف وصفًا…";color:#b4b4c6}
.ie-figbar{position:absolute;top:8px;inset-inline-start:8px;display:none;gap:3px;background:#fff;border-radius:12px;box-shadow:0 8px 24px rgba(37,38,65,.22);padding:4px;z-index:6;direction:rtl}
.ie-on figure.media:hover .ie-figbar,.ie-on figure.media.sel .ie-figbar,.ie-on .lab:hover .ie-figbar{display:flex}
.ie-figbar button{border:0;background:var(--bg);border-radius:8px;min-width:30px;height:30px;padding:0 8px;font-size:12.5px;color:var(--navy);white-space:nowrap}
.ie-figbar button:hover{background:#EEF0FF}
.ie-figbar button.on{background:var(--navy);color:#fff}
.ie-figbar button.del{color:var(--red)}
.ie-figbar .w{font-size:12px;color:var(--muted);padding:0 6px;align-self:center;min-width:38px;text-align:center}
.ie-handle{position:absolute;top:50%;width:14px;height:46px;margin-top:-23px;border-radius:8px;background:var(--orange);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25);cursor:ew-resize;display:none;z-index:6;touch-action:none}
.ie-on figure.media:hover .ie-handle,.ie-on figure.media.sel .ie-handle{display:block}
.ie-handle.a{left:-8px}.ie-handle.b{right:-8px}
.ie-on .lab .ie-figbar{top:54px}
.ie-kwmenu{position:absolute;z-index:170;background:#fff;border-radius:12px;box-shadow:0 14px 34px rgba(37,38,65,.22);padding:5px;display:flex;gap:4px}
.ie-kwmenu button{border:0;background:var(--bg);border-radius:8px;padding:7px 12px;font-size:12.5px;color:var(--navy)}
.ie-kwmenu button.del{color:var(--red)}
`;
(() => { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); })();

let A = null; // active editing session

/* ---------- page → lesson markup ---------- */
const clean = s => String(s).replace(/ /g, ' ').replace(/[ \t]+/g, ' ');
function inl(el) {
  let out = '';
  el.childNodes.forEach(n => {
    if (n.nodeType === 3) { out += clean(n.nodeValue); return; }
    if (n.nodeType !== 1 || isUi(n)) return;
    const tag = n.tagName;
    if (tag === 'BR') { out += ' '; return; }
    if (tag === 'A' && n.classList.contains('kw') && n.dataset.target) { const w = clean(n.textContent).trim(); if (w) out += `[[${w}|${n.dataset.target}]]`; return; }
    if (tag === 'STRONG' || tag === 'B') { const t = inl(n); out += t.trim() ? `**${t.trim()}**` + (/\s$/.test(t) ? ' ' : '') : t; return; }
    out += inl(n);
  });
  return out;
}
const isUi = n => n.nodeType === 1 && [...n.classList].some(c => c.startsWith('ie-'));
function figToObj(fig) {
  const cap = $('figcaption', fig);
  const w = parseFloat(fig.style.getPropertyValue('--w')) || 100;
  const align = fig.classList.contains('fl-r') ? 'r' : fig.classList.contains('fl-l') ? 'l' : 'c';
  const o = { cap: cap ? clean(cap.textContent).trim() : '', src: fig.dataset.src, size: Math.round(w), align };
  return T.parseMedia(T.mediaLine(o)) || o;
}
function serialize(root) {
  const blocks = [];
  const para = t => { t = t.trim(); if (t) blocks.push(t); };
  root.childNodes.forEach(n => {
    if (n.nodeType === 3) { para(clean(n.nodeValue)); return; }
    if (n.nodeType !== 1 || isUi(n)) return;
    const tag = n.tagName;
    if (tag === 'H2' || tag === 'H3') { const t = inl(n).trim(); if (t) blocks.push((tag === 'H2' ? '## ' : '### ') + t); }
    else if (tag === 'UL' || tag === 'OL') { const items = $$(':scope > li', n).map(li => '- ' + inl(li).trim()).filter(x => x !== '- '); if (items.length) blocks.push(items.join('\n')); }
    else if (tag === 'FIGURE' && n.dataset.src) blocks.push(T.mediaLine(figToObj(n)));
    else if (tag === 'SECTION' && n.classList.contains('lab')) blocks.push(`::lab[${n.id.replace(/^lab-/, '')}]`);
    else if (tag === 'BR') return;
    else if (tag === 'H1' || tag === 'H4') { const t = inl(n).trim(); if (t) blocks.push('## ' + t); }
    else para(inl(n));
  });
  return blocks.join('\n\n') + (blocks.length ? '\n' : '');
}
T.serializeLesson = serialize;

/* ---------- lesson markup → page elements ---------- */
function htmlFor(markup) {
  const box = document.createElement('div');
  box.innerHTML = T.renderBody(markup, { subjectId: A.subjectId }).html;
  return box.firstElementChild;
}
function decorate(el) {
  if (el.matches('figure.media')) {
    el.contentEditable = 'false';
    let cap = $('figcaption', el);
    if (!cap) { cap = document.createElement('figcaption'); el.appendChild(cap); }
    cap.contentEditable = 'true';
    const isMedia = !$('img', el);
    el.insertAdjacentHTML('afterbegin', `<div class="ie-figbar" contenteditable="false">
      <button type="button" data-al="r" title="يمين والنص حولها">⇥ يمين</button><button type="button" data-al="c" title="في الوسط">وسط</button><button type="button" data-al="l" title="يسار والنص حولها">يسار ⇤</button>
      <span class="w"></span><button type="button" data-sz="-">−</button><button type="button" data-sz="+">+</button>
      <button type="button" data-edit title="إعدادات">✎</button><button type="button" class="del" data-rm title="حذف">🗑</button></div>
      <span class="ie-handle a" contenteditable="false" title="اسحب لتغيير الحجم"></span><span class="ie-handle b" contenteditable="false" title="اسحب لتغيير الحجم"></span>`);
    if (isMedia) $$('video,iframe', el).forEach(v => v.style.pointerEvents = 'auto');
    figUi(el);
  } else if (el.matches('section.lab')) {
    el.contentEditable = 'false';
    el.insertAdjacentHTML('afterbegin', `<div class="ie-figbar" contenteditable="false"><button type="button" class="del" data-rm>🗑 حذف التجربة</button></div>`);
  }
}
function figUi(fig) {
  const o = figToObj(fig);
  $$('[data-al]', fig).forEach(b => b.classList.toggle('on', b.dataset.al === o.align));
  const w = $('.ie-figbar .w', fig); if (w) w.textContent = o.size + '%';
}
function applyFig(fig, o) {
  fig.classList.toggle('fl-r', o.align === 'r');
  fig.classList.toggle('fl-l', o.align === 'l');
  fig.classList.toggle('sized', o.size < 100);
  fig.style.setProperty('--w', o.size + '%');
  figUi(fig);
}

/* ---------- session ---------- */
function bar() {
  const b = document.createElement('div');
  b.className = 'ie-bar';
  b.innerHTML = `
    <button type="button" data-cmd="h2" title="عنوان قسم">عنوان</button><button type="button" data-cmd="h3">عنوان فرعي</button><button type="button" data-cmd="p">فقرة</button>
    <button type="button" data-cmd="bold"><b>غامق</b></button><button type="button" data-cmd="list">• قائمة</button>
    <span class="sep"></span>
    <button type="button" data-cmd="link">🔗 ربط كلمة</button><button type="button" data-cmd="img">🖼 صورة</button><button type="button" data-cmd="video">🎬 فيديو</button><button type="button" data-cmd="lab">🧪 تجربة</button>
    <span class="st">وضع التعديل</span>
    <button type="button" class="pub" data-cmd="publish">☁ نشر للجميع</button>
    <button type="button" class="done" data-cmd="done" title="${connected() ? 'يحفظ وينشر للجميع' : 'يحفظ تعديلاتك'}">✓ ${connected() ? 'تم ونشر' : 'تم'}</button>`;
  return b;
}
function canEdit() { try { return localStorage.getItem('takamul.canEdit'); } catch (e) { return null; } }
function connected() { try { const c = JSON.parse(localStorage.getItem('takamul.gh.v1') || 'null'); return !!(c && c.token); } catch (e) { return false; } }

function start(id) {
  if (!E()) return;
  E().syncDraft();          // the draft, with other editors' published changes merged in
  T.loadData(); T.route();  // re-render this lesson from it
  const L = T.ix.les[id], pl = T.ix.place[id];
  const art = $('#view .lesson');
  if (!L || !art) return;
  const lbody = $('.lbody', art);
  let prose = $('.prose', lbody);
  if (!prose) {
    prose = document.createElement('div'); prose.className = 'prose'; prose.innerHTML = '<p><br></p>';
    const pend = $('.pending', lbody); pend ? pend.replaceWith(prose) : lbody.appendChild(prose);
  }
  const h1 = $('h1', lbody);
  let sub = $('.sub', lbody);
  if (!sub) { sub = document.createElement('div'); sub.className = 'sub'; h1.after(sub); }
  sub.dataset.ph = 'سطر يشرح السؤال الذي يجيب عنه الموضوع (اختياري)';
  [h1, sub, prose].forEach(x => { x.contentEditable = 'true'; x.spellcheck = false; });
  try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (e) {}
  $$('figure.media, section.lab', prose).forEach(decorate);
  const b = bar();
  art.parentNode.insertBefore(b, art);
  art.classList.add('ie-on');
  document.body.classList.add('inline-editing');
  A = { id, L, art, prose, h1, sub, bar: b, subjectId: pl ? pl.s.id : '', timer: null, range: null };

  b.addEventListener('mousedown', e => { if (e.target.closest('button')) e.preventDefault(); });
  b.addEventListener('click', e => { const c = e.target.closest('[data-cmd]'); if (c) cmd(c.dataset.cmd); });
  [h1, sub].forEach(x => x.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); if (x === h1) sub.focus(); else prose.focus(); } }));
  [h1, sub, prose].forEach(x => {
    x.addEventListener('input', schedule);
    x.addEventListener('paste', e => { e.preventDefault(); const t = (e.clipboardData || window.clipboardData).getData('text/plain'); document.execCommand('insertText', false, t); });
  });
  prose.addEventListener('click', onProseClick, true);
  prose.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('selectionchange', rememberRange);
  prose.focus();
  status('عدّل النص مباشرة؛ يُحفظ تلقائيًا');
}
function status(t) { if (A) $('.st', A.bar).textContent = t; }
function schedule() { if (!A) return; status('جارٍ الحفظ…'); clearTimeout(A.timer); A.timer = setTimeout(save, 400); }
function save() {
  if (!A) return;
  clearTimeout(A.timer);
  const L = A.L;
  const title = clean(A.h1.textContent).trim();
  if (title) L.title = title;
  const sub = clean(A.sub.textContent).trim();
  if (sub) L.subtitle = sub; else delete L.subtitle;
  L.body = serialize(A.prose);
  L.updated = today();
  T.useData(T.data);
  status(T.saveDraft(T.data) ? 'حُفظ ✓' : '⚠ تعذّر الحفظ في المتصفح');
}
function stop() {
  if (!A) return;
  save();
  document.removeEventListener('selectionchange', rememberRange);
  document.body.classList.remove('inline-editing');
  closeKwMenu();
  A = null;
}
function rememberRange() {
  if (!A) return;
  const s = getSelection();
  if (s.rangeCount && A.prose.contains(s.getRangeAt(0).startContainer)) A.range = s.getRangeAt(0).cloneRange();
}
function restoreRange() {
  if (!A || !A.range) return false;
  const s = getSelection(); s.removeAllRanges(); s.addRange(A.range); return true;
}
/* the direct child of the prose that holds the caret (to insert media after it) */
function currentBlock() {
  let n = A.range && A.range.startContainer;
  if (!n || !A.prose.contains(n)) return null;
  while (n && n.parentNode !== A.prose) n = n.parentNode;
  return n;
}
function insertEl(el) {
  const blk = currentBlock();
  if (blk && blk.nextSibling) A.prose.insertBefore(el, blk.nextSibling); else A.prose.appendChild(el);
  if (!el.nextElementSibling) { const p = document.createElement('p'); p.innerHTML = '<br>'; A.prose.appendChild(p); }
  decorate(el);
  T.wireLabs(A.art);
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  save();
}

function cmd(c) {
  if (!A) return;
  const ed = E();
  if (c === 'done') {
    stop(); T.loadData(); T.route();
    if (connected()) ed.publishQuiet(); else ed.toast('حُفظت تعديلاتك. اضغط «نشر للجميع» لتظهر لكل الزوار.');
    return;
  }
  if (c === 'publish') { save(); ed.publish(); return; }
  if (['h2', 'h3', 'p', 'bold', 'list'].includes(c)) {
    if (!restoreRange()) A.prose.focus();
    if (c === 'bold') document.execCommand('bold');
    else if (c === 'list') document.execCommand('insertUnorderedList');
    else document.execCommand('formatBlock', false, c === 'p' ? 'p' : c);
    schedule(); return;
  }
  if (c === 'link') {
    const r = A.range, word = r ? r.toString().trim() : '';
    if (!word) { ed.toast('حدّد كلمة في النص أولًا'); return; }
    const saved = r.cloneRange();
    ed.dialogs.link(A.L, word, (w, target) => {
      const a = $('a.kw', htmlFor(`[[${w}|${target}]]`));
      saved.deleteContents(); saved.insertNode(a);
      save();
    });
    return;
  }
  if (c === 'img' || c === 'video') { ed.dialogs.media(c === 'img' ? 'image' : 'video', null, { insert: o => insertEl(htmlFor(T.mediaLine(o))) }); return; }
  if (c === 'lab') { ed.dialogs.lab(id => insertEl(htmlFor(`::lab[${id}]`))); }
}

/* ---------- figures: buttons and drag-to-resize ---------- */
function onProseClick(e) {
  if (!A) return;
  const fig = e.target.closest('figure.media, section.lab');
  $$('figure.media.sel', A.prose).forEach(f => { if (f !== fig) f.classList.remove('sel'); });
  const kw = e.target.closest('a.kw');
  if (kw && A.prose.contains(kw)) { e.preventDefault(); e.stopPropagation(); kwMenu(kw); return; }
  closeKwMenu();
  if (!fig) return;
  if (e.target.closest('a')) { e.preventDefault(); }
  if (fig.matches('figure.media')) fig.classList.add('sel');
  const btn = e.target.closest('.ie-figbar button');
  if (!btn) return;
  e.preventDefault(); e.stopPropagation();
  if (btn.dataset.rm !== undefined) { fig.remove(); save(); E().toast('حُذف'); return; }
  const o = figToObj(fig);
  if (btn.dataset.al) { o.align = btn.dataset.al; if (o.align !== 'c' && o.size > 60) o.size = 45; if (o.align === 'c' && o.size < 40) o.size = 60; applyFig(fig, o); save(); return; }
  if (btn.dataset.sz) { o.size = Math.max(20, Math.min(100, o.size + (btn.dataset.sz === '+' ? 5 : -5))); applyFig(fig, o); save(); return; }
  if (btn.dataset.edit !== undefined) {
    E().dialogs.media('image', { o }, {
      save: n => { const el = htmlFor(T.mediaLine(n)); fig.replaceWith(el); decorate(el); save(); },
      remove: () => { fig.remove(); save(); },
    });
  }
}
function onPointerDown(e) {
  const h = e.target.closest('.ie-handle');
  if (!h || !A) return;
  e.preventDefault();
  const fig = h.closest('figure.media'), pr = A.prose.getBoundingClientRect();
  const o = figToObj(fig), fr = fig.getBoundingClientRect();
  const leftHandle = h.classList.contains('a');
  h.setPointerCapture(e.pointerId);
  const move = ev => {
    let px;
    if (o.align === 'r') px = fr.right - ev.clientX;
    else if (o.align === 'l') px = ev.clientX - fr.left;
    else px = Math.abs(ev.clientX - (fr.left + fr.width / 2)) * 2;
    if (o.align === 'c' && !leftHandle && ev.clientX < fr.left + fr.width / 2) px = fr.width;
    o.size = Math.max(20, Math.min(100, Math.round(px / pr.width * 100 / 5) * 5));
    applyFig(fig, o);
  };
  const up = () => { h.removeEventListener('pointermove', move); h.removeEventListener('pointerup', up); save(); };
  h.addEventListener('pointermove', move);
  h.addEventListener('pointerup', up);
}

/* ---------- linked words ---------- */
let kwEl = null;
function closeKwMenu() { if (kwEl) { kwEl.remove(); kwEl = null; } }
function kwMenu(a) {
  closeKwMenu();
  kwEl = document.createElement('div');
  kwEl.className = 'ie-kwmenu';
  kwEl.innerHTML = `<button type="button" data-k="change">🔗 تغيير الرابط</button><button type="button" class="del" data-k="unlink">إزالة الرابط</button>`;
  document.body.appendChild(kwEl);
  const r = a.getBoundingClientRect();
  kwEl.style.top = (r.bottom + scrollY + 8) + 'px';
  kwEl.style.left = Math.max(10, r.left + scrollX + r.width / 2 - kwEl.offsetWidth / 2) + 'px';
  kwEl.onclick = e => {
    const k = e.target.closest('[data-k]'); if (!k) return;
    closeKwMenu();
    if (k.dataset.k === 'unlink') { a.replaceWith(document.createTextNode(a.textContent)); save(); return; }
    E().dialogs.link(A.L, a.textContent.trim(), (w, target) => { const n = $('a.kw', htmlFor(`[[${w}|${target}]]`)); a.replaceWith(n); save(); });
  };
}
document.addEventListener('mousedown', e => { if (kwEl && !kwEl.contains(e.target)) closeKwMenu(); });

addEventListener('hashchange', () => { if (A) stop(); });

/* add a topic, branch or lesson straight from the subject page */
const uid = p => p + '-' + Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2, 5);
async function addTo(kind, pid) {
  const ed = E(); if (!ed) return;
  const D = ed.syncDraft();
  const label = kind === 'topic' ? 'وحدة جديدة' : kind === 'branch' ? 'فرع جديد' : 'موضوع جديد';
  const name = await ed.ask(label, '', kind === 'lesson' ? 'عنوان الموضوع' : 'الاسم');
  if (!name) return;
  let newLesson = null;
  D.subjects.forEach(s => {
    if (kind === 'topic' && s.id === pid) s.topics.push({ id: uid('t'), name, branches: [] });
    s.topics.forEach(t => {
      if (kind === 'branch' && t.id === pid) t.branches.push({ id: uid('b'), name, lessons: [] });
      t.branches.forEach(b => {
        if (kind === 'lesson' && b.id === pid && !newLesson) { newLesson = { id: uid('l'), title: name, body: '', updated: today() }; D.lessons.push(newLesson); b.lessons.push(newLesson.id); }
      });
    });
  });
  T.useData(D); T.saveDraft(D); T.loadData();
  if (newLesson) { location.hash = '#lesson/' + newLesson.id; setTimeout(() => start(newLesson.id), 60); }
  else { T.route(); ed.toast(`تمت الإضافة: ${name}`); }
}

window.TInline = {
  canEdit,
  start,
  addTo,
  isActive: () => !!A,
  afterPublish() { if (A) { const id = A.id; stop(); T.loadData(); T.route(); } },
};
})();

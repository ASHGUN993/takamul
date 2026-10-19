/* تكامل — المحرّر المرئي (#editor) والوضع التجريبي (#try).
   يحفظ المسودة في المتصفح، والصور والتجارب في IndexedDB، ويُصدِّر ملف zip فيه content.js والملفات الجديدة. */
(function () {
'use strict';
const T = window.T;
if (!T) return;
const esc = T.esc;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const JSZIP_URL = 'vendor/jszip.min.js';

let root = null, D = null, sel = null, demo = false, open = false;
const expanded = new Set();
const uid = p => p + '-' + Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2, 5);
const today = () => new Date().toISOString().slice(0, 10);

const CSS = `
.ed{position:fixed;inset:0;z-index:100;background:#F2F3F9;display:flex;flex-direction:column;font-size:14px}
.ed-top{height:60px;flex:none;background:#fff;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:12px;padding:0 18px}
.ed-top .logo{font-size:20px}
.ed-top .ttl{font-weight:600;color:var(--navy);background:#EEF0FF;border-radius:20px;padding:4px 12px;font-size:13px}
.ed-top .st{color:var(--muted);font-size:12.5px;margin-inline-start:6px}
.ed-top .sp{flex:1}
.ed-top .btn{padding:9px 16px;font-size:13px}
.ed-demo{background:#FFF4D6;color:#6b4a00;padding:8px 18px;font-size:13px;display:flex;gap:10px;align-items:center;border-bottom:1px solid #f3dfa6}
.ed-demo b{color:#3a2800}
.ed-demo button{margin-inline-start:auto;border:0;background:#fff;border-radius:20px;padding:5px 14px;font-size:12.5px;color:#6b4a00}
.ed-body{flex:1;display:grid;grid-template-columns:300px minmax(380px,1fr) minmax(380px,1fr);min-height:0}
.ed-col{overflow:auto;min-height:0}
.ed-tree{background:#fff;border-inline-end:1px solid var(--line);padding:14px 10px}
.ed-tree .add-subj{width:100%;border:1px dashed #c9cbf5;background:#F7F8FF;color:var(--navy);border-radius:12px;padding:9px;margin-bottom:10px;font-size:13px}
.trow{display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:10px;cursor:pointer;position:relative}
.trow:hover{background:var(--bg)}
.trow.on{background:#FFF4E5;color:#9a5a00;font-weight:600}
.trow .car{width:14px;color:#b4b4c6;font-size:11px;flex:none;text-align:center}
.trow .nm{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.trow .acts{display:none;gap:2px}
.trow:hover .acts,.trow.on .acts{display:flex}
.trow .acts button{border:0;background:#fff;width:24px;height:24px;border-radius:7px;font-size:12px;color:var(--muted);box-shadow:0 1px 3px rgba(0,0,0,.08)}
.trow .acts button:hover{color:var(--navy)}
.trow.l1{font-weight:600}
.trow.l2{padding-inline-start:22px}
.trow.l3{padding-inline-start:38px;color:#4a4a66}
.trow.l4{padding-inline-start:56px;color:var(--muted)}
.trow.l4.empty .nm{opacity:.6}
.trow .sw{width:10px;height:10px;border-radius:50%;flex:none}
.ed-form{padding:20px 22px 60px}
.ed-form h2{font-size:18px;color:var(--navy);margin-bottom:4px}
.ed-form .hint{color:var(--muted);font-size:12.5px;margin-bottom:16px}
.fld{margin-bottom:14px}
.fld>label{display:block;font-size:12.5px;font-weight:600;color:#4a4a66;margin-bottom:5px}
.fld>label small{font-weight:400;color:var(--muted)}
.fld input[type=text],.fld input[type=number],.fld input[type=url],.fld textarea,.fld select{width:100%;border:1px solid #E1E2EC;border-radius:12px;padding:9px 12px;background:#fff;outline:0;font-size:14px}
.fld textarea{resize:vertical;line-height:1.8}
.fld input:focus,.fld textarea:focus,.fld select:focus{border-color:#a9acef;box-shadow:0 0 0 3px rgba(108,63,209,.08)}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.row3{display:grid;grid-template-columns:2fr 1fr 1fr;gap:12px}
.cover-f{display:flex;gap:10px;align-items:center}
.cover-f .cv{width:96px;height:54px;border-radius:10px;background:var(--bg) center/cover;border:1px solid var(--line);flex:none}
.sbtn{border:1px solid #E1E2EC;background:#fff;border-radius:10px;padding:7px 12px;font-size:12.5px;color:var(--navy)}
.sbtn:hover{border-color:#a9acef}
.sbtn.o{background:var(--orange);border-color:var(--orange);color:#fff}
.sbtn.d{color:var(--red)}
.tb{display:flex;flex-wrap:wrap;gap:6px;background:#fff;border:1px solid #E1E2EC;border-bottom:0;border-radius:12px 12px 0 0;padding:8px}
.tb button{border:0;background:var(--bg);border-radius:8px;padding:6px 10px;font-size:12.5px;color:var(--navy)}
.tb button:hover{background:#EEF0FF}
.tb button.hl{background:#FFF4E5;color:#9a5a00;font-weight:600}
.tb .sep{width:1px;background:var(--line);margin:0 2px}
.fld textarea.body{unicode-bidi:plaintext;border-radius:0 0 12px 12px;min-height:420px;font-family:"Readex Pro",Tahoma,sans-serif;font-size:14.5px}
.chk{display:flex;gap:8px;align-items:center;font-size:13px;color:#4a4a66}
.ed-prev{background:var(--bg);padding:20px;border-inline-start:1px solid var(--line)}
.ed-prev .pvh{font-size:12px;color:var(--muted);margin-bottom:10px;display:flex;justify-content:space-between}
.ed-prev .lesson{box-shadow:0 6px 24px rgba(47,50,125,.08)}
.ed-prev .pager{display:none}
.ed-empty{display:grid;place-items:center;height:100%;color:var(--muted);text-align:center;padding:30px}
.ed-dlg .box{width:min(560px,100%)}
.dlg-b{padding:4px 20px 20px}
.dtabs{display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap}
.dtabs button{border:1px solid var(--line);background:#fff;border-radius:20px;padding:6px 14px;font-size:13px}
.dtabs button.on{background:var(--navy);color:#fff;border-color:var(--navy)}
.pick{max-height:260px;overflow:auto;border:1px solid var(--line);border-radius:12px;margin-top:8px}
.pick button{display:flex;width:100%;gap:8px;align-items:center;border:0;background:#fff;padding:8px 12px;text-align:start;font-size:13.5px;border-bottom:1px solid #f3f3f8}
.pick button:hover{background:var(--bg)}
.pick button.on{background:#FFF4E5}
.pick small{color:var(--muted);margin-inline-start:auto;font-size:11.5px}
.dlg-f{display:flex;gap:8px;justify-content:flex-end;margin-top:16px}
.help{font-size:13px;line-height:2}
.help code{background:var(--bg);border-radius:6px;padding:2px 6px;font-family:ui-monospace,monospace;direction:ltr;unicode-bidi:embed;font-size:12.5px}
.toast{position:fixed;bottom:22px;right:50%;transform:translateX(50%);background:var(--ink);color:#fff;border-radius:30px;padding:10px 20px;font-size:13px;z-index:200;animation:pin .2s}
@media (max-width:1100px){.ed-body{grid-template-columns:260px 1fr}.ed-prev{display:none}.ed-body.pv .ed-prev{display:block;grid-column:2}.ed-body.pv .ed-form{display:none}}
@media (max-width:700px){.ed-body{grid-template-columns:1fr}.ed-tree{max-height:34vh;border-bottom:1px solid var(--line)}.ed-body.pv .ed-prev{grid-column:1}.ed-top .st{display:none}.row3,.row2{grid-template-columns:1fr}}
`;

/* ---------- helpers ---------- */
function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2400); }
function dialog(title, inner, onReady) {
  const m = T.openModal(title, `<div class="dlg-b">${inner}</div>`);
  m.classList.add('ed-dlg');
  m.style.zIndex = 150;
  if (onReady) onReady(m, () => m.remove());
  return m;
}
function askText(title, value = '', label = '') {
  return new Promise(res => {
    let done = false;
    const m = dialog(title, `<div class="fld"><label>${esc(label)}</label><input type="text" value="${esc(value)}"></div><div class="dlg-f"><button class="sbtn" data-x>إلغاء</button><button class="sbtn o" data-ok>حفظ</button></div>`, (m, close) => {
      const i = $('input', m); setTimeout(() => { i.focus(); i.select(); }, 30);
      const ok = () => { done = true; close(); res(i.value.trim()); };
      $('[data-ok]', m).onclick = ok;
      i.onkeydown = e => { if (e.key === 'Enter') ok(); };
      $('[data-x]', m).onclick = () => { close(); res(null); };
    });
    new MutationObserver((_, o) => { if (!m.isConnected) { o.disconnect(); if (!done) res(null); } }).observe(document.body, { childList: true });
  });
}
function loadJSZip() {
  if (window.JSZip) return Promise.resolve(window.JSZip);
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = JSZIP_URL; s.onload = () => res(window.JSZip); s.onerror = () => rej(new Error('تعذّر تحميل مكتبة الضغط (vendor/jszip.min.js).')); document.head.appendChild(s); });
}
function slugFile(name) {
  const m = String(name).toLowerCase().match(/^(.*?)(\.[a-z0-9]+)?$/);
  const base = (m[1] || 'file').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'file';
  return { base, ext: m[2] || '' };
}
async function storeFile(path, blob) {
  await T.idbPut(path, { blob, type: blob.type, at: Date.now() });
  if (T.FILES[path]) URL.revokeObjectURL(T.FILES[path]);
  T.FILES[path] = URL.createObjectURL(blob);
}
function pickFile(accept) {
  return new Promise(res => { const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.onchange = () => res(i.files[0] || null); i.click(); });
}

/* ---------- data ops ---------- */
const findSubj = id => D.subjects.find(s => s.id === id);
function findTopic(id) { for (const s of D.subjects) { const t = s.topics.find(t => t.id === id); if (t) return { s, t }; } return null; }
function findBranch(id) { for (const s of D.subjects) for (const t of s.topics) { const b = t.branches.find(b => b.id === id); if (b) return { s, t, b }; } return null; }
const findLesson = id => D.lessons.find(l => l.id === id);
function lessonPlace(id) { for (const s of D.subjects) for (const t of s.topics) for (const b of t.branches) if (b.lessons.includes(id)) return { s, t, b }; return null; }
function move(arr, i, d) { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; }
function dropLessons(ids) { D.lessons = D.lessons.filter(l => !ids.includes(l.id)); if (ids.includes(D.site.featured)) D.site.featured = ''; }

let saveTimer = null, pvTimer = null;
function changed(opts = {}) {
  T.useData(D);
  clearTimeout(saveTimer);
  setStatus('جارٍ الحفظ…');
  saveTimer = setTimeout(() => setStatus(T.saveDraft(D) ? 'حُفظت المسودة ✓' : '⚠ تعذّر الحفظ في المتصفح'), 350);
  if (opts.tree) drawTree();
  clearTimeout(pvTimer);
  pvTimer = setTimeout(drawPreview, opts.now ? 0 : 220);
}
function setStatus(t) { const s = $('.st', root); if (s) s.textContent = t; }

/* ---------- layout ---------- */
function build() {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  root = document.createElement('div');
  root.className = 'ed hide';
  root.innerHTML = `<div class="ed-top">
      <a class="logo" href="#"><svg width="36" height="26" viewBox="0 0 46 34"><defs><clipPath id="edk"><circle cx="15" cy="17" r="13"/></clipPath></defs><circle cx="15" cy="17" r="13" fill="#2D7FF9"/><circle cx="31" cy="17" r="13" fill="#F0435A"/><circle cx="31" cy="17" r="13" fill="#6C3FD1" clip-path="url(#edk)"/></svg>تكامل</a>
      <span class="ttl">المحرّر</span><span class="st"></span><span class="sp"></span>
      <button class="btn btn-g" data-act="help">؟ طريقة الكتابة</button>
      <button class="btn btn-g" data-act="pv" style="display:none">المعاينة</button>
      <a class="btn btn-g" data-act="site" href="#">↗ عرض الموقع بتعديلاتي</a>
      <button class="btn btn-g" data-act="reset">⟲ إعادة الضبط</button>
      <button class="btn btn-o" data-act="export">⤓ تصدير</button>
    </div>
    <div class="ed-demo hide"><span>🧪 <b>وضع تجريبي:</b> جرّب إضافة درس أو ربط كلمة. تعديلاتك تظهر في متصفحك فقط ولن يراها غيرك.</span><button data-act="reset">إعادة الضبط</button></div>
    <div class="ed-body"><div class="ed-col ed-tree"></div><div class="ed-col ed-form"></div><div class="ed-col ed-prev"></div></div>`;
  document.body.appendChild(root);
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const a = b.dataset.act;
    if (a === 'export') { e.preventDefault(); doExport(); }
    else if (a === 'reset') { e.preventDefault(); doReset(); }
    else if (a === 'help') { e.preventDefault(); showHelp(); }
    else if (a === 'pv') { e.preventDefault(); $('.ed-body', root).classList.toggle('pv'); b.textContent = $('.ed-body', root).classList.contains('pv') ? 'التحرير' : 'المعاينة'; }
  });
  const mq = matchMedia('(max-width:1100px)');
  const pvBtn = $('[data-act=pv]', root);
  const upd = () => { pvBtn.style.display = mq.matches ? '' : 'none'; };
  mq.addEventListener ? mq.addEventListener('change', upd) : mq.addListener(upd); upd();
}

/* ---------- tree ---------- */
function drawTree() {
  const el = $('.ed-tree', root);
  const isOn = (type, id) => sel && sel.type === type && sel.id === id ? ' on' : '';
  const acts = (type, id, add) => `<span class="acts">${add ? `<button title="${add}" data-op="add">＋</button>` : ''}<button title="أعلى" data-op="up">↑</button><button title="أسفل" data-op="down">↓</button><button title="حذف" data-op="del">×</button></span>`;
  let h = `<button class="add-subj" data-op="add-subj">＋ مادة جديدة</button>`;
  D.subjects.forEach(s => {
    const ex = expanded.has(s.id);
    h += `<div class="trow l1${isOn('subject', s.id)}" data-type="subject" data-id="${esc(s.id)}"><span class="car">${ex ? '▾' : '‹'}</span><span class="sw" style="background:${esc(s.color)}"></span><span class="nm">${esc(s.name)}</span>${acts('subject', s.id, 'إضافة موضوع')}</div>`;
    if (!ex) return;
    s.topics.forEach(t => {
      const et = expanded.has(t.id);
      h += `<div class="trow l2${isOn('topic', t.id)}" data-type="topic" data-id="${esc(t.id)}"><span class="car">${et ? '▾' : '‹'}</span><span class="nm">${esc(t.name)}</span>${acts('topic', t.id, 'إضافة فرع')}</div>`;
      if (!et) return;
      t.branches.forEach(b => {
        const eb = expanded.has(b.id);
        h += `<div class="trow l3${isOn('branch', b.id)}" data-type="branch" data-id="${esc(b.id)}"><span class="car">${eb ? '▾' : '‹'}</span><span class="nm">${esc(b.name)}</span>${acts('branch', b.id, 'إضافة درس')}</div>`;
        if (!eb) return;
        b.lessons.forEach(id => {
          const l = findLesson(id); if (!l) return;
          h += `<div class="trow l4${isOn('lesson', id)}${T.hasBody(l) ? '' : ' empty'}" data-type="lesson" data-id="${esc(id)}"><span class="car">•</span><span class="nm">${esc(l.title)}</span>${acts('lesson', id)}</div>`;
        });
      });
    });
  });
  el.innerHTML = h;
}
async function treeClick(e) {
  const opB = e.target.closest('[data-op]');
  if (opB && opB.dataset.op === 'add-subj') {
    const name = await askText('مادة جديدة', '', 'اسم المادة'); if (!name) return;
    const s = { id: uid('s'), name, color: '#6C3FD1', icon: 'book', topics: [] };
    D.subjects.push(s); expanded.add(s.id); select('subject', s.id); changed({ tree: true }); return;
  }
  const row = e.target.closest('.trow'); if (!row) return;
  const { type, id } = row.dataset;
  const op = opB && opB.dataset.op;
  if (!op) {
    if (type !== 'lesson') { if (expanded.has(id) && sel && sel.id === id) expanded.delete(id); else expanded.add(id); }
    select(type, id); drawTree(); return;
  }
  if (type === 'subject') {
    const i = D.subjects.findIndex(s => s.id === id), s = D.subjects[i];
    if (op === 'up' || op === 'down') move(D.subjects, i, op === 'up' ? -1 : 1);
    if (op === 'del') { if (!confirm(`حذف مادة «${s.name}» وكل دروسها؟`)) return; dropLessons(s.topics.flatMap(t => t.branches.flatMap(b => b.lessons))); D.subjects.splice(i, 1); sel = null; }
    if (op === 'add') { const n = await askText('موضوع جديد', '', `في مادة ${s.name}`); if (!n) return; const t = { id: uid('t'), name: n, branches: [] }; s.topics.push(t); expanded.add(s.id); expanded.add(t.id); select('topic', t.id); }
  } else if (type === 'topic') {
    const { s, t } = findTopic(id), i = s.topics.indexOf(t);
    if (op === 'up' || op === 'down') move(s.topics, i, op === 'up' ? -1 : 1);
    if (op === 'del') { if (!confirm(`حذف موضوع «${t.name}» وكل دروسه؟`)) return; dropLessons(t.branches.flatMap(b => b.lessons)); s.topics.splice(i, 1); sel = null; }
    if (op === 'add') { const n = await askText('فرع جديد', '', `في موضوع ${t.name}`); if (!n) return; const b = { id: uid('b'), name: n, lessons: [] }; t.branches.push(b); expanded.add(t.id); expanded.add(b.id); select('branch', b.id); }
  } else if (type === 'branch') {
    const { t, b } = findBranch(id), i = t.branches.indexOf(b);
    if (op === 'up' || op === 'down') move(t.branches, i, op === 'up' ? -1 : 1);
    if (op === 'del') { if (!confirm(`حذف فرع «${b.name}» ودروسه؟`)) return; dropLessons(b.lessons); t.branches.splice(i, 1); sel = null; }
    if (op === 'add') { const n = await askText('درس جديد', '', `في فرع ${b.name}`); if (!n) return; const l = { id: uid('l'), title: n, body: '', updated: today() }; D.lessons.push(l); b.lessons.push(l.id); expanded.add(b.id); select('lesson', l.id); }
  } else if (type === 'lesson') {
    const pl = lessonPlace(id); const i = pl.b.lessons.indexOf(id);
    if (op === 'up' || op === 'down') move(pl.b.lessons, i, op === 'up' ? -1 : 1);
    if (op === 'del') { const l = findLesson(id); if (!confirm(`حذف درس «${l.title}»؟`)) return; pl.b.lessons.splice(i, 1); dropLessons([id]); sel = null; }
  }
  if (!sel) drawForm();
  changed({ tree: true, now: true });
}

/* ---------- forms ---------- */
function select(type, id) {
  sel = { type, id };
  if (type === 'lesson') { const p = lessonPlace(id); if (p) [p.s.id, p.t.id, p.b.id].forEach(x => expanded.add(x)); }
  drawForm(); drawPreview();
  const ln = $('[data-act=site]', root);
  ln.href = type === 'lesson' ? '#lesson/' + id : type === 'subject' ? '#subject/' + id : '#';
}
function drawForm() {
  const el = $('.ed-form', root);
  if (!sel) { el.innerHTML = `<div class="ed-empty"><div><b style="color:var(--navy);font-size:17px">اختر عنصرًا من الشجرة</b><p>مادة أو موضوع أو فرع أو درس.<br>أو اضغط «＋» بجانب الفرع لإضافة درس جديد.</p></div></div>`; return; }
  if (sel.type === 'subject') {
    const s = findSubj(sel.id);
    el.innerHTML = `<h2>إعدادات المادة</h2><p class="hint">الاسم واللون يظهران في التبويبات والشجرة ووسوم المواد المرتبطة.</p>
      <div class="fld"><label>اسم المادة</label><input type="text" data-f="name" value="${esc(s.name)}"></div>
      <div class="row3"><div class="fld"><label>الأيقونة</label><select data-f="icon">${[['bio', 'أحياء'], ['chem', 'كيمياء'], ['phys', 'فيزياء'], ['math', 'رياضيات'], ['ar', 'عربي (ض)'], ['en', 'إنجليزي (Aa)'], ['earth', 'علوم الأرض'], ['book', 'كتاب']].map(([v, n]) => `<option value="${v}"${s.icon === v ? ' selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="fld"><label>اللون</label><input type="color" data-f="color" value="${esc(s.color)}" style="width:100%;height:40px;border:1px solid #E1E2EC;border-radius:12px;padding:3px"></div>
      <div class="fld"><label>اتجاه الدروس</label><select data-f="dir"><option value="">من اليمين (عربي)</option><option value="ltr"${s.dir === 'ltr' ? ' selected' : ''}>من اليسار (English)</option></select></div></div>`;
    $$('[data-f]', el).forEach(i => i.oninput = () => { s[i.dataset.f] = i.value || undefined; if (!s.dir) delete s.dir; changed({ tree: true }); });
    return;
  }
  if (sel.type === 'topic' || sel.type === 'branch') {
    const o = sel.type === 'topic' ? findTopic(sel.id).t : findBranch(sel.id).b;
    el.innerHTML = `<h2>${sel.type === 'topic' ? 'موضوع' : 'فرع'}</h2><p class="hint">${sel.type === 'topic' ? 'استخدم «＋» بجانبه في الشجرة لإضافة فرع.' : 'استخدم «＋» بجانبه في الشجرة لإضافة درس.'}</p>
      <div class="fld"><label>الاسم</label><input type="text" data-f="name" value="${esc(o.name)}"></div>`;
    $('[data-f]', el).oninput = e => { o.name = e.target.value; changed({ tree: true }); };
    return;
  }
  const L = findLesson(sel.id); if (!L) { sel = null; drawForm(); return; }
  const pl = lessonPlace(L.id);
  el.innerHTML = `<h2>${esc(L.title)}</h2><p class="hint">${esc(pl ? `${pl.s.name} › ${pl.t.name} › ${pl.b.name}` : '')} · الرابط: <span dir="ltr">#lesson/${esc(L.id)}</span></p>
    <div class="fld"><label>عنوان الدرس</label><input type="text" data-f="title" value="${esc(L.title)}"></div>
    <div class="fld"><label>العنوان الفرعي <small>سطر يشرح السؤال الذي يجيب عنه الدرس</small></label><input type="text" data-f="subtitle" value="${esc(L.subtitle || '')}"></div>
    <div class="row2"><div class="fld"><label>رمز المنهاج <small>اختياري</small></label><input type="text" data-f="code" dir="ltr" placeholder="G10-S2-U4-L3" value="${esc(L.code || '')}"></div>
      <div class="fld"><label>مدة القراءة <small>بالدقائق</small></label><input type="number" min="1" data-f="minutes" value="${esc(L.minutes || '')}"></div></div>
    <div class="fld"><label>صورة الغلاف</label><div class="cover-f"><span class="cv" style="background-image:${L.cover ? `url('${esc(T.fileUrl(L.cover))}')` : 'none'}"></span><button class="sbtn" data-do="cover">رفع صورة</button>${L.cover ? '<button class="sbtn d" data-do="nocover">إزالة</button>' : ''}</div></div>
    <div class="fld"><label>النبذة <small>يعرضها المساعد عند السؤال عن الموضوع</small></label><textarea rows="3" data-f="summary">${esc(L.summary || '')}</textarea></div>
    <div class="fld"><label>كلمات مفتاحية <small>مفصولة بفاصلة، تساعد المساعد على إيجاد الدرس</small></label><input type="text" data-f="keywords" value="${esc((L.keywords || []).join('، '))}"></div>
    <div class="fld"><label>أسئلة شائعة <small>سؤال في كل سطر، بصياغة الطالب</small></label><textarea rows="3" data-f="faq">${esc((L.faq || []).join('\n'))}</textarea></div>
    <div class="fld"><label>نص الدرس</label>
      <div class="tb">
        <button data-do="h2" title="عنوان قسم">عنوان</button><button data-do="h3">عنوان فرعي</button><button data-do="bold"><b>غامق</b></button><button data-do="list">• قائمة</button>
        <span class="sep"></span><button class="hl" data-do="link">🔗 ربط كلمة</button><button data-do="img">🖼 صورة</button><button data-do="lab">🧪 تجربة</button>
      </div>
      <textarea class="body" data-f="body" dir="${pl && pl.s.dir === 'ltr' ? 'ltr' : 'rtl'}" placeholder="اكتب نص الدرس هنا…&#10;&#10;## عنوان قسم&#10;فقرة فيها [[كلمة مرتبطة|درس:معرّف_الدرس]]">${esc(L.body || '')}</textarea></div>
    <label class="chk"><input type="checkbox" data-feat${D.site.featured === L.id ? ' checked' : ''}> درس مميز في الصفحة الرئيسية</label>`;
  $$('[data-f]', el).forEach(i => i.oninput = () => {
    const f = i.dataset.f;
    if (f === 'keywords') L.keywords = i.value.split(/[،,]/).map(x => x.trim()).filter(Boolean);
    else if (f === 'faq') L.faq = i.value.split('\n').map(x => x.trim()).filter(Boolean);
    else if (f === 'minutes') L.minutes = +i.value || undefined;
    else L[f] = i.value;
    L.updated = today();
    if (f === 'title') { $('h2', el).textContent = L.title; changed({ tree: true }); } else changed();
  });
  $('[data-feat]', el).onchange = e => { D.site.featured = e.target.checked ? L.id : ''; changed(); };
  $$('[data-do]', el).forEach(b => b.onclick = e => { e.preventDefault(); tool(b.dataset.do, L); });
}

/* ---------- body tools ---------- */
function bodyTA() { return $('textarea.body', root); }
function replaceSel(ta, text, selectInside) {
  const s = ta.selectionStart, e = ta.selectionEnd;
  ta.setRangeText(text, s, e, selectInside ? 'select' : 'end');
  ta.focus(); ta.dispatchEvent(new Event('input'));
}
function insertBlock(ta, block) {
  const v = ta.value, s = ta.selectionStart;
  const before = v.slice(0, s), pre = before && !before.endsWith('\n\n') ? (before.endsWith('\n') ? '\n' : '\n\n') : '';
  ta.setRangeText(pre + block + '\n\n', s, ta.selectionEnd, 'end');
  ta.focus(); ta.dispatchEvent(new Event('input'));
}
function linePrefix(ta, prefix) {
  const v = ta.value, s = ta.selectionStart, ls = v.lastIndexOf('\n', s - 1) + 1;
  const line = v.slice(ls, v.indexOf('\n', s) === -1 ? v.length : v.indexOf('\n', s));
  const clean = line.replace(/^(#{2,3}\s+|[-•]\s+)/, '');
  ta.setRangeText(prefix + clean, ls, ls + line.length, 'end');
  ta.focus(); ta.dispatchEvent(new Event('input'));
}
async function tool(t, L) {
  const ta = bodyTA();
  if (t === 'h2') return linePrefix(ta, '## ');
  if (t === 'h3') return linePrefix(ta, '### ');
  if (t === 'list') return linePrefix(ta, '- ');
  if (t === 'bold') { const x = ta.value.slice(ta.selectionStart, ta.selectionEnd) || 'نص غامق'; return replaceSel(ta, `**${x}**`); }
  if (t === 'link') return linkDialog(ta, L);
  if (t === 'img') {
    const f = await pickFile('image/*'); if (!f) return;
    const { base, ext } = slugFile(f.name); const path = `images/${base}-${Date.now().toString(36).slice(-5)}${ext || '.png'}`;
    await storeFile(path, f);
    const cap = await askText('وصف الصورة', '', 'يظهر تحت الصورة (اختياري)');
    insertBlock(ta, `![${cap || ''}](${path})`); toast('أُضيفت الصورة');
    return;
  }
  if (t === 'lab') return labDialog(ta);
  if (t === 'cover') {
    const f = await pickFile('image/*'); if (!f) return;
    const { base, ext } = slugFile(f.name); const path = `images/cover-${base}-${Date.now().toString(36).slice(-5)}${ext || '.png'}`;
    await storeFile(path, f); L.cover = path; L.updated = today(); changed(); drawForm(); return;
  }
  if (t === 'nocover') { delete L.cover; changed(); drawForm(); }
}

function linkDialog(ta, L) {
  const word = ta.value.slice(ta.selectionStart, ta.selectionEnd).trim();
  const s0 = ta.selectionStart, e0 = ta.selectionEnd;
  const all = [];
  D.subjects.forEach(s => s.topics.forEach(t => t.branches.forEach(b => b.lessons.forEach(id => { const l = findLesson(id); if (l && id !== L.id) all.push({ l, s }); }))));
  let kind = 'lesson', target = '';
  dialog('ربط كلمة', `
    <div class="fld"><label>الكلمة في النص</label><input type="text" data-word value="${esc(word)}" placeholder="مثلًا: ATP"></div>
    <div class="dtabs"><button data-k="lesson" class="on">درس في الموقع</button><button data-k="video">فيديو</button><button data-k="url">مقالة أو رابط</button><button data-k="lab">تجربة</button></div>
    <div data-pane="lesson"><input type="text" data-q placeholder="ابحث عن درس…" style="width:100%;border:1px solid #E1E2EC;border-radius:12px;padding:9px 12px"><div class="pick"></div></div>
    <div data-pane="video" class="hide"><div class="fld"><label>رابط الفيديو <small>يوتيوب أو Vimeo أو ملف mp4</small></label><input type="url" dir="ltr" data-u="video" placeholder="https://www.youtube.com/watch?v=…"></div></div>
    <div data-pane="url" class="hide"><div class="fld"><label>رابط المقالة</label><input type="url" dir="ltr" data-u="url" placeholder="https://…"></div></div>
    <div data-pane="lab" class="hide"><div class="pick" data-labs></div><p class="hint" style="margin-top:8px;color:var(--muted);font-size:12.5px">لإضافة تجربة جديدة استخدم زر «🧪 تجربة» في شريط الأدوات.</p></div>
    <div class="dlg-f"><button class="sbtn" data-x>إلغاء</button><button class="sbtn o" data-ok>ربط</button></div>`, (m, close) => {
    const pick = $('[data-pane=lesson] .pick', m);
    const drawPick = q => {
      const nq = T.norm(q);
      pick.innerHTML = all.filter(x => !nq || T.norm(x.l.title).includes(nq) || T.norm(x.s.name).includes(nq)).slice(0, 80)
        .map(x => `<button data-id="${esc(x.l.id)}" class="${target === 'درس:' + x.l.id ? 'on' : ''}"><span class="dot" style="--c:${esc(x.s.color)}"></span>${esc(x.l.title)}<small>${esc(x.s.name)}${T.hasBody(x.l) ? '' : ' · فارغ'}</small></button>`).join('') || '<p style="padding:12px;color:var(--muted)">لا نتائج</p>';
    };
    drawPick('');
    $('[data-q]', m).oninput = e => drawPick(e.target.value);
    pick.onclick = e => { const b = e.target.closest('[data-id]'); if (!b) return; target = 'درس:' + b.dataset.id; $$('button', pick).forEach(x => x.classList.toggle('on', x === b)); };
    const lp = $('[data-labs]', m);
    lp.innerHTML = D.labs.map(x => `<button data-lab="${esc(x.id)}">🧪 ${esc(x.title)}</button>`).join('') || '<p style="padding:12px;color:var(--muted)">لا تجارب بعد</p>';
    lp.onclick = e => { const b = e.target.closest('[data-lab]'); if (!b) return; target = 'تجربة:' + b.dataset.lab; $$('button', lp).forEach(x => x.classList.toggle('on', x === b)); };
    $$('.dtabs button', m).forEach(b => b.onclick = () => { kind = b.dataset.k; target = ''; $$('.dtabs button', m).forEach(x => x.classList.toggle('on', x === b)); $$('[data-pane]', m).forEach(p => p.classList.toggle('hide', p.dataset.pane !== kind)); });
    $('[data-x]', m).onclick = close;
    $('[data-ok]', m).onclick = () => {
      const w = $('[data-word]', m).value.trim().replace(/[\[\]|]/g, '');
      if (kind === 'video' || kind === 'url') target = $(`[data-u=${kind}]`, m).value.trim();
      if (!w) { toast('اكتب الكلمة أولًا'); return; }
      if (!target) { toast(kind === 'lesson' ? 'اختر درسًا' : kind === 'lab' ? 'اختر تجربة' : 'ضع الرابط'); return; }
      close();
      ta.setSelectionRange(s0, e0);
      replaceSel(ta, `[[${w}|${target}]]`);
      toast('رُبطت الكلمة');
    };
  });
}

function labDialog(ta) {
  dialog('إدراج تجربة', `
    <div class="dtabs"><button data-k="new" class="on">رفع تجربة جديدة</button>${D.labs.length ? '<button data-k="old">تجربة موجودة</button>' : ''}</div>
    <div data-pane="new">
      <div class="fld"><label>عنوان التجربة</label><input type="text" data-t placeholder="مثلًا: محاكاة قياس معدل التنفس"></div>
      <div class="row2"><div class="fld"><label>نسبة العرض</label><select data-r><option value="16/9">16:9 عريضة</option><option value="16/10">16:10</option><option value="4/3">4:3</option><option value="1/1">مربعة</option></select></div>
      <div class="fld"><label>الملف <small>.html أو .zip</small></label><button class="sbtn" data-file style="width:100%;padding:10px">اختر ملفًا…</button></div></div>
      <p style="font-size:12.5px;color:var(--muted);line-height:1.8">ملف <b>.html</b> واحد يعمل مباشرة في المعاينة. تجارب Storyline وما شابهها ارفعها مضغوطة <b>.zip</b> كما صُدِّرت (فيها story.html ومجلداتها)، وتعمل بعد النشر.</p>
    </div>
    <div data-pane="old" class="hide"><div class="pick">${D.labs.map(x => `<button data-lab="${esc(x.id)}">🧪 ${esc(x.title)}</button>`).join('')}</div></div>
    <div class="dlg-f"><button class="sbtn" data-x>إلغاء</button><button class="sbtn o" data-ok>إدراج</button></div>`, (m, close) => {
    let kind = 'new', file = null, old = '';
    $$('.dtabs button', m).forEach(b => b.onclick = () => { kind = b.dataset.k; $$('.dtabs button', m).forEach(x => x.classList.toggle('on', x === b)); $$('[data-pane]', m).forEach(p => p.classList.toggle('hide', p.dataset.pane !== kind)); });
    $('[data-file]', m).onclick = async e => { e.preventDefault(); file = await pickFile('.html,.htm,.zip'); if (file) { e.target.textContent = file.name; if (!$('[data-t]', m).value) $('[data-t]', m).value = file.name.replace(/\.(html?|zip)$/i, ''); } };
    const op = $('[data-pane=old] .pick', m);
    if (op) op.onclick = e => { const b = e.target.closest('[data-lab]'); if (!b) return; old = b.dataset.lab; $$('button', op).forEach(x => x.classList.toggle('on', x === b)); };
    $('[data-x]', m).onclick = close;
    $('[data-ok]', m).onclick = async () => {
      if (kind === 'old') { if (!old) { toast('اختر تجربة'); return; } close(); insertBlock(ta, `::lab[${old}]`); return; }
      if (!file) { toast('اختر ملف التجربة'); return; }
      const title = $('[data-t]', m).value.trim() || 'تجربة تفاعلية', ratio = $('[data-r]', m).value;
      const id = slugFile(file.name).base.replace(/^file$/, 'lab') + '-' + Date.now().toString(36).slice(-4);
      $('[data-ok]', m).textContent = 'جارٍ الرفع…';
      try {
        let src, packaged = false;
        if (/\.zip$/i.test(file.name)) {
          const JSZip = await loadJSZip();
          const zip = await JSZip.loadAsync(file);
          const names = Object.keys(zip.files).filter(n => !zip.files[n].dir && !/(^|\/)(__MACOSX|\.DS_Store)/.test(n));
          const tops = new Set(names.map(n => n.split('/')[0]));
          const strip = tops.size === 1 && names.every(n => n.includes('/')) ? [...tops][0] + '/' : '';
          for (const n of names) await storeFile(`labs/${id}/${n.slice(strip.length)}`, await zip.files[n].async('blob'));
          const rel = names.map(n => n.slice(strip.length));
          const entry = ['index.html', 'story.html'].find(x => rel.includes(x)) || rel.filter(n => /\.html?$/i.test(n)).sort((a, b) => a.split('/').length - b.split('/').length)[0];
          if (!entry) throw new Error('لا يوجد ملف html داخل الملف المضغوط.');
          src = `labs/${id}/${entry}`; packaged = true;
        } else {
          src = `labs/${id}/index.html`;
          await storeFile(src, new Blob([await file.arrayBuffer()], { type: 'text/html' }));
        }
        D.labs.push(Object.assign({ id, title, src, ratio }, packaged ? { packaged: true } : {}));
        close(); insertBlock(ta, `::lab[${id}]`); toast('أُضيفت التجربة');
      } catch (err) { $('[data-ok]', m).textContent = 'إدراج'; toast(err.message || 'تعذّر رفع التجربة'); }
    };
  });
}

function showHelp() {
  dialog('طريقة كتابة الدرس', `<div class="help">
    <p><code>## عنوان</code> عنوان قسم (يظهر في «في هذا الدرس»)، و<code>### عنوان</code> عنوان فرعي.</p>
    <p><code>**نص**</code> نص غامق. السطر الذي يبدأ بـ <code>- </code> عنصر في قائمة. سطر فارغ يبدأ فقرة جديدة.</p>
    <p><code>[[ATP|درس:chem-energy]]</code> كلمة تفتح درسًا من الموقع. إن كان من مادة أخرى تظهر بلون تلك المادة وتُضاف إلى «مرتبط بمواد أخرى».</p>
    <p><code>[[فيديو|https://youtube.com/…]]</code> كلمة تفتح فيديو في نافذة. و<code>[[مقالة|https://…]]</code> رابط خارجي.</p>
    <p><code>![وصف](images/صورة.png)</code> صورة في سطر مستقل. و<code>::lab[المعرّف]</code> تجربة داخل النص.</p>
    <p>كل كلمة مرتبطة تُضاف تلقائيًا إلى <b>فهرس المصطلحات</b>.</p>
    <p style="margin-top:10px;color:var(--muted)">الأسهل: حدّد كلمة واضغط «🔗 ربط كلمة».</p></div>
    <div class="dlg-f"><button class="sbtn o" data-x>فهمت</button></div>`, (m, close) => { $('[data-x]', m).onclick = close; });
}

/* ---------- preview ---------- */
function drawPreview() {
  const el = $('.ed-prev', root);
  if (!sel || sel.type !== 'lesson') { el.innerHTML = `<div class="ed-empty"><div><b style="color:var(--navy)">المعاينة</b><p>اختر درسًا لترى شكله كما سيراه الطالب.</p></div></div>`; return; }
  const L = findLesson(sel.id); if (!L) return;
  const sc = el.scrollTop;
  const v = T.lessonView(L);
  el.innerHTML = `<div class="pvh"><span>معاينة مباشرة</span><span>تُحفظ تلقائيًا</span></div>${v.main}`;
  const art = $('.lesson', el);
  T.wireKw(art, { subjectId: v.s.id });
  T.wireLabs(art);
  el.scrollTop = sc;
}

/* ---------- export / reset ---------- */
async function doExport() {
  const btn = $('[data-act=export]', root); const old = btn.textContent;
  btn.textContent = 'جارٍ التجهيز…';
  try {
    const JSZip = await loadJSZip();
    const zip = new JSZip();
    zip.file('content.js', '/* محتوى موقع «تكامل» — يُعدَّل من المحرّر (#editor) ثم «تصدير». */\nwindow.TAKAMUL = ' + JSON.stringify(D, null, 1) + ';\n');
    const files = await T.idbAll();
    Object.entries(files).forEach(([p, v]) => { if (v && v.blob) zip.file(p, v.blob); });
    zip.file('اقرأني.txt', 'تحديث موقع «تكامل»\n\n1) فكّ هذا الملف داخل مجلد الموقع (حيث index.html).\n2) وافق على استبدال content.js.\n3) ارفع التغييرات إلى المستودع، فيتحدث الموقع خلال دقيقة.\n\nعدد الدروس: ' + D.lessons.length + '\nالملفات الجديدة: ' + Object.keys(files).length + '\n');
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `takamul-update-${today()}.zip`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('نزل ملف التصدير');
  } catch (e) { toast(e.message || 'تعذّر التصدير'); }
  btn.textContent = old;
}
async function doReset() {
  if (!confirm('إعادة الموقع كما هو منشور؟ ستُحذف كل تعديلاتك وملفاتك المرفوعة في هذا المتصفح.')) return;
  T.clearDraft(); await T.idbClear();
  D = T.published(); T.useData(D); sel = null;
  select('lesson', D.site.featured && findLesson(D.site.featured) ? D.site.featured : D.lessons[0].id);
  drawTree(); setStatus('عادت النسخة المنشورة'); T.Chat.reset();
}

/* ---------- open / close ---------- */
window.TEditor = {
  isOpen: () => open,
  async open(isDemo) {
    if (!root) { build(); $('.ed-tree', root).addEventListener('click', treeClick); }
    demo = !!isDemo;
    const d = T.readDraft();
    D = d ? JSON.parse(JSON.stringify(d.data)) : T.published();
    D.labs = D.labs || []; D.site = D.site || {}; D.aliases = D.aliases || {};
    T.useData(D);
    await T.loadFiles();
    $('.ed-demo', root).classList.toggle('hide', !demo);
    root.classList.remove('hide'); open = true;
    document.body.style.overflow = 'hidden';
    document.title = (demo ? 'جرّب المحرّر' : 'المحرّر') + ' — تكامل';
    setStatus(d ? 'مسودة محفوظة في هذا المتصفح' : 'النسخة المنشورة');
    if (!sel || (sel.type === 'lesson' && !findLesson(sel.id))) {
      const first = D.site.featured && findLesson(D.site.featured) ? D.site.featured : (D.lessons[0] || {}).id;
      if (first) select('lesson', first); else { sel = null; drawForm(); drawPreview(); }
    } else { drawForm(); drawPreview(); }
    drawTree();
    if (T.Chat) T.Chat.close();
  },
  close() { if (!root) return; root.classList.add('hide'); open = false; document.body.style.overflow = ''; },
};
})();

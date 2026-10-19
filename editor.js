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
.ed-prev figure.media{cursor:pointer;outline:2px dashed transparent;outline-offset:3px;transition:outline-color .15s}
.ed-prev figure.media:hover{outline-color:var(--orange)}
.mprev{background:var(--bg);border-radius:14px;padding:12px;margin:4px 0 6px;overflow:hidden}
.mprev:after{content:"";display:block;clear:both}
.mprev i{display:block;height:7px;border-radius:4px;background:#dcdde8;margin:0 0 7px}
.mp-fig{background:linear-gradient(135deg,#FFE1BC,#D7F3FF);border-radius:8px;height:64px;display:grid;place-items:center;color:var(--navy);transition:.2s}
.dtabs [data-p].on,.dtabs [data-a].on{background:var(--navy);color:#fff;border-color:var(--navy)}
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
      <button class="btn btn-g" data-act="export" title="تنزيل المحتوى والملفات في ملف zip">⤓ zip</button>
      <button class="btn btn-o" data-act="publish">☁ نشر للجميع</button>
    </div>
    <div class="ed-demo hide"><span>🧪 <b>وضع تجريبي:</b> جرّب إضافة درس أو ربط كلمة. تعديلاتك تظهر في متصفحك فقط ولن يراها غيرك.</span><button data-act="reset">إعادة الضبط</button></div>
    <div class="ed-body"><div class="ed-col ed-tree"></div><div class="ed-col ed-form"></div><div class="ed-col ed-prev"></div></div>`;
  document.body.appendChild(root);
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const a = b.dataset.act;
    if (a === 'export') { e.preventDefault(); doExport(); }
    else if (a === 'publish') { e.preventDefault(); publishDialog(); }
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
        <span class="sep"></span><button class="hl" data-do="link">🔗 ربط كلمة</button><button data-do="img">🖼 صورة</button><button data-do="video">🎬 فيديو</button><button data-do="lab">🧪 تجربة</button>
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
  if (t === 'img') return mediaDialog(ta, 'image');
  if (t === 'video') return mediaDialog(ta, 'video');
  if (t === 'lab') return labDialog(ta);
  if (t === 'cover') {
    const f = await pickFile('image/*'); if (!f) return;
    const { base, ext } = slugFile(f.name); const path = `images/cover-${base}-${Date.now().toString(36).slice(-5)}${ext || '.png'}`;
    await storeFile(path, f); L.cover = path; L.updated = today(); changed(); drawForm(); return;
  }
  if (t === 'nocover') { delete L.cover; changed(); drawForm(); }
}


/* ---------- images & videos: size and position ---------- */
const MAX_VIDEO_MB = 95;
function mediaPath(file, folder) {
  const { base, ext } = slugFile(file.name);
  return `${folder}/${base}-${Date.now().toString(36).slice(-5)}${ext || (folder === 'videos' ? '.mp4' : '.png')}`;
}
function findMediaLine(ta, src) {
  const lines = ta.value.split('\n');
  return lines.findIndex(l => { const p = T.parseMedia(l); return p && p.src === src; });
}
function setLine(ta, idx, text) {
  const lines = ta.value.split('\n');
  if (text === null) { lines.splice(idx, 1); if (lines[idx] === '' && lines[idx - 1] === '') lines.splice(idx, 1); } else lines[idx] = text;
  ta.value = lines.join('\n'); ta.dispatchEvent(new Event('input'));
}
function mediaDialog(ta, kind, existing) {
  const o = existing ? Object.assign({}, existing.o) : { cap: '', src: '', size: kind === 'video' ? 100 : 60, align: 'c' };
  const isVid = existing ? existing.o.kind !== 'image' : kind === 'video';
  const noun = isVid ? 'الفيديو' : 'الصورة';
  let file = null, tab = 'file';
  dialog(existing ? `إعدادات ${noun}` : (isVid ? 'إدراج فيديو' : 'إدراج صورة'), `
    ${!existing && isVid ? '<div class="dtabs" data-tabs><button data-k="file" class="on">رفع ملف فيديو</button><button data-k="url">رابط يوتيوب أو Vimeo</button></div>' : ''}
    ${existing ? '' : `<div data-pane="file"><div class="fld"><label>${isVid ? `ملف الفيديو <small>mp4 أو webm، حتى ${MAX_VIDEO_MB} ميغابايت</small>` : 'الصورة'}</label><button class="sbtn" data-file style="width:100%;padding:10px">اختر ملفًا…</button></div></div>
    <div data-pane="url" class="hide"><div class="fld"><label>الرابط</label><input type="url" dir="ltr" data-url placeholder="https://www.youtube.com/watch?v=…"></div></div>`}
    <div class="fld"><label>الوصف <small>يظهر تحت ${noun} (اختياري)</small></label><input type="text" data-cap value="${esc(o.cap)}"></div>
    <div class="fld"><label>الحجم <small>نسبة من عرض الدرس</small> · <b data-sv style="color:var(--orange)">${o.size}%</b></label>
      <input type="range" min="20" max="100" step="5" value="${o.size}" data-size style="width:100%;accent-color:#F48C06">
      <div class="dtabs" style="margin:6px 0 0" data-presets><button data-p="33">صغير</button><button data-p="50">متوسط</button><button data-p="75">كبير</button><button data-p="100">كامل العرض</button></div></div>
    <div class="fld"><label>الموضع</label><div class="dtabs" style="margin:0" data-align><button data-a="r">يمين، والنص حولها</button><button data-a="c">في الوسط</button><button data-a="l">يسار، والنص حولها</button></div></div>
    <div class="mprev"><div class="mp-fig"><span>${isVid ? '▶' : '🖼'}</span></div><i></i><i></i><i></i><i></i><i></i><i></i><i style="width:60%"></i></div>
    <div class="dlg-f">${existing ? '<button class="sbtn d" data-del style="margin-inline-end:auto">حذف من الدرس</button>' : ''}<button class="sbtn" data-x>إلغاء</button><button class="sbtn o" data-ok>${existing ? 'حفظ' : 'إدراج'}</button></div>`, (m, close) => {
    const fig = $('.mp-fig', m);
    const sync = () => {
      $('[data-sv]', m).textContent = o.size + '%';
      $('[data-size]', m).value = o.size;
      $$('[data-presets] button', m).forEach(b => b.classList.toggle('on', +b.dataset.p === o.size));
      $$('[data-align] button', m).forEach(b => b.classList.toggle('on', b.dataset.a === o.align));
      fig.style.width = o.size + '%';
      fig.style.float = o.align === 'r' ? 'right' : o.align === 'l' ? 'left' : 'none';
      fig.style.margin = o.align === 'c' ? '0 auto 8px' : o.align === 'r' ? '0 0 6px 10px' : '0 10px 6px 0';
    };
    sync();
    $('[data-size]', m).oninput = e => { o.size = +e.target.value; sync(); };
    $$('[data-presets] button', m).forEach(b => b.onclick = () => { o.size = +b.dataset.p; if (o.size === 100) o.align = 'c'; sync(); });
    $$('[data-align] button', m).forEach(b => b.onclick = () => { o.align = b.dataset.a; if (o.align !== 'c' && o.size > 60) o.size = 45; sync(); });
    $$('[data-tabs] button', m).forEach(b => b.onclick = () => { tab = b.dataset.k; $$('[data-tabs] button', m).forEach(x => x.classList.toggle('on', x === b)); $$('[data-pane]', m).forEach(p => p.classList.toggle('hide', p.dataset.pane !== tab)); });
    const fb = $('[data-file]', m);
    if (fb) fb.onclick = async e => {
      e.preventDefault();
      const f = await pickFile(isVid ? 'video/mp4,video/webm,video/*' : 'image/*'); if (!f) return;
      if (isVid && f.size > MAX_VIDEO_MB * 1048576) { toast(`الملف أكبر من ${MAX_VIDEO_MB} ميغابايت. ارفعه على يوتيوب وضع رابطه.`); return; }
      file = f; fb.textContent = `${f.name} · ${f.size < 1048576 ? Math.max(1, Math.round(f.size / 1024)) + ' كيلوبايت' : (f.size / 1048576).toFixed(1) + ' ميغابايت'}`;
    };
    $('[data-x]', m).onclick = close;
    const del = $('[data-del]', m);
    if (del) del.onclick = () => { const i = findMediaLine(ta, existing.o.src); if (i >= 0) setLine(ta, i, null); close(); toast(`حُذف ${noun}`); };
    $('[data-ok]', m).onclick = async () => {
      o.cap = $('[data-cap]', m).value.trim();
      if (!existing) {
        if (tab === 'url') {
          const u = $('[data-url]', m).value.trim();
          const p = T.parseTarget(u);
          if (!u || p.kind !== 'video') { toast('ضع رابط فيديو من يوتيوب أو Vimeo أو ملف mp4'); return; }
          o.src = u;
        } else {
          if (!file) { toast('اختر ملفًا أولًا'); return; }
          $('[data-ok]', m).textContent = 'جارٍ الحفظ…';
          o.src = mediaPath(file, isVid ? 'videos' : 'images');
          await storeFile(o.src, file);
        }
        close(); insertBlock(ta, T.mediaLine(o)); toast(isVid ? 'أُضيف الفيديو' : 'أُضيفت الصورة'); return;
      }
      const i = findMediaLine(ta, existing.o.src);
      if (i >= 0) setLine(ta, i, T.mediaLine(o));
      close(); toast('حُفظت التغييرات');
    };
  });
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
    <div data-pane="video" class="hide"><div class="fld"><label>رابط الفيديو <small>يوتيوب أو Vimeo أو ملف mp4</small></label><input type="url" dir="ltr" data-u="video" placeholder="https://www.youtube.com/watch?v=…"></div><button class="sbtn" data-upvid>أو ارفع ملف فيديو (mp4)</button></div>
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
    $('[data-upvid]', m).onclick = async e => {
      e.preventDefault();
      const f = await pickFile('video/mp4,video/webm,video/*'); if (!f) return;
      if (f.size > MAX_VIDEO_MB * 1048576) { toast(`الملف أكبر من ${MAX_VIDEO_MB} ميغابايت. ارفعه على يوتيوب وضع رابطه.`); return; }
      const path = mediaPath(f, 'videos'); await storeFile(path, f);
      $('[data-u=video]', m).value = path; e.target.textContent = '✓ ' + f.name;
    };
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
    <p><code>![وصف](images/صورة.png)</code> صورة في سطر مستقل، و<code>![وصف](images/صورة.png){50% يمين}</code> بنصف العرض على اليمين والنص حولها. الموضع: يمين أو يسار أو وسط.</p>
    <p><code>![وصف](videos/فيديو.mp4)</code> فيديو مرفوع، أو رابط يوتيوب مكان المسار، ويقبل الحجم والموضع نفسيهما.</p>
    <p><code>::lab[المعرّف]</code> تجربة داخل النص.</p>
    <p>اضغط على أي صورة أو فيديو في المعاينة لتغيير حجمه أو موضعه.</p>
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
  $$('figure.media', art).forEach(fg => {
    fg.title = 'اضغط لتغيير الحجم والموضع';
    fg.addEventListener('click', e => {
      if (e.target.closest('video,iframe')) return;
      const ta = bodyTA(); if (!ta) return;
      const i = findMediaLine(ta, fg.dataset.src); if (i < 0) return;
      mediaDialog(ta, 'image', { o: T.parseMedia(ta.value.split('\n')[i]) });
    });
  });
  el.scrollTop = sc;
}

/* ---------- export / reset ---------- */
async function doExport() {
  const btn = $('[data-act=export]', root); const old = btn.textContent;
  btn.textContent = 'جارٍ التجهيز…';
  try {
    const JSZip = await loadJSZip();
    const zip = new JSZip();
    zip.file('content.js', contentJs(D));
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
  try { localStorage.removeItem(BASE_KEY); localStorage.removeItem(PUSHED_KEY); } catch (e) {}
  D = T.published(); T.useData(D); sel = null;
  select('lesson', D.site.featured && findLesson(D.site.featured) ? D.site.featured : D.lessons[0].id);
  drawTree(); setStatus('عادت النسخة المنشورة'); T.Chat.reset();
}


/* ---------- several editors: three-way merge + publishing to GitHub ---------- */
const BASE_KEY = 'takamul.base.v1', PUSHED_KEY = 'takamul.pushed.v1', GH_KEY = 'takamul.gh.v1';
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const clone = o => o === undefined ? undefined : JSON.parse(JSON.stringify(o));
const lsGet = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
const readBase = () => lsGet(BASE_KEY), writeBase = b => lsSet(BASE_KEY, b);
T._merge3 = (b, m, r) => { const c = []; return { out: merge3(b, m, r, c, ''), conf: c }; };
function contentJs(d) { return '/* محتوى موقع «تكامل» — يُعدَّل من المحرّر (#editor). */\nwindow.TAKAMUL = ' + JSON.stringify(d, null, 1) + ';\n'; }
function parseContentJs(txt) { const i = txt.indexOf('{'), j = txt.lastIndexOf('}'); return JSON.parse(txt.slice(i, j + 1)); }

/* base = what this editor started from, m = mine, r = what is published now.
   Keeps both sides' changes; when both changed the same field, mine wins and the path is reported. */
const isObj = x => x && typeof x === 'object' && !Array.isArray(x);
const byId = a => Array.isArray(a) && a.length > 0 && a.every(x => isObj(x) && 'id' in x);
function merge3(b, m, r, conf, path) {
  if (same(m, b)) return clone(r);
  if (same(r, b)) return clone(m);
  if (same(m, r)) return clone(m);
  if (m === undefined || r === undefined) { if (m === undefined) { conf.push(path + '#deleted'); return undefined; } conf.push(path); return clone(m); }
  if (Array.isArray(m) && Array.isArray(r)) {
    if (byId(m) || byId(r) || byId(b)) return mergeById(b || [], m, r, conf, path);
    if ([...m, ...r].every(x => typeof x === 'string')) {
      const base = b || [];
      const out = r.filter(x => !(base.includes(x) && !m.includes(x)));
      m.forEach(x => { if (!base.includes(x) && !out.includes(x)) out.push(x); });
      return out;
    }
    conf.push(path); return clone(m);
  }
  if (isObj(m) && isObj(r)) {
    const out = {}, bb = isObj(b) ? b : {};
    new Set([...Object.keys(m), ...Object.keys(r)]).forEach(k => { const v = merge3(bb[k], m[k], r[k], conf, path + '.' + k); if (v !== undefined) out[k] = v; });
    return out;
  }
  conf.push(path); return clone(m);
}
function mergeById(b, m, r, conf, path) {
  const ids = a => a.map(x => x.id), map = a => Object.fromEntries(a.map(x => [x.id, x]));
  const B = map(b), M = map(m), R = map(r);
  let order = same(ids(m), ids(b)) ? ids(r) : ids(m);
  ids(r).forEach(id => { if (!(id in B) && !order.includes(id)) order.push(id); });
  const out = [];
  order.forEach(id => {
    const p = `${path}[${id}]`;
    if (id in B && !(id in M)) { if (id in R && !same(R[id], B[id])) conf.push(p + '#deleted'); return; }
    if (id in B && !(id in R)) { if (id in M && !same(M[id], B[id])) { conf.push(p); out.push(clone(M[id])); } return; }
    const v = merge3(B[id], M[id], R[id], conf, p);
    if (v !== undefined) out.push(v);
  });
  return out;
}
function conflictNames(conf, d) {
  const names = new Set();
  conf.forEach(p => {
    const m = p.match(/\.lessons\[([^\]]+)\]/) || p.match(/\[([^\]]+)\]/);
    const l = m && (d.lessons || []).find(x => x.id === m[1]);
    names.add(l ? `«${l.title}»` : 'هيكل المواد');
  });
  return [...names];
}
function changeSummary(base, d) {
  const B = Object.fromEntries((base.lessons || []).map(l => [l.id, l]));
  const ch = d.lessons.filter(l => !same(l, B[l.id])).map(l => l.title);
  const del = (base.lessons || []).filter(l => !d.lessons.some(x => x.id === l.id)).length;
  const tree = !same(base.subjects, d.subjects) || !same(base.labs, d.labs) || !same(base.site, d.site);
  return { ch, del, tree, any: ch.length || del || tree };
}

/* GitHub */
function ghCfg() { return lsGet(GH_KEY); }
function defaultRepo() {
  if (D.site && D.site.repo) return D.site.repo;
  const h = location.hostname;
  if (h.endsWith('.github.io')) { const seg = location.pathname.split('/').filter(Boolean)[0]; return h.split('.')[0] + '/' + (seg || h); }
  return '';
}
function ghErr(st) {
  return st === 401 ? 'رمز الدخول غير صحيح أو انتهت صلاحيته.'
    : st === 403 ? 'رمز الدخول لا يملك صلاحية الكتابة على المستودع. تأكد أنك مدعو للمستودع وأن الرمز فيه صلاحية public_repo.'
    : st === 404 ? 'المستودع غير موجود، أو حسابك ليس مدعوًا إليه.'
    : st === 409 ? 'المستودع فارغ.'
    : st === 422 ? 'نشر محرر آخر في اللحظة نفسها. أعد المحاولة.'
    : 'تعذّر الاتصال بـ GitHub (' + st + ').';
}
async function gh(cfg, path, opts = {}) {
  let res;
  try {
    res = await fetch('https://api.github.com' + path, {
      method: opts.method || 'GET', body: opts.body, cache: 'no-store',
      headers: Object.assign({ Authorization: 'Bearer ' + cfg.token, Accept: opts.accept || 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }, opts.body ? { 'Content-Type': 'application/json' } : {}),
    });
  } catch (e) { throw new Error('تعذّر الاتصال بـ GitHub. تحقق من الإنترنت.'); }
  if (!res.ok) { const e = new Error(ghErr(res.status)); e.status = res.status; throw e; }
  return opts.raw ? res.text() : res.json();
}
function blobB64(blob) { return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1] || ''); fr.onerror = () => rej(fr.error); fr.readAsDataURL(blob); }); }

async function publishNow(cfg, step, askConflicts) {
  const R = cfg.repo, BR = cfg.branch || 'main';
  for (let attempt = 0; attempt < 3; attempt++) {
    step('قراءة آخر نسخة منشورة…');
    const head = (await gh(cfg, `/repos/${R}/git/ref/heads/${encodeURIComponent(BR)}`)).object.sha;
    const commit = await gh(cfg, `/repos/${R}/git/commits/${head}`);
    let remote = null;
    try { remote = parseContentJs(await gh(cfg, `/repos/${R}/contents/content.js?ref=${head}`, { accept: 'application/vnd.github.raw+json', raw: true })); }
    catch (e) { if (e.status !== 404) throw e; }
    const base = readBase() || T.published();
    const conf = [];
    const merged = remote ? merge3(base, D, remote, conf, '') : clone(D);
    if (conf.length && attempt === 0 && !(await askConflicts(conflictNames(conf, merged)))) return null;
    const files = await T.idbAll(), pushed = lsGet(PUSHED_KEY) || {};
    const todo = Object.entries(files).filter(([p, v]) => v && v.blob && pushed[p] !== v.at);
    const tree = [];
    for (let i = 0; i < todo.length; i++) {
      const [p, v] = todo[i];
      step(`رفع الملفات ${i + 1} من ${todo.length}…`);
      const bl = await gh(cfg, `/repos/${R}/git/blobs`, { method: 'POST', body: JSON.stringify({ content: await blobB64(v.blob), encoding: 'base64' }) });
      tree.push({ path: p, mode: '100644', type: 'blob', sha: bl.sha });
    }
    const sum = changeSummary(base, D);
    tree.push({ path: 'content.js', mode: '100644', type: 'blob', content: contentJs(merged) });
    step('حفظ التعديلات…');
    const t = await gh(cfg, `/repos/${R}/git/trees`, { method: 'POST', body: JSON.stringify({ base_tree: commit.tree.sha, tree }) });
    const what = sum.ch.length ? sum.ch.slice(0, 3).join('، ') + (sum.ch.length > 3 ? ` و${sum.ch.length - 3} أخرى` : '') : 'هيكل المواد';
    const c = await gh(cfg, `/repos/${R}/git/commits`, { method: 'POST', body: JSON.stringify({ message: `تحديث المحتوى: ${what}${cfg.login ? ' — ' + cfg.login : ''}`, tree: t.sha, parents: [head] }) });
    step('النشر…');
    try { await gh(cfg, `/repos/${R}/git/refs/heads/${encodeURIComponent(BR)}`, { method: 'PATCH', body: JSON.stringify({ sha: c.sha }) }); }
    catch (e) { if (e.status === 422 && attempt < 2) continue; throw e; }
    todo.forEach(([p, v]) => { pushed[p] = v.at; });
    lsSet(PUSHED_KEY, pushed);
    D = merged; T.useData(D); writeBase(merged);
    T.saveDraft(D, { publishedAt: Date.now() + 1 });
    return { sha: c.sha, url: `https://github.com/${R}/commit/${c.sha}`, conflicts: conf.length };
  }
}

function connectHtml(cfg) {
  const repo = (cfg && cfg.repo) || defaultRepo();
  return `<p style="font-size:13.5px;line-height:1.9;margin-bottom:12px">ليظهر تعديلك لكل الزوار، اربط المحرّر بحسابك على GitHub مرة واحدة:</p>
    <ol style="font-size:13px;line-height:2;padding-inline-start:20px;margin-bottom:14px;color:#4a4a66">
      <li>يجب أن يكون حسابك مدعوًا للمستودع (صاحب المستودع يدعوك من <b>Settings ← Collaborators</b>).</li>
      <li>افتح <a href="https://github.com/settings/tokens/new?scopes=public_repo&description=%D9%85%D8%AD%D8%B1%D8%B1%20%D8%AA%D9%83%D8%A7%D9%85%D9%84" target="_blank" rel="noopener" style="color:var(--brand);font-weight:600">صفحة إنشاء رمز الدخول ↗</a> (صلاحية <code>public_repo</code> محددة مسبقًا).</li>
      <li>اختر مدة الصلاحية، واضغط <b>Generate token</b>، وانسخ الرمز هنا.</li>
    </ol>
    <div class="fld"><label>رمز الدخول</label><input type="password" data-token dir="ltr" placeholder="ghp_…" autocomplete="off"></div>
    <div class="row2"><div class="fld"><label>المستودع</label><input type="text" data-repo dir="ltr" value="${esc(repo)}" placeholder="owner/repo"></div>
      <div class="fld"><label>الفرع</label><input type="text" data-branch dir="ltr" value="${esc((cfg && cfg.branch) || (D.site && D.site.branch) || 'main')}"></div></div>
    <p style="font-size:12px;color:var(--muted)">يُحفظ الرمز في هذا المتصفح فقط، ولا يُرسل إلا إلى GitHub.</p>
    <div class="dlg-f"><button class="sbtn" data-x>إلغاء</button><button class="sbtn o" data-connect>اتصال</button></div>`;
}
function publishDialog() {
  const cfg = ghCfg();
  if (!cfg || !cfg.token) {
    dialog('ربط المحرّر بـ GitHub', connectHtml(cfg), (m, close) => {
      $('[data-x]', m).onclick = close;
      $('[data-connect]', m).onclick = async () => {
        const c = { token: $('[data-token]', m).value.trim(), repo: $('[data-repo]', m).value.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, ''), branch: $('[data-branch]', m).value.trim() || 'main' };
        if (!c.token || !/^[^/\s]+\/[^/\s]+$/.test(c.repo)) { toast('أدخل رمز الدخول واسم المستودع بالشكل owner/repo'); return; }
        const b = $('[data-connect]', m); b.textContent = 'جارٍ التحقق…';
        try {
          const repo = await gh(c, `/repos/${c.repo}`);
          if (repo.permissions && repo.permissions.push === false) throw new Error('حسابك لا يملك صلاحية الكتابة على هذا المستودع. اطلب من صاحبه دعوتك.');
          try { c.login = (await gh(c, '/user')).login; } catch (e) {}
          lsSet(GH_KEY, c); close(); toast('تم الربط' + (c.login ? ' باسم ' + c.login : '')); publishDialog();
        } catch (e) { b.textContent = 'اتصال'; toast(e.message); }
      };
    });
    return;
  }
  const base = readBase() || T.published();
  const sum = changeSummary(base, D);
  dialog('نشر للجميع', `
    <p style="font-size:13px;color:var(--muted);margin-bottom:12px">متصل${cfg.login ? ' باسم <b dir="ltr">' + esc(cfg.login) + '</b>' : ''} · <span dir="ltr">${esc(cfg.repo)}</span> · <a href="#" data-logout style="color:var(--red)">قطع الاتصال</a></p>
    <div style="background:var(--bg);border-radius:14px;padding:14px;font-size:13.5px;line-height:1.9;margin-bottom:12px">
      ${sum.any ? `<b style="color:var(--navy)">ما سيُنشر:</b><br>${sum.ch.length ? `دروس عُدِّلت أو أُضيفت (${sum.ch.length}): ${sum.ch.slice(0, 6).map(esc).join('، ')}${sum.ch.length > 6 ? '…' : ''}<br>` : ''}${sum.del ? `دروس حُذفت: ${sum.del}<br>` : ''}${sum.tree ? 'تغييرات في المواد أو المواضيع أو التجارب<br>' : ''}` : 'لا تعديلات جديدة منذ آخر نشر. يمكنك النشر لرفع أي ملفات متبقية.'}
    </div>
    <p style="font-size:12.5px;color:var(--muted);line-height:1.8">إن نشر محرر آخر في الوقت نفسه تُدمج تعديلاتكما تلقائيًا. يظهر التحديث لكل الزوار خلال دقيقة أو دقيقتين.</p>
    <div data-step style="font-size:13px;color:var(--brand);font-weight:600;min-height:20px;margin-top:8px"></div>
    <div class="dlg-f"><button class="sbtn" data-x>إغلاق</button><button class="sbtn o" data-go>☁ انشر الآن</button></div>`, (m, close) => {
    $('[data-x]', m).onclick = close;
    $('[data-logout]', m).onclick = e => { e.preventDefault(); try { localStorage.removeItem(GH_KEY); } catch (err) {} close(); toast('قُطع الاتصال'); };
    $('[data-go]', m).onclick = async () => {
      const go = $('[data-go]', m), st = $('[data-step]', m);
      go.disabled = true; go.textContent = 'جارٍ النشر…';
      try {
        const r = await publishNow(cfg, t => { st.textContent = t; }, names => Promise.resolve(confirm(`محرر آخر عدّل أيضًا: ${names.join('، ')}.\nإن تابعت تُعتمد نسختك في هذه المواضع فقط، وتبقى بقية تعديلاته كما هي. متابعة؟`)));
        if (!r) { go.disabled = false; go.textContent = '☁ انشر الآن'; st.textContent = 'أُلغي النشر.'; return; }
        st.innerHTML = `✓ نُشر. يظهر لكل الزوار خلال دقيقة أو دقيقتين. <a href="${esc(r.url)}" target="_blank" rel="noopener" style="color:var(--navy)">التفاصيل ↗</a>`;
        go.textContent = 'تم'; setStatus('نُشرت التعديلات ✓');
        drawTree(); drawForm(); drawPreview();
      } catch (e) {
        go.disabled = false; go.textContent = '☁ انشر الآن'; st.style.color = 'var(--red)'; st.textContent = e.message;
        if (e.status === 401) { try { localStorage.removeItem(GH_KEY); } catch (err) {} }
      }
    };
  });
}

/* ---------- open / close ---------- */
window.TEditor = {
  isOpen: () => open,
  async open(isDemo) {
    if (!root) { build(); $('.ed-tree', root).addEventListener('click', treeClick); }
    demo = !!isDemo;
    const d = T.readDraft();
    const pub = T.published();
    D = d ? JSON.parse(JSON.stringify(d.data)) : pub;
    D.labs = D.labs || []; D.site = D.site || {}; D.aliases = D.aliases || {};
    // bring in what other editors published since this draft started
    if (!d) writeBase(pub);
    else {
      const base = readBase();
      if (base && !same(base, pub)) {
        const conf = []; D = merge3(base, D, pub, conf, '');
        writeBase(pub); T.saveDraft(D);
        setTimeout(() => toast(conf.length ? 'دُمجت تعديلات محررين آخرين، مع تعارض في: ' + conflictNames(conf, D).join('، ') : 'دُمجت آخر تعديلات المحررين الآخرين مع مسودتك'), 300);
      } else if (!base) writeBase(pub);
    }
    T.useData(D);
    await T.loadFiles();
    $('.ed-demo', root).classList.toggle('hide', !demo);
    $('[data-act=publish]', root).classList.toggle('hide', demo);
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
  close() { if (!root) return; root.classList.add('hide'); open = false; document.body.style.overflow = ''; $('.ed-prev', root).innerHTML = ''; },
};
})();

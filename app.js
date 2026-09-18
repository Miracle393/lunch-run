'use strict';

/* ---------- storage ---------- */
const KEY = 'lunchrun.v1';
const CUR = 'TZS';
const DEFAULTS = { settings:{ transportFee:1000, recentBlock:3 }, people:[], items:[], rounds:[] };

let S = load();
let TAB = 'order';

function load(){
  try{
    const raw = JSON.parse(localStorage.getItem(KEY));
    if(!raw) return clone(DEFAULTS);
    return { ...clone(DEFAULTS), ...raw, settings:{ ...DEFAULTS.settings, ...(raw.settings||{}) } };
  }catch(e){ return clone(DEFAULTS); }
}
function save(){ localStorage.setItem(KEY, JSON.stringify(S)); }
function clone(o){ return JSON.parse(JSON.stringify(o)); }

/* ---------- helpers ---------- */
const uid   = () => Math.random().toString(36).slice(2,9);
const today = () => new Date().toISOString().slice(0,10);
const esc   = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => n==null ? '—' : Number(n).toLocaleString('en-US') + ' ' + CUR;
const person= id => S.people.find(p=>p.id===id);
const item  = id => S.items.find(i=>i.id===id);

function prettyDate(iso){
  const [y,m,d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>{ t.hidden = true; }, 1900);
}

/* ---------- round model ---------- */
function round(){
  let r = S.rounds.find(r => r.date === today());
  if(!r){
    r = { id:uid(), date:today(), status:'collecting', lines:[],
          transportPayerId:null, transportFee:S.settings.transportFee, paid:{} };
    S.rounds.unshift(r); save();
  }
  if(!r.paid) r.paid = {};
  return r;
}
// price actually owed for a line: what was confirmed on delivery, else the price book
function linePrice(l){
  if(l.actualPrice != null) return l.actualPrice;
  const it = item(l.itemId);
  return it && it.price != null ? it.price : null;
}
function personTotal(r, pid){
  const lines = r.lines.filter(l => l.personId===pid && (r.status==='collecting' || l.delivered !== false));
  let sum = 0, unknown = 0;
  for(const l of lines){
    const p = linePrice(l);
    if(p == null) unknown++; else sum += p;
  }
  if(r.transportPayerId === pid) sum += r.transportFee || 0;
  return { sum, unknown, count:lines.length };
}
function roundTotals(r){
  let food = 0, unknown = 0;
  for(const l of r.lines){
    if(r.status !== 'collecting' && l.delivered === false) continue;
    const p = linePrice(l);
    if(p == null) unknown++; else food += p;
  }
  const transport = r.transportPayerId ? (r.transportFee || 0) : 0;
  let collected = 0;
  for(const pid of Object.keys(r.paid)) if(r.paid[pid]) collected += personTotal(r, pid).sum;
  return { food, transport, unknown, grand:food+transport, collected };
}

/* ---------- fairness ---------- */
// Deterministic-fair: never-paid first, then longest-ago, random only to break exact ties.
function eligible(r){
  const orderers = [...new Set(r.lines.map(l=>l.personId))].map(person).filter(Boolean);
  const history = S.rounds.filter(x=>x.transportPayerId && x.id!==r.id).map(x=>x.transportPayerId);
  const block = new Set(history.slice(0, Math.min(S.settings.recentBlock, Math.max(0, orderers.length-1))));
  let pool = orderers.filter(p => !block.has(p.id));
  if(!pool.length) pool = orderers;
  return { pool, history, blocked:[...block] };
}
function payCount(pid){ return S.rounds.filter(r=>r.transportPayerId===pid).length; }
function lastPaidAgo(pid){
  const i = S.rounds.findIndex(r=>r.transportPayerId===pid);
  return i === -1 ? Infinity : i;
}
function pickPayer(r){
  const { pool } = eligible(r);
  if(!pool.length) return null;
  const scored = pool.map(p => ({ p, times:payCount(p.id), ago:lastPaidAgo(p.id) }));
  const minTimes = Math.min(...scored.map(s=>s.times));
  let best = scored.filter(s=>s.times===minTimes);
  const maxAgo = Math.max(...best.map(s=>s.ago));
  best = best.filter(s=>s.ago===maxAgo);
  return best[Math.floor(Math.random()*best.length)].p;
}

/* ---------- message ---------- */
function orderMessage(r){
  const groups = new Map();
  for(const l of r.lines){
    const it = item(l.itemId); if(!it) continue;
    groups.set(it.name, (groups.get(it.name)||0) + 1);
  }
  const lines = [...groups.entries()].sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0]));
  const people = new Set(r.lines.map(l=>l.personId)).size;
  if(!lines.length) return 'No orders yet.';
  return [
    `Lunch order — ${prettyDate(r.date)}`, '',
    ...lines.map(([n,q]) => q>1 ? `${n} x${q}` : n), '',
    `${r.lines.length} item${r.lines.length>1?'s':''} for ${people} ${people>1?'people':'person'}`
  ].join('\n');
}

/* ---------- views ---------- */
function render(){
  const r = round();
  document.getElementById('subtitle').textContent =
    `${prettyDate(r.date)} · ${r.lines.length} item${r.lines.length===1?'':'s'}`;
  const badge = document.getElementById('statusBadge');
  badge.textContent = r.status;
  badge.className = 'badge' + (r.status==='collecting' ? ' live' : '');
  document.querySelectorAll('.tab').forEach(t =>
    t.setAttribute('aria-selected', String(t.dataset.tab === TAB)));
  document.getElementById('view').innerHTML = ({
    order:viewOrder, send:viewSend, arrive:viewArrive, money:viewMoney, fair:viewFair, setup:viewSetup
  })[TAB](r);
}

function viewOrder(r){
  if(!S.people.length) return `<div class="card"><div class="empty">
      <p><strong>No one in the office list yet.</strong></p>
      <p class="muted">Add your colleagues once — then ordering is just tapping.</p>
      <button class="btn" data-go="setup">Add people</button></div></div>`;

  const rows = S.people.filter(p=>p.active!==false).map(p=>{
    const lines = r.lines.filter(l=>l.personId===p.id);
    const chips = lines.map(l=>{
      const it = item(l.itemId); const price = linePrice(l);
      return `<span class="chip ${price==null?'tbd':''}">${esc(it?it.name:'?')}
        <span class="muted">${price==null?'price?':money(price)}</span>
        <button class="x" data-del="${l.id}" aria-label="Remove">✕</button></span>`;
    }).join('');
    return `<div class="row"><div class="stack">
        <span class="name">${esc(p.name)}</span>
        <div>${chips || '<span class="muted">nothing yet</span>'}</div>
      </div>
      <button class="btn ghost" data-add="${p.id}">+</button></div>`;
  }).join('');

  const t = roundTotals(r);
  return `<div class="card"><h2>Who wants what</h2>${rows}</div>
    <div class="card"><div class="row">
      <div class="stack"><span class="muted">Running estimate</span>
        <span class="big">${money(t.food)}</span>
        ${t.unknown?`<span class="muted">+ ${t.unknown} item${t.unknown>1?'s':''} with no price yet</span>`:''}
      </div></div></div>`;
}

function viewSend(r){
  if(!r.lines.length) return `<div class="card"><div class="empty">Collect some orders first.</div></div>`;
  return `<div class="card">
      <h2>Message for the secretary</h2>
      <p class="muted" style="margin-top:-4px">Grouped by item — what logistics needs. Your per-person list stays in the app.</p>
      <pre class="msg" id="msgText">${esc(orderMessage(r))}</pre>
      <div class="btn-row">
        <button class="btn" data-copy>Copy message</button>
        ${r.status==='collecting' ? '<button class="btn ghost" data-sent>Mark as sent</button>' : ''}
      </div>
    </div>`;
}

function viewArrive(r){
  if(!r.lines.length) return `<div class="card"><div class="empty">Nothing ordered today.</div></div>`;
  const unpriced = r.lines.filter(l => linePrice(l)==null).length;
  const rows = S.people.map(p=>{
    const lines = r.lines.filter(l=>l.personId===p.id);
    if(!lines.length) return '';
    const chips = lines.map(l=>{
      const it = item(l.itemId); const price = linePrice(l);
      const ask = price==null
        ? `<input type="number" inputmode="numeric" placeholder="price" data-price="${l.id}" style="width:96px;min-height:38px;padding:7px 9px">`
        : `<span class="muted">${money(price)}</span>`;
      return `<span class="chip ${l.delivered?'done':''}">
        <button class="x" data-toggle="${l.id}" style="opacity:1">${l.delivered?'☑':'☐'}</button>
        ${esc(it?it.name:'?')} ${ask}</span>`;
    }).join('');
    return `<div class="row"><div class="stack">
      <span class="name">${esc(p.name)}</span><div>${chips}</div></div></div>`;
  }).join('');

  return `${unpriced?`<div class="note">${unpriced} item${unpriced>1?'s':''} still has no price. Type it once here — the app remembers it for next time.</div>`:''}
    <div class="card"><h2>Tick off what arrived</h2>${rows}</div>
    ${r.status!=='delivered' ? `<button class="btn block" data-delivered>Everything checked — confirm delivery</button>` : ''}`;
}

function viewMoney(r){
  if(!r.lines.length) return `<div class="card"><div class="empty">Nothing to settle today.</div></div>`;
  const t = roundTotals(r);
  const rows = S.people.map(p=>{
    const { sum, unknown, count } = personTotal(r, p.id);
    if(!count) return '';
    const isPayer = r.transportPayerId===p.id;
    const paid = !!r.paid[p.id];
    return `<div class="row"><div class="stack">
        <span class="name">${esc(p.name)}${isPayer?' <span class="badge">+transport</span>':''}</span>
        <span class="muted">${count} item${count>1?'s':''}${unknown?` · ${unknown} unpriced`:''}</span>
      </div>
      <div class="right"><div class="name">${money(sum)}</div>
        <button class="btn ${paid?'':'ghost'}" data-paid="${p.id}" style="min-height:34px;padding:6px 10px;font-size:13px">${paid?'✓ paid':'mark paid'}</button>
      </div></div>`;
  }).join('');

  const outstanding = t.grand - t.collected;
  return `<div class="card"><div class="row">
      <div class="stack"><span class="muted">Hand to the secretary</span>
        <span class="big">${money(t.grand)}</span>
        <span class="muted">food ${money(t.food)} + transport ${money(t.transport)}</span>
        ${t.unknown?`<span class="muted" style="color:var(--warn)">${t.unknown} item still unpriced — total will move</span>`:''}
      </div></div></div>
    <div class="card"><h2>Collected ${money(t.collected)} · still to collect ${money(outstanding)}</h2>${rows}</div>`;
}

function viewFair(r){
  const { pool, blocked } = eligible(r);
  const payer = r.transportPayerId ? person(r.transportPayerId) : null;
  const history = S.rounds.filter(x=>x.transportPayerId).slice(0,12).map(x=>
    `<div class="row"><div class="stack"><span class="name">${esc(person(x.transportPayerId)?.name || '—')}</span>
      <span class="muted">${prettyDate(x.date)}</span></div>
      <span class="muted">${money(x.transportFee||0)}</span></div>`).join('')
    || '<div class="empty">No transport history yet.</div>';

  const counts = S.people.map(p=>({p,n:payCount(p.id)})).sort((a,b)=>a.n-b.n)
    .map(x=>`<span class="chip">${esc(x.p.name)} <span class="muted">${x.n}×</span></span>`).join('');

  return `<div class="card">
      <h2>Transport fee — ${money(r.transportFee||0)}</h2>
      ${payer
        ? `<p style="margin:0 0 10px"><strong>${esc(payer.name)}</strong> pays today.
           <span class="muted">Chosen from ${pool.length} eligible; paid ${payCount(payer.id)}× before.</span></p>`
        : `<p class="muted" style="margin:0 0 10px">Nobody chosen yet. ${blocked.length?`${blocked.length} recent payer(s) are excluded.`:''}</p>`}
      <button class="btn block" data-pick>${payer?'Pick someone else':'Pick fairly'}</button>
    </div>
    <div class="card"><h2>Times paid</h2>${counts || '<span class="muted">—</span>'}</div>
    <div class="card"><h2>History</h2>${history}</div>`;
}

function viewSetup(){
  const people = S.people.map(p=>`<div class="row">
      <span class="name">${esc(p.name)}</span>
      <button class="icon-btn" data-rmperson="${p.id}" aria-label="Remove">✕</button></div>`).join('')
    || '<div class="empty">Nobody added yet.</div>';

  const items = S.items.sort((a,b)=>a.name.localeCompare(b.name)).map(i=>`<div class="row">
      <span class="name">${esc(i.name)}</span>
      <span class="right"><input type="number" inputmode="numeric" value="${i.price??''}" placeholder="price?"
        data-itemprice="${i.id}" style="width:104px;min-height:38px;padding:7px 9px"></span></div>`).join('')
    || '<div class="empty">The price book fills itself as you confirm prices on delivery.</div>';

  return `<div class="card"><h2>People in the office</h2>${people}
      <div class="btn-row" style="margin-top:12px">
        <input type="text" id="newPerson" placeholder="Name" style="flex:1;min-width:140px">
        <button class="btn" data-addperson>Add</button></div></div>

    <div class="card"><h2>Price book</h2>
      <p class="muted" style="margin-top:-4px">Every price you confirm at delivery is remembered, so unknown prices get rarer each week.</p>
      ${items}</div>

    <div class="card"><h2>Settings</h2>
      <label class="field"><span>Transport fee (${CUR})</span>
        <input type="number" inputmode="numeric" id="fee" value="${S.settings.transportFee}"></label>
      <label class="field"><span>Exclude this many recent payers from the draw</span>
        <input type="number" inputmode="numeric" id="block" value="${S.settings.recentBlock}"></label>
      <button class="btn" data-savesettings>Save settings</button></div>

    <div class="card"><h2>Data</h2>
      <div class="btn-row">
        <button class="btn ghost" data-export>Export backup</button>
        <button class="btn danger" data-reset>Erase everything</button>
      </div></div>`;
}

/* ---------- item picker ---------- */
function openPicker(pid){
  const wrap = document.getElementById('sheetWrap');
  document.getElementById('sheetTitle').textContent = `What does ${person(pid)?.name || ''} want?`;
  const body = document.getElementById('sheetBody');

  const draw = (q='') => {
    const needle = q.trim().toLowerCase();
    const list = S.items
      .filter(i => i.name.toLowerCase().includes(needle))
      .sort((a,b)=>(b.timesOrdered||0)-(a.timesOrdered||0) || a.name.localeCompare(b.name))
      .slice(0,40);
    const exact = S.items.some(i => i.name.toLowerCase() === needle);
    body.innerHTML = `
      <input type="search" id="q" placeholder="Search or type a new item" value="${esc(q)}" autocomplete="off">
      <div style="margin-top:8px">
        ${list.map(i=>`<button class="pick" data-pickitem="${i.id}">
            <span>${esc(i.name)}</span>
            <span class="muted">${i.price==null?'price?':money(i.price)}</span></button>`).join('')
          || '<div class="empty">No matches.</div>'}
        ${needle && !exact ? `<button class="pick" data-newitem="${esc(q.trim())}">
            <span>➕ Add “${esc(q.trim())}”</span><span class="muted">new</span></button>` : ''}
      </div>`;
    const qEl = document.getElementById('q');
    qEl.oninput = () => { const v = qEl.value; draw(v); document.getElementById('q').focus(); };
    body.dataset.person = pid;
  };
  draw();
  wrap.hidden = false;
}
function closeSheet(){ document.getElementById('sheetWrap').hidden = true; }

function addLine(pid, itemId){
  const r = round();
  r.lines.push({ id:uid(), personId:pid, itemId, delivered:false, actualPrice:null });
  const it = item(itemId); if(it) it.timesOrdered = (it.timesOrdered||0) + 1;
  save(); closeSheet(); render();
}

/* ---------- events ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-tab],[data-go],[data-add],[data-del],[data-copy],[data-sent],[data-toggle],[data-delivered],[data-paid],[data-pick],[data-addperson],[data-rmperson],[data-savesettings],[data-export],[data-reset],[data-pickitem],[data-newitem],[data-close]');
  if(!el) return;
  const d = el.dataset;
  const r = round();

  if(d.tab || d.go){ TAB = d.tab || d.go; render(); return; }
  if('close' in d){ closeSheet(); return; }
  if(d.add){ openPicker(d.add); return; }

  if(d.pickitem){ addLine(document.getElementById('sheetBody').dataset.person, d.pickitem); return; }
  if(d.newitem){
    const it = { id:uid(), name:d.newitem, price:null, timesOrdered:0 };
    S.items.push(it);
    addLine(document.getElementById('sheetBody').dataset.person, it.id);
    return;
  }
  if(d.del){ r.lines = r.lines.filter(l=>l.id!==d.del); save(); render(); return; }

  if('copy' in d){
    const text = orderMessage(r);
    const done = () => toast('Message copied — paste it to her');
    if(navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done).catch(fallbackCopy);
    else fallbackCopy();
    function fallbackCopy(){
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try{ document.execCommand('copy'); done(); }catch(_){ toast('Copy failed — select the text manually'); }
      ta.remove();
    }
    return;
  }
  if('sent' in d){ r.status='sent'; r.sentAt=Date.now(); save(); TAB='arrive'; render(); toast('Marked as sent'); return; }
  if(d.toggle){
    const l = r.lines.find(x=>x.id===d.toggle);
    if(l){ l.delivered = !l.delivered; save(); render(); }
    return;
  }
  if('delivered' in d){
    r.status='delivered'; save(); TAB='money'; render();
    toast('Delivery confirmed'); return;
  }
  if(d.paid){ r.paid[d.paid] = !r.paid[d.paid]; save(); render(); return; }

  if('pick' in d){
    const p = pickPayer(r);
    if(!p){ toast('Nobody has ordered yet'); return; }
    r.transportPayerId = p.id; r.transportFee = S.settings.transportFee;
    save(); render(); toast(`${p.name} pays transport today`);
    return;
  }

  if('addperson' in d){
    const inp = document.getElementById('newPerson');
    const name = inp.value.trim();
    if(!name) return;
    S.people.push({ id:uid(), name, active:true });
    save(); render(); toast(`${name} added`);
    return;
  }
  if(d.rmperson){ S.people = S.people.filter(p=>p.id!==d.rmperson); save(); render(); return; }

  if('savesettings' in d){
    S.settings.transportFee = Number(document.getElementById('fee').value) || 0;
    S.settings.recentBlock  = Math.max(0, Number(document.getElementById('block').value) || 0);
    if(r.status==='collecting') r.transportFee = S.settings.transportFee;
    save(); render(); toast('Saved');
    return;
  }
  if('export' in d){
    const blob = new Blob([JSON.stringify(S,null,2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `lunchrun-backup-${today()}.json`;
    a.click(); URL.revokeObjectURL(a.href);
    return;
  }
  if('reset' in d){
    if(confirm('Erase all people, prices and history? This cannot be undone.')){
      S = clone(DEFAULTS); save(); render();
    }
    return;
  }
});

// price entered at delivery -> line AND price book (this is how unknowns disappear)
document.addEventListener('change', e => {
  const t = e.target;
  const r = round();
  if(t.dataset.price){
    const l = r.lines.find(x=>x.id===t.dataset.price);
    const v = t.value === '' ? null : Number(t.value);
    if(l && v != null && !Number.isNaN(v)){
      l.actualPrice = v;
      const it = item(l.itemId);
      if(it && it.price == null) it.price = v;   // learned
      save(); render(); toast('Price remembered');
    }
    return;
  }
  if(t.dataset.itemprice){
    const it = item(t.dataset.itemprice);
    if(it){ it.price = t.value === '' ? null : Number(t.value); save(); }
  }
});

document.addEventListener('keydown', e => {
  if(e.key === 'Enter' && e.target.id === 'newPerson'){
    document.querySelector('[data-addperson]').click();
  }
  if(e.key === 'Escape') closeSheet();
});

/* ---------- boot ---------- */
render();
if('serviceWorker' in navigator && location.protocol.startsWith('http')){
  navigator.serviceWorker.register('sw.js').catch(()=>{});
}

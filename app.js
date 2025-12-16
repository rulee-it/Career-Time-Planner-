const STORAGE_KEY = 'ctp:v1';

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const HOURS_START = 8;
const HOURS_END = 20;
const SLOT_MINUTES = 30;

const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

document.documentElement.classList.remove('no-js');

document.getElementById('year').textContent = String(new Date().getFullYear());

function clamp(n, min, max){
  return Math.max(min, Math.min(max, n));
}

function uid(){
  return Math.random().toString(16).slice(2) + '-' + Date.now().toString(16);
}

function formatDate(iso){
  try{
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month:'short', day:'numeric' });
  }catch{
    return iso;
  }
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return null;
    return JSON.parse(raw);
  }catch{
    return null;
  }
}

function saveState(state){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function defaultState(){
  return {
    milestones: [
      {
        id: uid(),
        title: 'Prepare SAT practice tests',
        date: new Date(Date.now() + 1000*60*60*24*14).toISOString().slice(0,10),
        outcome: 'Build test discipline — 6 mock tests in 8 weeks',
        priority: 'medium',
        weeklyHours: 4,
        status: 'in-progress',
        tasks: [
          { id: uid(), title: 'Mock test #1 (timed)', minutes: 120, done: false },
          { id: uid(), title: 'Review wrong answers', minutes: 60, done: false },
          { id: uid(), title: 'Flashcards (weak areas)', minutes: 45, done: false },
        ],
      },
      {
        id: uid(),
        title: 'Build portfolio v1',
        date: new Date(Date.now() + 1000*60*60*24*28).toISOString().slice(0,10),
        outcome: 'Show 2 projects + a clean resume page',
        priority: 'high',
        weeklyHours: 6,
        status: 'planned',
        tasks: [
          { id: uid(), title: 'Pick 2 project ideas', minutes: 30, done: false },
          { id: uid(), title: 'Draft portfolio layout', minutes: 60, done: false },
          { id: uid(), title: 'Publish to GitHub Pages', minutes: 45, done: false },
        ],
      },
      {
        id: uid(),
        title: 'Mock interview sprint',
        date: new Date(Date.now() + 1000*60*60*24*45).toISOString().slice(0,10),
        outcome: '3 mock interviews + feedback notes',
        priority: 'medium',
        weeklyHours: 3,
        status: 'planned',
        tasks: [
          { id: uid(), title: 'Write 6 STAR stories', minutes: 60, done: false },
          { id: uid(), title: 'Mock interview #1', minutes: 45, done: false },
          { id: uid(), title: 'Fix weak answers', minutes: 30, done: false },
        ],
      }
    ],
    planner: {
      // blocks: { id, title, dayIndex, startMinutes, durationMinutes, sourceMilestoneId?, sourceTaskId? }
      blocks: [],
    },
    activity: {
      lastDoneISO: null,
      streak: 0,
    },
    badges: {
      earned: [],
    },
  };
}

let state = loadState() ?? defaultState();

const ui = {
  header: document.querySelector('.header'),
  sentinel: document.getElementById('heroSentinel'),
  mobileMenuBtn: document.querySelector('.header__menu'),
  mobileNav: document.getElementById('mobileNav'),

  timeline: document.getElementById('timeline'),
  timelineItems: document.getElementById('timelineItems'),
  timelineSkeleton: document.getElementById('timelineSkeleton'),
  timelineLine: document.getElementById('timelineLine'),

  panel: document.getElementById('milestonePanel'),
  panelScrim: document.getElementById('panelScrim'),
  panelTitle: document.getElementById('panelTitle'),
  panelKicker: document.getElementById('panelKicker'),
  panelBody: document.getElementById('panelBody'),
  addToPlannerBtn: document.getElementById('addToPlannerBtn'),

  plannerHeader: document.getElementById('plannerHeader'),
  plannerBody: document.getElementById('plannerBody'),
  plannerBoard: document.getElementById('plannerBoard'),
  plannerSkeleton: document.getElementById('plannerSkeleton'),
  plannerSuggest: document.getElementById('plannerSuggest'),
  taskList: document.getElementById('taskList'),
  clearWeekBtn: document.getElementById('clearWeekBtn'),

  completionNum: document.getElementById('completionNum'),
  streakNum: document.getElementById('streakNum'),
  hoursNum: document.getElementById('hoursNum'),
  badgeRow: document.getElementById('badgeRow'),
  nextStepCopy: document.getElementById('nextStepCopy'),

  resourceGrid: document.getElementById('resourceGrid'),
  carousel: document.getElementById('carousel'),
  carouselViewport: document.getElementById('carouselViewport'),
  prevTestimonial: document.getElementById('prevTestimonial'),
  nextTestimonial: document.getElementById('nextTestimonial'),
  faq: document.getElementById('faq'),

  modal: document.getElementById('create-plan'),
  goalForm: document.getElementById('goalForm'),

  toast: document.getElementById('toast'),
  toastText: document.getElementById('toastText'),

  newsletter: document.getElementById('newsletter'),
  newsStatus: document.getElementById('newsStatus'),
};

const revealObserver = !prefersReduced
  ? new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          revealObserver.unobserve(e.target);
        }
      }
    }, { threshold: 0.12 })
  : null;

for (const el of document.querySelectorAll('.reveal')) {
  if (prefersReduced) el.classList.add('is-in');
  else revealObserver.observe(el);
}

// Header glass on scroll
if (ui.sentinel) {
  const headerObserver = new IntersectionObserver((entries) => {
    const topVisible = entries[0]?.isIntersecting ?? true;
    ui.header.classList.toggle('is-scrolled', !topVisible);
  }, { threshold: 0.01 });
  headerObserver.observe(ui.sentinel);
}

// Mobile menu
ui.mobileMenuBtn?.addEventListener('click', () => {
  const open = ui.mobileNav.hasAttribute('hidden');
  ui.mobileNav.toggleAttribute('hidden', !open);
  ui.mobileMenuBtn.setAttribute('aria-expanded', String(open));
});
ui.mobileNav?.addEventListener('click', (e) => {
  if (e.target === ui.mobileNav) {
    ui.mobileNav.setAttribute('hidden','');
    ui.mobileMenuBtn?.setAttribute('aria-expanded','false');
  }
});
ui.mobileNav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  ui.mobileNav.setAttribute('hidden','');
  ui.mobileMenuBtn?.setAttribute('aria-expanded','false');
}));

// Hero stagger on load
requestAnimationFrame(() => {
  for(const [idx, el] of Array.from(document.querySelectorAll('.hero .reveal')).entries()){
    el.style.transitionDelay = prefersReduced ? '0s' : `${Math.min(0.12, 0.06 + idx * 0.06)}s`;
  }
});

// Parallax (throttled)
(function initParallax(){
  const el = document.querySelector('[data-parallax]');
  if(!el) return;
  const finePointer = window.matchMedia?.('(pointer: fine)').matches ?? true;
  if(prefersReduced || !finePointer) return;

  let raf = 0;
  let lastX = 0;
  let lastY = 0;

  window.addEventListener('mousemove', (ev) => {
    lastX = (ev.clientX / window.innerWidth - 0.5) * 16;
    lastY = (ev.clientY / window.innerHeight - 0.5) * 12;
    if(raf) return;
    raf = requestAnimationFrame(() => {
      el.style.setProperty('--mx', `${lastX.toFixed(2)}px`);
      el.style.setProperty('--my', `${lastY.toFixed(2)}px`);
      raf = 0;
    });
  }, { passive:true });
})();

// Modal (focus trap)
let lastFocus = null;
function openModal(modal){
  if(!modal) return;
  lastFocus = document.activeElement;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden','false');

  const first = modal.querySelector('input, textarea, select, button, a[href]');
  first?.focus?.();
}
function closeModal(modal){
  if(!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden','true');
  lastFocus?.focus?.();
}

document.addEventListener('click', (e) => {
  const openId = e.target?.closest?.('[data-open-modal]')?.getAttribute('data-open-modal');
  if(openId){
    openModal(document.getElementById(openId));
    return;
  }
  if(e.target?.matches?.('[data-close-modal]')){
    closeModal(e.target.closest('.modal'));
    return;
  }
});

document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape'){
    if(ui.modal.classList.contains('is-open')) closeModal(ui.modal);
    if(ui.panel.classList.contains('is-open')) closePanel();
  }
});

ui.modal?.addEventListener('keydown', (e) => {
  if(e.key !== 'Tab') return;
  const focusables = Array.from(ui.modal.querySelectorAll('button,[href],input,textarea,select,[tabindex]:not([tabindex="-1"])'))
    .filter(el => !el.hasAttribute('disabled'));
  if(focusables.length === 0) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if(e.shiftKey && document.activeElement === first){
    e.preventDefault();
    last.focus();
  }else if(!e.shiftKey && document.activeElement === last){
    e.preventDefault();
    first.focus();
  }
});

// Toast
let toastTimer = 0;
function showToast(message){
  ui.toastText.textContent = message;
  ui.toast.hidden = false;
  ui.toast.classList.add('is-open');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    ui.toast.classList.remove('is-open');
    window.setTimeout(() => { ui.toast.hidden = true; }, 320);
  }, 3500);
}

// Timeline render
let activeMilestoneId = null;
let activePanelTaskId = null;

function computeMilestoneStatus(m){
  const tasks = m.tasks ?? [];
  const done = tasks.filter(t => t.done).length;
  if(tasks.length > 0 && done === tasks.length) return 'done';
  if(done > 0) return 'in-progress';
  return m.status ?? 'planned';
}

function milestoneProgress(m){
  const tasks = m.tasks ?? [];
  if(tasks.length === 0) return 0;
  const done = tasks.filter(t => t.done).length;
  return done / tasks.length;
}

function overallCompletion(){
  const all = state.milestones.flatMap(m => m.tasks ?? []);
  if(all.length === 0) return 0;
  const done = all.filter(t => t.done).length;
  return done / all.length;
}

function timelineSorted(){
  return [...state.milestones].sort((a,b) => String(a.date).localeCompare(String(b.date)));
}

function statusPill(status){
  if(status === 'done') return { cls:'pill--done', label:'Done' };
  if(status === 'in-progress') return { cls:'pill--progress', label:'In progress' };
  return { cls:'pill--planned', label:'Planned' };
}

function renderTimeline(){
  const list = timelineSorted();
  ui.timelineItems.innerHTML = '';

  for(const [idx, m] of list.entries()){
    const status = computeMilestoneStatus(m);
    const pill = statusPill(status);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'milestone';
    btn.setAttribute('role','listitem');
    btn.dataset.id = m.id;
    btn.style.transitionDelay = prefersReduced ? '0s' : `${idx * 0.06}s`;

    btn.innerHTML = `
      <span class="milestone__pin" aria-hidden="true"></span>
      <div class="tooltip" role="tooltip">
        <strong>${escapeHtml(m.title)}</strong><br>
        ${escapeHtml(m.outcome)}
      </div>
      <div class="milestone__top">
        <h4 class="milestone__title">${escapeHtml(m.title)}</h4>
        <div class="milestone__date">${escapeHtml(formatDate(m.date))}</div>
      </div>
      <div class="milestone__outcome">${escapeHtml(m.outcome)}</div>
      <div class="milestone__status">
        <span class="pill ${pill.cls}">${pill.label}</span>
        <span class="muted">${Math.round(milestoneProgress(m)*100)}%</span>
      </div>
    `;

    btn.addEventListener('click', () => openPanel(m.id));
    btn.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        openPanel(m.id);
      }
    });

    ui.timelineItems.appendChild(btn);
  }

  // Show after skeleton
  ui.timelineSkeleton.style.display = 'none';

  initTimelineLineAnimation();
  syncTimelineProgress(true);
}

let timelineLineLen = null;
let timelineLineReady = false;
function initTimelineLineAnimation(){
  if(timelineLineReady) return;
  const base = ui.timelineLine?.querySelector('path#timelineLineBase');
  const prog = ui.timelineLine?.querySelector('path#timelineLineProgress');
  if(!base || !prog) return;

  timelineLineLen = base.getTotalLength?.() ?? 1200;

  base.style.strokeDasharray = String(timelineLineLen);
  base.style.strokeDashoffset = String(timelineLineLen);
  prog.style.strokeDasharray = String(timelineLineLen);
  prog.style.strokeDashoffset = String(timelineLineLen);

  if(prefersReduced){
    base.style.strokeDashoffset = '0';
    timelineLineReady = true;
    return;
  }

  const drawObserver = new IntersectionObserver((entries) => {
    if(entries[0]?.isIntersecting){
      base.style.transition = `stroke-dashoffset var(--dur-draw) var(--ease-enter)`;
      prog.style.transition = `stroke-dashoffset var(--dur-draw) var(--ease-enter)`;
      requestAnimationFrame(() => {
        base.style.strokeDashoffset = '0';
        syncTimelineProgress(true);
      });
      timelineLineReady = true;
      drawObserver.disconnect();
    }
  }, { threshold: 0.2 });
  drawObserver.observe(ui.timeline);
}

function syncTimelineProgress(animate){
  const base = ui.timelineLine?.querySelector('path#timelineLineBase');
  const prog = ui.timelineLine?.querySelector('path#timelineLineProgress');
  if(!base || !prog) return;

  const len = timelineLineLen ?? (base.getTotalLength?.() ?? 1200);

  const pct = overallCompletion();
  const targetOffset = len * (1 - pct);

  if(prefersReduced || !animate){
    prog.style.strokeDashoffset = String(targetOffset);
    return;
  }

  // If line hasn't drawn yet, keep progress hidden until draw triggers.
  if(!timelineLineReady){
    prog.style.strokeDashoffset = String(len);
    return;
  }

  prog.style.transition = `stroke-dashoffset 0.9s cubic-bezier(.22,1,.36,1)`;
  requestAnimationFrame(() => { prog.style.strokeDashoffset = String(targetOffset); });
}

// timeline drag scroll + zoom
(function initTimelineDragZoom(){
  const scroller = ui.timelineItems;
  if(!scroller) return;

  let dragging = false;
  let startX = 0;
  let startScroll = 0;

  scroller.addEventListener('pointerdown', (e) => {
    if(e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = true;
    startX = e.clientX;
    startScroll = scroller.scrollLeft;
    scroller.setPointerCapture(e.pointerId);
  });

  scroller.addEventListener('pointermove', (e) => {
    if(!dragging) return;
    scroller.scrollLeft = startScroll - (e.clientX - startX);
  });

  scroller.addEventListener('pointerup', () => { dragging = false; });
  scroller.addEventListener('pointercancel', () => { dragging = false; });

  let zoom = 1;
  scroller.addEventListener('wheel', (e) => {
    if(!e.ctrlKey) return;
    e.preventDefault();
    zoom = clamp(zoom + (e.deltaY > 0 ? -0.06 : 0.06), 0.85, 1.35);
    scroller.style.transform = `scale(${zoom})`;
    scroller.style.transformOrigin = 'left center';
  }, { passive:false });
})();

// Panel
function openPanel(milestoneId){
  activeMilestoneId = milestoneId;
  const m = state.milestones.find(x => x.id === milestoneId);
  if(!m) return;

  ui.panelTitle.textContent = m.title;
  ui.panelKicker.textContent = `${formatDate(m.date)} · ${m.weeklyHours}h/week · ${m.priority} priority`;

  const status = computeMilestoneStatus(m);
  const pill = statusPill(status);

  ui.panelBody.innerHTML = `
    <div class="card" style="padding:14px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
        <div style="font-weight:760">Outcome</div>
        <span class="pill ${pill.cls}">${pill.label}</span>
      </div>
      <div class="muted" style="margin-top:8px">${escapeHtml(m.outcome)}</div>
    </div>

    <div class="card" style="padding:14px">
      <div style="font-weight:760;margin-bottom:8px">Tasks</div>
      <div id="panelTasks" style="display:grid;gap:10px"></div>
    </div>
  `;

  const taskWrap = ui.panelBody.querySelector('#panelTasks');
  for(const t of (m.tasks ?? [])){
    const row = document.createElement('label');
    row.style.display = 'flex';
    row.style.alignItems = 'flex-start';
    row.style.gap = '10px';
    row.style.cursor = 'pointer';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !!t.done;
    cb.addEventListener('change', () => {
      t.done = cb.checked;
      markActivity();
      saveState(state);
      renderTimeline();
      renderTaskList();
      renderDashboard(true);
      updateNextStep();
      maybeEarnBadges();
      showToast('Saved — your plan’s updated');
    });

    const text = document.createElement('div');
    text.innerHTML = `<div style="font-weight:760;letter-spacing:-.01em">${escapeHtml(t.title)}</div>
      <div class="muted">${Math.round((t.minutes ?? 30)/60*10)/10}h estimate</div>`;

    row.append(cb, text);
    taskWrap.appendChild(row);
  }

  ui.addToPlannerBtn.onclick = () => {
    const pick = (m.tasks ?? []).find(t => !t.done) ?? (m.tasks ?? [])[0];
    if(!pick){
      showToast('Nothing to add — add a task first');
      return;
    }
    activePanelTaskId = pick.id;
    addTaskToPlanner({
      title: `${m.title}: ${pick.title}`,
      minutes: pick.minutes ?? 60,
      sourceMilestoneId: m.id,
      sourceTaskId: pick.id,
    });
    showToast('Added to your weekly planner');
    closePanel();
    document.getElementById('planner')?.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
  };

  // highlight active milestone
  document.querySelectorAll('.milestone').forEach(el => el.classList.toggle('is-active', el.dataset.id === milestoneId));

  ui.panelScrim.hidden = false;
  ui.panel.classList.add('is-open');
  ui.panel.setAttribute('aria-hidden','false');

  // focus
  ui.panel.querySelector('[data-close-panel]')?.focus();
}

function closePanel(){
  ui.panel.classList.remove('is-open');
  ui.panel.setAttribute('aria-hidden','true');
  ui.panelScrim.hidden = true;
  document.querySelectorAll('.milestone').forEach(el => el.classList.remove('is-active'));
}

ui.panelScrim.addEventListener('click', closePanel);
document.querySelectorAll('[data-close-panel]').forEach(btn => btn.addEventListener('click', closePanel));

// Planner
function renderPlannerBase(){
  ui.plannerHeader.innerHTML = '';
  ui.plannerBody.innerHTML = '';

  // header row
  const t = document.createElement('div');
  t.className = 'planner__time';
  t.textContent = '';
  ui.plannerHeader.appendChild(t);
  for(const d of DAYS){
    const el = document.createElement('div');
    el.className = 'planner__day';
    el.textContent = d;
    ui.plannerHeader.appendChild(el);
  }

  // body columns
  const timeCol = document.createElement('div');
  timeCol.className = 'planner__col';
  timeCol.style.borderLeft = 'none';
  timeCol.style.background = 'rgba(255,255,255,.68)';
  timeCol.innerHTML = timeLabelsHtml();
  ui.plannerBody.appendChild(timeCol);

  for(let i=0;i<7;i++){
    const col = document.createElement('div');
    col.className = 'planner__col';
    col.dataset.day = String(i);

    const ticks = document.createElement('div');
    ticks.className = 'planner__ticks';
    for(let r=0;r<=((HOURS_END - HOURS_START)*60)/SLOT_MINUTES;r++){
      const tick = document.createElement('div');
      tick.className = 'tick';
      tick.style.top = `${(r/((HOURS_END - HOURS_START)*60/SLOT_MINUTES))*100}%`;
      ticks.appendChild(tick);
    }

    const blocks = document.createElement('div');
    blocks.className = 'planner__blocks';

    col.append(ticks, blocks);
    ui.plannerBody.appendChild(col);
  }
}

function timeLabelsHtml(){
  const rows = ((HOURS_END - HOURS_START)*60)/SLOT_MINUTES;
  let out = '<div style="position:relative;height:100%">';
  for(let r=0;r<=rows;r+=2){
    const minutes = HOURS_START*60 + r*SLOT_MINUTES;
    const h = Math.floor(minutes/60);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hh = ((h + 11) % 12) + 1;
    const top = (r/rows)*100;
    out += `<div style="position:absolute;top:${top}%;transform:translateY(-50%);padding:0 10px;color:rgba(15,23,42,.55);font-weight:760;font-size:12px">${hh}${ampm}</div>`;
  }
  out += '</div>';
  return out;
}

function plannerDims(){
  const bodyRect = ui.plannerBody.getBoundingClientRect();
  const rows = ((HOURS_END - HOURS_START)*60)/SLOT_MINUTES;
  return { bodyRect, rows };
}

function minutesToY(minutes){
  const total = (HOURS_END - HOURS_START) * 60;
  const clamped = clamp(minutes - HOURS_START*60, 0, total);
  return (clamped / total) * 100;
}

function durationToH(durationMinutes){
  const total = (HOURS_END - HOURS_START) * 60;
  return (clamp(durationMinutes, SLOT_MINUTES, total) / total) * 100;
}

function renderBlocks(){
  // clear
  for(const col of ui.plannerBody.querySelectorAll('.planner__col[data-day]')){
    col.querySelector('.planner__blocks').innerHTML = '';
  }

  for(const b of state.planner.blocks){
    const col = ui.plannerBody.querySelector(`.planner__col[data-day="${b.dayIndex}"] .planner__blocks`);
    if(!col) continue;

    const el = document.createElement('div');
    el.className = 'block';
    el.dataset.id = b.id;
    el.style.top = `${minutesToY(b.startMinutes)}%`;
    el.style.height = `${durationToH(b.durationMinutes)}%`;
    el.innerHTML = `
      <div class="block__t">${escapeHtml(b.title)}</div>
      <div class="block__m">${Math.round(b.durationMinutes/60*10)/10}h</div>
      <button class="iconBtn block__x" type="button" aria-label="Remove block">
        <svg width="16" height="16" aria-hidden="true"><use href="#i-x"></use></svg>
      </button>
    `;

    el.querySelector('.block__x').addEventListener('click', (e) => {
      e.stopPropagation();
      state.planner.blocks = state.planner.blocks.filter(x => x.id !== b.id);
      saveState(state);
      renderBlocks();
      renderDashboard(true);
      showToast('Removed from planner');
    });

    enableBlockDrag(el);
    col.appendChild(el);
  }
}

function blocksByDay(){
  const map = Array.from({length:7}, () => []);
  for(const b of state.planner.blocks){
    map[b.dayIndex].push(b);
  }
  return map;
}

function findSuggestedSlots(durationMinutes, count=3){
  const total = (HOURS_END - HOURS_START)*60;
  const step = SLOT_MINUTES;
  const perDay = blocksByDay();

  const slots = [];
  for(let day=0; day<7 && slots.length<count; day++){
    for(let start=HOURS_START*60; start+durationMinutes<=HOURS_END*60; start+=step){
      const overlaps = perDay[day].some(b => rangesOverlap(start, start+durationMinutes, b.startMinutes, b.startMinutes + b.durationMinutes));
      if(!overlaps){
        slots.push({ dayIndex: day, startMinutes: start });
        if(slots.length>=count) break;
      }
    }
  }
  return slots;
}

function rangesOverlap(a1,a2,b1,b2){
  return Math.max(a1,b1) < Math.min(a2,b2);
}

function showSuggest(durationMinutes){
  ui.plannerSuggest.innerHTML = '';
  const slots = findSuggestedSlots(durationMinutes, 3);
  for(const s of slots){
    const col = ui.plannerBody.querySelector(`.planner__col[data-day="${s.dayIndex}"]`);
    if(!col) continue;

    const slot = document.createElement('div');
    slot.className = 'suggestSlot';
    slot.style.top = `${minutesToY(s.startMinutes)}%`;
    slot.style.height = `${durationToH(durationMinutes)}%`;
    slot.style.left = `${col.offsetLeft + 6}px`;
    slot.style.width = `${col.clientWidth - 12}px`;
    ui.plannerSuggest.appendChild(slot);
  }
  ui.plannerBoard.classList.add('is-suggesting');
}

function hideSuggest(){
  ui.plannerBoard.classList.remove('is-suggesting');
  ui.plannerSuggest.innerHTML = '';
}

function addTaskToPlanner({ title, minutes, sourceMilestoneId, sourceTaskId }){
  const duration = snapDuration(minutes ?? 60);
  const [first] = findSuggestedSlots(duration, 1);
  const dayIndex = first?.dayIndex ?? 1;
  const startMinutes = first?.startMinutes ?? (HOURS_START*60);

  state.planner.blocks.push({
    id: uid(),
    title,
    dayIndex,
    startMinutes,
    durationMinutes: duration,
    sourceMilestoneId,
    sourceTaskId,
  });
  saveState(state);
  renderBlocks();
  renderDashboard(true);
}

function snapMinutes(mins){
  const step = SLOT_MINUTES;
  return Math.round(mins / step) * step;
}

function snapDuration(mins){
  const step = SLOT_MINUTES;
  const m = Math.max(step, snapMinutes(mins));
  return clamp(m, step, (HOURS_END - HOURS_START)*60);
}

function xyToDayAndMinutes(clientX, clientY){
  const { bodyRect, rows } = plannerDims();
  const x = clientX - bodyRect.left;
  const y = clientY - bodyRect.top;

  // exclude time column
  const colW = (bodyRect.width - 64) / 7;
  const dayIndex = clamp(Math.floor((x - 64) / colW), 0, 6);

  const totalMinutes = (HOURS_END - HOURS_START) * 60;
  const ratio = clamp(y / bodyRect.height, 0, 1);
  const minutes = HOURS_START*60 + snapMinutes(ratio * totalMinutes);

  return { dayIndex, minutes };
}

function enableBlockDrag(el){
  let start = null;
  let block = null;

  el.addEventListener('pointerdown', (e) => {
    if(e.target.closest('.block__x')) return;
    e.preventDefault();

    const id = el.dataset.id;
    block = state.planner.blocks.find(b => b.id === id);
    if(!block) return;

    start = {
      pointerId: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      origDay: block.dayIndex,
      origStart: block.startMinutes,
    };

    showSuggest(block.durationMinutes);
    el.setPointerCapture(e.pointerId);
    el.style.transition = 'none';
  });

  el.addEventListener('pointermove', (e) => {
    if(!start || e.pointerId !== start.pointerId) return;
    const { dayIndex, minutes } = xyToDayAndMinutes(e.clientX, e.clientY);
    el.style.opacity = '0.96';
    el.style.transform = 'translate3d(0,0,0) scale(0.99)';

    // temporary preview position
    el.style.top = `${minutesToY(minutes)}%`;
    const targetCol = ui.plannerBody.querySelector(`.planner__col[data-day="${dayIndex}"] .planner__blocks`);
    if(targetCol && el.parentElement !== targetCol){
      targetCol.appendChild(el);
    }
  });

  el.addEventListener('pointerup', (e) => {
    if(!start || e.pointerId !== start.pointerId) return;
    const { dayIndex, minutes } = xyToDayAndMinutes(e.clientX, e.clientY);

    block.dayIndex = dayIndex;
    block.startMinutes = clamp(minutes, HOURS_START*60, HOURS_END*60 - block.durationMinutes);

    // bounce snap
    if(!prefersReduced){
      el.style.transition = 'transform 0.16s cubic-bezier(.4,0,.2,1)';
      el.style.transform = 'scale(0.98)';
      requestAnimationFrame(() => {
        el.style.transform = 'scale(1.02)';
        setTimeout(() => { el.style.transform = 'scale(1)'; }, 80);
      });
    }else{
      el.style.transition = '';
      el.style.transform = '';
    }

    el.style.opacity = '';

    hideSuggest();
    start = null;
    saveState(state);
    renderBlocks();
    renderDashboard(true);
  });

  el.addEventListener('pointercancel', () => {
    if(!start) return;
    hideSuggest();
    start = null;
    renderBlocks();
  });
}

function renderTaskList(){
  ui.taskList.innerHTML = '';
  const tasks = gatherUpcomingTasks();

  if(tasks.length === 0){
    const empty = document.createElement('div');
    empty.className = 'muted';
    empty.textContent = 'No tasks yet — create a plan to generate milestones.';
    ui.taskList.appendChild(empty);
    return;
  }

  for(const t of tasks){
    const el = document.createElement('div');
    el.className = 'task';
    el.innerHTML = `
      <div>
        <div class="task__title">${escapeHtml(t.title)}</div>
        <div class="task__meta">${escapeHtml(t.meta)}</div>
      </div>
      <button class="btn btn--ghost task__btn" type="button">Add</button>
    `;

    el.querySelector('button').addEventListener('click', () => {
      addTaskToPlanner({ title: t.title, minutes: t.minutes, sourceMilestoneId: t.milestoneId, sourceTaskId: t.taskId });
      showToast('Added to your weekly planner');
    });

    // lightweight drag using pointer
    if(!prefersReduced){
      enableTaskDrag(el, t);
    }

    ui.taskList.appendChild(el);
  }
}

function enableTaskDrag(taskEl, task){
  let ghost = null;
  let dragging = false;

  taskEl.addEventListener('pointerdown', (e) => {
    if(e.button !== 0) return;
    if(e.target.closest('button')) return;

    dragging = true;
    taskEl.setPointerCapture(e.pointerId);

    ghost = taskEl.cloneNode(true);
    ghost.style.position = 'fixed';
    ghost.style.left = `${e.clientX}px`;
    ghost.style.top = `${e.clientY}px`;
    ghost.style.width = `${taskEl.getBoundingClientRect().width}px`;
    ghost.style.transform = 'translate3d(12px, 12px, 0)';
    ghost.style.pointerEvents = 'none';
    ghost.style.opacity = '0.92';
    ghost.style.zIndex = '999';
    document.body.appendChild(ghost);

    showSuggest(snapDuration(task.minutes));
  });

  taskEl.addEventListener('pointermove', (e) => {
    if(!dragging || !ghost) return;
    ghost.style.left = `${e.clientX}px`;
    ghost.style.top = `${e.clientY}px`;
  });

  taskEl.addEventListener('pointerup', (e) => {
    if(!dragging) return;
    dragging = false;

    const rect = ui.plannerBody.getBoundingClientRect();
    const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
    if(inside){
      const { dayIndex, minutes } = xyToDayAndMinutes(e.clientX, e.clientY);
      state.planner.blocks.push({
        id: uid(),
        title: task.title,
        dayIndex,
        startMinutes: clamp(minutes, HOURS_START*60, HOURS_END*60 - snapDuration(task.minutes)),
        durationMinutes: snapDuration(task.minutes),
        sourceMilestoneId: task.milestoneId,
        sourceTaskId: task.taskId,
      });
      saveState(state);
      renderBlocks();
      renderDashboard(true);
      showToast('Added to your weekly planner');
    }

    hideSuggest();
    ghost?.remove();
    ghost = null;
  });

  taskEl.addEventListener('pointercancel', () => {
    dragging = false;
    hideSuggest();
    ghost?.remove();
    ghost = null;
  });
}

function gatherUpcomingTasks(){
  const items = [];
  for(const m of timelineSorted()){
    const status = computeMilestoneStatus(m);
    if(status === 'done') continue;
    for(const t of (m.tasks ?? [])){
      if(t.done) continue;
      items.push({
        title: `${m.title}: ${t.title}`,
        minutes: t.minutes ?? 60,
        meta: `${formatDate(m.date)} · ${Math.round((t.minutes ?? 60)/60*10)/10}h`,
        milestoneId: m.id,
        taskId: t.id,
      });
    }
  }
  return items.slice(0, 10);
}

ui.clearWeekBtn.addEventListener('click', () => {
  state.planner.blocks = [];
  saveState(state);
  renderBlocks();
  renderDashboard(true);
  showToast('Cleared this week');
});

// Dashboard
function hoursPlanned(){
  const minutes = state.planner.blocks.reduce((sum,b) => sum + (b.durationMinutes ?? 0), 0);
  return minutes / 60;
}

function renderDashboard(animate){
  const completion = overallCompletion();
  const percent = Math.round(completion * 100);

  animateNumber(ui.completionNum, percent, animate);
  animateNumber(ui.streakNum, state.activity.streak, animate);
  animateNumber(ui.hoursNum, Math.round(hoursPlanned()*10)/10, animate);

  // ring
  const ring = document.querySelector('[data-ring="completion"] .ring__value');
  const circumference = 2 * Math.PI * 18;
  const target = circumference * (1 - completion);

  if(ring){
    ring.style.strokeDasharray = String(circumference);
    if(prefersReduced || !animate){
      ring.style.strokeDashoffset = String(target);
    }else{
      ring.style.transition = 'stroke-dashoffset 1.0s cubic-bezier(.22,1,.36,1)';
      requestAnimationFrame(() => { ring.style.strokeDashoffset = String(target); });
    }
  }

  renderBadges();
}

function animateNumber(node, value, animate){
  if(!node) return;
  if(prefersReduced || !animate){
    node.textContent = String(value);
    return;
  }

  const start = Number(node.textContent || '0');
  const end = Number(value);
  const dur = 1100;
  const t0 = performance.now();

  function step(now){
    const p = clamp((now - t0) / dur, 0, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    const current = start + (end - start) * eased;
    node.textContent = String(Number.isInteger(end) ? Math.round(current) : (Math.round(current*10)/10));
    if(p < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

const BADGE_DEFS = [
  { id:'starter', label:'Starter', threshold: 0.10 },
  { id:'steady', label:'Steady', threshold: 0.25 },
  { id:'builder', label:'Builder', threshold: 0.50 },
  { id:'closer', label:'Closer', threshold: 0.75 },
  { id:'finisher', label:'Finisher', threshold: 1.00 },
];

function renderBadges(){
  ui.badgeRow.innerHTML = '';
  const completion = overallCompletion();

  for(const b of BADGE_DEFS){
    const earned = state.badges.earned.includes(b.id) || completion >= b.threshold;
    const chip = document.createElement('span');
    chip.className = 'badgeChip' + (earned ? ' is-earned' : '');
    chip.textContent = b.label;
    ui.badgeRow.appendChild(chip);
  }
}

function maybeEarnBadges(){
  const completion = overallCompletion();
  let earnedNew = false;
  for(const b of BADGE_DEFS){
    if(completion >= b.threshold && !state.badges.earned.includes(b.id)){
      state.badges.earned.push(b.id);
      earnedNew = true;
    }
  }
  if(earnedNew){
    saveState(state);
    renderDashboard(true);
    if(!prefersReduced) confettiBurst();
  }
}

function confettiBurst(){
  const burst = document.createElement('div');
  burst.style.position = 'fixed';
  burst.style.left = '50%';
  burst.style.top = '18%';
  burst.style.width = '1px';
  burst.style.height = '1px';
  burst.style.zIndex = '120';
  burst.style.pointerEvents = 'none';
  document.body.appendChild(burst);

  const colors = ['var(--accent)','var(--accent-2)','var(--success)'];
  for(let i=0;i<16;i++){
    const p = document.createElement('span');
    p.style.position = 'absolute';
    p.style.width = '8px';
    p.style.height = '8px';
    p.style.borderRadius = '2px';
    p.style.background = colors[i % colors.length];
    p.style.opacity = '0.9';
    const ang = (Math.PI * 2 * i) / 16;
    const dist = 120 + Math.random()*60;
    const x = Math.cos(ang) * dist;
    const y = Math.sin(ang) * dist;

    p.animate([
      { transform:`translate3d(0,0,0) rotate(0deg)`, opacity:0.95 },
      { transform:`translate3d(${x}px, ${y}px, 0) rotate(${(Math.random()*260-130).toFixed(0)}deg)`, opacity:0 }
    ], { duration: 820, easing: 'cubic-bezier(.22,1,.36,1)', fill:'forwards' });

    burst.appendChild(p);
  }

  setTimeout(() => burst.remove(), 900);
}

function updateNextStep(){
  const tasks = gatherUpcomingTasks();
  if(tasks.length === 0){
    ui.nextStepCopy.textContent = 'Create a plan to see personalized suggestions.';
    return;
  }
  ui.nextStepCopy.textContent = `Next: ${tasks[0].title}`;
}

function markActivity(){
  const today = new Date().toISOString().slice(0,10);
  if(state.activity.lastDoneISO === today) return;

  const yesterday = new Date(Date.now() - 1000*60*60*24).toISOString().slice(0,10);
  if(state.activity.lastDoneISO === yesterday){
    state.activity.streak = (state.activity.streak ?? 0) + 1;
  }else{
    state.activity.streak = 1;
  }
  state.activity.lastDoneISO = today;
}

// Resources
const RESOURCES = [
  { title:'Write a 1-page goal brief', difficulty:'Easy', time:'10 min', desc:'Define your goal, constraints, and what “done” looks like. Keep it short so you can revisit weekly.', cta:'Start now' },
  { title:'Create a study block template', difficulty:'Easy', time:'15 min', desc:'Add 2–3 recurring weekly blocks (e.g., Tue/Thu 6–7pm). Consistency beats intensity.', cta:'Add blocks' },
  { title:'Portfolio audit checklist', difficulty:'Medium', time:'25 min', desc:'Review your projects for clarity: problem → approach → result. Add screenshots and measurable outcomes.', cta:'Open checklist' },
  { title:'Mock interview script', difficulty:'Medium', time:'30 min', desc:'Draft a short intro, STAR story bullets, and 5 questions to ask. Practice out loud once.', cta:'Practice' },
  { title:'Skill gap map', difficulty:'Hard', time:'45 min', desc:'List target roles, extract common skills, then map your gaps to weekly tasks with deadlines.', cta:'Map skills' },
  { title:'Networking micro-plan', difficulty:'Medium', time:'20 min', desc:'Pick 3 people, write 3 short messages, and schedule 1 follow-up this week.', cta:'Plan outreach' },
];

function renderResources(){
  ui.resourceGrid.innerHTML = '';
  for(const r of RESOURCES){
    const el = document.createElement('article');
    el.className = 'card resource';
    el.innerHTML = `
      <div class="resource__top">
        <div>
          <h3 class="h3">${escapeHtml(r.title)}</h3>
          <div class="resource__meta">
            <span class="chip">${escapeHtml(r.difficulty)}</span>
            <span class="chip">${escapeHtml(r.time)}</span>
          </div>
        </div>
        <button class="iconBtn" type="button" aria-label="Expand">
          <svg class="faqI" width="18" height="18" aria-hidden="true"><use href="#i-chevron"></use></svg>
        </button>
      </div>
      <div class="resource__body">${escapeHtml(r.desc)}</div>
      <div class="resource__actions">
        <button class="btn btn--primary" type="button">${escapeHtml(r.cta)}</button>
        <button class="btn btn--ghost" type="button">Save for later</button>
      </div>
    `;

    const toggle = () => {
      el.classList.toggle('is-open');
      el.querySelector('button.iconBtn')?.setAttribute('aria-expanded', el.classList.contains('is-open') ? 'true' : 'false');
    };

    el.querySelector('button.iconBtn').addEventListener('click', toggle);
    el.querySelectorAll('.btn').forEach(btn => btn.addEventListener('click', () => showToast('Saved — your plan’s updated')));
    ui.resourceGrid.appendChild(el);
  }
}

// Testimonials
const TESTIMONIALS = [
  { q:'“I stopped overplanning and started doing.”', a:'The timeline keeps my goals realistic, and the weekly blocks make it automatic.', who:'Aanya · 2nd-year student' },
  { q:'“The planner makes my week feel calmer.”', a:'I can see exactly when I’ll study, and the dashboard gives me momentum.', who:'Noah · final-year student' },
  { q:'“Milestones are finally clear.”', a:'Breaking things down into outcomes made the next steps obvious.', who:'Mei · first-year student' },
];

let carouselIndex = 0;
let carouselTimer = 0;

function renderCarousel(){
  ui.carouselViewport.innerHTML = '';
  for(const [i,t] of TESTIMONIALS.entries()){
    const el = document.createElement('div');
    el.className = 'testimonial' + (i===carouselIndex ? ' is-active' : '');
    el.innerHTML = `
      <p class="testimonial__q">${escapeHtml(t.q)}</p>
      <p class="testimonial__a">${escapeHtml(t.a)}</p>
      <div class="testimonial__who">${escapeHtml(t.who)}</div>
    `;
    ui.carouselViewport.appendChild(el);
  }
}

function setCarousel(idx){
  carouselIndex = (idx + TESTIMONIALS.length) % TESTIMONIALS.length;
  const nodes = ui.carouselViewport.querySelectorAll('.testimonial');
  nodes.forEach((n,i) => n.classList.toggle('is-active', i===carouselIndex));
}

function startCarousel(){
  clearInterval(carouselTimer);
  carouselTimer = window.setInterval(() => setCarousel(carouselIndex+1), 6000);
}

ui.prevTestimonial.addEventListener('click', () => { setCarousel(carouselIndex-1); startCarousel(); });
ui.nextTestimonial.addEventListener('click', () => { setCarousel(carouselIndex+1); startCarousel(); });
ui.carousel.addEventListener('mouseenter', () => clearInterval(carouselTimer));
ui.carousel.addEventListener('mouseleave', startCarousel);
ui.carousel.addEventListener('focusin', () => clearInterval(carouselTimer));
ui.carousel.addEventListener('focusout', startCarousel);

// FAQ
const FAQS = [
  { q:'Is this a real app?', a:'This is a static demo page with local-only storage (your browser). You can still create milestones, plan time, and track progress.' },
  { q:'How do I use the timeline?', a:'Scroll or drag to browse milestones. Click one to open details, check tasks off, and add the next task to your weekly planner.' },
  { q:'Does it work on mobile?', a:'Yes. The timeline becomes vertical and all interactions remain touch-friendly.' },
  { q:'What about reduced motion?', a:'If your system has “Reduce motion” enabled, non-essential animations are disabled or simplified.' },
];

function renderFAQ(){
  ui.faq.innerHTML = '';
  for(const f of FAQS){
    const wrap = document.createElement('div');
    wrap.className = 'card faqItem';
    const panelId = uid();

    wrap.innerHTML = `
      <button class="faqBtn" type="button" aria-expanded="false" aria-controls="${panelId}">
        <span class="faqQ">${escapeHtml(f.q)}</span>
        <svg class="faqI" width="18" height="18" aria-hidden="true"><use href="#i-chevron"></use></svg>
      </button>
      <div class="faqPanel" id="${panelId}" role="region" aria-hidden="true">
        <div class="faqA">${escapeHtml(f.a)}</div>
      </div>
    `;

    const btn = wrap.querySelector('button.faqBtn');
    const panel = wrap.querySelector('.faqPanel');

    const setOpen = (open) => {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.setAttribute('aria-hidden', open ? 'false' : 'true');
      // max-height for smooth animation
      if(open){
        const h = panel.scrollHeight;
        panel.style.maxHeight = `${h}px`;
      }else{
        panel.style.maxHeight = '0px';
      }
    };

    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      // simple accordion: close others
      ui.faq.querySelectorAll('.faqItem').forEach(item => {
        const b = item.querySelector('.faqBtn');
        const p = item.querySelector('.faqPanel');
        if(!b || !p) return;
        b.setAttribute('aria-expanded','false');
        p.setAttribute('aria-hidden','true');
        p.style.maxHeight = '0px';
      });
      setOpen(!open);
    });

    // initialize closed
    panel.style.maxHeight = '0px';
    ui.faq.appendChild(wrap);
  }
}

// Form
ui.goalForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const form = new FormData(ui.goalForm);
  const goalTitle = String(form.get('goalTitle') ?? '').trim();
  const date = String(form.get('milestoneDate') ?? '').trim();
  const outcomes = String(form.get('outcomes') ?? '').trim();
  const weeklyTime = Number(form.get('weeklyTime') ?? 0);
  const priority = String(form.get('priority') ?? '').trim();

  const ok = goalTitle.length >= 3 && date && outcomes.length >= 6 && weeklyTime >= 1 && priority;
  if(!ok){
    ui.goalForm.classList.remove('shake');
    // reflow to restart animation
    void ui.goalForm.offsetWidth;
    ui.goalForm.classList.add('shake');
    showToast('Fix the highlighted fields');
    highlightInvalid(ui.goalForm);
    return;
  }

  const m = {
    id: uid(),
    title: goalTitle,
    date,
    outcome: outcomes,
    weeklyHours: weeklyTime,
    priority,
    status: 'planned',
    tasks: generateTasksFromGoal(goalTitle, weeklyTime),
  };

  state.milestones.push(m);
  saveState(state);

  renderTimeline();
  renderTaskList();
  renderDashboard(true);
  updateNextStep();

  closeModal(ui.modal);
  ui.goalForm.reset();

  showToast('Saved — your plan’s updated');
});

function highlightInvalid(formEl){
  for(const input of formEl.querySelectorAll('input, textarea, select')){
    const required = input.hasAttribute('required');
    if(!required) continue;

    let valid = true;
    if(input.type === 'number'){
      const v = Number(input.value);
      valid = Number.isFinite(v) && v >= Number(input.min || 0);
    }else{
      valid = input.value.trim().length > 0;
    }

    input.style.borderColor = valid ? '' : 'rgba(239,68,68,.55)';
  }
}

function generateTasksFromGoal(title, weeklyHours){
  const mins = Math.max(60, Math.round(weeklyHours * 60 / 3));
  return [
    { id: uid(), title: 'Break down the milestone into 3 steps', minutes: Math.round(mins * 0.6), done: false },
    { id: uid(), title: 'Schedule 2 focused blocks this week', minutes: Math.round(mins * 1.0), done: false },
    { id: uid(), title: 'Ship one small artifact (note, draft, commit)', minutes: Math.round(mins * 0.7), done: false },
  ];
}

// Newsletter
ui.newsletter.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('newsEmail').value.trim();
  if(!email.includes('@')){
    ui.newsStatus.textContent = 'Please enter a valid email.';
    return;
  }
  ui.newsStatus.textContent = 'Subscribed ✓';
  showToast('Subscribed');
  ui.newsletter.reset();
});

// Escape
function escapeHtml(str){
  return String(str)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}

// Boot: simulate fetch with skeletons
function boot(){
  ui.timelineSkeleton.style.display = '';
  ui.plannerSkeleton.style.display = '';

  renderResources();
  renderCarousel();
  renderFAQ();

  renderPlannerBase();

  setTimeout(() => {
    ui.plannerSkeleton.style.display = 'none';
    renderBlocks();
  }, 420);

  setTimeout(() => {
    renderTimeline();
  }, 520);

  renderTaskList();
  renderDashboard(false);
  updateNextStep();

  maybeEarnBadges();
  startCarousel();
}

boot();

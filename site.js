/* ══════════════════════════════════════════════════════════
   MOTION / LESS — flow + the continuous dial
   Wires each movement to its own dial, handles scroll reveal,
   the submit → reward loop, and reduced-motion.
   The `submit` currently logs to the console — that's where a
   backend (e.g. Supabase) will POST the values later.
   ══════════════════════════════════════════════════════════ */
(function(){
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state = {};                 // { fall: 3.0, bloom: 3.0, pulse: 3.0, flow: 3.0 }
  const started = performance.now();
  let firstMove = null;

  /* ── build a movement + its dial for each section ── */
  document.querySelectorAll('.movement').forEach(section => {
    const kind = section.dataset.movement;
    const canvas = section.querySelector('canvas');
    const mv = new MOTIONLESS.Movement(canvas, kind);
    mv.level = REDUCED ? 0 : 3;      // reduced-motion → start static
    state[kind] = mv.level;
    makeDial(section.querySelector('[data-dial]'), mv, kind);
  });

  /* ── the dial: a continuous slider with four marked stops ──
       the draggable rail is inset from the column edges, so the
       03 and 00 ticks and the handle sit fully inside the panel   */
  function makeDial(el, mv, kind){
    const stops = ['03','02','01','00'];         // left = max, right = static
    el.innerHTML =
      '<span class="cap">Motion</span><span class="read"></span>' +
      '<div class="rail" tabindex="0" role="slider" aria-label="Amount of motion" ' +
      'aria-valuemin="0" aria-valuemax="3" aria-valuenow="3">' +
        '<div class="track"></div><div class="fill"></div>' +
        stops.map((s,i)=>`<div class="tick" style="left:${i/3*100}%"><span>${s}</span></div>`).join('') +
        '<div class="handle"></div>' +
      '</div>';
    const rail   = el.querySelector('.rail');
    const handle = el.querySelector('.handle');
    const fill   = el.querySelector('.fill');
    const read   = el.querySelector('.read');
    const ticks  = [...el.querySelectorAll('.tick')];

    // value 0..3 (3 = maximal on the LEFT). position 0..1 across the rail.
    function setFromPos(clientX){
      const r = rail.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (clientX - r.left) / r.width));   // 0 left .. 1 right
      apply(3 * (1 - p));                                                 // left=3, right=0
      markMoved();
    }
    function apply(value){
      value = Math.min(3, Math.max(0, value));
      const p = 1 - value/3;
      mv.level = value; state[kind] = +value.toFixed(2);
      handle.style.left = (p*100) + '%';
      fill.style.left = 0; fill.style.width = (p*100) + '%';
      read.textContent = value.toFixed(1);
      rail.setAttribute('aria-valuenow', value.toFixed(1));
      // highlight the nearest marked stop
      const nearest = Math.round(p*3);
      ticks.forEach((tk,i) => tk.classList.toggle('on', i === nearest));
    }
    function markMoved(){
      if (firstMove === null) firstMove = Math.round((performance.now()-started)/1000);
    }
    apply(mv.level);                                  // start position

    let dragging = false;
    const down = e => { dragging = true; rail.focus(); setFromPos(pointX(e)); e.preventDefault(); };
    const move = e => { if (dragging) setFromPos(pointX(e)); };
    const up   = () => { dragging = false; };
    rail.addEventListener('pointerdown', down);
    addEventListener('pointermove', move);
    addEventListener('pointerup', up);
    function pointX(e){ return e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0].clientX); }

    // keyboard: the dial is the point of the project, so it has to be reachable
    // without a mouse. left/right nudge, home/end jump to the extremes.
    rail.addEventListener('keydown', e => {
      const step = e.shiftKey ? 1 : 0.1;
      let v = mv.level;
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   v += step;
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') v -= step;
      else if (e.key === 'Home') v = 3;
      else if (e.key === 'End')  v = 0;
      else return;
      e.preventDefault(); apply(v); markMoved();
    });
  }

  /* ── scroll reveal ── */
  document.querySelectorAll('.pane, .rv').forEach(el => el.classList.add('rv'));
  const io = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
  }, { threshold: 0.12 });
  document.querySelectorAll('.rv').forEach(el => io.observe(el));
  document.getElementById('landing')?.classList.add('in');   // landing visible immediately

  /* ── submit → reward ── */
  const form = document.getElementById('survey');
  form?.addEventListener('submit', e => {
    e.preventDefault();
    const data = {
      dials: state,                                   // exact value per movement
      timeToFirstMove: firstMove,
      designer: form.designer.value || null,
      sensitive: form.sensitive.value || null,
      reducedMotion: REDUCED,
      ts: new Date().toISOString()
    };
    console.log('[motionless] submission →', data);   // TODO: POST to backend (Supabase)
    showReward(data);
  });

  function showReward(){
    const grid = document.getElementById('rewardGrid');
    const others = { fall: 0.6, bloom: 1.8, pulse: 0.5, flow: 2.5 };   // placeholder averages
    const names = { fall:'The fall', bloom:'The bloom', pulse:'The pulse', flow:'The flow' };
    grid.innerHTML = Object.keys(names).map(k => {
      const you = (+state[k]).toFixed(1), avg = others[k].toFixed(1);
      return `<div class="reward-card">
        <div class="name">${names[k]}</div>
        <div class="stat">you ${you} · others avg ${avg}</div>
      </div>`;
    }).join('');
    const r = document.getElementById('reward');
    r.hidden = false; r.scrollIntoView({behavior: REDUCED?'auto':'smooth', block:'start'});
    document.getElementById('rewardHead').textContent =
      (+state.flow > +state.fall && +state.flow > +state.pulse)
        ? "You kept the motion that answers you and cut the rest." : "Here's what you kept.";
  }

  /* hide the scroll cue once you move */
  addEventListener('scroll', () => {
    const cue = document.getElementById('cue');
    if (cue && scrollY > 40) cue.style.opacity = 0;
  }, { passive:true });
})();

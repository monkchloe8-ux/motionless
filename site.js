/* ══════════════════════════════════════════════════════════
   MOTION / LESS — flow + the continuous dial
   Wires each movement to its own dial, handles scroll reveal,
   the submit → reward loop, and reduced-motion.
   The `submit` currently logs to the console — that's where a
   backend (e.g. Supabase) will POST the values later.
   ══════════════════════════════════════════════════════════ */
(function(){
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── the intro ──
     it has to be dismissed before the page can be scrolled, because testers
     went straight past the written instructions and did not realise the
     slider position was the thing being recorded. */
  const intro = document.getElementById('intro');
  if (intro){
    document.body.classList.add('intro-open');
    const go = document.getElementById('introGo');
    const close = () => {
      intro.hidden = true;
      document.body.classList.remove('intro-open');
      document.getElementById('landing')?.focus?.();
    };
    go?.addEventListener('click', close);
    // keyboard: enter or escape both get you out, and focus starts on the button
    intro.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    setTimeout(() => go?.focus(), 50);
  }
  const state   = {};   // where each dial ended up
  const touched = {};   // did they move it at all, or is this just the default?
  const dwell   = {};   // seconds spent with each movement on screen
  const started = performance.now();
  let firstMove = null;

  /* ── shuffle the order ──
     everyone used to meet the fall first with fresh attention and the flow last
     when they were bored of scrolling. that order effect was baked into every
     response. now the order is random per visitor and recorded with the data. */
  const main = document.querySelector('main');
  const sections = Array.from(document.querySelectorAll('.movement'));
  const order = sections.slice().sort(() => Math.random() - 0.5);
  const submitSection = document.getElementById('submit');
  order.forEach((s, i) => {
    main.insertBefore(s, submitSection);
    const tag = s.querySelector('.tag');
    if (tag) tag.textContent = 'Movement 0' + (i + 1);
  });
  const shownOrder = order.map(s => s.dataset.movement).join(' > ');

  /* ── build a movement + its dial for each section ── */
  document.querySelectorAll('.movement').forEach(section => {
    const kind = section.dataset.movement;
    const canvas = section.querySelector('canvas');
    const mv = new MOTIONLESS.Movement(canvas, kind);
    // starts still. testers arriving at full motion never attempted to read the
    // paragraph, and a dial that starts at maximum anchors every answer upward.
    mv.level = 0;
    state[kind] = 0;
    touched[kind] = false;
    dwell[kind] = 0;
    makeDial(section.querySelector('[data-dial]'), mv, kind);

    // how long this movement was actually on screen, as a second measure of
    // whether high motion costs attention
    let since = null;
    if (window.IntersectionObserver){
      new IntersectionObserver(es => {
        const vis = es[0].isIntersecting;
        if (vis && since === null) since = performance.now();
        else if (!vis && since !== null){
          dwell[kind] += (performance.now() - since) / 1000;
          since = null;
        }
      }, { threshold: 0.5 }).observe(section);
      addEventListener('beforeunload', () => {
        if (since !== null) dwell[kind] += (performance.now() - since) / 1000;
      });
    }
  });

  /* ── the dial: a continuous slider with four marked stops ──
       the draggable rail is inset from the column edges, so the
       03 and 00 ticks and the handle sit fully inside the panel   */
  function makeDial(el, mv, kind){
    const stops = ['03','02','01','00'];         // left = max, right = static
    el.innerHTML =
      '<span class="cap">How much motion do you want here?</span><span class="read"></span>' +
      '<div class="rail" tabindex="0" role="slider" ' +
      'aria-label="How much motion you want in this movement. It starts still. ' +
      'Turn it up to as much as you would want, then leave it there." ' +
      'aria-valuemin="0" aria-valuemax="3" aria-valuenow="0">' +
        '<div class="track"></div><div class="fill"></div>' +
        stops.map((s,i)=>`<div class="tick" style="left:${i/3*100}%"><span>${s}</span></div>`).join('') +
        '<div class="handle"></div>' +
      '</div>' +
      // testers did not realise the position they left it in was the answer
      '<p class="dial-note">Starts still. Turn it up to as much as you would want, then leave it there. That is what gets recorded.</p>';
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
      touched[kind] = true;     // distinguishes a choice from an untouched default
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
      touched: touched,                               // false = never moved, not a choice
      dwell: dwell,                                   // seconds each movement was on screen
      shownOrder: shownOrder,                         // the random order they saw
      startedAt: 0,                                   // every dial now starts still
      timeToFirstMove: firstMove,
      designer: form.designer.value || null,
      sensitive: form.sensitive.value || null,
      // 'mismatch' is the answer the paragraph actually gives. 'notread' is an
      // honest option and counts as data, not as a wrong answer.
      recall: form.recall.value || null,
      recallCorrect: form.recall.value === 'mismatch' ? 'yes'
                   : form.recall.value === 'notread' ? 'did not read'
                   : form.recall.value ? 'no' : null,
      reducedMotion: REDUCED,
      ts: new Date().toISOString()
    };
    const endpoint = window.MOTIONLESS_ENDPOINT;
    if (endpoint){
      // text/plain keeps the browser from sending a preflight request that
      // Apps Script will not answer. the script reads the body regardless.
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data)
      }).catch(err => console.warn('[motionless] could not save:', err));
    } else {
      console.log('[motionless] not saved (no endpoint set) →', data);
    }
    // the reward shows either way — a dropped response is our problem, not theirs
    showReward(data);
  });

  const NAMES = { fall:'The fall', bloom:'The bloom', pulse:'The pulse', flow:'The flow' };

  function drawReward(avgs, n){
    document.getElementById('rewardGrid').innerHTML = Object.keys(NAMES).map(k => {
      const you = (+state[k]).toFixed(1);
      // only claim what other people chose if other people have actually chosen.
      // a made-up average would be a lie told to someone helping with research.
      const other = (avgs && n >= 5 && avgs[k] !== undefined)
        ? ' · others avg ' + (+avgs[k]).toFixed(1)
        : '';
      return `<div class="reward-card">
        <div class="name">${NAMES[k]}</div>
        <div class="stat">you ${you}${other}</div>
      </div>`;
    }).join('');
    const note = document.querySelector('#reward .note');
    if (note){
      note.textContent = (n >= 5)
        ? 'Based on ' + n + ' responses so far.'
        : 'Yours is one of the first responses. Comparisons appear once a few more come in.';
    }
  }

  function showReward(){
    drawReward(null, 0);                                  // show your own numbers straight away
    const r = document.getElementById('reward');
    r.hidden = false; r.scrollIntoView({behavior: REDUCED?'auto':'smooth', block:'start'});
    document.getElementById('rewardHead').textContent =
      (+state.flow > +state.fall && +state.flow > +state.pulse)
        ? "You kept the motion that answers you and cut the rest." : "Here's what you kept.";

    // then fill in the real comparison if the sheet has enough in it
    const endpoint = window.MOTIONLESS_ENDPOINT;
    if (!endpoint) return;
    fetch(endpoint).then(x => x.json()).then(d => {
      if (d && d.n) drawReward(d.avg, d.n);
    }).catch(() => {});                                   // silence: the visitor still has their result
  }

  /* hide the scroll cue once you move */
  addEventListener('scroll', () => {
    const cue = document.getElementById('cue');
    if (cue && scrollY > 40) cue.style.opacity = 0;
  }, { passive:true });
})();

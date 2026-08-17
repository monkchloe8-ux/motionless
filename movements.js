/* ══════════════════════════════════════════════════════════
   MOTION / LESS — movement renderers
   Each movement draws to a <canvas> and reads a continuous
   `level` 0 (static / 00) → 3 (maximal / 03).  t = level/3.
   Movements also track the pointer, so some react to your cursor.
   Every composition is centred on the canvas: draw from cx,cy
   or from a grid that divides the box evenly.
   ══════════════════════════════════════════════════════════ */
(function(){
  const INK = 'rgba(239,239,234,';
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const TAU = Math.PI * 2;
  const registry = [];

  class Movement {
    constructor(canvas, kind){
      this.canvas = canvas; this.ctx = canvas.getContext('2d');
      this.kind = kind; this.level = 3;               // starts maximal; dial tunes it
      this.px = null; this.py = null;                 // pointer, in canvas space
      canvas.addEventListener('pointermove', e => {
        const r = canvas.getBoundingClientRect();
        this.px = (e.clientX - r.left) * DPR;
        this.py = (e.clientY - r.top)  * DPR;
      });
      canvas.addEventListener('pointerleave', () => { this.px = this.py = null; });
      // the readable content sitting over this stage — real HTML, moved by
      // the same `level`, so what people rate is motion *while reading*.
      this.content = canvas.parentElement
        ? canvas.parentElement.querySelector('.content') : null;
      this.size();
      // the stage is flex/aspect-ratio sized, so watch the element itself,
      // not just the window — otherwise the canvas ends up mis-scaled and
      // everything inside it looks off-centre.
      if (window.ResizeObserver){
        new ResizeObserver(() => this.size()).observe(canvas);
      } else {
        addEventListener('resize', () => this.size());
      }
      registry.push(this);
    }
    size(){
      const r = this.canvas.getBoundingClientRect();
      const w = Math.max(2, Math.round(r.width  * DPR));
      const h = Math.max(2, Math.round(r.height * DPR));
      if (w === this.w && h === this.h) return;
      this.w = this.canvas.width  = w;
      this.h = this.canvas.height = h;
    }

    draw(time){
      const ctx = this.ctx, w = this.w, h = this.h;
      const cx = w/2, cy = h/2;                       // the true centre — draw from here
      const t = this.level/3;                         // 0..1 amount of motion
      const minD = Math.min(w,h);
      ctx.clearRect(0,0,w,h);

      /* ── THE FALL — one-point perspective you are pulled down
            (harm · the body). The vanishing point drifts and the whole
            field rolls: that mismatch is what makes people sick. ── */
      if (this.kind === 'fall'){
        const m = t;
        // the vanishing point wanders — the horizon never settles
        const vpx = cx + Math.sin(time/1700)*w*0.11*m + Math.sin(time/730)*w*0.03*m;
        const vpy = cy + Math.sin(time/2300)*h*0.09*m + Math.cos(time/610)*h*0.03*m;
        ctx.save();
        ctx.translate(cx,cy);
        ctx.rotate(Math.sin(time/1900)*0.11*m);          // roll
        const zo = 1 + Math.sin(time/540)*0.06*m;        // lurch
        ctx.scale(zo,zo);
        ctx.translate(-cx,-cy);

        // the corridor: frames rushing out past you
        const N = 26;
        const speed = m>0 ? time*(0.000055 + 0.00042*m) : 0.34;
        ctx.lineWidth = 1.1*DPR;
        for (let i=0;i<N;i++){
          const d = ((i/N) + speed) % 1;
          const k = d*d*d;                                // ease: slow far, fast near
          const x0 = vpx + (0 - vpx)*k, y0 = vpy + (0 - vpy)*k;
          const x1 = vpx + (w - vpx)*k, y1 = vpy + (h - vpy)*k;
          ctx.strokeStyle = INK + (Math.min(1,k*3.2)*(0.20+0.34*m)) + ')';
          ctx.strokeRect(x0,y0,x1-x0,y1-y0);
        }
        // the perspective lines holding it together
        ctx.lineWidth = 0.8*DPR;
        ctx.strokeStyle = INK + (0.10 + 0.12*m) + ')';
        [[0,0],[w,0],[w,h],[0,h]].forEach(([x,y])=>{
          ctx.beginPath(); ctx.moveTo(vpx,vpy); ctx.lineTo(x,y); ctx.stroke();
        });

        // layers of rule lines sliding at different rates — the parallax
        // mismatch, the thing that actually causes the discomfort
        for (let L=0; L<3; L++){
          const rate = (0.10 + L*0.13);
          const rows = 7 + L*3;
          const off  = m>0 ? (time/1000*rate*m*260) % (h/rows) : 0;
          ctx.strokeStyle = INK + (0.05 + 0.09*m + L*0.015) + ')';
          ctx.lineWidth = (1.4 - L*0.35)*DPR;
          for (let r=-1;r<=rows;r++){
            const y = r*(h/rows) + off;
            const inset = w*(0.08 + L*0.13);
            ctx.beginPath(); ctx.moveTo(inset,y); ctx.lineTo(w-inset,y); ctx.stroke();
          }
        }
        ctx.restore();

        // the horizon marker stays put, so you can feel everything else move
        ctx.strokeStyle = INK+'0.55)'; ctx.lineWidth = 1*DPR;
        const tick = minD*0.028;
        ctx.beginPath();
        ctx.moveTo(cx-tick,cy); ctx.lineTo(cx+tick,cy);
        ctx.moveTo(cx,cy-tick); ctx.lineTo(cx,cy+tick);
        ctx.stroke();
      }

      /* ── THE BLOOM — decorative flower + growth off every edge
            (contested · delight) ── */
      else if (this.kind === 'bloom'){
        /* ---- growth coming in off the four sides of the box ---- */
        const edgeStem = (ex,ey,nx,ny,seed,reach)=>{
          const sway = Math.sin(time/430 + seed*1.7) * 0.5 * t;
          const grow = reach * (0.32 + 0.68*(0.5+0.5*Math.sin(time/700 + seed))*t + 0.10*t);
          // perpendicular to the inward normal, for the S-curve + tip offset
          const tx = -ny, ty = nx;
          const midX = ex + nx*grow*0.55 + tx*grow*0.28*sway;
          const midY = ey + ny*grow*0.55 + ty*grow*0.28*sway;
          const endX = ex + nx*grow      + tx*grow*0.16*sway;
          const endY = ey + ny*grow      + ty*grow*0.16*sway;
          ctx.strokeStyle = INK + (0.16 + 0.16*t) + ')';
          ctx.lineWidth = 1.1*DPR; ctx.lineCap='round';
          ctx.beginPath(); ctx.moveTo(ex,ey); ctx.quadraticCurveTo(midX,midY,endX,endY); ctx.stroke();
          // little leaves along the stem
          for (let L=1; L<=2; L++){
            const f = L/3;
            const lx = ex + (endX-ex)*f + (midX-ex)*0.18;
            const ly = ey + (endY-ey)*f + (midY-ey)*0.18;
            const lr = minD*0.014*(1+0.5*t);
            ctx.beginPath();
            ctx.ellipse(lx,ly,lr*2.1,lr, Math.atan2(endY-ey,endX-ex)+0.6, 0, TAU);
            ctx.fillStyle = INK + (0.12 + 0.14*t) + ')'; ctx.fill();
          }
          // bud at the tip, opening with the motion
          const br = minD*0.017*(0.7 + 0.9*t*(0.5+0.5*Math.sin(time/380+seed)));
          ctx.beginPath(); ctx.arc(endX,endY,br,0,TAU);
          ctx.fillStyle = INK + (0.30 + 0.30*t) + ')'; ctx.fill();
        };
        const perSide = 5;
        for (let i=0;i<perSide;i++){
          const f = (i+0.5)/perSide;                        // evenly spaced, symmetric
          edgeStem(0,    h*f, 1, 0, i,        w*0.30);      // left edge  → in
          edgeStem(w,    h*f,-1, 0, i+11.3,   w*0.30);      // right edge → in
          edgeStem(w*f,  0,   0, 1, i+23.7,   h*0.30);      // top edge   → down
          edgeStem(w*f,  h,   0,-1, i+37.1,   h*0.30);      // bottom     → up
        }

        /* ---- the flower, dead centre ---- */
        const spin    = t>0 ? time/1000 * t * 2.0 : 0;
        const breathe = t>0 ? (0.5+0.5*Math.sin(time/340 - 1.4)) : 0;
        const open    = 0.5 + 0.5 * (0.3 + breathe*t);
        const pulse   = 1 + (t>0 ? Math.sin(time/300)*0.16*t : 0);
        ctx.save(); ctx.translate(cx,cy); ctx.rotate(spin*0.5); ctx.scale(pulse,pulse);
        const petal = (ang,r0,len,wid,alpha)=>{
          ctx.save(); ctx.rotate(ang);
          ctx.beginPath(); ctx.ellipse(r0+len/2,0,len/2,wid/2,0,0,TAU);
          ctx.fillStyle = INK+alpha+')'; ctx.fill(); ctx.restore();
        };
        for (let i=0;i<10;i++) petal(i/10*TAU,       minD*0.05, minD*0.38*open, minD*0.14, 0.30);
        for (let j=0;j<10;j++) petal(j/10*TAU+0.314, minD*0.03, minD*0.27*open, minD*0.11, 0.38);
        for (let k=0;k<6;k++)  petal(k/6*TAU+0.5,    minD*0.02, minD*0.16*open, minD*0.075,0.5);
        ctx.restore();

        /* ---- drifting particles, centred on the flower ---- */
        const N = 54;
        for (let c=0;c<N;c++){
          const a = c*2.399963, base = minD*0.05*Math.sqrt(c/N);
          const drift = t>0 ? (time/520 + c)*t : 0;
          const rr = base + (t>0 ? (Math.sin(drift)*0.5+0.5)*minD*0.32*t : 0);
          const x = cx+Math.cos(a+drift*0.3)*rr, y = cy+Math.sin(a+drift*0.3)*rr;
          ctx.beginPath(); ctx.arc(x,y,1.6*DPR,0,TAU);
          ctx.fillStyle = INK + (0.8 - t*0.3) + ')'; ctx.fill();
        }
      }

      /* ── THE PULSE — flare in the corner of your eye
            (harm · attention). Nothing here touches the words: the blocks
            stay out at the edges and simply take your eye off the line you
            were on. Peripheral motion is the most effective way to do that
            and the hardest to ignore. At 00 it is a still, even grid.  ── */
      else if (this.kind === 'pulse'){
        const m = t;
        const target = Math.max(34*DPR, minD/7);
        const cols = Math.max(3, Math.round(w/target));
        const rows = Math.max(3, Math.round(h/target));
        const gx = w/cols, gy = h/rows;
        const inset = Math.min(gx,gy)*0.11;
        const period = 2100 - m*1650;
        ctx.lineWidth = 1*DPR;
        for (let j=0;j<rows;j++){
          for (let i=0;i<cols;i++){
            // staggered, plus a slow sweep so the flares travel across
            const seed = ((i*7 + j*13) % 17)/17;
            const sweep = ((i/cols) + (j/rows)) * 0.5;
            const ph = m>0 ? ((time/period) + seed*1.7 + sweep*0.9) % 1 : 0.5;
            const flare = m>0 ? Math.pow(1-ph, 5) : 0;

            // quiet in the middle where the paragraph is, loud at the edges
            const ox = (i+0.5)/cols - 0.5, oy = (j+0.5)/rows - 0.5;
            const edge = Math.min(1, Math.hypot(ox*2, oy*2)/0.9);
            const periph = 0.14 + 0.86*Math.pow(edge, 1.7);

            const cxx = i*gx + gx/2, cyy = j*gy + gy/2;
            const bw = (gx - inset*2) * (1 + flare*0.10*m);
            const bh = (gy - inset*2) * (1 + flare*0.10*m);
            const x0 = cxx - bw/2, y0 = cyy - bh/2;

            ctx.fillStyle = INK + (0.035 + flare*0.72*m*periph).toFixed(3) + ')';
            ctx.fillRect(x0, y0, bw, bh);
            ctx.strokeStyle = INK + (0.09 + 0.13*m*periph).toFixed(3) + ')';
            ctx.strokeRect(x0, y0, bw, bh);
          }
        }
      }

      /* ── THE FLOW — a field that answers your cursor (help · responsive) ── */
      else if (this.kind === 'flow'){
        const m = t;
        // divide the box into whole cells so the grid is centred with equal
        // margins on all four sides, instead of trailing off one edge.
        const target = Math.max(26*DPR, minD/14);
        const cols = Math.max(3, Math.round(w/target));
        const rows = Math.max(3, Math.round(h/target));
        const gx = w/cols, gy = h/rows;
        const cell = Math.min(gx,gy);
        const px = this.px==null ? cx : this.px;
        const py = this.py==null ? cy : this.py;
        const hasCursor = this.px!=null;
        ctx.lineWidth = 1.4*DPR; ctx.lineCap = 'round';
        for (let j=0;j<rows;j++){
          for (let i=0;i<cols;i++){
            const x = (i+0.5)*gx, y = (j+0.5)*gy;
            let ang;
            if (m>0){
              const toCursor = Math.atan2(py-y, px-x);
              const wave = Math.sin(x/110 + y/110 + time/600) * 1.3 * m;
              ang = toCursor*(hasCursor?1:0.3) + wave;
            } else { ang = 0; }                         // at rest: a neat, still grid
            const d = Math.hypot(px-x, py-y);
            const near = hasCursor ? Math.max(0, 1 - d/(minD*0.5)) : 0;
            const len = cell*0.40*(1 + near*0.45*m);
            ctx.strokeStyle = INK + (0.28 + 0.5*near) + ')';
            ctx.beginPath();
            ctx.moveTo(x-Math.cos(ang)*len, y-Math.sin(ang)*len);
            ctx.lineTo(x+Math.cos(ang)*len, y+Math.sin(ang)*len);
            ctx.stroke();
          }
        }
      }

      this.moveContent(time, t);
    }

    /* ── how each movement treats the words ──────────────────────
       fall  : the text rides the whole disorienting field
       bloom : decoration around it; the text barely moves
       pulse : leaves the words alone, and takes your eye off them anyway
       flow  : it answers the cursor without ever moving the words
       At 00 every one of them resolves to no transform at all.     */
    moveContent(time, m){
      const el = this.content; if (!el) return;
      if (m <= 0.001){ el.style.transform = 'none'; el.style.opacity = 1; return; }
      const minD = Math.min(this.w, this.h) / (Math.min(window.devicePixelRatio||1,2));
      let tf = 'none', op = 1;

      if (this.kind === 'fall'){
        const rot = Math.sin(time/1900)*6.3*m;                 // deg — matches the roll
        const sc  = 1 + Math.sin(time/540)*0.055*m;            // the lurch
        const dx  = Math.sin(time/1700)*minD*0.055*m;
        const dy  = Math.sin(time/2300)*minD*0.045*m;
        tf = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
      }
      else if (this.kind === 'bloom'){
        const sc = 1 + Math.sin(time/340 - 1.4)*0.012*m;       // breathes with the flower
        const dy = Math.sin(time/700)*minD*0.008*m;
        tf = `translateY(${dy.toFixed(2)}px) scale(${sc.toFixed(4)})`;
      }
      else if (this.kind === 'pulse'){
        // deliberately nothing. The paragraph never moves — the cost here is
        // your attention, not your ability to read the line in front of you.
        tf = 'none';
      }
      else if (this.kind === 'flow'){
        // leans a little toward you — never enough to disturb the line you are on
        const DPRv = Math.min(window.devicePixelRatio||1,2);
        const cx = this.w/2, cy = this.h/2;
        const dx = this.px==null ? 0 : ((this.px-cx)/DPRv)*0.018*m;
        const dy = this.py==null ? 0 : ((this.py-cy)/DPRv)*0.018*m;
        tf = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px)`;
      }
      el.style.transform = tf;
      el.style.opacity = op;
    }
  }

  function loop(time){ for (const m of registry) m.draw(time); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
  window.MOTIONLESS = { Movement, registry };
})();

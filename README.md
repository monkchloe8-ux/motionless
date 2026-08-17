# MOTION / LESS — site base

The working foundation for the capstone site. Plain HTML / CSS / JavaScript —
no build tools, no installs. Open `index.html` in a browser and it runs.

## What's here

```
index.html        the experience: landing → 4 movements (with dials) → submit → reward
findings.html     live results page (placeholder data for now)
about.html        why it exists + colophon
style.css       all styling — dark, specimen aesthetic
movements.js   the four movement visuals (canvas), driven by a level 0–3
site.js        the flow: builds each dial, scroll reveal, submit → reward, reduced-motion
```

## How it works (the important bit)

- Each movement has its **own continuous dial**, marked 03 (maximal) → 00 (static).
- Dragging a dial sets that movement's `level` (0–3); the canvas re-renders live.
- On **submit**, the exact dial values + survey answers are collected. Right now they
  print to the browser console — that's the exact spot to POST them to a backend
  (Supabase or similar) once you set one up. Search `TODO` in `js/site.js`.
- **Reduced motion:** if the visitor's system asks for less motion, every dial starts
  at 00 and nothing autoplays.

## To run

Just open `index.html`. (If your browser blocks the canvas/text on `file://`,
run a tiny local server: `python3 -m http.server` in this folder, then visit
`http://localhost:8000`.)

## Next steps to build on this base

1. **Replace the canvas placeholders** with the real motion — animate the 03 state in
   After Effects, export Lottie, and drive it from the same `level` value.
2. **Make the fall scroll-driven** (real parallax) rather than auto-animated.
3. **Make the dial feel great** — weight, easing, a satisfying submit. It's the hero interaction.
4. **Wire up the backend** so submissions save and `findings.html` reads real data.
5. **Polish Level 3** until it's genuinely gorgeous — the experiment needs the temptation to be real.

## The content is the constant

Every stage holds the **same paragraph**: same words, same size, same spacing.
Only what the motion does to it changes. So what a visitor is rating is not "do I like
this animation", it's "can I still read this while that is happening", which is
the question the project is actually about.

Every word is its own element, so each movement takes hold of the text itself
rather than sliding a finished block of it around. It is still real HTML, not text
drawn into the canvas, so it stays selectable and readable to a screen reader at
every level of the dial, and every word returns exactly to its set position at 00.

Each movement treats the words differently — that difference is the finding:

- **the fall** shears each line off on its own depth, so you lose your place between lines
- **the bloom** breathes the words outward in the same radial wave as the petals
- **the pulse** flares words out of turn and dims the ones you are not on
- **the flow** leans every word toward your cursor, the way the field does

## The four movements

| | movement | what it costs | where it sits |
|---|---|---|---|
| 01 | **The fall** | the body — depth that moves your whole field of view | harm |
| 02 | **The bloom** | nothing, arguably — beautiful motion that does no work | contested |
| 03 | **The pulse** | attention — a beat that keeps pulling your eye back | harm |
| 04 | **The flow** | nothing — it answers your cursor instead of demanding you | help |

## Decisions baked in

- Nothing is ever hidden by motion. Turn any dial to 00 and you get a composed still
  version, never a broken or empty one.
- Every dial is keyboard-reachable (tab to it, arrow keys to move, shift+arrow for a
  bigger step, home/end for the extremes) and announces itself as a slider. The control
  the project is about has to be usable by the people the project is about.

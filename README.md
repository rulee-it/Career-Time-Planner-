# Time-Management for Career-Planning (Single Page)

A static, mobile-first career-planning page with an interactive roadmap timeline, weekly time planner, and progress dashboard.

## Run

Open `index.html` directly, or run a small local server:

```powershell
npm run dev
```

## Build (optional minified output)

```powershell
npm install
npm --prefix tools install
npm run build
```

Outputs:
- `dist/index.html`
- `dist/styles.min.css`
- `dist/app.min.js` + sourcemap

## Design system (CSS variables)

Edit in `styles.css`:
- `--accent`: primary brand accent (deep teal/royal blue)
- `--success`: success green
- neutrals + surfaces
- `--dur-*` and `--ease-*` for motion tuning

## Accessibility

- Keyboard reachable interactive elements (timeline items, modals, accordions)
- ARIA: modal `aria-modal`, timeline as `role="list"`
- `prefers-reduced-motion` supported via `.reduced-motion`

## Where to tweak timings

- `styles.css` → `:root` motion tokens
- `app.js` → constants near top for stagger/duration

## Notes

A short demo GIF/video can’t be generated here automatically; record a 15–20s screen capture showing:
- timeline line draw
- milestone click → detail panel
- planner drag/drop
- dashboard progress ring animation

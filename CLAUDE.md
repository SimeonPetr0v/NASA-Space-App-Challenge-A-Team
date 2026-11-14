# Project context for Claude (shared by the whole team)

NASA Space Apps Challenge 2026 (14–15 Nov 2026) — challenge **"Create Health Monitoring Software for Astronauts on Space Missions"**.
Team of 6, one GitHub repo. Team chat is in Bulgarian; reply to teammates in Bulgarian. **Everything judges see is English**: UI text, README, commits, PRs, project page, slides, subtitles.

## What we are building
A visual self-assessment tool: astronaut logs health indicators → engine compares to ranges and personal baseline → normal / caution / danger → concrete guidance → escalation to crew medical officer / flight surgeons. It **does not diagnose**.

## Skills in `.claude/skills/` — load the right one before working
- `spaceapps-rules` — rules, rubric, limits, project page fields
- `astro-health-science` — RIDGE, indicators, thresholds, guidance, citations
- `astro-ui-design` — design system and UI review checklist (load for any UI work)
- `frontend-design` — general distinctive-design process (from anthropics/skills, Apache-2.0)
- `team-git-workflow` — branches, PRs, ownership, deploy
- `pitch-and-demo` — 30 s video / 7 slides / project page texts
- `submission-check` — pre-submit audit
- `webapp-testing` — Playwright UI testing (from anthropics/skills, Apache-2.0; needs Python + Playwright)

### Design skills from the community (vendored, unmodified unless noted)
- `impeccable` (pbakaus/impeccable, Apache-2.0) — design vocabulary + reviewer. Use `/impeccable critique <target>` and `/impeccable audit <target>` on every major screen; `/impeccable polish` before the demo. Our app is **Operate** mode (dashboard/tool). Its launcher downloads a checksum-verified engine binary from GitHub releases on first run; if that is blocked it falls back to reading PRODUCT.md / DESIGN.md directly.
- Emil Kowalski skills (emilkowalski/skills, MIT): `emil-design-eng` (UI polish philosophy), `animate`, `choreograph` (body-figure scan / staggered entrances), `review-animations`, `improve-animations`, `find-animation-opportunities`, `animation-vocabulary`, `animation-performance`, `break-ui` (worst-case data — useful for extreme vitals).
- `design-taste-frontend` (Leonxlnx/taste-skill, MIT) — built for **marketing websites**, not app UI. Set to manual-only (`disable-model-invocation: true` added by us). Use it only for the project's showcase/landing page via `/design-taste-frontend`. Needs Node 22+ and Chrome/Edge; while active it runs a browser "gate" check at the end of each turn.

### Precedence when skills disagree
Our own `astro-ui-design` (status = colour + shape + word, accessibility, tokens) and `astro-health-science` win over the general design skills. The general skills decide craft: typography, spacing, motion curves, polish.

### UI libraries (decided 2026-11-14)
- Animation: **Motion** (`motion/react`) for UI transitions — matches the Emil Kowalski skills. **GSAP** only if the body-figure SVG needs path drawing/morphing; never both for the same element.
- **No Lenis / scroll-jacking** in the app — it is a dashboard, and smooth-scroll libraries hurt accessibility. Allowed only on the showcase page.
- **React Bits** and **21st.dev**: reference and copy single components only; restyle them with our tokens, check the licence of each, and add every copied component to `docs/references.md`. No flashy effects on health screens.

### Figma
`.mcp.json` registers the official Figma MCP server (`https://mcp.figma.com/mcp`). Each teammate authorizes it once with their own Figma account (`/mcp` in Claude Code). Use it to pull frames, tokens and components from our Figma file into code.

## Working rules
- Thresholds and guidance text live only in the data file (`src/data/indicators.*`), each with a `sourceUrl`.
- Components use design tokens only (`src/styles/tokens.css`).
- Work on a branch, open a PR, squash-merge; keep `main` deployable.
- Any AI-assisted code/content: mention in the commit body; AI images get a visible watermark; never use NASA logos/insignia.
- List every external asset/library in `docs/references.md` as soon as it is added.
- Teams may not start building before 14 Nov 09:00 local time — research and planning only before that.

---
name: team-git-workflow
description: How our 6-person team works in one GitHub repo during a 2-day hackathon — branch naming, folder ownership, commits, pull requests, merge cadence, conflict avoidance, deployment to a public URL. Use whenever creating a branch, committing, opening/reviewing a PR, resolving a merge conflict, or deploying.
---

# Team Git workflow (6 people, ~40 hours)

## Principles
1. `main` is always runnable and deployed. Broken `main` = stop and fix first.
2. Small branches, merged often (every 1–3 hours). Long-lived branches cause the conflicts that kill hackathons.
3. Folder ownership avoids two people editing the same file.
4. Never force-push `main`. Never commit secrets (`.env` is git-ignored).

## Roles → folders (adjust names in README once roles are set)
| Role | Owns | Typical folders |
|---|---|---|
| Design & UI (2) | tokens, layout, body figure, components | `src/styles/`, `src/components/`, `design/` |
| Logic & data (2) | assessment engine, storage, schedules | `src/engine/`, `src/store/`, `src/data/` |
| Science (1) | thresholds, sources, explanations copy | `src/data/indicators.*`, `docs/science.md` |
| Pitch & video (1) | demo, slides, project page text | `pitch/`, `docs/submission.md` |
Shared files (`package.json`, `App.*`, router, `tokens.css`) — announce in chat before editing, merge fast.

## Branches
`<type>/<short-topic>` e.g. `feat/body-figure`, `feat/engine-thresholds`, `fix/chart-axis`, `docs/references`, `design/tokens`.
Start from fresh main:
```bash
git switch main
git pull
git switch -c feat/body-figure
```

## Commits
Conventional style, English, present tense: `feat: add heart region to body figure`, `fix: bp danger threshold`, `docs: add HRP sources`, `style: apply tokens to tiles`. If an AI tool wrote substantial code, say so in the commit body (needed for the SI disclosure).

## Pull requests
- Open a PR early as **Draft**; mark Ready when done.
- Fill the PR template (`.github/pull_request_template.md`): what/why, screenshot for UI, checklist.
- One reviewer approval, ideally from another role (designer reviews UI PRs using `astro-ui-design` checklist).
- **Squash merge**. Delete the branch after merge.
- Before merging: `git pull origin main` into your branch (or rebase), run the app, make sure it builds.

## Conflicts
1. `git pull origin main` in your branch.
2. Fix conflicts file by file; if the file belongs to someone else, ask them.
3. Run the app, then commit `merge: resolve conflict with main`.

## Data contract between UI and engine (agree in hour 1, then don't break it)
Define the reading/assessment types in one shared file (e.g. `src/engine/types.ts`) first:
- `Reading { indicatorId, value, unit, takenAt, source: 'manual'|'device'|'camera' }`
- `Assessment { indicatorId, status: 'normal'|'caution'|'danger'|'no-data'|'stale', reason, baselineDelta, guidance: { doNow[], recheckIn, escalateIf }, sourceUrl }`
UI builds against seeded mock data while the engine is in progress.

## Deployment (judges need a public link, no login)
Static front-end → GitHub Pages (or Vercel/Netlify). Deploy from `main` with a GitHub Actions workflow; check the live URL in a private browser window after every merge to `main`. Seed realistic demo data (e.g. "Mission day 47, Mars transit") so the app is never empty for judges.

## Timeline checkpoints (Sat 09:00 → Sun 23:59)
- Sat 11:00 — repo, stack, data contract, tokens agreed; skeleton deployed
- Sat 20:00 — core loop works: input → assessment → colour status → guidance
- Sun 12:00 — wow feature (body figure) + charts merged; **feature freeze 18:00**
- Sun 18:00–22:00 — polish, demo video, project page text, references
- Sun 22:30 — submit (resubmit allowed until 23:59; don't wait for the last minute)

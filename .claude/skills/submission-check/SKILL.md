---
name: submission-check
description: Pre-submission audit for the Space Apps project — checks the repo, live demo link, README, references, SI disclosure, demo limits and the challenge's own requirements, then reports pass/fail per item. Use when someone says "check before submit", "are we ready", "audit the project", or on Sunday evening before submitting.
---

# Submission check

Run every item; report a table `item | pass/fail | evidence | fix`. Do not mark pass without evidence (a file path, a URL you opened, a command output).

## A. Eligibility (from `spaceapps-rules`)
1. Team ≤ 6, all in the same Local Event — ask the team to confirm on the website (cannot be verified from the repo).
2. Demo is ≤ 30 s video or ≤ 7 slides; link is public (open it logged-out).
3. Everything in English; video has English subtitles.
4. Final project link opens without login.
5. At least one NASA resource listed and actually used.
6. References list covers all libraries (`package.json` dependencies), fonts, icons, images, 3D models, audio.
7. No NASA logos/insignia in the app or media; AI-generated images carry a visible watermark.
8. No images/voices of people under 18.

## B. Product (from team guidelines + challenge)
9. App opens on the live URL with no console errors.
10. Data input works for every chosen indicator.
11. Each indicator gets normal/caution/danger + colour + shape + word.
12. Each non-normal status shows guidance (do now / re-check / escalate if).
13. Escalation to flight surgeon / crew medical officer is visible.
14. At least one "wow" interactive/visual feature (body figure) works with mouse and keyboard.
15. Charts over time work with seeded data.
16. Every threshold shows its source; "does not diagnose" disclaimer is visible.
17. The app answers NASA's 5 questions somewhere (help/about panel) — list where.
18. Works at mobile width (375 px) and desktop.

## C. Repo
19. README (English): what it is, live link, demo link, screenshots, how to run locally, tech stack, team, references, SI use.
20. `main` builds from a clean clone (`npm ci && npm run build` or the stack's equivalent).
21. No secrets committed (`git grep -I -n -E "(api[_-]?key|secret|token)\s*[:=]"`).
22. Licence file present (e.g. MIT) and compatible with used assets.

## D. Project page fields filled
23. Name · Summary · Demo link · Project link · Detailed description · SI use · NASA data · References — all non-empty, consistent with README.

Finish with: the top 3 fixes ranked by judging impact, and the time left until 23:59 local.

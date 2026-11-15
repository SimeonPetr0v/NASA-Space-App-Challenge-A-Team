# 30-second demo video — shot list, voice-over and recording guide

One story on three screens, each in a different theme: **laptop (Light)**, **tablet (Dark)**, **phone (Sleep)**. Each screen shows **different** features. The smaller screen is *cut out* of the bigger one: the rest of the screen dims away, the window becomes the next device, then slides aside to make room for side text. English only. No NASA logos. All crew data is synthetic and labelled as such.

Final file (not in the repo): `D:\NASA-video\khonsu-demo.mp4` — 1920×1080, 30 fps, H.264 + AAC, 29.9 s.

## Shot list

| Time | Screen | On screen | Side text / labels | Voice-over |
|---|---|---|---|---|
| 0.0–2.6 s | **Intro** | Dark space card: pulse line draws, **KHONSU**, "Health self-check for astronauts far from Earth", Earth → Mars route "Day 47 · 14 light-minutes". A left-to-right wipe (like the app's theme wipe) reveals the laptop. | — | **1** "Fourteen light-minutes from Earth, no doctor can answer live." |
| 2.0–11.0 s | **Laptop**, full screen, Light | Overview: CM-2 **CAUTION**, one action. *Show details*: trend watch, radiation budget (182 / 600 mSv), 3D body turning. | Chip: "Light theme · synthetic crew data" | **2** "Khonsu checks each reading against safe ranges and your own baseline, then tells you what to do now." |
| 11.0–12.8 s | Laptop → tablet | A tablet-shaped window is cut out of the laptop screen, the rest dims away, the window becomes the tablet (Dark) and slides left. Stage turns dark. | — | — |
| 12.8–19.2 s | **Tablet**, Dark | Earth link: report sent ("Transmitting"), demo clock ×600, flight-surgeon reply. Crew board: CM-3 act now, CM-2 caution, CM-1 nominal. | **On the tablet · Dark theme — Earth is far. The crew acts first.** Earth link · Crew board · Dark theme (the sun menu turns into a moon). *Synthetic crew and readings · simulated link.* | **3** "Reports reach Earth with the real light delay, and the medical officer sees the whole crew." **4** "It supports self-assessment. It never diagnoses." |
| 19.2–20.9 s | Tablet → phone | A phone-shaped window is cut out of the tablet, becomes the phone (Sleep) and slides right. Stage turns warm night brown. | — | — |
| 20.9–26.6 s | **Phone**, Sleep | Log reading → camera pulse (red night light, live trace). Ask TOT: "Show me my radiation exposure." → Measured (career 182 of 600 mSv), library background with source. Sleep-shift page, then the planets menu. | **On the phone · Sleep theme — A health check in your pocket.** Camera pulse · Ask TOT · Sleep shift. *Camera input simulated for this recording.* | **5** "On a phone, measure your pulse with the camera, and ask TOT, an AI that runs offline." |
| 26.6–29.9 s | **End card** | **KHONSU** · tagline · **A-team** · NASA Space Apps Challenge 2026 · "Supports self-assessment · does not diagnose · synthetic crew data" · "TOT AI runs on the device" · live app URL | — | **6** "Khonsu. Care that travels with the crew." |

Subtitles are burned in at the bottom centre (Space Grotesk on a graphite pill, words appear as they are spoken) and follow the voice-over exactly.

## Recording the voice-over yourself

**What you need:** a phone voice-memo app (or Audacity on a laptop), a quiet room, 10 minutes.

**Setup**
1. Choose a small room with soft things (bedroom, wardrobe, car). Close windows, turn off fans.
2. Hold the phone about 20 cm (a hand-span) from your mouth, a little below it, so your breath does not hit the microphone.
3. Record a 3-second test, play it back with headphones. No hum, no echo? Go on.

**How to read**
- Calm, clear, a bit slower than normal talk. Smile slightly; it sounds warmer.
- Read each line **3 times** in one recording, with a 2-second pause between takes. I will pick the best take.
- Say "Khonsu" as **KON-soo**. Say "TOT" as one word, **tot**.
- If you stumble, just pause and read the line again.

**Target length for each line** (the video can stretch about ±0.5 s; I will re-time the cuts to your recording):

| # | Line | Target |
|---|---|---|
| 1 | Fourteen light-minutes from Earth, no doctor can answer live. | ≈ 3.5 s |
| 2 | Khonsu checks each reading against safe ranges and your own baseline, then tells you what to do now. | ≈ 5.5 s |
| 3 | Reports reach Earth with the real light delay, and the medical officer sees the whole crew. | ≈ 4.5 s |
| 4 | It supports self-assessment. It never diagnoses. | ≈ 3 s |
| 5 | On a phone, measure your pulse with the camera, and ask TOT, an AI that runs offline. | ≈ 5 s |
| 6 | Khonsu. Care that travels with the crew. | ≈ 2.5 s |

**Send the files:** save as `line1.m4a` … `line6.m4a` (or one file with all lines in order) in `D:\NASA-video\voice\human\`. Any format is fine (m4a, mp3, wav). Do not put them in the repo.

Because the voice will be a real person, the end card does **not** say "voice-over generated with AI". If an AI voice is used after all, render the end card with `comp.html?ai=1`.

## How it was made
- Recording: Playwright + Chrome (headless, GPU), CDP screencast. Laptop 1440×810 at 4/3 scale (1920×1080), tablet 820×1180 and phone 390×844 at 2× scale. Scripts in `D:\NASA-video\tools\` (`rec-laptop.mjs`, `rec-tablet.mjs`, `rec-phone2.mjs`).
- Edit: `D:\NASA-video\comp\comp.html` (device frames, cut-out transitions, subtitles, side text) captured frame by frame (`tools\capture.mjs all`), then encoded with ffmpeg.
- Camera pulse: a synthetic "fingertip" video fed to Chrome's fake camera; the side text says so.
- AI-assisted: recording scripts, composition and this document were written with Claude Code.

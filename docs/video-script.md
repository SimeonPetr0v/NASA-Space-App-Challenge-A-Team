# 30-second demo video — shot list and voice-over

One continuous story on three screens. The app is recorded from the live site with Playwright (Chrome, headless), then edited into one 1920×1080 video. Each screen shows **different** features. English only. No NASA logos. All crew data is synthetic and labelled as such.

Final file (not in the repo): `D:\NASA-video\khonsu-demo.mp4` — H.264 + AAC, ≤ 30 s.

## Shot list

| Time | Device | On screen | Side text | Voice-over (≈ 75 words) |
|---|---|---|---|---|
| 0.0–10.5 s | **Laptop**, full screen | Overview: CM-2 **CAUTION**, heart rate 108, 37.9 °C, one action. *Show details*: trend watch, radiation budget (600 mSv career limit), 3D body turning. | Chip: "Synthetic crew data · demo" | "Fourteen light-minutes from Earth, no doctor can answer live. Khonsu checks each reading against safe ranges and your own baseline, then tells you what to do now." |
| 10.5–11.9 s | Laptop → tablet | The full screen shrinks and morphs into a tablet frame. | — | — |
| 11.9–19.4 s | **Tablet** (portrait) | Earth link: report sent ("Transmitting"), demo clock ×600, flight-surgeon reply. Crew board: CM-3 act now, CM-2 caution, CM-1 nominal. | **On the tablet — Earth is far. The crew acts first.** Earth link: real Mars light delay, 14 min each way; demo clock ×600. Crew board: the crew medical officer sees everyone, worst first. *Synthetic crew and readings · simulated link.* | "Reports reach Earth with the real light delay, and the medical officer sees the whole crew. It supports self-assessment. It never diagnoses." |
| 19.4–20.6 s | Tablet → phone | The tablet shrinks into a phone frame on the right. | — | — |
| 20.6–26.8 s | **Phone** | Log reading: camera pulse with live trace. Ask TOT: "Show me my radiation exposure." answered on the device with sources. Sleep theme wipe, then the sun-and-planets menu. | **On the phone — A health check in your pocket.** Camera pulse (estimate, not a medical device). Ask TOT: AI on the device, offline, cites sources. Sleep theme · sun menu. *Camera input simulated for this recording.* | "On a phone, measure your pulse with the camera, and ask TOT, an AI that runs offline." |
| 27.0–29.9 s | End card | **KHONSU** · "Health self-check for astronauts far from Earth" · **A-team** · NASA Space Apps Challenge 2026 · "Supports self-assessment · does not diagnose · synthetic crew data" · "TOT AI runs on the device · voice-over generated with AI" · live app URL | — | "Khonsu. Care that travels with the crew." |

## Subtitles
Burned in, bottom centre, word-by-word reveal, Space Grotesk on a dark graphite pill. They follow the voice-over exactly.

## AI disclosure (end card)
"TOT AI runs on the device. Voice-over generated with AI." — the second sentence only if an AI voice (ElevenLabs or the Windows voice) is used. Data shown is synthetic.

## How it was made
- Recording: `D:\NASA-video\tools\record.mjs` (Playwright + Chrome, CDP screencast, deviceScaleFactor 2 for tablet and phone).
- Edit: an HTML composition page captured frame by frame, then ffmpeg (H.264, AAC).
- Voice: temporary Windows voice for timing; final voice is a human recording or ElevenLabs.

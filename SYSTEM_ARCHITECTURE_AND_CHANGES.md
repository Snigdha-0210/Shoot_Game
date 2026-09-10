# 🚀 OPERATION: DEFUSE — System Architecture, Changes & Engineering Guide

**Project:** OPERATION: DEFUSE — Tactical 3D On-Rail Arcade FPS & 6-Wire Breadboard Bomb Disarmament Challenge  
**Live Web Demo:** [https://snigdha-0210.github.io/Shoot_Game/](https://snigdha-0210.github.io/Shoot_Game/)  
**Repository:** [https://github.com/Snigdha-0210/Shoot_Game](https://github.com/Snigdha-0210/Shoot_Game)  
**Author:** Snigdha-0210  
**Last Updated:** September 10, 2026  

---

## 📌 Executive Overview

**OPERATION: DEFUSE** is a fast-paced on-rail tactical 3D arcade shooter and bomb disarmament simulation developed using **Three.js**, **Vanilla JavaScript/CSS**, **Web Audio API**, and **Vite**.

The game features an automated rail navigation system, dynamic quick-draw reaction windows, a 3-button hardware/arcade combat cipher system, and an interactive 6-wire breadboard bomb defusal terminal with procedural logic rules governed by a field manual.

---

## 🏗️ Complete System Architecture

```
Shoot_Game/
├── public/
│   ├── manual.html                      # Printable / Web Field Disarmament Manual
│   └── BOMB_DEFUSAL_FIELD_MANUAL.pdf    # Downloadable 2-page EOD Field Manual PDF
├── src/
│   ├── engine/
│   │   ├── Audio.js                     # 100% Procedural Web Audio API sound synthesizer
│   │   ├── Input.js                     # Universal hardware firing & breadboard key interceptor
│   │   ├── Renderer.js                  # Three.js WebGL renderer, soft shadows, lighting & particles
│   │   └── TextureGenerator.js          # Procedural canvas textures (cobblestone, brick, PCB)
│   ├── game/
│   │   ├── Bomb.js                      # 3D C4 ordnance model, LED clock & waypoint beacon
│   │   ├── DefusalStation.js            # 6-Wire procedural bomb defusal mini-game & manual logic
│   │   ├── Enemy.js                     # 4 Enemy combat classes (Scout, Juggernaut, Sniper, Boss)
│   │   ├── EnemyAI.js                   # Vision FOV, acoustic hearing, and smoke cloud occlusion
│   │   ├── Grenade.js                   # Parabolic smoke grenade physics & 3D volumetric smoke
│   │   ├── HitboxManager.js             # Raycasting, scoring (+15/+5/-3), combo multipliers
│   │   ├── LevelManager.js              # 3D Level environments, set-pieces, waypoints & props
│   │   ├── Minimap.js                   # Forward-aligned 2D canvas tactical radar
│   │   ├── Pickups.js                   # 3D glowing Ammo/Armor loot drops with magnetic attraction
│   │   ├── Player.js                    # Dual suppressed weapons, recoil, bullet-time, sway
│   │   ├── RailController.js            # Automated rail traversal, target lock & QTE state machine
│   │   └── UI.js                        # Glassmorphism HUD, QTE badges, waypoint tags, modals
│   ├── main.js                          # Main game state loop (120s global timer, event hooks)
│   └── style.css                        # Cyberpunk HUD styling, glassmorphism, animations
├── generate_manual_pdf.py               # Python ReportLab generator for the PDF Field Manual
├── index.html                           # Main entry HTML markup with HUD & defusal modal
├── package.json                         # Dependencies (Three.js, Vite)
├── PROJECT_UPDATES.md                   # Chronological development log
├── SYSTEM_ARCHITECTURE_AND_CHANGES.md   # System architecture & feature guide
└── vite.config.js                       # Vite base path configuration for GitHub Pages
```

---

## ⚡ Key Systems & Features Built

### 1. Automated Rail Navigation & Corridor Traversal (`RailController.js`)
- **Corridor Sprinting:** The operative automatically traverses waypoints along the level corridor at high speed (`6.5 m/s` during exploration, `12.0 m/s` post-combat sprint).
- **Smooth Auto-Aim Tracking:** Direct precision centering on enemy heads/upper bodies when arriving at combat standoff points.
- **Distant & Scattered Encounters:** Levels feature 2 to 3 distant, staggered enemies per sector with long sprint intervals.

### 2. Tightening Quick-Draw Reaction Window
- Scaled reaction countdown timer for each encounter:
  - **Level 1:** 3.0s – 2.6s
  - **Level 2:** 2.4s – 2.0s
  - **Level 3:** 2.0s – 1.7s
  - **Level 4:** 1.8s – 1.5s (Boss: 2.4s for 4-button sequence)
- **Instant Mission Failure:** If the timer reaches 0 before entering the correct sequence, the hostile fires a lethal shot, ending the mission.

### 3. 3-Button Hardware/Breadboard Combat Cipher (`[C]`, `[V]`, `[SPACE]`)
- Compatible with arcade setups and physical 3-button breadboard controllers:
  - **Circuit C:** Key `C` / Key `1` / On-screen Badge
  - **Circuit V:** Key `V` / Key `2` / On-screen Badge
  - **Kinetic Trigger:** Key `Space` / `Enter` / `F` / `Z` / `LMB` / On-screen Badge
- **QTE Badge System:** Visual badges showing `[C]`, `[V]`, `[SPACE]` with progress highlights (`cleared`, `active`, `pending`), error shake animations, and synthetic tone feedback.
- **Wrong-Key Penalty:** Deducts `0.25s` from the active reaction window and triggers audio buzz / screen damage flash.

### 4. Continuous 2-Minute Global Detonation Timer
- A continuous `120.0s` global timer spans all 4 sectors and all bomb defusal phases.
- Defusing a bomb carries over the remaining time to the next sector, awarding `+2x` remaining time bonus points.

### 5. Interactive 6-Wire Breadboard Defusal Station (`DefusalStation.js`)
- **6 Standard Breadboard Wires:**
  1. `[1] RED` (`KeyR`)
  2. `[2] GREEN` (`KeyG`)
  3. `[3] YELLOW` (`KeyY`)
  4. `[4] BLACK` (`KeyK` / `KeyL`)
  5. `[5] BLUE` (`KeyB`)
  6. `[6] WHITE` (`KeyW`)
- **Procedural Logic Engine:** Randomized Serial Number and 4-LED Status Bank (`RED`, `GREEN`, `BLUE`, `YELLOW`) generate dynamic disarming solutions based on Field Manual rules.
- **Multi-Stage Cuts:** Multi-wire sequential logic (e.g. Stage 1 Valve -> Stage 2 Neutralizer -> Stage 3 Core).
- **Penalties:** Cutting the wrong wire deducts `20s` from the bomb countdown.

### 6. Procedural Web Audio Engine (`Audio.js`)
- 100% synthesized in real time via the Web Audio API without external `.mp3`/`.wav` assets:
  - Suppressed M4A1 rifle & USP-45 pistol shots
  - High-caliber sniper supersonic cracks
  - Enemy assault rifle bursts
  - Metallic helmet ping & headshot fanfare
  - QTE ascending step chimes & sequence complete fanfares
  - Smoke grenade pin release & gas hiss
  - Slow-mo adrenaline heartbeat pulses
  - Explosions and defusal success fanfares

---

## ✂️ Sector Defusal Logic Reference Table

| Sector | Bomb Model | Serial Clues | LED Clues | Cut Sequence |
| :--- | :--- | :--- | :--- | :--- |
| **Sector 1** | Mk-I Tactical Fuse | Last digit ODD vs EVEN | Blue ON / Red ON / Green OFF | 2-Wire Sequence (Rule 1–4) |
| **Sector 2** | Digital Circuit Matrix | Last digit EVEN vs ODD | Red & Green BOTH ON / Blue ON | 2-Wire Sequence (Rule 1–4) |
| **Sector 3** | 2-Stage Bio-Chemical | Code letter `V, C, X` vs `Z, M, K` | Blue ON & Red OFF | Stage 1: Valve $\rightarrow$ Stage 2: Neutralizer |
| **Sector 4** | Quantum Resonator | Last digit EVEN vs ODD | Active LED count (3-4, 2, or 0-1) | Stage 1: Decouple $\rightarrow$ Stage 2: Ground |
| **Sector 5** | Cyber Mainframe Core | Vowel present (`A,E,U`) | Blue & Yellow ON / Green ON | Stage 1: Data Bus $\rightarrow$ Stage 2: Bypass |
| **Sector 6** | Master Omega Warhead | Keyword (`OMG`, `WAR`, `NEX`) | Red LED ON / Green LED ON | 3-Stage Omega Sequence |

---

## 🕹️ Controls & Hardware Mapping

| Action | Primary Key | Secondary / Hardware Alternate |
| :--- | :---: | :---: |
| **Fire / Confirm Trigger** | <kbd>Space</kbd> | <kbd>Enter</kbd> / <kbd>F</kbd> / <kbd>Z</kbd> / <kbd>LMB</kbd> |
| **Combat Cipher C** | <kbd>C</kbd> | <kbd>1</kbd> / <kbd>Numpad 1</kbd> / Click Badge |
| **Combat Cipher V** | <kbd>V</kbd> | <kbd>2</kbd> / <kbd>Numpad 2</kbd> / Click Badge |
| **Defusal Wires 1–6** | <kbd>1</kbd> – <kbd>6</kbd> | <kbd>R</kbd>, <kbd>G</kbd>, <kbd>Y</kbd>, <kbd>K</kbd>, <kbd>B</kbd>, <kbd>W</kbd> |
| **Interact / Defuse** | <kbd>E</kbd> | Click Prompt / Click Waypoint Tag |
| **Adrenaline Focus (Slow-Mo)** | <kbd>Space</kbd> | Adrenaline Gauge $>30\%$ |
| **Weapon Swap** | <kbd>Q</kbd> | <kbd>1</kbd> (Primary) / <kbd>2</kbd> (Secondary) |
| **Throw Smoke Grenade** | <kbd>G</kbd> | Inventory Count |
| **Reload Weapon** | <kbd>R</kbd> | Automatic on empty clip |
| **Crouch (Stealth Walk)** | <kbd>C</kbd> | <kbd>Ctrl</kbd> |
| **Sprint** | <kbd>Shift</kbd> | High noise level |

# 📋 Project Updates & Engineering Log
**Project:** OPERATION: DEFUSE — Tactical 3D Stealth FPS & Multi-Level Bomb Disarmament Simulation  
**Live Playable Demo:** [https://snigdha-0210.github.io/Shoot_Game/](https://snigdha-0210.github.io/Shoot_Game/)  
**Repository:** [https://github.com/Snigdha-0210/Shoot_Game](https://github.com/Snigdha-0210/Shoot_Game)  
**Author:** Snigdha-0210  
**Last Updated:** September 9, 2026

---

## 📌 Executive Summary

This document serves as the comprehensive progress tracker, architecture reference, and technical cheat-sheet for **OPERATION: DEFUSE**. It documents all systems built, key algorithms implemented, critical bugs resolved during development, exact puzzle answers for all 4 mission sectors, and a structured roadmap for future enhancements.

---

## 🏗️ Core Systems Built & Status

| Module | File Path | Status | Summary |
| :--- | :--- | :---: | :--- |
| **WebGL Renderer** | [`src/engine/Renderer.js`](src/engine/Renderer.js) | ✅ Complete | Three.js WebGLRenderer with shadows, ACESFilmicToneMapping, starry sky dome, directional moonlight, linear fog (35m–140m), and spark/blood particle systems. |
| **Procedural Audio** | [`src/engine/Audio.js`](src/engine/Audio.js) | ✅ Complete | Pure Web Audio API procedural synthesizer for suppressed M4A1, USP-45 pistol, sniper cracks, smoke detonation hiss, slow-mo heartbeat, combo kill chimes, and boss shield hits. |
| **Input Manager** | [`src/engine/Input.js`](src/engine/Input.js) | ✅ Complete | PointerLock mouse aim, WASD, Crouch (`C`/`Ctrl`), Sprint (`Shift`), ADS (`RMB`), Fire (`LMB`), Reload (`R`), Flashlight (`F`), Interact (`E`), Weapon Swap (`Q`/`1`/`2`), Smoke (`G`), Focus (`Space`). |
| **Dual Weapon System** | [`src/game/Player.js`](src/game/Player.js) | ✅ Complete | Dual suppressed 3D weapon models (M4A1-S Carbine & USP-45 Tactical Pistol) with dynamic weapon switching, Adrenaline Bullet-Time meter, and smoke grenade inventory. |
| **Enemy Archetypes** | [`src/game/Enemy.js`](src/game/Enemy.js) | ✅ Complete | 4 specialized combat classes: Fast Patrol Scout, Heavy Armored Juggernaut Tank, Catwalk Sniper (red laser tracking beam), and Citadel Commander Boss (energy shield). |
| **Tactical AI Subsystem** | [`src/game/EnemyAI.js`](src/game/EnemyAI.js) | ✅ Complete | Multi-state AI with sniper laser target acquisition (1.5s lock-on), juggernaut heavy advance, smoke cloud blindness reaction, and acoustic hearing. |
| **Smoke Grenades** | [`src/game/Grenade.js`](src/game/Grenade.js) | ✅ Complete | Realistic parabolic throw physics, bounce mechanics, and expanding 3D volumetric smoke clouds that blind enemies and block line of sight. |
| **Loot Drops & Pickups** | [`src/game/Pickups.js`](src/game/Pickups.js) | ✅ Complete | 3D spinning glowing Ammo Crates (+15 Ammo) and Armor Kits (+25 Armor) dropped on enemy defeat with magnetic attraction and particle bursts. |
| **Killstreaks & Combos** | [`src/game/HitboxManager.js`](src/game/HitboxManager.js) | ✅ Complete | Headshot combo multipliers (`COMBO x2!`, `COMBO x3!`, `UNSTOPPABLE!`), Silent Assassin stealth bonus (+25 pts), and active weapon damage scaling. |
| **3D Bomb Ordnance** | [`src/game/Bomb.js`](src/game/Bomb.js) | ✅ Complete | 3D C4 bomb with blue/black vinyl tape, glowing PCB circuit traces, fiery orange digital clock (`01:28:45`), status LEDs, 18m vertical sky beacon, and rotating 3D waypoint diamond. |
| **Defusal Terminal** | [`src/game/DefusalStation.js`](src/game/DefusalStation.js) | ✅ Complete | Interactive wire-cutting puzzle station with procedural colored wires, serial plates, status LEDs, Field Manual logic rules, spark particles, and wrong-cut time penalties (-20s). |
| **Level Manager & Set-Pieces** | [`src/game/LevelManager.js`](src/game/LevelManager.js) | ✅ Complete | 4 progressive sectors with spinning red siren lights, neon signage (`BAR NOCTURNE`), elevated sniper catwalks, radioactive bubbling vats, and security laser tripwires. |
| **Radar Minimap** | [`src/game/Minimap.js`](src/game/Minimap.js) | ✅ Complete | Forward-aligned tactical radar canvas with concentric distance rings (15m, 30m, 45m), dynamic sweep beam, player arrow, enemy blips, and pulsing `★ BOMB` marker. |
| **Tactical HUD & UI** | [`src/game/UI.js`](src/game/UI.js) | ✅ Complete | Glassmorphism HUD, weapon slot badges, Adrenaline Focus gauge, Smoke counter, combo multiplier banners, Boss shield/health bar, and 3D screen-space waypoint tags. |

---

## 🐛 Key Challenges Resolved & Engineering Solutions

### 1. View Angle & Scene Orientation Fix
- **Problem:** Operative initially spawned facing backwards towards empty sky ($+Z$).
- **Resolution:** Set initial spawn rotation $\text{rotY} = 0$, aligning the camera directly forward down $-Z$ into the illuminated European alleyway.

### 2. High-Visibility Cinematic Lighting
- **Problem:** Dark atmospheric fog previously caused distant buildings to appear black.
- **Resolution:** Converted heavy exponential fog to gentle linear fog starting at 35m, added bright ambient fill light (`1.3`), directional moonlight (`2.0`), starry skydome, and corrected spotlight targeting on street lanterns (`8.0` intensity).

### 3. Radar Minimap Coordinate Mapping
- **Problem:** Angular trigonometric offset caused bomb and enemy blips to cluster on the left radar edge.
- **Resolution:** Implemented direct forward-aligned vector math:
  $$\text{localRight} = \Delta x \cos(\text{yaw}) - \Delta z \sin(\text{yaw})$$
  $$\text{localForward} = -\Delta x \sin(\text{yaw}) - \Delta z \cos(\text{yaw})$$
  Mapping local forward directly to **UP (12 o'clock)** on the radar canvas.

### 4. Player Movement Obstacle Collision Fix (28.4m Stoppage)
- **Problem:** Building collision bounding boxes were computed before matrix world transforms were resolved, inadvertently placing un-transformed collision boxes across the central street at $z \approx 6.4\text{m}$.
- **Resolution:** Replaced dynamic object bounding boxes with **explicit world-space coordinates** for all buildings and side props, while replacing rigid point collision with a **smooth 2D capsule sliding algorithm** ($0.35\text{m}$ radius), leaving a wide 7-meter central street lane completely unobstructed.

### 5. Effortless Bomb Defusal Triggering
- **Problem:** Close interaction requirement ($< 2.5\text{m}$) was restrictive.
- **Resolution:** Extended defusal activation range to **$4.0\text{m}$**, added an augmented reality **3D Screen-Space Waypoint Tag**, and allowed defusing via <kbd>E</kbd> key or direct mouse click on the prompt / waypoint tag.

---

## ✂️ Exact Wire Defusal Solutions (All 4 Levels)

Use this quick-reference guide to rapidly test or play through all 4 sectors:

### Level 1: Coastal Infiltration Yard
- **Bomb Type:** Mk-I Tactical C4 (3 Wires: Red, Blue, Yellow | Serial: `8K4-T7`)
- **Solution:** Cut **`Wire #2 (BLUE)`**
- **Outcome:** Sector 1 Defused $\rightarrow$ Unlocks Level 2 (+100 Defusal Bonus + Time Bonus).

### Level 2: Subterranean Bunker & Server Complex
- **Bomb Type:** Digital Circuit Timer (4 Wires: Red, Blue, White, Black | Serial: `3V9-B2`)
- **Solution:** Cut **`Wire #2 (BLUE)`**
- **Outcome:** Sector 2 Defused $\rightarrow$ Unlocks Level 3.

### Level 3: Research Silo & Catwalks
- **Bomb Type:** 2-Stage Bio-Chemical Detonator (5 Wires: Striped, Red, Yellow, Green, Blue | Serial: `5S8-X4`)
- **Solution (2-Stage Sequence):**
  1. Cut **`Wire #1 (STRIPED)`** *(Ground bypass disarmed)*
  2. Cut **`Wire #4 (GREEN)`** *(Capacitor neutralized)*
- **Outcome:** Sector 3 Defused $\rightarrow$ Unlocks Level 4.

### Level 4: Fortress Command Citadel
- **Bomb Type:** Master Omega Citadel Core (6 Wires: Red, Striped, Blue, Yellow, White, Green | Serial: `9X0-OMEGA`)
- **Solution (3-Stage Omega Directive Sequence):**
  1. Cut **`Wire #1 (RED)`** *(Primary power feed disrupted)*
  2. Cut **`Wire #5 (WHITE)`** *(Core oscillations halted)*
  3. Cut **`Wire #6 (GREEN)`** *(Terminal ground severed)*
- **Outcome:** **Grand Victory Screen** — All 4 sectors secured with **Master Shadow Commando (S-Rank)** commendation!

---

## 🎯 Scoring, Combos & Lifeline Mechanics

- **Headshot Combo Multipliers:** Landing headshots in succession within 3.5s triggers `COMBO x2!`, `COMBO x3!`, `UNSTOPPABLE!`, awarding multiplying score bonuses (+15, +30, +45, +60 pts).
- **Stealth Assassin Bonus:** Neutralizing an unaware guard before combat triggers awards **`+25 SILENT ASSASSIN`** bonus points.
- **Body Shot:** **`+5 Points`** (Staggers and damages target).
- **Enemy Hit Taken:** **`-3 Points`** penalty per hit taken, screen damage flash, and armor reduction.
- **Lifelines:** 3 Tactical Armor Plates (🛡️ 🛡️ 🛡️). Depleting all 3 lifelines triggers Mission Failed with an immediate retry button.

---

## 🔮 Future Enhancement Roadmap

1. **Secondary Weapons & Tactical Equipment**:
   - Suppressed Tactical Pistol (`M9-S` or `Glock-19`).
   - Smoke grenades and flashbangs to temporarily blind enemy patrol squads.
2. **Audio Options & Volume Slider**:
   - In-game settings menu to adjust master, SFX, and ambient volume levels.
3. **Procedural Wire Puzzle Generator**:
   - Dynamic seed generation for infinite randomized wire combinations in an endless Survival / Time Attack mode.
4. **Additional Mission Sectors**:
   - Level 5: *Arctic Radar Outpost* (Snowstorm weather effects, sniper towers).
   - Level 6: *Submarine Bay & Naval Docks* (Underwater caissons, industrial cranes).

---

## 🚀 How to Run & Play

```bash
# Clone and navigate
git clone https://github.com/Snigdha-0210/Shoot_Game.git
cd Shoot_Game

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173/ in browser
```

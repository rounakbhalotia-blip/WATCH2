# AURELIA // Haute Horlogerie 3D Exploded Mechanical Watch Atelier

An extraordinary, interactive Haute Horlogerie web application featuring a real-time running mechanical watch movement, customizable atelier studio ambiance, and a smooth 3D exploded disassembly animation engine with full 360° rotation and zoom.

**Canonical Project Directory**: [`C:\Users\rouna\WEBSITE\WATCH`](file:///C:/Users/rouna/WEBSITE/WATCH)  
*All codebase files, textures, libraries, and future changes are strictly maintained inside this directory.*

---

## 🌟 What's New

### 1. 🐊 Haute Horlogerie Alligator Strap & Butterfly Deployant Clasp
- **Blocked Lug Integration**: Seamless flush-fit curved end-links hugging the 42mm monobloc titanium case curvature ($R = 36.0$) between the 27mm lug horns.
- **Bombé Padded Cross-Section & Skiving**: 8 articulated segments per half curving into an unbroken anatomical wrist loop, tapering in width from 27.0mm to 19.5mm, with bombé padding skived from 4.8mm down to 2.8mm.
- **Dual-Layer Luxury Leather**: Procedural 1024×1024 Louisiana alligator leather with scale bump mapping on top, backed by soft Alsavel / Nubuck calfskin lining (`strapLining`) touching the wrist.
- **Couture Sellier Hand-Stitching**: 3D French linen saddle stitches angled at 25° along both margins, dynamically adapting thread color to each watch model.
- **Deployant Clasp Kinematics**: Double-folding symmetrical butterfly blades with circular *Perlage* engine turning, lateral spring release pushers, 18K gold engraved medallion, and an interactive open/close slider (<kbd>C</kbd>).

---

### 2. ⚙️ Balance Wheel Positioned In Front of Bridge (Flying Regulating Organ)
- **Balance Wheel in Front**: The Glucydur balance wheel, 16 micro-metric poise screws, Incabloc shock core with synthetic ruby, and breathing silicon hairspring spiral are positioned **proudly in front** at positive Z (`z = 0.45`), completely unobstructed by the bridge.
- **Unified Architecture**: The cantilever balance cock bridge ("the metal thing attached"), swan-neck fine regulator (*Col de Cygne*), and heat-blued mounting screws are positioned **behind** the balance wheel (`z = -0.9` to `0.0`), supporting the regulating organ from the movement plate while providing full, magnificent visibility through the openworked skeleton dial aperture.

---

### 3. 📱 Complete Smartphone & Mobile Responsiveness
- **Touch Gestures & Prevention of Page Pull**: Integrated `touch-action: none;` on canvas container and viewport meta configuration (`maximum-scale=1.0, user-scalable=no, viewport-fit=cover`) preventing mobile browser pull-to-refresh or page bouncing.
- **1-Finger Orbit & 2-Finger Pinch Zoom**: Configured OrbitControls touch mappings for intuitive 3D rotation, panning, and micro-to-macro zoom on touchscreen smartphones.
- **Mobile Slide-Out Atelier Drawer**: Transformed the sidebar controls on mobile into an off-canvas drawer (`⚙️ Controls` button in header or tap backdrop to dismiss), providing smartphone users with full access to camera vantage views, butterfly clasp slider, speed selector, and calibre telemetry.
- **Floating Quick Dock**: Compact thumb-friendly floating dock at the bottom of mobile screens for instant access to **Views**, **Clasp**, **Speed**, and **Ambiance**.
- **Mobile Bottom Sheets**: Re-architected Ambiance and Inspector drawers into smooth bottom-sheet modals with safe-area insets on screens $\le 768\text{px}$ and $\le 480\text{px}$.
- **Touch Legend**: Dynamic touch hints (`👆 Orbit • 🤏 Pinch Zoom • 🎯 Tap to Inspect`) replacing physical keyboard tips on touchscreens.

---

### 4. ✂️ Date Wheel Complication & Jumper Spring Removed
- Completely eliminated the date wheel layer, 31-day date disk, and jumper spring mechanism. Total exploded layers streamlined to **13 layers**.

---

### 2. ⚡ Speed Selector Bug Fixed (Defaults to 1× Real-Time)
- **Resolved Initial Loop Override**: Fixed an issue where the speed loop assigned `60×` immediately at startup and omitted click event listeners.
- **Responsive Simulation Speeds**:
  - `0.1×`: Ultra slow-motion to study the oscillating balance wheel and pallet fork ruby release up close.
  - `1×` *(Default)*: Authentic Swiss 28,800 vph real-time rate.
  - `10×`: Accelerated mechanical movement.
  - `60×`: Time warp (1 minute per second) to watch the gear train whirl.
- Clicking any speed button updates the engine rate immediately with audible winding feedback.

---

### 3. 🎨 Customizable Atelier Background & Lighting
- **6 Hand-Crafted Ambiance Presets**:
  - **Obsidian Noir**: Default deep midnight slate (`#08090c`) with studio softbox lighting.
  - **Horologist Atelier**: Artisan walnut & mahogany workbench (`#18100a`) with warm incandescent lamp glow.
  - **Showroom Platinum**: Clean Geneva high-key luxury boutique (`#f0f3f8`) with diffused chrome reflections.
  - **Midnight Sapphire**: Cosmic navy blue (`#040816`) with vivid royal blue rim lighting.
  - **Cyber Carbon Vault**: Dark carbon grid (`#090d14`) with electric cyan & magenta neon accents.
  - **Sunset Rosé**: Twilight smoked amber & rosé gold atelier (`#1a0e14`).
- **Bespoke Color Picker**: Choose any custom background color; the scene fog, lighting tints, and pedestal reflection disc adjust smoothly in real time.
- **Studio Exposure Slider**: Adjust lighting intensity and tone-mapping exposure from 0.5× to 2.2×.

---

### 4. 🔍 Unrestricted Zoom & Rotation While Unassembled / Exploded
- **Full 360° Orbit & Zoom Freedom**: Freely rotate, pan, and zoom in/out at **any stage of disassembly** (from 0% assembled to 100% fully exploded).
- **Macro-to-Micro Zoom Range**: Zoom from 10 units up to 500 units to view the entire floating exploded array in mid-air.
- **One-Click Re-center Button**: Instantly re-align and center the camera view on the watch with the `Re-center` button or <kbd>R</kbd> key.

---

### 5. ⌚ Expanded 8 Iconic Watch Collection ("Watch These Ones")
1. **Calibre 01: Royal Skeleton Tourbillon**: 18K Rose Gold, flame-blued steel hands and screws, Côtes de Genève bridges, alligator strap.
2. **Calibre 02: Chronos Stealth DLC**: Forged carbon fiber, matte black DLC titanium, electric cyan Super-LumiNova, black ruthenium bridges.
3. **Calibre 03: Celestial 950 Platinum**: Pure 950 Ice Platinum, deep emerald green accents, rhodium platine, white gold hands.
4. **Calibre 04: Nautilus Heritage Bronze**: CuSn8 marine patinated bronze, warm ivory chapter ring, gilt brass movement, aged saddle strap.
5. **Calibre 05: Starlight Meteorite & Aventurine**: Widmanstätten etched iron meteorite case, deep starry aventurine glass dial, diamond indices.
6. **Calibre 06: Monaco Grand Prix Chrono**: Iconic Gulf Racing orange and cyan livery, 316L satin steel, perforated rally leather strap.
7. **Calibre 07: Sovereign 24K Royal Gold**: Solid 24K yellow gold, champagne hand-guilloché sunburst skeleton plate, ruby markers.
8. **Calibre 08: Phantom Shadow Ceramic**: High-tech sintered Zirconium Oxide ($\text{ZrO}_2$) matte blackout ceramic, smoked translucent sapphire crystal.

---

## 🎮 Controls & Shortcuts

| Action | Control |
|---|---|
| **Rotate 3D View** | Left Click + Drag (Works at any explosion stage) |
| **Pan Camera** | Right Click + Drag |
| **Zoom In / Out** | Mouse Wheel / Pinch (Range: 10 to 500) |
| **Re-center Camera** | <kbd>R</kbd> or Re-center Button |
| **Explode / Assemble** | <kbd>SPACE</kbd> or Bottom Disassembly Slider |
| **Switch Model (1-8)** | <kbd>1</kbd> to <kbd>8</kbd> or Carousel Cards |
| **Dial Front View** | <kbd>F</kbd> |
| **Escapement Macro View** | <kbd>E</kbd> |
| **Caseback View** | <kbd>B</kbd> |
| **Profile View** | <kbd>P</kbd> |
| **Mute / Unmute Sound** | <kbd>M</kbd> |
| **Customize Background** | Click `🎨 Ambiance` button |

---

## 🚀 How to Run Locally

The local server is running as a daemon from `C:\Users\rouna\WEBSITE\WATCH`:
👉 **[http://127.0.0.1:3000/](http://127.0.0.1:3000/)**

To run manually:
```bash
agy-node server.js
```
Or open [`C:\Users\rouna\WEBSITE\WATCH\index.html`](file:///C:/Users/rouna/WEBSITE/WATCH/index.html) directly in any modern browser.

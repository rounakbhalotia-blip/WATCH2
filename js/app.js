/**
 * AURELIA HOROLOGY - Master Application Coordinator
 * Initializes WebGL scene, lighting, camera controls, render loop,
 * UI listeners, model switching, customizable background ambiance, and horological inspector.
 */

class HorologyApp {
  constructor() {
    this.container = document.getElementById('webgl-container');
    this.initScene();
    this.initLighting();
    this.initWatch();
    this.initExplosionSystem();
    this.initBackgroundSystem();
    this.initUI();
    this.initKeyboardShortcuts();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initScene() {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.currentBgColor = new THREE.Color(0x08090c);
    this.scene.background = this.currentBgColor;
    this.scene.fog = new THREE.FogExp2(0x08090c, 0.002);

    // 2. Camera
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(42, aspect, 1, 1200);
    this.camera.position.set(45, 30, 85);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls (Smooth Zoom, Rotation, and Panning even when unassembled)
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 10;  // Macro close-up
    this.controls.maxDistance = 500; // Far out zoom to view full exploded array
    this.controls.enableZoom = true;
    this.controls.enableRotate = true;
    this.controls.enablePan = true;
    this.controls.zoomSpeed = 1.2;
    this.controls.rotateSpeed = 0.85;
    this.controls.panSpeed = 0.8;
    this.controls.target.set(0, 0, 0);

    // Optimized touch controls for smartphones and tablets
    if (typeof THREE.TOUCH !== 'undefined' && this.controls.touches) {
      this.controls.touches.ONE = THREE.TOUCH.ROTATE;
      this.controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
    }

    // Dynamic rotor impulse on user drag
    this.controls.addEventListener('change', () => {
      if (window.HorologyMechanics) {
        window.HorologyMechanics.addRotorImpulse((Math.random() - 0.5) * 0.08);
      }
    });

    // Window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Studio floor circular pedestal (Removed completely from scene as requested)
    const floorGeom = new THREE.CylinderGeometry(65, 65, 2, 64);
    this.floorMat = new THREE.MeshStandardMaterial({
      color: 0x06070a,
      roughness: 0.55,
      metalness: 0.35
    });
    this.floor = new THREE.Mesh(floorGeom, this.floorMat);
    this.floor.position.set(0, -60, 0);
    this.floor.receiveShadow = false;
    this.floor.visible = false;
    // this.floor is hidden completely so the watch floats cleanly in studio ambiance without dark disc platform
  }

  initLighting() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(this.ambientLight);

    this.keyLight = new THREE.DirectionalLight(0xfff6e8, 2.2);
    this.keyLight.position.set(50, 70, 70);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.camera.near = 10;
    this.keyLight.shadow.camera.far = 300;
    this.keyLight.shadow.camera.left = -50;
    this.keyLight.shadow.camera.right = 50;
    this.keyLight.shadow.camera.top = 50;
    this.keyLight.shadow.camera.bottom = -50;
    this.keyLight.shadow.bias = -0.0005;
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0x7ab6ff, 1.8);
    this.rimLight.position.set(-60, -40, -60);
    this.scene.add(this.rimLight);

    this.topLight = new THREE.DirectionalLight(0xffffff, 1.2);
    this.topLight.position.set(0, 90, 0);
    this.scene.add(this.topLight);

    this.accentPoint = new THREE.PointLight(0xffaa44, 1.4, 80);
    this.accentPoint.position.set(0, 11, 20);
    this.scene.add(this.accentPoint);

    this.accentPoint2 = new THREE.PointLight(0x00f0ff, 0.8, 80);
    this.accentPoint2.position.set(-15, 15, 25);
    this.scene.add(this.accentPoint2);

  }

  initWatch() {
    this.watch = new WatchModelBuilder(this.scene);
  }

  initExplosionSystem() {
    this.explosionSystem = new ExplosionSystem(
      this.watch,
      this.camera,
      this.controls,
      this.renderer
    );

    this.explosionSystem.onLayerSelected = (layer) => {
      this.displayLayerInspector(layer);
    };

    this.explosionSystem.onProgressChange = (progress) => {
      const slider = document.getElementById('explode-slider');
      if (slider) slider.value = Math.round(progress * 100);
      const label = document.getElementById('explode-percentage');
      if (label) label.textContent = `${Math.round(progress * 100)}%`;

      const btn = document.getElementById('btn-explode-toggle');
      if (btn) {
        btn.innerHTML = progress > 0.4
          ? '<i class="icon-assemble"></i> Assemble Watch'
          : '<i class="icon-explode"></i> Explode Calibre';
      }
    };
  }

  // --- CUSTOMIZABLE BACKGROUND & AMBIANCE SYSTEM ---
  initBackgroundSystem() {
    this.bgThemes = {
      'obsidian': {
        name: 'Obsidian Noir',
        bg: 0x08090c,
        fog: 0x08090c,
        floor: 0x06070a,
        keyLight: 0xfff6e8,
        rimLight: 0x7ab6ff,
        ambient: 0.9,
        exposure: 1.25
      },
      'atelier': {
        name: 'Horologist Atelier (Wood & Warmth)',
        bg: 0x18100a,
        fog: 0x18100a,
        floor: 0x22150d,
        keyLight: 0xffe2b8,
        rimLight: 0xffb566,
        ambient: 1.1,
        exposure: 1.3
      },
      'showroom': {
        name: 'Showroom Platinum (High-Key)',
        bg: 0xf0f3f8,
        fog: 0xf0f3f8,
        floor: 0xd8dde8,
        keyLight: 0xffffff,
        rimLight: 0xa8c4e8,
        ambient: 1.6,
        exposure: 1.05
      },
      'sapphire': {
        name: 'Midnight Sapphire (Royal Blue)',
        bg: 0x040816,
        fog: 0x040816,
        floor: 0x02050e,
        keyLight: 0x88bbff,
        rimLight: 0x2266ff,
        ambient: 0.95,
        exposure: 1.28
      },
      'carbon': {
        name: 'Cyber Carbon Vault (Neon Grid)',
        bg: 0x090d14,
        fog: 0x090d14,
        floor: 0x07090f,
        keyLight: 0x00f0ff,
        rimLight: 0xff0066,
        ambient: 0.85,
        exposure: 1.35
      },
      'sunset': {
        name: 'Sunset Rosé (Twilight Amber)',
        bg: 0x1a0e14,
        fog: 0x1a0e14,
        floor: 0x140a0f,
        keyLight: 0xffaa66,
        rimLight: 0xff5588,
        ambient: 1.05,
        exposure: 1.3
      }
    };

    this.activeBgTheme = 'obsidian';
  }

  applyBackgroundTheme(themeKey) {
    const theme = this.bgThemes[themeKey];
    if (!theme) return;
    this.activeBgTheme = themeKey;

    if (typeof gsap !== 'undefined') {
      const targetBg = new THREE.Color(theme.bg);
      const targetFloor = new THREE.Color(theme.floor);
      const targetKey = new THREE.Color(theme.keyLight);
      const targetRim = new THREE.Color(theme.rimLight);

      gsap.to(this.scene.background, {
        r: targetBg.r, g: targetBg.g, b: targetBg.b,
        duration: 0.8
      });
      gsap.to(this.scene.fog.color, {
        r: targetBg.r, g: targetBg.g, b: targetBg.b,
        duration: 0.8
      });
      gsap.to(this.floorMat.color, {
        r: targetFloor.r, g: targetFloor.g, b: targetFloor.b,
        duration: 0.8
      });
      gsap.to(this.keyLight.color, {
        r: targetKey.r, g: targetKey.g, b: targetKey.b,
        duration: 0.8
      });
      gsap.to(this.rimLight.color, {
        r: targetRim.r, g: targetRim.g, b: targetRim.b,
        duration: 0.8
      });
      gsap.to(this.ambientLight, {
        intensity: theme.ambient,
        duration: 0.8
      });
      gsap.to(this.renderer, {
        toneMappingExposure: theme.exposure,
        duration: 0.8
      });
    } else {
      this.scene.background.set(theme.bg);
      this.scene.fog.color.set(theme.fog);
      this.floorMat.color.set(theme.floor);
      this.keyLight.color.set(theme.keyLight);
      this.rimLight.color.set(theme.rimLight);
      this.ambientLight.intensity = theme.ambient;
      this.renderer.toneMappingExposure = theme.exposure;
    }

    if (window.HorologyAudio) window.HorologyAudio.playWindingClick();
  }

  setCustomBackgroundColor(hexColor) {
    const col = new THREE.Color(hexColor);
    this.scene.background.copy(col);
    this.scene.fog.color.copy(col);

    // Set darker tint for floor
    const floorCol = col.clone().multiplyScalar(0.7);
    this.floorMat.color.copy(floorCol);
  }

  setBrightness(val) {
    this.renderer.toneMappingExposure = THREE.MathUtils.clamp(val, 0.4, 2.5);
  }

  initUI() {
    // 0. Mobile Atelier Drawer, Backdrop & Quick Dock Handling
    const mobileMenuBtn = document.getElementById('btn-mobile-menu');
    const leftControls = document.getElementById('left-controls');
    const closeLeftDrawerBtn = document.getElementById('close-left-drawer');
    const backdrop = document.getElementById('drawer-backdrop');

    const openLeftDrawer = () => {
      if (leftControls) leftControls.classList.add('open');
      if (backdrop) backdrop.classList.add('active');
      if (window.HorologyAudio) window.HorologyAudio.playWindingClick();
    };

    const closeLeftDrawer = () => {
      if (leftControls) leftControls.classList.remove('open');
      if (backdrop) backdrop.classList.remove('active');
    };

    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', () => {
        if (leftControls && leftControls.classList.contains('open')) {
          closeLeftDrawer();
        } else {
          openLeftDrawer();
        }
      });
    }

    if (closeLeftDrawerBtn) {
      closeLeftDrawerBtn.addEventListener('click', closeLeftDrawer);
    }

    if (backdrop) {
      backdrop.addEventListener('click', () => {
        closeLeftDrawer();
        const ambDrawer = document.getElementById('ambiance-drawer');
        if (ambDrawer) ambDrawer.classList.remove('open');
        const inspDrawer = document.getElementById('inspector-drawer');
        if (inspDrawer) inspDrawer.classList.remove('open');
        backdrop.classList.remove('active');
      });
    }

    // Mobile Floating Quick Dock Buttons
    const dockViewsBtn = document.getElementById('dock-btn-views');
    const dockSpeedBtn = document.getElementById('dock-btn-speed');
    const dockAmbianceBtn = document.getElementById('dock-btn-ambiance');

    if (dockViewsBtn) {
      dockViewsBtn.addEventListener('click', () => {
        openLeftDrawer();
        const vantagePanel = document.querySelector('.view-button-list');
        if (vantagePanel) vantagePanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }

    if (dockSpeedBtn) {
      dockSpeedBtn.addEventListener('click', () => {
        openLeftDrawer();
        const speedPanel = document.querySelector('.speed-button-group');
        if (speedPanel) speedPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }

    if (dockAmbianceBtn) {
      dockAmbianceBtn.addEventListener('click', () => {
        closeLeftDrawer();
        const ambDrawer = document.getElementById('ambiance-drawer');
        if (ambDrawer) {
          const isOpen = ambDrawer.classList.toggle('open');
          if (backdrop) backdrop.classList.toggle('active', isOpen);
          if (window.HorologyAudio) window.HorologyAudio.playWindingClick();
        }
      });
    }

    // 1. Explosion Slider & Toggle
    const slider = document.getElementById('explode-slider');
    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value) / 100;
        this.explosionSystem.setExplosionProgress(val, true);
      });
    }

    const explodeToggleBtn = document.getElementById('btn-explode-toggle');
    if (explodeToggleBtn) {
      explodeToggleBtn.addEventListener('click', () => {
        this.explosionSystem.toggleExplosion();
      });
    }

    // 2. Watch Models Selector (8 Luxury Models)
    const modelCards = document.querySelectorAll('.model-card');
    modelCards.forEach(card => {
      card.addEventListener('click', () => {
        modelCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const modelKey = card.getAttribute('data-model');
        this.switchWatchModel(modelKey);
      });
    });

    // 3. Camera Preset Views
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        viewButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const viewType = btn.getAttribute('data-view');
        this.setCameraView(viewType);
      });
    });

    // Reset Camera Button
    const resetCamBtn = document.getElementById('btn-reset-camera');
    if (resetCamBtn) {
      resetCamBtn.addEventListener('click', () => {
        this.resetCamera();
      });
    }

    // 4. Timezone Selector
    const tzSelect = document.getElementById('timezone-select');
    if (tzSelect) {
      tzSelect.addEventListener('change', (e) => {
        window.HorologyMechanics.setTimezone(e.target.value);
        if (window.HorologyAudio) window.HorologyAudio.playWindingClick();
      });
    }

    // 5. Time Speed Buttons
    const speedButtons = document.querySelectorAll('.speed-btn');
    speedButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        speedButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const speed = parseFloat(btn.getAttribute('data-speed'));
        window.HorologyMechanics.setSpeed(speed);
        if (window.HorologyAudio) window.HorologyAudio.playWindingClick();
      });
    });

    // 6. Chronograph Buttons
    const chronoToggleBtn = document.getElementById('btn-chrono-toggle');
    const chronoResetBtn = document.getElementById('btn-chrono-reset');
    if (chronoToggleBtn) {
      chronoToggleBtn.addEventListener('click', () => {
        window.HorologyMechanics.toggleChronograph();
        const isRunning = window.HorologyMechanics.chronoRunning;
        chronoToggleBtn.classList.toggle('running', isRunning);
        chronoToggleBtn.textContent = isRunning ? 'Stop' : 'Start';
        if (window.HorologyAudio) window.HorologyAudio.playWindingClick();
      });
    }
    if (chronoResetBtn) {
      chronoResetBtn.addEventListener('click', () => {
        window.HorologyMechanics.resetChronograph();
        if (chronoToggleBtn) {
          chronoToggleBtn.classList.remove('running');
          chronoToggleBtn.textContent = 'Start';
        }
        if (window.HorologyAudio) window.HorologyAudio.playWindingClick();
      });
    }

    // 7. Sound Toggle & Volume
    const soundToggle = document.getElementById('sound-toggle');
    if (soundToggle) {
      soundToggle.addEventListener('click', () => {
        const isMuted = !window.HorologyAudio.isMuted;
        window.HorologyAudio.setMuted(isMuted);
        soundToggle.classList.toggle('active', !isMuted);
        const icon = soundToggle.querySelector('.sound-icon');
        if (icon) {
          icon.innerHTML = !isMuted ? '🔊' : '🔇';
        }
      });
    }

    // 8. Background Ambiance Modal / Toggle
    const bgModalToggle = document.getElementById('btn-ambiance-toggle');
    const bgDrawer = document.getElementById('ambiance-drawer');
    const closeBgDrawer = document.getElementById('close-ambiance');

    if (bgModalToggle && bgDrawer) {
      bgModalToggle.addEventListener('click', () => {
        bgDrawer.classList.toggle('open');
        if (window.HorologyAudio) window.HorologyAudio.playWindingClick();
      });
    }
    if (closeBgDrawer && bgDrawer) {
      closeBgDrawer.addEventListener('click', () => {
        bgDrawer.classList.remove('open');
      });
    }

    // Background Theme Cards
    const bgCards = document.querySelectorAll('.bg-theme-card');
    bgCards.forEach(card => {
      card.addEventListener('click', () => {
        bgCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const theme = card.getAttribute('data-bg-theme');
        this.applyBackgroundTheme(theme);
      });
    });

    // Custom Color Picker
    const colorPicker = document.getElementById('custom-bg-picker');
    if (colorPicker) {
      colorPicker.addEventListener('input', (e) => {
        this.setCustomBackgroundColor(e.target.value);
      });
    }

    // Brightness Slider
    const brightnessSlider = document.getElementById('bg-brightness-slider');
    if (brightnessSlider) {
      brightnessSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.setBrightness(val);
      });
    }

    // 9. Horological Inspector Card Controls
    const closeInspector = document.getElementById('close-inspector');
    if (closeInspector) {
      closeInspector.addEventListener('click', () => {
        document.getElementById('inspector-drawer').classList.remove('open');
        this.explosionSystem.resetIsolation();
      });
    }

    const isolateBtn = document.getElementById('btn-isolate-part');
    if (isolateBtn) {
      isolateBtn.addEventListener('click', () => {
        if (this.explosionSystem.selectedLayer) {
          const isCurrentlyIsolated = this.explosionSystem.isolatedLayerId === this.explosionSystem.selectedLayer.id;
          if (isCurrentlyIsolated) {
            this.explosionSystem.resetIsolation();
            isolateBtn.textContent = 'Isolate Component';
          } else {
            this.explosionSystem.isolateLayer(this.explosionSystem.selectedLayer.id);
            isolateBtn.textContent = 'Restore All Layers';
          }
        }
      });
    }


    // 11. Quick Layer Navigation Pills
    this.populateLayerPills();
  }

  populateLayerPills() {
    const container = document.getElementById('layer-pills-list');
    if (!container) return;

    this.watch.explodedLayers.forEach(layer => {
      const pill = document.createElement('button');
      pill.className = 'layer-pill';
      pill.setAttribute('data-id', layer.id);
      pill.innerHTML = `<span>${layer.name}</span>`;
      pill.addEventListener('click', () => {
        if (this.explosionSystem.progress < 0.25) {
          this.explosionSystem.setExplosionProgress(0.7);
        }
        this.explosionSystem.focusLayer(layer.id);
      });
      container.appendChild(pill);
    });
  }

  switchWatchModel(modelKey) {
    this.watch.updateModelTheme(modelKey);
    if (window.HorologyAudio) window.HorologyAudio.playWindingClick();

    const specsMap = {
      'ROSE_GOLD': {
        name: 'Calibre 01: Royal Skeleton Tourbillon',
        subtitle: '18K Rose Gold & Flame-Blued Steel • Flying Tourbillon',
        case: '18K 5N Rose Gold',
        finish: 'Côtes de Genève & Hand Anglage',
        water: '50 Meters (5 ATM)'
      },
      'STEALTH_CARBON': {
        name: 'Calibre 02: Chronos Stealth DLC',
        subtitle: 'Forged Carbon Fiber & Matte Black DLC Titanium • Cyan Lume',
        case: 'Forged Carbon & Grade 5 Titanium',
        finish: 'Black Ruthenium Treatment',
        water: '100 Meters (10 ATM)'
      },
      'PLATINUM_EMERALD': {
        name: 'Calibre 03: Celestial 950 Platinum',
        subtitle: 'Pure 950 Ice Platinum & Deep Emerald Green Accents',
        case: 'Solid 950 Ice Platinum',
        finish: 'Mirror Black Polish & Rhodium Platine',
        water: '30 Meters (3 ATM)'
      },
      'HERITAGE_BRONZE': {
        name: 'Calibre 04: Nautilus Heritage Marine',
        subtitle: 'CuSn8 Marine Patinated Bronze & Ivory Sunburst Complication',
        case: 'CuSn8 Marine Phosphor Bronze',
        finish: 'Gilt Brass & Circular Grainé',
        water: '300 Meters (30 ATM Diver)'
      },
      'COSMIC_METEORITE': {
        name: 'Calibre 05: Starlight Meteorite & Aventurine',
        subtitle: 'Widmanstätten Etched Meteorite & Deep Starry Aventurine Glass',
        case: 'Muonionalusta Meteorite & 18K White Gold',
        finish: 'Deep Aventurine & Starry Glints',
        water: '50 Meters (5 ATM)'
      },
      'MONACO_RACING': {
        name: 'Calibre 06: Monaco Grand Prix Chrono',
        subtitle: 'Gulf Racing Orange & Cyan Livery • Titanium Chronograph',
        case: '316L Satin Steel & Ceramic Bezel',
        finish: 'Orange Column Wheel & Panda Registers',
        water: '100 Meters (10 ATM)'
      },
      'SOVEREIGN_GOLD': {
        name: 'Calibre 07: Sovereign 24K Royal Gold',
        subtitle: 'Solid 24K Yellow Gold • Champagne Guilloché Skeleton Plate',
        case: 'Solid 24K Sovereign Yellow Gold',
        finish: 'Gilt Hand-Engraved Bridges & Pigeon Blood Rubis',
        water: '30 Meters (3 ATM)'
      },
      'PHANTOM_CERAMIC': {
        name: 'Calibre 08: Phantom Shadow Ceramic',
        subtitle: 'Zirconium Oxide Matte Blackout Ceramic • Smoked Sapphire Glass',
        case: 'Sintered ZrO2 High-Tech Ceramic',
        finish: 'Anthracite DLC & Stealth Monochrome',
        water: '200 Meters (20 ATM)'
      }
    };

    const info = specsMap[modelKey] || specsMap['ROSE_GOLD'];
    const titleEl = document.getElementById('model-hero-title');
    const subEl = document.getElementById('model-hero-subtitle');
    if (titleEl) titleEl.textContent = info.name;
    if (subEl) subEl.textContent = info.subtitle;
  }

  setCameraView(viewType) {
    if (typeof gsap === 'undefined') return;

    let targetPos = new THREE.Vector3();
    let targetLook = new THREE.Vector3(0, 0, 0);

    switch (viewType) {
      case 'front':
        targetPos.set(0, 0, 80);
        targetLook.set(0, 0, 0);
        break;
      case 'exploded':
        targetPos.set(70, 50, 95);
        targetLook.set(0, 0, 0);
        if (this.explosionSystem.progress < 0.3) {
          this.explosionSystem.setExplosionProgress(1.0);
        }
        break;
      case 'escapement':
        targetPos.set(0, 11, 26);
        targetLook.set(0, 11, 0);
        break;
      case 'caseback':
        targetPos.set(0, 0, -85);
        targetLook.set(0, 0, 0);
        break;
      case 'profile':
        targetPos.set(90, 0, 0);
        targetLook.set(0, 0, 0);
        break;
    }

    gsap.killTweensOf(this.camera.position);
    gsap.killTweensOf(this.controls.target);

    gsap.to(this.camera.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 1.4,
      ease: 'power2.inOut'
    });

    gsap.to(this.controls.target, {
      x: targetLook.x,
      y: targetLook.y,
      z: targetLook.z,
      duration: 1.2,
      ease: 'power2.inOut'
    });
  }

  resetCamera() {
    if (typeof gsap !== 'undefined') {
      gsap.to(this.camera.position, { x: 45, y: 30, z: 85, duration: 1.2, ease: 'power2.out' });
      gsap.to(this.controls.target, { x: 0, y: 0, z: 0, duration: 1.2, ease: 'power2.out' });
    } else {
      this.camera.position.set(45, 30, 85);
      this.controls.target.set(0, 0, 0);
    }
  }

  displayLayerInspector(layer) {
    const drawer = document.getElementById('inspector-drawer');
    if (!drawer) return;

    drawer.classList.add('open');
    const backdrop = document.getElementById('drawer-backdrop');
    if (backdrop && window.innerWidth <= 768) {
      backdrop.classList.add('active');
    }

    document.getElementById('inspect-title').textContent = layer.name;
    document.getElementById('inspect-french').textContent = layer.frenchName;
    document.getElementById('inspect-category').textContent = layer.category;
    document.getElementById('inspect-material').textContent = layer.materialDesc;
    document.getElementById('inspect-specs').textContent = layer.specs;
    document.getElementById('inspect-desc').textContent = layer.description;

    const isolateBtn = document.getElementById('btn-isolate-part');
    if (isolateBtn) {
      isolateBtn.textContent = 'Isolate Component';
    }

    document.querySelectorAll('.layer-pill').forEach(p => {
      p.classList.toggle('active', p.getAttribute('data-id') === layer.id);
    });
  }

  initKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          this.explosionSystem.toggleExplosion();
          break;
        case '1': this.switchWatchModel('ROSE_GOLD'); break;
        case '2': this.switchWatchModel('STEALTH_CARBON'); break;
        case '3': this.switchWatchModel('PLATINUM_EMERALD'); break;
        case '4': this.switchWatchModel('HERITAGE_BRONZE'); break;
        case '5': this.switchWatchModel('COSMIC_METEORITE'); break;
        case '6': this.switchWatchModel('MONACO_RACING'); break;
        case '7': this.switchWatchModel('SOVEREIGN_GOLD'); break;
        case '8': this.switchWatchModel('PHANTOM_CERAMIC'); break;
        case 'f': this.setCameraView('front'); break;
        case 'e': this.setCameraView('escapement'); break;
        case 'b': this.setCameraView('caseback'); break;
        case 'p': this.setCameraView('profile'); break;
        case 'r': this.resetCamera(); break;
        case 'm':
          const soundToggle = document.getElementById('sound-toggle');
          if (soundToggle) soundToggle.click();
          break;
      }
    });
  }

  updateDigitalClock(timeData) {
    const tc = timeData.timeComponents;
    const h = tc.hours.toString().padStart(2, '0');
    const m = tc.minutes.toString().padStart(2, '0');
    const s = tc.seconds.toString().padStart(2, '0');
    const ms = Math.floor(tc.milliseconds / 10).toString().padStart(2, '0');

    const clockEl = document.getElementById('digital-time');
    if (clockEl) {
      clockEl.innerHTML = `<span class="time-main">${h}:${m}:${s}</span><span class="time-ms">.${ms}</span>`;
    }

    const dateEl = document.getElementById('digital-date');
    if (dateEl) {
      dateEl.textContent = `${tc.dayName}, ${tc.day} ${tc.monthName} ${tc.year}`;
    }

    const chronoEl = document.getElementById('chrono-display');
    if (chronoEl) {
      const cSec = Math.floor(timeData.chronoElapsed);
      const cMin = Math.floor(cSec / 60);
      const remSec = cSec % 60;
      const cMs = Math.floor((timeData.chronoElapsed % 1) * 100);
      chronoEl.textContent = `${cMin.toString().padStart(2, '0')}:${remSec.toString().padStart(2, '0')}.${cMs.toString().padStart(2, '0')}`;
    }
  }

  animate(timestamp) {
    requestAnimationFrame(this.animate);

    const mechanicsData = window.HorologyMechanics.update(timestamp);
    this.watch.updateKinematics(mechanicsData);
    this.updateDigitalClock(mechanicsData);
    this.controls.update();
    this.explosionSystem.updateAnnotations();

    if (this.accentPoint) {
      this.accentPoint.position.x = Math.sin(timestamp * 0.002) * 5;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.App = new HorologyApp();
});

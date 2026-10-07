/**
 * AURELIA HOROLOGY - 3D Mechanical Watch Model Architecture
 * Builds a Haute Horlogerie skeleton timepiece in Three.js with 14 exploded layers,
 * perfectly positioned and meshed gear train, oscillating balance wheel, breathing hairspring,
 * synthetic rubies, Côtes de Genève bridges, and 8 curated watch models.
 */

class WatchModelBuilder {
  constructor(scene) {
    this.scene = scene;
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'WatchRoot';
    this.scene.add(this.rootGroup);

    // Layer registry for the explosion animation
    this.explodedLayers = [];

    // Animated mechanical nodes
    this.nodes = {
      secondsHand: null,
      minuteHand: null,
      hourHand: null,
      balanceWheel: null,
      hairspring: null,
      palletFork: null,
      escapeWheel: null,
      fourthWheel: null,
      thirdWheel: null,
      centerWheel: null,
      rotor: null,
      crown: null
    };

    // Butterfly clasp kinematic state & nodes
    this.claspProgress = 0.0;
    this.claspNodes = null;

    // Shared procedural textures
    this.textures = this.generateProceduralTextures();

    // Active model type
    this.currentModel = 'ROSE_GOLD';

    // Material library
    this.materials = this.createMaterials('ROSE_GOLD');

    // Build the 3D watch
    this.buildWatch();
  }

  generateProceduralTextures() {
    // 1. Côtes de Genève (Geneva Waves) texture for movement bridges
    const genevaCanvas = document.createElement('canvas');
    genevaCanvas.width = 512;
    genevaCanvas.height = 512;
    const gctx = genevaCanvas.getContext('2d');
    gctx.fillStyle = '#b0b5be';
    gctx.fillRect(0, 0, 512, 512);

    const stripeHeight = 32;
    for (let y = 0; y < 512; y += stripeHeight) {
      const grad = gctx.createLinearGradient(0, y, 0, y + stripeHeight);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#d8dce2');
      grad.addColorStop(0.7, '#8f959e');
      grad.addColorStop(1, '#686d75');
      gctx.fillStyle = grad;
      gctx.fillRect(0, y, 512, stripeHeight);

      // Fine brushed grain
      gctx.fillStyle = 'rgba(255,255,255,0.06)';
      for (let i = 0; i < 40; i++) {
        gctx.fillRect(Math.random() * 512, y + Math.random() * stripeHeight, Math.random() * 60, 1);
      }
    }
    const genevaTex = new THREE.CanvasTexture(genevaCanvas);
    genevaTex.wrapS = THREE.RepeatWrapping;
    genevaTex.wrapT = THREE.RepeatWrapping;
    genevaTex.repeat.set(1.5, 1.5);

    // 2. Perlage (Circular graining) texture for the mainplate
    const perlageCanvas = document.createElement('canvas');
    perlageCanvas.width = 512;
    perlageCanvas.height = 512;
    const pctx = perlageCanvas.getContext('2d');
    pctx.fillStyle = '#9aa0aa';
    pctx.fillRect(0, 0, 512, 512);

    const pearlRadius = 18;
    const step = 20;
    for (let y = -pearlRadius; y < 512 + pearlRadius; y += step) {
      const rowOffset = (Math.floor(y / step) % 2) * (step / 2);
      for (let x = -pearlRadius; x < 512 + pearlRadius; x += step) {
        const cx = x + rowOffset;
        const cy = y;
        const grad = pctx.createRadialGradient(cx, cy, 2, cx, cy, pearlRadius);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
        grad.addColorStop(0.5, 'rgba(200, 205, 215, 0.4)');
        grad.addColorStop(0.85, 'rgba(90, 95, 105, 0.5)');
        grad.addColorStop(1, 'rgba(60, 65, 75, 0.8)');
        pctx.fillStyle = grad;
        pctx.beginPath();
        pctx.arc(cx, cy, pearlRadius, 0, Math.PI * 2);
        pctx.fill();
      }
    }
    const perlageTex = new THREE.CanvasTexture(perlageCanvas);
    perlageTex.wrapS = THREE.RepeatWrapping;
    perlageTex.wrapT = THREE.RepeatWrapping;
    perlageTex.repeat.set(2, 2);

    // 3. Radial Anisotropic Brushed Metal Texture for gear wheels & rotor
    const radialCanvas = document.createElement('canvas');
    radialCanvas.width = 512;
    radialCanvas.height = 512;
    const rctx = radialCanvas.getContext('2d');
    rctx.fillStyle = '#c5ccd6';
    rctx.fillRect(0, 0, 512, 512);
    const rcx = 256, rcy = 256;
    for (let a = 0; a < Math.PI * 2; a += 0.015) {
      const shade = Math.sin(a * 4) * 0.2 + (Math.random() * 0.08);
      rctx.strokeStyle = shade > 0 ? `rgba(255,255,255,${shade})` : `rgba(0,0,0,${-shade})`;
      rctx.lineWidth = 1.5;
      rctx.beginPath();
      rctx.moveTo(rcx, rcy);
      rctx.lineTo(rcx + Math.cos(a) * 260, rcy + Math.sin(a) * 260);
      rctx.stroke();
    }
    const radialTex = new THREE.CanvasTexture(radialCanvas);


    // 5. Rehaut / Chapter Ring Track Texture
    const rehautCanvas = document.createElement('canvas');
    rehautCanvas.width = 1024;
    rehautCanvas.height = 1024;
    const rhctx = rehautCanvas.getContext('2d');
    rhctx.clearRect(0, 0, 1024, 1024);
    const rcX = 512, rcY = 512;
    const rRadius = 470;

    for (let sec = 0; sec < 60; sec++) {
      const angle = (sec / 60) * Math.PI * 2 - Math.PI / 2;
      const isFive = sec % 5 === 0;
      const length = isFive ? 32 : 16;
      const x1 = rcX + Math.cos(angle) * (rRadius - length);
      const y1 = rcY + Math.sin(angle) * (rRadius - length);
      const x2 = rcX + Math.cos(angle) * rRadius;
      const y2 = rcY + Math.sin(angle) * rRadius;

      rhctx.strokeStyle = isFive ? '#e6c875' : '#8c95a6';
      rhctx.lineWidth = isFive ? 5 : 2;
      rhctx.beginPath();
      rhctx.moveTo(x1, y1);
      rhctx.lineTo(x2, y2);
      rhctx.stroke();

      if (isFive) {
        const textRadius = rRadius - 52;
        const tx = rcX + Math.cos(angle) * textRadius;
        const ty = rcY + Math.sin(angle) * textRadius;
        rhctx.save();
        rhctx.translate(tx, ty);
        rhctx.rotate(angle + Math.PI / 2);
        rhctx.fillStyle = '#ffffff';
        rhctx.font = 'bold 26px "Inter", sans-serif';
        rhctx.textAlign = 'center';
        rhctx.textBaseline = 'middle';
        rhctx.fillText(sec === 0 ? '60' : sec.toString().padStart(2, '0'), 0, 0);
        rhctx.restore();
      }
    }
    const rehautTex = new THREE.CanvasTexture(rehautCanvas);

    // 6. Widmanstätten Meteorite Texture for Cosmic Meteorite Model
    const metCanvas = document.createElement('canvas');
    metCanvas.width = 512;
    metCanvas.height = 512;
    const mctx = metCanvas.getContext('2d');
    mctx.fillStyle = '#454a54';
    mctx.fillRect(0, 0, 512, 512);
    mctx.lineWidth = 1.5;
    for (let i = 0; i < 180; i++) {
      const a = (i % 3 === 0) ? Math.PI / 3 : (i % 3 === 1 ? -Math.PI / 3 : 0);
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const len = 30 + Math.random() * 90;
      mctx.strokeStyle = Math.random() > 0.5 ? 'rgba(215, 222, 235, 0.45)' : 'rgba(30, 34, 42, 0.55)';
      mctx.beginPath();
      mctx.moveTo(x, y);
      mctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
      mctx.stroke();
    }
    const meteoriteTex = new THREE.CanvasTexture(metCanvas);
    meteoriteTex.wrapS = THREE.RepeatWrapping;
    meteoriteTex.wrapT = THREE.RepeatWrapping;

    // 7. Starlight Aventurine Glass Texture
    const avCanvas = document.createElement('canvas');
    avCanvas.width = 512;
    avCanvas.height = 512;
    const actx = avCanvas.getContext('2d');
    actx.fillStyle = '#060e22';
    actx.fillRect(0, 0, 512, 512);
    // Mica glitter sparkles
    for (let s = 0; s < 400; s++) {
      const sx = Math.random() * 512;
      const sy = Math.random() * 512;
      const sr = Math.random() * 1.5;
      actx.fillStyle = Math.random() > 0.3 ? '#88ccff' : '#ffe8a0';
      actx.shadowColor = '#ffffff';
      actx.shadowBlur = sr > 1.0 ? 3 : 0;
      actx.beginPath();
      actx.arc(sx, sy, sr, 0, Math.PI * 2);
      actx.fill();
    }
    const aventurineTex = new THREE.CanvasTexture(avCanvas);

    return { genevaTex, perlageTex, radialTex, rehautTex, meteoriteTex, aventurineTex };
  }

  createMaterials(modelKey) {
    let caseColor = 0xdfa07d; // Rose Gold
    let caseRoughness = 0.25;
    let caseMetalness = 0.95;
    let bridgeColor = 0xd5dade;
    let dialAccentColor = 0xd4af37;
    let strapColor = 0x111318;
    let stitchColor = 0xe8dfd0; // French Écru Linen
    let handsColor = 0x1a45b8; // Heat-blued steel
    let lumeColor = 0x5affc2; // Swiss Super-LumiNova
    let caseMap = null;
    let dialMap = null;

    if (modelKey === 'STEALTH_CARBON') {
      caseColor = 0x1a1c22;
      caseRoughness = 0.45;
      caseMetalness = 0.85;
      bridgeColor = 0x22262d;
      dialAccentColor = 0x00f0ff;
      handsColor = 0x00f0ff;
      lumeColor = 0x00f0ff;
      strapColor = 0x121418;
      stitchColor = 0x00f0ff;
    } else if (modelKey === 'PLATINUM_EMERALD') {
      caseColor = 0xedf0f5;
      caseRoughness = 0.15;
      caseMetalness = 0.98;
      bridgeColor = 0xdde2ea;
      dialAccentColor = 0x0fa870;
      handsColor = 0xeeeeee;
      lumeColor = 0x88ffc8;
      strapColor = 0x0b241c;
      stitchColor = 0x5affc2;
    } else if (modelKey === 'HERITAGE_BRONZE') {
      caseColor = 0xbd8651;
      caseRoughness = 0.38;
      caseMetalness = 0.90;
      bridgeColor = 0xcfa86b;
      dialAccentColor = 0xdcb478;
      handsColor = 0x33281f;
      lumeColor = 0xf5d996;
      strapColor = 0x3d2716;
      stitchColor = 0xdcb478;
    } else if (modelKey === 'COSMIC_METEORITE') {
      caseColor = 0xc8ccd6;
      caseRoughness = 0.32;
      caseMetalness = 0.92;
      caseMap = this.textures.meteoriteTex;
      bridgeColor = 0x141a2e;
      dialAccentColor = 0x82b2ff;
      dialMap = this.textures.aventurineTex;
      handsColor = 0xffe6a0;
      lumeColor = 0xa4caff;
      strapColor = 0x091024;
      stitchColor = 0x82b2ff;
    } else if (modelKey === 'MONACO_RACING') {
      caseColor = 0xd8dde5;
      caseRoughness = 0.22;
      caseMetalness = 0.96;
      bridgeColor = 0x2b303c;
      dialAccentColor = 0xff5900; // Racing orange
      handsColor = 0xff5900;
      lumeColor = 0x00e5ff;
      strapColor = 0x181a1f;
      stitchColor = 0xff5900;
    } else if (modelKey === 'SOVEREIGN_GOLD') {
      caseColor = 0xffd034; // 24k Yellow Gold
      caseRoughness = 0.18;
      caseMetalness = 0.98;
      bridgeColor = 0xedd677;
      dialAccentColor = 0xffdc60;
      handsColor = 0x4a001a;
      lumeColor = 0xfff0aa;
      strapColor = 0x30180a;
      stitchColor = 0xffdc60;
    } else if (modelKey === 'PHANTOM_CERAMIC') {
      caseColor = 0x121418; // Zirconium Oxide matte black ceramic
      caseRoughness = 0.55;
      caseMetalness = 0.40;
      bridgeColor = 0x1c1f26;
      dialAccentColor = 0x5a6273;
      handsColor = 0x8a92a3;
      lumeColor = 0x444a56;
      strapColor = 0x0c0e12;
      stitchColor = 0x5a6273;
    }

    return {
      caseMetal: new THREE.MeshStandardMaterial({
        color: caseColor,
        metalness: caseMetalness,
        roughness: caseRoughness,
        map: caseMap,
        envMapIntensity: 1.3
      }),
      screws: new THREE.MeshStandardMaterial({
        color: (modelKey === 'STEALTH_CARBON' || modelKey === 'MONACO_RACING') ? 0x00f0ff : 0xffffff,
        metalness: 0.98,
        roughness: 0.1,
        envMapIntensity: 1.6
      }),
      bezel: new THREE.MeshStandardMaterial({
        color: caseColor,
        metalness: caseMetalness,
        roughness: caseRoughness * 1.1,
        map: caseMap
      }),
      sapphireGlass: new THREE.MeshPhysicalMaterial({
        color: 0x90c8ff,
        transparent: true,
        opacity: 0.14,
        metalness: 0.05,
        roughness: 0.02,
        transmission: 0.94,
        ior: 1.77,
        reflectivity: 0.7,
        clearcoat: 1.0,
        clearcoatRoughness: 0.04
      }),
      rehaut: new THREE.MeshStandardMaterial({
        color: (modelKey === 'MONACO_RACING') ? 0x141822 : (modelKey === 'PHANTOM_CERAMIC' ? 0x0e1014 : 0x242832),
        roughness: 0.3,
        metalness: 0.8
      }),
      bridges: new THREE.MeshStandardMaterial({
        color: bridgeColor,
        metalness: 0.92,
        roughness: 0.28,
        map: this.textures.genevaTex,
        bumpMap: this.textures.genevaTex,
        bumpScale: 0.05
      }),
      mainplate: new THREE.MeshStandardMaterial({
        color: (modelKey === 'PHANTOM_CERAMIC' || modelKey === 'STEALTH_CARBON') ? 0x1e2229 : (modelKey === 'HERITAGE_BRONZE' ? 0xc89e63 : 0xccd1da),
        metalness: 0.88,
        roughness: 0.32,
        map: this.textures.perlageTex,
        bumpMap: this.textures.perlageTex,
        bumpScale: 0.06
      }),
      gearsGold: new THREE.MeshStandardMaterial({
        color: (modelKey === 'PHANTOM_CERAMIC') ? 0x959ca8 : ((modelKey === 'SOVEREIGN_GOLD' || modelKey === 'ROSE_GOLD') ? 0xf0c850 : 0xe0ba48),
        metalness: 0.95,
        roughness: 0.22,
        map: this.textures.radialTex,
        bumpMap: this.textures.radialTex,
        bumpScale: 0.025
      }),
      polishedSteel: new THREE.MeshStandardMaterial({
        color: 0xedf0f5,
        metalness: 0.98,
        roughness: 0.10,
        envMapIntensity: 1.8
      }),
      rubyJewel: new THREE.MeshPhysicalMaterial({
        color: 0xdf0050,
        emissive: 0x5a001a,
        emissiveIntensity: 0.45,
        transparent: true,
        opacity: 0.92,
        metalness: 0.12,
        roughness: 0.06,
        transmission: 0.72,
        ior: 1.76
      }),
      goldChaton: new THREE.MeshStandardMaterial({
        color: 0xf5cf68,
        metalness: 0.98,
        roughness: 0.16,
        envMapIntensity: 1.6
      }),
      bluedSteel: new THREE.MeshStandardMaterial({
        color: handsColor,
        metalness: 0.94,
        roughness: 0.14,
        envMapIntensity: 2.0
      }),
      balanceWheelMat: new THREE.MeshStandardMaterial({
        color: (modelKey === 'STEALTH_CARBON') ? 0x00f0ff : ((modelKey === 'PHANTOM_CERAMIC') ? 0xa0a8b5 : 0xd8ad42),
        metalness: 0.95,
        roughness: 0.2
      }),
      hairspringMat: new THREE.MeshStandardMaterial({
        color: (modelKey === 'STEALTH_CARBON' || modelKey === 'MONACO_RACING') ? 0x00e5ff : 0x2958c4,
        metalness: 0.9,
        roughness: 0.2
      }),
      lume: new THREE.MeshStandardMaterial({
        color: lumeColor,
        emissive: lumeColor,
        emissiveIntensity: 0.75,
        roughness: 0.2
      }),
      rotorMat: new THREE.MeshStandardMaterial({
        color: (modelKey === 'PHANTOM_CERAMIC' || modelKey === 'STEALTH_CARBON') ? 0x1f2329 : caseColor,
        metalness: 0.95,
        roughness: 0.22,
        map: this.textures.radialTex
      }),
      dialAccent: new THREE.MeshStandardMaterial({
        color: dialAccentColor,
        map: dialMap,
        metalness: 0.85,
        roughness: 0.25
      })
    };
  }

  updateModelTheme(modelKey) {
    this.currentModel = modelKey;
    const newMats = this.createMaterials(modelKey);
    for (const key in newMats) {
      if (this.materials[key]) {
        this.materials[key].color.copy(newMats[key].color);
        this.materials[key].metalness = newMats[key].metalness;
        this.materials[key].roughness = newMats[key].roughness;
        if (newMats[key].map !== undefined) {
          this.materials[key].map = newMats[key].map;
        }
        if (newMats[key].emissive) {
          this.materials[key].emissive.copy(newMats[key].emissive);
          this.materials[key].emissiveIntensity = newMats[key].emissiveIntensity;
        }
        this.materials[key].needsUpdate = true;
      }
    }
  }

  // --- ACCURATE 2D/3D HOROLOGICAL COMPONENT HELPERS IN X-Y PLANE ---

  createScrew(radius = 1.2, height = 2.0) {
    const screwGroup = new THREE.Group();
    // Cylinder lying along Z axis
    const headGeom = new THREE.CylinderGeometry(radius, radius, height, 16);
    headGeom.rotateX(Math.PI / 2);
    const headMesh = new THREE.Mesh(headGeom, this.materials.screws);
    headMesh.castShadow = true;
    screwGroup.add(headMesh);

    // Slot on the face
    const slotGeom = new THREE.BoxGeometry(radius * 1.5, radius * 0.3, height * 0.4);
    const slotMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const slotMesh = new THREE.Mesh(slotGeom, slotMat);
    slotMesh.position.z = height * 0.35;
    screwGroup.add(slotMesh);

    return screwGroup;
  }

  createJeweledBearing(outerRadius = 2.5, rubyRadius = 1.6, height = 1.2) {
    const bearingGroup = new THREE.Group();
    // Gold chaton outer collar along Z
    const chatonGeom = new THREE.CylinderGeometry(outerRadius, outerRadius, height, 20);
    chatonGeom.rotateX(Math.PI / 2);
    const chaton = new THREE.Mesh(chatonGeom, this.materials.goldChaton);
    bearingGroup.add(chaton);

    // Synthetic Ruby core
    const rubyGeom = new THREE.CylinderGeometry(rubyRadius, rubyRadius, height * 1.1, 20);
    rubyGeom.rotateX(Math.PI / 2);
    const ruby = new THREE.Mesh(rubyGeom, this.materials.rubyJewel);
    ruby.position.z = height * 0.05;
    bearingGroup.add(ruby);

    return bearingGroup;
  }

  // PROPER HOROLOGICAL GEAR WHEEL (FLAT IN X-Y PLANE, ROTATES AROUND Z-AXIS)
  createGearWheel(outerRadius, teethCount, innerHoleRadius = 2, spokeCount = 4, thickness = 0.6) {
    const gearGroup = new THREE.Group();

    // 1. Wheel Rim (Circle in X-Y plane)
    const rimGeom = new THREE.CylinderGeometry(outerRadius, outerRadius, thickness, 48);
    rimGeom.rotateX(Math.PI / 2);
    const rimMesh = new THREE.Mesh(rimGeom, this.materials.gearsGold);
    rimMesh.castShadow = true;
    gearGroup.add(rimMesh);

    // 2. Involute Gear Teeth in X-Y plane
    const toothWidth = (Math.PI * 2 * outerRadius) / (teethCount * 2.2);
    const toothHeight = outerRadius * 0.15;
    const toothGeom = new THREE.BoxGeometry(toothWidth, toothHeight, thickness * 0.96);

    for (let i = 0; i < teethCount; i++) {
      const angle = (i / teethCount) * Math.PI * 2;
      const tooth = new THREE.Mesh(toothGeom, this.materials.gearsGold);
      const dist = outerRadius + toothHeight * 0.4;
      tooth.position.set(Math.cos(angle) * dist, Math.sin(angle) * dist, 0);
      tooth.rotation.z = angle - Math.PI / 2;
      gearGroup.add(tooth);
    }

    // 3. Openwork Spokes in X-Y plane
    const spokeLen = outerRadius - innerHoleRadius;
    const spokeGeom = new THREE.BoxGeometry(spokeLen, thickness * 1.2, thickness * 0.9);
    for (let s = 0; s < spokeCount; s++) {
      const sAngle = (s / spokeCount) * Math.PI * 2;
      const spoke = new THREE.Mesh(spokeGeom, this.materials.gearsGold);
      const sDist = spokeLen * 0.5 + innerHoleRadius * 0.8;
      spoke.position.set(Math.cos(sAngle) * sDist, Math.sin(sAngle) * sDist, 0);
      spoke.rotation.z = sAngle;
      gearGroup.add(spoke);
    }

    // 4. Central steel arbor along Z
    const arborGeom = new THREE.CylinderGeometry(innerHoleRadius, innerHoleRadius, thickness * 2.5, 20);
    arborGeom.rotateX(Math.PI / 2);
    const arbor = new THREE.Mesh(arborGeom, this.materials.polishedSteel);
    gearGroup.add(arbor);

    // 5. Steel Pinion Leaves (central small gear for kinematic meshing)
    const pinionRadius = innerHoleRadius * 1.35;
    const pinionLeaves = 8;
    const leafGeom = new THREE.BoxGeometry(0.5, 0.8, thickness * 2.2);
    for (let p = 0; p < pinionLeaves; p++) {
      const pa = (p / pinionLeaves) * Math.PI * 2;
      const leaf = new THREE.Mesh(leafGeom, this.materials.polishedSteel);
      leaf.position.set(Math.cos(pa) * pinionRadius, Math.sin(pa) * pinionRadius, 0);
      leaf.rotation.z = pa - Math.PI / 2;
      gearGroup.add(leaf);
    }

    return gearGroup;
  }

  // --- THE 14 SEPARATED EXPLODED LAYERS ---

  buildWatch() {
    this.buildLayer1_Bezel();
    this.buildLayer2_SapphireCrystal();
    this.buildLayer3_Rehaut();
    this.buildLayer4_Hands();
    this.buildLayer5_Dial();
    this.buildLayer10_BalanceAndHairspring(); // Regulating Organ: rotated 180°
    this.buildLayer7_UpperBridges();
    this.buildLayer8_GearTrain();
    this.buildLayer9_Escapement();
    this.buildLayer11_Mainplate();
    this.buildLayer12_Rotor();
    this.buildLayer13_Caseback();
    this.buildLayer14_Case();

    this.applyExplosionProgress(0);
  }

  registerLayer(layerObj) {
    this.rootGroup.add(layerObj.group);
    this.explodedLayers.push(layerObj);
  }

  // 1. BEZEL & SCREWS
  buildLayer1_Bezel() {
    const group = new THREE.Group();
    group.name = 'Layer_Bezel';

    const shape = new THREE.Shape();
    const sides = 8;
    const outerR = 36;
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2 + Math.PI / 8;
      const x = Math.cos(a) * outerR;
      const y = Math.sin(a) * outerR;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();

    const holePath = new THREE.Path();
    holePath.absarc(0, 0, 30, 0, Math.PI * 2, true);
    shape.holes.push(holePath);

    const extrudeSettings = { depth: 3, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.8, bevelThickness: 0.8 };
    const bezelGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const bezelMesh = new THREE.Mesh(bezelGeom, this.materials.bezel);
    bezelMesh.position.z = -1.5;
    bezelMesh.castShadow = true;
    group.add(bezelMesh);

    // 8 Mirror-polished Hex Screws placed on the bezel facets
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const sx = Math.cos(a) * 33;
      const sy = Math.sin(a) * 33;
      const screw = this.createScrew(1.3, 2.2);
      screw.position.set(sx, sy, 1.8);
      screw.rotation.z = a + Math.PI / 4;
      group.add(screw);
    }

    this.registerLayer({
      id: 'layer_bezel',
      name: 'Octagonal Bezel & Titanium Screws',
      frenchName: 'Lunette Octogonale & Vis Polies',
      category: 'Exterior Architecture',
      materialDesc: 'Grade 5 Satin-Brushed Titanium with Mirror Chamfers',
      specs: '8 Hexagonal Flush Screws • Beveled Edge Radius 0.8mm',
      description: 'The iconic bezel secures the front crystal with eight perfectly countersunk screws, offering extreme rigidity and water resistance up to 10 ATM.',
      group: group,
      baseZ: 6.5,
      explodeZ: 95,
      offsetX: 0,
      offsetY: 0
    });
  }

  // 2. SAPPHIRE CRYSTAL
  buildLayer2_SapphireCrystal() {
    const group = new THREE.Group();
    group.name = 'Layer_Crystal';

    const crystalGeom = new THREE.CylinderGeometry(29.8, 29.8, 2.2, 64);
    crystalGeom.rotateX(Math.PI / 2);
    const crystal = new THREE.Mesh(crystalGeom, this.materials.sapphireGlass);
    group.add(crystal);

    const rimGeom = new THREE.TorusGeometry(29.5, 0.4, 16, 64);
    const arRimMat = new THREE.MeshBasicMaterial({ color: 0x4890ff, transparent: true, opacity: 0.4 });
    const rim = new THREE.Mesh(rimGeom, arRimMat);
    group.add(rim);

    this.registerLayer({
      id: 'layer_crystal',
      name: 'Top Sapphire Crystal Glass',
      frenchName: 'Glace Saphir Inrayable Antireflet',
      category: 'Optics & Protection',
      materialDesc: 'Synthetic Monocrystalline Corundum (9 Mohs Hardness)',
      specs: 'Double AR Coating • 1.77 Refractive Index • Thickness 2.2mm',
      description: 'Diamond-cut sapphire crystal with dual anti-reflective coating on both interior and exterior surfaces, delivering maximum clarity to the openworked movement.',
      group: group,
      baseZ: 5.2,
      explodeZ: 80,
      offsetX: 0,
      offsetY: 0
    });
  }

  // 3. REHAUT / CHAPTER RING
  buildLayer3_Rehaut() {
    const group = new THREE.Group();
    group.name = 'Layer_Rehaut';

    const outerR = 30.0;
    const innerR = 26.5;
    const height = 2.4;
    const geom = new THREE.CylinderGeometry(outerR, innerR, height, 64, 1, true);
    geom.rotateX(Math.PI / 2);
    const mesh = new THREE.Mesh(geom, this.materials.rehaut);
    group.add(mesh);

    const discGeom = new THREE.RingGeometry(innerR, outerR, 64);
    const discMat = new THREE.MeshStandardMaterial({
      map: this.textures.rehautTex,
      transparent: true,
      roughness: 0.3,
      metalness: 0.7
    });
    const disc = new THREE.Mesh(discGeom, discMat);
    disc.position.z = 1.1;
    group.add(disc);

    this.registerLayer({
      id: 'layer_rehaut',
      name: 'Rehaut & 1/5th Sec Chapter Ring',
      frenchName: 'Rehaut & Minuterie Graduée',
      category: 'Precision Calibration',
      materialDesc: 'Diamond-Milled Ruthenium Flange with Swiss Lume Markers',
      specs: '300 Precision Track Divisions • 45° Inward Angle',
      description: 'The angled rehaut creates three-dimensional depth over the dial, housing the 1/5th-of-a-second track synchronized with the 4Hz (28,800 vph) escapement.',
      group: group,
      baseZ: 3.8,
      explodeZ: 65,
      offsetX: 0,
      offsetY: 0
    });
  }

  // 4. SKELETON HANDS SET
  buildLayer4_Hands() {
    const group = new THREE.Group();
    group.name = 'Layer_Hands';

    const capGeom = new THREE.CylinderGeometry(1.6, 1.6, 2.0, 32);
    capGeom.rotateX(Math.PI / 2);
    const capMesh = new THREE.Mesh(capGeom, this.materials.screws);
    group.add(capMesh);

    // A. Sweeping Seconds Hand
    const secGroup = new THREE.Group();
    secGroup.name = 'SecondsHand';

    const secBladeGeom = new THREE.BoxGeometry(0.35, 23.5, 0.2);
    const secBlade = new THREE.Mesh(secBladeGeom, this.materials.bluedSteel);
    secBlade.position.y = 9.5;
    secGroup.add(secBlade);

    const secTipGeom = new THREE.ConeGeometry(0.7, 3.5, 16);
    const secTip = new THREE.Mesh(secTipGeom, this.materials.lume);
    secTip.position.y = 21.0;
    secGroup.add(secTip);

    const cwGeom = new THREE.TorusGeometry(1.4, 0.35, 16, 32);
    const cwMesh = new THREE.Mesh(cwGeom, this.materials.bluedSteel);
    cwMesh.position.y = -4.5;
    secGroup.add(cwMesh);

    secGroup.position.z = 1.0;
    group.add(secGroup);
    this.nodes.secondsHand = secGroup;

    // B. Skeleton Dauphine Minute Hand
    const minGroup = new THREE.Group();
    minGroup.name = 'MinuteHand';

    const minShape = new THREE.Shape();
    minShape.moveTo(-1.2, 0);
    minShape.lineTo(-0.8, 12);
    minShape.lineTo(0, 19.5);
    minShape.lineTo(0.8, 12);
    minShape.lineTo(1.2, 0);
    minShape.lineTo(0, -2.5);
    minShape.closePath();

    const minHole = new THREE.Path();
    minHole.moveTo(-0.4, 2.5);
    minHole.lineTo(-0.3, 11);
    minHole.lineTo(0, 15);
    minHole.lineTo(0.3, 11);
    minHole.lineTo(0.4, 2.5);
    minHole.closePath();
    minShape.holes.push(minHole);

    const minGeom = new THREE.ExtrudeGeometry(minShape, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1 });
    const minMesh = new THREE.Mesh(minGeom, this.materials.caseMetal);
    minMesh.position.z = -0.17;
    minMesh.castShadow = true;
    minGroup.add(minMesh);

    const minLumeGeom = new THREE.BoxGeometry(0.5, 3.5, 0.25);
    const minLume = new THREE.Mesh(minLumeGeom, this.materials.lume);
    minLume.position.y = 13.5;
    minGroup.add(minLume);

    minGroup.position.z = 0.5;
    group.add(minGroup);
    this.nodes.minuteHand = minGroup;

    // C. Skeleton Dauphine Hour Hand
    const hrGroup = new THREE.Group();
    hrGroup.name = 'HourHand';

    const hrShape = new THREE.Shape();
    hrShape.moveTo(-1.5, 0);
    hrShape.lineTo(-1.1, 8.5);
    hrShape.lineTo(0, 13.5);
    hrShape.lineTo(1.1, 8.5);
    hrShape.lineTo(1.5, 0);
    hrShape.lineTo(0, -2.5);
    hrShape.closePath();

    const hrHole = new THREE.Path();
    hrHole.moveTo(-0.5, 2.0);
    hrHole.lineTo(-0.35, 7.5);
    hrHole.lineTo(0, 10.0);
    hrHole.lineTo(0.35, 7.5);
    hrHole.lineTo(0.5, 2.0);
    hrHole.closePath();
    hrShape.holes.push(hrHole);

    const hrGeom = new THREE.ExtrudeGeometry(hrShape, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1 });
    const hrMesh = new THREE.Mesh(hrGeom, this.materials.caseMetal);
    hrMesh.position.z = -0.17;
    hrMesh.castShadow = true;
    hrGroup.add(hrMesh);

    const hrLumeGeom = new THREE.BoxGeometry(0.6, 2.5, 0.25);
    const hrLume = new THREE.Mesh(hrLumeGeom, this.materials.lume);
    hrLume.position.y = 8.5;
    hrGroup.add(hrLume);

    hrGroup.position.z = 0.1;
    group.add(hrGroup);
    this.nodes.hourHand = hrGroup;

    this.registerLayer({
      id: 'layer_hands',
      name: 'Skeleton Dauphine Hands Set',
      frenchName: 'Jeu d’Aiguilles Dauphines Squelette',
      category: 'Time Indication',
      materialDesc: 'Faceted 18k Gold & Flame-Blued Steel with Super-LumiNova BGW9',
      specs: 'Hand-beveled Chamfers • Counterbalanced Seconds Needle',
      description: 'Openworked hands diamond-polished along their facets for optimal legibility against the complex mechanical skeleton movement beneath.',
      group: group,
      baseZ: 2.6,
      explodeZ: 50,
      offsetX: 0,
      offsetY: 0
    });
  }

  // 5. SKELETON OPENWORKED DIAL
  buildLayer5_Dial() {
    const group = new THREE.Group();
    group.name = 'Layer_Dial';

    const dialOuterR = 27.5;
    const dialInnerR = 19.0;
    const ringGeom = new THREE.RingGeometry(dialInnerR, dialOuterR, 64);
    const ringMesh = new THREE.Mesh(ringGeom, this.materials.rehaut);
    group.add(ringMesh);

    // 12 Applied Faceted Hour Markers
    for (let h = 0; h < 12; h++) {
      const a = (h / 12) * Math.PI * 2 - Math.PI / 2;
      const mx = Math.cos(a) * 23.5;
      const my = Math.sin(a) * 23.5;
      const isCard = h % 3 === 0;

      const markerGeom = new THREE.BoxGeometry(isCard ? 2.2 : 1.4, isCard ? 4.5 : 3.2, 1.2);
      const marker = new THREE.Mesh(markerGeom, this.materials.caseMetal);
      marker.position.set(mx, my, 0.6);
      marker.rotation.z = a + Math.PI / 2;
      marker.castShadow = true;
      group.add(marker);

      const markerLumeGeom = new THREE.BoxGeometry(isCard ? 1.0 : 0.6, isCard ? 3.0 : 2.0, 0.4);
      const markerLume = new THREE.Mesh(markerLumeGeom, this.materials.lume);
      markerLume.position.set(mx, my, 1.25);
      markerLume.rotation.z = a + Math.PI / 2;
      group.add(markerLume);
    }

    // Openwork spiderweb bridges exposing the tourbillon & gear train
    const bridgeShape = new THREE.Shape();
    bridgeShape.moveTo(-20, 2);
    bridgeShape.lineTo(-12, 14);
    bridgeShape.lineTo(-9, 14);
    bridgeShape.lineTo(-17, 2);
    bridgeShape.closePath();
    const bridgeGeom = new THREE.ExtrudeGeometry(bridgeShape, { depth: 0.8, bevelEnabled: true, bevelSize: 0.1, bevelThickness: 0.1 });
    const bMesh1 = new THREE.Mesh(bridgeGeom, this.materials.caseMetal);
    group.add(bMesh1);

    // Tourbillon / Balance aperture frame ring at 12 o'clock (rotated 180° along Z)
    const tourbRingGeom = new THREE.TorusGeometry(8.5, 0.7, 16, 48);
    const tourbRing = new THREE.Mesh(tourbRingGeom, this.materials.caseMetal);
    tourbRing.position.set(0, 11, 0.4);
    group.add(tourbRing);

    // Brand plaque at 6 o'clock (rotated 180° along Z)
    const plaqueGeom = new THREE.BoxGeometry(11, 4.5, 0.6);
    const plaque = new THREE.Mesh(plaqueGeom, this.materials.caseMetal);
    plaque.position.set(0, -13.5, 0.4);
    group.add(plaque);

    this.registerLayer({
      id: 'layer_dial',
      name: 'Openworked Architectural Skeleton Dial',
      frenchName: 'Cadran Squelette Architecture Ajourée',
      category: 'Complication Display',
      materialDesc: 'Hand-Milled Anthracite & 18K Gold Applied Batons',
      specs: '12 Faceted Hour Markers • Floating Tourbillon Aperture',
      description: 'The skeleton dial removes all superfluous material to showcase the pulsing escapement and meshing wheels beneath, framed by glowing Super-LumiNova hour plots.',
      group: group,
      baseZ: 1.4,
      explodeZ: 38,
      offsetX: 0,
      offsetY: 0
    });
  }

  // 7. UPPER BRIDGES & JEWELS (Côtes de Genève, rotated 180° along Z)
  buildLayer7_UpperBridges() {
    const group = new THREE.Group();
    group.name = 'Layer_Bridges';

    const bShape = new THREE.Shape();
    bShape.moveTo(25, 4);
    bShape.lineTo(24, -18);
    bShape.bezierCurveTo(15, -26, -15, -26, -24, -18);
    bShape.lineTo(-25, 4);
    bShape.bezierCurveTo(-15, 1, 15, 1, 25, 4);
    bShape.closePath();

    const hole1 = new THREE.Path();
    hole1.absarc(11.0, -5.5, 8.0, 0, Math.PI * 2, false);
    bShape.holes.push(hole1);

    const hole2 = new THREE.Path();
    hole2.absarc(-6.5, 4.0, 6.0, 0, Math.PI * 2, false);
    bShape.holes.push(hole2);

    const bridgeGeom = new THREE.ExtrudeGeometry(bShape, { depth: 1.4, bevelEnabled: true, bevelSize: 0.25, bevelThickness: 0.25 });
    const bridgeMesh = new THREE.Mesh(bridgeGeom, this.materials.bridges);
    bridgeMesh.position.z = -0.7;
    bridgeMesh.castShadow = true;
    group.add(bridgeMesh);

    // 5 Synthetic Ruby Jewel Bearings set into gold chatons with micro-screws (rotated 180°)
    const bearingCoords = [
      { x: 0, y: 0 },
      { x: 11.0, y: -5.5 },
      { x: -6.5, y: 4.0 },
      { x: 0, y: 9.5 },
      { x: 5.2, y: 9.0 }
    ];

    bearingCoords.forEach(pos => {
      const bearing = this.createJeweledBearing(2.4, 1.4, 1.6);
      bearing.position.set(pos.x, pos.y, 0.4);
      group.add(bearing);

      [-2.4, 2.4].forEach(ox => {
        const bluedScrew = this.createScrew(0.7, 1.2);
        bluedScrew.children[0].material = this.materials.bluedSteel;
        bluedScrew.position.set(pos.x + ox, pos.y - 1.8, 0.8);
        group.add(bluedScrew);
      });
    });

    this.registerLayer({
      id: 'layer_bridges',
      name: 'Côtes de Genève Upper Train Bridges',
      frenchName: 'Ponts de Rouage aux Côtes de Genève',
      category: 'Movement Framework',
      materialDesc: 'Hand-Finished Nickel Silver (Maillechort) with 25 Rubis',
      specs: 'Mirror Anglage (Beveling) • 18K Solid Gold Screwed Chatons',
      description: 'The upper bridges secure the gear train arbors under extreme stability, decorated with traditional 1.5mm Geneva wave stripes and polished ruby jewels.',
      group: group,
      baseZ: -0.8,
      explodeZ: 12,
      offsetX: 0,
      offsetY: 0
    });
  }

  // 8. GEAR TRAIN & WHEELS (KINEMATICALLY MESHED IN X-Y PLANE, ROTATED 180°)
  buildLayer8_GearTrain() {
    const group = new THREE.Group();
    group.name = 'Layer_GearTrain';

    // A. Center Wheel (Hours/Minutes cannon drive, 1 rev/hour) at (0, 0)
    // Radius 7.5, meshes with third wheel pinion at (-6.5, 4.0)
    const centerWheel = this.createGearWheel(7.5, 48, 2.0, 5, 0.6);
    centerWheel.position.set(0, 0, 0.4);
    group.add(centerWheel);
    this.nodes.centerWheel = centerWheel;

    // B. Mainspring Power Barrel at (11.0, -5.5, -0.4) (rotated 180°)
    const barrelGeom = new THREE.CylinderGeometry(9.5, 9.5, 1.8, 48);
    barrelGeom.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeom, this.materials.gearsGold);
    barrel.position.set(11.0, -5.5, -0.4);
    barrel.castShadow = true;
    group.add(barrel);

    // Barrel ratchet wheel with radial teeth
    const ratchet = this.createGearWheel(8.5, 36, 2.4, 6, 0.5);
    ratchet.position.set(11.0, -5.5, 0.7);
    group.add(ratchet);

    // C. Third Wheel (Intermediate reduction) at (-6.5, 4.0, 0.1) (rotated 180°)
    // Radius 6.5, steel pinion radius 2.0
    const thirdWheel = this.createGearWheel(6.5, 40, 1.8, 4, 0.5);
    thirdWheel.position.set(-6.5, 4.0, 0.1);
    group.add(thirdWheel);
    this.nodes.thirdWheel = thirdWheel;

    // D. Fourth Wheel (Seconds wheel, 1 rev/min) at (0, 9.5, -0.2) (rotated 180°)
    // Meshes with third wheel rim (radius 6.5) at distance 8.5
    const fourthWheel = this.createGearWheel(5.5, 36, 1.6, 5, 0.5);
    fourthWheel.position.set(0, 9.5, -0.2);
    group.add(fourthWheel);
    this.nodes.fourthWheel = fourthWheel;

    this.registerLayer({
      id: 'layer_gears',
      name: 'Horological Gear Train & Power Barrel',
      frenchName: 'Rouage de Finition & Barillet de Force',
      category: 'Energy Transmission',
      materialDesc: 'CuBe2 Beryllium Bronze Gears & Polished Steel Pinions',
      specs: '72-Hour Power Reserve • Involute Tooth Profile (AGMA 12)',
      description: 'The gear train transfers potential energy from the Nivaflex mainspring barrel through the center, third, and fourth wheels to the escapement with 98.4% transmission efficiency.',
      group: group,
      baseZ: -2.4,
      explodeZ: -5,
      offsetX: 0,
      offsetY: 0
    });
  }

  // 9. SWISS LEVER ESCAPEMENT & PALLET FORK (ROTATED 180°)
  buildLayer9_Escapement() {
    const group = new THREE.Group();
    group.name = 'Layer_Escapement';

    // 15-Tooth Club-Tooth Escape Wheel at (5.2, 9.0, 0.2)
    // Driven by Fourth Wheel rim
    const escGroup = new THREE.Group();
    escGroup.position.set(5.2, 9.0, 0.2);

    const escRimGeom = new THREE.CylinderGeometry(3.6, 3.6, 0.4, 30);
    escRimGeom.rotateX(Math.PI / 2);
    const escRim = new THREE.Mesh(escRimGeom, this.materials.bluedSteel);
    escGroup.add(escRim);

    // 15 Distinctive club impulse teeth in X-Y plane
    const toothShape = new THREE.Shape();
    toothShape.moveTo(0, 0);
    toothShape.lineTo(0.4, 1.0);
    toothShape.lineTo(1.4, 1.5);
    toothShape.lineTo(1.2, 0.6);
    toothShape.closePath();
    const toothGeom = new THREE.ExtrudeGeometry(toothShape, { depth: 0.35, bevelEnabled: false });

    for (let t = 0; t < 15; t++) {
      const a = (t / 15) * Math.PI * 2;
      const tooth = new THREE.Mesh(toothGeom, this.materials.bluedSteel);
      tooth.position.set(Math.cos(a) * 3.4, Math.sin(a) * 3.4, -0.17);
      tooth.rotation.z = a - Math.PI / 2;
      escGroup.add(tooth);
    }
    group.add(escGroup);
    this.nodes.escapeWheel = escGroup;

    // Pallet Fork (Swiss Lever with synthetic ruby pallets) at (2.8, 11.2, 0.3)
    const forkGroup = new THREE.Group();
    forkGroup.position.set(2.8, 11.2, 0.3);

    const leverShape = new THREE.Shape();
    leverShape.moveTo(-2.0, 1.4);
    leverShape.lineTo(0, -0.4);
    leverShape.lineTo(2.0, 1.4);
    leverShape.lineTo(1.4, 1.8);
    leverShape.lineTo(0, 0.4);
    leverShape.lineTo(-1.4, 1.8);
    leverShape.closePath();
    const leverGeom = new THREE.ExtrudeGeometry(leverShape, { depth: 0.45, bevelEnabled: false });
    const lever = new THREE.Mesh(leverGeom, this.materials.polishedSteel);
    lever.position.z = -0.22;
    forkGroup.add(lever);

    // Synthetic ruby pallets
    [-1.8, 1.8].forEach((px, idx) => {
      const palGeom = new THREE.BoxGeometry(0.65, 1.3, 0.5);
      const palMesh = new THREE.Mesh(palGeom, this.materials.rubyJewel);
      palMesh.position.set(px, 1.4, 0);
      palMesh.rotation.z = idx === 0 ? 0.38 : -0.38;
      forkGroup.add(palMesh);
    });

    group.add(forkGroup);
    this.nodes.palletFork = forkGroup;

    this.registerLayer({
      id: 'layer_escapement',
      name: 'Swiss Lever Escapement & Ruby Pallets',
      frenchName: 'Échappement à Ancre Suisse & Palettes Rubis',
      category: 'Impulse Distributor',
      materialDesc: 'Laser-Etched Single-Crystal Blued Silicon & Synthetic Ruby Pallets',
      specs: '15-Tooth Club Profile • 5° Lift Angle • 28,800 Beats/Hr',
      description: 'The heart of mechanical timekeeping: transforms continuous rotary gear motion into precision 8-beats-per-second discrete acoustic impulses as the ruby pallets alternate contact.',
      group: group,
      baseZ: -3.8,
      explodeZ: -20,
      offsetX: 0,
      offsetY: 0
    });
  }

  // 10. BALANCE WHEEL & HAIRSPRING (ROTATED & POSITIONED IN FRONT OF BALANCE BRIDGE)
  buildLayer10_BalanceAndHairspring() {
    const group = new THREE.Group();
    group.name = 'Layer_Balance';

    // Unified Balance & Bridge Assembly at 12 o'clock (0, 11.0, 0)
    const balanceAssembly = new THREE.Group();
    balanceAssembly.position.set(0, 11.0, 0);

    // 1. CANTILEVER BALANCE COCK (THE METAL BRIDGE ATTACHED, POSITIONED BEHIND BALANCE WHEEL)
    const cockShape = new THREE.Shape();
    // Shape relative to balance center (0, 0):
    // Root anchors to movement rim at y = +8 (world Y = 19)
    // Arms sweep around balance wheel down to y = -5 (world Y = 6)
    cockShape.moveTo(13, 8);
    cockShape.lineTo(12, -5);
    cockShape.bezierCurveTo(6, -3.5, -6, -3.5, -12, -5);
    cockShape.lineTo(-13, 8);
    cockShape.closePath();

    const cockGeom = new THREE.ExtrudeGeometry(cockShape, {
      depth: 0.9,
      bevelEnabled: true,
      bevelSize: 0.22,
      bevelThickness: 0.22
    });
    // Position bridge BEHIND balance wheel: z from -0.9 to 0.0
    const cock = new THREE.Mesh(cockGeom, this.materials.bridges);
    cock.position.set(0, 0, -0.9);
    cock.castShadow = true;
    cock.receiveShadow = true;
    balanceAssembly.add(cock);

    // Swan-Neck Fine Regulator (Col de Cygne) in mirror-polished steel on the bridge
    const swanGroup = new THREE.Group();
    swanGroup.position.set(0, 3.5, -0.2);

    const swanShape = new THREE.Shape();
    swanShape.moveTo(-3.5, 0);
    swanShape.bezierCurveTo(-5.0, 2.5, -3.5, 4.5, -1.0, 4.2);
    swanShape.bezierCurveTo(1.5, 3.8, 1.0, 1.5, -0.5, 1.0);
    swanShape.lineTo(-0.8, 0.4);
    swanShape.bezierCurveTo(0.8, 0.8, 1.8, 2.8, 0.0, 3.6);
    swanShape.bezierCurveTo(-2.5, 4.2, -4.0, 2.0, -2.8, 0);
    swanShape.closePath();

    const swanGeom = new THREE.ExtrudeGeometry(swanShape, { depth: 0.25, bevelEnabled: false });
    const swanMesh = new THREE.Mesh(swanGeom, this.materials.polishedSteel);
    swanGroup.add(swanMesh);

    // Swan-neck micro-metric regulation screw
    const regScrew = this.createScrew(0.6, 1.2);
    regScrew.position.set(-4.0, 2.2, 0.15);
    regScrew.rotation.z = Math.PI / 4;
    swanGroup.add(regScrew);

    // Regulation index pointer arm (raquette)
    const pointerGeom = new THREE.BoxGeometry(0.35, 3.8, 0.2);
    const pointer = new THREE.Mesh(pointerGeom, this.materials.polishedSteel);
    pointer.position.set(0, -1.5, 0.1);
    swanGroup.add(pointer);
    balanceAssembly.add(swanGroup);

    // Heat-blued bridge mounting screws at top rim (local y = +5.5, world Y = 16.5)
    const cockScrew1 = this.createScrew(1.1, 1.8);
    cockScrew1.position.set(-9.5, 5.5, -0.2);
    balanceAssembly.add(cockScrew1);

    const cockScrew2 = this.createScrew(1.1, 1.8);
    cockScrew2.position.set(9.5, 5.5, -0.2);
    balanceAssembly.add(cockScrew2);

    // Lower jewel bearing supporting balance arbor in the bridge
    const lowerBearing = this.createJeweledBearing(2.2, 1.3, 0.8);
    lowerBearing.position.z = -0.45;
    balanceAssembly.add(lowerBearing);

    // Central steel balance arbor staff connecting through the bearing
    const arborGeom = new THREE.CylinderGeometry(0.5, 0.5, 1.6, 16);
    arborGeom.rotateX(Math.PI / 2);
    const arborMesh = new THREE.Mesh(arborGeom, this.materials.polishedSteel);
    arborMesh.position.z = 0.0;
    balanceAssembly.add(arborMesh);

    // 2. OSCILLATING BALANCE WHEEL (PROUDLY IN FRONT AT POSITIVE Z)
    const oscillatingWheel = new THREE.Group();
    oscillatingWheel.position.z = 0.45; // Positioned IN FRONT of the metal bridge!
    balanceAssembly.add(oscillatingWheel);
    this.nodes.balanceWheel = oscillatingWheel;

    // Outer Glucydur balance rim
    const rimGeom = new THREE.TorusGeometry(8.2, 0.52, 16, 56);
    const rimMesh = new THREE.Mesh(rimGeom, this.materials.balanceWheelMat);
    rimMesh.castShadow = true;
    oscillatingWheel.add(rimMesh);

    // Aerodynamic 4-arm cross spokes with central collar
    const spokeGeom1 = new THREE.BoxGeometry(16.2, 0.85, 0.45);
    const spoke1 = new THREE.Mesh(spokeGeom1, this.materials.balanceWheelMat);
    oscillatingWheel.add(spoke1);

    const spokeGeom2 = new THREE.BoxGeometry(0.85, 16.2, 0.45);
    const spoke2 = new THREE.Mesh(spokeGeom2, this.materials.balanceWheelMat);
    oscillatingWheel.add(spoke2);

    const hubGeom = new THREE.CylinderGeometry(1.6, 1.6, 0.8, 24);
    hubGeom.rotateX(Math.PI / 2);
    const hub = new THREE.Mesh(hubGeom, this.materials.goldChaton);
    oscillatingWheel.add(hub);

    // 16 Gold micro-metric regulating poise screws with slotted heads
    for (let s = 0; s < 16; s++) {
      const a = (s / 16) * Math.PI * 2;
      const screwGeom = new THREE.CylinderGeometry(0.48, 0.48, 0.9, 12);
      screwGeom.rotateX(Math.PI / 2);
      const screw = new THREE.Mesh(screwGeom, this.materials.goldChaton);
      screw.position.set(Math.cos(a) * 8.65, Math.sin(a) * 8.65, 0);
      screw.rotation.z = a;
      oscillatingWheel.add(screw);
    }

    // Archimedean Silicon Hairspring Spiral (facing front +Z)
    const turns = 10;
    const pointsCount = 220;
    const spiralPoints = [];
    for (let p = 0; p <= pointsCount; p++) {
      const t = p / pointsCount;
      const angle = t * turns * Math.PI * 2;
      const radius = 0.85 + t * 5.4;
      spiralPoints.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.22));
    }
    const hairspringCurve = new THREE.CatmullRomCurve3(spiralPoints);
    const hairspringGeom = new THREE.TubeGeometry(hairspringCurve, 190, 0.13, 8, false);
    const hairspringMesh = new THREE.Mesh(hairspringGeom, this.materials.hairspringMat);
    oscillatingWheel.add(hairspringMesh);
    this.nodes.hairspring = hairspringMesh;

    // Central Incabloc Shock-Protection Core & Synthetic Ruby Cap Jewel (facing front)
    const capJewel = this.createJeweledBearing(2.4, 1.4, 1.1);
    capJewel.position.z = 0.35;
    oscillatingWheel.add(capJewel);

    group.add(balanceAssembly);

    // Layer registration: Positioned directly beneath skeleton dial aperture
    this.registerLayer({
      id: 'layer_balance',
      name: 'Glucydur Balance & Flying Regulating Organ',
      frenchName: 'Balancier Glucydur & Organe Réglant Inversé',
      category: 'Regulating Organ (Soul)',
      materialDesc: 'Glucydur Rim & Breathing Silicon Hairspring in Front of Beveled Bridge',
      specs: '4.0 Hz (28,800 vph) • Balance in Front • Swan-Neck Fine Regulator',
      description: 'The regulating organ responsible for chronometric accuracy, proudly positioned in front of the hand-chamfered bridge and showcased directly beneath the openwork dial aperture.',
      group: group,
      baseZ: 0.6,
      explodeZ: 26,
      offsetX: 0,
      offsetY: 0
    });
  }

  // 11. MAINPLATE (Platine with Perlage, ROTATED 180°)
  buildLayer11_Mainplate() {
    const group = new THREE.Group();
    group.name = 'Layer_Mainplate';

    const plateGeom = new THREE.CylinderGeometry(28.5, 28.5, 2.2, 64);
    plateGeom.rotateX(Math.PI / 2);
    const plate = new THREE.Mesh(plateGeom, this.materials.mainplate);
    plate.castShadow = true;
    plate.receiveShadow = true;
    group.add(plate);

    const mainplateJewels = [
      { x: 0, y: 0 },
      { x: 11.0, y: -5.5 },
      { x: -6.5, y: 4.0 },
      { x: 0, y: 9.5 },
      { x: 5.2, y: 9.0 }
    ];
    mainplateJewels.forEach(pos => {
      const jb = this.createJeweledBearing(2.0, 1.2, 0.8);
      jb.position.set(pos.x, pos.y, 1.1);
      group.add(jb);
    });

    // Winding stem channel slot at 3 o'clock
    const stemGeom = new THREE.CylinderGeometry(1.0, 1.0, 12, 16);
    stemGeom.rotateZ(Math.PI / 2);
    const stem = new THREE.Mesh(stemGeom, this.materials.polishedSteel);
    stem.position.set(24, 0, 0);
    group.add(stem);

    this.registerLayer({
      id: 'layer_mainplate',
      name: 'Circular-Grained Mainplate (Platine)',
      frenchName: 'Platine Principale Perlée',
      category: 'Structural Foundation',
      materialDesc: 'Cupro-Nickel with Traditional Hand-Applied Perlage (Stippling)',
      specs: '16 Recessed Jewel Sinks • Integrated Winding Stem Conduit',
      description: 'The master foundation holding all 150+ components in micro-metric alignment. Decorated with overlapping circular pearl grains applied by hand using abrasive boxwood pegs.',
      group: group,
      baseZ: -7.5,
      explodeZ: -56,
      offsetX: 0,
      offsetY: 0
    });
  }

  // 12. AUTOMATIC WINDING ROTOR
  buildLayer12_Rotor() {
    const group = new THREE.Group();
    group.name = 'Layer_Rotor';

    const rotorGroup = new THREE.Group();
    rotorGroup.name = 'OscillatingRotor';

    const arcShape = new THREE.Shape();
    arcShape.absarc(0, 0, 27.5, 0, Math.PI, false);
    arcShape.lineTo(0, 0);
    arcShape.closePath();

    const hole = new THREE.Path();
    hole.absarc(0, 0, 8.5, 0, Math.PI * 2, true);
    arcShape.holes.push(hole);

    const slot1 = new THREE.Path();
    slot1.absarc(0, 0, 21.0, 0.25 * Math.PI, 0.45 * Math.PI, false);
    slot1.absarc(0, 0, 13.0, 0.45 * Math.PI, 0.25 * Math.PI, true);
    slot1.closePath();
    arcShape.holes.push(slot1);

    const slot2 = new THREE.Path();
    slot2.absarc(0, 0, 21.0, 0.55 * Math.PI, 0.75 * Math.PI, false);
    slot2.absarc(0, 0, 13.0, 0.75 * Math.PI, 0.55 * Math.PI, true);
    slot2.closePath();
    arcShape.holes.push(slot2);

    const rotorGeom = new THREE.ExtrudeGeometry(arcShape, { depth: 1.6, bevelEnabled: true, bevelSize: 0.3, bevelThickness: 0.3 });
    const rotorMesh = new THREE.Mesh(rotorGeom, this.materials.rotorMat);
    rotorMesh.position.z = -0.8;
    rotorMesh.castShadow = true;
    rotorGroup.add(rotorMesh);

    const heavyRimGeom = new THREE.TorusGeometry(26.5, 1.2, 16, 48, Math.PI);
    const heavyRim = new THREE.Mesh(heavyRimGeom, this.materials.goldChaton);
    heavyRim.position.z = 0;
    rotorGroup.add(heavyRim);

    const bearingRaceGeom = new THREE.TorusGeometry(5.5, 1.0, 16, 32);
    const bearingRace = new THREE.Mesh(bearingRaceGeom, this.materials.screws);
    rotorGroup.add(bearingRace);

    for (let b = 0; b < 7; b++) {
      const a = (b / 7) * Math.PI * 2;
      const ballGeom = new THREE.SphereGeometry(0.8, 16, 16);
      const ball = new THREE.Mesh(ballGeom, this.materials.polishedSteel);
      ball.position.set(Math.cos(a) * 5.5, Math.sin(a) * 5.5, 0);
      rotorGroup.add(ball);
    }

    group.add(rotorGroup);
    this.nodes.rotor = rotorGroup;

    this.registerLayer({
      id: 'layer_rotor',
      name: 'Skeleton 22K Gold Winding Rotor',
      frenchName: 'Masse Oscillante Squelettée Or 22ct',
      category: 'Kinetic Recharger',
      materialDesc: 'Tungsten High-Density Core with 22K Solid Gold Perimeter Weight',
      specs: 'Bidirectional Winding • 7 Ceramic Ball Bearings (ZrO2)',
      description: 'The oscillating weight converts wrist kinetic energy into mechanical potential via bidirectional ceramic ball bearings with zero lubrication required.',
      group: group,
      baseZ: -9.8,
      explodeZ: -75,
      offsetX: 0,
      offsetY: 0
    });
  }

  // 13. EXHIBITION CASEBACK & REAR CRYSTAL
  buildLayer13_Caseback() {
    const group = new THREE.Group();
    group.name = 'Layer_Caseback';

    const ringShape = new THREE.Shape();
    ringShape.absarc(0, 0, 36.0, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, 24.0, 0, Math.PI * 2, true);
    ringShape.holes.push(hole);

    const ringGeom = new THREE.ExtrudeGeometry(ringShape, { depth: 2.2, bevelEnabled: true, bevelSize: 0.4, bevelThickness: 0.4 });
    const ringMesh = new THREE.Mesh(ringGeom, this.materials.caseMetal);
    ringMesh.position.z = -1.1;
    group.add(ringMesh);

    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const screw = this.createScrew(1.2, 1.8);
      screw.position.set(Math.cos(a) * 31, Math.sin(a) * 31, -1.2);
      group.add(screw);
    }

    const rearGlassGeom = new THREE.CylinderGeometry(23.8, 23.8, 1.6, 64);
    rearGlassGeom.rotateX(Math.PI / 2);
    const rearGlass = new THREE.Mesh(rearGlassGeom, this.materials.sapphireGlass);
    group.add(rearGlass);

    this.registerLayer({
      id: 'layer_caseback',
      name: 'Exhibition Sapphire Caseback',
      frenchName: 'Fond Transparent & Glace Saphir',
      category: 'Rear Architecture',
      materialDesc: 'Laser-Engraved Titanium Ring & Anti-Scratch Sapphire',
      specs: 'Engraving: CALIBRE AUR-900 • 38 JEWELS • 50M WATER RESISTANT',
      description: 'The sapphire display back provides an uninterrupted vantage point into the skeletonized mechanical calibre, sealed with an airtight fluorocarbon O-ring gasket.',
      group: group,
      baseZ: -12.2,
      explodeZ: -95,
      offsetX: 0,
      offsetY: 0
    });
  }

  // 14. MONOBLOC TITANIUM CASE CHASSIS, CROWN & CHRONO PUSHERS
  buildLayer14_Case() {
    const group = new THREE.Group();
    group.name = 'Layer_Case';

    const caseShape = new THREE.Shape();
    caseShape.moveTo(-35, 14);
    caseShape.lineTo(-37, 0);
    caseShape.lineTo(-35, -14);
    caseShape.lineTo(-24, -34);
    caseShape.lineTo(-14, -36);
    caseShape.lineTo(14, -36);
    caseShape.lineTo(24, -34);
    caseShape.lineTo(35, -14);
    caseShape.lineTo(37, 0);
    caseShape.lineTo(35, 14);
    caseShape.lineTo(24, 34);
    caseShape.lineTo(14, 36);
    caseShape.lineTo(-14, 36);
    caseShape.lineTo(-24, 34);
    caseShape.closePath();

    const centerHole = new THREE.Path();
    centerHole.absarc(0, 0, 29.5, 0, Math.PI * 2, true);
    caseShape.holes.push(centerHole);

    const caseGeom = new THREE.ExtrudeGeometry(caseShape, { depth: 9.0, bevelEnabled: true, bevelSize: 1.0, bevelThickness: 1.0 });
    const caseMesh = new THREE.Mesh(caseGeom, this.materials.caseMetal);
    caseMesh.position.z = -7.5;
    caseMesh.castShadow = true;
    caseMesh.receiveShadow = true;
    group.add(caseMesh);

    // Fluted Winding Crown at 3 o'clock
    const crownGroup = new THREE.Group();
    crownGroup.position.set(38.5, 0, -2.5);

    const crownBodyGeom = new THREE.CylinderGeometry(4.2, 4.0, 3.5, 24);
    crownBodyGeom.rotateZ(Math.PI / 2);
    const crownBody = new THREE.Mesh(crownBodyGeom, this.materials.caseMetal);
    crownGroup.add(crownBody);

    const cabGeom = new THREE.SphereGeometry(2.0, 16, 16);
    const cab = new THREE.Mesh(cabGeom, this.materials.bluedSteel);
    cab.position.x = 2.2;
    crownGroup.add(cab);

    group.add(crownGroup);
    this.nodes.crown = crownGroup;

    // Chronograph pushers at 2 and 4 o'clock
    [Math.PI / 6, -Math.PI / 6].forEach(angle => {
      const px = Math.cos(angle) * 38;
      const py = Math.sin(angle) * 38;
      const pusherGeom = new THREE.CylinderGeometry(2.2, 2.2, 3.0, 16);
      pusherGeom.rotateZ(angle + Math.PI / 2);
      const pusher = new THREE.Mesh(pusherGeom, this.materials.caseMetal);
      pusher.position.set(px, py, -2.5);
      group.add(pusher);
    });

    // Precision Polished Steel Spring-Bars between Case Lug Horns
    [1, -1].forEach(sign => {
      const springBarGeom = new THREE.CylinderGeometry(0.85, 0.85, 27.5, 16);
      springBarGeom.rotateZ(Math.PI / 2);
      const springBar = new THREE.Mesh(springBarGeom, this.materials.polishedSteel);
      springBar.position.set(0, sign * 34.5, -3.5);
      springBar.castShadow = true;
      group.add(springBar);

      // Spring-bar pivot screw heads on outer lug horns (X = +/- 14.2)
      [-14.2, 14.2].forEach(px => {
        const screwHead = this.createScrew(0.85, 1.4);
        screwHead.position.set(px, sign * 34.5, -3.5);
        screwHead.rotation.y = Math.PI / 2;
        group.add(screwHead);
      });
    });

    this.registerLayer({
      id: 'layer_case',
      name: 'Sculpted Monobloc Titanium Case',
      frenchName: 'Boîtier Monobloc en Titane de Haute Horlogerie',
      category: 'Chassis & Ergonomics',
      materialDesc: '42mm Grade 5 Titanium Monobloc Chassis • Fluted Crown • Dual Pushers',
      specs: 'Aerospace Grade 5 Titanium • Ergonomic Curvature • Sapphire Caseback Mount',
      description: 'Crafted from aircraft-grade Grade 5 titanium with hand-finished chamfers, ergonomic fluted winding crown, and dual chronograph pushers.',
      group: group,
      baseZ: 0,
      explodeZ: 0,
      offsetX: 0,
      offsetY: 0
    });
  }

  // --- DYNAMIC MOTION & KINEMATICS UPDATE ---
  updateKinematics(mechanicsData) {
    if (!mechanicsData) return;

    if (this.nodes.secondsHand) {
      this.nodes.secondsHand.rotation.z = mechanicsData.secondsHandAngle;
    }
    if (this.nodes.minuteHand) {
      this.nodes.minuteHand.rotation.z = mechanicsData.minuteHandAngle;
    }
    if (this.nodes.hourHand) {
      this.nodes.hourHand.rotation.z = mechanicsData.hourHandAngle;
    }

    if (this.nodes.balanceWheel) {
      this.nodes.balanceWheel.rotation.z = mechanicsData.balanceAngle;
    }
    if (this.nodes.hairspring) {
      const s = mechanicsData.hairspringScale;
      this.nodes.hairspring.scale.set(s, s, 1.0);
    }

    if (this.nodes.palletFork) {
      this.nodes.palletFork.rotation.z = mechanicsData.palletForkAngle;
    }
    if (this.nodes.escapeWheel) {
      this.nodes.escapeWheel.rotation.z = mechanicsData.escapeWheelAngle;
    }

    if (this.nodes.fourthWheel) {
      this.nodes.fourthWheel.rotation.z = mechanicsData.fourthWheelAngle;
    }
    if (this.nodes.thirdWheel) {
      this.nodes.thirdWheel.rotation.z = mechanicsData.thirdWheelAngle;
    }
    if (this.nodes.centerWheel) {
      this.nodes.centerWheel.rotation.z = mechanicsData.centerWheelAngle;
    }

    if (this.nodes.rotor) {
      this.nodes.rotor.rotation.z = mechanicsData.rotorAngle;
    }
  }

  // --- EXPLOSION DISASSEMBLY SYSTEM ---
  applyExplosionProgress(progress) {
    this.explodedLayers.forEach(layer => {
      const targetZ = layer.baseZ + (layer.explodeZ - layer.baseZ) * progress;
      layer.group.position.z = targetZ;

      if (layer.offsetX || layer.offsetY) {
        layer.group.position.x = layer.offsetX * progress;
        layer.group.position.y = layer.offsetY * progress;
      }
    });
  }

  // (Strap & butterfly clasp removed as requested)
  setClaspProgress(progress) {}

  isolateLayer(layerId) {
    this.explodedLayers.forEach(l => {
      if (l.id === layerId) {
        l.group.visible = true;
        this.setGroupOpacity(l.group, 1.0);
      } else {
        this.setGroupOpacity(l.group, 0.08);
      }
    });
  }

  resetIsolation() {
    this.explodedLayers.forEach(l => {
      l.group.visible = true;
      this.setGroupOpacity(l.group, 1.0);
    });
  }

  setGroupOpacity(group, opacity) {
    group.traverse(child => {
      if (child.isMesh && child.material) {
        if (!child.userData.originalOpacity) {
          child.userData.originalOpacity = child.material.opacity !== undefined ? child.material.opacity : 1.0;
          child.userData.originalTransparent = child.material.transparent;
        }
        if (opacity < 1.0) {
          child.material.transparent = true;
          child.material.opacity = child.userData.originalOpacity * opacity;
        } else {
          child.material.opacity = child.userData.originalOpacity;
          child.material.transparent = child.userData.originalTransparent;
        }
      }
    });
  }
}

window.WatchModelBuilder = WatchModelBuilder;

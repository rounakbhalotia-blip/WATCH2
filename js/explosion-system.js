/**
 * AURELIA HOROLOGY - Explosion & Disassembly Interactive System
 * Manages smooth spring interpolation between assembled and exploded states,
 * raycasting layer detection, camera focusing, and 3D screen annotation pins.
 */

class ExplosionSystem {
  constructor(watchBuilder, camera, controls, renderer) {
    this.watch = watchBuilder;
    this.camera = camera;
    this.controls = controls;
    this.renderer = renderer;

    this.progress = 0.0;
    this.targetProgress = 0.0;
    this.isExploded = false;
    this.isolatedLayerId = null;
    this.selectedLayer = null;

    // Raycasting for interactive click & hover
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // DOM Annotations Container
    this.annotationsContainer = document.getElementById('annotations-container');

    // Callbacks
    this.onLayerSelected = null;
    this.onProgressChange = null;

    this.initEvents();
  }

  initEvents() {
    const canvas = this.renderer.domElement;

    // Click on 3D watch part
    canvas.addEventListener('pointerdown', (e) => {
      this.pointerDownPos = { x: e.clientX, y: e.clientY };
    });

    canvas.addEventListener('pointerup', (e) => {
      // Avoid triggering raycast on drag
      if (this.pointerDownPos) {
        const dx = Math.abs(e.clientX - this.pointerDownPos.x);
        const dy = Math.abs(e.clientY - this.pointerDownPos.y);
        if (dx > 5 || dy > 5) return;
      }

      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycastPick();
    });
  }

  raycastPick() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.watch.rootGroup.children, true);

    if (intersects.length > 0) {
      let hitMesh = intersects[0].object;
      // Skip transparent glass if looking through
      if (intersects.length > 1 && hitMesh.material && hitMesh.material.transmission > 0.5 && this.progress < 0.2) {
        hitMesh = intersects[1].object;
      }

      // Find which layer contains this mesh
      const layer = this.findLayerForMesh(hitMesh);
      if (layer) {
        this.selectLayer(layer);
      }
    }
  }

  findLayerForMesh(mesh) {
    for (const layer of this.watch.explodedLayers) {
      let found = false;
      layer.group.traverse(child => {
        if (child === mesh) found = true;
      });
      if (found) return layer;
    }
    return null;
  }

  selectLayer(layer) {
    this.selectedLayer = layer;

    // Trigger audio click
    if (window.HorologyAudio) {
      window.HorologyAudio.playWindingClick();
    }

    // Call UI handler
    if (this.onLayerSelected) {
      this.onLayerSelected(layer);
    }
  }

  // Smoothly set explosion progress (0.0 to 1.0)
  setExplosionProgress(val, immediate = false, duration = 1.6) {
    const clamped = Math.max(0, Math.min(1, val));
    this.targetProgress = clamped;
    this.isExploded = clamped > 0.4;

    if (immediate || typeof gsap === 'undefined') {
      this.progress = clamped;
      this.watch.applyExplosionProgress(clamped);
      if (this.onProgressChange) this.onProgressChange(clamped);
      return;
    }

    if (window.HorologyAudio) {
      window.HorologyAudio.playExplodeSound(clamped > this.progress);
    }

    gsap.killTweensOf(this);
    gsap.to(this, {
      progress: clamped,
      duration: duration,
      ease: 'power3.out',
      onUpdate: () => {
        this.watch.applyExplosionProgress(this.progress);
        if (this.onProgressChange) this.onProgressChange(this.progress);
      }
    });
  }

  toggleExplosion() {
    const target = this.progress > 0.3 ? 0.0 : 1.0;
    this.setExplosionProgress(target);
  }

  // Focus camera directly onto a layer
  focusLayer(layerId) {
    const layer = this.watch.explodedLayers.find(l => l.id === layerId);
    if (!layer) return;

    this.selectLayer(layer);

    // Get layer world position
    const worldPos = new THREE.Vector3();
    layer.group.getWorldPosition(worldPos);

    const targetCameraPos = new THREE.Vector3(
      worldPos.x + 35,
      worldPos.y + 25,
      worldPos.z + 55
    );

    if (typeof gsap !== 'undefined') {
      gsap.to(this.controls.target, {
        x: worldPos.x,
        y: worldPos.y,
        z: worldPos.z,
        duration: 1.2,
        ease: 'power2.inOut'
      });
      gsap.to(this.camera.position, {
        x: targetCameraPos.x,
        y: targetCameraPos.y,
        z: targetCameraPos.z,
        duration: 1.4,
        ease: 'power2.inOut'
      });
    } else {
      this.controls.target.copy(worldPos);
      this.camera.position.copy(targetCameraPos);
    }
  }

  // Isolate a specific layer while dimming the rest
  isolateLayer(layerId) {
    this.isolatedLayerId = layerId;
    this.watch.isolateLayer(layerId);
    this.focusLayer(layerId);
  }

  resetIsolation() {
    this.isolatedLayerId = null;
    this.watch.resetIsolation();
  }

  // Project 3D positions of key layers to 2D screen annotations
  updateAnnotations() {
    if (!this.annotationsContainer) return;

    // Only show 3D pins if sufficiently exploded (> 35%) and no layer isolated
    if (this.progress < 0.35 || this.isolatedLayerId) {
      this.annotationsContainer.style.opacity = '0';
      this.annotationsContainer.style.pointerEvents = 'none';
      return;
    }

    this.annotationsContainer.style.opacity = '1';
    this.annotationsContainer.style.pointerEvents = 'none';

    const widthHalf = this.renderer.domElement.clientWidth / 2;
    const heightHalf = this.renderer.domElement.clientHeight / 2;

    const keyLayers = [
      { id: 'layer_bezel', label: 'Bezel & Screws' },
      { id: 'layer_crystal', label: 'Sapphire Crystal' },
      { id: 'layer_hands', label: 'Dauphine Hands' },
      { id: 'layer_dial', label: 'Skeleton Dial' },
      { id: 'layer_bridges', label: 'Côtes de Genève' },
      { id: 'layer_gears', label: 'Gear Train' },
      { id: 'layer_escapement', label: 'Lever Escapement' },
      { id: 'layer_balance', label: 'Glucydur Balance' },
      { id: 'layer_mainplate', label: 'Platine Perlage' },
      { id: 'layer_rotor', label: '22K Gold Rotor' }
    ];

    keyLayers.forEach(kl => {
      let pin = document.getElementById(`pin-${kl.id}`);
      if (!pin) {
        pin = document.createElement('div');
        pin.id = `pin-${kl.id}`;
        pin.className = 'annotation-pin';
        pin.innerHTML = `
          <div class="pin-dot"></div>
          <div class="pin-label">${kl.label}</div>
        `;
        pin.addEventListener('click', () => {
          this.focusLayer(kl.id);
        });
        this.annotationsContainer.appendChild(pin);
      }

      const layer = this.watch.explodedLayers.find(l => l.id === kl.id);
      if (!layer) return;

      const pos = new THREE.Vector3();
      layer.group.getWorldPosition(pos);
      // Offset slightly to the right for clear pointer
      pos.x += 24;

      // Project to screen space
      pos.project(this.camera);

      // Check if behind camera
      if (pos.z > 1) {
        pin.style.display = 'none';
        return;
      }

      pin.style.display = 'flex';
      const screenX = (pos.x * widthHalf) + widthHalf;
      const screenY = -(pos.y * heightHalf) + heightHalf;

      pin.style.transform = `translate(${screenX}px, ${screenY}px)`;
    });
  }
}

window.ExplosionSystem = ExplosionSystem;

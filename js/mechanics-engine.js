/**
 * AURELIA HOROLOGY - Movement Mechanics & Kinematics Engine
 * Computes authentic gear ratios, harmonic balance wheel oscillation,
 * breathing hairspring geometry, escape wheel stepping, and time synchronization.
 */

class MechanicsEngine {
  constructor() {
    this.speedMultiplier = 1.0;
    this.targetSpeed = 1.0;
    this.frequencyHz = 4.0; // 4 Hz = 28,800 vph (Swiss standard)
    this.vph = 28800;

    // Timezone offsets from UTC in hours
    this.timezones = {
      'LOCAL': null, // system local
      'GENEVA': 2,   // UTC+2 (CEST) / UTC+1
      'LONDON': 1,   // UTC+1 (BST) / UTC+0
      'TOKYO': 9,    // UTC+9 (JST)
      'NEWYORK': -4, // UTC-4 (EDT) / UTC-5
      'DUBAI': 4,    // UTC+4 (GST)
      'SINGAPORE': 8 // UTC+8 (SGT)
    };
    this.activeTimezone = 'LOCAL';

    // Simulation virtual clock
    this.virtualTime = Date.now();
    this.lastRealTimestamp = performance.now();

    // Chronograph state
    this.chronoRunning = false;
    this.chronoElapsed = 0;
    this.chronoLastTime = 0;

    // Motion states
    this.balanceAngle = 0;
    this.hairspringScale = 1.0;
    this.palletForkAngle = 0;
    this.escapeWheelAngle = 0;
    this.targetEscapeWheelAngle = 0;

    // Automatic Rotor inertia physics
    this.rotorAngle = 0;
    this.rotorVelocity = 0;
    this.targetRotorTilt = 0;

    // Tick audio scheduler
    this.lastAudioTickBeat = -1;
    this.tickToggle = false;

    // Smooth second hand mode: true = smooth continuous sweep, false = 8 beats/sec
    this.sweepingSecond = true;
  }

  setTimezone(tzKey) {
    if (this.timezones.hasOwnProperty(tzKey)) {
      this.activeTimezone = tzKey;
    }
  }

  setSpeed(multiplier) {
    this.targetSpeed = Math.max(0.01, Math.min(1000, multiplier));
    this.speedMultiplier = this.targetSpeed;
  }

  getCurrentTimeComponents() {
    let date;
    if (this.activeTimezone === 'LOCAL' || this.timezones[this.activeTimezone] === null) {
      date = new Date(this.virtualTime);
    } else {
      const offsetHours = this.timezones[this.activeTimezone];
      const utc = this.virtualTime + (new Date(this.virtualTime).getTimezoneOffset() * 60000);
      date = new Date(utc + (3600000 * offsetHours));
    }

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const milliseconds = date.getMilliseconds();
    const day = date.getDate();
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const monthName = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();

    return {
      hours,
      minutes,
      seconds,
      milliseconds,
      day,
      dayName,
      monthName,
      year,
      totalSeconds: hours * 3600 + minutes * 60 + seconds + milliseconds / 1000
    };
  }

  startChronograph() {
    if (!this.chronoRunning) {
      this.chronoRunning = true;
      this.chronoLastTime = performance.now();
    }
  }

  stopChronograph() {
    this.chronoRunning = false;
  }

  resetChronograph() {
    this.chronoRunning = false;
    this.chronoElapsed = 0;
  }

  toggleChronograph() {
    if (this.chronoRunning) this.stopChronograph();
    else this.startChronograph();
  }

  update(nowMs) {
    const deltaMs = Math.min(nowMs - this.lastRealTimestamp, 100);
    this.lastRealTimestamp = nowMs;

    // Smooth speed multiplier transition
    this.speedMultiplier += (this.targetSpeed - this.speedMultiplier) * 0.1;

    // Advance virtual time
    const simulatedDeltaMs = deltaMs * this.speedMultiplier;
    this.virtualTime += simulatedDeltaMs;

    // Update Chronograph if running
    if (this.chronoRunning) {
      this.chronoElapsed += simulatedDeltaMs / 1000;
    }

    // Time components
    const tc = this.getCurrentTimeComponents();
    const timeInSec = tc.totalSeconds;

    // 1. BALANCE WHEEL & REGULATING ORGAN (28,800 vph / 4 Hz)
    // Angular amplitude: ~145 degrees (2.53 rad)
    const phase = (timeInSec * this.frequencyHz * 2 * Math.PI);
    const balanceAmplitude = 2.53; // radians (+/- 145 deg)
    this.balanceAngle = Math.sin(phase) * balanceAmplitude;

    // 2. BREATHING HAIRSPRING (Expands & contracts with balance amplitude)
    // Outer coils breathe out while balance swings one way, contract the other
    this.hairspringScale = 1.0 + Math.sin(phase) * 0.12;

    // 3. PALLET FORK (Swiss Lever)
    // Snaps between +/- 12 degrees (0.21 rad) as balance wheel passes through zero
    const cosPhase = Math.cos(phase);
    this.palletForkAngle = (cosPhase > 0 ? 0.20 : -0.20) * (1 - Math.exp(-Math.abs(cosPhase) * 15));

    // 4. ESCAPEMENT WHEEL (15 Teeth)
    // Steps forward 1/30th rev at each half-cycle of balance wheel (8 steps/sec)
    const totalHalfCycles = Math.floor(timeInSec * this.frequencyHz * 2);
    const stepAngle = (2 * Math.PI) / 30; // 15 teeth * 2 pallet positions = 30 steps/rev
    const subStepProgress = (timeInSec * this.frequencyHz * 2) - totalHalfCycles;
    const smoothStep = Math.min(1.0, subStepProgress * 4.0); // quick snap
    this.escapeWheelAngle = (totalHalfCycles + smoothStep) * stepAngle;

    // Escapement sound sync (triggers on each half-cycle beat)
    if (totalHalfCycles !== this.lastAudioTickBeat) {
      this.lastAudioTickBeat = totalHalfCycles;
      this.tickToggle = !this.tickToggle;
      // Only play audio if speed is not excessively high
      if (this.speedMultiplier <= 2.5 && window.HorologyAudio) {
        window.HorologyAudio.playEscapementTick(this.tickToggle);
      }
    }

    // 5. GEAR TRAIN RATIOS:
    // - Fourth Wheel (driving seconds hand): 1 full revolution per 60 seconds
    const fourthWheelSpeed = (2 * Math.PI) / 60;
    this.fourthWheelAngle = -(timeInSec * fourthWheelSpeed);

    // - Third Wheel: Intermediate wheel meshing with fourth pinion
    // Ratio ~ 7.5 : 1 (revolves in opposite direction)
    this.thirdWheelAngle = (timeInSec * fourthWheelSpeed * 7.5);

    // - Center Wheel (driving minute cannon): 1 full revolution per 3600 seconds (1 hour)
    const centerWheelSpeed = (2 * Math.PI) / 3600;
    this.centerWheelAngle = -(timeInSec * centerWheelSpeed);

    // - Minute Wheel & Pinion: 1 full revolution per hour
    this.minuteHandAngle = -(timeInSec * centerWheelSpeed);

    // - Hour Wheel: 1 full revolution per 12 hours (43,200 seconds)
    const hourWheelSpeed = (2 * Math.PI) / 43200;
    this.hourHandAngle = -(timeInSec * hourWheelSpeed);

    // - Seconds Hand: smooth continuous or discrete 8-beat sweep
    if (this.sweepingSecond) {
      this.secondsHandAngle = -(timeInSec * fourthWheelSpeed);
    } else {
      const beat8Sec = Math.floor(timeInSec * 8) / 8;
      this.secondsHandAngle = -(beat8Sec * fourthWheelSpeed);
    }

    // 6. ROTOR INERTIA (Automatic winding weight)
    // Decays with friction, oscillates gently with gravity
    const gravityRestAngle = Math.PI; // hangs downward
    const diff = (gravityRestAngle - this.rotorAngle);
    const restoringForce = Math.sin(diff) * 0.003;
    this.rotorVelocity += restoringForce;
    this.rotorVelocity *= 0.96; // viscous damping
    this.rotorAngle += this.rotorVelocity;

    // 7. DATE DISK
    // 31 days per full circle (360 / 31 = 11.61 degrees per day)
    const dayOfMonth = tc.day;
    this.dateDiskAngle = -((dayOfMonth - 1) / 31) * Math.PI * 2;

    return {
      timeComponents: tc,
      balanceAngle: this.balanceAngle,
      hairspringScale: this.hairspringScale,
      palletForkAngle: this.palletForkAngle,
      escapeWheelAngle: this.escapeWheelAngle,
      fourthWheelAngle: this.fourthWheelAngle,
      thirdWheelAngle: this.thirdWheelAngle,
      centerWheelAngle: this.centerWheelAngle,
      secondsHandAngle: this.secondsHandAngle,
      minuteHandAngle: this.minuteHandAngle,
      hourHandAngle: this.hourHandAngle,
      rotorAngle: this.rotorAngle,
      dateDiskAngle: this.dateDiskAngle,
      chronoElapsed: this.chronoElapsed,
      chronoRunning: this.chronoRunning
    };
  }

  // Agitate rotor when user rotates/drags watch
  addRotorImpulse(force) {
    this.rotorVelocity += force;
  }
}

window.HorologyMechanics = new MechanicsEngine();

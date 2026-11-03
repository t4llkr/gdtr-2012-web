// Порт se.codebrew.gdtr.c.d (ThrottleControl, implements b/s).
// Списки: a — ведущие колёса (газ), b — тормозные колёса.
// Константы оригинала: c=150.0, d=250.0, e=0.3, f=1.0.
// ВНИМАНИЕ: в Java поля c/d/e/f сосуществуют с методами c()/d()... — в JS
// поле this.c=150.0 затеняло бы метод c() интерфейса b/s, поэтому константам
// даны разговорные имена (семантика и значения не изменены).

export class ThrottleControl {
  constructor() {
    this.drive = [];            // a
    this.brake = [];            // b
    this.angAccelCap = 150.0;   // c
    this.angAccelBoost = 250.0; // d
    this.decay = 0.3;           // e
    this.driveFactor = 1.0;     // f (final в оригинале)
  }

  // a(La/c;)V / b(La/c;)V — регистрация колёс
  addDriveWheel(p) { this.drive.push(p); }
  addBrakeWheel(p) { this.brake.push(p); }

  // a()V — газ: затухание angAccel, подпитка до 150, отпустить все колёса
  a() {
    for (const p of this.drive) {
      p.angAccel *= 1.0 - this.decay;
      if (p.angAccel < this.angAccelCap) {
        p.angAccel += this.angAccelBoost * this.driveFactor;
      }
      p.pinned = false;
    }
    for (const p of this.brake) {
      p.pinned = false;
    }
  }

  // b()V — тормоз: прижать тормозные колёса, погасить вращение
  b() {
    for (const p of this.brake) {
      p.pinned = true;
      p.angAccel = 0.0;
      if (Math.abs(p.angVel) > 1.0) {
        p.angVel *= 0.2;
      } else {
        p.angVel = 0.0;
      }
    }
  }

  // c()V — нейтраль: angAccel=0, все колёса отпущены
  c() {
    for (const p of this.drive) {
      p.angAccel = 0.0;
      p.pinned = false;
    }
    for (const p of this.brake) {
      p.pinned = false;
    }
  }
}

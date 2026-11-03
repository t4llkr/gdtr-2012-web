// Порт se.codebrew.gdtr.a.b (Body) — тело: частицы + констрейнты.

import { ParticleList } from './ParticleList.js';

export class Body {
  constructor() {
    this.constraints = [];          // a: List<a/a>
    this.particles = new ParticleList(); // b: a/d
  }

  // c(La/a;)V / d(La/a;)V
  addConstraint(c) { this.constraints.push(c); }
  removeConstraint(c) {
    const i = this.constraints.indexOf(c);
    if (i >= 0) this.constraints.splice(i, 1);
  }

  // h(La/c;)V
  addParticle(p) { this.particles.getAll().push(p); }

  // i()V — per-step hook, в базовом теле пусто (override в Bike)
  onStep() {}

  // m() / n()
  getConstraints() { return this.constraints; }
  getParticles() { return this.particles; }

  // o()D — максимальный (pos.x + radius) среди частиц
  getMaxX() {
    let max = Number.NEGATIVE_INFINITY;
    for (const p of this.particles.getAll()) {
      const v = p.pos.x + p.radius;
      if (v > max) max = p.pos.x + p.radius;
    }
    return max;
  }
}

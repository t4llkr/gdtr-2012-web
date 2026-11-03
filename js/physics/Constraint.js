// Порт se.codebrew.gdtr.a.a (Constraint) — жёсткая связь двух частиц.

export class Constraint {
  constructor(a, b, enabled = true) {
    this.particles = [a, b];    // a: a/c[2]
    // b — restLength, вычисляется один раз в ctor: sqrt(|dx|² + |dy|²)
    const dx = Math.abs(b.pos.x - a.pos.x);
    const dy = Math.abs(b.pos.y - a.pos.y);
    this.restLength = Math.sqrt(dx * dx + dy * dy);
    this.enabled = enabled;     // c
    this.stiffness = 1.0;       // d
  }

  // a()D / b()D / c()V / d()Z
  getRestLength() { return this.restLength; }
  getStiffness() { return this.stiffness; }
  enable() { this.enabled = true; }
  isEnabled() { return this.enabled; }
}

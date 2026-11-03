import { Vec2 } from '../core/Vec2.js';
import { STEPS_PER_FRAME } from '../core/const.js';

// Порт se.codebrew.gdtr.c.a (LeanControl, implements b/f).
// ctor(front, rear, head, strength); e = 5.0 / STEPS_PER_FRAME = 2.5.
// Силы ПЕРЕЗАПИСЫВАЮТСЯ (scaleTo в particle.force), не накапливаются.
export class LeanControl {
  constructor(frontWheel, rearWheel, head, strength) {
    this.frontWheel = frontWheel; // a
    this.rearWheel = rearWheel;   // b
    this.head = head;             // c
    this.strength = strength;     // d (bike.leanStrength = 100.0)
    this.e = 5.0 / STEPS_PER_FRAME;
  }

  // b()V — dir = normalize(rear - front); perp = (dir.y, -dir.x)
  b() {
    const dir = Vec2.sub(this.rearWheel.pos, this.frontWheel.pos).normalize();
    const perp = new Vec2(dir.y, -dir.x);
    Vec2.scaleTo(this.frontWheel.force, perp, this.strength * this.e);
    Vec2.scaleTo(this.rearWheel.force, perp, -this.strength * this.e);
    Vec2.scaleTo(this.head.force, dir, this.strength * this.e);
  }

  // c()V — dir = normalize(front - rear); perp = (dir.y, -dir.x)
  c() {
    const dir = Vec2.sub(this.frontWheel.pos, this.rearWheel.pos).normalize();
    const perp = new Vec2(dir.y, -dir.x);
    Vec2.scaleTo(this.frontWheel.force, perp, this.strength * this.e);
    Vec2.scaleTo(this.rearWheel.force, perp, -this.strength * this.e);
    Vec2.scaleTo(this.head.force, dir, this.strength * this.e);
  }

  // d()V — нейтраль: обнулить силы всех трёх частиц
  d() {
    this.frontWheel.force.reset();
    this.rearWheel.force.reset();
    this.head.force.reset();
  }
}

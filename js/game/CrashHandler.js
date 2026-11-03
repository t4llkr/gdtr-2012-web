// Порт se.codebrew.gdtr.h — реакция физических тел на падение.

import { Vec2 } from '../core/Vec2.js';
import { STEPS_PER_FRAME } from '../core/const.js';

export class CrashHandler {
  constructor(rider, bike) {
    this.rider = rider;
    this.bike = bike;
  }

  onEvent(event) {
    const delta = new Vec2();
    if (event === 1) {
      const wheel = this.bike.frontWheel;
      wheel.j = 0.5;
      wheel.k = 0.5;
      wheel.l = 0.5;
      wheel.m = 0.5;
      wheel.n = 0.5;
    }
    if (event === 5) {
      for (const particle of this.rider.getParticles().getAll()) {
        particle.mass = 1.0;
        particle.collidable = true;
        Vec2.subTo(delta, particle.pos, particle.prevPos);
        delta.scale(STEPS_PER_FRAME);
        Vec2.subTo(particle.prevPos, particle.pos, delta);
      }
      for (const constraint of this.rider.getConstraints()) constraint.enable();
    }
  }

  release() { this.rider = null; }
}

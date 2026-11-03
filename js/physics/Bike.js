// Порт se.codebrew.gdtr.b (Bike) + se.codebrew.gdtr.c (BikeFactory).
// 6 частиц: заднее колесо, переднее колесо, рама (центр), тело A, тело B, голова.

import { Vec2 } from '../core/Vec2.js';
import { Particle } from './Particle.js';
import { Constraint } from './Constraint.js';
import { Body } from './Body.js';
import { ThrottleControl } from './ThrottleControl.js';

export class Bike extends Body {
  constructor() {
    super();
    this.frontBroken = false; // a
    this.rearBroken = false;  // b
    this.rearWheel = null;    // c (r=7,  invMass=2.0)
    this.frontWheel = null;   // d (r=7,  invMass=0.75)
    this.head = null;         // e (r=4,  invMass=1.0,  не коллидирует)
    this.frame = null;        // f (r=1,  invMass=0.25, не коллидирует)
    this.bodyA = null;        // g... в оригинале: h (r=1, invMass=0.25, x-8,  y+12)
    this.bodyB = null;        //           g (r=3, invMass=0.25, x+8,  y+12)
    this.leanStrength = 0.0;  // i (=100.0 после h())
    this.fieldJ = 0.0;        // j (=3.0 после j(); в b.smali не читается)
    this.broken = false;      // k
    this.frontLinks = [];     // l — констрейнты переднего треугольника
    this.rearLinks = [];      // m — констрейнты заднего треугольника
    this.throttle = null;     // n: c/d
  }

  // b.g()D
  getLeanStrength() { return this.leanStrength; }

  // b.h()V
  initLeanStrength() { this.leanStrength = 100.0; }

  // b.j()V
  initFieldJ() { this.fieldJ = 3.0; }

  // b.k()Z
  isBroken() { return this.broken; }

  // b.l()Lc/d;
  getThrottle() { return this.throttle; }

  // b.i()V — вызывается на каждом шаге физики (после интеграции):
  // если переднее колесо прижалось к телу A (< 4) — рвём передние связи;
  // если заднее к телу B — задние.
  onStep() {
    if (!this.frontBroken &&
        Vec2.distance(this.frontWheel.pos, this.bodyA.pos) < 4.0) {
      this.broken = true;
      for (const c of this.frontLinks) this.removeConstraint(c);
      this.frontBroken = true;
    }
    if (!this.rearBroken &&
        Vec2.distance(this.rearWheel.pos, this.bodyB.pos) < 4.0) {
      this.broken = true;
      for (const c of this.rearLinks) this.removeConstraint(c);
      this.rearBroken = true;
    }
  }
}

// se.codebrew.gdtr.c.a(DD)Lb; — фабрика байка в точке (x, y).
export function createBike(x, y) {
  const bike = new Bike();

  const rearWheel = new Particle(7.0, 2.0);
  const frontWheel = new Particle(7.0, 0.75);
  frontWheel.j = 0.5;
  frontWheel.k = 0.7;
  frontWheel.l = 0.3;
  frontWheel.m = 0.58;
  const frame = new Particle(1.0, 0.25);
  const bodyA = new Particle(1.0, 0.25);
  const bodyB = new Particle(3.0, 0.25);
  const head = new Particle(4.0, 1.0);
  head.collidable = false;

  rearWheel.teleport(x - 14.0, y);
  frontWheel.teleport(x - 14.0 + 28.0, y);
  frame.teleport(x - 14.0 + 14.0, y);
  bodyA.teleport(x - 14.0 + 6.0, y + 12.0);
  bodyB.teleport(x - 14.0 + 22.0, y + 12.0);
  head.teleport(x - 14.0 + 14.0, y + 20.0);

  bike.addParticle(rearWheel);
  bike.addParticle(frontWheel);
  bike.addParticle(frame);
  bike.addParticle(bodyA);
  bike.addParticle(bodyB);
  bike.addParticle(head);

  bike.rearWheel = rearWheel;   // b.c(...)
  bike.frontWheel = frontWheel; // b.d(...)
  bike.frame = frame;           // b.f(...)
  bike.bodyA = bodyA;           // b.a(...) -> поле h
  bike.bodyB = bodyB;           // b.b(...) -> поле g
  bike.head = head;             // b.e(...)

  // c/d: газ — заднее колесо; тормоз — оба колеса
  const throttle = new ThrottleControl();
  bike.throttle = throttle;
  throttle.addDriveWheel(bike.rearWheel);
  throttle.addBrakeWheel(bike.rearWheel);
  throttle.addBrakeWheel(bike.frontWheel);

  bike.initLeanStrength();
  bike.initFieldJ();

  frame.collidable = false;
  // трение тел гонщика: j=0.5, k=l=m=n=0.3
  for (const p of [bodyA, bodyB]) {
    p.j = 0.5; p.k = 0.3; p.l = 0.3; p.m = 0.3; p.n = 0.3;
  }
  head.collidable = false;

  // констрейнты; addRearLink/addFrontLink — списки m/l оригинала
  let c;
  c = new Constraint(rearWheel, frame);
  bike.addConstraint(c); bike.rearLinks.push(c);
  c = new Constraint(rearWheel, bodyA);
  bike.addConstraint(c); bike.rearLinks.push(c);
  bike.addConstraint(new Constraint(bodyA, frame));
  c = new Constraint(frame, frontWheel);
  bike.addConstraint(c); bike.frontLinks.push(c);
  c = new Constraint(frontWheel, bodyB);
  bike.addConstraint(c); bike.frontLinks.push(c);
  bike.addConstraint(new Constraint(bodyB, frame));
  bike.addConstraint(new Constraint(bodyA, bodyB));
  bike.addConstraint(new Constraint(bodyA, head));
  bike.addConstraint(new Constraint(bodyB, head));
  bike.addConstraint(new Constraint(frame, head));

  return bike;
}

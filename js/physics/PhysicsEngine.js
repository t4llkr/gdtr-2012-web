// Порт se.codebrew.gdtr.c.f (PhysicsEngine) — верле-движок.
//
// Порядок шага b() строго как в оригинале:
//   1) решение констрейнтов по всем телам;
//   2) сбор контактов частиц с трассой (окно +-30 по X);
//   3) разрешение контактов (скорость ПЕРЕЗАПИСЫВАЕТСЯ через prevPos);
//   4) интеграция (гравитация, силы, верле, вращение);
//   5) onStep() каждого тела.
//
// Кварки, сохранённые намеренно:
//  - h = fround(g*g) — float32-округление квадрата шага (точно как double-to-float
//    и обратно в <init>);
//  - fround(Math.sqrt(distSq)) при выталкивании из контакта;
//  - сила делится на массу (force.div(mass)) — как в оригинале;
//  - угловая скорость ограничена только сверху (maxAngVel), затем *= 0.95.

import { Vec2 } from '../core/Vec2.js';
import { GRAVITY, TARGET_FPS, STEPS_PER_FRAME } from '../core/const.js';
import { TrackCollider } from './TrackCollider.js';
import { Contact } from './Contact.js';
import { BodyWrapper } from './BodyWrapper.js';

export class PhysicsEngine {
  constructor() {
    this.trackCollider = new TrackCollider(); // a
    this.bodies = [];   // b: List<c/e>
    this.contacts = []; // c: List<c/b>
    this.defaultWrapper = new BodyWrapper(); // d
    this.bodies.push(this.defaultWrapper);
    this.frame = 0;      // e — счётчик шагов
    this.f = 1.5 * TARGET_FPS * STEPS_PER_FRAME; // 90.0
    this.g = 1.0 / this.f;
    this.h = Math.fround(this.g * this.g); // fround-округление!
    this.i = 0; // ёмкость списка контактов
    this.j = 0; // число контактов на текущем шаге
  }

  // a()I
  getFrame() { return this.frame; }

  // a(La/b;)V
  addBody(body) { this.bodies.push(new BodyWrapper(body)); }

  // a(Li;)V
  loadLevel(level) { this.trackCollider.loadLevel(level); }

  // b()V — один шаг физики
  step() {
    this.frame++;

    // 1) констрейнты
    for (const wrapper of this.bodies) {
      const constraints = wrapper.body.getConstraints();
      for (const c of constraints) {
        if (!c.isEnabled()) continue;
        const p0 = c.particles[0];
        const p1 = c.particles[1];
        const delta = Vec2.sub(p1.pos, p0.pos);
        const dist = delta.length();
        if (Math.abs(dist) < 1.0E-5) continue;
        const dir = Vec2.copy(delta);
        dir.div(dist);
        let diff = (dist - c.getRestLength()) / ((p0.mass + p1.mass) * 1.25);
        diff *= c.getStiffness();
        p0.pos.addInPlace(Vec2.scaleTo(new Vec2(), dir, p1.mass * diff));
        p1.pos.addInPlace(Vec2.scaleTo(new Vec2(), dir, -diff * p0.mass));
      }
    }

    // 2) сбор контактов
    this.j = 0;
    for (const wrapper of this.bodies) {
      const particles = wrapper.body.getParticles().getAll();
      for (const p of particles) {
        if (!p.collidable) continue;
        this.trackCollider.setWindow(p.pos.x - 30.0, p.pos.x + 30.0);
        const outN = new Vec2(0.0, 0.0);
        const outD = new Vec2(0.0, 0.0);
        const ret = this.trackCollider.test(p, outN, outD);
        if (ret !== 2) {
          outN.normalize();
          if (this.j >= this.i) {
            this.contacts.push(new Contact());
            this.i++;
          }
          const contact = this.contacts[this.j];
          this.j++;
          contact.particle = p;
          contact.normal = outN; // ссылка удерживается (в оригинале не возвращается в пул)
          contact.distSq = outD.x;
          p.contact = true;
          Vec2.subTo(p.velCache, p.pos, p.prevPos);
        }
      }
    }

    // 3) разрешение контактов
    for (let idx = 0; idx < this.j; idx++) {
      const contact = this.contacts[idx];
      const p = contact.particle;
      const normal = contact.normal;
      const tangent = new Vec2(-normal.y, normal.x);
      const vel = Vec2.sub(p.pos, p.prevPos);
      const ns = -Vec2.dot(vel, normal);
      const ts = -Vec2.dot(vel, tangent);
      let A = p.j * p.angVel + (p.k * ts / p.radius) * this.f;
      let B = ts * p.m + p.l * p.angVel * p.radius * this.g;
      let C = ns * p.n;
      if (p.pinned) {
        A = 0.0; B = 0.0; C = 0.0;
      }
      // correction = tangent * (-B) + normal * C
      const correction = Vec2.scaleTo(new Vec2(), tangent, -B);
      correction.addInPlace(Vec2.scaleTo(new Vec2(), normal, C));
      // выталкивание: pos += normal * (radius - fround(sqrt(distSq)))
      const push = Vec2.scaleTo(new Vec2(), normal,
        p.radius - Math.fround(Math.sqrt(contact.distSq)));
      p.pos.addInPlace(push);
      // prevPos = pos - correction (после выталкивания)
      p.prevPos.x = p.pos.x - correction.x;
      p.prevPos.y = p.pos.y - correction.y;
      p.angVel = A;
      p.contactNormal.x = normal.x;
      p.contactNormal.y = normal.y;
    }

    // 4) интеграция
    for (const wrapper of this.bodies) {
      const particles = wrapper.body.getParticles().getAll();
      for (const p of particles) {
        if (p.mass === 0.0) continue;
        p.accel.y += GRAVITY / STEPS_PER_FRAME;
        const f = Vec2.copy(p.force);
        f.div(p.mass);
        p.accel.addInPlace(f);
        p.accel.scale(this.h);
        const newPos = Vec2.scaleTo(new Vec2(), p.pos, 2.0);
        newPos.subInPlace(p.prevPos);
        newPos.addInPlace(p.accel);
        p.angVel += p.angAccel * this.g;
        if (p.angVel > p.maxAngVel) p.angVel = p.maxAngVel;
        p.angVel *= 0.95;
        p.angle += p.angVel * this.g;
        p.prevPos.x = p.pos.x;
        p.prevPos.y = p.pos.y;
        p.pos.x = newPos.x;
        p.pos.y = newPos.y;
        p.accel.reset();
      }
    }

    // 5) хуки тел
    for (const wrapper of this.bodies) {
      wrapper.body.onStep();
    }
  }

  // c()V — dispose
  dispose() {
    this.trackCollider.points = null;
    for (const w of this.bodies) w.dispose();
    this.bodies = null;
    for (const c of this.contacts) {
      c.particle = null;
      c.normal = null;
    }
    this.contacts = null;
    if (this.defaultWrapper) {
      this.defaultWrapper.dispose();
      this.defaultWrapper = null;
    }
  }
}

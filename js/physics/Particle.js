// Порт se.codebrew.gdtr.a.c (Particle) — частица верле-физики.

import { Vec2 } from '../core/Vec2.js';

export class Particle {
  // ctor(DD): i = radius (по умолч. 25), h = mass (по умолч. 1.0)
  // h — именно масса: в решателе констрейнтов смещение частицы пропорционально
  // массе ДРУГОЙ частицы (импульс сохраняется), в интеграторе force.div(h) = F/m.
  // mass == 0 означает неподвижную частицу (интеграция пропускается).
  constructor(radius = 25.0, mass = 1.0) {
    this.pos = new Vec2();      // a
    this.prevPos = new Vec2();  // b
    this.accel = new Vec2();    // c — аккумулятор ускорения за шаг
    this.force = new Vec2();    // d — сила от контролов (перезаписывается)
    this.angle = 0.0;           // e
    this.angVel = 0.0;          // f
    this.angAccel = 0.0;        // g
    this.mass = mass;           // h
    this.radius = radius;       // i
    this.j = 0.5;               // j — контакт: удержание угловой скорости
    this.k = 0.5;               // k — контакт: связь угл. скорости со скольжением
    this.l = 0.5;               // l — контакт: вклад вращения в тангенс
    this.m = 0.5;               // m — контакт: трение (тангенс. множитель)
    this.n = 0.5;               // n — контакт: реституция (нормаль. множитель)
    this.contact = false;       // o — был контакт на этом шаге
    this.velCache = new Vec2(); // p — скорость на момент контакта
    this.contactNormal = new Vec2(); // q
    this.pinned = false;        // r — заторможен: контактный отклик нулевой
    this.collidable = true;     // s
    this.maxAngVel = 35.0;      // t
  }

  // копирующий ctor(La/c;): копирует pos/prevPos/accel/force, radius, angle,
  // angVel, maxAngVel, j..n, collidable; НЕ копирует mass (остаётся 1.0),
  // angAccel (остаётся 0), contact/velCache (сброс), pinned.
  static copy(p) {
    const q = new Particle();
    q.pos = Vec2.copy(p.pos);
    q.prevPos = Vec2.copy(p.prevPos);
    q.accel = Vec2.copy(p.accel);
    q.force = Vec2.copy(p.force);
    q.radius = p.radius;
    q.angle = p.angle;
    q.angVel = p.angVel;
    q.maxAngVel = p.maxAngVel;
    q.j = p.j; q.k = p.k; q.l = p.l; q.m = p.m; q.n = p.n;
    q.contactNormal = new Vec2();
    q.collidable = p.collidable;
    return q;
  }

  // a(DD)V — телепорт: pos = prevPos = (x, y)
  teleport(x, y) {
    this.pos.x = x; this.prevPos.x = x;
    this.pos.y = y; this.prevPos.y = y;
  }
}

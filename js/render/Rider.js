// Порт se.codebrew.gdtr.e (Rider) + se.codebrew.gdtr.u (RiderFactory).
//
// Райдер — позируемый "скелет" из 7 статических частиц (масса 0).
// Тело добавляется в физику (как в Play.onCreate), но интеграция его
// не трогает (mass == 0); позы выставляет Rider.setPose каждый кадр
// из BikeRenderer. Голова (head, poseIdx 3) остаётся collidable=true —
// в оригинале это датчик касания головой (читает GameController, этап 4).

import { Vec2 } from '../core/Vec2.js';
import { Particle } from '../physics/Particle.js';
import { Constraint } from '../physics/Constraint.js';
import { Body } from '../physics/Body.js';
import { createCornerPath } from './Paint.js';

// e.b — константа (0, 1)
const UP = new Vec2(0.0, 1.0);

// Таблицы поз (8 точек x 2; локальные координаты: x вдоль up, y вдоль perp).
// e.a — нейтраль, e.c — наклон влево (lean < 0.5), e.d — вправо (lean > 0.5).
const POSE_A = [
  [9.799999999999999, -2.1], [14.0, -7.0], [21.0, -3.5], [24.5, -2.1],
  [15.75, 0.35000000000000003], [0.875, -7.0], [0.7000000000000001, -4.2],
  [15.400000000000002, 7.0],
];
const POSE_B = [
  [10.15, -4.8999999999999995], [13.65, -12.6], [17.849999999999998, -6.125],
  [21.0, -2.275], [16.099999999999998, 0.35000000000000003], [0.875, -7.0],
  [0.7000000000000001, -4.2], [15.400000000000002, 7.0],
];
const POSE_C = [
  [8.4, 0.7000000000000001], [15.75, -0.7000000000000001],
  [19.599999999999998, 5.6000000000000005], [21.7, 9.450000000000001],
  [13.65, 1.05], [0.875, -7.0], [0.7000000000000001, -2.8000000000000003],
  [15.400000000000002, 7.0],
];

export class Rider extends Body {
  constructor() {
    super();
    // частицы скелета (назначаются фабрикой через сеттеры)
    this.pE = null; // e — poseIdx 5 (начало пути)
    this.pF = null; // f — poseIdx 0
    this.pG = null; // g — poseIdx 1
    this.pH = null; // h — poseIdx 2
    this.pI = null; // i — poseIdx 4
    this.pJ = null; // j — poseIdx 7
    this.pK = null; // k — poseIdx 3 (голова)
    this.firstPose = true; // l
  }

  // e.a()a/c — голова
  getHead() { return this.pK; }
  // e.b()a/c
  getG() { return this.pG; }
  // e.c()a/c
  getE() { return this.pE; }

  // сеттеры e.a..g(a/c)
  setE(p) { this.pE = p; }
  setF(p) { this.pF = p; }
  setG(p) { this.pG = p; }
  setH(p) { this.pH = p; }
  setI(p) { this.pI = p; }
  setJ(p) { this.pJ = p; }
  setK(p) { this.pK = p; }

  // e.a(g perp, g up, g seat, D lean)V — позирование скелета
  setPose(perp, up, seat, lean) {
    const invert = (1.0 - Vec2.dot(up, UP)) / 2.0;   // (1 - up.y) / 2
    const centered = 1.0 - 2.0 * Math.abs(lean - 0.5);
    const tuck = invert * centered;

    let from = null, to = null, direct = null, t = 0.0;
    if (lean < 0.5) {
      from = POSE_B; to = POSE_A; t = 1.0 - 2.0 * lean;
    } else if (lean > 0.5) {
      from = POSE_A; to = POSE_C; t = 1.0 - (2.0 * lean - 1.0);
    } else {
      direct = POSE_A;
    }

    for (let i = 0; i < POSE_A.length; i++) {
      let lx, ly;
      if (from !== null) {
        lx = from[i][0] * t + to[i][0] * (1.0 - t);
        ly = from[i][1] * t + to[i][1] * (1.0 - t);
      } else {
        lx = direct[i][0];
        ly = direct[i][1];
      }
      if (i === 2 || i === 3) lx -= 3.0 * tuck;
      if (i === 1) ly -= 3.0 * tuck;

      const px = Math.fround(seat.x + up.x * lx + perp.x * ly);
      const py = Math.fround(seat.y + up.y * lx + perp.y * ly);

      // packed-switch: 0->f, 1->g, 2->h, 3->k, 4->i, 5->e, 6->none, 7->j
      let particle = null;
      switch (i) {
        case 0: particle = this.pF; break;
        case 1: particle = this.pG; break;
        case 2: particle = this.pH; break;
        case 3: particle = this.pK; break;
        case 4: particle = this.pI; break;
        case 5: particle = this.pE; break;
        case 7: particle = this.pJ; break;
        default: particle = null;
      }

      if (particle !== null) {
        particle.prevPos.x = particle.pos.x;
        particle.prevPos.y = particle.pos.y;
        particle.pos.x = px;
        particle.pos.y = py;
        if (this.firstPose) {
          particle.prevPos.x = particle.pos.x;
          particle.prevPos.y = particle.pos.y;
          this.firstPose = false;
        }
      }
    }
  }

  // e.a(Path)V — ломаная тела: e -> f -> g -> h -> i -> j
  buildPath(path) {
    path.rewind ? path.rewind() : null;
  }
}

// Path2D не имеет rewind — пересоздаём снаружи; CornerPathEffect применяется
// к геометрии, как в Android, а не только к lineJoin.
export function buildRiderPath(rider, corner = null) {
  const points = [rider.pE, rider.pF, rider.pG, rider.pH, rider.pI, rider.pJ]
    .map(particle => particle.pos);
  if (corner !== null) return createCornerPath(points, corner);
  const path = new Path2D();
  path.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) path.lineTo(points[i].x, points[i].y);
  return path;
}

// se.codebrew.gdtr.u.a()Le; — фабрика райдера
export function createRider() {
  const rider = new Rider();

  const v1 = new Particle(3.0, 0.0);
  const v2 = new Particle(3.0, 0.0);
  const v3 = new Particle(3.0, 0.0);
  const v4 = new Particle(3.0, 0.0);
  const v5 = new Particle(3.0, 0.0);
  const v6 = new Particle(3.0, 0.0);
  const v7 = new Particle(3.0, 0.0);

  // u.a(a/c) — j=0.5, k=l=m=n=0.3
  for (const p of [v1, v2, v3, v4, v5, v6, v7]) {
    p.j = 0.5;
    p.k = 0.3;
    p.l = 0.3;
    p.m = 0.3;
    p.n = 0.3;
  }
  // collidable=false всем, кроме v7 (голова k — датчик касания)
  for (const p of [v1, v2, v3, v4, v5, v6]) p.collidable = false;

  rider.setE(v1);
  rider.setF(v2);
  rider.setG(v3);
  rider.setH(v4);
  rider.setI(v5);
  rider.setJ(v6);
  rider.setK(v7);

  rider.addParticle(v1);
  rider.addParticle(v2);
  rider.addParticle(v3);
  rider.addParticle(v4);
  rider.addParticle(v5);
  rider.addParticle(v6);
  rider.addParticle(v7);

  // начальные позиции — из POSE_A (индексы: v1<-5, v2<-0, v3<-1, v4<-2, v5<-4, v6<-7, v7<-3)
  v1.teleport(POSE_A[5][0], POSE_A[5][1]);
  v2.teleport(POSE_A[0][0], POSE_A[0][1]);
  v3.teleport(POSE_A[1][0], POSE_A[1][1]);
  v4.teleport(POSE_A[2][0], POSE_A[2][1]);
  v5.teleport(POSE_A[4][0], POSE_A[4][1]);
  v6.teleport(POSE_A[7][0], POSE_A[7][1]);
  v7.teleport(POSE_A[3][0], POSE_A[3][1]);

  // констрейнты (enabled=false): e-f, f-g, g-h, h-i, i-j, h-k, e-k, j-k
  rider.addConstraint(new Constraint(v1, v2, false));
  rider.addConstraint(new Constraint(v2, v3, false));
  rider.addConstraint(new Constraint(v3, v4, false));
  rider.addConstraint(new Constraint(v4, v5, false));
  rider.addConstraint(new Constraint(v5, v6, false));
  rider.addConstraint(new Constraint(v4, v7, false));
  rider.addConstraint(new Constraint(v1, v7, false));
  rider.addConstraint(new Constraint(v6, v7, false));

  return rider;
}

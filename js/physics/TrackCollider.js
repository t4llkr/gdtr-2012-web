// Порт se.codebrew.gdtr.c.k (TrackPoints) + se.codebrew.gdtr.c.c (TrackCollider).
// Точки трассы с отбраковкой только полных дубликатов, предвычисленные нормали
// сегментов и скользящее окно сегментов [e, f) с гистерезисом.
// Расширение порта: вертикальные сегменты участвуют в столкновениях.
//
// Статические поля e/f/g/h оригинала перенесены в поля экземпляра:
// коллайдер в игре всегда один, а loadLevel() сбрасывает их так же, как <clinit>.
//
// ВАЖНО (кварки оригинала, сохранены намеренно):
//  - эпсилон радиуса — литерал 0.30000001192092896 (float 0.3 как double);
//  - x-отсечение сегмента сравнивается с КВАДРАТОМ расширенного радиуса;
//  - вырожденный сегмент: t = sign(t)*sign(lenSq)*Double.MAX_VALUE.

const EPS = 0.30000001192092896;

class TrackPoints {
  constructor(level) {
    this.a = []; // double[][2]
    this.b = 0;  // count
    for (const p of level.points) {
      const x = p.x, y = p.y;
      if (this.b !== 0) {
        const prev = this.a[this.b - 1];
        if (prev[0] === x && prev[1] === y) continue;
      }
      this.a[this.b] = [x, y];
      this.b++;
    }
  }
}

export class TrackCollider {
  constructor() {
    this.normals = null;   // a: double[][2] — нормали сегментов
    this.points = null;    // b: TrackPoints
    this.maxInteriorX = 1.0; // c
    this.e = 0; // окно: первый сегмент
    this.f = 0; // окно: последний сегмент (искл.)
    this.g = 0.0; // окно: x[e]
    this.h = 0.0; // окно: x[f]
  }

  // a(Li;)V — загрузить уровень
  loadLevel(level) {
    this.maxInteriorX = 1.0;
    this.points = new TrackPoints(level);
    const count = this.points.b;
    this.normals = new Array(Math.max(count, 100));
    this.e = 0;
    this.f = 0;
    this.g = this.points.a[0][0];
    this.h = this.points.a[0][0];
    for (let i = 0; i < count; i++) {
      const nxt = this.points.a[(i + 1) % count];
      const cur = this.points.a[i];
      const dx = nxt[0] - cur[0];
      const dy = nxt[1] - cur[1];
      if (i !== 0 && i !== count - 1) {
        if (this.maxInteriorX < cur[0]) this.maxInteriorX = cur[0];
      }
      // нормаль сегмента: normalize(-dy, dx)
      let nx = -dy, ny = dx;
      const len = Math.sqrt(nx * nx + ny * ny);
      if (len > 0.0) {
        nx = nx / len;
        ny = ny / len;
      } else {
        // Замыкающий сегмент может быть нулевым, если последняя точка равна первой.
        nx = 0.0;
        ny = 0.0;
      }
      this.normals[i] = [nx, ny];
    }
    this.e = 0;
    this.f = 0;
    this.g = 0.0;
    this.h = 0.0;
  }

  // a(DD)V — сдвинуть окно [e, f) так, чтобы покрывать [x0, x1]
  setWindow(x0, x1) {
    const pts = this.points.a;
    const count = this.points.b;
    this.f = Math.min(this.f, count - 1);
    this.e = Math.max(this.e, 0);
    if (x1 > this.h) {
      while (this.f < count - 1) {
        this.f++;
        if (x1 <= pts[this.f][0]) break;
      }
    } else if (x0 < this.g) {
      while (this.e > 0) {
        this.e--;
        if (x0 >= pts[this.e][0]) break;
      }
    } else {
      while (this.e < count) {
        this.e++;
        if (x0 <= pts[this.e][0]) break;
      }
      if (this.e > 0) this.e--;
      while (this.f > 0) {
        this.f--;
        if (x1 >= pts[this.f][0]) break;
      }
      this.f = Math.min(this.f + 1, count - 1);
    }
    this.g = pts[this.e][0];
    this.h = pts[this.f][0];
  }

  // a(La/c; La/g; La/g;)I — проверка частицы против сегментов окна.
  // outN — нормаль контакта, outD.x — квадрат расстояния до ближайшей точки.
  // Возврат: 0 = глубокое проникновение, 1 = касание, 2 = нет контакта.
  test(p, outN, outD) {
    const r = p.radius;
    const px = p.pos.x, py = p.pos.y;
    const vx = p.pos.x - p.prevPos.x;
    const vy = p.pos.y - p.prevPos.y;
    const rrPlus = (r + EPS) * (r + EPS);
    const rrMinus = (r - EPS) * (r - EPS);
    let accNx = 0.0, accNy = 0.0; // накопленная нормаль (v5, v3)
    let accCount = 0;             // v8
    let ret = 2;                  // v7
    const pts = this.points.a;
    const nrms = this.normals;

    for (let i = this.e; i < this.f; i++) {
      const x0 = pts[i][0], y0 = pts[i][1];
      const x1 = pts[i + 1][0], y1 = pts[i + 1][1];
      // кварк: сравнение с квадратом расширенного радиуса
      if (px - rrPlus > x1 || px + rrPlus < x0) continue;

      const dx = x0 - x1;
      const dy = y0 - y1;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0.0) continue;
      let t = (px - x0) * (-dx) + (py - y0) * (-dy);
      if (Math.abs(lenSq) > 1.0E-5) {
        t /= lenSq;
      } else {
        const st = t > 0.0 ? 1 : -1;
        const sl = lenSq > 0.0 ? 1 : -1;
        t = (st * sl) * Number.MAX_VALUE;
      }
      if (t < 0.0) t = 0.0;
      if (t > 1.0) t = 1.0;
      const cx = (-dx) * t + x0;
      const cy = (-dy) * t + y0;
      const ddx = px - cx;
      const ddy = py - cy;
      const distSq = ddx * ddx + ddy * ddy;

      let code;
      if (distSq < rrPlus) {
        code = distSq >= rrMinus ? 1 : 0;
        outD.x = distSq;
      } else {
        code = 2;
      }
      if (code === 2 && x0 === x1) {
        // У вертикали нельзя вычислить slope. Если частица находится в пределах
        // сегмента по Y и за его внешней нормалью, она проникла внутрь стены.
        const minY = Math.min(y0, y1), maxY = Math.max(y0, y1);
        const inside = nrms[i][0] * (px - x0) + nrms[i][1] * (py - y0);
        if (py >= minY && py <= maxY && inside < 0.0) {
          code = 0;
          outD.x = distSq;
        }
      } else if (code === 2 && x0 <= px && px <= x1) {
        const slope = (y1 - y0) / (x1 - x0);
        const lineY = y0 - x0 * slope + slope * px;
        if (lineY > py) {
          code = 0;
          outD.x = distSq;
        }
      }
      if (code === 0) {
        // глубокое проникновение: только при движении навстречу нормали
        if (nrms[i][0] * vx + nrms[i][1] * vy < 0.0) {
          outN.x = nrms[i][0];
          outN.y = nrms[i][1];
          return 0;
        }
        continue;
      }
      if (code === 1) {
        // касание: накапливаем нормали сегментов, в которые едем
        if (nrms[i][0] * vx + nrms[i][1] * vy < 0.0) {
          accCount++;
          ret = 1;
          if (accCount === 1) {
            accNx = nrms[i][0];
            accNy = nrms[i][1];
          } else {
            accNx += nrms[i][0];
            accNy += nrms[i][1];
          }
        }
      }
    }
    if (ret === 1) {
      if (accNx * vx + accNy * vy >= 0.0) return 2;
      outN.x = accNx;
      outN.y = accNy;
      return 1;
    }
    return ret;
  }
}

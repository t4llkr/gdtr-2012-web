// Порт se.codebrew.gdtr.l (LevelInfo — запись каталога уровней).
// Comparable: сортировка по полю order (f:I).

import { HSStore } from '../storage/HSStore.js';

export class LevelInfo {
  constructor() {
    this.level = null;      // a: Level (i), ленивая загрузка
    this.packName = null;   // b — отображаемое имя пака
    this.packId = null;     // n — имя каталога пака
    this.score = null;      // c: a/f (призрак; следующий этап)
    this.name = null;       // d
    this.filename = null;   // e
    this.order = 0;         // f
    this.scheme = null;     // g
    this.oneStar = 0;       // h — время "one", в сантисекундах
    this.twoStar = 0;       // i — "two"
    this.threeStar = 0;     // j — "three"
    this.nextLevelName = null; // k — имя следующего уровня
    this.firstInPack = false;  // l — первый уровень пользовательского пака
    this.custom = false;    // m
    this.locked = false;    // o
  }

  // l.compareTo — по возрастанию order
  static compare(a, b) { return a.order - b.order; }

  getBestTime(scoreStore = HSStore.getInstance()) {
    return scoreStore.getBestTime(this.name);
  }

  // l.b() — null при отсутствии рекорда, иначе MM:SS:cc.
  getBestTimeText(scoreStore = HSStore.getInstance()) {
    const time = this.getBestTime(scoreStore);
    return time === -1 ? null : formatTime(time);
  }

  // l.c() — строгие неравенства оригинала, равенство порогу звезду не даёт.
  getStars(scoreStore = HSStore.getInstance()) {
    const time = this.getBestTime(scoreStore);
    if (time === -1) return 0;
    if (time < this.threeStar) return 3;
    if (time < this.twoStar) return 2;
    if (time < this.oneStar) return 1;
    return 0;
  }

  // l.d() — прохождение определяется только наличием сохранённого времени.
  isCompleted(scoreStore = HSStore.getInstance()) {
    return this.getBestTime(scoreStore) !== -1;
  }
}

// Форматирование времени "%02d:%02d:%02d" (мин:сек:санти) — как в l и ChooseLevel.
export function formatTime(centis) {
  const c = centis % 100;
  const totalSec = Math.floor(centis / 100);
  const s = totalSec % 60;
  const m = Math.floor(totalSec / 60);
  const p2 = (v) => String(v).padStart(2, '0');
  return `${p2(m)}:${p2(s)}:${p2(c)}`;
}

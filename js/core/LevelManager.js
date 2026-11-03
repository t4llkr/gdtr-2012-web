// Порт se.codebrew.gdtr.j (LevelManager).
// Встроенные data/levels.xml + исходные пользовательские pack.def/.gdlvl.

import { Level } from './Level.js';
import { LevelInfo } from './LevelInfo.js';
import { CustomPackStore } from '../storage/CustomPackStore.js';
import { HSStore } from '../storage/HSStore.js';

// j.b(String)I — "MM:SS:cc" -> сантисекунды: (MM*60 + SS)*100 + cc
function parseTime(s) {
  if (s == null) return 0;
  const cc = parseInt(s.substring(6, 8), 10);
  const ss = parseInt(s.substring(3, 5), 10);
  const mm = parseInt(s.substring(0, 2), 10);
  return (mm * 60 + ss) * 100 + cc;
}

function compareNames(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

export class LevelManager {
  constructor(storage = globalThis.localStorage) {
    this.levels = [];       // c: List<LevelInfo>, отсортирован по order
    this.locks = new Map(); // b: Map<name, Object> для встроенных уровней
    this.packs = new Map(); // d: TreeMap<pack directory, List<LevelInfo>>
    this.customJson = new Map();
    this.packStore = new CustomPackStore(storage);
  }

  async load() {
    const xmlText = await (await fetch('data/levels.xml')).text();
    this.parseLevelXml(xmlText);
    this.rebuildCustomPacks();
  }

  // j.c()V — разбор levels.xml
  parseLevelXml(xmlText) {
    const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
    for (const el of doc.querySelectorAll('levelset > level')) {
      const info = new LevelInfo();
      info.name = el.getAttribute('name');
      info.filename = el.getAttribute('filename');
      info.order = parseInt(el.getAttribute('order') ?? '0', 10) || 0;
      info.scheme = el.getAttribute('scheme');
      const one = el.querySelector('one');
      const two = el.querySelector('two');
      const three = el.querySelector('three');
      if (one) info.oneStar = parseTime(one.textContent);
      if (two) info.twoStar = parseTime(two.textContent);
      if (three) info.threeStar = parseTime(three.textContent);
      this.levels.push(info);
      this.locks.set(info.name, new Object());
    }
    this.levels.sort(LevelInfo.compare);
    // цепочка "следующий уровень": каждому — имя следующего в списке
    for (let i = 0; i < this.levels.length - 1; i++) {
      this.levels[i].nextLevelName = this.levels[i + 1].name;
    }
  }

  // j.b(Reader)i — разбор JSON уровня
  parseLevelJson(json) {
    try {
      const level = new Level(json.name);
      level.setStart(json.start[0], -json.start[1]);
      if (Object.prototype.hasOwnProperty.call(json, 'scheme')) {
        level.scheme = json.scheme;
      }
      level.setGoalX(json.goal[0]);
      if (Object.prototype.hasOwnProperty.call(json, '1-star') &&
          Object.prototype.hasOwnProperty.call(json, '2-star') &&
          Object.prototype.hasOwnProperty.call(json, '3-star')) {
        level.starTimes[1] = parseTime(json['1-star']);
        level.starTimes[2] = parseTime(json['2-star']);
        level.starTimes[3] = parseTime(json['3-star']);
      }
      const pts = json.points;
      let prevX = -2147483648; // Integer.MIN_VALUE
      for (let i = 0; i < pts.length / 2; i++) {
        const x = pts[i * 2];
        const y = pts[i * 2 + 1];
        if (x < prevX) {
          console.error('GDTR', `Level has non-increasing X coordinates at (${x},${y})`);
          return null;
        }
        level.addPoint(x, y);
        prevX = x;
      }
      return level;
    } catch (e) {
      console.error('GDTR', 'Failed to parse level.', e);
      return null;
    }
  }

  parsePackName(pack) {
    if (pack.packDef === null) return pack.id;
    try {
      const definition = JSON.parse(pack.packDef);
      if (typeof definition.packName !== 'string') throw new Error('Missing packName');
      return definition.packName;
    } catch (e) {
      console.error('GDTR', 'Failed to parse pack.def.', e);
      return pack.id;
    }
  }

  // j.c()V, часть пользовательских паков: сохранённый порядок каталогов,
  // сортировка файлов, звёзды и nextLevelName внутри пака.
  rebuildCustomPacks() {
    this.packs.clear();
    this.customJson.clear();
    let order = this.levels.length > 0 ? this.levels[this.levels.length - 1].order + 1 : 0;
    const storedPacks = this.packStore.getPacks();

    for (const pack of storedPacks) {
      const packName = this.parsePackName(pack);
      const infos = [];
      const sources = new Map();
      let first = true;
      const files = pack.levels.slice().sort((a, b) => compareNames(a.filename, b.filename));
      for (const source of files) {
        sources.set(source.filename, source.text);
        let level = null;
        try {
          level = this.parseLevelJson(JSON.parse(source.text));
        } catch (e) {
          console.error('GDTR', 'Failed to load level ' + source.filename, e);
        }
        if (!level || this.locks.has(level.name)) continue;

        const info = new LevelInfo();
        info.level = level;
        info.packId = pack.id;
        info.packName = packName;
        info.name = level.name;
        info.filename = source.filename;
        info.order = order++;
        info.scheme = level.scheme;
        info.oneStar = level.starTimes[1];
        info.twoStar = level.starTimes[2];
        info.threeStar = level.starTimes[3];
        info.firstInPack = first;
        info.custom = true;
        first = false;
        infos.push(info);
      }
      for (let i = 0; i < infos.length - 1; i++) {
        infos[i].nextLevelName = infos[i + 1].name;
      }
      this.packs.set(pack.id, infos);
      this.customJson.set(pack.id, sources);
    }
  }

  async importPackFiles(files) {
    const imported = await this.packStore.importFiles(files);
    this.rebuildCustomPacks();
    return {
      packs: imported.length,
      levels: imported.reduce((sum, pack) => sum + (this.packs.get(pack.id)?.length || 0), 0),
    };
  }

  movePackTo(id, targetId) {
    this.packStore.movePackTo(id, targetId);
    this.rebuildCustomPacks();
  }

  deletePack(id, removeRecords = false, scoreStore = HSStore.getInstance()) {
    if (removeRecords) {
      const names = new Set((this.packs.get(id) || []).map(info => info.name));
      const usedElsewhere = new Set(this.levels.map(info => info.name));
      for (const [packId, infos] of this.packs) {
        if (packId !== id) for (const info of infos) usedElsewhere.add(info.name);
      }
      scoreStore.deleteRecords([...names].filter(name => !usedElsewhere.has(name)));
    }
    this.packStore.deletePack(id);
    this.rebuildCustomPacks();
  }

  exportBackup(scoreStore = HSStore.getInstance()) {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      highscores: scoreStore.exportData(),
      packs: this.packStore.getPacks(),
    };
  }

  importBackup(text, scoreStore = HSStore.getInstance()) {
    const data = JSON.parse(text);
    if (!data || data.version !== 1 || !data.highscores || typeof data.highscores !== 'object' ||
        Array.isArray(data.highscores) || !Array.isArray(data.packs)) {
      throw new Error('Invalid GDTR backup');
    }
    if (Object.values(data.highscores).some(value => !Number.isFinite(Number(value)) || Number(value) < 0)) {
      throw new Error('Invalid GDTR backup');
    }
    const packs = this.packStore.importPacks(data.packs);
    const records = scoreStore.importData(data.highscores);
    this.rebuildCustomPacks();
    return { packs, records };
  }

  // j.c(String)i — загрузка встроенного трека из assets или исходного .gdlvl.
  async loadLevel(filename, packId = null) {
    try {
      if (packId !== null) {
        const text = this.customJson.get(packId)?.get(filename);
        return text === undefined ? null : this.parseLevelJson(JSON.parse(text));
      }
      const resp = await fetch('data/' + filename);
      const json = await resp.json();
      return this.parseLevelJson(json);
    } catch (e) {
      console.error('GDTR', 'Failed to load level ' + filename, e);
      return null;
    }
  }

  // q.a(List) — после рекорда открыт следующий уровень; остальные закрыты,
  // кроме первого уровня каждого пользовательского пака.
  updateLocks(scoreStore) {
    let previousCompleted = true;
    for (const info of this.getAllLevels()) {
      if (info.isCompleted(scoreStore)) {
        info.locked = false;
        previousCompleted = true;
      } else if (previousCompleted) {
        info.locked = false;
        previousCompleted = false;
      } else if (info.firstInPack) {
        info.locked = false;
      } else {
        info.locked = true;
      }
    }
  }

  getLevels() { return this.levels; }

  getPacks() {
    return Array.from(this.packs, ([id, levels]) => ({
      id,
      name: levels[0]?.packName ?? 'Gravity Defied',
      levels,
    }));
  }

  getAllLevels() {
    return this.levels.concat(...this.packs.values());
  }

  findByName(name) {
    return this.getAllLevels().find(level => level.name === name) ?? null;
  }
}

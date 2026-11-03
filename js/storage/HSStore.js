// Порт se.codebrew.gdtr.d.b (HSStore).
// Android ObjectOutputStream/SharedPreferences заменены JSON в localStorage;
// имена уровней, ключ "one" и единицы времени сохранены без изменений.

const STORAGE_KEY = 'highscores';
let instance = null;

export class HSStore {
  constructor(storage) {
    this.storage = storage;
    this.scores = this.read();
  }

  static getInstance() {
    if (instance === null) instance = new HSStore(globalThis.localStorage);
    return instance;
  }

  read() {
    if (!this.storage) return Object.create(null);
    try {
      const value = JSON.parse(this.storage.getItem(STORAGE_KEY) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value)
        ? value : Object.create(null);
    } catch {
      return Object.create(null);
    }
  }

  write() {
    this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.scores));
  }

  getBestTime(levelName) {
    return Object.prototype.hasOwnProperty.call(this.scores, levelName)
      ? Number(this.scores[levelName]) : -1;
  }

  recordResult(levelName, time, key = 'one') {
    // В GDTR 0.93 сохраняется только ключ "one".
    if (key !== 'one') return;
    const previous = this.getBestTime(levelName);
    if (time < previous || previous === -1) {
      this.scores[levelName] = time;
      this.write();
    }
  }

  exportData() {
    return { ...this.scores };
  }

  importData(scores) {
    if (!scores || typeof scores !== 'object' || Array.isArray(scores)) {
      throw new Error('Invalid highscores backup');
    }
    const entries = Object.entries(scores).map(([name, value]) => [name, Number(value)]);
    if (entries.some(([, time]) => !Number.isFinite(time) || time < 0)) {
      throw new Error('Invalid highscores backup');
    }
    for (const [name, time] of entries) {
      const previous = this.getBestTime(name);
      if (previous === -1 || time < previous) this.scores[name] = time;
    }
    this.write();
    return entries.length;
  }

  deleteRecords(levelNames) {
    for (const name of levelNames) delete this.scores[name];
    this.write();
  }

  release() {
    this.scores = Object.create(null);
  }
}

// Browser-эквивалент Android SharedPreferences из файла "settings".

const PREFIX = 'settings:';

export class Preferences {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
  }

  getBoolean(key, fallback) {
    const value = this.storage?.getItem(PREFIX + key);
    return value === null || value === undefined ? fallback : value === 'true';
  }

  setBoolean(key, value) {
    this.storage?.setItem(PREFIX + key, String(Boolean(value)));
  }
}

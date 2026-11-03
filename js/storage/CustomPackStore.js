// Браузерное хранение исходных pack.def и .gdlvl из ZIP-архивов.
// Содержимое файлов сохраняется без изменений; разбор выполняет LevelManager.

import { unzipSync } from '../vendor/fflate.module.js';

const STORAGE_KEY = 'custom-level-packs';
const decoder = new TextDecoder();
const cp866Decoder = new TextDecoder('ibm866');

function normalizePath(path) {
  return String(path || '').replaceAll('\\', '/');
}

// fflate возвращает non-UTF-8 имена как Latin-1. Старые GD/GDLVL-архивы
// используют CP866; восстанавливаем байты и декодируем русские пути.
export function decodeZipPath(path) {
  const value = String(path || '');
  if (Array.from(value).some(char => char.charCodeAt(0) > 255)) return value;
  const bytes = Uint8Array.from(value, char => char.charCodeAt(0));
  const decoded = cp866Decoder.decode(bytes);
  return /[А-Яа-яЁё]/.test(decoded) ? decoded : value;
}

function compareNames(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function cleanPack(pack) {
  if (!pack || typeof pack.id !== 'string' || !Array.isArray(pack.levels)) return null;
  return {
    id: pack.id,
    packDef: typeof pack.packDef === 'string' ? pack.packDef : null,
    levels: pack.levels.filter(level => level && typeof level.filename === 'string' &&
      typeof level.text === 'string').map(level => ({ filename: level.filename, text: level.text })),
  };
}

export class CustomPackStore {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
  }

  getPacks() {
    if (!this.storage) return [];
    try {
      const value = JSON.parse(this.storage.getItem(STORAGE_KEY) || '{"version":1,"packs":[]}');
      if (!value || value.version !== 1 || !Array.isArray(value.packs)) return [];
      return value.packs.map(cleanPack).filter(Boolean);
    } catch {
      return [];
    }
  }

  writePacks(packs) {
    this.storage?.setItem(STORAGE_KEY, JSON.stringify({ version: 1, packs }));
  }

  getPack(id) {
    return this.getPacks().find(pack => pack.id === id) ?? null;
  }

  savePack(pack) {
    const cleaned = cleanPack(pack);
    if (!cleaned) throw new Error('Invalid custom pack');
    const packs = this.getPacks();
    const existing = packs.findIndex(item => item.id === cleaned.id);
    if (existing === -1) packs.push(cleaned);
    else packs[existing] = cleaned; // повторный импорт не меняет заданный порядок
    this.writePacks(packs);
  }

  movePackTo(id, targetId) {
    const packs = this.getPacks();
    const index = packs.findIndex(pack => pack.id === id);
    const target = packs.findIndex(pack => pack.id === targetId);
    if (index === -1 || target === -1 || index === target) return;
    const [pack] = packs.splice(index, 1);
    packs.splice(target, 0, pack);
    this.writePacks(packs);
  }

  deletePack(id) {
    this.writePacks(this.getPacks().filter(pack => pack.id !== id));
  }

  // Импорт копии применяет её порядок к входящим пакам и сохраняет локальные
  // паки, которых в копии нет. Одноимённые паки заменяются.
  importPacks(packList) {
    if (!Array.isArray(packList)) throw new Error('Invalid packs backup');
    const imported = packList.map(cleanPack);
    if (imported.some(pack => pack === null)) throw new Error('Invalid packs backup');
    const ids = new Set(imported.map(pack => pack.id));
    if (ids.size !== imported.length) throw new Error('Duplicate pack in backup');
    const localOnly = this.getPacks().filter(pack => !ids.has(pack.id));
    this.writePacks(imported.concat(localOnly));
    return imported.length;
  }

  async collectPacks(fileList, fallbackId) {
    const groups = new Map();
    for (const file of fileList) {
      const path = normalizePath(file.path);
      const filename = path.split('/').pop() || '';
      if (filename !== 'pack.def' && !filename.endsWith('.gdlvl')) continue;
      const parent = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
      if (!groups.has(parent)) groups.set(parent, { packDef: null, levels: [] });
      const group = groups.get(parent);
      const text = file.text();
      if (filename === 'pack.def') group.packDef = text;
      else group.levels.push({ filename, text });
    }

    const imported = [];
    for (const [parent, group] of groups) {
      if (group.levels.length === 0) continue;
      const directories = parent.split('/').filter(Boolean);
      imported.push({
        id: directories.at(-1) || fallbackId,
        packDef: group.packDef,
        levels: group.levels,
      });
    }
    return imported;
  }

  // Единственный входной формат — ZIP. Каталоги внутри архива соответствуют
  // исходным gd/<pack>; если файлы лежат в корне, id пака берётся из имени ZIP.
  async importFiles(fileList) {
    const imported = [];
    for (const file of Array.from(fileList)) {
      const filename = file.name || '';
      if (!filename.toLowerCase().endsWith('.zip')) {
        throw new Error('Only ZIP custom packs are supported');
      }
      const entries = unzipSync(new Uint8Array(await file.arrayBuffer()));
      const files = [];
      for (const [path, bytes] of Object.entries(entries)) {
        const normalized = normalizePath(decodeZipPath(path));
        if (!normalized || normalized.endsWith('/')) continue;
        files.push({ path: normalized, text: () => decoder.decode(bytes) });
      }
      const fallbackId = filename.replace(/\.zip$/i, '') || 'Custom pack';
      imported.push(...await this.collectPacks(files, fallbackId));
    }
    imported.sort((a, b) => compareNames(a.id, b.id));
    for (const pack of imported) this.savePack(pack);
    return imported;
  }
}

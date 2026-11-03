// Порт se.codebrew.gdtr.d — дефолтная палитра Paint'ов (статический clinit).
// Значения извлечены интерпретацией smali-компоновщика (см. docs/classmap.md).

import { Paint } from './Paint.js';

function mk(argb, style, sw, aa, ts, tsx, shadow) {
  const p = new Paint();
  if (argb) p.setARGB(argb[0], argb[1], argb[2], argb[3]);
  if (style) p.style = style;
  if (sw != null) p.strokeWidth = sw;
  if (aa != null) p.antiAlias = aa;
  if (ts != null) p.textSize = ts;
  if (tsx != null) p.textScaleX = tsx;
  if (shadow) p.setShadowLayer(shadow[0], shadow[1], shadow[2], shadow[3]);
  return p;
}

export const DefaultPaints = {
  // текстовые (крупные баннеры)
  A: mk([255, 255, 255, 255], 'FILL', 6.0, true, 25.0, 1.2000000476837158),
  B: mk([255, 0, 0, 0], 'STROKE', 5.0, true, 25.0, 1.2000000476837158),
  C: mk([255, 255, 255, 255], 'FILL_AND_STROKE', 2.5, true, 25.0, 1.2000000476837158),
  D: mk([255, 0, 0, 0], 'STROKE', 4.5, true, 25.0, 1.2000000476837158, [1.0, 1.0, 1.0, 0x00000000]),
  E: mk([255, 200, 200, 200], 'FILL', null, true),
  F: mk([255, 255, 0, 0], 'STROKE', 3.0, true),
  G: mk([255, 0, 255, 0], 'STROKE', 3.0, true),
  H: mk([255, 0, 255, 0], 'FILL'),
  I: mk([255, 0, 0, 255], 'FILL'),
  J: mk(null, null, 1.0, true),
  K: mk(null, null, 2.0, true),
  L: mk([255, 255, 255, 255], 'FILL'),
  // текст HUD (таймер и пр.)
  a: mk([255, 255, 255, 255], 'FILL_AND_STROKE', 2.5, true, 25.0, 1.2000000476837158),
  b: mk([255, 0, 0, 0], 'STROKE', 4.5, true, 25.0, 1.2000000476837158, [1.0, 1.0, 1.0, 0x00000000]),
  c: mk([255, 255, 255, 255], 'FILL'),
  d: mk([255, 255, 255, 255], 'STROKE', 2.5, true),
  e: mk([255, 255, 255, 255], 'STROKE', 2.0, true),
  f: mk([255, 255, 255, 255], 'STROKE', 1.0, true),
  g: mk([255, 255, 215, 0], 'STROKE', 1.0, true),
  h: mk([255, 200, 200, 200], 'STROKE', 2.0, true),
  i: mk([255, 0, 0, 0], 'STROKE'),
  j: mk([255, 0, 0, 0], 'FILL'),
  k: mk([255, 255, 0, 0], 'STROKE'),
  l: mk([255, 255, 0, 0], 'FILL', null, true),
  m: mk([255, 0, 255, 0], 'STROKE'),
  n: mk([255, 0, 0, 255], 'STROKE'),
  // дефолтная "схема" (используются SchemeManager.resetDefaults)
  o: mk([255, 204, 239, 255], 'FILL'),              // sky
  p: mk([255, 204, 204, 204], 'FILL', null, true),  // mountain
  q: mk([255, 102, 153, 51], 'STROKE', 2.5, true),  // surface
  r: mk(null, 'FILL', 1.0),
  s: mk([255, 153, 102, 51], 'FILL'),               // ground
  t: mk(null, null, 2.0, true),
  u: mk([255, 0, 0, 0], 'STROKE', 2.0, true),       // байк/райдер
  v: mk(null, 'STROKE', null, true),                // флаг (цвет не задан — чёрный дефолт)
  w: mk([255, 255, 255, 255], 'FILL'),
  x: mk([255, 255, 0, 0], 'STROKE', 5.0, true, 25.0, 1.2000000476837158),
  y: mk([255, 0, 255, 0], 'STROKE', 5.0, true, 25.0, 1.2000000476837158),
  z: mk([255, 0, 0, 255], 'STROKE', 5.0, true, 25.0, 1.2000000476837158),
};

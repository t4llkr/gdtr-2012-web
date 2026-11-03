// Порт se.codebrew.gdtr.graphics.c (SchemeManager).
// Статические Paint'ы сцены: a=sky, b=mountain, c=surface, d=ground, e=bike, f=flag.
// Схемы извлечены интерпретацией clinit; формат записи: [r, g, b, fill, strokeWidth]
// (alpha всегда 255; fill=true -> FILL, false -> STROKE; см. c.a(IIIZF)).

import { Paint } from './Paint.js';
import { DefaultPaints } from './DefaultPaints.js';

function mkPaint(r, g, b, fill, w) {
  const p = new Paint();
  p.setARGB(255, r, g, b);
  p.setStyle(fill ? 'FILL' : 'STROKE');
  p.setStrokeWidth(w);
  p.setAntiAlias(true);
  return p;
}

function mkScheme(mountain, ground, flag, sky, surface) {
  return {
    mountain: mkPaint(...mountain),
    ground: mkPaint(...ground),
    flag: mkPaint(...flag),
    sky: mkPaint(...sky),
    surface: mkPaint(...surface),
  };
}

const SCHEMES = {
  'Dustbowl': mkScheme([190, 165, 160, true, 2.0], [171, 69, 64, true, 1.0], [255, 175, 94, false, 1.0], [252, 193, 155, true, 1.0], [251, 125, 77, false, 3.0]),
  'Beach':    mkScheme([190, 165, 160, true, 2.0], [221, 143, 52, true, 1.0], [117, 210, 71, false, 2.0], [161, 203, 230, true, 1.0], [244, 240, 136, false, 3.0]),
  'Green':    mkScheme([159, 224, 182, true, 2.0], [54, 27, 6, true, 1.0], [130, 158, 99, false, 2.0], [219, 237, 197, true, 1.0], [58, 133, 113, false, 3.0]),
  'french':   mkScheme([119, 182, 167, true, 2.0], [42, 39, 61, true, 1.0], [234, 130, 145, false, 2.0], [218, 255, 203, true, 1.0], [209, 98, 98, false, 3.0]),
  'Crisp':    mkScheme([0, 107, 83, true, 2.0], [166, 111, 0, true, 1.0], [0, 164, 128, false, 2.0], [108, 140, 213, true, 1.0], [95, 143, 48, false, 3.0]),
  'Sunny':    mkScheme([95, 61, 48, true, 2.0], [166, 97, 0, true, 1.0], [255, 195, 0, false, 2.0], [255, 222, 115, true, 1.0], [166, 127, 0, false, 3.0]),
};

const SCHEME_NAMES = Object.keys(SCHEMES);

export class SchemeManager {
  // c.b()V — сброс к дефолтам из корневого класса d
  static resetDefaults() {
    SchemeManager.a = DefaultPaints.o; // sky
    SchemeManager.b = DefaultPaints.p; // mountain
    SchemeManager.c = DefaultPaints.q; // surface
    SchemeManager.d = DefaultPaints.s; // ground
    SchemeManager.e = DefaultPaints.u; // байк/райдер (только здесь)
    SchemeManager.f = DefaultPaints.v; // flag
  }

  // c.a(Ljava/lang/String;)V — применить схему по имени; null/неизвестная -> Dustbowl
  static applyScheme(name) {
    SchemeManager.resetDefaults();
    let s = SCHEMES[name];
    if (!s) s = SCHEMES['Dustbowl'];
    SchemeManager.a = s.sky;
    SchemeManager.c = s.surface;
    SchemeManager.d = s.ground;
    SchemeManager.b = s.mountain;
    SchemeManager.f = s.flag;
  }

  // c.a()V — случайная схема (Random.nextInt(h.size()))
  static applyRandom() {
    SchemeManager.applyScheme(SCHEME_NAMES[Math.floor(Math.random() * SCHEME_NAMES.length)]);
  }
}

SchemeManager.resetDefaults();

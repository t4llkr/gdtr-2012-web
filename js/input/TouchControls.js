// Порт se.codebrew.gdtr.b.p/h: четыре сенсорные кнопки, countdown и pinch.

import { InputState } from './InputState.js';
import { PinchZoom } from './PinchZoom.js';
import { CountdownHud } from '../render/CountdownHud.js';
import { Paint, createCornerPath, drawPath } from '../render/Paint.js';

const f = Math.fround;

function multiply(left, right) {
  return {
    a: left.a * right.a + left.c * right.b,
    b: left.b * right.a + left.d * right.b,
    c: left.a * right.c + left.c * right.d,
    d: left.b * right.c + left.d * right.d,
    e: left.a * right.e + left.c * right.f + left.e,
    f: left.b * right.e + left.d * right.f + left.f,
  };
}

function translation(x, y) { return { a: 1, b: 0, c: 0, d: 1, e: x, f: y }; }
function scaling(x, y) { return { a: x, b: 0, c: 0, d: y, e: 0, f: 0 }; }

function createArrow(active, rotation, width, height, scaleX, scaleY) {
  const strokeWidth = f(f((width + height) / 2) / 20.0);
  const corner = f(f((width + height) / 2) / 12.0);
  const inset = f(strokeWidth / 50.0);
  const canvas = document.createElement('canvas');
  canvas.width = Math.trunc(inset) * 2 + width;
  canvas.height = Math.trunc(inset) * 2 + height;

  const radians = rotation * Math.PI / 180;
  let matrix = {
    a: Math.cos(radians), b: Math.sin(radians),
    c: -Math.sin(radians), d: Math.cos(radians), e: 0, f: 0,
  };
  matrix = multiply(translation(25, 0), matrix);
  if (rotation === 90) matrix = multiply(translation(25, 25), matrix);
  else if (rotation === 180) matrix = multiply(translation(0, 50), matrix);
  else if (rotation === 270) matrix = multiply(translation(-25, 25), matrix);
  matrix = multiply(scaling(f(width * scaleX / 50.0), f(height * scaleY / 50.0)), matrix);

  const rawPoints = [
    [0, strokeWidth], [10, strokeWidth], [10, 25], [25, 25], [0, 45],
    [-25, 25], [-10, 25], [-10, strokeWidth], [10, strokeWidth],
  ];
  const points = rawPoints.map(([x, y]) => ({
    x: matrix.a * x + matrix.c * y + matrix.e,
    y: matrix.b * x + matrix.d * y + matrix.f,
  }));
  const path = createCornerPath(points, corner);
  const paint = new Paint();
  paint.setARGB(255, active ? 255 : 0, active ? 255 : 0, active ? 255 : 0);
  paint.setStyle('STROKE');
  paint.setStrokeWidth(strokeWidth);
  paint.setAntiAlias(true);
  paint.setCornerPathEffect(corner);
  drawPath(canvas.getContext('2d'), path, paint);
  return canvas;
}

class TouchButton {
  constructor(active, inactive, center, radius) {
    this.active = active;
    this.inactive = inactive;
    this.x = center.x - Math.trunc(radius / 2);
    this.y = center.y - Math.trunc(radius / 2);
  }

  draw(ctx, pressed) {
    ctx.drawImage(pressed ? this.active : this.inactive, this.x, this.y);
  }
}

export class TouchControls {
  constructor(pinchEnabled = false) {
    this.state = new InputState();
    this.gas = false;
    this.brake = false;
    this.leanLeft = false;
    this.leanRight = false;
    this.engine = null;
    this.countdown = new CountdownHud(null);
    this.width = 0;
    this.height = 0;
    this.centers = [null, null, null, null];
    this.buttons = [];
    this.pointers = new Map();
    this.pinch = pinchEnabled ? new PinchZoom(true) : null;
    this.accelBrakeBottom = false;
  }

  setEngine(engine) {
    this.engine = engine;
    this.countdown.release();
    this.countdown = new CountdownHud(engine);
  }

  setBottom(value) { this.accelBrakeBottom = Boolean(value); }
  resume() {}

  layout(width, height) {
    this.buttons.length = 0;
    let horizontal = Math.trunc(width / 6);
    let vertical = Math.trunc(height / 6);
    if (width < height) {
      horizontal = Math.trunc(height / 6);
      vertical = Math.trunc(width / 6);
    }
    const radius = Math.min(horizontal, vertical);
    const size = radius;
    const xLeft = f(10.0 + f(size / 2.0));
    const yBottom = f(f(height - f(size / 2.0)) - 10.0);
    if (this.accelBrakeBottom) {
      this.centers[0] = { x: xLeft, y: f(yBottom - 1.5 * radius) };
      this.centers[1] = { x: xLeft, y: yBottom };
    } else {
      this.centers[0] = { x: xLeft, y: f(10.0 + 0.5 * size) };
      this.centers[1] = { x: xLeft, y: f(10.0 + 1.5 * radius + 0.5 * size) };
    }
    this.centers[2] = { x: f(width - 0.5 * size - 10.0), y: yBottom };
    this.centers[3] = { x: f(width - 1.5 * radius - 0.5 * size - 10.0), y: yBottom };
    this.radius = radius;

    const active0 = createArrow(true, 0, horizontal, vertical, 0.6000000238418579, 0.800000011920929);
    const active90 = createArrow(true, 90, vertical, horizontal, 0.800000011920929, 0.6000000238418579);
    const active180 = createArrow(true, 180, horizontal, vertical, 0.6000000238418579, 0.800000011920929);
    const active270 = createArrow(true, 270, vertical, horizontal, 0.800000011920929, 0.6000000238418579);
    const inactive0 = createArrow(false, 0, horizontal, vertical, 0.6000000238418579, 0.800000011920929);
    const inactive90 = createArrow(false, 90, vertical, horizontal, 0.800000011920929, 0.6000000238418579);
    const inactive180 = createArrow(false, 180, horizontal, vertical, 0.6000000238418579, 0.800000011920929);
    const inactive270 = createArrow(false, 270, vertical, horizontal, 0.800000011920929, 0.6000000238418579);
    this.buttons[0] = new TouchButton(active180, inactive180, this.centers[0], radius);
    this.buttons[1] = new TouchButton(active0, inactive0, this.centers[1], radius);
    this.buttons[2] = new TouchButton(active270, inactive270, this.centers[2], radius);
    this.buttons[3] = new TouchButton(active90, inactive90, this.centers[3], radius);
  }

  hitTest(x, y) {
    if (this.centers[3] === null) return;
    let selected = -1;
    for (let i = 0; i < 4; i++) {
      const center = this.centers[i];
      const distance = Math.hypot(x - center.x, y - center.y);
      if (distance < this.radius && distance < Number.MAX_VALUE) selected = i;
    }
    if (selected === 0) this.gas = true;
    else if (selected === 1) this.brake = true;
    else if (selected === 2) this.leanRight = true;
    else if (selected === 3) this.leanLeft = true;
  }

  onTouch(view, event) {
    this.gas = this.brake = this.leanLeft = this.leanRight = false;
    if (event) {
      this.updatePointers(event);
      this.pinch?.update(view, this.pointers);
      if (event.action === 0 || event.action === 2 || event.action === 5 || event.action === 6) {
        for (const point of this.pointers.values()) this.hitTest(point.x, point.y);
      }
    }
    this.state.a = this.gas;
    this.state.b = this.brake;
    this.state.c = this.leanLeft;
    this.state.d = this.leanRight;
    return true;
  }

  updatePointers(event) {
    if (event.action === 0 || event.action === 5) {
      this.pointers.set(event.pointerId, { x: event.x, y: event.y });
    } else if (event.action === 2) {
      if (this.pointers.has(event.pointerId)) {
        this.pointers.set(event.pointerId, { x: event.x, y: event.y });
      }
    } else if (event.action === 1 || event.action === 6) {
      this.pointers.delete(event.pointerId);
    } else if (event.action === 3) {
      this.pointers.clear();
    }
  }

  poll(state) {
    if (this.engine !== null && this.engine.getFrame() < 90) {
      state.a = false;
      state.b = true;
      state.c = false;
      state.d = false;
      return;
    }
    state.a = this.state.a;
    state.b = this.state.b;
    state.c = this.state.c;
    state.d = this.state.d;
  }

  draw(ctx, width, height) {
    if (width <= 0 || height <= 0) return;
    if (this.width !== width || this.height !== height) {
      this.width = width;
      this.height = height;
      this.layout(width, height);
    }
    this.buttons[0].draw(ctx, this.state.a);
    this.buttons[1].draw(ctx, this.state.b);
    this.buttons[3].draw(ctx, this.state.c);
    this.buttons[2].draw(ctx, this.state.d);
    this.countdown.draw(ctx, width, height);
  }

  release() {
    this.buttons.length = 0;
    this.pointers.clear();
    this.countdown.release();
    this.engine = null;
  }
}
